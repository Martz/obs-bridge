# OBS Bridge - Windows 11 App

A native Windows application that connects OBS Studio to a central website for remote control.

## Features

- ✅ Native Windows WPF interface
- ✅ Connection status indicators for both OBS and website
- ✅ Settings panel for easy configuration
- ✅ Real-time activity log
- ✅ Auto-connect on startup option
- ✅ Secure credential storage in AppData
- ✅ Beautiful, modern interface

## Requirements

- **Windows 11** (or Windows 10 version 1809+)
- **.NET 8.0 Runtime** (included with Windows 11, or [download here](https://dotnet.microsoft.com/download/dotnet/8.0))
- **OBS Studio 28+** with WebSocket enabled

## Installation

### Option 1: Using the Installer (Recommended)

1. Download the latest `OBSBridge-Setup.exe` from the [Releases](../../releases) page
2. Run the installer
3. Follow the installation wizard
4. Launch OBS Bridge from the Start Menu

### Option 2: Building from Source

1. Install [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
2. Clone the repository:
   ```bash
   git clone https://github.com/Martz/obs-bridge.git
   cd obs-bridge/windows-app/OBSBridge
   ```
3. Build the application:
   ```bash
   dotnet build -c Release
   ```
4. Run the application:
   ```bash
   dotnet run
   ```

Or open `windows-app/OBSBridge.sln` in Visual Studio 2022 and build/run from there.

## Configuration

### OBS Studio Settings

1. Open **OBS Studio**
2. Go to **Tools → WebSocket Server Settings**
3. Enable **WebSocket server**
4. Note the **port** (default: 4455)
5. Set a **password**

### App Settings

1. Open **OBS Bridge**
2. Click the **⚙ Settings** button
3. Enter your OBS settings:
   - **Host**: `localhost` (if OBS is on the same machine)
   - **Port**: `4455` (or your custom port)
   - **Password**: Your OBS WebSocket password

4. Enter your website settings:
   - **URL**: `ws://your-website.com/obs`
   - **Client ID**: Unique identifier for this OBS instance

5. Click **Save**

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
- Commands received from the website
- Commands sent to OBS
- Any errors or warnings

Click **Clear** to clear the log.

### Stopping the Bridge

Click **Stop** to disconnect from both OBS and the website.

### Auto-Connect

Enable **Auto-connect on startup** to automatically start the bridge when you launch the app.

## Architecture

```
┌────────────────┐         WebSocket         ┌──────────────────┐
│ Control Website│ ◄──────────────────────► │   OBS Bridge     │
│                │   (Bridge initiates)      │   (Windows App)  │
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

## Settings Storage

Settings are stored in JSON format at:
```
%APPDATA%\OBSBridge\settings.json
```

## Troubleshooting

### App won't launch

- Ensure .NET 8.0 Runtime is installed
- Check Windows Event Viewer for error logs
- Try running as Administrator

### Can't connect to OBS

- Ensure OBS is running
- Verify WebSocket is enabled in OBS
- Check host, port, and password are correct
- Try disabling OBS password temporarily to test
- Check Windows Firewall settings

### Can't connect to website

- Verify website URL starts with `ws://` or `wss://`
- Check your website WebSocket server is running
- Test connection with a WebSocket client tool
- Check Windows Firewall settings

### Commands not working

- Check activity log for errors
- Verify OBS version is 28+ (uses WebSocket v5)
- Check OBS logs: Help → Log Files → View Current Log

## Creating an Installer

To create a Windows installer using WiX Toolset:

1. Install [WiX Toolset v4](https://wixtoolset.org/docs/intro/)
2. Build the project in Release mode
3. Run the installer build script:
   ```bash
   dotnet build installer/OBSBridge.Installer.wixproj -c Release
   ```

The installer will be created in `installer/bin/Release/`

## Distribution

### Code Signing

For production distribution, sign your executable and installer:

1. Obtain a code signing certificate
2. Sign the executable:
   ```bash
   signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com OBSBridge.exe
   ```

### Microsoft Store

To publish to the Microsoft Store:

1. Create an MSIX package
2. Submit to Microsoft Partner Center
3. Follow Microsoft Store submission guidelines

## Development

### Project Structure

```
windows-app/OBSBridge/
├── App.xaml                    # Application definition
├── App.xaml.cs                 # Application startup logic
├── MainWindow.xaml             # Main UI
├── MainWindow.xaml.cs          # Main UI logic
├── SettingsWindow.xaml         # Settings UI
├── SettingsWindow.xaml.cs      # Settings UI logic
├── AppSettings.cs              # Settings model
├── BridgeManager.cs            # Bridge coordinator
├── OBSWebSocketClient.cs       # OBS connection
├── WebsiteWebSocketClient.cs   # Website connection
└── OBSBridge.csproj            # Project file
```

### Key Components

- **AppSettings**: Stores and manages configuration (persisted to JSON)
- **OBSWebSocketClient**: Handles connection to OBS WebSocket v5 protocol
- **WebsiteWebSocketClient**: Handles connection to control website
- **BridgeManager**: Coordinates messages between OBS and website
- **MainWindow**: Main application interface with status and controls
- **SettingsWindow**: Configuration interface

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

## Comparison with Other Platforms

| Feature | Python Bridge | macOS App | Windows App |
|---------|--------------|-----------|-------------|
| Interface | Command line | Native GUI | Native GUI |
| Configuration | .env file | Settings panel | Settings panel |
| Platform | Cross-platform | macOS only | Windows only |
| Dependencies | Python + libs | None | .NET Runtime |
| Installation | pip install | Drag to Applications | Installer |
| Auto-start | Manual | Built-in option | Built-in option |
| Status visibility | Logs only | Visual indicators | Visual indicators |

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- Code follows C# conventions
- UI follows Windows design guidelines
- All features are tested on Windows 11

## References

- [OBS WebSocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [WPF Documentation](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/)
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
