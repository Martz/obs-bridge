# OBS Recording Scheduler - AI Coding Agent Instructions

## Project Overview

This is a **monorepo** for remotely controlling and scheduling OBS Studio recording sessions. The system consists of 5 interconnected components that communicate via WebSocket and REST APIs.

### Core Architecture

```
┌────────────┐     REST/WS      ┌──────────────┐     WebSocket     ┌──────────┐     Local WS     ┌────────┐
│ Admin Panel├─────────────────►│  Server API  ├──────────────────►│  Bridge  ├────────────────►│  OBS   │
│ (Next.js)  │                  │  (NestJS)    │                   │ (Swift/  │                 │ Studio │
└────────────┘                  │  Port: 8000  │                   │  Python) │                 └────────┘
┌────────────┐                  │  Path: /obs  │                   └──────────┘
│  Frontend  ├─────────────────►│              │
│  (React)   │                  └──────────────┘
└────────────┘
```

**Critical Understanding**: The Bridge is the *intermediary* - it connects OBS (local WebSocket v5 on port 4455) to the central server (remote WebSocket). The server never talks directly to OBS.

## Component Structure

### 1. `server-api/` (NestJS Backend)
- **Purpose**: Central WebSocket server + REST API for OBS control
- **Key Module**: `src/obs/` contains WebSocket gateway, client service, controller, scheduler
- **WebSocket Path**: `ws://localhost:8000/obs` (where bridges connect)
- **REST Endpoints**: `/api/clients`, `/api/command/:clientId`, `/api/action/:clientId/:action`, `/health`
- **Run Command**: `npm run start:dev` (from `server-api/`)
- **Health Checks**: Pings all connected clients every 30 seconds (`obs.scheduler.ts`)

### 2. `bridge/` (Swift macOS App)
- **Purpose**: Native macOS app connecting OBS to server
- **Protocol**: OBS WebSocket v5 (op codes: 0=Hello, 1=Identify, 2=Identified, 6=Request, 7=RequestResponse)
- **Key Files**: 
  - `BridgeManager.swift` - Coordinator between OBS and website clients
  - `OBSWebSocketClient.swift` - Handles OBS WebSocket v5 protocol
  - `WebsiteWebSocketClient.swift` - Handles server connection
- **Build**: `make build` or open `OBSBridge.xcodeproj` in Xcode
- **Requires**: macOS 13.0+, CommonCrypto module (setup via `./setup.sh`)

### 3. `obs_bridge.py` (Python Bridge Alternative)
- **Purpose**: Cross-platform alternative to macOS app
- **Dependencies**: `obsws-python==1.6.1`, `websockets==12.0`
- **Config**: `.env` file with `OBS_HOST`, `OBS_PORT`, `OBS_PASSWORD`, `WEBSITE_URL`, `CLIENT_ID`
- **Run**: `python obs_bridge.py` (after `pip install -r requirements.txt`)
- **Command Mapping**: Converts legacy commands (e.g., `StartStreaming`) to v5 API (e.g., `StartStream`)

