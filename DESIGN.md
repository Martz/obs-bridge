# Flexible Duration Scheduling Design Specification

## 1. Overview

### 1.1 Problem Statement
The current scheduling system is limited to fixed 1-hour time slots (9:00-10:00, 10:00-11:00, etc.). This inflexible approach doesn't match modern scheduling expectations where users need the ability to book appointments of varying lengths (e.g., 15 minutes, 30 minutes, 1 hour 15 minutes).

### 1.2 Goals
Transform the scheduling system to support flexible duration booking similar to Microsoft Teams or iCal:
- Allow users to select any duration in 15-minute increments
- Support bookings from 15 minutes to 8 hours (configurable maximum)
- Enable dynamic time slot generation based on availability
- Maintain backward compatibility with existing OBS instance management

### 1.3 Scope
**In Scope:**
- Frontend booking interface with duration selection
- Backend API for availability checking with custom durations
- Time slot generation algorithm supporting 15-minute increments
- Conflict detection for overlapping bookings
- UI/UX for selecting start time and duration

**Out of Scope (Future Phases):**
- Recurring bookings with custom durations
- Buffer time between bookings
- Multi-day bookings
- Dynamic pricing based on duration

---

## 2. Current State Analysis

### 2.1 Current Limitations
1. **Hardcoded Slot Generation**: `generateAvailability()` in `/frontend/src/lib/mockData.ts` creates fixed hourly slots
2. **No Duration Field**: Duration is implicit (always 1 hour), calculated as `endTime - startTime`
3. **No Backend Scheduling API**: All logic is frontend mock data
4. **Fixed Time Boundaries**: Slots always align to hour boundaries (9:00, 10:00, etc.)

### 2.2 Current Strengths
1. **Flexible Type Definitions**: Admin panel types already use `Date` objects for start/end times
2. **Generic Components**: Frontend components work with any slot structure
3. **OBS Instance Awareness**: System tracks which instances are available for each slot
4. **Clean Separation**: Clear separation between frontend, admin, and backend concerns

---

## 3. Data Model Changes

### 3.1 TimeSlot Interface (Frontend)
**File:** `/frontend/src/lib/mockData.ts`

```typescript
interface TimeSlot {
  id: string;
  startTime: Date;              // Changed from string to Date
  endTime: Date;                // Changed from string to Date
  durationMinutes: number;      // New field: explicit duration (15, 30, 45, 60, etc.)
  availableInstances: string[];
}

interface DayAvailability {
  date: Date;
  slots: TimeSlot[];
}
```

**Breaking Change:** `startTime` and `endTime` change from strings (`"09:00"`) to Date objects.

**Migration Strategy:** Update all components consuming `TimeSlot` to use `date-fns` for formatting.

### 3.2 Schedule and Booking Models (Admin/Backend)
**Files:**
- `/admin-panel/src/types/index.ts`
- `/server-api/src/schedules/` (new module)

**No Changes Required** - Existing models already support flexible durations:
```typescript
interface Schedule {
  startTime: Date;
  endTime: Date;
  // Duration is calculated: differenceInMinutes(endTime, startTime)
}
```

### 3.3 Availability Configuration (New)
**File:** `/server-api/src/schedules/entities/availability-config.entity.ts` (new)

```typescript
interface AvailabilityConfig {
  id: string;
  instanceId: string;              // OBS instance ID
  dayOfWeek: number;               // 0-6 (Sunday-Saturday)
  startHour: number;               // Operating hours start (e.g., 9)
  endHour: number;                 // Operating hours end (e.g., 17)
  slotIncrementMinutes: number;    // Slot increment (default: 15)
  minimumDurationMinutes: number;  // Minimum booking duration (default: 15)
  maximumDurationMinutes: number;  // Maximum booking duration (default: 480 = 8 hours)
  bufferMinutes?: number;          // Optional buffer between bookings (default: 0)
}
```

This configuration allows per-instance customisation of availability rules.

---

## 4. Scheduling Algorithm Design

### 4.1 Slot Generation Strategy

**Approach:** Generate available start times (not full slots) and let users choose duration.

#### Option A: Start Time Generation (Recommended)
Users select a start time, then choose their desired duration. System validates availability.

**Advantages:**
- Matches Teams/iCal UX exactly
- Fewer slots to display (every 15 minutes from 9:00-17:00 = 32 start times)
- More flexible for users
- Simpler conflict checking

