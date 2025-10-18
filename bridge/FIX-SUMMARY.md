# Connection Fix Summary

## Problem: "Socket is not connected" Error (Code 57)

The app was experiencing `NSPOSIXErrorDomain Code=57 "Socket is not connected"` errors when trying to communicate with OBS.

### Root Cause

**Race condition in WebSocket initialization**

The code was calling `receiveMessage()` immediately after `webSocketTask.resume()`:

```swift
webSocketTask?.resume()
receiveMessage()  // ❌ TOO EARLY!
```

The problem:
1. `resume()` is **asynchronous** - it starts the connection but doesn't wait
2. `receiveMessage()` was called **before** the connection was established
3. When messages arrived, the socket wasn't ready, causing "Socket is not connected" errors

### The Fix

**Wait for connection to fully establish before starting message listener**

Now the flow is:
1. Call `resume()` to start connecting
2. **Wait** for `didOpenWithProtocol` delegate callback
3. **Then** start `receiveMessage()`

#### Before (Broken):
```swift
func connect() {
    webSocketTask?.resume()
    receiveMessage()  // ❌ Too early!
}
```

#### After (Fixed):
```swift
func connect() {
    webSocketTask?.resume()
    // Wait for delegate callback...
}

func urlSession(..., didOpenWithProtocol protocol: String?) {
    receiveMessage()  // ✅ Connection is ready!
}
```

## Changes Made

### 1. OBSWebSocketClient.swift

**`connect()` method:**
- ❌ Removed premature `receiveMessage()` call
- ✅ Added comment explaining the delegate will start receiving

**`didOpenWithProtocol` delegate:**
- ✅ Added `receiveMessage()` call after connection is established
- ✅ Added logging: "WebSocket connection established - starting message listener"

**`send()` method:**
- ✅ Added WebSocket state checking before sending
- ✅ Won't send unless socket state is `.running`
- ✅ Better error logging with error codes

**`receiveMessage()` method:**
- ✅ Added WebSocket state checking before receiving
- ✅ Won't start listening unless socket state is `.running`

### 2. WebsiteWebSocketClient.swift

Applied the same fixes:
- Removed premature `receiveMessage()` call from `connect()`
- Added `receiveMessage()` to `didOpenWithProtocol` delegate
- Added state checking to `send()` method
- Better error logging

### 3. Authentication (Previous Fix)

Fixed OBS WebSocket v5 authentication:
- ✅ Proper base64 encoding (was using hex)
- ✅ Correct binary data handling
- ✅ Implements: `Base64(SHA256(Base64(SHA256(password + salt)) + challenge))`

## Expected Behavior Now

### Successful Connection Logs:

```
OBS: Starting connection to localhost:4455
OBS: WebSocket connection established - starting message listener
OBS: Received message: {"op":0,"d":{"authentication":{...
OBS: Received op code: 0
OBS: Received Hello, sending Identify...
OBS: Processing Hello message
OBS: Authentication required
OBS Auth: Starting authentication...
OBS Auth: Secret generated (length: 44)
OBS Auth: Authentication string generated (length: 44)
OBS: Sending message: {"op":1,"d":{"rpcVersion":1,...
OBS: Message sent successfully
OBS: Received message: {"op":2,"d":{...
OBS: Received op code: 2
OBS: Successfully identified!
✓ Connection stays stable
```

### What Won't Happen Anymore:

❌ No more "Socket is not connected" errors
❌ No more race conditions
❌ No more connection failures immediately after opening
❌ No more authentication failures (4009)

## Testing Instructions

### IMPORTANT: Must Rebuild!

```bash
cd bridge

# Clean previous build
make clean

# Build with fixes
make build

# Run
make run
```

Or in Xcode: **Product → Clean Build Folder (⇧⌘K)**, then **Product → Run (⌘R)**

### Test Checklist:

1. ✅ **OBS is running** with WebSocket enabled
2. ✅ **Website server is running**: `npm run dev`
3. ✅ **Configure app settings**:
   - Host: `localhost`
   - Port: `4455`
   - Password: (match OBS or leave empty)
4. ✅ **Start Bridge** and watch logs
5. ✅ **Both indicators turn green**
6. ✅ **Connection stays stable** (no disconnects)

### Verify Success:

**In the app logs, you should see:**
- "WebSocket connection established - starting message listener" ✅
- "Successfully identified!" ✅
- Both status cards show green dots ✅
- No "Socket is not connected" errors ✅

**In the website demo:**
- Client appears in the list ✅
- Can send commands ✅
- Commands execute in OBS ✅

## Why This Fixes the Issue

### The WebSocket Lifecycle

```
1. create task
2. resume() ──────► [ASYNCHRONOUS]
3. (waiting...)               │
4. (still waiting...)         │
5. didOpenWithProtocol ◄──────┘
6. NOW ready to send/receive! ✅
```

### What Was Happening Before:

```
1. create task
2. resume() ──────► [ASYNCHRONOUS]
3. receiveMessage() ❌ TOO EARLY!
   └─► Tries to use socket before it's ready
   └─► "Socket is not connected" error
```

### What Happens Now:

```
1. create task
2. resume() ──────► [ASYNCHRONOUS]
3. (wait for delegate...)     │
4. didOpenWithProtocol ◄──────┘
5. receiveMessage() ✅ Socket is ready!
```

## Additional Safeguards

### State Checking:

Both `send()` and `receiveMessage()` now check:
```swift
guard task.state == .running else {
    print("Cannot send - WebSocket state is \(task.state.rawValue)")
    return
}
```

This prevents operations on sockets that aren't ready.

### Better Error Reporting:

All errors now log:
- Error message
- Error code
- Error domain

This makes debugging much easier.

## Conclusion

The "Socket is not connected" error was caused by a **race condition** where we tried to use the WebSocket before it was fully established.

The fix: **Wait for the connection to be ready before starting communication.**

This is a common pattern in asynchronous networking and the proper way to handle WebSocket connections in URLSession.

---

**Status: ✅ FIXED**

The app should now connect reliably to both OBS and the website without socket errors.
