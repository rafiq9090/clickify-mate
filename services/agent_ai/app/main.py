from fastapi import FastAPI, Request, Response, status, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from app.config import settings
from app.services.supabase_db import supabase_service
from app.services.ai import ai_service
from app.services.audio_handler import audio_handler
from app.services.steadfast import steadfast_service
from app.services.telephony import telephony_service
from app.services.image_verifier import image_verifier_service
import httpx
import os
import secrets

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AIReplyAgent Microservice Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def require_legacy_mutation_access(request: Request):
    """The Python mutation handlers are retained only for controlled migration tests."""
    if os.getenv("ENABLE_LEGACY_MUTATIONS", "false").lower() != "true":
        raise HTTPException(status_code=410, detail="Legacy mutation endpoint is disabled")
    expected = os.getenv("INTERNAL_SERVICE_TOKEN", "")
    provided = request.headers.get("x-internal-service-token", "")
    if not expected or not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Unauthorized internal service request")

@app.get("/api/status")
def health_check():
    return {"status": "operational", "vps_mode": True, "ffmpeg_ready": True}

@app.get("/webhook/whatsapp")
def verify_whatsapp_webhook(request: Request):
    """
    Handle Meta's WhatsApp Webhook verification handshake.
    """
    params = request.query_params
    verify_token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    
    if verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")
    return Response(content="Verification failed", status_code=status.HTTP_403_FORBIDDEN)

async def process_incoming_whatsapp_message(event_data: dict):
    """
    Background worker to process incoming message updates from WhatsApp.
    """
    try:
        entry = event_data.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        
        if not messages:
            return

        message = messages[0]
        contact = value.get("contacts", [])[0]
        
        customer_phone = contact.get("wa_id")
        customer_name = contact.get("profile", {}).get("name", "Customer")
        message_type = message.get("type")
        
        text_content = ""
        media_id = None
        
        # 1. Capture and Process Voice Notes
        if message_type == "audio":
            media_id = message.get("audio", {}).get("id")
            # In a real environment: Download the media from Meta Graph API using WHATSAPP_TOKEN
            # audio_bytes = download_meta_media(media_id)
            # For research simulation: we mock the file download
            mock_audio = b"\x00" * 1000 # Mock audio stream
            wav_bytes = audio_handler.transcode_to_wav(mock_audio, "ogg")
            text_content = await ai_service.transcribe_audio(wav_bytes)
            
        # 2. Capture and Process Image Recognition (e.g. receipts / screenshots)
        elif message_type == "image":
            media_id = message.get("image", {}).get("id")
            # In real environment: download using Meta Media API
            mock_image_url = "https://example.com/receipt-placeholder.jpg"
            prompt = "Determine if this image is a payment receipt. Extract Transaction ID, sending number, and payment amount."
            text_content = await ai_service.analyze_image(mock_image_url, prompt)
            
            # Integrate gRPC Image Verifier (Rust backend) for screenshot validation
            mock_base64_receipt = "iVBORw0KGgoAAAANS"
            verification = await image_verifier_service.verify_receipt(
                event_id=message.get("id", "evt_mock_123"),
                image_base64=mock_base64_receipt,
                expected_amount=150.0
            )
            print(f"[DEBUG] gRPC Receipt Verification: {verification}")
            if verification.get("success") and verification.get("is_valid"):
                text_content += f"\n[Receipt Verified: VALID. TxID: {verification.get('transaction_id')}, Amount: {verification.get('amount_detected')} BDT]"
            else:
                text_content += f"\n[Receipt Verification Failed: {verification.get('error_message') or 'Verification returned invalid status'}]"
            
        # 3. Handle Standard Text Messages
        elif message_type == "text":
            text_content = message.get("text", {}).get("body", "")

        if not text_content:
            return

        # 4. Hate Speech & Safety Guard Check
        is_abusive = await ai_service.run_moderation(text_content)
        if is_abusive:
            # Drop the communication or warn the user
            await send_whatsapp_reply(customer_phone, "System Alert: Inappropriate language detected. Conversation closed.")
            return

        # 5. Geolocation & Advance Payment Validation Logic
        is_outside_dhaka = any(kw in text_content.lower() for kw in ["chittagong", "sylhet", "rajshahi", "khulna", "barisal", "rangpur", "outside dhaka"])
        is_repeat = supabase_service.is_repeat_customer(customer_phone)

        # Business Rule Logic:
        # If outside Dhaka AND NOT a repeat/old customer, require advance payment (e.g. 150 BDT delivery charge).
        requires_advance = is_outside_dhaka and not is_repeat
        
        # 6. Inventory Check during checkout
        sku_candidate = "PRO-AI-01" # Extracted SKU from context
        inventory_status = supabase_service.check_inventory(sku_candidate)
        
        # 7. Formulate AI Voice/Text Response
        ai_reply_text = ""
        if requires_advance:
            ai_reply_text = f"Hello {customer_name}. Since your shipping address is outside Dhaka and you are a new customer, we require a BDT 150 advance delivery charge confirmation. Please pay via this link: https://pay.aireply.agent/checkout?wa={customer_phone}"
        elif inventory_status.get("exists") and inventory_status.get("stock", 0) <= 0:
            ai_reply_text = f"Sorry {customer_name}, the item {inventory_status.get('name')} is currently out of stock."
        else:
            ai_reply_text = f"Great news {customer_name}! Your product is in stock. We are confirming your order. You will receive a call shortly."
            # Automatically insert order details to DB
            supabase_service.create_lead_order(
                {"name": customer_name, "phone": customer_phone, "address": "Direct Checkout", "city": "Dhaka"},
                {"sku": sku_candidate, "price": inventory_status.get("price", 1200.0), "requires_advance": False}
            )

        # Send Reply (either Voice or Text)
        # For voice replies, we convert the text using speak_text
        if message_type == "audio":
            voice_response_bytes = await ai_service.speak_text(ai_reply_text)
            # In real environment: Upload voice_response_bytes to hosting and send media URL back to Meta API
            await send_whatsapp_reply(customer_phone, f"Voice response dispatched: {ai_reply_text}")
        else:
            await send_whatsapp_reply(customer_phone, ai_reply_text)

    except Exception as e:
        print(f"Error processing WhatsApp message thread: {e}")

