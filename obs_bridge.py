#!/usr/bin/env python3
"""
OBS Bridge - Connects OBS Studio to a central website for remote control.

This script acts as a bridge between:
1. OBS Studio (local WebSocket connection)
2. Your central website (remote WebSocket connection)
"""

import asyncio
import json
import logging
import os
import sys
from typing import Optional

import websockets
import obsws_python as obs
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OBSBridge:
    """Bridge between OBS and the central website."""

    def __init__(
        self,
        obs_host: str,
        obs_port: int,
        obs_password: str,
        website_url: str,
        client_id: Optional[str] = None
    ):
        self.obs_host = obs_host
        self.obs_port = obs_port
        self.obs_password = obs_password
        self.website_url = website_url
        self.client_id = client_id or "obs-client-1"

        self.obs_ws: Optional[obs.ReqClient] = None
        self.website_ws: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False

    async def connect_to_obs(self) -> bool:
        """Connect to OBS WebSocket."""
        try:
            logger.info(f"Connecting to OBS at {self.obs_host}:{self.obs_port}...")
            self.obs_ws = obs.ReqClient(
                host=self.obs_host,
                port=self.obs_port,
                password=self.obs_password,
                timeout=3
            )

            # Test connection by getting version
            version = self.obs_ws.get_version()
            logger.info(f"✓ Connected to OBS WebSocket v{version.obs_web_socket_version}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to OBS: {e}")
            return False

    async def connect_to_website(self) -> bool:
        """Connect to the central website WebSocket."""
        try:
            logger.info(f"Connecting to website at {self.website_url}...")
            self.website_ws = await websockets.connect(self.website_url)

            # Send initial registration message
            await self.website_ws.send(json.dumps({
                "type": "register",
                "clientId": self.client_id
            }))

            logger.info("✓ Connected to website")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to website: {e}")
            return False

    async def send_to_website(self, message: dict):
        """Send a message to the website."""
        if self.website_ws:
            try:
                await self.website_ws.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to website: {e}")

    async def handle_website_message(self, message: dict):
        """Handle commands from the website and execute in OBS."""
        logger.info(f"← Received message from website: {message}")
        
        if not self.obs_ws:
            logger.warning("Cannot execute command: OBS not connected")
            return

        try:
            command_type = message.get("type")

            if command_type == "ping":
                await self.send_to_website({
                    "type": "pong",
                    "clientId": self.client_id
                })
                return

            # Handle OBS commands
            command = message.get("command")
            params = message.get("params", {})

            logger.info(f"Executing OBS command: {command}")

            # Map common commands to OBS requests (v5 API)
            if command == "SetCurrentScene":
                scene_name = params.get("sceneName") or params.get("scene-name")
                self.obs_ws.set_current_program_scene(scene_name)
                response_data = {"sceneName": scene_name}
            elif command == "StartStreaming":
                logger.info("→ Sending StartStream command to OBS WebSocket...")
                self.obs_ws.start_stream()
                logger.info("✓ StartStream command sent successfully")
                response_data = {}
            elif command == "StopStreaming":
                self.obs_ws.stop_stream()
                response_data = {}
            elif command == "StartRecording":
                self.obs_ws.start_record()
                response_data = {}
            elif command == "StopRecording":
                self.obs_ws.stop_record()
                response_data = {}
            elif command == "GetSceneList":
                scenes = self.obs_ws.get_scene_list()
                response_data = {
                    "currentProgramSceneName": scenes.current_program_scene_name,
                    "scenes": [{"sceneName": s["sceneName"], "sceneIndex": s["sceneIndex"]} for s in scenes.scenes]
                }
            elif command == "GetStreamingStatus":
                status = self.obs_ws.get_stream_status()
                response_data = {
                    "outputActive": status.output_active,
                    "outputReconnecting": status.output_reconnecting,
                    "outputTimecode": status.output_timecode,
                    "outputDuration": status.output_duration
                }
            else:
                # Try to call method dynamically
                method_name = self._snake_case(command)
                if hasattr(self.obs_ws, method_name):
                    method = getattr(self.obs_ws, method_name)
                    result = method(**params)
                    response_data = result.__dict__ if hasattr(result, '__dict__') else {}
                else:
                    raise ValueError(f"Unknown command: {command}")

            # Send response back to website
            await self.send_to_website({
                "type": "command_response",
                "clientId": self.client_id,
                "command": command,
                "success": True,
                "data": response_data
            })

        except Exception as e:
            logger.error(f"Error executing OBS command: {e}")
            await self.send_to_website({
                "type": "command_response",
                "clientId": self.client_id,
                "command": message.get("command"),
                "success": False,
                "error": str(e)
            })

    def _snake_case(self, text: str) -> str:
        """Convert CamelCase to snake_case."""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    async def website_listener(self):
        """Listen for messages from the website."""
        while self.running and self.website_ws:
            try:
                message = await self.website_ws.recv()
                data = json.loads(message)
                await self.handle_website_message(data)
            except websockets.exceptions.ConnectionClosed:
                logger.warning("Website connection closed")
                return
            except Exception as e:
                logger.error(f"Error in website listener: {e}")
                return

    async def run(self):
        """Main run loop with automatic reconnection."""
        self.running = True

        try:
            while self.running:
                # Connect to OBS
                while self.running and not await self.connect_to_obs():
                    logger.warning("Retrying OBS connection in 1 second...")
                    await asyncio.sleep(1)

                if not self.running:
                    break

                # Connect to website
                while self.running and not await self.connect_to_website():
                    logger.warning("Retrying website connection in 1 second...")
                    await asyncio.sleep(1)

                if not self.running:
                    break

                logger.info("OBS Bridge is running. Press Ctrl+C to stop.")

                # Run website listener
                await self.website_listener()

                # If we exit the listener and still running, we got disconnected
                if self.running:
                    logger.warning("Disconnected. Reconnecting in 1 second...")
                    await self.cleanup()
                    await asyncio.sleep(1)

        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            await self.cleanup(shutdown=True)

    async def cleanup(self, shutdown: bool = False):
        """Clean up connections."""
        if shutdown:
            self.running = False

        if self.obs_ws:
            try:
                # The new library doesn't have a disconnect method, just delete the instance
                del self.obs_ws
                logger.info("Disconnected from OBS")
            except:
                pass
            self.obs_ws = None

        if self.website_ws:
            try:
                await self.website_ws.close()
                logger.info("Disconnected from website")
            except:
                pass
            self.website_ws = None


async def main():
    """Main entry point."""
    # Load configuration from environment variables
    obs_host = os.getenv("OBS_HOST", "localhost")
    obs_port = int(os.getenv("OBS_PORT", "4455"))
    obs_password = os.getenv("OBS_PASSWORD", "")
    website_url = os.getenv("WEBSITE_URL", "ws://localhost:8000/obs")
    client_id = os.getenv("CLIENT_ID", None)

    if not website_url:
        logger.error("WEBSITE_URL environment variable is required")
        sys.exit(1)

    # Create and run the bridge
    bridge = OBSBridge(
        obs_host=obs_host,
        obs_port=obs_port,
        obs_password=obs_password,
        website_url=website_url,
        client_id=client_id
    )

    await bridge.run()


if __name__ == "__main__":
    asyncio.run(main())
