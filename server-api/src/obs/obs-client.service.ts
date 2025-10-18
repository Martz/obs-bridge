import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebSocket } from 'ws';
import {
  OBSClient,
  ClientInfo,
} from './interfaces/obs-client.interface';
import { OBSCommand, OBSMessage } from './interfaces/obs-message.interface';

@Injectable()
export class OBSClientService {
  private readonly logger = new Logger(OBSClientService.name);
  private readonly clients: Map<string, OBSClient> = new Map();

  registerClient(clientId: string, ws: WebSocket): void {
    this.clients.set(clientId, {
      ws,
      clientId,
      connected: new Date(),
    });
    this.logger.log(`✓ Client registered: ${clientId}`);
  }

  removeClient(ws: WebSocket): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws === ws) {
        this.logger.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        break;
      }
    }
  }

  getClient(clientId: string): OBSClient | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): ClientInfo[] {
    return Array.from(this.clients.values()).map((client) => ({
      clientId: client.clientId,
      connected: client.connected,
    }));
  }

  getConnectedClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  hasClient(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  getClientCount(): number {
    return this.clients.size;
  }

  sendCommand(
    clientId: string,
    command: string,
    params: Record<string, unknown> = {},
  ): void {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }

    const message: OBSCommand = {
      type: 'command',
      command,
      params,
    };

    this.logger.log(`→ Sending command to ${clientId}: ${command}`, params);
    client.ws.send(JSON.stringify(message));
    this.logger.log(`✓ Command sent via WebSocket to ${clientId}`);
  }

  broadcastCommand(command: string, params: Record<string, unknown> = {}): number {
    let sent = 0;
    for (const clientId of this.clients.keys()) {
      try {
        this.sendCommand(clientId, command, params);
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send to ${clientId}:`, error);
      }
    }
    return sent;
  }

  ping(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }

    client.ws.send(JSON.stringify({ type: 'ping' }));
  }

  pingAll(): void {
    for (const clientId of this.clients.keys()) {
      try {
        this.ping(clientId);
      } catch (error) {
        this.logger.error(`Failed to ping ${clientId}:`, error);
      }
    }
  }

  handleOBSEvent(clientId: string, message: OBSMessage): void {
    switch (message.event) {
      case 'StreamStarted':
        this.logger.log(`🔴 Stream started on ${clientId}`);
        break;
      case 'StreamStopped':
        this.logger.log(`⏹️ Stream stopped on ${clientId}`);
        break;
      case 'RecordingStarted':
        this.logger.log(`⏺️ Recording started on ${clientId}`);
        break;
      case 'RecordingStopped':
        this.logger.log(`⏹️ Recording stopped on ${clientId}`);
        break;
      case 'SwitchScenes':
        this.logger.log(`🎬 Scene changed on ${clientId}:`, message.data);
        break;
      default:
        this.logger.log(
          `Event from ${clientId}: ${message.event}`,
          message.data,
        );
    }
  }
}
