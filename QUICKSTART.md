# Quick Start Guide

Get your OBS remote control system running in 5 minutes!

## Prerequisites

- OBS Studio 28+ installed
- Python 3.7+ installed
- Node.js 18+ installed (for the demo server)

## Step 1: Enable OBS WebSocket (1 minute)

1. Open **OBS Studio**
2. Go to **Tools → WebSocket Server Settings**
3. Check **Enable WebSocket server**
4. Set a password (remember this!)
5. Note the port (default: **4455**)
6. Click **Apply**

## Step 2: Set Up the Python Bridge (2 minutes)

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create configuration file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your details:**
   ```env
   OBS_HOST=localhost
   OBS_PORT=4455
   OBS_PASSWORD=your-password-from-step-1
   WEBSITE_URL=ws://localhost:8000/obs
   CLIENT_ID=my-obs-client
   ```

## Step 3: Start the Demo Server (1 minute)

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   OBS Control Server running on port 8000
   WebSocket endpoint: ws://localhost:8000/obs
   Demo control panel: http://localhost:8000
   ```

## Step 4: Connect the Bridge (1 minute)

In a new terminal window:

```bash
python obs_bridge.py
```

You should see:
```
✓ Connected to OBS
✓ Connected to website
OBS Bridge is running. Press Ctrl+C to stop.
```

## Step 5: Control OBS! (30 seconds)

1. Open your browser to **http://localhost:8000**
2. You'll see your OBS client listed
3. Click the client to select it
4. Use the buttons to control OBS:
   - ▶ Start Stream
   - ⏹ Stop Stream
   - ⏺ Start Recording
   - 📊 Get Status

## Success!

You're now remotely controlling OBS from your web browser! 🎉

## What's Next?

- **Deploy the server** to a cloud provider (Heroku, Railway, etc.)
- **Modify the bridge** to add custom commands
- **Integrate with your scheduling app** using the HTTP API
- **Add authentication** to secure your control panel

## Troubleshooting

### Bridge can't connect to OBS

- Make sure OBS is running
- Check password in `.env` matches OBS settings
- Verify port number is correct

### Bridge can't connect to website

- Make sure the demo server is running
- Check `WEBSITE_URL` in `.env`
- Verify port 8000 is available

### No clients showing in web panel

- Refresh the page
- Check the bridge terminal for errors
- Verify the bridge connected successfully

## API Examples

Control OBS programmatically:

```bash
# Start streaming
curl -X POST http://localhost:8000/api/action/my-obs-client/start-stream

# Get scenes
curl -X POST http://localhost:8000/api/action/my-obs-client/scenes

# Custom command
curl -X POST http://localhost:8000/api/command/my-obs-client \
  -H "Content-Type: application/json" \
  -d '{"command": "SetCurrentScene", "params": {"scene-name": "Gaming"}}'
```

Need more help? Check the full [README.md](README.md)!
