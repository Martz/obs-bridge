# OBS Recording Scheduler

Applications that connect OBS Studio to a central website for remote control, scene selection, recording stop/start.

## Available Platforms

- **🐍 Python Bridge** - Cross-platform command-line tool ([Setup Guide](#python-bridge-setup))
- **🍎 macOS App** - Native macOS application ([Bridge Documentation](bridge/README.md))
- **🪟 Windows App** - Native Windows 11 application ([Windows Documentation](windows-app/README.md))
A complete system for scheduling and remotely controlling OBS (Open Broadcaster Software) recording sessions. This monorepo contains multiple interconnected applications that work together to provide a comprehensive OBS remote control and scheduling solution.

## 🎯 Project Overview

```
┌─────────────┐         WebSocket          ┌──────────────────┐
│   Website   │ ◄────────────────────────► │  OBS Bridge      │
│  (Server)   │     (Bridge initiates)     │ (Your Platform)  │
└─────────────┘                            └────────┬─────────┘
                                                    │
                                                    │ Local
                                                    │ WebSocket
                                                    │
                                               ┌────▼─────┐
                                               │   OBS    │
                                               │  Studio  │
                                               └──────────┘
This system allows you to:

- **Schedule OBS recording sessions** through a web interface
- **Remotely control OBS instances** from anywhere via WebSocket
- **Manage multiple OBS installations** from a central control panel
- **Administer bookings, users, and schedules** through an admin dashboard

## 📦 Project Structure

This repository contains five main components:

### 1. **Bridge** (`/bridge`)

A **native macOS application** that connects OBS Studio to the central server for remote control.

**Tech Stack:** Swift, SwiftUI, macOS 13.0+

**Features:**

- Native macOS interface with real-time status indicators
- Secure credential storage
- Auto-connect on startup
- Activity logging
- Settings panel for easy configuration

**Getting Started:**

```bash
cd bridge
open OBSBridge.xcodeproj
# Build and run in Xcode (⌘R)
```

📖 [Full Documentation](bridge/README.md) | [Quick Start Guide](bridge/QUICKSTART.md)

- ✅ Connects OBS to your website (outbound connection, firewall friendly)
- ✅ Remote control OBS from anywhere
- ✅ Real time event streaming (scene changes, streaming status, etc.)
- ✅ Supports multiple OBS commands
- ✅ Automatic reconnection handling
- ✅ Secure password authentication
- ✅ Native applications for macOS and Windows with GUI
- ✅ Cross-platform Python CLI version

## Quick Start

### For Windows 11 Users
👉 [Windows Quick Start Guide](windows-app/QUICKSTART.md)

### For macOS Users
👉 [macOS Quick Start Guide](bridge/QUICKSTART.md)

### For Python/CLI Users
👉 Continue reading below for Python setup

---

## Python Bridge Setup

### Prerequisites
---

### 2. **Server API** (`/server-api`)

A **NestJS-based backend** that provides WebSocket and REST APIs for controlling OBS instances.

**Tech Stack:** NestJS, TypeScript, WebSocket, Express

**Features:**

- WebSocket server for OBS client connections
- REST API for sending commands to OBS
- Client registration and management
- Automatic health checks (ping every 30s)
- Event handling from OBS
- Demo control panel included

**Getting Started:**

```bash
cd server-api
npm install
npm run start:dev
# Server runs on http://localhost:8000
```

**Key Endpoints:**

- `ws://localhost:8000/obs` - WebSocket endpoint
- `GET /api/clients` - List connected clients
- `POST /api/command/:clientId` - Send command to specific client
- `POST /api/action/:clientId/:action` - Quick actions (start-stream, stop-stream, etc.)
- `GET /health` - Health check

📖 [Full Documentation](server-api/README.md)

---

### 3. **Frontend** (`/frontend`)

A **React-based user interface** for browsing schedules and booking recording sessions.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui

**Features:**

- Interactive calendar for date selection
- Available time slot browsing
- OBS instance and scene selection
- Responsive design with dark/light mode
- User profile management

**Getting Started:**

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

📖 [Full Documentation](frontend/README.md)

---

### 4. **Admin Panel** (`/admin-panel`)

A **Next.js admin dashboard** for managing bookings, users, schedules, and OBS instances.

**Tech Stack:** Next.js 14, TypeScript, React, Tailwind CSS, shadcn/ui

**Features:**

- Booking management interface
- User administration
- Schedule configuration
- OBS instance monitoring
- Settings management

**Getting Started:**

```bash
cd admin-panel
npm install
npm run dev
# Open http://localhost:3000
```

📖 [Full Documentation](admin-panel/README.md)

---

### 5. **Python Bridge** (Root: `obs_bridge.py`)

A **Python-based alternative bridge** for cross-platform OBS connectivity.

**Tech Stack:** Python 3.7+, obs-websocket-py

**Features:**

- Cross-platform support (Windows, macOS, Linux)
- Command-line interface
- Automatic reconnection
- Configuration via `.env` file

**Getting Started:**

```bash
# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your settings

# Run
python obs_bridge.py
```

📖 See [Python Bridge Configuration](#-python-bridge-configuration) below for details

---

## 🚀 Quick Start (Full System)

Get the entire system running in 5 minutes! See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

### Prerequisites

- OBS Studio 28+
- Node.js 18+
- Python 3.7+ (for Python bridge)
- macOS 13+ (for native bridge app)

### Minimal Setup

1. **Enable OBS WebSocket:**
   - Open OBS → Tools → WebSocket Server Settings
   - Enable WebSocket server, set password, note port (4455)

2. **Start the API Server:**

   ```bash
   cd server-api
   npm install && npm run start:dev
   ```

3. **Connect a Bridge:**

   **Option A - Python Bridge:**

   ```bash
   # Configure .env with OBS settings
   python obs_bridge.py
   ```

   **Option B - macOS Native App:**

   ```bash
   cd bridge
   open OBSBridge.xcodeproj
   # Build and configure in Xcode
   ```

4. **Open Control Panel:**

   ```text
   http://localhost:8000
   ```

## 🏗️ System Architecture

```text
┌──────────────────┐         REST/WS           ┌──────────────────┐
│  Admin Panel     │ ◄────────────────────────►│                  │
│  (Next.js)       │                            │   API Server     │
└──────────────────┘                            │   (NestJS)       │
                                                │                  │
┌──────────────────┐         REST/WS           │  Port: 8000      │
│  Frontend        │ ◄────────────────────────►│                  │
│  (React)         │                            │  WebSocket: /obs │
└──────────────────┘                            └────────┬─────────┘
                                                         │
                                                         │ WebSocket
                                              ┌──────────┴──────────┐
                                              │                     │
                                    ┌─────────▼──────┐   ┌─────────▼──────┐
                                    │  Bridge        │   │  Bridge        │
                                    │  (macOS/Python)│   │  (macOS/Python)│
                                    └────────┬───────┘   └────────┬───────┘
                                             │                    │
                                             │ Local WS           │ Local WS
                                             │                    │
                                      ┌──────▼──────┐      ┌──────▼──────┐
                                      │ OBS Studio  │      │ OBS Studio  │
                                      │ Instance 1  │      │ Instance 2  │
                                      └─────────────┘      └─────────────┘
```

## 🔧 Configuration

### Environment Variables

**Python Bridge (`.env`):**

```env
OBS_HOST=localhost
OBS_PORT=4455
OBS_PASSWORD=your-password
WEBSITE_URL=ws://localhost:8000/obs
CLIENT_ID=obs-client-1
```

**Server API:**

```env
PORT=8000
```

### OBS Setup

1. Open OBS Studio
2. Tools → WebSocket Server Settings
3. Enable WebSocket server
4. Set password and note port (default: 4455)
5. Apply settings

## 📡 API Documentation

### OBS Commands

Send commands via REST API or WebSocket:

**Common Commands:**

- `StartStreaming` - Start streaming
- `StopStreaming` - Stop streaming
- `StartRecording` - Start recording
- `StopRecording` - Stop recording
- `GetStreamingStatus` - Get current status
- `GetSceneList` - List all scenes
- `SetCurrentScene` - Switch scene

**Example:**

```bash
curl -X POST http://localhost:8000/api/action/my-client/start-stream
```

See [server-api/README.md](server-api/README.md) for complete API documentation.

## 🛠️ Development

### Install All Dependencies

```bash
# Root dependencies (example server)
npm install

# Server API
cd server-api && npm install

# Frontend
cd ../frontend && npm install

# Admin Panel
cd ../admin-panel && npm install

# Python bridge
pip install -r requirements.txt
```

### Running in Development

Each project has its own development server. Open separate terminals:

```bash
# Terminal 1 - API Server
cd server-api && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Admin Panel
cd admin-panel && npm run dev

# Terminal 4 - Python Bridge
python obs_bridge.py
```

## 🧪 Testing

```bash
# Test OBS connection
cd bridge && ./test-obs-connection.sh

# Server API tests
cd server-api && npm run test

# Frontend tests
cd frontend && npm run test
```

## 📝 Python Bridge Configuration

The Python bridge (`obs_bridge.py`) provides cross-platform OBS connectivity.

**Installation:**

```bash
pip install -r requirements.txt
```

**Configuration:**

```bash
cp .env.example .env
# Edit .env with your OBS and server settings
```

**Usage:**

```bash
python obs_bridge.py
```

**Features:**

- Cross-platform (Windows, macOS, Linux)
- Automatic reconnection
- Event forwarding
- Command execution
- Secure authentication

## 🔍 Troubleshooting

**Bridge can't connect to OBS:**

- Ensure OBS is running
- Verify WebSocket is enabled in OBS settings
- Check password and port in configuration

**API server not starting:**

- Check if port 8000 is available
- Install dependencies: `npm install`
- Check Node.js version (18+)

**Frontend/Admin panel won't load:**

- Verify API server is running
- Check browser console for errors
- Clear browser cache

See individual project READMEs for detailed troubleshooting.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🔗 Additional Resources

- [OBS WebSocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)

## 📞 Support

For issues and questions:

- Check project-specific READMEs in each folder
- Review [QUICKSTART.md](QUICKSTART.md) for setup help
- Review [TROUBLESHOOTING.md](bridge/TROUBLESHOOTING.md) for common issues
