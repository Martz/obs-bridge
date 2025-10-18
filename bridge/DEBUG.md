# Debugging "Socket is not connected" Error

## Quick Diagnosis

Run this diagnostic script first:
```bash
cd bridge
./test-obs-connection.sh
```

This will check:
- ✓ Is OBS running?
- ✓ Is port 4455 listening?
- ✓ Can we connect to the port?
- ✓ Does OBS respond to WebSocket requests?

## Common Causes

### 1. OBS WebSocket Not Enabled

**Symptoms:**
- Port 4455 not listening
- "Connection refused" errors

**Solution:**
1. Open **OBS Studio**
2. Go to **Tools → WebSocket Server Settings**
3. **Check** "Enable WebSocket server"
4. Verify port is **4455**
5. Click **Apply** and **OK**
6. **Restart OBS** (important!)

### 2. Authentication Failure (Code 4009)

**Symptoms:**
- Log shows: `WebSocket connection closed (code: 4009, reason: Authentication failed.)`

**Solution - Option A (Recommended): Use Correct Password**
1. In OBS, note the WebSocket password
2. In OBS Bridge app, click gear icon
3. Enter the EXACT password (case-sensitive)
4. Click Save
5. Restart the bridge

**Solution - Option B: Disable Password (Testing Only)**
1. In OBS: Tools → WebSocket Server Settings
2. **Clear** the password field
3. Click Apply
4. In OBS Bridge app: Clear the password field
5. Click Save
6. Restart the bridge

### 3. Wrong Port Number

**Symptoms:**
- "Connection refused" or "Connection timeout"

**Solution:**
1. Check OBS WebSocket port: Tools → WebSocket Server Settings
2. Note the **Server Port** (usually 4455)
3. In OBS Bridge: Settings → OBS Port
4. Enter the SAME port number
5. Click Save

### 4. OBS Busy or Crashed

**Symptoms:**
- OBS appears running but doesn't respond
- Port is listening but no Hello message

**Solution:**
```bash
# Force quit OBS
killall OBS

# Start OBS fresh
open -a OBS

# Wait for OBS to fully load
# Then try connecting again
```

## Step-by-Step Fresh Start

If nothing works, try this complete reset:

```bash
# 1. Stop everything
# - Close OBS Bridge app
# - Quit OBS completely

# 2. Verify nothing is on port 4455
lsof -i :4455
# Should show nothing

# 3. Start OBS
open -a OBS

# 4. Wait 10 seconds for OBS to fully start

# 5. Enable WebSocket
# OBS → Tools → WebSocket Server Settings
# - Check "Enable WebSocket server"
# - Port: 4455
# - Password: (leave empty for now)
# - Click Apply

# 6. Verify OBS is listening
lsof -i :4455
# Should show: OBS ... TCP *:4455 (LISTEN)

# 7. Test with wscat (optional)
npm install -g wscat
wscat -c ws://localhost:4455
# Should see: {"op":0,"d":{...

# 8. Start OBS Bridge
cd bridge
make run

# 9. In app:
# - Click gear icon
# - Host: localhost
# - Port: 4455
# - Password: (leave empty)
# - Click Save

# 10. Click "Start Bridge"
```

## Understanding the Error

**NSPOSIXErrorDomain Code=57** means `ENOTCONN` - "Socket is not connected"

This happens when:
1. **Before connection:** Socket hasn't connected yet
2. **During connection:** Connection rejected by server
3. **After connection:** Connection closed by server

Check logs to see WHEN it happens:

### If error occurs BEFORE "WebSocket connection established":
→ **Can't reach OBS** - Check if OBS running and port correct

### If error occurs AFTER "WebSocket connection established" but BEFORE "Received Hello":
→ **OBS rejecting connection** - Check OBS WebSocket is actually enabled

### If error occurs AFTER "Received Hello" and "Sending Identify":
→ **Authentication failed** - Check password is correct

### If error occurs randomly during operation:
→ **Connection unstable** - Check network/firewall

## Check Authentication Hash (Advanced)

If authentication keeps failing, verify the password hash is correct:

```bash
# In OBS logs (Help → Log Files → View Current Log)
# Search for "websocket" to see connection attempts

# You should see:
# [obs-websocket] Client connected from 127.0.0.1
# [obs-websocket] Client authenticated

# If you see:
# [obs-websocket] Client authentication failed
# → Password is wrong
```

## Verify App Is Using Latest Build

**Important:** After code changes, you MUST rebuild:

```bash
cd bridge

# Clean build
make clean

# Rebuild
make build

# Run new version
make run
```

Or in Xcode: **Product → Clean Build Folder** (⇧⌘K), then **Product → Run** (⌘R)

## Check OBS Logs

OBS keeps detailed logs:

1. **OBS → Help → Log Files → View Current Log**
2. Search for "websocket"
3. Look for connection attempts
4. Check for authentication failures

Example good logs:
```
[obs-websocket] Server started successfully on port 4455
[obs-websocket] Client connected from 127.0.0.1
[obs-websocket] Client authenticated
```

Example bad logs:
```
[obs-websocket] Client authentication failed
[obs-websocket] Client disconnected
```

## Network Troubleshooting

Test raw TCP connection:
```bash
# Test if port is reachable
nc -zv localhost 4455

# Should show:
# Connection to localhost port 4455 [tcp/*] succeeded!
```

Check what's using the port:
```bash
lsof -i :4455

# Should show:
# COMMAND  PID  USER   FD  TYPE  DEVICE  SIZE/OFF  NODE  NAME
# OBS      123  user   45u IPv6   0x...  0t0       TCP   *:4455 (LISTEN)
```

## Still Not Working?

Collect this information:

```bash
# 1. OBS version
# OBS → Help → About

# 2. macOS version
sw_vers

# 3. Port check
lsof -i :4455

# 4. Process check
ps aux | grep OBS

# 5. OBS WebSocket settings
# Screenshot of: Tools → WebSocket Server Settings

# 6. Full app logs
cd bridge
./build/Build/Products/Debug/OBSBridge.app/Contents/MacOS/OBSBridge 2>&1 | tee obs-bridge-debug.log

# 7. OBS logs
# Help → Log Files → View Current Log
# Save the log file
```

Then check:
- Is OBS WebSocket actually enabled? (restart OBS after enabling)
- Is the port correct? (4455 by default)
- Is password matching? (try without password first)
- Is OBS fully started? (wait 10 seconds after launch)

## Quick Test

Try this one-liner to test if OBS WebSocket is working:

```bash
echo -e "GET / HTTP/1.1\r\nHost: localhost:4455\r\n\r\n" | nc localhost 4455
```

If OBS WebSocket is working, you'll see HTTP headers or WebSocket upgrade response.
If you see "Connection refused", OBS WebSocket is not enabled or OBS is not running.
