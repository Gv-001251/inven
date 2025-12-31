# Breeze Inventory Management System

Professional dashboard-style web application for Breeze Techniques to manage all company inventory operations with real-time updates and a clean modern interface.

## 🚀 Features

### 1. **Role-Based Access Control**
- **Chairwoman (Gayathri G)** - Full access with complete system privileges
- **Managing Director (Ganesan K)** - Full access with executive control
- **CEO (G)** - Full access with strategic oversight
- **Supervisor (Manimaran)** - View and manage attendance and operational reports
- **Staff (Arokiyam, Kalki)** - Limited access for barcode scanning and purchase requests

### 2. **Employee Attendance Tracker**
- Daily attendance logging with Present/Absent/Late status
- Timestamp tracking for all entries
- Restricted access for supervisors and above
- Real-time attendance statistics dashboard

### 3. **Inventory Management with Barcode Integration**
- Unique barcode identification for all items (Nuts, Bolts, Washers, Assemblies, After Coolers, Auto Drain Valves, Allen Nuts, etc.)
- Dedicated barcode catalog modal that embeds your existing HTML sheet directly inside the Inventory screen
- Advanced search engine for quick inventory access by name, barcode, or category
- IN/OUT operations with instant stock updates
- Complete transaction logging with user details, timestamps, and reasons
- Real-time dashboard refresh via WebSockets

### 4. **Low Stock Notification System**
- Customizable threshold alerts per item
- Automatic notifications on every IN/OUT action
- Visual alerts in dashboard notification panel
- Severity-based notification categorization

### 5. **Purchase Request Workflow**
- Staff can create purchase requests
- Automatic routing: Staff → Supervisor → MD/CEO
- Multi-stage approval process
- Complete audit trail and timeline
- Rejection and approval tracking

### 6. **Real-Time Dashboard**
- Total inventory overview cards
- Low-stock item alerts
- Pending request counts
- Attendance summary
- Visual charts for inventory movement trends
- Stock distribution pie charts

### 7. **Enhanced Usability Features**
- **Export to CSV** - Download inventory, transactions, and attendance data
- **Date Filtering** - Filter attendance records by specific dates
- **Confirmation Dialogs** - Prevent accidental actions with confirmation prompts
- **User Profile** - Manage account settings and change password
- **Search & Filter** - Real-time search across inventory with query highlighting
- **Loading States** - Beautiful loading spinners for better UX feedback
- **Tooltips** - Contextual help text for better guidance
- **Back to Top** - Quick scroll-to-top button for long pages
- **Alert Messages** - Styled success/error messages with dismissible options
- **Quick Stats** - Visual badges showing inventory counts and status

### 8. **Modern UI/UX Design**
- Clean layout with Breeze Techniques branding (blue, white, gray)
- Sidebar navigation with intuitive icons
- Smooth transitions and responsive behavior
- Desktop and tablet optimized
- Consistent design language throughout

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-time:** WebSocket (ws)
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs for password hashing
- **Utilities:** uuid, dotenv, cors

### Frontend
- **Framework:** React 18.2
- **Routing:** React Router DOM
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** React Icons (Heroicons)
- **Utilities:** clsx, prop-types

## 📁 Project Structure

```
breeze-inventory-system/
├── server/                    # Backend API
│   ├── index.js              # Express server with WebSocket support
│   ├── package.json          # Backend dependencies
│   └── .env.example          # Environment configuration template
├── client/                    # React frontend
│   ├── public/               # Static assets
│   │   └── index.html        # HTML template
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Header.js     # Top navigation bar
│   │   │   ├── Layout.js     # Layout wrapper
│   │   │   └── Sidebar.js    # Navigation sidebar
│   │   ├── context/          # React context providers
│   │   │   └── AuthContext.js # Authentication context
│   │   ├── pages/            # Route pages
│   │   │   ├── Attendance.js # Employee attendance
│   │   │   ├── Dashboard.js  # Overview dashboard
│   │   │   ├── Inventory.js  # Inventory management
│   │   │   ├── Login.js      # Authentication page
│   │   │   ├── Notifications.js # Notifications center
│   │   │   ├── Purchase.js   # Purchase requests
│   │   │   └── Settings.js   # Role/employee management
│   │   ├── services/         # API and utilities
│   │   │   ├── api.js        # Axios API client
│   │   │   └── websocket.js  # WebSocket connection
│   │   ├── App.js            # Main application
│   │   ├── index.css         # Tailwind imports
│   │   └── index.js          # React entry point
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── postcss.config.js     # PostCSS configuration
├── package.json              # Root package scripts
├── .gitignore                # Git ignore configuration
└── README.md                 # Documentation
```

## 🏃 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd breeze-inventory-system
   ```

2. **Install dependencies**
   ```bash
   # Install root-level dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..

   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Configure environment**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   cd ..
   ```

4. **Run the application**

   **Option 1: Run both simultaneously (from root)**
   ```bash
   npm run dev
   ```

   **Option 2: Run individually**

   Backend:
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:5000
   ```

   Frontend:
   ```bash
   cd client
   npm start
   # Client runs on http://localhost:3000
   ```

