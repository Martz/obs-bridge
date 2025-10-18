import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { OBSClientService } from './obs-client.service';
import { OBSMessage } from './interfaces/obs-message.interface';

@WebSocketGateway({ path: '/obs' })
export class OBSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OBSGateway.name);

  constructor(private readonly clientService: OBSClientService) {}

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    this.logger.log('New OBS client attempting to connect...');

    // Attach message listener for raw WebSocket messages
    client.on('message', async (data: Buffer) => {
      await this.handleMessage(client, data.toString());
    });
  }

  async handleDisconnect(client: WebSocket): Promise<void> {
    await this.clientService.removeClient(client);
  }

  async handleMessage(client: WebSocket, payload: string): Promise<void> {
    try {
      const data: OBSMessage = JSON.parse(payload);
      const { type, clientId } = data;

      switch (type) {
        case 'register':
          if (clientId) {
            await this.clientService.registerClient(clientId, client);
            // Defer initial status requests to allow bridge to fully connect
            setTimeout(() => {
              if (this.clientService.hasClient(clientId)) {
                this.logger.log(`Sending initial status requests to ${clientId}`);
                this.clientService.sendCommand(clientId, 'GetStreamingStatus');
                this.clientService.sendCommand(clientId, 'GetRecordingStatus');
                this.clientService.sendCommand(clientId, 'GetSceneList');
              }
            }, 1000); // 1 second delay
          }
          break;

        case 'obs_event':
          if (clientId) {
            this.logger.log(
              `Event from ${clientId}: ${data.event}`,
              data.data,
            );
            await this.clientService.handleOBSEvent(clientId, data);
          }
          break;

        case 'command_response':
          this.logger.log(`Response from ${clientId}:`, {
            command: data.command,
            success: data.success,
            data: data.data,
            error: data.error,
          });
          if (clientId) {
            await this.clientService.handleCommandResponse(clientId, data);
          }
          break;

        case 'pong':
          this.logger.log(`Pong from ${clientId}`);
          break;

        default:
          this.logger.log('Unknown message type:', type);
      }
    } catch (error) {
      this.logger.error('Failed to parse message:', error);
    }
  }
}
