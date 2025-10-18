-- CreateTable
CREATE TABLE "obs_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "isStreaming" BOOLEAN NOT NULL DEFAULT false,
    "isRecording" BOOLEAN NOT NULL DEFAULT false,
    "currentScene" TEXT,
    "scenes" JSONB,
    "lastSeenAt" DATETIME,
    "connectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "obsInstanceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "scene" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "recurring" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "schedules_obsInstanceId_fkey" FOREIGN KEY ("obsInstanceId") REFERENCES "obs_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "obsInstanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "scene" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_obsInstanceId_fkey" FOREIGN KEY ("obsInstanceId") REFERENCES "obs_instances" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "obs_instances_clientId_key" ON "obs_instances"("clientId");

-- CreateIndex
CREATE INDEX "obs_instances_status_idx" ON "obs_instances"("status");

-- CreateIndex
CREATE INDEX "obs_instances_clientId_idx" ON "obs_instances"("clientId");

-- CreateIndex
CREATE INDEX "schedules_obsInstanceId_idx" ON "schedules"("obsInstanceId");

-- CreateIndex
CREATE INDEX "schedules_status_idx" ON "schedules"("status");

-- CreateIndex
CREATE INDEX "bookings_scheduleId_idx" ON "bookings"("scheduleId");

-- CreateIndex
CREATE INDEX "bookings_obsInstanceId_idx" ON "bookings"("obsInstanceId");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
