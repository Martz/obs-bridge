import { WebSocket } from 'ws';

export interface OBSClient {
  ws: WebSocket;
  clientId: string;
  connected: Date;
}

export interface ClientInfo {
  clientId: string;
  connected: Date;
}