@app.post("/webhook/whatsapp")
async def receive_whatsapp_event(request: Request, background_tasks: BackgroundTasks):
    """
    Accept webhook notifications from Meta.
    """
    require_legacy_mutation_access(request)
    body = await request.json()
    background_tasks.add_task(process_incoming_whatsapp_message, body)
    return {"status": "queued"}

@app.post("/webhook/payment")
async def receive_payment_webhook(request: Request):
    """
    Listens for payment confirmations (e.g. bKash / SSLCommerz).
    Auto-triggers Steadfast Courier shipment and place an automated validation phone call.
    """
    require_legacy_mutation_access(request)
    body = await request.json()
    transaction_status = body.get("status")
    customer_phone = body.get("phone")
    customer_name = body.get("name", "Valued Customer")
    lead_id = body.get("lead_id")
    order_amount = body.get("amount")

    if transaction_status == "VALID" or transaction_status == "success":
        # 1. Update database status to Paid
        supabase_service.update_lead_status(lead_id, "paid_confirmed")

        # 2. Book shipping label using Steadfast Courier
        shipment_data = {
            "invoice_id": f"INV-{lead_id}",
            "name": customer_name,
            "phone": customer_phone,
            "address": body.get("address", "Courier collection point"),
            "cod_amount": 0 # Fully paid in advance
        }
        courier_response = await steadfast_service.create_order(shipment_data)
        
        if courier_response.get("success"):
            tracking_code = courier_response.get("tracking_code")
            # Log tracking code in Supabase
            supabase_service.update_lead_status(lead_id, "shipped", tracking_code)

            # 3. Trigger phone call validation
            await telephony_service.make_confirmation_call(
                customer_phone=customer_phone,
                customer_name=customer_name,
                order_details=f"Order BDT {order_amount}"
            )
            return {"status": "processed", "tracking": tracking_code}
        
        return {"status": "paid_but_courier_failed", "error": courier_response.get("error")}

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"status": "invalid_payment"})
from pydantic import BaseModel
import re

class SendToSteadfastRequest(BaseModel):
    lead_ids: list[str]
    api_key: str = None
    secret_key: str = None

