# OBS Bridge

Applications that connect OBS Studio to a central website for remote control.

## Available Platforms

- **🐍 Python Bridge** - Cross-platform command-line tool ([Setup Guide](#python-bridge-setup))
- **🍎 macOS App** - Native macOS application ([Bridge Documentation](bridge/README.md))
- **🪟 Windows App** - Native Windows 11 application ([Windows Documentation](windows-app/README.md))

## Architecture

```
┌─────────────┐         WebSocket          ┌──────────────────┐
│   Website   │ ◄────────────────────────► │  OBS Bridge      │
│  (Server)   │     (Bridge initiates)     │ (Your Platform)  │
└─────────────┘                            └────────┬─────────┘
                                                    │
                                                    │ Local
                                                    │ WebSocket
                                                    │
                                               ┌────▼─────┐
                                               │   OBS    │
                                               │  Studio  │
                                               └──────────┘
```

## Features

- ✅ Connects OBS to your website (outbound connection, firewall friendly)
- ✅ Remote control OBS from anywhere
- ✅ Real time event streaming (scene changes, streaming status, etc.)
- ✅ Supports multiple OBS commands
- ✅ Automatic reconnection handling
- ✅ Secure password authentication
- ✅ Native applications for macOS and Windows with GUI
- ✅ Cross-platform Python CLI version

## Quick Start

### For Windows 11 Users
👉 [Windows Quick Start Guide](windows-app/QUICKSTART.md)

### For macOS Users
👉 [macOS Quick Start Guide](bridge/QUICKSTART.md)

### For Python/CLI Users
👉 Continue reading below for Python setup

---

## Python Bridge Setup

### Prerequisites

1. **OBS Studio 28+** (includes obs-websocket built in)
2. **Python 3.7+**

## Setup

### 1. Enable OBS WebSocket

1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Check **Enable WebSocket server**
4. Note the **Server Port** (default: 4455)
5. Set a **Server Password**
6. Click **Apply**

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure the Bridge

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# OBS WebSocket Configuration
OBS_HOST=localhost
OBS_PORT=4455
OBS_PASSWORD=your-obs-password

# Website WebSocket URL
WEBSITE_URL=ws://your-website.com/obs

# Optional: Unique identifier for this OBS client
CLIENT_ID=obs-client-1
```

### 4. Run the Bridge

```bash
python obs_bridge.py
```

You should see:

```
✓ Connected to OBS
✓ Connected to website
OBS Bridge is running. Press Ctrl+C to stop.
```

## Message Protocol

### Messages from Website to OBS

The website sends commands to control OBS:

```json
{
  "type": "command",
  "command": "StartStreaming",
  "params": {}
}
```

Common commands:
- `StartStreaming` - Start streaming
- `StopStreaming` - Stop streaming
- `StartRecording` - Start recording
- `StopRecording` - Stop recording
- `SetCurrentScene` - Switch scene (params: `{"scene-name": "Scene Name"}`)
- `GetSceneList` - Get list of all scenes
- `GetStreamingStatus` - Get current streaming/recording status

### Messages from OBS to Website

The bridge sends events and responses to the website:

**Registration:**
```json
{
  "type": "register",
  "clientId": "obs-client-1"
}
```

**OBS Events:**
```json
{
  "type": "obs_event",
  "clientId": "obs-client-1",
  "event": "StreamStarted",
  "data": {}
}
```

**Command Responses:**
```json
{
  "type": "command_response",
  "clientId": "obs-client-1",
  "command": "GetSceneList",
  "success": true,
  "data": {
    "scenes": [...],
    "current-scene": "Scene 1"
  }
}
```

## Website Server Example

Your website needs a WebSocket server to accept connections. Here's a basic Node.js example:

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8000, path: '/obs' });

wss.on('connection', (ws) => {
  console.log('OBS client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log('Received:', data);

    if (data.type === 'register') {
      console.log(`Client registered: ${data.clientId}`);
    }
  });

  // Send a command to OBS
  ws.send(JSON.stringify({
    type: 'command',
    command: 'GetSceneList',
    params: {}
  }));
});
```

## Troubleshooting

### Cannot connect to OBS

- Ensure OBS is running
- Check that obs-websocket is enabled in OBS settings
- Verify the port and password in `.env` match OBS settings

### Cannot connect to website

- Check that `WEBSITE_URL` is correct
- Ensure your website's WebSocket server is running
- Check firewall settings

### Commands not working

- Check OBS logs: Help → Log Files → View Current Log
- Enable debug logging in the bridge (modify `logging.basicConfig` level to `DEBUG`)

## Development

To modify the bridge for your specific needs, edit `obs_bridge.py`. Key areas:

- **`handle_website_message()`** - Add custom command handlers
- **`on_obs_event()`** - Filter or transform OBS events before forwarding
- **`connect_to_website()`** - Modify authentication/registration logic

## References

- [obs-websocket Documentation](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [obs-websocket-py Library](https://github.com/Elektordi/obs-websocket-py)

## Licence

MIT
