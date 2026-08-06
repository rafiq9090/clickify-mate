import httpx
from app.config import settings

class TelephonyService:
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.twilio_phone = settings.TWILIO_PHONE_NUMBER
        self.base_url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}"

    async def make_confirmation_call(self, customer_phone: str, customer_name: str, order_details: str) -> bool:
        """
        Trigger an automated confirmation voice call to the customer.
        Uses Twilio's Programmable Voice to dial and speak order details via TwiML.
        """
        if not all([self.account_sid, self.auth_token, self.twilio_phone]):
            print("Twilio credentials not configured. Skipping confirmation call.")
            return False

        # TwiML payload to dictate the message to the customer
        twiml_instruction = f"""
        <Response>
            <Say voice="alice">Hello {customer_name}. We received your payment. Your order for {order_details} is confirmed. It will be delivered soon. Thank you!</Say>
        </Response>
        """

        url = f"{self.base_url}/Calls.json"
        data = {
            "To": customer_phone,
            "From": self.twilio_phone,
            "Twiml": twiml_instruction
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url,
                    auth=(self.account_sid, self.auth_token),
                    data=data,
                    timeout=15.0
                )
                if response.status_code in [200, 201]:
                    print(f"Twilio confirmation call triggered successfully to {customer_phone}")
                    return True
                print(f"Twilio call failed: {response.text}")
                return False
            except Exception as e:
                print(f"Telephony service error: {e}")
                return False

telephony_service = TelephonyService()
