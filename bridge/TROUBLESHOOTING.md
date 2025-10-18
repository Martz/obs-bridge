# Troubleshooting OBS Bridge

## Connection Issues Fixed

The app now has much better logging and error handling for WebSocket connections. Here's what was improved:

### Changes Made

1. **Removed premature authentication** - The app was trying to send requests before the OBS WebSocket handshake completed
2. **Added comprehensive logging** - All connection steps now print detailed logs
3. **Better error handling** - Connection errors are caught and displayed with helpful messages
4. **Proper WebSocket flow** - Now correctly waits for Hello → sends Identify → waits for Identified

### Understanding the Logs

When you start the bridge, you should see logs like this:

#### Successful OBS Connection:
```
OBS: Starting connection to localhost:4455
OBS: WebSocket connection established
OBS: Received message: {"op":0,"d":{"obsWebSocketVersion":"5.0.0",...
OBS: Received op code: 0
OBS: Received Hello, sending Identify...
OBS: Processing Hello message
OBS: No authentication required (or: Authentication required)
OBS: Sending Identify message (auth: true/false)
OBS: Sending message: {"op":1,"d":{"rpcVersion":1}...
OBS: Message sent successfully
OBS: Received message: {"op":2,"d":{...
OBS: Received op code: 2
OBS: Successfully identified!
```

#### Successful Website Connection:
```
Website: Starting connection to ws://localhost:8000/obs
Website: WebSocket connection established
Website: Registering as client obs-client-1
Website: Sending message: {"type":"register","clientId":"obs-client-1"}
Website: Message sent successfully
```

## Common Issues and Solutions

### Issue: "Socket is not connected"

**Cause:** The WebSocket server (OBS or website) is not running or not accepting connections.

**Solutions:**

1. **For OBS:**
   ```bash
   # Check if OBS is running
   ps aux | grep OBS

   # If not running, start OBS first
   open -a OBS
   ```

   Then in OBS:
   - Go to **Tools → WebSocket Server Settings**
   - Check **Enable WebSocket server**
   - Note the port (default: 4455)
   - Set or remove password
   - Click **Apply** and **OK**

2. **For Website:**
   ```bash
   # Check if server is running
   curl http://localhost:8000/health

   # If not running, start it
   cd /path/to/project
   npm run dev
   ```

### Issue: "Password required but not provided"

**Cause:** OBS has authentication enabled but no password is set in the app.

**Solution:**

1. Open OBS Bridge settings (gear icon)
2. Enter the password from OBS WebSocket Settings
3. Click Save
4. Restart the bridge

**Alternative:** Disable password in OBS temporarily for testing:
- OBS → Tools → WebSocket Server Settings
- Uncheck or clear the password
- Click Apply

### Issue: Connection opens then immediately closes

**Cause:** Usually an authentication failure or OBS rejecting the connection.

**Check logs for:**
```
OBS: Received Hello, sending Identify...
OBS: ERROR - Password required but not provided
```
or
```
OBS: Connection error: Socket is not connected
```

**Solution:**

1. Verify password matches between OBS and app
2. Try without password first (disable in OBS)
3. Check OBS logs: Help → Log Files → View Current Log

### Issue: "Invalid OBS URL"

**Cause:** The host or port settings are incorrect.

**Solution:**

1. Check settings:
   - Host should be `localhost` (if OBS on same machine)
   - Port should match OBS (usually `4455`)
2. Don't include `ws://` or `http://` in the host field
3. Port must be a number

### Issue: Website connection fails

**Cause:** Website server not running or wrong URL.

**Solution:**

1. Start the website server:
   ```bash
   cd /path/to/project
   npm run dev
   ```

2. Verify it's running:
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok","clients":0,...}
   ```

3. Check URL in settings:
   - Should start with `ws://` or `wss://`
   - Correct port (usually `8000`)
   - Correct path (usually `/obs`)
   - Example: `ws://localhost:8000/obs`

## Debugging Steps

### 1. Check Prerequisites

```bash
# Is OBS running?
ps aux | grep OBS

# Is website server running?
lsof -i :8000

# Check OBS WebSocket is enabled
# Open OBS → Tools → WebSocket Server Settings
```

