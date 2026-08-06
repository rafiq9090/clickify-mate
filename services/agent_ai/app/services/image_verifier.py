import grpc
from app.config import settings
import app.grpc_stubs.proto.verifier_pb2 as verifier_pb2
import app.grpc_stubs.proto.verifier_pb2_grpc as verifier_pb2_grpc

class ImageVerifierService:
    def __init__(self):
        self.target = settings.IMAGE_VERIFIER_URL or "localhost:5002"

    async def verify_receipt(self, event_id: str, image_base64: str, expected_amount: float) -> dict:
        """
        Verify payment receipt image by sending base64 bytes to the Rust gRPC ImageVerifier service.
        """
        # Ensure base64 prefix is stripped if present
        if image_base64.startswith("data:image/"):
            parts = image_base64.split(",", 1)
            if len(parts) > 1:
                image_base64 = parts[1]

        try:
            # Connect to gRPC channel using asynchronous gRPC call
            async with grpc.aio.insecure_channel(self.target) as channel:
                stub = verifier_pb2_grpc.ImageVerifierStub(channel)
                
                request = verifier_pb2.VerifyRequest(
                    event_id=event_id,
                    image_base64=image_base64,
                    expected_amount=expected_amount
                )
                
                print(f"[gRPC Client] Sending verification request for event_id={event_id} to {self.target}")
                response = await stub.VerifyReceipt(request, timeout=10.0)
                
                return {
                    "is_valid": response.is_valid,
                    "transaction_id": response.transaction_id,
                    "amount_detected": response.amount_detected,
                    "hash_signature": response.hash_signature,
                    "error_message": response.error_message or None,
                    "success": True
                }
        except grpc.RpcError as e:
            print(f"[gRPC Client Error] failed to verify receipt: code={e.code()} details={e.details()}")
            return {
                "is_valid": False,
                "transaction_id": "",
                "amount_detected": 0.0,
                "hash_signature": "",
                "error_message": f"gRPC connection error: {e.code()} - {e.details()}",
                "success": False
            }
        except Exception as e:
            print(f"[gRPC Client Error] unexpected error: {e}")
            return {
                "is_valid": False,
                "transaction_id": "",
                "amount_detected": 0.0,
                "hash_signature": "",
                "error_message": f"Unexpected client error: {str(e)}",
                "success": False
            }

image_verifier_service = ImageVerifierService()
