# Creating a Windows Installer for OBS Bridge

This guide explains how to create an installer for the OBS Bridge Windows application.

## Option 1: MSIX Package (Recommended for Microsoft Store)

MSIX is the modern Windows app package format recommended for Windows 10/11.

### Prerequisites
- Visual Studio 2022 with "Windows Application Packaging Project" workload
- Windows SDK 10.0.19041.0 or later

### Steps

1. **Create Packaging Project**
   - Open the OBSBridge solution in Visual Studio
   - Right-click solution → Add → New Project
   - Search for "Windows Application Packaging Project"
   - Name it "OBSBridge.Package"

2. **Add Application**
   - Right-click "Applications" in the packaging project
   - Add Reference → Projects → OBSBridge

3. **Configure Package**
   - Edit `Package.appxmanifest`:
     - Set Package Name, Publisher, Display Name
     - Set minimum Windows version (e.g., Windows 10 1809)
     - Configure capabilities (if needed)

4. **Build Package**
   ```powershell
   # Build in Visual Studio
   # Or via command line:
   msbuild OBSBridge.Package.wapproj /p:Configuration=Release /p:Platform=x64
   ```

5. **Sign Package** (required for installation)
   ```powershell
   # Create test certificate (development only)
   New-SelfSignedCertificate -Type Custom -Subject "CN=YourName" -KeyUsage DigitalSignature -FriendlyName "OBSBridge Test Cert" -CertStoreLocation "Cert:\CurrentUser\My"
   
   # Sign the package
   signtool sign /fd SHA256 /a /f certificate.pfx /p password OBSBridge.msix
   ```

### Publishing to Microsoft Store

