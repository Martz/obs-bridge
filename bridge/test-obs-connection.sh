#!/bin/bash
# Test OBS WebSocket connection
# This script helps diagnose OBS connection issues

echo "🔍 Testing OBS WebSocket Connection"
echo "===================================="
echo ""

# Check if OBS is running
echo "1. Checking if OBS is running..."
if pgrep -x "OBS" > /dev/null; then
    echo "   ✓ OBS is running"
else
    echo "   ✗ OBS is NOT running"
    echo "   → Please start OBS Studio first"
    exit 1
fi

echo ""

# Check if port 4455 is listening
echo "2. Checking if port 4455 is listening..."
if lsof -Pi :4455 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ✓ Port 4455 is listening"
    PROCESS=$(lsof -Pi :4455 -sTCP:LISTEN | tail -n 1 | awk '{print $1}')
    echo "   → Process: $PROCESS"
else
    echo "   ✗ Port 4455 is NOT listening"
    echo "   → OBS WebSocket may not be enabled"
    echo "   → Go to OBS: Tools → WebSocket Server Settings"
    echo "   → Enable 'Enable WebSocket server'"
    exit 1
fi

echo ""

# Test WebSocket connection with nc (if available)
echo "3. Testing raw connection to localhost:4455..."
if command -v nc &> /dev/null; then
    if timeout 1 nc -zv localhost 4455 2>&1 | grep -q "succeeded"; then
        echo "   ✓ Can connect to localhost:4455"
    else
        echo "   ✗ Cannot connect to localhost:4455"
        echo "   → Check firewall settings"
        exit 1
    fi
else
    echo "   ⚠ 'nc' not available, skipping raw connection test"
fi

echo ""

# Test with wscat if available
echo "4. Testing WebSocket handshake..."
if command -v wscat &> /dev/null; then
    echo "   → Connecting with wscat (will timeout in 3 seconds)..."
    timeout 3 wscat -c ws://localhost:4455 2>&1 | head -5
    echo ""
    echo "   → If you saw a message starting with '{\"op\":0', OBS WebSocket is working!"
else
    echo "   ⚠ 'wscat' not available"
    echo "   → Install with: npm install -g wscat"
fi

echo ""
echo "===================================="
echo "Diagnostics complete!"
echo ""
echo "If all checks passed, the app should be able to connect."
echo "If you're still having issues:"
echo "  1. Check OBS: Tools → WebSocket Server Settings"
echo "  2. Make sure 'Enable WebSocket server' is checked"
echo "  3. Note the port number (should be 4455)"
echo "  4. Try disabling the password temporarily"
echo ""
