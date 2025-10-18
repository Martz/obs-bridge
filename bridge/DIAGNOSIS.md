# Diagnosing "Socket is not connected" Error

You're getting persistent `nw_write_request_report [C3] Send failed with error "Socket is not connected"` errors.

This means the TCP connection is failing at a low level. Let's diagnose step by step.

## Step 1: Verify OBS WebSocket is Working

First, let's test if OBS WebSocket is actually responding correctly with a simple Python script:

```bash
cd bridge
python3 test-obs-simple.py
```

### Expected Output (Good):
```
✓ Connected!
📨 Received from OBS:
{"op":0,"d":{"obsWebSocketVersion":"5.6.2"...
✓ Message type: op=0
✓ Received Hello message (op code 0)
⚠️  Authentication IS required (or: ✓ No authentication required)
```

### If this fails:
→ **OBS WebSocket is not properly enabled or configured**

**Fix:**
1. Open OBS
2. **Tools → WebSocket Server Settings**
3. **Check** "Enable WebSocket server"
4. Port: **4455**
5. Password: (note it or clear it)
6. Click **Apply** and **OK**
7. **Restart OBS completely** (Quit and reopen)
8. Run the test script again

## Step 2: Test Without Password

The authentication might be causing issues. Let's test without a password:

### In OBS:
1. **Tools → WebSocket Server Settings**
2. **Clear** the password field (make it empty)
3. Click **Apply** and **OK**
4. **Restart OBS**

### In OBS Bridge App:
1. Click gear icon (Settings)
2. **Clear** the password field
3. Click **Save**
4. Click **Start Bridge**

### Expected Result:
If this works, the authentication code has an issue. If it still fails, it's something else.

## Step 3: Check OBS Logs

OBS keeps detailed logs that will show exactly why it's rejecting the connection:

1. **OBS → Help → Log Files → View Current Log**
2. Scroll to the bottom
3. **Start** the OBS Bridge app
4. **Look for** lines containing "websocket"

### What to look for:

**Good logs:**
```
[obs-websocket] Client connected from 127.0.0.1
[obs-websocket] Client authenticated successfully
```

**Bad logs:**
```
[obs-websocket] Client authentication failed
[obs-websocket] Client disconnected
```

or

```
[obs-websocket] Invalid protocol
[obs-websocket] Connection rejected
```

**Copy any websocket-related error lines** - they'll tell us exactly what OBS doesn't like.

## Step 4: Test with Python Bridge

The Python bridge works reliably. Let's test if it connects:

```bash
cd /Users/martinpalastanga/code/SchedulingApp

# Make sure OBS is running
# Make sure website server is running: npm run dev

# Run Python bridge
python obs_bridge.py
```

### If Python bridge works but macOS app doesn't:
→ **There's a bug in the Swift implementation**

### If Python bridge also fails:
→ **OBS configuration issue**

## Step 5: Check macOS App Logs

Run the app from Terminal to see ALL logs:

```bash
cd bridge
./build/Build/Products/Debug/OBSBridge.app/Contents/MacOS/OBSBridge 2>&1 | tee app-logs.txt
```

Then **Start Bridge** and watch the output.

### What to check for:

**Does it show:**
```
OBS: WebSocket connection established
OBS: Socket state: 0
```

**Then:**
```
OBS: WebSocket connection closed (code: 4009, reason: Authentication failed)
```
→ **Authentication problem** - try without password

**Or:**
```
Connection failed before any messages
```
→ **OBS not accepting connections** - check OBS WebSocket is enabled

**Or:**
```
OBS: Received Hello, sending Identify...
[then immediately closes]
```
→ **Identify message format wrong or authentication failing**

## Step 6: Compare with Working Setup

Let's verify your environment matches the requirements:

### Check OBS Version:
```bash
# In OBS: Help → About
# Should be 28.0 or later for WebSocket v5
```

### Check macOS Version:
```bash
sw_vers
# Should be 13.0 (Ventura) or later
```

### Check WebSocket Server Settings:
1. OBS → Tools → WebSocket Server Settings
2. Screenshot or note:
   - [ ] Enable WebSocket server: **CHECKED**
   - [ ] Server Port: **4455**
   - [ ] Authentication: (enabled/disabled)

## Step 7: Network Level Test

Test if the TCP connection itself works:

```bash
# Test raw TCP connection
nc -zv localhost 4455

# Should output:
# Connection to localhost port 4455 [tcp/*] succeeded!
```

### If this fails:
```
# Check what's on port 4455
lsof -i :4455

# Should show:
# COMMAND  PID  USER  FD  TYPE  DEVICE  SIZE/OFF  NODE  NAME
# OBS      XXX  user  XX  IPv6  XXXXX   0t0       TCP   *:4455 (LISTEN)
```

## Debugging Checklist

Go through this checklist:

- [ ] OBS Studio is **running**
- [ ] OBS version is **28.0+**
- [ ] WebSocket Server Settings → **"Enable WebSocket server" is CHECKED**
- [ ] Port is **4455**
- [ ] Password is **cleared** (for testing)
- [ ] **Restarted OBS** after changing settings
- [ ] `python3 test-obs-simple.py` **succeeds**
- [ ] `nc -zv localhost 4455` **succeeds**
- [ ] Python bridge (`python obs_bridge.py`) **connects**
- [ ] Checked OBS logs for websocket errors

## What to Report

If nothing works, collect this information:

```bash
# 1. OBS version
# OBS → Help → About

# 2. macOS version
sw_vers

# 3. Test script output
python3 test-obs-simple.py > test-output.txt 2>&1

# 4. App logs
./build/Build/Products/Debug/OBSBridge.app/Contents/MacOS/OBSBridge 2>&1 > app-logs.txt
# (then start bridge)

# 5. OBS logs
# Help → Log Files → View Current Log
# Search for "websocket" and copy those lines

# 6. Network test
lsof -i :4455 > network.txt

# 7. OBS WebSocket settings
# Screenshot of: Tools → WebSocket Server Settings
```

## Common Solutions

### Solution 1: Complete OBS Reset

```bash
# 1. Quit OBS completely
killall OBS

# 2. Wait 5 seconds

# 3. Start OBS
open -a OBS

# 4. Wait for OBS to fully load (10 seconds)

# 5. Enable WebSocket
# Tools → WebSocket Server Settings
# - Check "Enable WebSocket server"
# - Port: 4455
# - Password: (leave empty)
# - Click Apply

# 6. Restart OBS again
killall OBS
open -a OBS

# 7. Wait 10 seconds

# 8. Test
python3 test-obs-simple.py
```

### Solution 2: Try Different Port

Sometimes port 4455 has issues:

1. OBS → Tools → WebSocket Server Settings
2. Change port to **4456**
3. Click Apply
4. In OBS Bridge app → Settings → Port: **4456**
5. Try connecting

### Solution 3: Check Firewall

```bash
# Temporarily disable firewall for testing
# System Settings → Network → Firewall → Off
# (remember to turn back on after testing)
```

### Solution 4: Use Python Bridge

If the macOS app just won't work, use the Python bridge which is proven to work:

```bash
cd /Users/martinpalastanga/code/SchedulingApp
python obs_bridge.py
```

It has the same functionality, just a different interface.

## Next Steps

1. **Run** `python3 test-obs-simple.py` first
2. **Check** OBS logs for websocket errors
3. **Try** without password
4. **Test** if Python bridge works
5. **Report** findings with the information above

One of these tests will reveal the exact issue!