1. Create developer account at [Microsoft Partner Center](https://partner.microsoft.com/)
2. Create new app submission
3. Upload MSIX package
4. Fill in store listing details
5. Submit for review

## Option 2: WiX Toolset Installer (Traditional MSI)

WiX creates traditional MSI installers that work on all Windows versions.

### Prerequisites
- [WiX Toolset v4](https://wixtoolset.org/docs/intro/) or later

### Installation

```powershell
# Install WiX via .NET tool
dotnet tool install --global wix
```

### Create Installer Project

1. **Create WiX Project File** (`OBSBridge.Installer.wixproj`):

```xml
<Project Sdk="WixToolset.Sdk/4.0.0">
  <PropertyGroup>
    <ProductName>OBS Bridge</ProductName>
    <Manufacturer>Your Name</Manufacturer>
    <ProductVersion>1.0.0</ProductVersion>
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="WixToolset.UI.wixext" Version="4.0.0" />
  </ItemGroup>
</Project>
```

2. **Create Product Definition** (`Product.wxs`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Product Id="*" 
           Name="OBS Bridge" 
           Language="1033" 
           Version="1.0.0" 
           Manufacturer="Your Name" 
           UpgradeCode="PUT-GUID-HERE">
    
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />
    
    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    
    <MediaTemplate EmbedCab="yes" />
    
    <Feature Id="ProductFeature" Title="OBS Bridge" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>
    
    <!-- UI -->
    <UIRef Id="WixUI_InstallDir" />
    <Property Id="WIXUI_INSTALLDIR" Value="INSTALLFOLDER" />
  </Product>
  
  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="OBS Bridge" />
      </Directory>
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="OBS Bridge"/>
      </Directory>
    </Directory>
  </Fragment>
  
  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="MainExecutable">
        <File Source="..\OBSBridge\bin\Release\net8.0-windows\OBSBridge.exe" />
        <File Source="..\OBSBridge\bin\Release\net8.0-windows\OBSBridge.dll" />
        <File Source="..\OBSBridge\bin\Release\net8.0-windows\OBSBridge.runtimeconfig.json" />
        <!-- Add all other required DLLs -->
      </Component>
      
      <Component Id="StartMenuShortcut">
        <Shortcut Id="ApplicationStartMenuShortcut"
                  Name="OBS Bridge"
                  Description="OBS Studio WebSocket Bridge"
                  Target="[INSTALLFOLDER]OBSBridge.exe"
                  WorkingDirectory="INSTALLFOLDER"/>
        <RemoveFolder Id="ApplicationProgramsFolder" On="uninstall"/>
        <RegistryValue Root="HKCU" 
                      Key="Software\OBSBridge" 
                      Name="installed" 
                      Type="integer" 
                      Value="1" 
                      KeyPath="yes"/>
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>
```

3. **Build Installer**:

```powershell
# Build the main app first
cd ..\OBSBridge
dotnet build -c Release

# Build installer
cd ..\installer
dotnet build -c Release

# Output: bin\Release\OBSBridge.msi
```

### Customizing the Installer

You can customize various aspects:

- **Custom icons**: Add `<Icon>` elements
- **License agreement**: Add WiX UI for license
- **Custom dialogs**: Create custom UI flows
- **Registry entries**: Add for file associations, etc.
- **Desktop shortcuts**: Add shortcut components

## Option 3: Inno Setup (Simple Installer)

[Inno Setup](https://jrsoftware.org/isinfo.php) is a free installer for Windows programs.

### Create Installer Script (`setup.iss`):

```ini
[Setup]
AppName=OBS Bridge
AppVersion=1.0
DefaultDirName={autopf}\OBS Bridge
DefaultGroupName=OBS Bridge
OutputDir=output
OutputBaseFilename=OBSBridge-Setup
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "..\OBSBridge\bin\Release\net8.0-windows\*"; DestDir: "{app}"; Flags: recursesubdirs

[Icons]
Name: "{group}\OBS Bridge"; Filename: "{app}\OBSBridge.exe"
Name: "{autodesktop}\OBS Bridge"; Filename: "{app}\OBSBridge.exe"

[Run]
Filename: "{app}\OBSBridge.exe"; Description: "Launch OBS Bridge"; Flags: postinstall nowait skipifsilent
```

### Build with Inno Setup:

1. Download and install [Inno Setup](https://jrsoftware.org/isdl.php)
2. Open `setup.iss` in Inno Setup Compiler
3. Click Build → Compile
4. Output: `output\OBSBridge-Setup.exe`

## Code Signing

All installers should be code signed for production:

### Get Certificate

1. **For Microsoft Store**: Use Partner Center
2. **For public distribution**: Purchase from a Certificate Authority (DigiCert, Sectigo, etc.)
3. **For testing**: Create self-signed certificate

### Sign the Installer

```powershell
# Sign with SignTool (included with Windows SDK)
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com /fd SHA256 OBSBridge-Setup.exe

# Or with Azure Key Vault
signtool sign /tr http://timestamp.digicert.com /td SHA256 /fd SHA256 /sha1 THUMBPRINT OBSBridge-Setup.exe
```

## Auto-Updates

Consider implementing auto-update functionality:

### Using Squirrel.Windows

```powershell
# Install Squirrel
dotnet add package Squirrel.Windows

# Create releases
Squirrel --releasify OBSBridge.1.0.0.nupkg
```

### Using ClickOnce

Configure in Visual Studio:
1. Project Properties → Publish
2. Enable ClickOnce
3. Configure update location

## Distribution Checklist

- [ ] Build app in Release mode
- [ ] Test installer on clean Windows 11 machine
- [ ] Code sign installer
- [ ] Test installation and uninstallation
- [ ] Verify app launches correctly
- [ ] Test auto-update (if implemented)
- [ ] Create release notes
- [ ] Upload to distribution platform

## Recommended Approach

For **OBS Bridge**, we recommend:

1. **Development/Testing**: Use build output directly
2. **Internal Distribution**: Inno Setup (simplest)
3. **Public Distribution**: WiX MSI (most compatible)
4. **Microsoft Store**: MSIX package

Each has trade-offs in complexity, features, and compatibility.
