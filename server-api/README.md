# OBS Bridge API Server

A NestJS-based WebSocket and REST API server for controlling OBS Studio remotely via the OBS Bridge.

## Features

- WebSocket server for OBS client connections
- REST API for sending commands to OBS instances
- Client registration and management
- Automatic periodic health checks (ping every 30 seconds)
- Event handling from OBS
- Static file serving for demo control panel
- Health endpoint for monitoring

## Installation

```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

The server will start on port 8000 by default.

## Configuration

You can configure the server port using the `PORT` environment variable:

```bash
PORT=3000 npm run start
```

## API Endpoints

### WebSocket

**Endpoint:** `ws://localhost:8000/obs`

The WebSocket endpoint is used by OBS Bridge clients to connect and communicate with the server.

#### Message Types (from OBS clients)

1. **Register**
   ```json
   {
     "type": "register",
     "clientId": "unique-client-id"
   }
   ```

2. **OBS Event**
   ```json
   {
     "type": "obs_event",
     "clientId": "unique-client-id",
     "event": "StreamStarted",
     "data": {}
   }
   ```

3. **Command Response**
   ```json
   {
     "type": "command_response",
     "clientId": "unique-client-id",
     "command": "StartStreaming",
     "success": true,
     "data": {}
   }
   ```

4. **Pong**
   ```json
   {
     "type": "pong",
     "clientId": "unique-client-id"
   }
   ```

### REST API

#### Get Connected Clients

```http
GET /api/clients
```

**Response:**
```json
{
  "clients": [
    {
      "clientId": "client-1",
      "connected": "2025-10-18T12:00:00.000Z"
    }
  ]
}
```

#### Send Command to Specific Client

```http
POST /api/command/:clientId
Content-Type: application/json

{
  "command": "StartStreaming",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Command sent"
}
```

#### Broadcast Command to All Clients

```http
POST /api/broadcast
Content-Type: application/json

{
  "command": "StopStreaming",
  "params": {}
}
```

**Response:**
```json
{
  "success": true,
  "clientsSent": 3
}
```

#### Quick Actions

```http
POST /api/action/:clientId/:action
```

Available actions:
- `start-stream` → StartStreaming
- `stop-stream` → StopStreaming
- `start-recording` → StartRecording
- `stop-recording` → StopRecording
- `status` → GetStreamingStatus
- `scenes` → GetSceneList

**Example:**
```http
POST /api/action/client-1/start-stream
```

**Response:**
```json
{
  "success": true,
  "message": "Action 'start-stream' sent"
}
```

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "clients": 2,
  "uptime": 3600.5
}
```

## Demo Control Panel

Access the demo control panel at `http://localhost:8000/` to interact with connected OBS clients through a web interface.

## Project Structure

```
server-api/
├── src/
│   ├── obs/
│   │   ├── dto/                    # Data Transfer Objects
│   │   │   └── command.dto.ts
│   │   ├── interfaces/             # TypeScript interfaces
│   │   │   ├── obs-client.interface.ts
│   │   │   └── obs-message.interface.ts
│   │   ├── obs.controller.ts       # REST API endpoints
│   │   ├── obs.gateway.ts          # WebSocket gateway
│   │   ├── obs-client.service.ts   # Client management service
│   │   ├── obs.scheduler.ts        # Periodic tasks
│   │   └── obs.module.ts           # OBS module
│   ├── health/
│   │   ├── health.controller.ts    # Health check endpoint
│   │   └── health.module.ts
│   ├── app.module.ts
│   └── main.ts
├── public/
│   └── demo.html                   # Demo control panel
└── package.json
```

## OBS Commands

Common OBS commands you can send:

- `StartStreaming` - Start streaming
- `StopStreaming` - Stop streaming
- `StartRecording` - Start recording
- `StopRecording` - Stop recording
- `GetStreamingStatus` - Get current streaming status
- `GetSceneList` - Get list of scenes
- `SetCurrentScene` - Switch to a different scene

For a full list of available commands, refer to the OBS WebSocket protocol documentation.

## Migration from Example Server

This NestJS server provides the same API as the original `example-server.ts`, making it a drop-in replacement. The key differences are:

1. **Architecture:** Built on NestJS framework with proper dependency injection and modular structure
2. **Scalability:** Better organised code that's easier to extend and maintain
3. **Type Safety:** Enhanced TypeScript typing with DTOs and validation
4. **Production Ready:** Includes proper error handling, logging, and configuration management

## Development

### Build
```bash
npm run build
```

### Format Code
```bash
npm run format
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test
```

## License

MIT
