import psycopg2
from psycopg2.extras import RealDictCursor
import json
from app.config import settings

class SupabaseService:
    def __init__(self):
        self.db_url = settings.DATABASE_URL

    def _get_conn(self):
        # Establish connection to PostgreSQL database
        return psycopg2.connect(self.db_url)

    def check_inventory(self, product_sku: str) -> dict:
        """
        Check stock level of a product SKU from local PostgreSQL database.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM public.inventory WHERE sku = %s", (product_sku,))
                    row = cur.fetchone()
                    if row:
                        return {
                            "exists": True,
                            "sku": row.get("sku"),
                            "name": row.get("name"),
                            "stock": row.get("stock", 0),
                            "price": float(row.get("price", 0.0)) if row.get("price") is not None else 0.0
                        }
            return {"exists": False, "stock": 0}
        except Exception as e:
            print(f"Local inventory check error: {e}")
            return {"exists": False, "error": str(e)}

    def is_repeat_customer(self, phone: str) -> bool:
        """
        Verify if customer is a trusted repeat buyer by checking lead records in local PostgreSQL.
        """
        try:
            email_pattern = f"%{phone}%"
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id FROM public.leads WHERE email LIKE %s OR data->>'phone' = %s OR data->>'customer' = %s",
                        (email_pattern, phone, phone)
                    )
                    rows = cur.fetchall()
                    return len(rows) > 0
        except Exception as e:
            print(f"Local check customer history error: {e}")
            return False

    def create_lead_order(self, customer_info: dict, order_info: dict) -> dict:
        """
        Write order data to the local PostgreSQL leads table.
        """
        try:
            phone = customer_info.get("phone", "")
            email_val = f"{phone}@whatsapp.com" if phone else "customer@whatsapp.com"
            
            # Match the JSONB format stored by Nuxt webhooks
            lead_data = {
                "name": customer_info.get("name"),
                "phone": phone,
                "address": customer_info.get("address"),
                "city": customer_info.get("city"),
                "product_sku": order_info.get("sku"),
                "quantity": order_info.get("quantity", 1),
                "total_price": float(order_info.get("price")) if order_info.get("price") is not None else 0.0,
                "status": "pending_payment" if order_info.get("requires_advance") else "pending_confirmation"
            }
            
            with self._get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "INSERT INTO public.leads (email, source, data) VALUES (%s, %s, %s) RETURNING *",
                        (email_val, "ai_agent", json.dumps(lead_data))
                    )
                    row = cur.fetchone()
                    if row:
                        return {"success": True, "lead": dict(row)}
            return {"success": False, "error": "Insert failed"}
        except Exception as e:
            print(f"Local insert lead error: {e}")
            return {"success": False, "error": str(e)}

    def update_lead_status(self, lead_id: str, new_status: str, tracking_code: str = None) -> bool:
        """
        Update the status of a lead/order in local PostgreSQL.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT data FROM public.leads WHERE id = %s", (lead_id,))
                    row = cur.fetchone()
                    if not row:
                        return False
                    
                    lead_data = row.get("data") or {}
                    lead_data["status"] = new_status
                    if tracking_code:
                        lead_data["tracking_code"] = tracking_code
                        
                    cur.execute(
                        "UPDATE public.leads SET data = %s WHERE id = %s",
                        (json.dumps(lead_data), lead_id)
                    )
            return True
        except Exception as e:
            print(f"Local update lead status error: {e}")
            return False

    def get_lead_by_id(self, lead_id: str) -> dict:
        """
        Fetch a lead by its unique database ID.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT * FROM public.leads WHERE id = %s", (lead_id,))
                    row = cur.fetchone()
                    if row:
                        return dict(row)
            return None
        except Exception as e:
            print(f"Local get lead error: {e}")
            return None

    def get_agent_behavior_by_id(self, agent_id: str) -> dict:
        """
        Fetch the agent_behavior configuration by Agent ID.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT agent_behavior FROM public.agent_configs WHERE id = %s", (agent_id,))
                    row = cur.fetchone()
                    if row:
                        return row.get("agent_behavior") or {}
            return {}
        except Exception as e:
            print(f"Local get agent behavior error: {e}")
            return {}

    def update_lead_data(self, lead_id: str, lead_data: dict) -> bool:
        """
        Overwrites the JSONB data object for a lead.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE public.leads SET data = %s WHERE id = %s",
                        (json.dumps(lead_data), lead_id)
                    )
            return True
        except Exception as e:
            print(f"Local update lead data error: {e}")
            return False

supabase_service = SupabaseService()
