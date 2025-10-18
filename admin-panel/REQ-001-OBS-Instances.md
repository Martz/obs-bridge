# REQ-001: OBS Instances Page Real API Integration

**Status**: Draft
**Priority**: High
**Created**: 2025-10-18
**Target Audience**: Experienced Application Engineers

## Executive Summary

This requirement document outlines the implementation of real-time OBS instance management with persistent storage, combining the existing WebSocket-based client tracking with a database-backed instance registry. The implementation will enable administrators to register, configure, and monitor OBS Bridge instances through the admin panel.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Requirements](#requirements)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy with Playwright MCP](#testing-strategy-with-playwright-mcp)
8. [Development Workflow with Context7 MCP](#development-workflow-with-context7-mcp)
9. [Success Criteria](#success-criteria)
10. [Risk Assessment](#risk-assessment)

---

## Current State Analysis

### Existing Components

#### Admin Panel (`admin-panel/src/app/obs-instances/page.tsx`)
- Polls `/api/clients` every 3 seconds
- Transforms `OBSClient` to `OBSInstance` format
- Hardcoded instance names (`OBS Instance ${clientId}`)
- Location set to "Unknown"
- Add Instance form exists but shows alert without persistence
- Action buttons (start/stop recording) functional via `/api/action/:clientId/:action`

#### Server API (`server-api/src/obs/`)
**Available Endpoints:**
- `GET /api/clients` - Returns connected clients with `clientId` and `connected` timestamp
- `POST /api/command/:clientId` - Sends OBS WebSocket commands
- `POST /api/broadcast` - Broadcasts commands to all clients
- `POST /api/action/:clientId/:action` - Quick actions (start-stream, stop-stream, start-recording, stop-recording, status, scenes)

**Current Data Model:**
```typescript
interface OBSClient {
  ws: WebSocket;
  clientId: string;
  connected: Date;
}

interface ClientInfo {
  clientId: string;
  connected: Date;
}
```

**Limitations:**
- No database layer
- No persistence of instance metadata (name, location, capacity, etc.)
- No instance registration system
- No tracking of recording state, streaming state, or current scene
- Client information lost on server restart

#### API Client (`admin-panel/src/lib/api/client.ts`)
- Functional for current endpoints
- No methods for instance CRUD operations
- Type definitions exist but not fully utilised

---

## Requirements

### Functional Requirements

#### FR-1: Instance Registration
- **FR-1.1**: Administrators shall register OBS instances with metadata (name, location, capacity, description)
- **FR-1.2**: Each instance shall have a unique client ID that matches the OBS Bridge client configuration
- **FR-1.3**: Instances can be registered before or after the OBS Bridge client connects
- **FR-1.4**: Instance metadata shall persist across server restarts

#### FR-2: Instance Status Tracking
- **FR-2.1**: System shall display real-time connection status (online/offline/busy)
- **FR-2.2**: System shall track and display:
  - Connection timestamp
  - Last seen timestamp
  - Current recording state
  - Current streaming state
  - Current scene
  - Available scenes list
- **FR-2.3**: Status updates shall occur in near real-time (≤5 second latency)

#### FR-3: Instance Management
- **FR-3.1**: Administrators shall view all registered instances in a table format
- **FR-3.2**: Administrators shall edit instance metadata
- **FR-3.3**: Administrators shall delete/deregister instances
- **FR-3.4**: System shall display statistics: Total Instances, Online, Offline, Busy

#### FR-4: Instance Control
- **FR-4.1**: Administrators shall start/stop recording on online instances
- **FR-4.2**: Administrators shall start/stop streaming on online instances
- **FR-4.3**: Control actions shall only be available for online instances
- **FR-4.4**: System shall provide feedback on action success/failure

### Non-Functional Requirements

#### NFR-1: Performance
- API response time ≤200ms for CRUD operations
- Real-time updates delivered within 5 seconds
- Support for 50+ simultaneous OBS instances

#### NFR-2: Reliability
- 99.9% uptime for API endpoints
- Graceful handling of WebSocket disconnections
- Data consistency between database and in-memory state

#### NFR-3: Maintainability
- Type-safe implementation (TypeScript strict mode)
- Comprehensive API documentation
- Unit test coverage ≥80%
- E2E test coverage for critical paths

#### NFR-4: Security
- Input validation for all API endpoints
- SQL injection prevention (ORM/query builder)
- Rate limiting on API endpoints

---

## Technical Architecture

### Technology Stack

#### Backend (server-api)
- **Framework**: NestJS 11.x
- **Database ORM**: Prisma 6.x (recommended) or TypeORM 0.3.x
- **Database**: PostgreSQL 16.x (production) / SQLite (development)
- **Validation**: class-validator, class-transformer
- **WebSocket**: @nestjs/websockets, ws

#### Frontend (admin-panel)
- **Framework**: Next.js 15.x (App Router)
- **State Management**: React hooks + SWR for data fetching
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Form Handling**: react-hook-form + zod

### Architecture Patterns

#### Backend Patterns
- Repository Pattern for data access
- Service Layer for business logic
- DTO Pattern for request/response validation
- Event-Driven Architecture for real-time updates

#### Frontend Patterns
- Server Components for initial data loading
- Client Components for interactivity
- Optimistic Updates for better UX
- SWR for automatic revalidation and caching

---

## Database Schema

### Prisma Schema (Recommended)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model OBSInstance {
  id          String   @id @default(uuid())
  clientId    String   @unique
  name        String
  location    String?
  description String?
  capacity    Int      @default(1)
  metadata    Json?    @db.JsonB

  // Status tracking (updated via WebSocket events)
  status          String   @default("offline") // online, offline, busy
  isStreaming     Boolean  @default(false)
  isRecording     Boolean  @default(false)
  currentScene    String?
  scenes          Json?    @db.JsonB
  lastSeenAt      DateTime?
  connectedAt     DateTime?

  // Relationships
  schedules   Schedule[]
  bookings    Booking[]

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([clientId])
  @@map("obs_instances")
}

model Schedule {
  id            String    @id @default(uuid())
  obsInstanceId String
  obsInstance   OBSInstance @relation(fields: [obsInstanceId], references: [id], onDelete: Cascade)

  title         String
  description   String?
  startTime     DateTime
  endTime       DateTime
  scene         String?
  status        String    @default("scheduled") // scheduled, active, completed, cancelled

  recurring     Json?     @db.JsonB // RecurringPattern

  bookings      Booking[]

  createdBy     String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([obsInstanceId])
  @@index([status])
  @@map("schedules")
}

model Booking {
  id            String    @id @default(uuid())
  scheduleId    String
  schedule      Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)

  obsInstanceId String
  obsInstance   OBSInstance @relation(fields: [obsInstanceId], references: [id], onDelete: Cascade)

  userId        String
  userName      String
  userEmail     String

  startTime     DateTime
  endTime       DateTime
  scene         String?
  status        String    @default("pending") // pending, confirmed, in_progress, completed, cancelled
  notes         String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([scheduleId])
  @@index([obsInstanceId])
  @@index([userId])
  @@index([status])
  @@map("bookings")
}
```

### Database Design Rationale

1. **UUID Primary Keys**: Better for distributed systems and prevents enumeration attacks
2. **JSON Fields**: Flexible storage for scenes list and recurring patterns
3. **Indexes**: Optimised for common query patterns (status lookups, client ID searches)
4. **Cascade Deletes**: Maintains referential integrity when instances are removed
5. **Timestamps**: Audit trail for all records

---

## API Specifications

### Instance Management Endpoints

#### 1. Create Instance
```http
POST /api/admin/instances
Content-Type: application/json

{
  "clientId": "studio-a-obs",
  "name": "Studio A",
  "location": "Building 3, Room 201",
  "description": "Main recording studio with green screen",
  "capacity": 2,
  "metadata": {
    "hasGreenScreen": true,
    "equipment": ["webcam", "microphone", "lighting"]
  }
}

Response 201:
{
  "id": "uuid",
  "clientId": "studio-a-obs",
  "name": "Studio A",
  "location": "Building 3, Room 201",
  "description": "Main recording studio with green screen",
  "capacity": 2,
  "status": "offline",
  "metadata": { ... },
  "createdAt": "2025-10-18T10:00:00Z",
  "updatedAt": "2025-10-18T10:00:00Z"
}

Response 400 (Validation Error):
{
  "statusCode": 400,
  "message": ["clientId must be a string", "name must be a string"],
  "error": "Bad Request"
}

Response 409 (Conflict):
{
  "statusCode": 409,
  "message": "Instance with clientId 'studio-a-obs' already exists",
  "error": "Conflict"
}
```

#### 2. Get All Instances
```http
GET /api/admin/instances?status=online&page=1&limit=20

Response 200:
{
  "instances": [
    {
      "id": "uuid",
      "clientId": "studio-a-obs",
      "name": "Studio A",
      "location": "Building 3, Room 201",
      "status": "online",
      "isStreaming": false,
      "isRecording": true,
      "currentScene": "Main Camera",
      "scenes": ["Main Camera", "Screen Share", "Interview"],
      "connectedAt": "2025-10-18T09:30:00Z",
      "lastSeenAt": "2025-10-18T10:15:00Z",
      "createdAt": "2025-10-18T08:00:00Z",
      "updatedAt": "2025-10-18T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 3. Get Instance by ID
```http
GET /api/admin/instances/:id

Response 200:
{
  "id": "uuid",
  "clientId": "studio-a-obs",
  "name": "Studio A",
  ...
}

Response 404:
{
  "statusCode": 404,
  "message": "Instance not found",
  "error": "Not Found"
}
```

#### 4. Update Instance
```http
PATCH /api/admin/instances/:id
Content-Type: application/json

{
  "name": "Studio A - Updated",
  "location": "Building 3, Room 202",
  "capacity": 3
}

Response 200:
{
  "id": "uuid",
  "name": "Studio A - Updated",
  "location": "Building 3, Room 202",
  "capacity": 3,
  ...
}

Response 404:
{
  "statusCode": 404,
  "message": "Instance not found"
}
```

#### 5. Delete Instance
```http
DELETE /api/admin/instances/:id

Response 204: No Content

Response 404:
{
  "statusCode": 404,
  "message": "Instance not found"
}

Response 409:
{
  "statusCode": 409,
  "message": "Cannot delete instance with active bookings"
}
```

#### 6. Get Instance Statistics
```http
GET /api/admin/instances/stats

Response 200:
{
  "total": 45,
  "online": 38,
  "offline": 5,
  "busy": 2,
  "streaming": 12,
  "recording": 18
}
```

### Enhanced Client Endpoint

#### Get Connected Clients with Full Details
```http
GET /api/clients/detailed

Response 200:
{
  "clients": [
    {
      "clientId": "studio-a-obs",
      "instance": {
        "id": "uuid",
        "name": "Studio A",
        "location": "Building 3, Room 201",
        "status": "online",
        "isStreaming": false,
        "isRecording": true,
        "currentScene": "Main Camera",
        "scenes": ["Main Camera", "Screen Share"]
      },
      "connected": "2025-10-18T09:30:00Z"
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Database Setup and Backend Foundation (4-6 hours)

#### Step 1.1: Install and Configure Prisma
```bash
cd server-api
npm install prisma @prisma/client
npx prisma init
```

**Context7 MCP Usage:**
```
Query: "Prisma NestJS integration best practices"
Purpose: Get up-to-date documentation for Prisma with NestJS
Library: prisma, @nestjs/common
```

**Tasks:**
1. Create `prisma/schema.prisma` with OBSInstance model
2. Configure `.env` with `DATABASE_URL`
3. Run `npx prisma generate` to generate Prisma Client
4. Run `npx prisma migrate dev --name init_obs_instances` to create migration

**Deliverable:** Working Prisma setup with OBSInstance table

#### Step 1.2: Create Prisma Service Module
**File:** `src/prisma/prisma.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**File:** `src/prisma/prisma.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Testing with Playwright MCP:**
Not applicable for this step (database setup)

---

### Phase 2: Instance Repository and Service Layer (4-6 hours)

#### Step 2.1: Create DTOs for Validation
**File:** `src/obs/dto/create-instance.dto.ts`

**Context7 MCP Usage:**
```
Query: "class-validator decorators for NestJS DTOs"
Purpose: Ensure correct validation patterns
Library: class-validator
```

```typescript
import { IsString, IsOptional, IsInt, Min, IsObject, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateInstanceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

**File:** `src/obs/dto/update-instance.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateInstanceDto } from './create-instance.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateInstanceDto extends PartialType(
  OmitType(CreateInstanceDto, ['clientId'] as const)
) {}
```

#### Step 2.2: Create Instance Service
**File:** `src/obs/obs-instance.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OBSInstanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInstanceDto) {
    try {
      return await this.prisma.oBSInstance.create({
        data: {
          clientId: dto.clientId,
          name: dto.name,
          location: dto.location,
          description: dto.description,
          capacity: dto.capacity || 1,
          metadata: dto.metadata || {},
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `Instance with clientId '${dto.clientId}' already exists`,
          );
        }
      }
      throw error;
    }
  }

  async findAll(status?: string, page = 1, limit = 20) {
    const where: Prisma.OBSInstanceWhereInput = status ? { status } : {};

    const [instances, total] = await Promise.all([
      this.prisma.oBSInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.oBSInstance.count({ where }),
    ]);

    return {
      instances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const instance = await this.prisma.oBSInstance.findUnique({
      where: { id },
    });

    if (!instance) {
      throw new NotFoundException('Instance not found');
    }

    return instance;
  }

  async findByClientId(clientId: string) {
    return this.prisma.oBSInstance.findUnique({
      where: { clientId },
    });
  }

  async update(id: string, dto: UpdateInstanceDto) {
    try {
      return await this.prisma.oBSInstance.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Instance not found');
        }
      }
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.oBSInstance.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Instance not found');
        }
      }
      throw error;
    }
  }

  async updateStatus(
    clientId: string,
    status: 'online' | 'offline' | 'busy',
    additional?: {
      isStreaming?: boolean;
      isRecording?: boolean;
      currentScene?: string;
      scenes?: string[];
      connectedAt?: Date;
      lastSeenAt?: Date;
    },
  ) {
    const instance = await this.findByClientId(clientId);
    if (!instance) {
      // Instance not registered yet - skip update
      return null;
    }

    return this.prisma.oBSInstance.update({
      where: { clientId },
      data: {
        status,
        ...additional,
      },
    });
  }

  async getStats() {
    const [total, online, offline, busy, streaming, recording] = await Promise.all([
      this.prisma.oBSInstance.count(),
      this.prisma.oBSInstance.count({ where: { status: 'online' } }),
      this.prisma.oBSInstance.count({ where: { status: 'offline' } }),
      this.prisma.oBSInstance.count({ where: { status: 'busy' } }),
      this.prisma.oBSInstance.count({ where: { isStreaming: true } }),
      this.prisma.oBSInstance.count({ where: { isRecording: true } }),
    ]);

    return { total, online, offline, busy, streaming, recording };
  }
}
```

**Testing:**
Create unit tests in `src/obs/obs-instance.service.spec.ts`

---

### Phase 3: Instance Admin Controller (3-4 hours)

#### Step 3.1: Create Admin Controller
**File:** `src/obs/obs-admin.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { OBSInstanceService } from './obs-instance.service';
import { CreateInstanceDto } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';

@Controller('api/admin/instances')
export class OBSAdminController {
  constructor(private readonly instanceService: OBSInstanceService) {}

  @Post()
  create(@Body() dto: CreateInstanceDto) {
    return this.instanceService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.instanceService.findAll(status, page, limit);
  }

  @Get('stats')
  getStats() {
    return this.instanceService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.instanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInstanceDto) {
    return this.instanceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.instanceService.delete(id);
  }
}
```

#### Step 3.2: Update OBS Module
**File:** `src/obs/obs.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { OBSController } from './obs.controller';
import { OBSAdminController } from './obs-admin.controller';
import { OBSClientService } from './obs-client.service';
import { OBSInstanceService } from './obs-instance.service';

@Module({
  controllers: [OBSController, OBSAdminController],
  providers: [OBSClientService, OBSInstanceService],
  exports: [OBSClientService, OBSInstanceService],
})
export class OBSModule {}
```

**Testing with Playwright MCP:**
Not yet - API testing in later phase

---

### Phase 4: WebSocket Integration for Real-Time Status (4-5 hours)

#### Step 4.1: Enhance OBSClientService to Update Database
**File:** `src/obs/obs-client.service.ts` (modify existing)

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebSocket } from 'ws';
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

  async handleOBSEvent(clientId: string, message: OBSMessage): Promise<void> {
    switch (message.event) {
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
          currentScene: message.data?.sceneName,
          lastSeenAt: new Date(),
        });
        break;

      case 'SceneListChanged':
        await this.instanceService.updateStatus(clientId, 'online', {
          scenes: message.data?.scenes || [],
          lastSeenAt: new Date(),
        });
        break;

      default:
        this.logger.log(`Event from ${clientId}: ${message.event}`, message.data);
    }
  }

  // Keep existing methods...
}
```

**Testing:**
Create integration tests for WebSocket status updates

---

### Phase 5: Frontend API Client Updates (2-3 hours)

#### Step 5.1: Update API Client
**File:** `admin-panel/src/lib/api/client.ts` (add methods)

**Context7 MCP Usage:**
```
Query: "SWR React data fetching patterns"
Purpose: Learn best practices for data fetching with SWR
Library: swr
```

```typescript
import type { OBSInstance } from '@/types';

// Add to APIClient class:

// Instance management
async getInstances(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  instances: OBSInstance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString();
  return this.request<any>(
    `/api/admin/instances${queryString ? `?${queryString}` : ''}`
  );
}

async getInstanceStats(): Promise<{
  total: number;
  online: number;
  offline: number;
  busy: number;
  streaming: number;
  recording: number;
}> {
  return this.request<any>('/api/admin/instances/stats');
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
  return this.request<void>(`/api/admin/instances/${id}`, {
    method: 'DELETE',
  });
}
```

---

### Phase 6: Frontend Implementation (6-8 hours)

#### Step 6.1: Install SWR for Data Fetching
```bash
cd admin-panel
npm install swr
```

#### Step 6.2: Update OBS Instances Page
**File:** `admin-panel/src/app/obs-instances/page.tsx` (major refactor)

**Context7 MCP Usage:**
```
Query: "React Hook Form with Zod validation"
Purpose: Implement form handling correctly
Library: react-hook-form, zod
```

```typescript
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Plus, Monitor, Circle, Video, VideoOff, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { OBSInstance } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function OBSInstancesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [deleteInstanceId, setDeleteInstanceId] = React.useState<string | null>(null);
  const [editingInstance, setEditingInstance] = React.useState<OBSInstance | null>(null);

  // Fetch instances with SWR (auto-refresh every 3 seconds)
  const { data, error, isLoading, mutate } = useSWR(
    'instances',
    () => apiClient.getInstances(),
    { refreshInterval: 3000 }
  );

  // Fetch stats
  const { data: stats } = useSWR(
    'instance-stats',
    () => apiClient.getInstanceStats(),
    { refreshInterval: 3000 }
  );

  const instances = data?.instances || [];

  // Form state for new instance
  const [newInstance, setNewInstance] = React.useState({
    clientId: '',
    name: '',
    location: '',
    description: '',
    capacity: 1,
  });

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.createInstance(newInstance);
      toast({
        title: 'Success',
        description: 'Instance registered successfully',
      });
      setIsAddDialogOpen(false);
      setNewInstance({ clientId: '', name: '', location: '', description: '', capacity: 1 });
      mutate(); // Refresh data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register instance',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstance) return;

    try {
      await apiClient.updateInstance(editingInstance.id, {
        name: editingInstance.name,
        location: editingInstance.location,
        description: editingInstance.description,
        capacity: editingInstance.capacity,
      });
      toast({
        title: 'Success',
        description: 'Instance updated successfully',
      });
      setIsEditDialogOpen(false);
      setEditingInstance(null);
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update instance',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInstance = async () => {
    if (!deleteInstanceId) return;

    try {
      await apiClient.deleteInstance(deleteInstanceId);
      toast({
        title: 'Success',
        description: 'Instance deleted successfully',
      });
      setDeleteInstanceId(null);
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete instance',
        variant: 'destructive',
      });
    }
  };

  const handleCommand = async (instance: OBSInstance, action: string) => {
    try {
      await apiClient.sendAction(
        instance.clientId,
        action as 'start-stream' | 'stop-stream' | 'start-recording' | 'stop-recording'
      );
      toast({
        title: 'Success',
        description: `Command sent to ${instance.name}`,
      });

      // Optimistic update
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send command',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OBS Instances</h1>
          <p className="text-muted-foreground">
            Manage and monitor OBS recording instances
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Instance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New OBS Instance</DialogTitle>
              <DialogDescription>
                Configure a new OBS instance that students can book for recordings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInstance} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  placeholder="e.g. studio-a-obs"
                  value={newInstance.clientId}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, clientId: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must match the client ID in the OBS Bridge configuration.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Instance Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Studio A"
                  value={newInstance.name}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Building 3, Room 201"
                  value={newInstance.location}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this instance"
                  value={newInstance.description}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={newInstance.capacity}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, capacity: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Register Instance</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Circle className="h-4 w-4 fill-green-600 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.online || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recording</CardTitle>
            <Circle className="h-4 w-4 fill-red-600 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recording || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streaming</CardTitle>
            <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streaming || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Instances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Instances</CardTitle>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Scene</TableHead>
                  <TableHead>Connected At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell>{instance.location || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {instance.clientId}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={instance.status} />
                    </TableCell>
                    <TableCell>
                      <StateBadges
                        isRecording={instance.isRecording}
                        isStreaming={instance.isStreaming}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {instance.currentScene || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {instance.connectedAt
                        ? new Date(instance.connectedAt).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <ActionButtons
                        instance={instance}
                        onCommand={handleCommand}
                        onEdit={() => {
                          setEditingInstance(instance);
                          setIsEditDialogOpen(true);
                        }}
                        onDelete={() => setDeleteInstanceId(instance.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingInstance && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {/* Similar form structure to Add Dialog */}
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteInstanceId}
        onOpenChange={() => setDeleteInstanceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this instance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInstance}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper components (StatusBadge, StateBadges, ActionButtons, etc.)
```

**Note:** Complete component implementation would include helper components and proper error handling.

---

### Phase 7: Testing with Playwright MCP (4-6 hours)

#### Step 7.1: API Endpoint Testing

**Test Script:** Manual testing using Playwright MCP

```typescript
// Test sequence to run via Playwright MCP

// 1. Ensure server is running
// Check: http://localhost:8000/health

// 2. Test Create Instance
POST http://localhost:8000/api/admin/instances
{
  "clientId": "test-studio-playwright",
  "name": "Test Studio via Playwright",
  "location": "Test Building",
  "capacity": 2
}

// 3. Test Get All Instances
GET http://localhost:8000/api/admin/instances

// 4. Test Get Stats
GET http://localhost:8000/api/admin/instances/stats

// 5. Test Update Instance (use ID from step 2)
PATCH http://localhost:8000/api/admin/instances/{id}
{
  "name": "Updated Test Studio"
}

// 6. Test Delete Instance
DELETE http://localhost:8000/api/admin/instances/{id}
```

**Playwright MCP Commands:**
```bash
# Navigate to admin panel
playwright_navigate("http://localhost:3000/obs-instances")

# Take initial screenshot
playwright_screenshot("instances-initial", fullPage=true)

# Click Add Instance button
playwright_click("button:has-text('Add Instance')")

# Fill form
playwright_fill("#clientId", "test-studio-playwright")
playwright_fill("#name", "Test Studio")
playwright_fill("#location", "Building 1")

# Submit form
playwright_click("button[type='submit']:has-text('Register')")

# Wait and verify
playwright_screenshot("instances-after-add", fullPage=true)

# Test edit functionality
playwright_click("button[aria-label='Edit']:first")
playwright_fill("#name", "Updated Test Studio")
playwright_click("button[type='submit']:has-text('Update')")

# Test delete
playwright_click("button[aria-label='Delete']:first")
playwright_click("button:has-text('Delete'):has-text('Confirm')")

# Final screenshot
playwright_screenshot("instances-after-delete", fullPage=true)
```

#### Step 7.2: End-to-End Test Scenarios

**Scenario 1: Register Instance and Verify Connection**
1. Navigate to OBS Instances page
2. Click "Add Instance"
3. Fill in instance details
4. Submit form
5. Verify instance appears in table with "offline" status
6. Start OBS Bridge client with matching clientId
7. Verify status changes to "online"
8. Take screenshot for documentation

**Scenario 2: Control Recording State**
1. Ensure instance is online
2. Click "Start Recording" button
3. Verify recording indicator appears
4. Verify status badge updates
5. Click "Stop Recording"
6. Verify recording indicator disappears

**Scenario 3: Update Instance Metadata**
1. Click edit button for an instance
2. Update name and location
3. Save changes
4. Verify updates appear in table

**Scenario 4: Delete Instance with Safeguards**
1. Try to delete instance with active bookings
2. Verify error message appears
3. Delete instance without bookings
4. Verify deletion confirmation dialog
5. Confirm deletion
6. Verify instance removed from table

---

## Testing Strategy with Playwright MCP

### Integration Testing Workflow

#### Setup
```bash
# Ensure both servers are running
cd server-api && npm run start:dev &
cd admin-panel && npm run dev &
```

#### Test Execution Pattern

1. **Manual Playwright MCP Testing**
   - Use `mcp__playwright__playwright_navigate` to open pages
   - Use `mcp__playwright__playwright_click` for interactions
   - Use `mcp__playwright__playwright_fill` for form inputs
   - Use `mcp__playwright__playwright_screenshot` for visual verification
   - Use `mcp__playwright__playwright_get_visible_text` for content verification

2. **Automated Test Script** (future enhancement)
   - Create `tests/e2e/obs-instances.spec.ts` using Playwright Test
   - Run via `npx playwright test`

#### Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TC-001 | Register new instance | Navigate → Click Add → Fill form → Submit | Instance appears in table |
| TC-002 | Verify stats update | Register instance → Check stats card | Total count increments |
| TC-003 | Update instance | Click Edit → Modify fields → Save | Changes reflected immediately |
| TC-004 | Delete instance | Click Delete → Confirm | Instance removed from table |
| TC-005 | Connection status | Start OBS client | Status changes to "online" |
| TC-006 | Recording control | Click Start Recording | Recording badge appears |
| TC-007 | Form validation | Submit empty form | Validation errors shown |
| TC-008 | Duplicate client ID | Register with existing ID | Conflict error displayed |

### Performance Testing

- Load 50+ instances and verify table renders within 2 seconds
- Test polling behaviour (verify requests every 3 seconds)
- Test WebSocket updates latency

---

## Development Workflow with Context7 MCP

### When to Use Context7 MCP

#### Library Documentation Queries

1. **Prisma Setup**
   ```
   Query: "Prisma NestJS integration complete guide"
   Use Case: Initial Prisma configuration
   Expected: Migration setup, PrismaService pattern, best practices
   ```

2. **Class Validator**
   ```
   Query: "class-validator all decorators reference"
   Use Case: Creating DTOs with proper validation
   Expected: Complete list of validation decorators with examples
   ```

3. **SWR Data Fetching**
   ```
   Query: "SWR mutation and revalidation patterns"
   Use Case: Implementing optimistic updates
   Expected: mutate() usage, revalidation strategies
   ```

4. **React Hook Form with Zod**
   ```
   Query: "React Hook Form Zod resolver integration"
   Use Case: Form validation in Add/Edit dialogs
   Expected: useForm setup, zodResolver usage, error handling
   ```

5. **Radix UI Dialog**
   ```
   Query: "Radix UI Dialog controlled state management"
   Use Case: Managing dialog open/close state
   Expected: Controlled vs uncontrolled usage, onOpenChange handler
   ```

### Development Process

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Iteration                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Read Requirement     │
                   │  (This Document)      │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Context7 MCP:       │
                   │  Get Library Docs    │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Implement Feature   │
                   │  (Code Changes)      │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Playwright MCP:     │
                   │  Test Feature        │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  Screenshot &        │
                   │  Verify              │
                   └──────────┬───────────┘
                              │
                     ┌────────┴────────┐
                     │                 │
                  Pass              Fail
                     │                 │
                     ▼                 ▼
              ┌──────────┐      ┌─────────┐
              │  Commit  │      │  Debug  │
              └──────────┘      └────┬────┘
                                     │
                                     └──────┐
                                            │
                              ┌─────────────┘
                              │
                              ▼
                   (Return to Implement)
```

---

## Success Criteria

### Phase Completion Criteria

#### Phase 1 (Database) ✅
- [ ] Prisma schema defined with OBSInstance model
- [ ] Migrations generated and applied
- [ ] PrismaService injectable globally
- [ ] Database connection verified

#### Phase 2 (Service Layer) ✅
- [ ] All CRUD operations implemented
- [ ] Unit tests passing (≥80% coverage)
- [ ] DTOs with validation decorators
- [ ] Error handling for all edge cases

#### Phase 3 (API Endpoints) ✅
- [ ] All REST endpoints functional
- [ ] API returns proper HTTP status codes
- [ ] Validation errors properly formatted
- [ ] Integration tests passing

#### Phase 4 (WebSocket Integration) ✅
- [ ] Client connect/disconnect updates database
- [ ] OBS events update instance state
- [ ] Status changes reflected in database within 1 second
- [ ] No race conditions in concurrent updates

#### Phase 5 (Frontend API Client) ✅
- [ ] All API methods implemented
- [ ] TypeScript types align with backend
- [ ] Error handling for network failures

#### Phase 6 (Frontend UI) ✅
- [ ] All CRUD operations functional via UI
- [ ] SWR auto-refresh working (3 second interval)
- [ ] Optimistic updates for better UX
- [ ] Form validation working
- [ ] Toast notifications for user feedback
- [ ] Loading states and error states

#### Phase 7 (Testing) ✅
- [ ] All test scenarios pass
- [ ] Screenshots captured for documentation
- [ ] Performance metrics meet requirements
- [ ] No console errors during testing

### Overall Success Metrics

- **Functional**: All FR requirements met
- **Performance**: NFR-1 targets achieved
- **Code Quality**:
  - TypeScript strict mode enabled
  - No `any` types (except where absolutely necessary)
  - ESLint passing with no warnings
  - Prettier formatting applied
- **Testing**:
  - ≥80% unit test coverage
  - All E2E scenarios passing
  - Playwright screenshots captured
- **Documentation**:
  - API endpoints documented
  - Code comments in British English
  - README updated

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration failures | High | Low | Use Prisma migrations with rollback capability |
| WebSocket connection instability | Medium | Medium | Implement heartbeat/ping mechanism, reconnection logic |
| Race conditions in status updates | High | Medium | Use database transactions, optimistic locking |
| Frontend state desynchronisation | Medium | Low | SWR handles cache invalidation automatically |
| Performance degradation with many instances | Medium | Low | Implement pagination, indexing, query optimisation |

### Process Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Unclear requirements | High | Low | This detailed specification document |
| Breaking changes to existing functionality | Medium | Medium | Comprehensive testing before deployment |
| Time estimation inaccuracy | Low | Medium | Phased approach allows for adjustment |

---

## Appendix A: Example API Requests

### cURL Examples

#### Create Instance
```bash
curl -X POST http://localhost:8000/api/admin/instances \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "studio-a",
    "name": "Studio A",
    "location": "Building 3, Room 201",
    "capacity": 2
  }'
```

#### Get All Instances
```bash
curl http://localhost:8000/api/admin/instances
```

#### Get Statistics
```bash
curl http://localhost:8000/api/admin/instances/stats
```

#### Update Instance
```bash
curl -X PATCH http://localhost:8000/api/admin/instances/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Studio A - Updated"
  }'
```

#### Delete Instance
```bash
curl -X DELETE http://localhost:8000/api/admin/instances/{id}
```

---

## Appendix B: Playwright MCP Test Script Template

```typescript
// Template for testing via Playwright MCP

// 1. Start test session
await playwright_navigate("http://localhost:3000/obs-instances");
await playwright_screenshot("test-start");

// 2. Test create flow
await playwright_click("button:has-text('Add Instance')");
await playwright_fill("#clientId", "test-instance");
await playwright_fill("#name", "Test Instance");
await playwright_fill("#location", "Test Location");
await playwright_click("button[type='submit']");
await playwright_screenshot("after-create");

// 3. Verify in table
const text = await playwright_get_visible_text();
console.assert(text.includes("Test Instance"));

// 4. Test edit flow
await playwright_click("button[aria-label='Edit']:first");
await playwright_fill("#name", "Updated Test Instance");
await playwright_click("button[type='submit']");
await playwright_screenshot("after-edit");

// 5. Test delete flow
await playwright_click("button[aria-label='Delete']:first");
await playwright_click("button:has-text('Delete')");
await playwright_screenshot("after-delete");

// 6. Close browser
await playwright_close();
```

---

## Appendix C: Git Commit Strategy

Following Conventional Commits format:

```
feat(obs-instances): add Prisma schema for OBS instances
feat(obs-instances): implement instance service with CRUD operations
feat(obs-instances): create admin API endpoints
feat(obs-instances): integrate WebSocket status updates with database
feat(obs-instances): add SWR data fetching to admin panel
feat(obs-instances): implement instance management UI
test(obs-instances): add Playwright E2E tests
docs(obs-instances): update README with new endpoints
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-18 | System | Initial requirement specification |

---

**End of Document**
