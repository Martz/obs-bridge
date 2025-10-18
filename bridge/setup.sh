#!/bin/bash
# Setup script for OBS Bridge macOS app

set -e

echo "🚀 Setting up OBS Bridge..."

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode not found. Please install Xcode from the App Store."
    exit 1
fi

echo "✓ Xcode found"

# Create CommonCrypto module map
echo "Creating CommonCrypto module map..."
mkdir -p OBSBridge/CommonCrypto

cat > OBSBridge/CommonCrypto/module.modulemap << 'EOF'
module CommonCrypto [system] {
    header "/usr/include/CommonCrypto/CommonCrypto.h"
    link "CommonCrypto"
    export *
}
EOF

echo "✓ CommonCrypto module map created"

# Check if OBS is installed
if [ -d "/Applications/OBS.app" ]; then
    echo "✓ OBS Studio found"
else
    echo "⚠️  OBS Studio not found in /Applications"
    echo "   Please install OBS Studio 28+ from https://obsproject.com"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open project: open OBSBridge.xcodeproj"
echo "2. In Xcode: Product → Build (⌘B)"
echo "3. Run: Product → Run (⌘R)"
echo ""
echo "Or build from command line:"
echo "  make build"
echo "  make run"
