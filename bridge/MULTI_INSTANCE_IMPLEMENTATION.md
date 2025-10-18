# OBS Bridge Multi-Instance Implementation

## Overview

The OBS Bridge macOS application has been successfully enhanced to support multiple OBS Studio instances simultaneously. This implementation allows users to create, manage and control multiple OBS connections through a single application with a modern, intuitive interface.

## Key Features

### 1. Profile Management
- **Create Multiple Profiles**: Each profile represents a unique OBS Studio instance configuration
- **Enable/Disable Profiles**: Profiles can be toggled on/off without deleting them
- **Profile Editing**: Full support for editing existing profiles
- **Profile Validation**: Ensures unique client IDs and profile names
- **Automatic Migration**: Existing settings are automatically migrated to a profile on first launch

### 2. Multi-Instance Support
- **Simultaneous Connections**: Run multiple OBS instances at the same time
- **Independent Operation**: Each instance has its own connection state and configuration
- **Bulk Operations**: Start all enabled instances or stop all running instances with one click
- **Individual Control**: Start, stop or restart each instance independently

### 3. Enhanced Logging
- **Instance Prefixes**: All log entries are prefixed with `[Instance Name]` for easy identification
- **Combined Log View**: See activity from all instances in a unified view
- **Per-Instance Filtering**: Logs maintain instance attribution for filtering
- **Configurable Limits**: Maximum of 500 combined log entries, 100 per instance

### 4. Modern UI
- **Dashboard View**: Grid layout showing status of all instances at a glance
- **Real-time Status**: Live connection state indicators for OBS and server connections
- **Profile Management**: Dedicated interface for managing profiles
- **Statistics**: Overview of total, enabled, running and connected instances

## Architecture

### New Components

#### Data Models
- **OBSProfile** (`OBSProfile.swift`): Codable model for profile storage
  - Includes all connection settings (OBS host, port, password, server URL, client ID)
  - Supports enable/disable state
  - Includes metadata (notes, creation date, last modified)
  - Built-in validation

#### Managers
- **ProfileManager** (`ProfileManager.swift`): Singleton managing profile CRUD operations
  - Persists profiles to UserDefaults as JSON
  - Automatic migration from legacy settings
  - Validation for unique names and client IDs
  - Import/export functionality (future enhancement)

- **InstanceManager** (`InstanceManager.swift`): Coordinates multiple BridgeManager instances
  - Creates BridgeInstance for each profile
  - Syncs with ProfileManager changes
  - Manages bulk operations (start all, stop all)
  - Aggregates logs from all instances
  - Provides statistics

#### Views
- **ProfileListView** (`ProfileListView.swift`): Management interface for profiles
  - Shows all profiles with status indicators
  - Inline controls for start/stop, enable/disable
  - Statistics dashboard
  - Delete confirmation dialogs

- **ProfileFormView** (`ProfileFormView.swift`): Form for creating/editing profiles
  - Validation with error messages
  - Auto-generates unique client IDs
  - Supports both create and edit modes

- **ContentView** (redesigned): Multi-instance dashboard
  - Tab-based interface (Dashboard / Activity Log)
  - Grid view of all instances
  - Combined activity log
  - Quick statistics in header
  - Bulk operation controls

### Enhanced Components

#### BridgeManager
- Now accepts `instanceName` parameter
- Prefixes all log entries with instance name: `[Instance Name] message`
- Added `clearLogs()` method
- LogEntry enhanced with `instanceName` field

#### AppSettings
- Modified to support both singleton (shared) and instance-based usage
- Constructor for creating non-persistent instances from profiles
- Settings no longer auto-save to UserDefaults for profile-based instances

## Usage Guide

### Creating Your First Profile

1. Launch the app
2. Click "Manage Profiles" or ⌘,
3. Click "Add Profile" (+ button)
4. Configure:
   - **Profile Name**: Descriptive name (e.g., "Main Studio")
   - **OBS Host**: IP address or hostname (default: localhost)
   - **OBS Port**: WebSocket port (default: 4455)
   - **OBS Password**: WebSocket password
   - **Server URL**: Backend server WebSocket URL
   - **Client ID**: Auto-generated unique identifier
   - **Notes**: Optional description
5. Click "Create Profile"

### Managing Profiles

From the Profile Management window:
- **Enable/Disable**: Toggle switch next to each profile
- **Start/Stop**: Play/Stop buttons for individual instances
- **Edit**: Pencil icon to modify settings
- **Delete**: Trash icon (with confirmation)
- **View Statistics**: Header shows totals, enabled, running and connected counts

### Running Multiple Instances

From the main dashboard:
- **Start All**: Starts all enabled profiles
- **Stop All**: Stops all running instances
- **Individual Control**: Each instance card has start/stop/restart buttons
- **Monitor Status**: Connection state shown for both OBS and server
- **View Logs**: Switch to "Activity Log" tab to see combined activity

### Activity Logging

All logs include instance name prefix:
```
[Main Studio] Starting OBS Bridge...
[Main Studio] Connected to OBS
[Main Studio] Connected to website
[Backup Studio] Starting OBS Bridge...
[Backup Studio] Connected to OBS
```

## Technical Details

### Profile Storage

Profiles are stored in UserDefaults as JSON:
```swift
UserDefaults.standard.data(forKey: "obsProfiles")
```

Using Codable with ISO8601 date encoding for cross-session compatibility.

### Legacy Settings Migration

