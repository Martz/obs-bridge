#!/usr/bin/env python3
"""
Simple OBS WebSocket test to verify OBS is responding correctly
"""

import asyncio
import json
import websockets

async def test_obs():
    uri = "ws://localhost:4455"

    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as websocket:
            print("✓ Connected!")

            # Receive Hello message
            hello = await websocket.recv()
            print(f"\n📨 Received from OBS:")
            print(hello[:500])

            hello_data = json.loads(hello)
            print(f"\n✓ Message type: op={hello_data.get('op')}")

            if hello_data.get('op') == 0:
                print("✓ Received Hello message (op code 0)")

                # Check if authentication is required
                d = hello_data.get('d', {})
                if 'authentication' in d:
                    print("⚠️  Authentication IS required")
                    print(f"   Salt length: {len(d['authentication'].get('salt', ''))}")
                    print(f"   Challenge length: {len(d['authentication'].get('challenge', ''))}")
                else:
                    print("✓ No authentication required")

                # Send Identify without authentication (will fail if password needed)
                identify = {
                    "op": 1,
                    "d": {
                        "rpcVersion": 1
                    }
                }

                print("\n📤 Sending Identify message...")
                await websocket.send(json.dumps(identify))

                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"\n📨 Received response:")
                print(response[:500])

                response_data = json.loads(response)
                if response_data.get('op') == 2:
                    print("\n✅ Successfully identified!")
                else:
                    print(f"\n❌ Unexpected response: op={response_data.get('op')}")

    except websockets.exceptions.ConnectionClosed as e:
        print(f"\n❌ Connection closed: code={e.code}, reason={e.reason}")
    except asyncio.TimeoutError:
        print("\n❌ Timeout waiting for response")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    print("OBS WebSocket Simple Test")
    print("=" * 50)
    asyncio.run(test_obs())
