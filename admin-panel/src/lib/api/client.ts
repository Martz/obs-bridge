// API client for communicating with the server-api

import type {
  ClientsResponse,
  CommandResponse,
  BroadcastResponse,
  HealthResponse,
  OBSCommand,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // OBS Client management
  async getConnectedClients(): Promise<ClientsResponse> {
    return this.request<ClientsResponse>('/api/clients');
  }

  async sendCommand(
    clientId: string,
    command: OBSCommand
  ): Promise<CommandResponse> {
    return this.request<CommandResponse>(`/api/command/${clientId}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  async broadcastCommand(command: OBSCommand): Promise<BroadcastResponse> {
    return this.request<BroadcastResponse>('/api/broadcast', {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  async sendAction(
    clientId: string,
    action: 'start-stream' | 'stop-stream' | 'start-recording' | 'stop-recording' | 'status' | 'scenes'
  ): Promise<CommandResponse> {
    return this.request<CommandResponse>(`/api/action/${clientId}/${action}`, {
      method: 'POST',
    });
  }

  // Placeholder methods for future backend endpoints
  // These will need to be implemented when the server-api is extended

  // async getSchedules(): Promise<Schedule[]> {
  //   return this.request<Schedule[]>('/api/admin/schedules');
  // }

  // async createSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
  //   return this.request<Schedule>('/api/admin/schedules', {
  //     method: 'POST',
  //     body: JSON.stringify(schedule),
  //   });
  // }

  // async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
  //   return this.request<Schedule>(`/api/admin/schedules/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(schedule),
  //   });
  // }

  // async deleteSchedule(id: string): Promise<void> {
  //   return this.request<void>(`/api/admin/schedules/${id}`, {
  //     method: 'DELETE',
  //   });
  // }

  // async getBookings(): Promise<Booking[]> {
  //   return this.request<Booking[]>('/api/admin/bookings');
  // }

  // async getUsers(): Promise<User[]> {
  //   return this.request<User[]>('/api/admin/users');
  // }
}

export const apiClient = new APIClient();