On first launch with the new version:
1. Checks for legacy settings (`obsHost`, `obsPort`, etc.)
2. If found and no profiles exist, creates "Migrated Profile"
3. Marks migration complete to prevent re-running

### Instance Lifecycle

1. **Profile Created** → InstanceManager creates BridgeInstance
2. **Profile Enabled** → Instance can be started
3. **Instance Started** → BridgeManager connects to OBS and server
4. **Profile Modified** → Instance restarts if running
5. **Profile Deleted** → Instance stopped and removed

### Memory Management

- Managers use singleton pattern
- BridgeInstances use weak references where appropriate
- Combine subscriptions properly stored in cancellables
- Logs limited to prevent unbounded growth:
  - 100 entries per instance
  - 500 combined entries total

## File Structure

```
OBSBridge/
├── OBSBridgeApp.swift          # App entry point (modified)
├── ContentView.swift            # Main dashboard (redesigned)
├── AppSettings.swift            # Settings model (enhanced)
├── BridgeManager.swift          # Bridge coordinator (enhanced)
├── OBSWebSocketClient.swift     # OBS protocol (unchanged)
├── WebsiteWebSocketClient.swift # Server protocol (unchanged)
├── OBSProfile.swift             # Profile model (new)
├── ProfileManager.swift         # Profile CRUD (new)
├── InstanceManager.swift        # Multi-instance coordinator (new)
├── ProfileListView.swift        # Profile management UI (new)
├── ProfileFormView.swift        # Profile form UI (new)
└── SettingsView.swift           # Legacy settings (unchanged)
```

## macOS Design Principles

This implementation follows macOS best practices:

### SwiftUI & AppKit Integration
- Pure SwiftUI implementation
- Native macOS controls and styling
- Proper window management
- Keyboard shortcuts (⌘, for Manage Profiles)

### Data Management
- Codable for serialisation
- UserDefaults for simple persistence
- ObservableObject for reactive updates
- @Published properties for UI binding

### Architecture
- MVVM pattern
- Singleton managers
- Separation of concerns
- Protocol-oriented where appropriate

### User Experience
- Non-destructive operations (enable/disable vs delete)
- Confirmation dialogs for destructive actions
- Real-time status updates
- Clear visual feedback
- Tooltips for additional context

## Backend Compatibility

The implementation is fully compatible with the existing NestJS backend:

- Each profile generates a unique `clientId`
- Server identifies instances by `clientId`
- Existing OBSInstance database model supports multiple instances
- WebSocket message format unchanged
- Event and command routing works identically

## Deployment Target

- **Minimum macOS Version**: 13.0 (Ventura)
- **Swift Version**: 5.0
- **Xcode Version**: 15.0+
- **Architecture**: Universal (Apple Silicon + Intel)

## Building

```bash
cd /Users/martinpalastanga/code/SchedulingApp/bridge
xcodebuild -project OBSBridge.xcodeproj \
  -scheme OBSBridge \
  -configuration Release \
  build
```

The app will be built to:
```
~/Library/Developer/Xcode/DerivedData/OBSBridge-*/Build/Products/Release/OBSBridge.app
```

## Future Enhancements

Potential improvements:
1. **Profile Import/Export**: Share profiles between machines
2. **Keychain Integration**: Secure password storage
3. **iCloud Sync**: Sync profiles across devices
4. **Profile Templates**: Quick setup for common configurations
5. **Advanced Filtering**: Filter logs by instance, level or time range
6. **Notifications**: System notifications for connection state changes
7. **Auto-reconnect**: Automatic reconnection on network failure
8. **Profile Groups**: Organise profiles into folders
9. **Hotkeys**: Keyboard shortcuts for starting specific profiles
10. **Dark Mode Support**: Enhanced dark mode styling

## Known Limitations

1. No auto-reconnect on network failure (requires manual restart)
2. Passwords stored in UserDefaults (should use Keychain)
3. No profile search/filtering (acceptable for small numbers)
4. Window size fixed (not resizable)
5. No drag-and-drop profile reordering

## Testing

To test multi-instance functionality:

1. **Setup**: Run multiple OBS Studio instances on different ports
   ```bash
   # Instance 1 (default)
   open -a "OBS"

   # Instance 2 (custom port - configure in OBS > Tools > WebSocket Server)
   # Set port to 4456
   ```

2. **Create Profiles**: Add profile for each OBS instance with correct ports

3. **Start All**: Click "Start All" and verify all instances connect

4. **Test Operations**:
   - Send commands from server to specific instances
   - Verify events from each instance arrive at server
   - Check logs show correct instance prefixes
   - Test stopping/starting individual instances

5. **Test Persistence**: Quit and relaunch app, verify profiles persist

## Troubleshooting

### Profiles not showing
- Check UserDefaults: `defaults read com.obsbridge.app obsProfiles`
- Verify ProfileManager initialised: Check console logs

### Instance won't start
- Verify profile is enabled
- Check OBS WebSocket is running
- Confirm port is correct
- Verify password matches

### Logs not showing instance name
- Check LogEntry includes `instanceName`
- Verify BridgeManager receives `instanceName` in init
- Confirm logs use `addLog()` method

## Conclusion

The multi-instance implementation provides a robust, scalable solution for managing multiple OBS Studio connections. The architecture is clean, maintainable and follows macOS design principles whilst maintaining full backward compatibility with the existing backend infrastructure.

---

**Version**: 2.0
**Date**: 18 October 2025
**Author**: Claude Code
**Status**: ✅ Build Successful