## 🧾 Barcode Catalog Integration

If you already have a standalone `index.html` that lists printable barcodes, you can drop it straight into the app. Place your file at `client/public/barcode-catalog/index.html` (overwriting the sample that ships with the repo) and the Inventory page will surface it through the new **Barcode catalog** button.

1. Copy or replace your HTML content into `client/public/barcode-catalog/index.html`.
2. Start the frontend as usual (`npm start` or `npm run dev`).
3. Open the Inventory page and click **Barcode catalog** to view/print your sheet inside the dashboard. The modal renders exactly what is inside that HTML file, so you can keep your existing layout, fonts, and barcode images.

The repository ships with a demo catalog powered by JsBarcode so the modal always has content, but feel free to delete the sample script and paste your own markup.

## 🔐 Default User Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Chairwoman | chairwoman | chairwoman123 | Full Access |
| Managing Director | md | md123 | Full Access |
| CEO | ceo | ceo123 | Full Access |
| Supervisor | supervisor | supervisor123 | Attendance & Reports |
| Staff | arokiyam | staff123 | Limited Access |
| Staff | kalki | staff123 | Limited Access |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Roles & Employees
- `GET /api/roles` - Fetch all roles
- `PUT /api/roles/:roleId/permissions` - Update role permissions
- `GET /api/employees` - Fetch all employees
- `POST /api/employees` - Add new employee

### Inventory
- `GET /api/inventory` - Fetch inventory items
- `GET /api/inventory/search?q=query` - Search inventory by name, barcode, or category
- `POST /api/inventory/scan` - Process barcode scan (IN/OUT)
- `PUT /api/inventory/items/:itemId` - Update item threshold

### Attendance
- `GET /api/attendance` - Fetch attendance records
- `POST /api/attendance` - Record attendance

### Purchase Requests
- `GET /api/purchase-requests` - Fetch all requests
- `POST /api/purchase-requests` - Create new request
- `POST /api/purchase-requests/:requestId/review` - Approve/reject request

### Notifications
- `GET /api/notifications` - Fetch all notifications
- `POST /api/notifications/:notificationId/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard analytics

## 🔄 Real-Time Updates

The system uses WebSocket connections for real-time synchronization:
- Inventory changes broadcast to all connected clients
- Purchase request updates notify relevant users
- Low-stock alerts trigger immediate notifications
- Attendance records update in real-time

## 🎨 Theme Customization

Breeze branding colors are configured in `client/tailwind.config.js`:
```javascript
colors: {
  breeze: {
    blue: '#1e40af',
    lightBlue: '#3b82f6',
    gray: '#6b7280',
    lightGray: '#f3f4f6',
  }
}
```

## 🔒 Security Features

- JWT-based authentication with 8-hour expiration
- Password hashing with bcrypt
- Role-based permission checking
- Secure WebSocket connections
- Token validation on all protected routes

## 📱 Responsive Design

- Mobile-friendly navigation
- Tablet-optimized layouts
- Desktop-first sidebar design
- Adaptive charts and tables

## 🚀 Production Deployment

1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Serve static files from Express (or use a reverse proxy like Nginx)

3. Set proper environment variables:
   - `JWT_SECRET` - Strong secret key
   - `DATABASE_URL` - If using a real database (optional enhancement)
   - `PORT` - Server port (default: 5000)

4. Use process managers like PM2 for the backend:
   ```bash
   pm2 start server/index.js --name breeze-inventory
   ```

## 🐛 Troubleshooting

### Server Connection Issues
- **Server not accessible:** Ensure the server is binding to `0.0.0.0` (all interfaces) rather than just `localhost`. This is already configured in the server code.
- **Connection refused:** Make sure the server is running on port 5000. Check with `curl http://localhost:5000/api/health`
- **Client can't reach server:** Verify that the client's API URL matches the server port. Default is `http://localhost:5000/api`

### Other Common Issues
- **WebSocket connection issues:** Check CORS settings and firewall rules. Ensure the WebSocket URL is `ws://localhost:5000` (default)
- **Authentication errors:** Verify JWT_SECRET consistency between sessions
- **Port conflicts:** Change ports in `.env` and update client configuration if needed
- **Dependencies not installed:** Run `npm install` in root, server, and client directories

### Development Tools
- **React DevTools:** For an enhanced development experience, install the [React Developer Tools](https://reactjs.org/link/react-devtools) browser extension for Chrome, Firefox, or Edge. This provides component inspection, props/state debugging, and performance profiling capabilities.

## 📄 License

Proprietary - Breeze Techniques

## 👥 Support

For issues or questions, contact the development team at Breeze Techniques.

---

**Built with ❤️ for Breeze Techniques**
