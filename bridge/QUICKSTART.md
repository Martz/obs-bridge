# Quick Start - OBS Bridge macOS App

Get your native macOS OBS Bridge app running in minutes!

## Prerequisites

- macOS 13.0 (Ventura) or later
- Xcode 15.0 or later
- OBS Studio 28+ installed

## Step 1: Set Up the Project (1 minute)

```bash
cd bridge
./setup.sh
```

This creates the CommonCrypto module map needed for authentication.

## Step 2: Build the App (2 minutes)

### Option A: Using Make (Easiest)

```bash
make build
make run
```

### Option B: Using Xcode

```bash
make open  # or: open OBSBridge.xcodeproj
```

Then in Xcode:
- Press **⌘R** to build and run

### Option C: Command Line

```bash
xcodebuild -project OBSBridge.xcodeproj -scheme OBSBridge build
open build/Build/Products/Debug/OBSBridge.app
```

## Step 3: Configure OBS (1 minute)

1. Open **OBS Studio**
2. Go to **Tools → WebSocket Server Settings**
3. Check **Enable WebSocket server**
4. Set a password (remember it!)
5. Note the port (default: 4455)
6. Click **Apply**

## Step 4: Configure the App (1 minute)

1. In **OBS Bridge**, click the **gear icon** (⚙️)
2. Enter OBS settings:
   - Host: `localhost`
   - Port: `4455`
   - Password: (your OBS password)
3. Enter website settings:
   - URL: `ws://localhost:8000/obs`
   - Client ID: `obs-client-1`
4. Click **Save**

## Step 5: Start Your Website Server (1 minute)

In a new terminal:

```bash
cd ..  # Back to main project directory
npm run dev
```

You should see:
```
OBS Control Server running on port 8000
Demo control panel: http://localhost:8000
```

## Step 6: Connect Everything! (30 seconds)

1. Make sure **OBS Studio** is running
2. Make sure your **website server** is running
3. In **OBS Bridge** app, click **Start Bridge**

You should see:
- 🟢 **OBS Studio**: Connected
- 🟢 **Control Website**: Connected

## Step 7: Control OBS! (30 seconds)

1. Open browser to **http://localhost:8000**
2. Select your OBS client
3. Use the buttons to control OBS!

## Success! 🎉

You now have a native macOS app controlling OBS remotely!

## What's Next?

- **Enable auto-connect**: In settings, toggle "Auto-connect on startup"
- **Install to Applications**: Run `make install`
- **Build release version**: Run `make release`
- **Deploy website**: Host your control server online
- **Control from anywhere**: Connect the bridge to your remote website

## Troubleshooting

### Build fails

```bash
# Clean and rebuild
make clean
make setup
make build
```

### Can't connect to OBS

- Check OBS is running
- Verify password is correct in settings
- Try without password first (remove it in OBS settings)

### Can't connect to website

- Verify website server is running: `curl http://localhost:8000/health`
- Check URL is correct: `ws://localhost:8000/obs`
- Try WebSocket test: `wscat -c ws://localhost:8000/obs`

### App won't start

- Check macOS version: `sw_vers`
- Check Xcode version: `xcodebuild -version`
- View logs: `make logs`

## Daily Usage

Once set up:

1. **Start OBS**
2. **Start website**: `npm run dev`
3. **Start bridge**: Open OBS Bridge app, click "Start"
4. **Control OBS**: Visit http://localhost:8000

Or enable "Auto-connect on startup" and just launch the app!

## Comparison with Python Version

| Feature | Python Script | macOS App |
|---------|--------------|-----------|
| Interface | Terminal | Native GUI |
| Setup | Edit .env | Settings panel |
| Status | Text logs | Visual indicators |
| Auto-start | No | Yes |
| Menubar | No | Optional |

Both versions are functionally identical and can coexist!

## Need Help?

- **Full documentation**: See [README.md](README.md)
- **Build issues**: See [BUILD.md](BUILD.md)
- **Python version**: See [../obs_bridge.py](../obs_bridge.py)

---

**Tip**: Enable "Auto-connect on startup" in settings for seamless operation!
