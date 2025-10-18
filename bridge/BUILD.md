# Build Instructions for OBS Bridge macOS App

## Quick Build

### Using Xcode (Easiest)

```bash
cd bridge
open OBSBridge.xcodeproj
```

Then in Xcode:
1. Wait for indexing to complete
2. Select **Product → Build** (⌘B)
3. Select **Product → Run** (⌘R)

### Using Command Line

```bash
cd bridge
xcodebuild -project OBSBridge.xcodeproj \
           -scheme OBSBridge \
           -configuration Release \
           -derivedDataPath ./build \
           build
```

The app will be at:
```
bridge/build/Build/Products/Release/OBSBridge.app
```

## First Time Setup

### Install Xcode Command Line Tools

```bash
xcode-select --install
```

### Verify Installation

```bash
xcrun --show-sdk-path
```

Should output something like:
```
/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX14.0.sdk
```

## Common Build Issues

### Issue: "No such module 'CommonCrypto'"

**Solution**: Create a module map for CommonCrypto

1. Create directory:
   ```bash
   mkdir -p bridge/OBSBridge/CommonCrypto
   ```

2. Create `module.modulemap`:
   ```bash
   cat > bridge/OBSBridge/CommonCrypto/module.modulemap << 'EOF'
   module CommonCrypto [system] {
       header "/usr/include/CommonCrypto/CommonCrypto.h"
       link "CommonCrypto"
       export *
   }
   EOF
   ```

3. In Xcode:
   - Select project → OBSBridge target
   - Build Settings → Swift Compiler - Search Paths
   - Add to **Import Paths**: `$(SRCROOT)/OBSBridge/CommonCrypto`

### Issue: Code signing errors

**Solution**: Disable signing for development

In Xcode:
1. Select project → OBSBridge target
2. Signing & Capabilities
3. Uncheck "Automatically manage signing"
4. Set "Signing Certificate" to "Sign to Run Locally"

Or edit build settings:
```bash
# Add to Debug configuration
CODE_SIGN_IDENTITY = "-"
CODE_SIGN_STYLE = Manual
```

### Issue: "Sandbox" errors at runtime

**Solution**: The app needs network access

The `OBSBridge.entitlements` file should contain:
```xml
<key>com.apple.security.network.client</key>
<true/>
```

This is already configured in the project.

## Running from Terminal

After building:

```bash
# Run directly
./build/Build/Products/Release/OBSBridge.app/Contents/MacOS/OBSBridge

# Or use open command
open ./build/Build/Products/Release/OBSBridge.app
```

## Creating a Distributable App

### Step 1: Clean Build

```bash
cd bridge
rm -rf build
xcodebuild clean -project OBSBridge.xcodeproj
```

### Step 2: Release Build

```bash
xcodebuild -project OBSBridge.xcodeproj \
           -scheme OBSBridge \
           -configuration Release \
           -derivedDataPath ./build \
           archive \
           -archivePath ./build/OBSBridge.xcarchive
```

### Step 3: Export App

```bash
xcodebuild -exportArchive \
           -archivePath ./build/OBSBridge.xcarchive \
           -exportPath ./build/Export \
           -exportOptionsPlist ExportOptions.plist
```

Create `ExportOptions.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>mac-application</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
```

### Step 4: Copy to Applications

```bash
cp -R ./build/Export/OBSBridge.app /Applications/
```

## Testing the App

### Test OBS Connection

```bash
# Start OBS first
# Then run app and check connection status
```

### Test Website Connection

```bash
# Start your website WebSocket server
# Then start the bridge
# Check logs for "Connected to website"
```

### Debug Logging

To see detailed logs:

1. Open Console.app
2. Filter for "OBSBridge"
3. Run the app
4. Watch for log messages

Or run from terminal:
```bash
./OBSBridge.app/Contents/MacOS/OBSBridge 2>&1 | tee obs-bridge.log
```

## Development Workflow

### Hot Reload

SwiftUI supports preview, but for full app testing:

1. Keep Xcode open
2. Make changes
3. Press ⌘R to rebuild and run
4. App will restart with changes

### Debugging

1. In Xcode, set breakpoints by clicking line numbers
2. Run with ⌘R
3. App will pause at breakpoints
4. Inspect variables in debugger

### Testing Changes

```bash
# Quick test cycle
cd bridge
xcodebuild -project OBSBridge.xcodeproj -scheme OBSBridge build && \
  open build/Build/Products/Debug/OBSBridge.app
```

## Build Variants

### Debug (Default)

```bash
xcodebuild -configuration Debug build
```

- Includes debug symbols
- No optimisations
- Larger app size
- Better for development

### Release

```bash
xcodebuild -configuration Release build
```

- Optimised code
- Smaller app size
- Better performance
- For distribution

## Troubleshooting Build

### Clear Derived Data

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/OBSBridge-*
```

### Reset Xcode

```bash
# Reset package caches
rm -rf ~/Library/Caches/org.swift.swiftpm/
rm -rf ~/Library/Developer/Xcode/DerivedData/

# Reset Xcode preferences (last resort)
defaults delete com.apple.dt.Xcode
```

### Check for Errors

```bash
# Build with verbose output
xcodebuild -project OBSBridge.xcodeproj \
           -scheme OBSBridge \
           build \
           | grep error
```

## Next Steps

After successful build:
1. Configure OBS WebSocket (see README.md)
2. Start your control website
3. Launch OBS Bridge
4. Click "Start Bridge"
5. Control OBS from your website!

## Support

For build issues:
- Check Xcode version (needs 15.0+)
- Check macOS version (needs 13.0+)
- Review Console.app logs
- Check [GitHub Issues](https://github.com/yourrepo/issues)
