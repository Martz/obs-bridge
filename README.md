# OBS Recording Scheduler

A complete system for scheduling and remotely controlling OBS (Open Broadcaster Software) recording sessions. This monorepo contains multiple interconnected applications that work together to provide a comprehensive OBS remote control and scheduling solution.

## Table of Contents

- [OBS Recording Scheduler](#obs-recording-scheduler)
  - [Table of Contents](#table-of-contents)
  - [🎯 Project Overview](#-project-overview)
  - [📦 Project Structure](#-project-structure)
    - [1. Server API (`/server-api`)](#1-server-api-server-api)
    - [2. Frontend (`/frontend`)](#2-frontend-frontend)
    - [3. Admin Panel (`/admin-panel`)](#3-admin-panel-admin-panel)
    - [4. Bridge Applications](#4-bridge-applications)
  - [🚀 Quick Start (Full System)](#-quick-start-full-system)
    - [Prerequisites](#prerequisites)
    - [Minimal Setup](#minimal-setup)
  - [🏗️ System Architecture](#️-system-architecture)
  - [🔧 Configuration](#-configuration)
    - [Environment Variables](#environment-variables)
    - [OBS Setup](#obs-setup)
  - [📡 API Documentation](#-api-documentation)
    - [OBS Commands](#obs-commands)
  - [🛠️ Development](#️-development)
    - [Install All Dependencies](#install-all-dependencies)
    - [Running in Development](#running-in-development)
  - [🧪 Testing](#-testing)
  - [🔍 Troubleshooting](#-troubleshooting)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)
  - [🔗 Additional Resources](#-additional-resources)
  - [📞 Support](#-support)

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
```
This system allows you to:

- **Schedule OBS recording sessions** through a web interface
- **Remotely control OBS instances** from anywhere via WebSocket
- **Manage multiple OBS installations** from a central control panel
- **Administer bookings, users, and schedules** through an admin dashboard

## 📦 Project Structure

This repository contains five main components:

### 1. **Server API** (`/server-api`)

A **NestJS-based backend** that provides WebSocket and REST APIs for controlling OBS instances.

**Tech Stack:** NestJS, TypeScript, WebSocket, Express

**Getting Started:**
```bash
cd server-api
npm install
npm run start:dev
# Server runs on http://localhost:8000
```
📖 [Full Documentation](server-api/README.md)

### 2. **Frontend** (`/frontend`)

A **React-based user interface** for browsing schedules and booking recording sessions.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui

**Getting Started:**
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```
📖 [Full Documentation](frontend/README.md)

### 3. **Admin Panel** (`/admin-panel`)

A **Next.js admin dashboard** for managing bookings, users, schedules, and OBS instances.

**Tech Stack:** Next.js 14, TypeScript, React, Tailwind CSS, shadcn/ui

**Getting Started:**
```bash
cd admin-panel
npm install
npm run dev
# Open http://localhost:3000
```
📖 [Full Documentation](admin-panel/README.md)

### 4. **Bridge Applications**

The bridge connects OBS Studio to the server. Choose the one that best fits your operating system.

#### **Windows App** (`/windows-app`)

A **native Windows 11 application**.
- **Tech Stack:** C#, WPF, .NET 8
- 📖 [Full Documentation](windows-app/README.md)

#### **macOS App** (`/bridge`)

A **native macOS application**.
- **Tech Stack:** Swift, SwiftUI, macOS 13.0+
- 📖 [Full Documentation](bridge/README.md)

#### **Python Bridge** (Root: `obs_bridge.py`)

A **cross-platform command-line** bridge.
- **Tech Stack:** Python 3.7+
- 📖 [Full Documentation](#-python-bridge-configuration)

## 🚀 Quick Start (Full System)

Get the entire system running in 5 minutes! See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

### Prerequisites

- OBS Studio 28+
- Node.js 18+
- Python 3.7+ (for Python bridge)
- macOS 13+ (for native macOS bridge app)
- Windows 11 (for native Windows bridge app)

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
   - **Windows App**: [Instructions](windows-app/README.md)
   - **macOS App**: [Instructions](bridge/README.md)
   - **Python CLI**:
     ```bash
     # Configure .env with OBS settings
     cp .env.example .env
     pip install -r requirements.txt
     python obs_bridge.py
     ```

4. **Open Control Panel:**
   The demo control panel is available at `http://localhost:8000`.

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
                                    │ (Win/Mac/Py)   │   │ (Win/Mac/Py)   │
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

**Server API (`server-api/.env`):**
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
- `StartStreaming`, `StopStreaming`
- `StartRecording`, `StopRecording`
- `GetStreamingStatus`
- `GetSceneList`, `SetCurrentScene`

**Example:**
```bash
curl -X POST http://localhost:8000/api/action/my-client/start-stream
```

See [server-api/README.md](server-api/README.md) for complete API documentation.

## 🛠️ Development

### Install All Dependencies

```bash
# Root dependencies
npm install
pip install -r requirements.txt

# Server API
cd server-api && npm install

# Frontend
cd ../frontend && npm install

# Admin Panel
cd ../admin-panel && npm install
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
# Test OBS connection (macOS)
cd bridge && ./test-obs-connection.sh

# Server API tests
cd server-api && npm run test

# Frontend tests
cd frontend && npm run test
```

## 🔍 Troubleshooting

**Bridge can't connect to OBS:**
- Ensure OBS is running and WebSocket is enabled
- Check password and port in configuration

**API server not starting:**
- Check if port 8000 is available
- Run `npm install` in `/server-api`

See individual project READMEs for detailed troubleshooting.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

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
