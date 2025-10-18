// API client for communicating with the server-api

import type {
  ClientsResponse,
  CommandResponse,
  BroadcastResponse,
  HealthResponse,
  OBSCommand,
  OBSInstance,
  InstancesResponse,
  InstanceStatsResponse,
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

  async setScene(clientId: string, sceneName: string): Promise<CommandResponse> {
    return this.request<CommandResponse>(`/api/command/${clientId}`, {
      method: 'POST',
      body: JSON.stringify({
        command: 'SetCurrentProgramScene',
        params: {
          sceneName,
        },
      }),
    });
  }

  // Instance management
  async getInstances(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<InstancesResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    return this.request<InstancesResponse>(
      `/api/admin/instances${queryString ? `?${queryString}` : ''}`
    );
  }

  async getInstanceStats(): Promise<InstanceStatsResponse> {
    return this.request<InstanceStatsResponse>('/api/admin/instances/stats');
  }

  async getInstance(id: string): Promise<OBSInstance> {
    return this.request<OBSInstance>(`/api/admin/instances/${id}`);
  }

  async createInstance(data: {
    clientId: string;
    name: string;
    location?: string;
    description?: string;
    capacity?: number;
    metadata?: Record<string, unknown>;
  }): Promise<OBSInstance> {
    return this.request<OBSInstance>('/api/admin/instances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstance(
    id: string,
    data: Partial<{
      name: string;
      location: string;
      description: string;
      capacity: number;
      metadata: Record<string, unknown>;
    }>
  ): Promise<OBSInstance> {
    return this.request<OBSInstance>(`/api/admin/instances/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteInstance(id: string): Promise<void> {
    await fetch(`${this.baseURL}/api/admin/instances/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
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
