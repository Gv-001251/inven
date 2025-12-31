# Server Startup Guide

## ✅ Current Status
- **Server Port:** 5001 (changed from 5000 due to port conflict)
- **Client Port:** Configured to connect to port 5001
- **Storage:** In-memory (MongoDB not configured yet)
- **Status:** ✓ Server is running and ready for login

## 🚀 Quick Start

### Start the Server
```bash
cd inventory/server
node index.js
```

Or use nodemon for auto-reload:
```bash
npm run dev
```

### Verify Server is Running
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-21T12:34:56.789Z"}
*(Note: timestamp will vary based on server time)*
```

## 🔐 Login Credentials

The following users are available (in-memory storage):

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| chairwoman | chairwoman123 | Chairwoman | Full Access |
| md | md123 | Managing Director | Full Access |
| ceo | ceo123 | CEO | Full Access |
| supervisor | supervisor123 | Supervisor | Supervisor Access |
| arokiyam | staff123 | Staff | Staff Access |
| kalki | staff123 | Staff | Staff Access |

## ⚙️ Configuration

### Current Setup
- **Server Port:** 5001 (set in `server/.env`)
- **Client API URL:** http://localhost:5001/api (set in `client/.env`)
- **MongoDB:** Not configured (using in-memory storage)

### To Enable MongoDB (Optional)
1. Get your MongoDB Atlas connection string
2. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Restart the server

## 🔧 Troubleshooting

### Port Already in Use
If you see `EADDRINUSE` error:
- Check what's using the port: `lsof -ti:5001`
- Kill the process: `lsof -ti:5001 | xargs kill -9`
- Or change the port in `server/.env`

### Client Can't Connect
- Verify server is running: `curl http://localhost:5001/api/health`
- Check `client/.env` has: `REACT_APP_API_URL=http://localhost:5001/api`
- Restart the React app after changing `.env`

### Login Fails
- Verify server is running
- Check username/password are correct
- Check server logs for errors

## 📝 Notes

- Server uses in-memory storage by default (data lost on restart)
- To persist data, configure MongoDB Atlas connection
- Role-based access control is fully functional
- All API endpoints are working


