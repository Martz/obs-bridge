/**
 * Example WebSocket Server for OBS Bridge
 *
 * This is a sample Node.js/TypeScript server that demonstrates how to:
 * - Accept connections from OBS bridge clients
 * - Send commands to OBS
 * - Receive events and status updates from OBS
 */

import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OBSClient {
  ws: WebSocket;
  clientId: string;
  connected: Date;
}

interface OBSMessage {
  type: 'register' | 'obs_event' | 'command_response' | 'pong';
  clientId?: string;
  event?: string;
  command?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface OBSCommand {
  type: 'command' | 'ping';
  command?: string;
  params?: Record<string, unknown>;
}

class OBSControlServer {
  private clients: Map<string, OBSClient> = new Map();
  private wss: WebSocketServer;
  private app: express.Application;
  private server: ReturnType<typeof createServer>;

  constructor(port: number = 8000) {
    this.app = express();
    this.server = createServer(this.app);

    // WebSocket server for OBS clients
    this.wss = new WebSocketServer({
      server: this.server,
      path: '/obs'
    });

    this.setupWebSocket();
    this.setupHTTPRoutes();

    this.server.listen(port, () => {
      console.log(`OBS Control Server running on port ${port}`);
      console.log(`WebSocket endpoint: ws://localhost:${port}/obs`);
      console.log(`Demo control panel: http://localhost:${port}`);
      console.log(`HTTP API: http://localhost:${port}/api`);
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New OBS client attempting to connect...');

      ws.on('message', (message: Buffer) => {
        try {
          const data: OBSMessage = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        // Remove client from registry
        for (const [clientId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            console.log(`Client disconnected: ${clientId}`);
            this.clients.delete(clientId);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: OBSMessage): void {
    const { type, clientId } = message;

    switch (type) {
      case 'register':
        if (clientId) {
          this.clients.set(clientId, {
            ws,
            clientId,
            connected: new Date()
          });
          console.log(`✓ Client registered: ${clientId}`);

          // Send initial status request
          this.sendCommand(clientId, 'GetStreamingStatus');
          this.sendCommand(clientId, 'GetSceneList');
        }
        break;

      case 'obs_event':
        console.log(`Event from ${clientId}: ${message.event}`, message.data);
        // Handle OBS events (stream started, scene changed, etc.)
        this.handleOBSEvent(clientId!, message);
        break;

      case 'command_response':
        console.log(`Response from ${clientId}:`, {
          command: message.command,
          success: message.success,
          data: message.data,
          error: message.error
        });
        break;

      case 'pong':
        console.log(`Pong from ${clientId}`);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  private handleOBSEvent(clientId: string, message: OBSMessage): void {
    // You can implement custom logic here based on events
    // For example, update a database, trigger webhooks, notify users, etc.

    switch (message.event) {
      case 'StreamStarted':
        console.log(`🔴 Stream started on ${clientId}`);
        break;
      case 'StreamStopped':
        console.log(`⏹️ Stream stopped on ${clientId}`);
        break;
      case 'RecordingStarted':
        console.log(`⏺️ Recording started on ${clientId}`);
        break;
      case 'RecordingStopped':
        console.log(`⏹️ Recording stopped on ${clientId}`);
        break;
      case 'SwitchScenes':
        console.log(`🎬 Scene changed on ${clientId}:`, message.data);
        break;
    }
  }

  private setupHTTPRoutes(): void {
    this.app.use(express.json());

    // Serve demo control panel
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'demo.html'));
    });

    // Get list of connected clients
    this.app.get('/api/clients', (req, res) => {
      const clients = Array.from(this.clients.values()).map(client => ({
        clientId: client.clientId,
        connected: client.connected
      }));
      res.json({ clients });
    });

    // Send a command to a specific OBS client
    this.app.post('/api/command/:clientId', (req, res) => {
      const { clientId } = req.params;
      const { command, params } = req.body;

      if (!this.clients.has(clientId)) {
        return res.status(404).json({ error: 'Client not found' });
      }

      try {
        this.sendCommand(clientId, command, params);
        res.json({ success: true, message: 'Command sent' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to send command' });
      }
    });

    // Broadcast command to all clients
    this.app.post('/api/broadcast', (req, res) => {
      const { command, params } = req.body;

      let sent = 0;
      for (const clientId of this.clients.keys()) {
        try {
          this.sendCommand(clientId, command, params);
          sent++;
        } catch (error) {
          console.error(`Failed to send to ${clientId}:`, error);
        }
      }

      res.json({ success: true, clientsSent: sent });
    });

    // Quick actions
    this.app.post('/api/action/:clientId/:action', (req, res) => {
      const { clientId, action } = req.params;

      if (!this.clients.has(clientId)) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const commandMap: Record<string, string> = {
        'start-stream': 'StartStreaming',
        'stop-stream': 'StopStreaming',
        'start-recording': 'StartRecording',
        'stop-recording': 'StopRecording',
        'status': 'GetStreamingStatus',
        'scenes': 'GetSceneList'
      };

      const command = commandMap[action];
      if (!command) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      try {
        this.sendCommand(clientId, command);
        res.json({ success: true, message: `Action '${action}' sent` });
      } catch (error) {
        res.status(500).json({ error: 'Failed to send action' });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        clients: this.clients.size,
        uptime: process.uptime()
      });
    });
  }

  public sendCommand(
    clientId: string,
    command: string,
    params: Record<string, unknown> = {}
  ): void {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const message: OBSCommand = {
      type: 'command',
      command,
      params
    };

    console.log(`→ Sending command to ${clientId}: ${command}`, params);
    client.ws.send(JSON.stringify(message));
    console.log(`✓ Command sent via WebSocket to ${clientId}`);
  }

  public ping(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    client.ws.send(JSON.stringify({ type: 'ping' }));
  }

  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Start the server
const server = new OBSControlServer(8000);

// Example: Send periodic pings to all clients
setInterval(() => {
  for (const clientId of server.getConnectedClients()) {
    server.ping(clientId);
  }
}, 30000); // Every 30 seconds

// Example: Schedule a stream start (demonstration)
// setTimeout(() => {
//   const clients = server.getConnectedClients();
//   if (clients.length > 0) {
//     console.log('Starting stream on first client...');
//     server.sendCommand(clients[0], 'StartStreaming');
//   }
// }, 10000);
