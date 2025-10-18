export interface OBSMessage {
  type: 'register' | 'obs_event' | 'command_response' | 'pong';
  clientId?: string;
  event?: string;
  command?: string;
  success?: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface OBSCommand {
  type: 'command' | 'ping';
  command?: string;
  params?: Record<string, unknown>;
}
