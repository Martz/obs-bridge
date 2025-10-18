// Core types for the admin panel application

export interface OBSInstance {
  id: string;
  clientId: string;
  name: string;
  location?: string;
  description?: string;
  capacity: number;
  status: 'online' | 'offline' | 'busy';
  connectedAt?: Date | string;
  lastSeenAt?: Date | string;
  scenes?: string[];
  currentScene?: string;
  isStreaming: boolean;
  isRecording: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Schedule {
  id: string;
  obsInstanceId: string;
  obsInstanceName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  recurring?: RecurringPattern;
  scene?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // e.g. every 2 weeks
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  endDate?: Date;
  occurrences?: number;
}

export interface Booking {
  id: string;
  scheduleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  obsInstanceId: string;
  obsInstanceName?: string;
  startTime: Date;
  endTime: Date;
  scene?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'student';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OBSClient {
  clientId: string;
  connected: string; // ISO8601 date string from API
}

export interface ClientsResponse {
  clients: OBSClient[];
}

export interface CommandResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface BroadcastResponse {
  success: boolean;
  clientsSent: number;
}

export interface HealthResponse {
  status: string;
  clients: number;
  uptime: number;
}

export interface DashboardStats {
  totalOBSInstances: number;
  onlineInstances: number;
  activeRecordings: number;
  todayBookings: number;
  upcomingBookings: number;
  totalBookings: number;
}

export interface OBSCommand {
  command: string;
  params?: Record<string, unknown>;
}

// Available OBS WebSocket commands
export type OBSCommandType =
  | 'StartStreaming'
  | 'StopStreaming'
  | 'StartRecording'
  | 'StopRecording'
  | 'GetStreamingStatus'
  | 'GetRecordingStatus'
  | 'GetSceneList'
  | 'SetCurrentScene'
  | 'GetCurrentScene';

// Instance management types
export interface InstancesResponse {
  instances: OBSInstance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InstanceStatsResponse {
  total: number;
  online: number;
  offline: number;
  busy: number;
  streaming: number;
  recording: number;
}
