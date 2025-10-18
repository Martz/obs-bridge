# Multi-Profile OBS Management Guide

## Overview

The system now supports multiple OBS profiles connecting simultaneously. Each profile appears as an independent, controllable row in the admin panel.

## How It Works

### Bridge Application (macOS)

1. **Profile Creation**: Users create multiple profiles in the OBS Bridge app
   - Each profile has a unique Client ID (e.g., `obs-studio-a-abc123`, `obs-studio-b-def456`)
   - Each profile can connect to different OBS instances or the same instance with different configurations
   - Profiles can be enabled/disabled and started/stopped independently

2. **Connection**: When a profile starts, it:
   - Connects to its configured OBS Studio instance via WebSocket
   - Connects to the server WebSocket endpoint at `/obs`
   - Sends a registration message with its unique Client ID

### Server API

1. **Auto-Registration**: When a new Client ID connects for the first time:
   - The server automatically creates an `OBSInstance` record in the database
   - Uses the Client ID as both the identifier and default name
   - Status is set to `online`

2. **Connection Tracking**: The server tracks each profile independently:
   - Each Client ID has its own WebSocket connection
   - Connection status (online/offline) is maintained separately
   - Commands are sent to specific Client IDs

3. **State Management**: Each profile reports its own state:
   - Streaming status
   - Recording status
   - Current scene
   - Available scenes
   - Connection timestamps

### Admin Panel

1. **Display**: Each profile appears as a separate row in the "OBS Connections" table:
   - Shows profile name (editable friendly name)
   - Shows Client ID (unique identifier from bridge)
   - Shows connection status (online/offline)
   - Shows activity state (streaming/recording/idle)
   - Shows current scene with dropdown to change

2. **Independent Control**: Each row has its own control buttons:
   - Start Recording
   - Stop Recording
   - Edit Profile (change friendly name, location, description)
   - Delete Profile (removes from database, can reconnect)

3. **Real-time Updates**: The panel refreshes every 3 seconds:
   - Connection status updates
   - Activity state changes
   - Scene list updates
   - Statistics refresh

## Workflow

### Setting Up Multiple Profiles

1. **In Bridge App**:
   - Click "Manage Profiles"
   - Create profiles for each OBS connection you need
   - Each profile gets a unique Client ID (auto-generated)
   - Configure OBS connection details for each profile
   - Start the profiles you want to use

2. **In Admin Panel**:
   - Navigate to "OBS Connections" page
   - Profiles will automatically appear as they connect
   - Optionally edit the profile names to be more descriptive
   - Control each profile independently

### Example Use Cases

**Multi-Camera Setup**:
- Profile 1: "Main Camera" → Controls OBS instance for main camera
- Profile 2: "Secondary Camera" → Controls OBS instance for secondary camera
- Profile 3: "Screen Capture" → Controls OBS instance for screen recording

**Multi-Machine Setup**:
- Profile 1: "Studio A OBS" → Connects to OBS on machine A
- Profile 2: "Studio B OBS" → Connects to OBS on machine B
- Profile 3: "Mobile Rig OBS" → Connects to OBS on mobile setup

**Single Machine, Multiple Purposes**:
- Profile 1: "Lecture Recording" → Scene set for lectures
- Profile 2: "Lab Demo" → Scene set for lab demonstrations
- Profile 3: "Presentation" → Scene set for presentations

## Technical Details

### Client ID Format

Client IDs are automatically generated in the format:
```
obs-{profile-name}-{8-char-uuid}
```

Example: `obs-studio-a-abc12345`

### Database Schema

Each profile is stored as an `OBSInstance` record:
```typescript
{
  id: string;              // Database UUID
  clientId: string;        // Unique Client ID from bridge (indexed)
  name: string;            // Friendly name (editable)
  location?: string;       // Physical location (optional)
  description?: string;    // Notes/description (optional)
  capacity: number;        // Booking capacity (default: 1)
  status: 'online' | 'offline' | 'busy';
  isStreaming: boolean;
  isRecording: boolean;
  currentScene?: string;
  scenes?: string[];
  connectedAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### WebSocket Protocol

Registration message from bridge:
```json
{
  "type": "register",
  "clientId": "obs-studio-a-abc12345"
}
```

Command from server to profile:
```json
{
  "type": "command",
  "command": "StartRecording",
  "params": {}
}
```

Event from profile to server:
```json
{
  "type": "obs_event",
  "clientId": "obs-studio-a-abc12345",
  "event": "RecordStateChanged",
  "data": { "outputActive": true }
}
```

## Troubleshooting

### Profile Not Appearing in Admin Panel

1. Check that the profile is started in the Bridge app
2. Check the Bridge app logs for connection errors
3. Verify the WebSocket URL is correct in the profile settings
4. Check server logs for registration messages

### Commands Not Working

1. Verify the profile status is "online" in the admin panel
2. Check that OBS Studio is running and WebSocket server is enabled
3. Check the Bridge app logs for command responses
4. Verify the OBS WebSocket password matches in the profile settings

### Multiple Profiles Conflicting

- Each profile should have a unique Client ID
- Profiles can connect to the same OBS instance if needed
- The admin panel treats each Client ID as independent