### 4. `frontend/` (React + Vite)
- **Purpose**: User-facing booking interface
- **Tech**: React 19, Vite, Tailwind CSS, shadcn/ui, date-fns
- **Key Features**: Calendar selection, time slot browsing, OBS instance/scene selection
- **Run**: `npm run dev` (from `frontend/`, opens on http://localhost:5173)
- **Current State**: Uses mock data (`src/lib/mockData.ts`), no backend integration yet

### 5. `admin-panel/` (Next.js 14)
- **Purpose**: Admin dashboard for bookings, users, schedules, OBS instances
- **Tech**: Next.js 14, TypeScript, React, Tailwind CSS, shadcn/ui
- **Key Types**: `src/types/index.ts` defines `OBSInstance`, `Schedule`, `Booking`, `User`
- **Run**: `npm run dev` (from `admin-panel/`, opens on http://localhost:3000)
- **Environment**: Requires `.env` (copy from `.env.example`)

## Critical Development Workflows

### Starting the Full System (5 components)
```bash
# Terminal 1: Start server
cd server-api && npm run start:dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Start admin panel
cd admin-panel && npm run dev

# Terminal 4: Start Python bridge (or use macOS app)
python obs_bridge.py

# Terminal 5: OBS Studio must be running with WebSocket enabled
# Tools → WebSocket Server Settings → Enable (port 4455, set password)
```

**Critical**: The system requires at least **server-api + bridge + OBS** to function. Frontend/admin are optional UIs.

### Testing OBS Connection
```bash
cd bridge
./test-obs-connection.sh  # Tests OBS WebSocket directly
./test-obs-simple.py      # Minimal Python test script
```

### Build Commands
- **Server API**: `npm run build` (TypeScript to `dist/`)
- **Frontend**: `npm run build` (Vite to `dist/`)
- **Admin Panel**: `npm run build` (Next.js to `.next/`)
- **macOS App**: `make build` or `xcodebuild -project OBSBridge.xcodeproj`

## Project-Specific Conventions

### TypeScript Configuration
- **Root**: Shared `tsconfig.json` for example server
- **Per-project**: Each component has its own `tsconfig.json` (server-api uses NestJS defaults, frontend uses Vite, admin uses Next.js)
- **Path Aliases**: 
  - Frontend: `@/components` → `src/components`
  - Admin: `@/components` → `src/components`

### Message Protocol (Bridge ↔ Server)
**From Bridge to Server**:
```json
{"type": "register", "clientId": "obs-client-1"}
{"type": "command_response", "clientId": "obs-client-1", "command": "StartStreaming", "success": true, "data": {}}
{"type": "obs_event", "clientId": "obs-client-1", "event": "StreamStarted", "data": {}}
{"type": "pong", "clientId": "obs-client-1"}
```

**From Server to Bridge**:
```json
{"type": "command", "command": "StartStreaming", "params": {}}
{"type": "ping"}
```

### OBS Command Mapping (v4 → v5)
The codebase uses **legacy command names** but bridges map them to OBS WebSocket v5:
- `StartStreaming` → `StartStream`
- `StopStreaming` → `StopStream`
- `SetCurrentScene` → `SetCurrentProgramScene`
- `GetStreamingStatus` → `GetStreamStatus`

**Pattern**: Always check `BridgeManager.swift:mapCommandToOBSRequest()` or `obs_bridge.py:handle_website_message()` when adding commands.

### Date Handling
- **Backend**: Always use `Date` objects, not strings
- **Frontend**: Use `date-fns` for formatting (already imported)
- **Admin Panel**: Types in `src/types/index.ts` use `Date` for `startTime`/`endTime`
- **Time Slots**: DESIGN.md specifies flexible 15-minute increments (future feature, not implemented yet)

## Integration Points

### Server API → Bridge
- **Connection**: Bridge initiates WebSocket connection to server on startup
- **Client Registry**: Server maintains `Map<string, OBSClient>` in `OBSClientService`
- **Health Checks**: Server pings all clients every 30s (`@Cron('*/30 * * * * *')`)
- **Disconnection**: Server auto-removes client when WebSocket closes

### Bridge → OBS
- **Protocol**: OBS WebSocket v5 (different from v4!)
- **Authentication**: Base64-encoded SHA256 hash of password + salt + challenge
- **Commands**: Use `requestId` to correlate responses (pending requests tracked in `BridgeManager`)
- **Events**: Bridge forwards all OBS events to server (e.g., `StreamStarted`, `RecordStateChanged`)

### Frontend/Admin → Server API
- **REST**: All control commands use REST (e.g., `POST /api/action/client-1/start-stream`)
- **WebSocket**: Not currently used by frontends (only bridges connect to `/obs`)
- **CORS**: No CORS config in server yet (add if deploying separately)

## Known Gotchas

1. **OBS WebSocket Version**: Must use v5 protocol. Legacy v4 clients won't work. Check OBS version is 28+.

2. **Command Timing**: Swift bridge sends success response *immediately* (demo mode) instead of waiting for OBS response. Python bridge actually waits. This is intentional for demo.

3. **Client ID Uniqueness**: Each bridge must have a unique `CLIENT_ID`. Server uses this as key in client map. Duplicate IDs will overwrite connections.

4. **Port Conflicts**: 
   - `8000` = Server API
   - `3000` = Admin panel (Next.js default)
   - `5173` = Frontend (Vite default)
   - `4455` = OBS WebSocket (local)

5. **Date vs String**: Admin panel types use `Date` but may receive ISO strings from API. Always parse with `new Date()` or `date-fns/parseISO`.

6. **Mock Data**: Frontend currently uses `generateAvailability()` in `mockData.ts`. Backend scheduling API doesn't exist yet (see DESIGN.md for planned implementation).

7. **Swift Module**: macOS app requires CommonCrypto module map. Run `./setup.sh` before first build or you'll get "No such module 'CommonCrypto'" error.

## Testing Strategy

### Current State
- **Server API**: Has Jest setup (`npm test`) but minimal coverage (only `app.controller.spec.ts`)
- **Frontend/Admin**: No tests yet (vite/next test runners configured but no test files)
- **Bridge**: No automated tests (manual testing only)

### Manual Testing
1. Start all components
2. Open http://localhost:8000 (server demo panel)
3. Verify client shows as connected
4. Click "Start Stream" button
5. Check OBS actually starts streaming
6. Check bridge logs (macOS app) or terminal (Python)

## Documentation Structure

- **README.md**: Full system overview + architecture + quick start
- **QUICKSTART.md**: 5-minute setup guide (server + Python bridge)
- **DESIGN.md**: Detailed spec for flexible duration scheduling (NOT IMPLEMENTED YET - planned feature)
- **COMPARISON.md**: Python vs macOS app feature comparison
- **bridge/README.md**: macOS app specific docs
- **bridge/QUICKSTART.md**: macOS app quick start
- **bridge/BUILD.md**: Build troubleshooting
- **bridge/TROUBLESHOOTING.md**: Common issues
- **server-api/README.md**: API endpoints + WebSocket protocol
- **frontend/README.md**: Frontend setup
- **admin-panel/README.md**: Admin panel setup

## When Editing Code

### Adding a New OBS Command
1. Add to server API: `server-api/src/obs/obs.controller.ts` (REST endpoint)
2. Add mapping in Swift: `bridge/OBSBridge/BridgeManager.swift:mapCommandToOBSRequest()`
3. Add handling in Python: `obs_bridge.py:handle_website_message()`
4. Update demo UI: `demo.html` or `server-api/public/demo.html`

### Adding a New API Endpoint
1. Create in `server-api/src/obs/obs.controller.ts`
2. Add types to `admin-panel/src/types/index.ts`
3. Create service method in `server-api/src/obs/obs-client.service.ts` if needed
4. Document in `server-api/README.md`

### Styling Changes
- **Components**: Both frontend and admin use **shadcn/ui** (Radix primitives + Tailwind)
- **Tailwind Config**: Each project has its own `tailwind.config.js/ts`
- **Component Location**: `src/components/ui/` (auto-generated by shadcn CLI)
- **Custom Components**: `src/components/[domain]/` (e.g., `booking/`, `obs/`, `scheduling/`)

### Database/State Management
- **Currently**: No database (all in-memory in `OBSClientService`)
- **Planned**: DESIGN.md describes PostgreSQL schema for bookings/schedules (not implemented)
- **State**: Server uses Map to track connected clients (resets on restart)

## Quick Reference Commands

```bash
# Install all dependencies
npm install && cd server-api && npm install && cd ../frontend && npm install && cd ../admin-panel && npm install

# Dev servers
npm run dev               # Root: example server (legacy, use server-api instead)
cd server-api && npm run start:dev    # NestJS server
cd frontend && npm run dev            # Vite dev server
cd admin-panel && npm run dev         # Next.js dev server

# Bridges
python obs_bridge.py                  # Python bridge
cd bridge && make run                 # macOS app

# Testing
cd bridge && ./test-obs-connection.sh # Test OBS connectivity
curl http://localhost:8000/health     # Test server health
curl http://localhost:8000/api/clients # List connected clients

# Build for production
cd server-api && npm run build && npm run start:prod
cd frontend && npm run build && npm run preview
cd admin-panel && npm run build && npm run start
cd bridge && make release
```

## Important: What's NOT Implemented Yet

The **DESIGN.md** describes a comprehensive flexible-duration scheduling system with 15-minute increments, availability checking, conflict detection, etc. **This is NOT implemented.** Current state:
- Frontend uses mock hourly time slots
- No backend scheduling API exists
- Admin panel has types but no persistence layer
- Refer to DESIGN.md as the *specification* for future development, not current reality

## Getting Help

When stuck, check docs in this order:
1. Project README (component-specific)
2. Main README.md (architecture overview)
3. QUICKSTART.md (setup steps)
4. TROUBLESHOOTING.md (common issues)
5. DESIGN.md (planned features, not current state)
