# OBS Bridge Windows App - Architecture Diagram

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OBS Bridge Windows App                    │
│                          (WPF Application)                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────────┐   ┌──────────────────────┐
        │   MainWindow.xaml     │   │ SettingsWindow.xaml  │
        │  (Primary Interface)  │   │  (Configuration UI)  │
        └───────────────────────┘   └──────────────────────┘
                    │
                    │ Uses
                    ▼
        ┌───────────────────────┐
        │    BridgeManager      │
        │  (Core Coordinator)   │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌────────────────────────┐
│ OBSWebSocket     │   │ WebsiteWebSocket       │
│ Client           │   │ Client                 │
└──────────────────┘   └────────────────────────┘
        │                       │
        │ WebSocket v5          │ WebSocket
        │ (localhost:4455)      │ (ws://...)
        ▼                       ▼
┌──────────────────┐   ┌────────────────────────┐
│   OBS Studio     │   │  Control Website       │
│ (Local Process)  │   │  (Remote Server)       │
└──────────────────┘   └────────────────────────┘
```

## Component Structure

```
OBSBridge/
│
├── App.xaml / App.xaml.cs
│   └── Application Entry Point
│       ├── Initialize AppSettings
│       └── Launch MainWindow
│
├── MainWindow.xaml / MainWindow.xaml.cs
│   ├── UI Components:
│   │   ├── Header (Title + Settings Button)
│   │   ├── Connection Status Panel
│   │   │   ├── OBS Status Indicator
│   │   │   └── Website Status Indicator
│   │   ├── Activity Log
│   │   │   ├── Scrollable Log View
│   │   │   └── Clear Button
│   │   └── Control Panel
│   │       ├── Auto-Connect Checkbox
│   │       ├── Start Button
│   │       └── Stop Button
│   └── Logic:
│       ├── Initialize BridgeManager
│       ├── Handle UI Events
│       ├── Update Status Indicators
│       └── Manage Button States
│
├── SettingsWindow.xaml / SettingsWindow.xaml.cs
│   ├── UI Components:
│   │   ├── OBS Settings Section
│   │   │   ├── Host TextBox
│   │   │   ├── Port TextBox
│   │   │   └── Password PasswordBox
│   │   ├── Website Settings Section
│   │   │   ├── URL TextBox
│   │   │   └── Client ID TextBox
│   │   ├── Error Display
│   │   └── Action Buttons
│   │       ├── Save Button
│   │       └── Cancel Button
│   └── Logic:
│       ├── Load Settings
│       ├── Validate Input
│       └── Save Settings
│
├── AppSettings.cs
│   ├── Properties:
│   │   ├── ObsHost
│   │   ├── ObsPort
│   │   ├── ObsPassword
│   │   ├── WebsiteUrl
│   │   ├── ClientId
│   │   └── AutoConnect
│   ├── Methods:
│   │   ├── Load() - From JSON
│   │   ├── Save() - To JSON
│   │   └── Validate() - Input validation
│   └── Storage:
│       └── %APPDATA%\OBSBridge\settings.json
│
├── BridgeManager.cs
│   ├── Properties:
│   │   ├── IsRunning
│   │   ├── Logs (ObservableCollection)
│   │   ├── ObsConnectionState
│   │   ├── WebsiteConnectionState
│   │   └── ObsVersion
│   ├── Methods:
│   │   ├── StartAsync() - Start both clients
│   │   ├── StopAsync() - Stop both clients
│   │   ├── HandleCommandAsync() - Route commands
│   │   ├── MapCommandToOBSRequest() - v4 → v5
│   │   └── AddLog() - Log management
│   └── Dependencies:
│       ├── OBSWebSocketClient
│       └── WebsiteWebSocketClient
│
├── OBSWebSocketClient.cs
│   ├── Properties:
│   │   ├── ConnectionState
│   │   └── ObsVersion
│   ├── Methods:
│   │   ├── ConnectAsync() - Connect to OBS
│   │   ├── DisconnectAsync() - Disconnect
│   │   ├── ExecuteCommandAsync() - Send command
│   │   ├── ReceiveMessagesAsync() - Message loop
│   │   ├── HandleMessageAsync() - Parse messages
│   │   ├── HandleHelloAsync() - Authentication
│   │   └── HandleRequestResponse() - Responses
│   └── Protocol:
│       ├── Op Code 0: Hello
│       ├── Op Code 1: Identify
│       ├── Op Code 2: Identified
│       ├── Op Code 6: Request
│       └── Op Code 7: RequestResponse
│
└── WebsiteWebSocketClient.cs
    ├── Properties:
    │   └── ConnectionState
    ├── Methods:
    │   ├── ConnectAsync() - Connect to website
    │   ├── DisconnectAsync() - Disconnect
    │   ├── SendCommandResponseAsync() - Send response
    │   ├── SendRegistrationAsync() - Register client
    │   ├── ReceiveMessagesAsync() - Message loop
    │   └── HandleMessageAsync() - Parse commands
    └── Messages:
        ├── Registration: { type: "register", ... }
        ├── Response: { type: "command_response", ... }
        └── Command: { type: "command", ... }
```

## Data Flow

### Startup Flow
```
User Launches App
    │
    ├─> App.xaml.cs initializes
    │   └─> AppSettings.Initialize()
    │       └─> Load settings from JSON
    │
    └─> MainWindow opens
        ├─> BridgeManager created
        │   ├─> OBSWebSocketClient created
        │   └─> WebsiteWebSocketClient created
        │
        └─> If AutoConnect enabled
            └─> StartAsync() called
```

### Connection Flow
```
User Clicks "Start Bridge"
    │
    ├─> MainWindow.StartButton_Click()
    │   └─> BridgeManager.StartAsync()
    │       │
    │       ├─> Validate Settings
    │       │
    │       ├─> OBSWebSocketClient.ConnectAsync()
    │       │   ├─> Connect WebSocket
    │       │   ├─> Receive Hello (Op 0)
    │       │   ├─> Send Identify (Op 1) with auth
    │       │   ├─> Receive Identified (Op 2)
    │       │   └─> Update ConnectionState → Connected
    │       │
    │       └─> WebsiteWebSocketClient.ConnectAsync()
    │           ├─> Connect WebSocket
    │           ├─> Send Registration message
    │           └─> Update ConnectionState → Connected
    │
    └─> UI updates to show green indicators
```

### Command Execution Flow
```
Website sends command
    │
    ├─> WebsiteWebSocketClient.ReceiveMessagesAsync()
    │   └─> Parse JSON message
    │       └─> Extract command & params
    │           │
    │           └─> OnMessageReceived callback
    │               │
    │               └─> BridgeManager.HandleCommandAsync()
    │                   │
    │                   ├─> Log: "← Received command"
    │                   │
    │                   ├─> Map command name (v4 → v5)
    │                   │   Example: "StartStreaming" → "StartStream"
    │                   │
    │                   ├─> Transform parameters
    │                   │   Example: "scene-name" → "sceneName"
    │                   │
    │                   ├─> OBSWebSocketClient.ExecuteCommandAsync()
    │                   │   ├─> Create request (Op 6)
    │                   │   ├─> Send to OBS
    │                   │   ├─> Wait for response (Op 7)
    │                   │   └─> Return result
    │                   │
    │                   ├─> Log: "→ Sending to OBS"
    │                   │
    │                   ├─> Log: "✓ Success" or "✗ Error"
    │                   │
    │                   └─> WebsiteWebSocketClient.SendCommandResponseAsync()
    │                       └─> Send result to website
    │
    └─> UI log updates with colored entries
```

### Settings Update Flow
```
User Clicks Settings Button
    │
    ├─> SettingsWindow opens
    │   └─> Load current AppSettings
    │       └─> Populate form fields
    │
    └─> User edits and clicks Save
        │
        ├─> Validate all inputs
        │   ├─> Check required fields
        │   ├─> Validate formats
        │   └─> Show errors if invalid
        │
        └─> If valid:
            ├─> Update AppSettings properties
            ├─> AppSettings.Save()
            │   └─> Write to JSON file
            └─> Close window
```

## Thread Safety

```
UI Thread (Main)
    │
    ├─> UI Updates
    │   └─> Via Dispatcher.Invoke()
    │
    └─> Property Change Notifications
        └─> Via INotifyPropertyChanged

Background Threads
    │
    ├─> WebSocket Receive Loops
    │   ├─> OBSWebSocketClient
    │   └─> WebsiteWebSocketClient
    │
    └─> Async Operations
        ├─> ConnectAsync()
        ├─> DisconnectAsync()
        └─> ExecuteCommandAsync()

Synchronization
    │
    ├─> ObservableCollection (thread-safe on UI thread)
    ├─> Dispatcher for UI updates
    └─> Async/await for coordination
```

## Error Handling Strategy

```
Layer 1: UI Validation
    ├─> Settings input validation
    ├─> Required field checks
    └─> Format validation

Layer 2: Business Logic
    ├─> Settings.Validate()
    ├─> Connection state checks
    └─> Command validation

Layer 3: Network Operations
    ├─> Try-catch in WebSocket operations
    ├─> Connection timeout handling
    └─> Authentication failure handling

Layer 4: OBS Protocol
    ├─> Response status checks
    ├─> RequestResponse parsing
    └─> Error message extraction

Logging
    └─> All errors logged to Activity Log
        ├─> User-friendly messages
        ├─> Color-coded by severity
        └─> Timestamped
```

## Memory Management

```
Lifecycle Management
    │
    ├─> Application startup
    │   ├─> Create AppSettings (singleton)
    │   ├─> Create MainWindow
    │   └─> Create BridgeManager
    │
    ├─> During operation
    │   ├─> WebSocket clients (2 instances)
    │   ├─> Log entries (max 100)
    │   └─> Pending requests (cleared after response)
    │
    └─> Application shutdown
        ├─> Stop BridgeManager
        ├─> Dispose WebSocket clients
        └─> Save settings
```

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Testable components
- ✅ Maintainable code structure
- ✅ Extensible design
- ✅ Robust error handling
- ✅ Efficient resource usage