### 2. Test Connections Manually

Test OBS WebSocket:
```bash
# Install wscat if needed
npm install -g wscat

# Connect to OBS
wscat -c ws://localhost:4455

# You should see a Hello message from OBS
```

Test Website:
```bash
# Connect to website
wscat -c ws://localhost:8000/obs

# Send registration
{"type":"register","clientId":"test-client"}
```

### 3. Check Logs

Run the app from Terminal to see all logs:
```bash
cd bridge
./build/Build/Products/Debug/OBSBridge.app/Contents/MacOS/OBSBridge
```

Or use Console.app:
1. Open **Console.app**
2. Filter for "OBS" or "Website"
3. Start the bridge
4. Watch for error messages

### 4. Verify Settings

In OBS Bridge settings, verify:
- [x] OBS Host: `localhost`
- [x] OBS Port: `4455` (or your custom port)
- [x] OBS Password: matches OBS (or empty if disabled)
- [x] Website URL: starts with `ws://` or `wss://`
- [x] Client ID: any unique identifier

### 5. Test Step by Step

1. **Test without OBS Bridge:**
   ```bash
   # Run the Python bridge instead
   cd /path/to/project
   python obs_bridge.py
   ```

   If Python bridge works but macOS app doesn't, it's an app issue.
   If Python bridge also fails, it's a configuration issue.

2. **Test without password:**
   - Disable password in OBS temporarily
   - Clear password in app settings
   - Try connecting

3. **Test local website first:**
   - Start website locally: `npm run dev`
   - Connect to `ws://localhost:8000/obs`
   - If that works, try remote URL

## Understanding WebSocket States

### OBS Connection States

| State | Meaning | What to do |
|-------|---------|------------|
| Disconnected | Not connected | Click "Start Bridge" |
| Connecting | Establishing connection | Wait a few seconds |
| Connected (green) | Successfully connected | Everything working! |
| Error (red) | Connection failed | Check logs and troubleshoot |

### Website Connection States

Same states as above. Both should be green when working.

## Log Interpretation

### Good Logs (Working):
```
OBS: Starting connection to localhost:4455
OBS: WebSocket connection established
OBS: Received Hello, sending Identify...
OBS: Successfully identified!
Website: Starting connection to ws://localhost:8000/obs
Website: WebSocket connection established
Website: Registering as client obs-client-1
Website: Message sent successfully
```

### Bad Logs (Connection Error):
```
OBS: Starting connection to localhost:4455
OBS: Connection error: Connection refused
```
→ **Solution:** Start OBS first

```
OBS: WebSocket connection established
Failed to receive message from OBS: Socket is not connected
```
→ **Solution:** OBS WebSocket not enabled or rejecting connection

```
OBS: ERROR - Password required but not provided
```
→ **Solution:** Set password in app settings

```
Website: Connection error: Connection refused
```
→ **Solution:** Start website server

## Still Having Issues?

1. **Check OBS version:**
   - Needs OBS Studio 28+ for WebSocket v5
   - Update from https://obsproject.com

2. **Check firewall:**
   ```bash
   # Temporarily disable firewall for testing
   # System Settings → Network → Firewall
   ```

3. **Try different ports:**
   - Change OBS WebSocket port to 4456
   - Update app settings to match

4. **Check OBS logs:**
   - OBS → Help → Log Files → View Current Log
   - Search for "websocket" errors

5. **Reset everything:**
   ```bash
   # Close OBS Bridge
   # Close OBS
   # Stop website server

   # Start fresh
   # 1. Start OBS
   # 2. Enable WebSocket in OBS
   # 3. Start website server
   # 4. Start OBS Bridge with correct settings
   ```

## Getting Help

If you're still stuck, collect this information:

1. **OBS version:** Help → About (e.g., "28.1.2")
2. **macOS version:** `sw_vers`
3. **App logs:** Run from Terminal and copy logs
4. **OBS WebSocket settings:** Screenshot
5. **App settings:** Screenshot
6. **Error message:** Exact error from logs

Then check:
- GitHub issues
- OBS forums
- WebSocket protocol documentation