**Algorithm:**
```typescript
function generateAvailableStartTimes(
  date: Date,
  instanceId: string,
  config: AvailabilityConfig,
  existingBookings: Booking[]
): Date[] {
  const startTimes: Date[] = [];
  const dayStart = setHours(setMinutes(date, 0), config.startHour);
  const dayEnd = setHours(setMinutes(date, 0), config.endHour);

  let currentTime = dayStart;

  while (isBefore(currentTime, dayEnd)) {
    // Check if this start time has conflicts
    const hasConflict = existingBookings.some(booking =>
      isWithinInterval(currentTime, {
        start: booking.startTime,
        end: booking.endTime
      })
    );

    if (!hasConflict) {
      startTimes.push(currentTime);
    }

    // Move to next increment
    currentTime = addMinutes(currentTime, config.slotIncrementMinutes);
  }

  return startTimes;
}
```

#### Option B: Fixed Duration Slots (Alternative)
Pre-generate slots at common durations (15, 30, 60 minutes) and display all.

**Disadvantages:**
- More slots to display (overwhelming UI)
- Doesn't match familiar UX patterns
- Redundant slots (9:00-9:15, 9:00-9:30, 9:00-10:00 all displayed separately)

**Decision:** Use Option A (Start Time Generation).

### 4.2 Duration Validation

When a user selects a start time and duration, validate:

```typescript
function validateBooking(
  startTime: Date,
  durationMinutes: number,
  instanceId: string,
  config: AvailabilityConfig,
  existingBookings: Booking[]
): ValidationResult {
  const endTime = addMinutes(startTime, durationMinutes);

  // 1. Check duration is valid increment
  if (durationMinutes % config.slotIncrementMinutes !== 0) {
    return { valid: false, error: 'Duration must be in 15-minute increments' };
  }

  // 2. Check minimum duration
  if (durationMinutes < config.minimumDurationMinutes) {
    return { valid: false, error: `Minimum duration is ${config.minimumDurationMinutes} minutes` };
  }

  // 3. Check maximum duration
  if (durationMinutes > config.maximumDurationMinutes) {
    return { valid: false, error: `Maximum duration is ${config.maximumDurationMinutes} minutes` };
  }

  // 4. Check end time is within operating hours
  const dayEnd = setHours(setMinutes(startTime, 0), config.endHour);
  if (isAfter(endTime, dayEnd)) {
    return { valid: false, error: 'Booking extends beyond operating hours' };
  }

  // 5. Check for conflicts with existing bookings
  const hasConflict = existingBookings.some(booking => {
    // Bookings overlap if:
    // - New booking starts during existing booking, OR
    // - New booking ends during existing booking, OR
    // - New booking completely contains existing booking
    return (
      (isAfter(startTime, booking.startTime) && isBefore(startTime, booking.endTime)) ||
      (isAfter(endTime, booking.startTime) && isBefore(endTime, booking.endTime)) ||
      (isBefore(startTime, booking.startTime) && isAfter(endTime, booking.endTime))
    );
  });

  if (hasConflict) {
    return { valid: false, error: 'This time slot conflicts with an existing booking' };
  }

  return { valid: true };
}
```

### 4.3 Availability Calculation

When checking what durations are available for a given start time:

```typescript
function getMaxAvailableDuration(
  startTime: Date,
  instanceId: string,
  config: AvailabilityConfig,
  existingBookings: Booking[]
): number {
  const dayEnd = setHours(setMinutes(startTime, 0), config.endHour);
  const maxPossibleEnd = dayEnd;

  // Find the next booking that would create a conflict
  const nextConflict = existingBookings
    .filter(booking => isAfter(booking.startTime, startTime))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  const maxEnd = nextConflict
    ? min([nextConflict.startTime, maxPossibleEnd])
    : maxPossibleEnd;

  const maxMinutes = differenceInMinutes(maxEnd, startTime);

  // Cap at configured maximum
  return Math.min(maxMinutes, config.maximumDurationMinutes);
}
```

---

## 5. Frontend Changes

### 5.1 Booking Flow Redesign

**New User Journey:**

1. User selects date from calendar *(existing)*
2. System displays available start times in 15-minute increments
3. User selects start time
4. User selects duration from dropdown (15 min, 30 min, 45 min, 1 hr, 1 hr 15 min, etc.)
5. System validates and shows available OBS instances for that specific time range
6. User selects instance and confirms booking

