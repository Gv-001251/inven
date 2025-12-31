# Backend Setup Guide

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your MongoDB Atlas credentials:**
   - Get your connection string from MongoDB Atlas:
     - Go to MongoDB Atlas → Connect → Drivers → Node.js
     - Copy the connection string
     - Replace `<password>` with your database user password (from the setup wizard)
   - Example:


3. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Troubleshooting

### Port Already in Use (EADDRINUSE)
If you see `Port 5000 is already in use`:
- **Option 1:** Stop the other process:
  ```bash
  lsof -ti:5000 | xargs kill -9
### Port Already in Use (EADDRINUSE)
If you see `Port 5000 is already in use`:
- **Option 1:** Stop the other process:
3. Check that your database user password is correct
4. Ensure your MongoDB cluster is running

### Missing MongoDB URI Warning
If you see `MONGODB_URI not set`:
- The server will run but use in-memory storage (data lost on restart)
- Create a `.env` file with your MongoDB connection string to enable persistent storage

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes* | MongoDB Atlas connection string | (none) |
| `MONGODB_DB_NAME` | No | Database name | `breeze_inventory` |
| `JWT_SECRET` | No | Secret for JWT tokens | `breeze-super-secret` |
| `PORT` | No | Server port | `5000` |

*Required for production. Server will use in-memory storage if not set (for development only).