def parse_lead_order(lead_data: dict):
    order_str = lead_data.get("order", "")
    name, phone, address = "", "", ""
    cod_amount = 0
    
    if "|" in order_str:
        parts = order_str.split("|")
        for part in parts:
            if ":" in part:
                key, val = part.split(":", 1)
                key = key.strip().lower()
                val = val.strip()
                if key == "name":
                    name = val
                elif key == "phone":
                    phone = val
                elif key == "address":
                    address = val
                elif key in ["total", "price"]:
                    digits = "".join(c for c in val if c.isdigit())
                    if digits:
                        cod_amount = int(digits)
    
    # Try regex matching for phone if still empty
    if not phone:
        match_phone = re.search(r'(?:01[3-9]\d{8})', order_str)
        if match_phone:
            phone = match_phone.group(0)
            
    # Fallback to direct lead root data keys
    if not name:
        name = lead_data.get("customer", "") or "Valued Customer"
    if not phone:
        phone = lead_data.get("phone", "") or "01700000000"
    if not address:
        address = lead_data.get("address", "") or "Dhaka"
        
    return {
        "name": name,
        "phone": phone,
        "address": address,
        "cod_amount": cod_amount
    }

@app.post("/api/steadfast/send-orders")
async def send_orders_to_steadfast(request: SendToSteadfastRequest, http_request: Request):
    require_legacy_mutation_access(http_request)
    results = []
    for lead_id in request.lead_ids:
        try:
            # 1. Fetch Lead
            lead = supabase_service.get_lead_by_id(lead_id)
            if not lead:
                results.append({"lead_id": lead_id, "success": False, "error": "Lead not found"})
                continue
                
            lead_data = lead.get("data", {}) or {}
            parsed = parse_lead_order(lead_data)
            
            # 2. Resolve credentials
            api_key = request.api_key
            secret_key = request.secret_key
            
            if not api_key or not secret_key:
                agent_id = lead_data.get("agent_id")
                if agent_id:
                    behavior = supabase_service.get_agent_behavior_by_id(agent_id)
                    if behavior:
                        if not api_key:
                            api_key = behavior.get("steadfast_api_key")
                        if not secret_key:
                            secret_key = behavior.get("steadfast_secret_key") or behavior.get("steadfast_sender_id")
            
            # 3. Book Shipping
            invoice_val = lead.get("short_id") or lead_id[:8]
            shipment_data = {
                "invoice_id": f"INV-{invoice_val}",
                "name": parsed["name"],
                "phone": parsed["phone"],
                "address": parsed["address"],
                "cod_amount": parsed["cod_amount"]
            }
            
            # Diagnostic logs
            masked_api = f"{api_key[:4]}...{api_key[-4:]}" if api_key and len(api_key) > 8 else str(api_key)
            masked_secret = f"{secret_key[:4]}...{secret_key[-4:]}" if secret_key and len(secret_key) > 8 else str(secret_key)
            print(f"[DEBUG] Steadfast Booking for Lead {lead_id}: API-Key={masked_api}, Secret-Key={masked_secret}")
            
            courier_res = await steadfast_service.create_order(shipment_data, api_key=api_key, secret_key=secret_key)

            
            if courier_res.get("success"):
                tracking_code = courier_res.get("tracking_code")
                # Update status
                lead_data["tracking_code"] = tracking_code
                lead_data["delivery_status"] = courier_res.get("status") or "delivered_to_courier"
                
                # Update in DB
                supabase_service.update_lead_data(lead_id, lead_data)
                
                results.append({
                    "lead_id": lead_id,
                    "success": True,
                    "tracking_code": tracking_code,
                    "status": lead_data["delivery_status"]
                })
            else:
                results.append({
                    "lead_id": lead_id,
                    "success": False,
                    "error": courier_res.get("error", "Steadfast Courier API Error")
                })
        except Exception as e:
            results.append({"lead_id": lead_id, "success": False, "error": str(e)})
            
    return {"results": results}

async def send_whatsapp_reply(to_number: str, message_text: str):
    """
    Helper function to dispatch outgoing message via Meta API.
    """
    print(f"OUTBOX TO {to_number}: {message_text}")
    # Real implementation: post to Graph API endpoint https://graph.facebook.com/v19.0/messages
    return True
