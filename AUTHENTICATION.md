# Authentication Setup Guide

This document explains how to set up authentication between the OBS Bridge clients (macOS/Windows apps) and the server API.

## Overview

The OBS Bridge now uses token-based authentication to secure the WebSocket connection between bridge clients and the server. This prevents unauthorized access and ensures that only registered clients can connect and control OBS instances.

## Security Features

- **Token-based authentication**: Each bridge client must provide a valid API token to connect
- **Secure token generation**: Tokens are 32-byte cryptographically secure random values
- **Token tracking**: The server tracks when tokens were created and last used
- **Connection validation**: All WebSocket messages are validated against authenticated clients
- **Token revocation**: Administrators can revoke tokens at any time

## Setup Process

### 1. Server Setup

#### Database Migration

First, apply the database migration to add authentication fields:

```bash
cd server-api
npm install
npx prisma migrate deploy
```

This adds the following fields to the `OBSInstance` table:
- `apiToken` - The authentication token (unique)
- `tokenCreatedAt` - Timestamp when the token was generated
- `tokenLastUsedAt` - Timestamp when the token was last used

#### Start the Server

```bash
cd server-api
npm run start:dev
```

The server will now require authentication for all WebSocket connections.

### 2. Generate Authentication Token

Before connecting a bridge client, you must generate an authentication token for it.

#### Using the API

**Generate a new token:**

```bash
curl -X POST http://localhost:8000/api/admin/instances/{instance-id}/token/generate
```

Response:
```json
{
  "message": "Token generated successfully",
  "clientId": "obs-client-1",
  "token": "AbCdEf123456...",
  "tokenCreatedAt": "2025-10-21T17:43:00.000Z"
}
```

**Check token information:**

```bash
curl http://localhost:8000/api/admin/instances/{instance-id}/token/info
```

Response:
```json
{
  "clientId": "obs-client-1",
  "hasToken": true,
  "tokenCreatedAt": "2025-10-21T17:43:00.000Z",
  "tokenLastUsedAt": "2025-10-21T17:45:00.000Z"
}
```

**Revoke a token:**

```bash
curl -X POST http://localhost:8000/api/admin/instances/{instance-id}/token/revoke
```

### 3. Configure Bridge Client

#### macOS Bridge

1. Open the OBS Bridge application
2. Go to Settings
3. Fill in the following fields:
   - **OBS Host**: Your OBS WebSocket host (e.g., `localhost`)
   - **OBS Port**: Your OBS WebSocket port (e.g., `4455`)
   - **OBS Password**: Your OBS WebSocket password
   - **Website URL**: Your server WebSocket URL (e.g., `ws://localhost:8000/obs`)
   - **Client ID**: A unique identifier for this client (e.g., `obs-client-1`)
   - **Auth Token**: Paste the token generated in step 2

4. Click "Connect"

The bridge will automatically include the token in the WebSocket connection URL as a query parameter.

#### Python Bridge

Update your `.env` file or environment variables:

```bash
OBS_HOST=localhost
OBS_PORT=4455
OBS_PASSWORD=your-obs-password
WEBSITE_URL=ws://localhost:8000/obs
CLIENT_ID=obs-client-1
AUTH_TOKEN=AbCdEf123456...
```

## API Endpoints

### Token Management

All token management endpoints are under `/api/admin/instances/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:id/token/generate` | Generate a new authentication token for an instance |
| POST | `/:id/token/revoke` | Revoke the current token for an instance |
| GET | `/:id/token/info` | Get information about an instance's token |

## Connection Flow

1. **Bridge initiates connection** with token in URL:
   ```
   ws://server:8000/obs?token=AbCdEf123456...
   ```

2. **Server validates token**:
   - Extracts token from query parameters
   - Looks up token in database
   - Validates token exists and matches an instance
   - Updates `tokenLastUsedAt` timestamp

3. **Authentication succeeds**:
   - Connection is established
   - Server stores authenticated clientId
   - All subsequent messages use the authenticated clientId

4. **Authentication fails**:
   - Connection is closed with error code:
     - `4001`: No token provided
     - `4002`: Invalid token

## Security Best Practices

1. **Keep tokens secure**: Treat authentication tokens like passwords
2. **Use HTTPS/WSS in production**: Always use encrypted connections in production
3. **Rotate tokens periodically**: Generate new tokens regularly for enhanced security
4. **Monitor token usage**: Check `tokenLastUsedAt` for suspicious activity
5. **Revoke compromised tokens**: Immediately revoke any tokens that may be compromised

## Troubleshooting

### Connection Refused (Code 4001)

**Error**: "Authentication required"

**Solution**: Make sure you've set the `AUTH_TOKEN` field in your bridge configuration.

### Connection Refused (Code 4002)

**Error**: "Invalid token"

**Solutions**:
1. Verify the token was copied correctly (no extra spaces or characters)
2. Check if the token was revoked
3. Generate a new token and try again
4. Verify the clientId matches the instance in the database

### Token Not Working After Regeneration

If you regenerate a token, the old token is immediately invalidated. Update all bridge clients with the new token.

### Connection Works But Messages Ignored

If the connection establishes but messages are ignored, check:
1. The token is valid and not expired
2. The clientId in the database matches the bridge configuration
3. Server logs for authentication errors

## Migration from Non-Authenticated Setup

If you're upgrading from a version without authentication:

1. **Backup your database** before running migrations
2. **Run the migration** to add authentication fields
3. **Generate tokens** for all existing OBS instances
4. **Update all bridge clients** with their respective tokens
5. **Test connections** one by one before deploying to production

## API Example Code

### Generate Token (JavaScript)

```javascript
const response = await fetch('http://localhost:8000/api/admin/instances/{id}/token/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});

const { token } = await response.json();
console.log('New token:', token);
```

### Connect with Token (JavaScript WebSocket)

```javascript
const token = 'AbCdEf123456...';
const ws = new WebSocket(`ws://localhost:8000/obs?token=${token}`);

ws.onopen = () => {
  console.log('Authenticated connection established');
  // Send registration message
  ws.send(JSON.stringify({
    type: 'register'
  }));
};

ws.onerror = (error) => {
  console.error('Connection error:', error);
};
```

## Support

If you encounter issues with authentication:

1. Check the server logs for detailed error messages
2. Verify your token is valid using the `/token/info` endpoint
3. Ensure your bridge client is using the latest version
4. Review the WebSocket connection logs in your bridge client

For additional help, please open an issue on the GitHub repository.
