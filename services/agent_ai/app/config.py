from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: Optional[str] = "postgresql://postgres:postgrespassword@localhost:5432/clickify_mate"
    IMAGE_VERIFIER_URL: Optional[str] = "localhost:5002"

    # Supabase (Legacy)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # AI Keys
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None

    # Steadfast Courier
    STEADFAST_API_KEY: Optional[str] = None
    STEADFAST_SENDER_ID: Optional[str] = None
    STEADFAST_SECRET_KEY: Optional[str] = None

    # Telephony
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    # Social Hooks
    WHATSAPP_VERIFY_TOKEN: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    # Payment Gateway
    SSLCOMMERZ_STORE_ID: Optional[str] = None
    SSLCOMMERZ_STORE_PASSWORD: Optional[str] = None
    SSLCOMMERZ_IS_SANDBOX: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
