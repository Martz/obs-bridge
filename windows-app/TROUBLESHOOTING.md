# Troubleshooting Guide - OBS Bridge for Windows

This guide helps you resolve common issues with OBS Bridge on Windows 11.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Connection Issues](#connection-issues)
3. [OBS Connection Problems](#obs-connection-problems)
4. [Website Connection Problems](#website-connection-problems)
5. [Command Execution Issues](#command-execution-issues)
6. [Performance Issues](#performance-issues)
7. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Installation Issues

### App Won't Install

**Problem**: Installer fails or shows errors

**Solutions**:
- Ensure you have Windows 10 version 1809 or later (Windows 11 recommended)
- Run installer as Administrator (right-click → Run as administrator)
- Disable antivirus temporarily during installation
- Check Windows Event Viewer for detailed error messages:
  - Press `Win + X` → Event Viewer
  - Navigate to Windows Logs → Application
  - Look for errors related to OBSBridge

### .NET Runtime Not Found

**Problem**: Error message about missing .NET runtime

**Solution**:
1. Download .NET 8.0 Runtime from: https://dotnet.microsoft.com/download/dotnet/8.0
2. Install both:
   - .NET Desktop Runtime 8.0.x (x64)
   - ASP.NET Core Runtime 8.0.x (for WebSocket support)
3. Restart your computer
4. Try launching OBS Bridge again

### App Won't Launch After Installation

**Problem**: Nothing happens when clicking the app icon

**Solutions**:
- Check if the process is running:
  - Press `Ctrl + Shift + Esc` to open Task Manager
  - Look for "OBSBridge.exe" in Processes tab
  - If found, end the task and try again
- Try running from command prompt to see errors:
  ```cmd
  cd "C:\Program Files\OBS Bridge"
  OBSBridge.exe
  ```
- Check Windows Defender/Antivirus logs - it might be blocking the app
- Reinstall the application

---

## Connection Issues

### Both Connections Fail

**Problem**: Can't connect to OBS or website

**Solutions**:
1. **Check Windows Firewall**:
   - Open Windows Security → Firewall & network protection
   - Click "Allow an app through firewall"
   - Find OBSBridge and ensure both Private and Public are checked
   - If not listed, click "Change settings" → "Allow another app" → Browse to OBSBridge.exe

2. **Check Network Connection**:
   - Ensure you have active internet connection (for website)
   - Ping localhost to verify local network works:
     ```cmd
     ping localhost
     ```

3. **Verify Settings**:
   - Open Settings in OBS Bridge
   - Double-check all values are correct
   - Click Save to ensure settings are persisted

---

## OBS Connection Problems

### "Cannot Connect to OBS"

**Problem**: OBS status shows red or error

**Diagnostic Steps**:

1. **Verify OBS is Running**:
   - Open OBS Studio
   - Keep it running in the background

2. **Check WebSocket is Enabled**:
   - In OBS: Tools → WebSocket Server Settings
   - Ensure "Enable WebSocket server" is checked
   - Note the port number (default: 4455)
   - Click Apply

3. **Verify Port and Password**:
   - In OBS Bridge Settings:
     - Host: `localhost` (if OBS is on same PC)
     - Port: Should match OBS WebSocket port
     - Password: Should match OBS WebSocket password
   - Try temporarily disabling OBS password:
     - In OBS WebSocket Settings, uncheck "Enable authentication"
     - Leave Password field blank in OBS Bridge
     - Test connection

4. **Check OBS WebSocket Version**:
   - OBS Bridge requires OBS Studio 28 or later
   - Check OBS version: Help → About
   - Update OBS if version is below 28

5. **Test Direct Connection**:
   ```powershell
   # Test if WebSocket port is listening
   Test-NetConnection -ComputerName localhost -Port 4455
   ```

### OBS Keeps Disconnecting

**Problem**: Connection drops repeatedly

**Solutions**:
- Check OBS logs for errors:
  - In OBS: Help → Log Files → View Current Log
  - Look for WebSocket-related errors
- Increase WebSocket timeout in OBS settings
- Disable OBS plugins that might interfere
- Try restarting both OBS and OBS Bridge

### Wrong OBS Version Detected

**Problem**: Version shows incorrectly or not at all

**Solutions**:
- Ensure you're using OBS WebSocket v5 (built into OBS 28+)
- If you have obs-websocket plugin installed separately, uninstall it
- Update to latest OBS version

---

## Website Connection Problems

### "Cannot Connect to Website"

**Problem**: Website status shows red or error

**Diagnostic Steps**:

1. **Verify WebSocket URL Format**:
   - Must start with `ws://` (unsecured) or `wss://` (secured)
   - Example: `ws://example.com:8000/obs`
   - Example: `wss://secure.example.com/obs`

2. **Test Website is Reachable**:
   - Open browser and try to access the website
   - If using `wss://`, ensure SSL certificate is valid
   - Check if firewall is blocking outbound connections

3. **Check WebSocket Server is Running**:
   - Verify your WebSocket server application is running
   - Check server logs for connection attempts
   - Try connecting with a WebSocket test client

4. **Corporate Network Issues**:
   - Corporate firewalls often block WebSocket connections
   - Try from different network (e.g., mobile hotspot)
   - Contact IT department to whitelist WebSocket connections
   - Use VPN if available

5. **SSL/TLS Certificate Issues** (for `wss://`):
   - Ensure server certificate is valid and trusted
   - Add certificate to Windows Trusted Root store if self-signed:
     - Press `Win + R` → `certmgr.msc`
     - Import certificate to Trusted Root Certification Authorities

### Website Connection Timeout

**Problem**: Connection attempts but times out

**Solutions**:
- Check if server is behind a reverse proxy that needs configuration
- Verify server supports WebSocket upgrade requests
- Check server timeout settings
- Ensure no proxy is interfering:
  ```powershell
  # Disable proxy temporarily
  netsh winhttp reset proxy
  ```

---

## Command Execution Issues

### Commands Not Working

**Problem**: Website sends commands but nothing happens in OBS

**Diagnostic Steps**:

1. **Check Activity Log**:
   - Look for command received messages
   - Look for error messages
   - Verify command names are correct

2. **Verify Command Format**:
   - Commands must match OBS WebSocket v5 protocol
   - Check [OBS WebSocket Protocol Documentation](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
   - Example correct command:
     ```json
     {
       "type": "command",
       "command": "StartStreaming",
       "params": {}
     }
     ```

3. **Check OBS Permissions**:
   - Some commands require OBS to not be in Studio Mode
   - Try disabling Studio Mode in OBS

4. **Test with Simple Commands**:
   - Try `GetSceneList` first (read-only, should always work)
   - Then try `StartStreaming` or `StopStreaming`

### Commands Execute But Don't Respond

**Problem**: Commands work in OBS but website doesn't get response

**Solutions**:
- Check network latency
- Verify website is listening for responses
- Check Activity Log for sent responses
- Ensure website message handler is working correctly

---

## Performance Issues

### High CPU Usage

**Problem**: OBS Bridge uses excessive CPU

**Solutions**:
- Clear activity log (click Clear button)
- Reduce logging verbosity
- Check for connection retry loops (disconnect and reconnect)
- Update to latest version

### High Memory Usage

**Problem**: Memory usage grows over time

**Solutions**:
- Clear activity log regularly (limited to 100 entries automatically)
- Restart the application
- Report as bug if it continues to grow

### Slow Response Times

**Problem**: Commands take long time to execute

**Solutions**:
- Check network latency to website
- Verify OBS is not overloaded (high CPU/GPU usage)
- Close unnecessary applications
- Check Windows Task Manager for other resource-heavy processes

---

## Advanced Troubleshooting

### Enable Debug Logging

To get more detailed logs:

1. Create debug configuration in settings JSON:
   - Navigate to: `%APPDATA%\OBSBridge\settings.json`
   - Add logging configuration (feature to be implemented)

2. Use Process Monitor:
   - Download [Process Monitor](https://docs.microsoft.com/en-us/sysinternals/downloads/procmon)
   - Filter for OBSBridge.exe
   - Monitor network, file, and registry activity

### Network Packet Capture

To diagnose connection issues:

1. Install [Wireshark](https://www.wireshark.org/)
2. Start capture on loopback adapter (for OBS) or network adapter (for website)
3. Filter for WebSocket traffic:
   - Filter: `tcp.port == 4455` (OBS)
   - Filter: `websocket` (website)
4. Analyze connection handshake and data

### Check Event Viewer

For detailed Windows errors:

1. Press `Win + X` → Event Viewer
2. Navigate to:
   - **Windows Logs → Application** (application errors)
   - **Windows Logs → System** (system-level issues)
3. Filter by Source: ".NET Runtime" or look for OBSBridge

### Registry Issues

Settings are stored in: `%APPDATA%\OBSBridge\settings.json`

To reset settings:
```powershell
Remove-Item "$env:APPDATA\OBSBridge\settings.json"
```

### Reinstall Application

Complete clean reinstall:

1. Uninstall from Settings → Apps
2. Delete remaining files:
   ```powershell
   Remove-Item -Recurse "$env:APPDATA\OBSBridge"
   Remove-Item -Recurse "C:\Program Files\OBS Bridge"
   ```
3. Reinstall from setup

---

## Getting Help

If you've tried everything and still have issues:

### Collect Diagnostic Information

Before asking for help, gather:

1. **OBS Bridge Version**: Check in About dialog
2. **Windows Version**: Press `Win + R` → `winver`
3. **OBS Version**: In OBS, Help → About
4. **.NET Version**:
   ```powershell
   dotnet --list-runtimes
   ```
5. **Activity Log**: Screenshot or copy from app
6. **Error Messages**: Exact error text
7. **OBS Logs**: From Help → Log Files in OBS

### Report an Issue

Create an issue on GitHub: https://github.com/Martz/obs-bridge/issues

Include:
- Diagnostic information from above
- Steps to reproduce the problem
- Expected vs actual behavior
- Screenshots if applicable

### Community Support

- GitHub Discussions: https://github.com/Martz/obs-bridge/discussions
- OBS Forums: https://obsproject.com/forum/

---

## Common Error Messages

### "Configuration errors: OBS host cannot be empty"
**Solution**: Open Settings and fill in all required fields

### "OBS not connected"
**Solution**: Start OBS Studio and ensure WebSocket is enabled

### "Website URL must start with ws:// or wss://"
**Solution**: Fix the URL format in Settings

### "Failed to restore packages" (when building)
**Solution**: Check internet connection and try `dotnet restore` again

### "Could not find a part of the path"
**Solution**: Ensure all project files are present and paths are correct

---

## Prevention Tips

To avoid future issues:

- ✅ Keep OBS Studio updated
- ✅ Keep .NET runtime updated
- ✅ Use stable network connections
- ✅ Regularly clear activity log
- ✅ Test settings changes before saving
- ✅ Keep backup of working configuration
- ✅ Use descriptive Client IDs
- ✅ Document your WebSocket server setup

---

## Quick Diagnostics Checklist

Run through this checklist when experiencing issues:

- [ ] Is OBS Studio running?
- [ ] Is WebSocket enabled in OBS?
- [ ] Do port and password match?
- [ ] Is .NET 8.0 Runtime installed?
- [ ] Is Windows Firewall allowing the app?
- [ ] Is the website WebSocket server running?
- [ ] Is the WebSocket URL correct?
- [ ] Are there any errors in the Activity Log?
- [ ] Have you tried restarting both apps?
- [ ] Is your antivirus blocking the connection?

If all checked and still having issues, see [Getting Help](#getting-help) section.
