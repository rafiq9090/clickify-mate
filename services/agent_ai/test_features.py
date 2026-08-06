# ai-reply-backend/test_features.py
import asyncio
import os
from dotenv import load_dotenv

# Load env variables from .env
load_dotenv()

from app.services.ai import ai_service

async def test_all():
    print("==========================================")
    print("Testing Backend AI Service Locally")
    print("==========================================")
    
    # 1. Test Image Vision Recognition
    print("\n--- 1. Testing Image Vision Feature ---")
    sample_image_url = "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=200"
    prompt = "Describe what you see in this image in 5 words or less."
    print(f"Sending Image URL: {sample_image_url}")
    print(f"Prompt: {prompt}")
    
    try:
        image_response = await ai_service.analyze_image(sample_image_url, prompt)
        print(f"Vision Response: {image_response}")
    except Exception as e:
        print(f"Vision Feature Failed: {e}")

    # 2. Test Audio Transcription (Whisper)
    print("\n--- 2. Testing Audio Transcription Feature ---")
    # Generate 1 second of silence in WAV format using pydub
    from pydub import AudioSegment
    import io
    
    sound = AudioSegment.silent(duration=1000)
    fp = io.BytesIO()
    sound.export(fp, format="wav")
    wav_bytes = fp.getvalue()
    
    print("Sending silent wav bytes to transcriber...")
    try:
        transcription = await ai_service.transcribe_audio(wav_bytes)
        print(f"Transcription Response: {transcription}")
    except Exception as e:
        print(f"Transcription Feature Failed: {e}")
        
    print("\n==========================================")

if __name__ == "__main__":
    asyncio.run(test_all())