### 5.2 Component Changes

#### 5.2.1 AvailableSlots Component
**File:** `/frontend/src/components/booking/AvailableSlots.tsx`

**Current Behaviour:** Displays time slots as buttons (e.g., "09:00 - 10:00")

**New Behaviour:** Displays start times only (e.g., "09:00", "09:15", "09:30")

**Updated Interface:**
```typescript
interface AvailableSlotsProps {
  date: Date;
  startTimes: Date[];                    // Changed from slots
  selectedStartTime?: Date;              // Changed from selectedSlot
  onStartTimeSelect: (time: Date) => void; // Changed from onSlotSelect
  maxDurations?: Map<Date, number>;      // Optional: show max duration per start time
}
```

**UI Changes:**
- Display start times in a scrollable grid
- Show "Up to X hours available" badge if `maxDurations` provided
- Highlight selected start time

#### 5.2.2 DurationSelector Component (New)
**File:** `/frontend/src/components/booking/DurationSelector.tsx`

```typescript
interface DurationSelectorProps {
  startTime: Date;
  maxDurationMinutes: number;
  selectedDuration?: number;
  onDurationChange: (minutes: number) => void;
  incrementMinutes?: number; // Default: 15
}

export function DurationSelector({
  startTime,
  maxDurationMinutes,
  selectedDuration,
  onDurationChange,
  incrementMinutes = 15
}: DurationSelectorProps) {
  // Generate duration options from 15 min to maxDurationMinutes
  const durationOptions = useMemo(() => {
    const options: DurationOption[] = [];
    for (let mins = incrementMinutes; mins <= maxDurationMinutes; mins += incrementMinutes) {
      options.push({
        value: mins,
        label: formatDuration(mins), // e.g., "15 min", "1 hr 15 min"
        endTime: addMinutes(startTime, mins)
      });
    }
    return options;
  }, [startTime, maxDurationMinutes, incrementMinutes]);

  return (
    <Select value={selectedDuration} onValueChange={onDurationChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select duration" />
      </SelectTrigger>
      <SelectContent>
        {durationOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label} (until {format(option.endTime, 'HH:mm')})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### 5.2.3 BookingForm Component
**File:** `/frontend/src/components/booking/BookingForm.tsx`

**Changes:**
1. Add `DurationSelector` after start time display
2. Update instance availability check to use `startTime + duration`
3. Display calculated end time
4. Show validation errors from backend

**Updated State:**
```typescript
const [selectedDate, setSelectedDate] = useState<Date>();
const [selectedStartTime, setSelectedStartTime] = useState<Date>();
const [selectedDuration, setSelectedDuration] = useState<number>(); // New
const [selectedInstance, setSelectedInstance] = useState<string>();
```

### 5.3 Date Formatting Utilities

**File:** `/frontend/src/lib/dateUtils.ts` (new)

```typescript
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  }

  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
}

export function formatTimeSlot(start: Date, end: Date): string {
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
}

export function getDurationOptions(
  maxMinutes: number,
  incrementMinutes: number = 15
): { value: number; label: string }[] {
  const options = [];
  for (let mins = incrementMinutes; mins <= maxMinutes; mins += incrementMinutes) {
    options.push({
      value: mins,
      label: formatDuration(mins)
    });
  }
  return options;
}
```

---

## 6. Backend Changes

### 6.1 New Module Structure

Create a new `schedules` module in the backend:

```
server-api/src/
├── schedules/
│   ├── schedules.module.ts
│   ├── schedules.controller.ts
│   ├── schedules.service.ts
│   ├── availability.service.ts        # New service for availability logic
│   ├── dto/
│   │   ├── create-booking.dto.ts
│   │   ├── check-availability.dto.ts
│   │   └── availability-config.dto.ts
│   └── entities/
│       ├── booking.entity.ts
│       ├── schedule.entity.ts
│       └── availability-config.entity.ts
```

### 6.2 API Endpoints

#### 6.2.1 Check Availability
```http
GET /api/schedules/availability
Query Parameters:
  - date: ISO 8601 date string
  - instanceId: string (optional, if not provided returns all instances)

