# Quick Start Guide - Breeze Inventory Management System

## Prerequisites
- Node.js v16 or higher
- npm (comes with Node.js)

## Installation & Setup (5 minutes)

### Step 1: Install All Dependencies
```bash
# From the project root directory
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Step 2: Configure Server Environment
```bash
cd server
cp .env.example .env
cd ..
```

**Note:** The default `.env` settings work out of the box. No changes needed for local development.

### Step 3: Start the Application

**Option A: Run Both Server & Client Together (Recommended)**
```bash
# From the project root
npm run dev
```

This command will:
- Start the backend server on http://localhost:5000
- Start the frontend client on http://localhost:3000
- Both will run concurrently in the same terminal

**Option B: Run Server and Client Separately**

Terminal 1 (Backend):
```bash
cd server
npm start
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

### Step 4: Access the Application

1. Open your browser to http://localhost:3000
2. Login with test credentials:
   - **Username:** `chairwoman`
   - **Password:** `chairwoman123`

## Verification Checklist

✅ **Server is running:** Visit http://localhost:5000/api/health (should return JSON with status "ok")

✅ **Client is running:** Visit http://localhost:3000 (should show login page)

✅ **Authentication works:** Login with credentials above

✅ **WebSocket connected:** Check browser console for "WebSocket connected" message

✅ **API connection:** After login, you should see the dashboard with data

## Default User Accounts

| Username | Password | Role | Access |
|----------|----------|------|--------|
| chairwoman | chairwoman123 | Chairwoman | Full Access |
| md | md123 | Managing Director | Full Access |
| ceo | ceo123 | CEO | Full Access |
| supervisor | supervisor123 | Supervisor | Attendance & Reports |
| arokiyam | staff123 | Staff | Limited Access |
| kalki | staff123 | Staff | Limited Access |

## Troubleshooting

### "Cannot find module" error
```bash
# Reinstall dependencies
npm install
cd server && npm install
cd ../client && npm install
```

### Server won't start / Port 5000 in use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in server/.env
PORT=5001
```

### Client can't connect to server
1. Verify server is running: `curl http://localhost:5000/api/health`
2. Check browser console for connection errors
3. Ensure CORS is enabled (already configured by default)

### WebSocket not connecting
- Make sure server is running
- Check browser console for WebSocket errors
- Verify WebSocket URL in client/src/services/websocket.js (default: ws://localhost:5000)

## Next Steps

- Explore the Dashboard to see inventory overview
- Navigate to Inventory to manage items and perform barcode scans
- Check Purchase Requests to see the approval workflow
- Visit Settings to manage roles and permissions (admin only)

## Support

For issues or questions, refer to the main README.md or contact the development team.
