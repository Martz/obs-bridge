# OBS Bridge - Platform Comparison

This document compares the features and capabilities of OBS Bridge across different platforms.

## Platform Support Matrix

| Platform | Status | Version | Technology Stack |
|----------|--------|---------|------------------|
| **Windows 11** | ✅ Available | 1.0.0 | .NET 8.0 + WPF |
| **macOS** | ✅ Available | 1.0.0 | Swift + SwiftUI |
| **Python/CLI** | ✅ Available | 1.0.0 | Python 3.7+ |
| **Linux** | ⏳ Planned | - | Python (existing) or .NET MAUI |

## Feature Comparison

### Core Features

| Feature | Windows | macOS | Python |
|---------|---------|-------|--------|
| OBS WebSocket v5 Support | ✅ | ✅ | ✅ |
| Website WebSocket Connection | ✅ | ✅ | ✅ |
| Real-time Command Execution | ✅ | ✅ | ✅ |
| Event Streaming | ✅ | ✅ | ✅ |
| Secure Authentication | ✅ | ✅ | ✅ |
| Auto Reconnection | ✅ | ✅ | ✅ |

### User Interface

| Feature | Windows | macOS | Python |
|---------|---------|-------|--------|
| Native GUI | ✅ WPF | ✅ SwiftUI | ❌ CLI only |
| Settings Panel | ✅ | ✅ | ⚙️ .env file |
| Connection Status Indicators | ✅ Visual | ✅ Visual | 📝 Logs |
| Activity Log Display | ✅ Scrollable | ✅ Scrollable | 📝 Console |
| Real-time Log Updates | ✅ | ✅ | ✅ |
| Clear Log Function | ✅ | ✅ | ❌ |

### Configuration

| Feature | Windows | macOS | Python |
|---------|---------|-------|--------|
| Settings Storage | JSON in AppData | UserDefaults | .env file |
| Settings Validation | ✅ | ✅ | ⚠️ Runtime |
| Auto-connect on Startup | ✅ | ✅ | ⚙️ Manual script |
| Settings Import/Export | ⏳ Planned | ⏳ Planned | ✅ File copy |

### Installation & Distribution

| Feature | Windows | macOS | Python |
|---------|---------|-------|--------|
| Installation Method | MSI/MSIX/Inno Setup | DMG/PKG | pip install |
| Code Signing | ✅ Supported | ✅ Supported | N/A |
| Auto Updates | ⏳ Planned | ⏳ Planned | pip upgrade |
| Microsoft Store | ✅ Possible (MSIX) | N/A | N/A |
| Mac App Store | N/A | ✅ Possible | N/A |
| Dependencies | .NET 8.0 Runtime | None (bundled) | Python + packages |

### System Integration

| Feature | Windows | macOS | Python |
|---------|---------|-------|--------|
| Start Menu / Launchpad | ✅ | ✅ | ❌ |
| Desktop Shortcut | ✅ Optional | ✅ | ❌ |
| System Tray | ⏳ Planned | ⏳ Planned | ❌ |
| Startup on Login | ⏳ Planned | ✅ | ⚙️ Manual |
| Notifications | ⏳ Planned | ⏳ Planned | ❌ |

### Command Support

All platforms support the same OBS WebSocket v5 commands:

| Command Category | Support |
|-----------------|---------|
| Scene Management | ✅ All platforms |
| Streaming Control | ✅ All platforms |
| Recording Control | ✅ All platforms |
| Source Management | ✅ All platforms |
| Filter Control | ✅ All platforms |
| Transitions | ✅ All platforms |
| Virtual Cam | ✅ All platforms |
| Output Management | ✅ All platforms |

### Protocol Compatibility

| Protocol Feature | Windows | macOS | Python |
|-----------------|---------|-------|--------|
| OBS WebSocket v5 | ✅ Full support | ✅ Full support | ✅ Full support |
| OBS WebSocket v4 | ⚙️ Command mapping* | ⚙️ Command mapping* | ⚠️ Possible with older lib |
| Custom Authentication | ✅ SHA-256 | ✅ SHA-256 | ✅ SHA-256 |
| SSL/TLS for Website | ✅ | ✅ | ✅ |
| Compression | ⏳ Planned | ⏳ Planned | ❌ |

*Windows and macOS apps use WebSocket v5 protocol but accept v4 command names from websites (e.g., "StartStreaming") and automatically map them to v5 names (e.g., "StartStream"). The actual connection to OBS uses v5 protocol only.

## User Experience

