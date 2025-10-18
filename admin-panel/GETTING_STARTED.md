# Getting Started with OBS Bridge Admin Panel

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set your API server URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Included

The admin panel comes with the following pages:

### 1. Dashboard (`/`)
- Real-time statistics
- System health monitoring
- Quick action links
- Connected OBS instances overview

### 2. OBS Instances (`/obs-instances`)
- View all connected OBS Bridge instances
- Register new instances
- Control instances (start/stop recording)
- Real-time status updates

### 3. Schedules (`/schedules`)
- Create recording schedules
- Support for recurring schedules
- Calendar-based scheduling
- Time slot management

### 4. Bookings (`/bookings`)
- View all student bookings
- Filter and search functionality
- Booking status management
- Student information

### 5. Users (`/users`)
- User account management
- Role-based access (admin, staff, student)
- User creation and editing

### 6. Settings (`/settings`)
- System configuration
- API server URL
- Notification preferences
- Booking rules

## Next Steps

### 1. Test with Server API

Make sure the server-api is running:

```bash
cd ../server-api
npm run start:dev
```

The admin panel will connect to the server API and display real OBS instances.

### 2. Implement Backend Endpoints

The following endpoints need to be added to the server-api:

**Schedules API**
- `GET /api/admin/schedules` - List schedules
- `POST /api/admin/schedules` - Create schedule
- `PUT /api/admin/schedules/:id` - Update schedule
- `DELETE /api/admin/schedules/:id` - Delete schedule

**Bookings API**
- `GET /api/admin/bookings` - List bookings
- `PUT /api/admin/bookings/:id` - Update booking
- `DELETE /api/admin/bookings/:id` - Cancel booking

**Users API**
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### 3. Add Authentication

The authentication system is not yet implemented. To add it:

1. Create a login page at `src/app/login/page.tsx`
2. Implement authentication context in `src/contexts/auth.tsx`
3. Add protected route wrapper
4. Integrate with backend authentication

### 4. Connect Frontend

The student-facing frontend (in `../frontend/`) should communicate with the same server API to:
- View available schedules
- Create bookings
- Manage their bookings

## Architecture

```
┌─────────────────┐
│  Admin Panel    │
│  (Next.js)      │
│  Port: 3000     │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         ▼
┌─────────────────┐
│  Server API     │
│  (NestJS)       │
│  Port: 8000     │
└────────┬────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│  OBS Bridge     │
│  (macOS App)    │
└────────┬────────┘
         │
         │ OBS WebSocket
         ▼
┌─────────────────┐
│  OBS Studio     │
└─────────────────┘
```

## Common Tasks

### Add a New Page

1. Create directory in `src/app/`:
   ```bash
   mkdir src/app/my-page
   ```

2. Create `page.tsx`:
   ```typescript
   export default function MyPage() {
     return <div>My Page</div>;
   }
   ```

3. Add to navigation in `src/components/layout/AppLayout.tsx`

### Add a New Component

1. Create component file:
   ```bash
   touch src/components/my-component.tsx
   ```

2. Use TypeScript and follow existing patterns

### Update API Client

Edit `src/lib/api/client.ts` to add new endpoints:

```typescript
async myNewEndpoint(): Promise<MyType> {
  return this.request<MyType>('/api/my-endpoint');
}
```

## Troubleshooting

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Build errors**
```bash
# Clean install
rm -rf node_modules .next
npm install
npm run build
```

**API connection errors**
- Check server-api is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

## Support

For questions or issues, refer to the main README.md or project documentation.