Response:
{
  "date": "2025-10-18",
  "instances": [
    {
      "instanceId": "obs-1",
      "instanceName": "OBS Studio - Room A",
      "availableStartTimes": [
        {
          "startTime": "2025-10-18T09:00:00Z",
          "maxDurationMinutes": 480
        },
        {
          "startTime": "2025-10-18T09:15:00Z",
          "maxDurationMinutes": 465
        },
        // ... more start times
      ],
      "config": {
        "slotIncrementMinutes": 15,
        "minimumDurationMinutes": 15,
        "maximumDurationMinutes": 480,
        "operatingHours": {
          "start": "09:00",
          "end": "17:00"
        }
      }
    }
  ]
}
```

#### 6.2.2 Validate Booking
```http
POST /api/schedules/validate
Request Body:
{
  "instanceId": "obs-1",
  "startTime": "2025-10-18T09:00:00Z",
  "durationMinutes": 45
}

Response (Success):
{
  "valid": true,
  "endTime": "2025-10-18T09:45:00Z"
}

Response (Failure):
{
  "valid": false,
  "error": "This time slot conflicts with an existing booking",
  "conflictingBooking": {
    "id": "booking-123",
    "startTime": "2025-10-18T09:30:00Z",
    "endTime": "2025-10-18T10:30:00Z"
  }
}
```

#### 6.2.3 Create Booking
```http
POST /api/schedules/bookings
Request Body:
{
  "instanceId": "obs-1",
  "startTime": "2025-10-18T09:00:00Z",
  "durationMinutes": 45,
  "userId": "user-123",
  "userName": "John Smith",
  "userEmail": "john@example.com",
  "scene": "Main Scene",
  "notes": "Product demo recording"
}

Response:
{
  "id": "booking-456",
  "instanceId": "obs-1",
  "instanceName": "OBS Studio - Room A",
  "startTime": "2025-10-18T09:00:00Z",
  "endTime": "2025-10-18T09:45:00Z",
  "durationMinutes": 45,
  "status": "confirmed",
  "userId": "user-123",
  "userName": "John Smith",
  "userEmail": "john@example.com",
  "scene": "Main Scene",
  "notes": "Product demo recording",
  "createdAt": "2025-10-18T08:00:00Z",
  "updatedAt": "2025-10-18T08:00:00Z"
}
```

#### 6.2.4 Update Booking
```http
PATCH /api/schedules/bookings/:id
Request Body:
{
  "startTime": "2025-10-18T10:00:00Z",  // Optional
  "durationMinutes": 60,                 // Optional
  "scene": "Updated Scene",              // Optional
  "notes": "Updated notes"               // Optional
}

Response: (Same as Create Booking)
```

#### 6.2.5 Delete Booking
```http
DELETE /api/schedules/bookings/:id

Response:
{
  "success": true,
  "id": "booking-456"
}
```

#### 6.2.6 Get Bookings
```http
GET /api/schedules/bookings
Query Parameters:
  - startDate: ISO 8601 date (optional)
  - endDate: ISO 8601 date (optional)
  - instanceId: string (optional)
  - userId: string (optional)
  - status: confirmed|cancelled|completed (optional)