### Ease of Use

| Aspect | Windows | macOS | Python |
|--------|---------|-------|--------|
| Installation Difficulty | ⭐⭐ Easy | ⭐⭐ Easy | ⭐⭐⭐ Moderate |
| Configuration Difficulty | ⭐⭐ GUI | ⭐⭐ GUI | ⭐⭐⭐ Text file |
| Learning Curve | ⭐⭐ Low | ⭐⭐ Low | ⭐⭐⭐⭐ Moderate |
| Visual Feedback | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Basic |

### Performance

| Metric | Windows | macOS | Python |
|--------|---------|-------|--------|
| Memory Usage | ~50-80 MB | ~40-60 MB | ~30-50 MB |
| CPU Usage (idle) | <1% | <1% | <1% |
| Startup Time | ~2-3 sec | ~1-2 sec | ~1 sec |
| Response Latency | <50ms | <50ms | <50ms |

## Development & Maintenance

| Aspect | Windows | macOS | Python |
|--------|---------|-------|--------|
| Code Language | C# | Swift | Python |
| Framework | .NET 8.0 + WPF | SwiftUI | asyncio |
| Build System | MSBuild/dotnet | Xcode/xcodebuild | N/A |
| Testing | ⏳ Unit tests planned | ⏳ Unit tests planned | ⏳ Planned |
| Documentation | ✅ Comprehensive | ✅ Comprehensive | ✅ Good |
| Code Maintainability | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good |

## Recommended Use Cases

### Windows App
**Best for:**
- Windows 11 users wanting native integration
- Users preferring GUI over command line
- Streamers who want visual connection monitoring
- Those needing easy configuration management
- Users distributing to non-technical users

**Requirements:**
- Windows 10 1809+ or Windows 11
- .NET 8.0 Runtime
- ~100 MB disk space

### macOS App
**Best for:**
- macOS users (13.0+) wanting native integration
- Users preferring GUI over command line
- Mac-based streamers
- Integration with macOS ecosystem

**Requirements:**
- macOS 13.0 (Ventura) or later
- ~50 MB disk space
- No external dependencies

### Python Bridge
**Best for:**
- Cross-platform deployments
- Linux users
- Server/headless environments
- Advanced users comfortable with CLI
- Development and testing
- Custom integrations and modifications

**Requirements:**
- Python 3.7+
- pip packages (websockets, obs-websocket-py, python-dotenv)
- Minimal disk space

## Migration Between Platforms

### Settings Migration

| From → To | Process |
|-----------|---------|
| Python → Windows | Manually copy values from `.env` to Settings panel |
| Python → macOS | Manually copy values from `.env` to Settings panel |
| Windows → macOS | Copy values from Settings UI to Settings UI |
| macOS → Windows | Copy values from Settings UI to Settings UI |

**Note**: Configuration structure is similar across platforms, making migration straightforward.

### Client ID Consistency

To maintain the same client ID across platforms:
1. Note your Client ID from the original platform
2. Set the same Client ID in the new platform's settings
3. This ensures your website recognizes it as the same client

## Future Roadmap

### Planned Features (All Platforms)

- ⏳ System tray/menu bar support
- ⏳ Plugin system for custom commands
- ⏳ Multi-language support
- ⏳ Dark/Light theme toggle
- ⏳ Connection profiles (multiple OBS instances)
- ⏳ Command scheduling
- ⏳ Macro support

### Platform-Specific Plans

**Windows:**
- ⏳ Windows 11 widget
- ⏳ Touch-optimized interface
- ⏳ Microsoft Store distribution
- ⏳ Windows Service mode

**macOS:**
- ⏳ Menu bar-only mode
- ⏳ Mac App Store distribution
- ⏳ Shortcuts integration
- ⏳ Widget support

**Python:**
- ⏳ Linux systemd service
- ⏳ Docker container
- ⏳ PyPI package
- ⏳ Web UI option

## Community & Support

All platforms share:
- Same GitHub repository
- Same issue tracker
- Same documentation site
- Same WebSocket protocol
- Compatible server implementations

## Conclusion

Choose the platform that best fits your needs:

- **Need native Windows experience?** → Use Windows App
- **Need native macOS experience?** → Use macOS App  
- **Need cross-platform or Linux support?** → Use Python Bridge
- **Running on a server?** → Use Python Bridge
- **Prefer GUI?** → Use Windows or macOS App
- **Prefer CLI?** → Use Python Bridge

All platforms provide the same core functionality and are maintained to feature parity where applicable.
