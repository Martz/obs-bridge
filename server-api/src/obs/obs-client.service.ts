import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebSocket } from 'ws';
import {
  OBSClient,
  ClientInfo,
} from './interfaces/obs-client.interface';
import { OBSCommand, OBSMessage } from './interfaces/obs-message.interface';
import { OBSInstanceService } from './obs-instance.service';

@Injectable()
export class OBSClientService {
  private readonly logger = new Logger(OBSClientService.name);
  private readonly clients: Map<string, OBSClient> = new Map();

  constructor(private readonly instanceService: OBSInstanceService) {}

  async registerClient(clientId: string, ws: WebSocket): Promise<void> {
    this.clients.set(clientId, {
      ws,
      clientId,
      connected: new Date(),
    });
    this.logger.log(`✓ Client registered: ${clientId}`);

    // Update database status
    await this.instanceService.updateStatus(clientId, 'online', {
      connectedAt: new Date(),
      lastSeenAt: new Date(),
    });
  }

  async removeClient(ws: WebSocket): Promise<void> {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws === ws) {
        this.logger.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);

        // Update database status
        await this.instanceService.updateStatus(clientId, 'offline', {
          lastSeenAt: new Date(),
        });

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

  async handleOBSEvent(clientId: string, message: OBSMessage): Promise<void> {
    const eventData = message.data as any;

    switch (message.event) {
      // OBS WebSocket v5 events
      case 'StreamStateChanged':
        const streaming = eventData?.outputActive === true;
        this.logger.log(`${streaming ? '🔴' : '⏹️'} Stream ${streaming ? 'started' : 'stopped'} on ${clientId}`);
        await this.instanceService.updateStatus(clientId, 'online', {
          isStreaming: streaming,
          lastSeenAt: new Date(),
        });
        break;

      case 'RecordStateChanged':
        const recording = eventData?.outputActive === true;
        this.logger.log(`${recording ? '⏺️' : '⏹️'} Recording ${recording ? 'started' : 'stopped'} on ${clientId}`);
        await this.instanceService.updateStatus(clientId, 'online', {
          isRecording: recording,
          lastSeenAt: new Date(),
        });
        break;

      case 'CurrentProgramSceneChanged':
        this.logger.log(`🎬 Scene changed on ${clientId}:`, eventData);
        await this.instanceService.updateStatus(clientId, 'online', {
          currentScene: eventData?.sceneName as string | undefined,
          lastSeenAt: new Date(),
        });
        break;

      case 'SceneListChanged':
        const scenes = (eventData?.scenes as any[] || []).map(s => s.sceneName || s);
        await this.instanceService.updateStatus(clientId, 'online', {
          scenes: scenes,
          lastSeenAt: new Date(),
        });
        break;

      // Legacy OBS WebSocket v4 events (kept for backward compatibility)
      case 'StreamStarted':
        this.logger.log(`🔴 Stream started on ${clientId}`);
        await this.instanceService.updateStatus(clientId, 'online', {
          isStreaming: true,
          lastSeenAt: new Date(),
        });
        break;

      case 'StreamStopped':
        this.logger.log(`⏹️ Stream stopped on ${clientId}`);
        await this.instanceService.updateStatus(clientId, 'online', {
          isStreaming: false,
          lastSeenAt: new Date(),
        });
        break;

      case 'RecordingStarted':
        this.logger.log(`⏺️ Recording started on ${clientId}`);
        await this.instanceService.updateStatus(clientId, 'online', {
          isRecording: true,
          lastSeenAt: new Date(),
        });
        break;

      case 'RecordingStopped':
        this.logger.log(`⏹️ Recording stopped on ${clientId}`);
        await this.instanceService.updateStatus(clientId, 'online', {
          isRecording: false,
          lastSeenAt: new Date(),
        });
        break;

      case 'SwitchScenes':
        this.logger.log(`🎬 Scene changed on ${clientId}:`, message.data);
        await this.instanceService.updateStatus(clientId, 'online', {
          currentScene: eventData?.sceneName as string | undefined,
          lastSeenAt: new Date(),
        });
        break;

      default:
        this.logger.log(
          `Event from ${clientId}: ${message.event}`,
          message.data,
        );
    }
  }

  async handleCommandResponse(clientId: string, message: OBSMessage): Promise<void> {
    if (!message.success || !message.data) {
      return;
    }

    switch (message.command) {
      case 'GetStreamingStatus':
        this.logger.log(`Updating streaming status for ${clientId}:`, message.data);
        // OBS WebSocket v5 uses 'outputActive' for streaming status
        await this.instanceService.updateStatus(clientId, 'online', {
          isStreaming: (message.data as any).outputActive === true,
          lastSeenAt: new Date(),
        });
        break;

      case 'GetRecordingStatus':
        this.logger.log(`Updating recording status for ${clientId}:`, message.data);
        // OBS WebSocket v5 uses 'outputActive' for recording status
        await this.instanceService.updateStatus(clientId, 'online', {
          isRecording: (message.data as any).outputActive === true,
          lastSeenAt: new Date(),
        });
        break;

      case 'GetSceneList':
        const sceneData = message.data as any;
        // Extract scene names from the scenes array
        const scenes = (sceneData.scenes as any[] || []).map(s => s.sceneName || s);
        await this.instanceService.updateStatus(clientId, 'online', {
          currentScene: sceneData.currentProgramSceneName as string | undefined,
          scenes: scenes,
          lastSeenAt: new Date(),
        });
        break;
    }
  }
}
