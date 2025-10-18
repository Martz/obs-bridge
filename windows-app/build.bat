@echo off
REM Build script for OBS Bridge Windows App

echo Building OBS Bridge for Windows...
echo.

cd OBSBridge

echo Restoring NuGet packages...
dotnet restore
if errorlevel 1 (
    echo Error: Failed to restore packages
    pause
    exit /b 1
)

echo.
echo Building project...
dotnet build -c Release
if errorlevel 1 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Output: OBSBridge\bin\Release\net8.0-windows\
echo.
pause
