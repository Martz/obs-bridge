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
import { AuthService } from './auth.service';

@WebSocketGateway({ path: '/obs' })
export class OBSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OBSGateway.name);

  // Store authenticated clients (WebSocket -> clientId mapping)
  private authenticatedClients = new Map<WebSocket, string>();

  constructor(
    private readonly clientService: OBSClientService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: WebSocket, request: IncomingMessage): Promise<void> {
    this.logger.log('New OBS client attempting to connect...');

    // Extract token from URL query parameters
    const url = request.url || '';
    const token = this.authService.extractTokenFromUrl(url);

    if (!token) {
      this.logger.warn('Connection rejected: No token provided');
      client.close(4001, 'Authentication required');
      return;
    }

    // Validate the token
    const validation = await this.authService.validateToken(token);

    if (!validation.valid || !validation.instance) {
      this.logger.warn('Connection rejected: Invalid token');
      client.close(4002, 'Invalid token');
      return;
    }

    // Store the authenticated clientId for this connection
    const clientId = validation.instance.clientId;
    this.authenticatedClients.set(client, clientId);
    this.logger.log(`Client ${clientId} authenticated successfully`);

    // Attach message listener for raw WebSocket messages
    client.on('message', async (data: Buffer) => {
      await this.handleMessage(client, data.toString());
    });
  }

  async handleDisconnect(client: WebSocket): Promise<void> {
    const clientId = this.authenticatedClients.get(client);
    if (clientId) {
      this.logger.log(`Client ${clientId} disconnected`);
      this.authenticatedClients.delete(client);
    }
    await this.clientService.removeClient(client);
  }

  async handleMessage(client: WebSocket, payload: string): Promise<void> {
    try {
      const data: OBSMessage = JSON.parse(payload);
      const { type } = data;

      // Get the authenticated clientId for this connection
      const clientId = this.authenticatedClients.get(client);

      if (!clientId) {
        this.logger.warn('Message from unauthenticated client, ignoring');
        return;
      }

      switch (type) {
        case 'register':
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
          break;

        case 'obs_event':
          this.logger.log(
            `Event from ${clientId}: ${data.event}`,
            data.data,
          );
          await this.clientService.handleOBSEvent(clientId, data);
          break;

        case 'command_response':
          this.logger.log(`Response from ${clientId}:`, {
            command: data.command,
            success: data.success,
            data: data.data,
            error: data.error,
          });
          await this.clientService.handleCommandResponse(clientId, data);
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
