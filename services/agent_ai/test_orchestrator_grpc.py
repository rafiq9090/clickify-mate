import asyncio
import grpc
import sys
from pathlib import Path

# Add paths for grpc import resolution
current_dir = Path(__file__).resolve().parent / "app" / "grpc_stubs"
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

import proto.orchestrator_pb2 as pb
import proto.orchestrator_pb2_grpc as pb_grpc

async def main():
    target = "orchestrator:5003"
    print(f"Connecting to Orchestrator gRPC at {target}...")
    
    async with grpc.aio.insecure_channel(target) as channel:
        stub = pb_grpc.AgentOrchestratorStub(channel)
        
        # 1. Test CheckStock
        print("\n1. Testing CheckStock for SKU: PRO-AI-01...")
        req_stock = pb.StockRequest(sku="PRO-AI-01")
        resp_stock = await stub.CheckStock(req_stock)
        print(f"Stock Response: exists={resp_stock.exists}, name='{resp_stock.name}', stock={resp_stock.stock}, price={resp_stock.price}")
        
        # 2. Test CheckStock for non-existent SKU
        print("\n2. Testing CheckStock for non-existent SKU...")
        req_stock_fail = pb.StockRequest(sku="INVALID-SKU")
        resp_stock_fail = await stub.CheckStock(req_stock_fail)
        print(f"Stock Response: exists={resp_stock_fail.exists}")

        # 3. Test ProcessEvent
        print("\n3. Testing ProcessEvent (queuing WhatsApp message)...")
        req_event = pb.EventRequest(
            event_id="evt_grpc_9999",
            platform="whatsapp",
            agent_id="agent_primary",
            sender_id="8801712345678",
            content="Hello from gRPC test!",
            message_type="text"
        )
        resp_event = await stub.ProcessEvent(req_event)
        print(f"Event Response: success={resp_event.success}, reply_text='{resp_event.reply_text}', error_message='{resp_event.error_message}'")

if __name__ == "__main__":
    asyncio.run(main())
