# OBS Bridge - Windows Quick Start Guide

Get OBS Bridge up and running on Windows in 5 minutes!

## Prerequisites

1. **Windows 11** (or Windows 10 version 1809+)
2. **.NET 8.0 Runtime** - Download from: https://dotnet.microsoft.com/download/dotnet/8.0
3. **OBS Studio 28+** - Download from: https://obsproject.com/

## Step 1: Download or Build

### Option A: Download Pre-built Release (Recommended)
1. Go to the [Releases](../../releases) page
2. Download `OBSBridge-Setup.exe`
3. Run the installer
4. Skip to Step 3

### Option B: Build from Source
1. Install [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
2. Clone this repository:
   ```powershell
   git clone https://github.com/Martz/obs-bridge.git
   cd obs-bridge\windows-app
   ```
3. Build the app:
   ```powershell
   .\build.bat
   ```
4. The executable will be in: `OBSBridge\bin\Release\net8.0-windows\OBSBridge.exe`

## Step 2: Configure OBS Studio

1. Open **OBS Studio**
2. Go to **Tools** → **WebSocket Server Settings**
3. Check ✅ **Enable WebSocket server**
4. Note the **Server Port** (default: 4455)
5. Set a **Server Password** (remember this!)
6. Click **Apply** and **OK**

## Step 3: Run OBS Bridge

1. Launch **OBS Bridge**
2. Click the **⚙ Settings** button
3. Enter your settings:

### OBS Settings
- **Host**: `localhost`
- **Port**: `4455` (or your custom port)
- **Password**: The password you set in OBS

### Website Settings
- **URL**: Your WebSocket server URL (e.g., `ws://localhost:8000/obs`)
- **Client ID**: A unique identifier (auto-generated, or customize)

4. Click **Save**

## Step 4: Start the Bridge

1. Make sure **OBS Studio is running**
2. Make sure your **control website is running** (see below for quick test)
3. Click **Start Bridge**

You should see:
- ✅ **OBS Studio: Connected** (green indicator)
- ✅ **Control Website: Connected** (green indicator)

## Quick Test: Run a Test Server

To test the bridge, you can run the example WebSocket server:

### Using Node.js (Recommended)
```powershell
# From the repository root
npm install
npm run dev
```

### Using Python
```powershell
# From the repository root
pip install -r requirements.txt
python obs_bridge.py
```

The test server will run on `ws://localhost:8000/obs`

## Testing Commands

Once connected, you can send commands from your website. Here's a simple test using browser console:

```javascript
const ws = new WebSocket('ws://localhost:8000/obs');

ws.onopen = () => {
  console.log('Connected');
  
  // Send a command to get scene list
  ws.send(JSON.stringify({
    type: 'command',
    command: 'GetSceneList',
    params: {}
  }));
};

ws.onmessage = (event) => {
  console.log('Response:', JSON.parse(event.data));
};
```

## Troubleshooting

### App won't start
- Make sure .NET 8.0 Runtime is installed
- Try running as Administrator
- Check Windows Event Viewer for errors

### Can't connect to OBS
- Verify OBS is running
- Check WebSocket is enabled in OBS settings
- Verify port and password are correct
- Try temporarily disabling OBS password
- Check Windows Firewall settings

### Can't connect to website
- Verify the WebSocket URL is correct
- Make sure it starts with `ws://` or `wss://`
- Check if your website server is running
- Test the WebSocket URL in a browser tool

### Commands not working
- Check the Activity Log for errors
- Verify OBS version is 28 or higher
- Check OBS logs: Help → Log Files → View Current Log

## Next Steps

- ✅ Enable **Auto-connect on startup** for convenience
- ✅ Set up your own control website
- ✅ Explore the OBS WebSocket protocol for more commands
- ✅ Check the main [README](README.md) for advanced features

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](../../issues)
- 💬 [Discussions](../../discussions)

---

**Enjoy using OBS Bridge! 🎥**
