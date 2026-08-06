import httpx
from app.config import settings

class SteadfastService:
    def __init__(self):
        self.base_url = "https://portal.packzy.com/api/v1"
        # Baseline headers configuration
        self.headers = {
            "Api-Key": settings.STEADFAST_API_KEY or "",
            "Secret-Key": settings.STEADFAST_SECRET_KEY or settings.STEADFAST_SENDER_ID or "",
            "Content-Type": "application/json"
        }

    async def create_order(self, order_data: dict, api_key: str = None, secret_key: str = None) -> dict:
        """
        Book a parcel shipment on Steadfast Courier portal.
        """
        url = f"{self.base_url}/create_order"
        
        # Fixed: Changed "note" to "notes" to match what Steadfast's API strictly expects
        payload = {
            "invoice": order_data.get("invoice_id"),
            "recipient_name": order_data.get("name"),
            "recipient_phone": order_data.get("phone"),
            "recipient_address": order_data.get("address"),
            "cod_amount": order_data.get("cod_amount", 0),
            "notes": order_data.get("note", "Delivery processed by AI Agent")
        }

        # Dynamically switch keys depending on arguments or global configurations
        active_api_key = api_key or settings.STEADFAST_API_KEY
        active_secret_key = secret_key or settings.STEADFAST_SECRET_KEY or settings.STEADFAST_SENDER_ID

        if not active_api_key or not active_secret_key:
            # Safe mock mode execution route if configuration parameters aren't supplied
            return {
                "success": True,
                "tracking_code": f"SF-MOCK-{order_data.get('invoice_id')}",
                "status": "delivered_to_courier"
            }

        headers = {
            "Api-Key": active_api_key.strip(),
            "Secret-Key": active_secret_key.strip(),
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=15.0)
                print(f"[DEBUG] Steadfast API Response status={response.status_code} body={response.text}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Fixed: Account for responses that return "success" status keys alongside numeric codes
                    if data.get("status") == 200 or data.get("status") == "success":
                        # Fixed: Fallback onto 'consignment' if nested data shifts names
                        order_info = data.get("consignment") or data.get("order") or {}
                        return {
                            "success": True,
                            "tracking_code": order_info.get("tracking_code"),
                            "status": order_info.get("status")
                        }
                    return {"success": False, "error": data.get("message", "Unknown validation error")}
                return {"success": False, "error": f"HTTP status {response.status_code} - {response.text}"}

            except Exception as e:
                print(f"Steadfast API Create Order Error: {e}")
                return {"success": False, "error": str(e)}

    async def check_status(self, tracking_code: str, api_key: str = None, secret_key: str = None) -> dict:
        """
        Track a parcel's delivery status.
        """
        url = f"{self.base_url}/status_by_trackingcode/{tracking_code}"
        
        active_api_key = api_key or settings.STEADFAST_API_KEY
        active_secret_key = secret_key or settings.STEADFAST_SECRET_KEY or settings.STEADFAST_SENDER_ID

        if not active_api_key:
            return {"status": "in_transit", "success": True}

        # Fixed: Construct headers dynamically right inside the check loop 
        # to ensure that custom tenant keys aren't dropped in favor of self.headers snapshot
        headers = {
            "Api-Key": active_api_key.strip(),
            "Secret-Key": active_secret_key.strip(),
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == 200:
                        return {
                            "success": True,
                            "tracking_code": tracking_code,
                            "delivery_status": data.get("delivery_status")
                        }
                    return {"success": False, "error": data.get("message")}
                return {"success": False, "error": f"HTTP status {response.status_code}"}
            except Exception as e:
                print(f"Steadfast API Track Error: {e}")
                return {"success": False, "error": str(e)}

# Export instantiated global service instance
steadfast_service = SteadfastService()