Response:
{
  "bookings": [
    {
      "id": "booking-456",
      "instanceId": "obs-1",
      "instanceName": "OBS Studio - Room A",
      "startTime": "2025-10-18T09:00:00Z",
      "endTime": "2025-10-18T09:45:00Z",
      "durationMinutes": 45,
      "status": "confirmed",
      // ... other fields
    }
  ],
  "total": 1
}
```

### 6.3 Service Implementation

#### 6.3.1 AvailabilityService
**File:** `/server-api/src/schedules/availability.service.ts`

```typescript
@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(AvailabilityConfig)
    private configRepository: Repository<AvailabilityConfig>,
  ) {}

  async getAvailableStartTimes(
    date: Date,
    instanceId: string
  ): Promise<AvailableStartTime[]> {
    // 1. Get configuration for instance
    const config = await this.getConfig(instanceId, date.getDay());

    // 2. Get existing bookings for the date
    const bookings = await this.getBookingsForDate(date, instanceId);

    // 3. Generate start times using algorithm from Section 4.1
    return this.generateStartTimes(date, config, bookings);
  }

  async validateBooking(
    startTime: Date,
    durationMinutes: number,
    instanceId: string
  ): Promise<ValidationResult> {
    // Implementation from Section 4.2
  }

  async getMaxAvailableDuration(
    startTime: Date,
    instanceId: string
  ): Promise<number> {
    // Implementation from Section 4.3
  }
}
```

#### 6.3.2 SchedulesService
**File:** `/server-api/src/schedules/schedules.service.ts`

```typescript
@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private availabilityService: AvailabilityService,
    private obsClientService: OBSClientService, // Existing service
  ) {}

  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    // 1. Validate booking
    const validation = await this.availabilityService.validateBooking(
      dto.startTime,
      dto.durationMinutes,
      dto.instanceId
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // 2. Calculate end time
    const endTime = addMinutes(dto.startTime, dto.durationMinutes);

    // 3. Create booking entity
    const booking = this.bookingsRepository.create({
      ...dto,
      endTime,
      status: 'confirmed',
    });

    // 4. Save to database
    return this.bookingsRepository.save(booking);
  }

  async updateBooking(
    id: string,
    dto: UpdateBookingDto
  ): Promise<Booking> {
    // 1. Get existing booking
    const booking = await this.bookingsRepository.findOne({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. If changing time/duration, validate new slot
    if (dto.startTime || dto.durationMinutes) {
      const newStartTime = dto.startTime || booking.startTime;
      const newDuration = dto.durationMinutes ||
        differenceInMinutes(booking.endTime, booking.startTime);

      const validation = await this.availabilityService.validateBooking(
        newStartTime,
        newDuration,
        booking.instanceId,
        id // Exclude this booking from conflict check
      );

      if (!validation.valid) {
        throw new BadRequestException(validation.error);
      }

      booking.startTime = newStartTime;
      booking.endTime = addMinutes(newStartTime, newDuration);
    }

    // 3. Update other fields
    Object.assign(booking, dto);

    // 4. Save
    return this.bookingsRepository.save(booking);
  }
}
```

### 6.4 Database Schema

#### 6.4.1 Bookings Table
```sql
CREATE TABLE bookings (
  id VARCHAR(36) PRIMARY KEY,
  instance_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  scene VARCHAR(255),
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_instance_time (instance_id, start_time, end_time),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
);
```

#### 6.4.2 Availability Configuration Table
```sql
CREATE TABLE availability_configs (
  id VARCHAR(36) PRIMARY KEY,
  instance_id VARCHAR(36) NOT NULL,
  day_of_week TINYINT NOT NULL, -- 0-6
  start_hour TINYINT NOT NULL,  -- 0-23
  end_hour TINYINT NOT NULL,    -- 0-23
  slot_increment_minutes SMALLINT NOT NULL DEFAULT 15,
  minimum_duration_minutes SMALLINT NOT NULL DEFAULT 15,
  maximum_duration_minutes SMALLINT NOT NULL DEFAULT 480,
  buffer_minutes SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_instance_day (instance_id, day_of_week)
);
```

**Default Configuration Seed:**
```sql
INSERT INTO availability_configs
  (id, instance_id, day_of_week, start_hour, end_hour)
VALUES
  ('config-1-mon', 'obs-1', 1, 9, 17),
  ('config-1-tue', 'obs-1', 2, 9, 17),
  ('config-1-wed', 'obs-1', 3, 9, 17),
  ('config-1-thu', 'obs-1', 4, 9, 17),
  ('config-1-fri', 'obs-1', 5, 9, 17);
```

---

## 7. UI/UX Design

### 7.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      Booking Dashboard                       │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                   │
│    Calendar Widget       │      Booking Details              │
│                          │                                   │
│    [October 2025]        │  Selected Date: 18 Oct 2025       │
│   Mo Tu We Th Fr Sa Su   │                                   │
│                          │  1. Select Start Time             │
│    ... 15 16 17 [18] ... │  ┌─────────────────────────┐     │
│                          │  │ ● 09:00 (up to 8 hrs)   │     │
│                          │  │ ○ 09:15 (up to 7.75 hrs)│     │
│                          │  │ ○ 09:30 (up to 7.5 hrs) │     │
│                          │  │ ○ 09:45                 │     │
│                          │  │ ... [scroll]            │     │
│                          │  └─────────────────────────┘     │
│                          │                                   │
│                          │  2. Select Duration               │
│                          │  ┌─────────────────────────┐     │
│                          │  │ 15 min (until 09:15)  ▼ │     │
│                          │  └─────────────────────────┘     │
│                          │  Options: 15m, 30m, 45m, 1hr...  │
│                          │                                   │
│                          │  3. Select OBS Instance           │
│                          │  ┌─────────────────────────┐     │
│                          │  │ OBS Studio - Room A   ▼ │     │
│                          │  └─────────────────────────┘     │
│                          │  Location: Building 1, Floor 2    │
│                          │  Status: ● Available              │
│                          │                                   │
│                          │  4. Select Scene (Optional)       │
│                          │  ┌─────────────────────────┐     │
│                          │  │ Main Scene            ▼ │     │
│                          │  └─────────────────────────┘     │
│                          │                                   │
│                          │  Notes (Optional)                 │
│                          │  ┌─────────────────────────┐     │
│                          │  │                         │     │
│                          │  └─────────────────────────┘     │
│                          │                                   │
│                          │  [  Book Session (09:00-09:15) ]  │
│                          │                                   │
└──────────────────────────┴──────────────────────────────────┘
```

### 7.2 Mobile Layout (Responsive)

```
┌────────────────────────────┐
│   Booking Dashboard        │
├────────────────────────────┤
│                            │
│  [October 2025]            │
│  Mo Tu We Th Fr Sa Su      │
│  ... 15 16 17 [18] ...     │
│                            │
├────────────────────────────┤
│                            │
│  18 October 2025           │
│                            │
│  Start Time                │
│  ┌──────────────────────┐ │
│  │ ● 09:00 (8 hrs)      │ │
│  │ ○ 09:15 (7.75 hrs)   │ │
│  │ ○ 09:30 (7.5 hrs)    │ │
│  │ ... [scroll]         │ │
│  └──────────────────────┘ │
│                            │
│  Duration                  │
│  ┌──────────────────────┐ │
│  │ 15 min (until 09:15)▼│ │
│  └──────────────────────┘ │
│                            │
│  OBS Instance              │
│  ┌──────────────────────┐ │
│  │ OBS - Room A       ▼ │ │
│  └──────────────────────┘ │
│  ● Available               │
│                            │
│  Scene                     │
│  ┌──────────────────────┐ │
│  │ Main Scene         ▼ │ │
│  └──────────────────────┘ │
│                            │
│  [  Book Session  ]        │
│                            │
└────────────────────────────┘
```

### 7.3 Interaction States

#### State 1: No Date Selected
- Calendar is displayed
- Booking details section shows "Select a date to view availability"

#### State 2: Date Selected, No Start Time
- Available start times are loaded and displayed
- Shows count: "32 available start times"
- Each start time shows max available duration in grey text

#### State 3: Start Time Selected, No Duration
- Duration dropdown is enabled
- Populated with options from 15 min to max available
- Default selection could be 1 hour (if available)

#### State 4: Duration Selected, No Instance
- Instance dropdown is enabled
- Shows only instances available for the full duration
- If no instances available, show error: "No instances available for this duration. Try a shorter booking."

#### State 5: All Required Fields Complete
- "Book Session" button is enabled
- Shows confirmation summary: "Book OBS Studio - Room A on 18 Oct 2025, 09:00 - 09:45 (45 min)"

### 7.4 Validation and Error States

#### Real-time Validation Messages
- **Duration too short:** "Minimum duration is 15 minutes"
- **Duration too long:** "Maximum duration is 8 hours"
- **Extends beyond hours:** "This duration extends past operating hours (17:00). Please select an earlier start time or shorter duration."
- **Booking conflict:** "This time slot is no longer available. Please select a different time." (with auto-refresh of available times)

#### Success Confirmation
```
┌────────────────────────────────────┐
│  ✓ Booking Confirmed               │
├────────────────────────────────────┤
│                                    │
│  OBS Studio - Room A               │
│  18 October 2025                   │
│  09:00 - 09:45 (45 minutes)        │
│                                    │
│  A confirmation email has been     │
│  sent to john@example.com          │
│                                    │
│  [View My Bookings]  [Book Again]  │
│                                    │
└────────────────────────────────────┘
```

---

## 8. Migration Strategy

### 8.1 Backward Compatibility

**Existing Bookings:**
- All existing 1-hour bookings continue to work
- Duration is calculated from `endTime - startTime`
- No data migration required

**Existing Components:**
- Update `TimeSlot` interface gradually
- Provide adapter functions for legacy consumers

### 8.2 Phased Rollout

#### Phase 1: Backend Foundation (Week 1-2)
- [ ] Create database schema for bookings and availability configs
- [ ] Implement `AvailabilityService` with slot generation algorithm
- [ ] Implement `SchedulesService` with booking CRUD
- [ ] Create API endpoints for availability and bookings
- [ ] Write unit tests for validation logic
- [ ] Seed default availability configurations

#### Phase 2: Frontend Core (Week 3-4)
- [ ] Update `TimeSlot` interface to use Date objects
- [ ] Create `DurationSelector` component
- [ ] Update `AvailableSlots` to show start times
- [ ] Update `BookingForm` to include duration selection
- [ ] Add date formatting utilities
- [ ] Integrate with new backend API endpoints

#### Phase 3: Admin Panel (Week 5)
- [ ] Create availability configuration management UI
- [ ] Add booking management views (list, edit, cancel)
- [ ] Add calendar view of all bookings
- [ ] Implement booking conflict visualisation

#### Phase 4: Polish & Testing (Week 6)
- [ ] Comprehensive integration testing
- [ ] User acceptance testing
- [ ] Performance optimisation (caching, query optimisation)
- [ ] Documentation updates
- [ ] Deployment

---

## 9. Configuration Management

### 9.1 Admin Configuration Interface

Administrators should be able to configure availability per OBS instance:

```typescript
interface AvailabilityConfigForm {
  instanceId: string;
  operatingHours: {
    [dayOfWeek: number]: {
      enabled: boolean;
      startHour: number;
      endHour: number;
    }
  };
  slotIncrementMinutes: 15 | 30 | 60;
  minimumDurationMinutes: number;
  maximumDurationMinutes: number;
  bufferMinutes: number;
}
```

**UI Example:**
```
OBS Instance: OBS Studio - Room A

Operating Hours:
☐ Sunday      Closed
☑ Monday      09:00 - 17:00
☑ Tuesday     09:00 - 17:00
☑ Wednesday   09:00 - 17:00
☑ Thursday    09:00 - 17:00
☑ Friday      09:00 - 17:00
☐ Saturday    Closed

Booking Settings:
Slot Increment:      [15 minutes ▼]
Minimum Duration:    [15] minutes
Maximum Duration:    [480] minutes (8 hours)
Buffer Between:      [0] minutes (optional)

[Save Configuration]
```

### 9.2 Default Configuration

If no configuration exists for an instance, use these defaults:
- Operating hours: Monday-Friday, 9:00-17:00
- Slot increment: 15 minutes
- Minimum duration: 15 minutes
- Maximum duration: 480 minutes (8 hours)
- Buffer: 0 minutes

---

## 10. Performance Considerations

### 10.1 Caching Strategy

**Availability Cache:**
- Cache available start times for each instance/date combination
- TTL: 5 minutes (to allow for new bookings)
- Invalidate cache when booking is created/updated/deleted

```typescript
@Injectable()
export class AvailabilityCache {
  private cache = new Map<string, CachedAvailability>();

  getCacheKey(instanceId: string, date: Date): string {
    return `${instanceId}:${format(date, 'yyyy-MM-dd')}`;
  }

  async get(instanceId: string, date: Date): Promise<AvailableStartTime[] | null> {
    const key = this.getCacheKey(instanceId, date);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < 300000) { // 5 min
      return cached.data;
    }

    return null;
  }

  set(instanceId: string, date: Date, data: AvailableStartTime[]): void {
    const key = this.getCacheKey(instanceId, date);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(instanceId: string, date: Date): void {
    const key = this.getCacheKey(instanceId, date);
    this.cache.delete(key);
  }
}
```

### 10.2 Database Optimisation

**Indexes:**
- Composite index on `(instance_id, start_time, end_time)` for conflict checking
- Index on `user_id` for user booking queries
- Index on `status` for filtering active/cancelled bookings

**Query Optimisation:**
```sql
-- Efficient conflict check query
SELECT COUNT(*) FROM bookings
WHERE instance_id = ?
  AND status NOT IN ('cancelled')
  AND (
    (start_time <= ? AND end_time > ?) OR  -- New booking starts during existing
    (start_time < ? AND end_time >= ?) OR  -- New booking ends during existing
    (start_time >= ? AND end_time <= ?)    -- New booking contains existing
  )
```

### 10.3 Frontend Optimisation

**Lazy Loading:**
- Load availability only for selected date (not 30 days in advance)
- Paginate bookings list in admin panel

**Debouncing:**
- Debounce duration selection to avoid excessive validation API calls
- Debounce instance search if many instances exist

---

## 11. Testing Strategy

### 11.1 Unit Tests

**AvailabilityService:**
- Test slot generation with various configurations
- Test conflict detection edge cases (overlapping start, overlapping end, contained booking)
- Test max duration calculation
- Test validation logic (duration increments, min/max, operating hours)

**SchedulesService:**
- Test booking creation with valid/invalid data
- Test booking update conflict detection
- Test booking cancellation

### 11.2 Integration Tests

**API Endpoints:**
- Test availability endpoint with various date ranges
- Test booking creation with concurrent requests (race condition)
- Test booking validation with existing conflicts
- Test filtering and pagination

### 11.3 E2E Tests

**User Flows:**
1. Select date → Select start time → Select duration → Book → Confirm
2. Attempt to book conflicting slot → See error message
3. Book slot → Update booking time → Validate no conflicts
4. Book maximum duration (8 hours) → Verify success
5. Attempt booking beyond operating hours → See validation error

### 11.4 Load Testing

**Scenarios:**
- 100 concurrent users checking availability for the same date
- 50 concurrent users attempting to book the same time slot (race condition test)
- Sustained load of 1000 requests/minute for availability checks

---

## 12. Open Questions & Future Enhancements

### 12.1 Open Questions for Review

1. **Overbooking:** Should we allow multiple bookings for the same instance if it supports concurrent recordings?
2. **Buffer Time:** Should we enforce automatic buffer time between bookings (e.g., 5 min for setup)?
3. **Pricing:** Will different durations have different pricing models in future?
4. **Recurring Bookings:** Should we support recurring bookings with custom durations in Phase 1?
5. **Timezone Handling:** How should we handle users in different timezones booking the same instance?
6. **Cancellation Policy:** Should there be a minimum notice period for cancellations?

### 12.2 Future Enhancements (Not in Scope)

1. **Smart Duration Suggestions:**
   - ML-based suggestions based on historical booking patterns
   - "Most popular durations: 30 min, 1 hr, 2 hrs"

2. **Calendar View:**
   - Week/Month view showing all bookings
   - Drag-and-drop rescheduling
   - Visual conflict indicators

3. **Waitlist:**
   - Allow users to join waitlist for fully booked slots
   - Automatic notification when slot becomes available

4. **Multi-Instance Booking:**
   - Book multiple OBS instances simultaneously
   - Coordinated recordings across instances

5. **Custom Operating Hours:**
   - Per-date operating hour overrides (e.g., extended hours on specific days)
   - Holiday closures

6. **Booking Templates:**
   - Save favourite configurations (instance + duration + scene)
   - Quick book from template

7. **Usage Analytics:**
   - Dashboard showing utilisation rates by hour/day
   - Popular booking durations
   - Peak usage times

---

## 13. Success Metrics

### 13.1 Technical Metrics
- API response time for availability check: < 200ms (95th percentile)
- Successful booking creation rate: > 99%
- Cache hit rate for availability: > 80%
- Zero race condition booking conflicts

### 13.2 User Experience Metrics
- Average time to complete booking: < 2 minutes
- Booking error rate: < 1%
- User satisfaction with duration flexibility: > 4/5 stars
- Reduction in support requests about booking limitations

---

## 14. Conclusion

This design specification provides a comprehensive blueprint for transforming the scheduling system from fixed 1-hour slots to flexible 15-minute increment scheduling. The approach prioritises user experience (matching familiar patterns from Teams/iCal), maintainability (clean separation of concerns), and performance (caching and optimised queries).

The phased rollout allows for iterative development and testing, whilst maintaining backward compatibility with existing bookings. The proposed architecture is extensible, allowing for future enhancements like recurring bookings, multi-instance reservations, and advanced analytics.

**Next Steps:**
1. Review and approve this design document
2. Estimate development effort for each phase
3. Set up project tracking and milestones
4. Begin Phase 1 implementation

---

**Document Version:** 1.0
**Last Updated:** 18 October 2025
**Author:** Claude Code
**Status:** Draft - Pending Review
