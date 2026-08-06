import asyncio
from app.services.image_verifier import image_verifier_service

async def main():
    print("Testing gRPC connection to Rust Image Verifier...")
    # Base64 for 1x1 black PNG
    mock_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    
    result = await image_verifier_service.verify_receipt(
        event_id="test_evt_1001",
        image_base64=mock_base64,
        expected_amount=250.0
    )
    print("Result:")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
