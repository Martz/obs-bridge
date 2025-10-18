#!/bin/bash
# Build script for OBS Bridge Windows App (for cross-platform development)

echo "Building OBS Bridge for Windows..."
echo ""

cd OBSBridge

echo "Restoring NuGet packages..."
dotnet restore
if [ $? -ne 0 ]; then
    echo "Error: Failed to restore packages"
    exit 1
fi

echo ""
echo "Building project..."
dotnet build -c Release
if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

echo ""
echo "Build completed successfully!"
echo "Output: OBSBridge/bin/Release/net8.0-windows/"
echo ""
