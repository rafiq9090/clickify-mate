import httpx
import io
import os
import tempfile
from app.config import settings

# Try loading optional local whisper dependencies
try:
    import whisper
    LOCAL_WHISPER_AVAILABLE = True
except ImportError:
    LOCAL_WHISPER_AVAILABLE = False

# Try loading free Google Text-to-Speech
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

# Try loading groq SDK
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


class AIService:
    def __init__(self):
        self.groq_client = None
        if GROQ_AVAILABLE and settings.GROQ_API_KEY:
            self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        
        self.openai_headers = {}
        if settings.OPENAI_API_KEY:
            self.openai_headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}

    async def transcribe_audio(self, audio_file_bytes: bytes, filename: str = "voice.wav") -> str:
        """
        Transcribe voice notes. Attempts Groq (free), local whisper (free), then OpenAI (paid).
        """
        # 1. Try free Groq Whisper API
        if self.groq_client:
            try:
                # Need to write to a temporary file because SDK uploads files
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    temp_file.write(audio_file_bytes)
                    temp_path = temp_file.name
                
                with open(temp_path, "rb") as file_obj:
                    transcription = self.groq_client.audio.transcriptions.create(
                        file=(filename, file_obj.read()),
                        model="whisper-large-v3",
                    )
                os.unlink(temp_path)
                return transcription.text
            except Exception as e:
                print(f"Groq Whisper transcription failed: {e}")

        # 2. Try Local CPU Whisper Model (completely free, no internet required)
        if LOCAL_WHISPER_AVAILABLE:
            try:
                model = whisper.load_model("base")
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    temp_file.write(audio_file_bytes)
                    temp_path = temp_file.name
                
                result = model.transcribe(temp_path)
                os.unlink(temp_path)
                return result.get("text", "")
            except Exception as e:
                print(f"Local Whisper model transcription failed: {e}")

        # 3. Fallback to OpenAI Whisper API (Paid)
        if settings.OPENAI_API_KEY:
            async with httpx.AsyncClient() as client:
                files = {"file": (filename, audio_file_bytes, "audio/wav")}
                data = {"model": "whisper-1"}
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers=self.openai_headers,
                    files=files,
                    data=data,
                    timeout=30.0
                )
                if response.status_code == 200:
                    return response.json().get("text", "")
                print(f"OpenAI Whisper fallback failed: {response.text}")
        
        return "Audio transcription unavailable."

    async def speak_text(self, text: str) -> bytes:
        """
        Convert text response to speech. Attempts ElevenLabs/OpenAI (paid), then gTTS (free).
        """
        # 1. Try ElevenLabs
        if settings.ELEVENLABS_API_KEY:
            headers = {
                "xi-api-key": settings.ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
            }
            voice_id = "pNInz6obpgq5HexuJ74R" 
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                if response.status_code == 200:
                    return response.content
                print(f"ElevenLabs TTS failed: {response.text}")

        # 2. Try OpenAI TTS (Paid)
        if settings.OPENAI_API_KEY:
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": "tts-1",
                    "input": text,
                    "voice": "alloy"
                }
                response = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={**self.openai_headers, "Content-Type": "application/json"},
                    json=payload,
                    timeout=30.0
                )
                if response.status_code == 200:
                    return response.content
                print(f"OpenAI TTS failed: {response.text}")

        # 3. Fallback to free Google TTS (No key required)
        if GTTS_AVAILABLE:
            try:
                tts = gTTS(text=text, lang="en")
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                return fp.getvalue()
            except Exception as e:
                print(f"gTTS free generation failed: {e}")

        return b""

    async def run_moderation(self, text: str) -> bool:
        """
        Verify if the message violates safety terms. Attempts Groq Llama Moderation (free), then OpenAI Moderation.
        """
        # 1. Try Groq Llama 3 Moderation (free)
        if self.groq_client:
            try:
                response = self.groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a content moderator. Classify the user input. "
                                "Reply only with the word 'FLAGGED' if it contains explicit hate speech, "
                                "harassment, severe violence, or explicit adult (18+) content. "
                                "Otherwise, reply only with the word 'SAFE'."
                            )
                        },
                        {
                            "role": "user",
                            "content": text
                        }
                    ],
                    model="llama3-8b-8192",
                    temperature=0.0
                )
                verdict = response.choices[0].message.content.strip().upper()
                return "FLAGGED" in verdict
            except Exception as e:
                print(f"Groq Llama moderation failed: {e}")

        # 2. Fallback to OpenAI Moderation (Paid)
        if settings.OPENAI_API_KEY:
            async with httpx.AsyncClient() as client:
                payload = {"input": text}
                response = await client.post(
                    "https://api.openai.com/v1/moderations",
                    headers={**self.openai_headers, "Content-Type": "application/json"},
                    json=payload,
                    timeout=10.0
                )
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    if results:
                        return results[0].get("flagged", False)
        
        return False

    async def analyze_image(self, image_url: str, prompt: str) -> str:
        """
        Analyze receipt/product photos. Attempts Groq Llava Vision (free), then OpenAI GPT-4o.
        """
        # 1. Try free Groq Llava Vision Model
        if self.groq_client:
            try:
                response = self.groq_client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": image_url}
                                }
                            ]
                        }
                    ],
                    model="meta-llama/llama-4-scout-17b-16e-instruct",
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"Groq vision analysis failed: {e}")

        # 2. Fallback to OpenAI GPT-4o (Paid)
        if settings.OPENAI_API_KEY:
            async with httpx.AsyncClient() as client:
                payload = {
                    "model": "gpt-4o",
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": image_url}
                                }
                            ]
                        }
                    ],
                    "max_tokens": 300
                }
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={**self.openai_headers, "Content-Type": "application/json"},
                    json=payload,
                    timeout=30.0
                )
                if response.status_code == 200:
                    choices = response.json().get("choices", [])
                    if choices:
                        return choices[0]["message"]["content"]
        
        return "Vision analysis unavailable."


ai_service = AIService()
