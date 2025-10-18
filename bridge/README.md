# OBS Bridge - Native macOS App

A native macOS application that connects OBS Studio to a central website for remote control.

## Features

- ✅ Native macOS SwiftUI interface
- ✅ Connection status indicators for both OBS and website
- ✅ Settings panel for easy configuration
- ✅ Real time activity log
- ✅ Auto-connect on startup option
- ✅ Secure credential storage using UserDefaults
- ✅ Beautiful, modern interface

## Requirements

- macOS 13.0 (Ventura) or later
- Xcode 15.0 or later (for building)
- OBS Studio 28+ with WebSocket enabled

## Building the App

### Option 1: Using Xcode (Recommended)

1. Open the project:
   ```bash
   cd bridge
   open OBSBridge.xcodeproj
   ```

2. In Xcode:
   - Select the OBSBridge scheme
   - Select "My Mac" as the destination
   - Press **⌘R** to build and run

### Option 2: Using Command Line

```bash
cd bridge
xcodebuild -project OBSBridge.xcodeproj -scheme OBSBridge -configuration Release build
```

The built app will be in:
```
bridge/build/Release/OBSBridge.app
```

## Installation

1. **Build the app** using one of the methods above
2. **Copy to Applications**:
   ```bash
   cp -R build/Release/OBSBridge.app /Applications/
   ```
3. **Launch** from Applications folder or Spotlight

## Configuration

On first launch, configure the app:

### OBS Studio Settings

1. Open **OBS Studio**
2. Go to **Tools → WebSocket Server Settings**
3. Enable **WebSocket server**
4. Note the **port** (default: 4455)
5. Set a **password**

### App Settings

1. Open **OBS Bridge**
2. Click the **gear icon** (⚙️) or press **⌘,**
3. Enter your OBS settings:
   - **Host**: `localhost` (if OBS is on the same machine)
   - **Port**: `4455` (or your custom port)
   - **Password**: Your OBS WebSocket password

4. Enter your website settings:
   - **URL**: `ws://your-website.com/obs`
   - **Client ID**: Unique identifier for this OBS instance

5. Optionally enable **Auto-connect on startup**

6. Click **Save**

## Usage

### Starting the Bridge

1. Make sure OBS Studio is running
2. Make sure your control website is running
3. Click **Start Bridge** in the app

You should see both status indicators turn green:
- ✅ **OBS Studio**: Connected
- ✅ **Control Website**: Connected

### Activity Log

The activity log shows:
- Connection status changes
- Commands received from website
- Commands sent to OBS
- Any errors or warnings

Click **Clear** to clear the log.

### Stopping the Bridge

Click **Stop** to disconnect from both OBS and the website.

## Architecture

```
┌────────────────┐         WebSocket         ┌──────────────────┐
│ Control Website│ ◄──────────────────────► │   OBS Bridge     │
│                │   (Bridge initiates)      │   (macOS App)    │
└────────────────┘                           └────────┬─────────┘
                                                      │
                                                      │ Local
                                                      │ WebSocket
                                                      │
                                                 ┌────▼─────┐
                                                 │   OBS    │
                                                 │  Studio  │
                                                 └──────────┘
```

## Development

### Project Structure

```
bridge/
├── OBSBridge.xcodeproj/        # Xcode project
└── OBSBridge/                  # Source code
    ├── OBSBridgeApp.swift      # App entry point
    ├── ContentView.swift       # Main UI
    ├── SettingsView.swift      # Settings interface
    ├── AppSettings.swift       # Settings model
    ├── BridgeManager.swift     # Bridge coordinator
    ├── OBSWebSocketClient.swift    # OBS connection
    ├── WebsiteWebSocketClient.swift # Website connection
    ├── Info.plist              # App configuration
    └── OBSBridge.entitlements  # Sandbox permissions
```

### Key Components

- **AppSettings**: Stores and manages configuration (persisted in UserDefaults)
- **OBSWebSocketClient**: Handles connection to OBS WebSocket v5 protocol
- **WebsiteWebSocketClient**: Handles connection to control website
- **BridgeManager**: Coordinates messages between OBS and website
- **ContentView**: Main application interface with status and controls
- **SettingsView**: Configuration interface

### OBS WebSocket Protocol

The app uses **OBS WebSocket v5** protocol with the following op codes:
- `0`: Hello (from OBS)
- `1`: Identify (to OBS)
- `2`: Identified (from OBS)
- `6`: Request (to OBS)
- `7`: RequestResponse (from OBS)

### Website Protocol

Messages sent to website:

```json
{
  "type": "register",
  "clientId": "obs-client-1"
}
```

```json
{
  "type": "command_response",
  "clientId": "obs-client-1",
  "command": "StartStreaming",
  "success": true,
  "data": {}
}
```

Messages received from website:

```json
{
  "type": "command",
  "command": "StartStreaming",
  "params": {}
}
```

## Troubleshooting

### App won't launch

- Check macOS version is 13.0+
- Try running from Xcode to see error messages
- Check Console.app for crash logs

### Can't connect to OBS

- Ensure OBS is running
- Verify WebSocket is enabled in OBS
- Check host, port, and password are correct
- Try disabling OBS password temporarily to test

### Can't connect to website

- Verify website URL starts with `ws://` or `wss://`
- Check your website WebSocket server is running
- Test connection with a WebSocket client tool
- Check firewall settings

### Commands not working

- Check activity log for errors
- Verify OBS version is 28+ (uses WebSocket v5)
- Enable debug logging in Xcode
- Check OBS logs: Help → Log Files

## Building for Distribution

### Code Signing

1. In Xcode, select the project
2. Go to **Signing & Capabilities**
3. Select your **Development Team**
4. Xcode will automatically create a certificate

### Creating a DMG

```bash
# Build release version
xcodebuild -project OBSBridge.xcodeproj -scheme OBSBridge -configuration Release build

# Create DMG (requires create-dmg tool)
brew install create-dmg

create-dmg \
  --volname "OBS Bridge" \
  --window-pos 200 120 \
  --window-size 600 400 \
  --icon-size 100 \
  --app-drop-link 450 185 \
  "OBSBridge.dmg" \
  "build/Release/OBSBridge.app"
```

## Comparison with Python Bridge

| Feature | Python Bridge | macOS App |
|---------|--------------|-----------|
| Interface | Command line | Native GUI |
| Configuration | .env file | Settings panel |
| Platform | Cross-platform | macOS only |
| Dependencies | Python + libs | None (standalone) |
| Installation | pip install | Drag to Applications |
| Auto-start | Manual | Built-in option |
| Status visibility | Logs only | Visual indicators |

## Licence

MIT

## Contributing

Contributions welcome! Please ensure:
- Code follows Swift conventions
- UI follows macOS Human Interface Guidelines
- All features are tested on macOS 13.0+

## References

- [OBS WebSocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [URLSession WebSocket](https://developer.apple.com/documentation/foundation/urlsessionwebsockettask)
