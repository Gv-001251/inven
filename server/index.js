const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const inventoryStore = require('./inventoryStore');
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const finishedProductRoutes = require('./routes/finishedProducts.routes');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const createGstRoutes = require('./routes/gst.routes');
const createEinvoiceRoutes = require('./routes/einvoice.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchase-requests', purchaseRoutes);
app.use('/api/finished-products', finishedProductRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
// GST routes are mounted after authenticate is defined (see below)

const PORT = process.env.PORT || 5001;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

let wssInstance = null;

const permissionsCatalog = {
  viewDashboard: 'View dashboard analytics and real-time overview',
  viewInventory: 'View inventory details and movements',
  manageInventory: 'Create and manage inventory catalogue',
  updateInventory: 'Perform barcode IN/OUT scans',
  viewAttendance: 'View employee attendance insights',
  manageAttendance: 'Record employee attendance',
  createPurchaseRequest: 'Create purchase requests for materials',
  supervisePurchaseRequest: 'Supervisor review of purchase requests',
  approvePurchaseRequest: 'Executive approval for purchase requests',
  manageRoles: 'Manage role permissions and employees',
  viewNotifications: 'View notification center',
  manageNotifications: 'Manage notification state',
  configureThresholds: 'Adjust inventory threshold alerts',
  manageInvoices: 'Manage and upload GST invoices',
  viewInvoices: 'View GST invoice records'
};

// Component inventory items with barcodes
const componentDefs = [
  { name: 'Casting set', barcode: 'COMP-001', category: 'Assembly', unit: 'sets', stock: 15, threshold: 5 },
  { name: 'Crank', barcode: 'COMP-002', category: 'Engine', unit: 'pcs', stock: 25, threshold: 8 },
  { name: 'Cover', barcode: 'COMP-003', category: 'Engine', unit: 'pcs', stock: 30, threshold: 10 },
  { name: 'Cylinder', barcode: 'COMP-004', category: 'Engine', unit: 'pcs', stock: 20, threshold: 6 },
  { name: 'Assembly', barcode: 'COMP-005', category: 'Assembly', unit: 'sets', stock: 12, threshold: 4 },
  { name: 'Bearing', barcode: 'COMP-006', category: 'Components', unit: 'pcs', stock: 50, threshold: 15 },
  { name: 'Bearing washer', barcode: 'COMP-007', category: 'Components', unit: 'pcs', stock: 60, threshold: 20 },
  { name: 'Oil seal', barcode: 'COMP-008', category: 'Seals', unit: 'pcs', stock: 40, threshold: 12 },
  { name: 'Oil tipper', barcode: 'COMP-009', category: 'Components', unit: 'pcs', stock: 35, threshold: 10 },
  { name: 'Piston', barcode: 'COMP-010', category: 'Engine', unit: 'pcs', stock: 28, threshold: 8 },
  { name: 'Head', barcode: 'COMP-011', category: 'Engine', unit: 'pcs', stock: 22, threshold: 7 },
  { name: 'Centre plate', barcode: 'COMP-012', category: 'Components', unit: 'pcs', stock: 18, threshold: 6 },
  { name: 'Rings', barcode: 'COMP-013', category: 'Engine', unit: 'sets', stock: 45, threshold: 15 },
  { name: 'Piking set', barcode: 'COMP-014', category: 'Tools', unit: 'sets', stock: 10, threshold: 3 },
  { name: 'Valve blade', barcode: 'COMP-015', category: 'Engine', unit: 'pcs', stock: 32, threshold: 10 },
  { name: 'Pulley', barcode: 'COMP-016', category: 'Components', unit: 'pcs', stock: 24, threshold: 8 },
  { name: 'Fan', barcode: 'COMP-017', category: 'Components', unit: 'pcs', stock: 16, threshold: 5 },
  { name: 'Stud set', barcode: 'COMP-018', category: 'Fasteners', unit: 'sets', stock: 40, threshold: 12 },
  { name: 'Nut', barcode: 'COMP-019', category: 'Fasteners', unit: 'pcs', stock: 100, threshold: 30 },
  { name: 'Spring washer', barcode: 'COMP-020', category: 'Fasteners', unit: 'pcs', stock: 80, threshold: 25 },
  { name: 'Bolt', barcode: 'COMP-021', category: 'Fasteners', unit: 'pcs', stock: 120, threshold: 40 },
  { name: 'Beather', barcode: 'COMP-022', category: 'Components', unit: 'pcs', stock: 14, threshold: 4 },
  { name: 'Oil indicator', barcode: 'COMP-023', category: 'Instruments', unit: 'pcs', stock: 8, threshold: 2 },
  { name: 'Nut nipple set', barcode: 'COMP-024', category: 'Fasteners', unit: 'sets', stock: 25, threshold: 8 },
  { name: 'Inter collar', barcode: 'COMP-025', category: 'Components', unit: 'pcs', stock: 30, threshold: 10 },
  { name: 'Air flater', barcode: 'COMP-026', category: 'Components', unit: 'pcs', stock: 12, threshold: 4 },
  { name: 'Key', barcode: 'COMP-027', category: 'Components', unit: 'pcs', stock: 50, threshold: 15 },
  { name: 'End disk', barcode: 'COMP-028', category: 'Components', unit: 'pcs', stock: 20, threshold: 6 },
  { name: 'D/Bush', barcode: 'COMP-029', category: 'Components', unit: 'pcs', stock: 35, threshold: 10 },
  { name: 'Copper washer', barcode: 'COMP-030', category: 'Fasteners', unit: 'pcs', stock: 70, threshold: 20 },
  { name: 'White tape', barcode: 'COMP-031', category: 'Materials', unit: 'rolls', stock: 25, threshold: 8 },
  { name: 'Thread lock paste', barcode: 'COMP-032', category: 'Materials', unit: 'tubes', stock: 15, threshold: 5 },
  { name: 'Oil nut', barcode: 'COMP-033', category: 'Fasteners', unit: 'pcs', stock: 40, threshold: 12 },
  { name: 'Dome', barcode: 'COMP-034', category: 'Components', unit: 'pcs', stock: 18, threshold: 6 },
  { name: 'Pipe set', barcode: 'COMP-035', category: 'Piping', unit: 'sets', stock: 10, threshold: 3 },
  { name: 'Nipple', barcode: 'COMP-036', category: 'Piping', unit: 'pcs', stock: 45, threshold: 15 },
  { name: 'Elbow', barcode: 'COMP-037', category: 'Piping', unit: 'pcs', stock: 38, threshold: 12 },
  { name: 'After cooler pipe set', barcode: 'COMP-038', category: 'Piping', unit: 'sets', stock: 8, threshold: 2 },
  { name: 'NRV', barcode: 'COMP-039', category: 'Valves', unit: 'pcs', stock: 20, threshold: 6 },
  { name: 'Safety valve', barcode: 'COMP-040', category: 'Valves', unit: 'pcs', stock: 12, threshold: 4 },
  { name: 'Pressure gauge', barcode: 'COMP-041', category: 'Instruments', unit: 'pcs', stock: 16, threshold: 5 },
  { name: 'Drain cork', barcode: 'COMP-042', category: 'Components', unit: 'pcs', stock: 30, threshold: 10 },
  { name: 'Ball valve', barcode: 'COMP-043', category: 'Valves', unit: 'pcs', stock: 14, threshold: 4 },
  { name: 'Belt', barcode: 'COMP-044', category: 'Components', unit: 'pcs', stock: 22, threshold: 7 },
  { name: 'Pressure switch', barcode: 'COMP-045', category: 'Instruments', unit: 'pcs', stock: 10, threshold: 3 },
  { name: 'Wheel with cotter pin', barcode: 'COMP-046', category: 'Components', unit: 'sets', stock: 18, threshold: 6 },
  { name: 'Square nipple', barcode: 'COMP-047', category: 'Piping', unit: 'pcs', stock: 28, threshold: 9 },
  { name: 'Copper pipe', barcode: 'COMP-048', category: 'Piping', unit: 'pcs', stock: 35, threshold: 10 },
  { name: 'Stator', barcode: 'COMP-049', category: 'Electrical', unit: 'pcs', stock: 6, threshold: 2 },
  { name: 'Cable', barcode: 'COMP-050', category: 'Electrical', unit: 'meters', stock: 100, threshold: 30 },
  { name: 'Cut off switch', barcode: 'COMP-051', category: 'Electrical', unit: 'pcs', stock: 8, threshold: 2 },
  { name: 'Dummy', barcode: 'COMP-052', category: 'Components', unit: 'pcs', stock: 25, threshold: 8 },
  { name: 'Spring hose', barcode: 'COMP-053', category: 'Piping', unit: 'pcs', stock: 20, threshold: 6 },
  { name: 'Tap', barcode: 'COMP-054', category: 'Piping', unit: 'pcs', stock: 32, threshold: 10 },
  { name: 'Motor', barcode: 'COMP-055', category: 'Electrical', unit: 'pcs', stock: 4, threshold: 1 },
  { name: 'Guard and clamp', barcode: 'COMP-056', category: 'Safety', unit: 'sets', stock: 12, threshold: 4 },
  { name: 'T.C.1000', barcode: 'COMP-057', category: 'Components', unit: 'pcs', stock: 15, threshold: 5 },
  { name: 'Packing set', barcode: 'COMP-058', category: 'Seals', unit: 'sets', stock: 20, threshold: 6 },
  { name: 'Hermet nipple', barcode: 'COMP-059', category: 'Piping', unit: 'pcs', stock: 24, threshold: 8 },
  { name: 'Reducer', barcode: 'COMP-060', category: 'Piping', unit: 'pcs', stock: 18, threshold: 6 },
  { name: 'Damming pipe', barcode: 'COMP-061', category: 'Piping', unit: 'pcs', stock: 10, threshold: 3 },
  { name: 'Breather nipple', barcode: 'COMP-062', category: 'Piping', unit: 'pcs', stock: 30, threshold: 10 }
];

async function initializeData() {
  try {
    console.log('✓ Initializing Supabase data...');

    // Seed inventory items if needed
    await inventoryStore.seedInventoryItems(componentDefs);

    const roleDefs = [
      { name: 'Chairwoman', permissions: { fullAccess: true } },
      { name: 'Managing Director', permissions: { fullAccess: true } },
      { name: 'CEO', permissions: { fullAccess: true } },
      {
        name: 'Supervisor',
        permissions: {
          viewDashboard: true,
          viewInventory: true,
          manageInventory: true,
          updateInventory: true,
          viewAttendance: true,
          manageAttendance: true,
          createPurchaseRequest: true,
          supervisePurchaseRequest: true,
          viewNotifications: true,
          configureThresholds: true
        }
      },
      {
        name: 'Staff',
        permissions: {
          viewDashboard: true,
          viewInventory: true,
          updateInventory: true,
          viewAttendance: true,
          createPurchaseRequest: true,
          viewNotifications: true
        }
      }
    ];

    const employeeDefs = [
      { name: 'Gayathri G', roleName: 'Chairwoman', designation: 'Chairwoman', department: 'Management', email: 'chairwoman@breeze.com' },
      { name: 'Ganesan K', roleName: 'Managing Director', designation: 'Managing Director', department: 'Management', email: 'md@breeze.com' },
      { name: 'G', roleName: 'CEO', designation: 'CEO', department: 'Management', email: 'ceo@breeze.com' },
      { name: 'Arokiyam', roleName: 'Staff', designation: 'Staff', department: 'Operations', email: 'arokiyam@breeze.com' },
      { name: 'Kalki', roleName: 'Staff', designation: 'Staff', department: 'Operations', email: 'kalki@breeze.com' }
    ];

    // Seed roles
    const roleIdByName = {};
    for (const def of roleDefs) {
      const { data: existing } = await supabase
        .from('roles')
        .select('id')
        .eq('name', def.name)
        .single();

      if (existing) {
        roleIdByName[def.name] = existing.id;
      } else {
        const { data } = await supabase
          .from('roles')
          .insert({ name: def.name, permissions: def.permissions })
          .select()
          .single();
        roleIdByName[def.name] = data.id;
      }
    }

    // Seed employees with Supabase Auth
    for (const def of employeeDefs) {
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('email', def.email)
        .single();

      if (!existing) {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: def.email,
          password: def.name.toLowerCase().replace(' ', '') + '123',
          email_confirm: true
        });

        if (!authError && authUser.user) {
          // Create employee profile
          await supabase.from('employees').insert({
            id: authUser.user.id,
            name: def.name,
            role_id: roleIdByName[def.roleName],
            designation: def.designation,
            department: def.department,
            email: def.email
          });
        }
      }
    }

    console.log('✓ Data initialization complete');
  } catch (err) {
    console.warn('Initial data seeding failed:', err?.message || err);
  }
}

// Initialize on startup
(async () => {
  try {
    console.log('✓ Connected to Supabase');
    await initializeData();
  } catch (err) {
    console.error('✗ Initialization error:', err?.message || err);
  }
})();

async function getRole(roleId) {
  if (!roleId) return null;
  const { data } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .single();
  return data || null;
}

async function getEmployee(employeeId) {
  if (!employeeId) return null;
  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();
  return data || null;
}

async function hasPermission(roleId, permission) {
  const role = await getRole(roleId);
  if (!role) return false;
  if (role.permissions?.fullAccess) return true;
  return Boolean(role.permissions && role.permissions[permission]);
}

async function fetchAllInventoryItems() {
  return inventoryStore.getAllItems();
}

async function fetchRecentTransactions(limit = 20) {
  return inventoryStore.getTransactions(limit);
}

async function getLowStockItems() {
  const items = await fetchAllInventoryItems();
  return items.filter((item) => Number(item.stock) <= Number(item.threshold));
}

async function buildMovementTrend(days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    result.push({
      date: key,
      label: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      inbound: 0,
      outbound: 0
    });
  }

  const from = new Date();
  from.setDate(from.getDate() - (days + 1));
  const transactions = await inventoryStore.getTransactionsFromDate(from.toISOString());

  transactions.forEach((tx) => {
    const key = (tx.timestamp || '').slice(0, 10);
    const bucket = result.find((entry) => entry.date === key);
    if (bucket) {
      if (tx.action === 'IN') bucket.inbound += Number(tx.quantity) || 0;
      if (tx.action === 'OUT') bucket.outbound += Number(tx.quantity) || 0;
    }
  });

  return result;
}

async function buildStockDistribution() {
  const items = await fetchAllInventoryItems();
  return items.map((item) => ({ name: item.name, value: Number(item.stock) || 0 }));
}

async function getAttendanceSnapshot(filterEmployeeId = null) {
  let query = supabase
    .from('attendance')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (filterEmployeeId) {
    query = query.eq('employee_id', filterEmployeeId);
  }

  const { data: records } = await query;

  const summary = { present: 0, absent: 0, late: 0 };
  (records || []).forEach((record) => {
    const key = (record.status || '').toLowerCase();
    if (summary[key] !== undefined) summary[key] += 1;
  });

  const total = summary.present + summary.absent + summary.late;
  const percentage = total > 0 ? Math.round((summary.present / total) * 100) : 0;

  return {
    records: records || [],
    summary,
    latest: (records || []).slice(0, 6),
    attendancePercentage: percentage
  };
}

async function getPurchaseSnapshot(filterEmployeeId = null) {
  let query = supabase
    .from('purchase_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filterEmployeeId) {
    query = query.eq('created_by_id', filterEmployeeId);
  }

  const { data: requests } = await query;

  const pending = (requests || []).filter((item) => ['Pending', 'pending-supervisor', 'pending-executive'].includes(item.status)).length;
  const approved = (requests || []).filter((item) => ['Approved', 'approved'].includes(item.status)).length;
  const rejected = (requests || []).filter((item) => ['Rejected', 'rejected'].includes(item.status)).length;

  // Map to frontend-expected field names
  const list = (requests || []).map(req => ({
    id: req.custom_id || req.id,
    items: (req.items || []).map(item => ({
      itemName: item.name || item.itemName,
      quantity: item.quantity
    })),
    status: req.status,
    neededBy: req.needed_by,
    requestedBy: req.created_by_name,
    createdAt: req.created_at,
    reason: req.reason
  }));

  return { list, pending, approved, rejected };
}

async function getInventorySnapshot() {
  const items = await fetchAllInventoryItems();
  const lowStock = await getLowStockItems();
  const transactions = await fetchRecentTransactions(20);
  return { items, lowStock, transactions };
}

async function computeDashboardSummary() {
  try {
    const items = await fetchAllInventoryItems();
    const lowStock = await getLowStockItems();
    const purchaseSnapshot = await getPurchaseSnapshot();
    const attendanceSnapshot = await getAttendanceSnapshot();
    const recentTransactions = await inventoryStore.getTransactions(10);

    const { count: notificationsUnread } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    const movementTrend = await buildMovementTrend(7);
    const stockDistribution = await buildStockDistribution();

    return {
      totals: {
        inventoryCount: items.reduce((acc, item) => acc + (Number(item.stock) || 0), 0),
        distinctItems: items.length,
        lowStock: lowStock.length,
        pendingRequests: purchaseSnapshot.pending
      },
      attendanceSummary: attendanceSnapshot.summary,
      movementTrend,
      stockDistribution,
      lowStock,
      recentTransactions,
      pendingRequests: purchaseSnapshot.requests.filter((req) => req.status !== 'approved' && req.status !== 'rejected'),
      notificationsUnread: notificationsUnread || 0
    };
  } catch (error) {
    console.error('Error in computeDashboardSummary:', error);
    throw error;
  }
}

function broadcast(type, payload) {
  if (!wssInstance) return;
  const message = JSON.stringify({ type, payload });
  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function broadcastDashboard() {
  const payload = await computeDashboardSummary();
  broadcast('dashboard:update', payload);
}

async function broadcastInventory() {
  const payload = await getInventorySnapshot();
  broadcast('inventory:update', payload);
}

async function broadcastAttendance() {
  const payload = await getAttendanceSnapshot();
  broadcast('attendance:update', payload);
}

async function broadcastPurchase() {
  const payload = await getPurchaseSnapshot();
  broadcast('purchase:update', payload);
}

async function broadcastNotifications() {
  const { data: list } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  broadcast('notifications:update', list || []);
}

async function createNotification({ title, message, severity = 'info', meta = {} }) {
  const { data: notification } = await supabase
    .from('notifications')
    .insert({
      title,
      message,
      severity,
      read: false,
      meta
    })
    .select()
    .single();

  await broadcastNotifications();
  return notification;
}

// Authentication middleware using Supabase
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    let employee = await getEmployee(user.id);

    // Auto-provision if missing
    if (!employee) {
      console.log(`⚠️ Employee profile missing for ${user.email}. Auto-provisioning...`);
      const { data: staffRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Staff')
        .single();

      if (staffRole) {
        const { data: newProfile, error: createError } = await supabase
          .from('employees')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            role_id: staffRole.id,
            designation: 'Staff',
            department: 'Operations',
            status: 'active'
          })
          .select()
          .single();

        if (newProfile) {
          employee = newProfile;
          console.log('✅ Auto-provisioned employee profile');
        } else {
          console.error('❌ Failed to auto-provision:', createError);
        }
      }
    }

    if (!employee) {
      return res.status(401).json({ message: 'Employee profile not found.' });
    }

    // Workaround for missing role_id column: Map position to Role ID
    let roleId = employee.role_id;
    if (!roleId && employee.position) {
      // Try to find role with name matching position
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', employee.position) // e.g. 'Employee'
        .single();
      if (roleData) roleId = roleData.id;
    }

    // Default to 'Staff' role if still not found
    if (!roleId) {
      const { data: staffRole } = await supabase.from('roles').select('id').eq('name', 'Staff').single();
      if (staffRole) roleId = staffRole.id;
    }

    req.auth = {
      userId: user.id,
      employeeId: employee.id,
      roleId: roleId
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }
    if (!(await hasPermission(req.auth.roleId, permission))) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    return next();
  };
}

// Mount GST routes (requires authenticate function)
app.use('/api/gst', createGstRoutes(authenticate));

// Mount E-Invoice routes (requires authenticate function)
app.use('/api/einvoice', createEinvoiceRoutes(authenticate));

// Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const employee = await getEmployee(data.user.id);

    // Resolve role from employee.position since role_id column doesn't exist
    let role = null;
    if (employee?.position) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('*')
        .eq('name', employee.position)
        .single();
      role = roleData;
    }

    // Fallback to role_id if it exists
    if (!role && employee?.role_id) {
      role = await getRole(employee.role_id);
    }

    // Build permissions - include fullAccess flag for frontend
    let permissions = {};
    if (role?.permissions?.fullAccess) {
      permissions = { ...permissionsCatalog, fullAccess: true };
    } else if (role?.permissions) {
      permissions = role.permissions;
    }

    res.json({
      token: data.session.access_token,
      employee: { ...employee, permissions },
      role,
      permissions
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/profile', authenticate, async (req, res) => {
  const employee = await getEmployee(req.auth.employeeId);
  const role = await getRole(req.auth.roleId);
  res.json({
    employee,
    role,
    permissions: role?.permissions?.fullAccess ? permissionsCatalog : role?.permissions || {}
  });
});

app.put('/api/auth/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return res.status(400).json({ message: 'Failed to update password.' });
    }

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/roles', async (req, res) => {
  const { data: roles } = await supabase.from('roles').select('*');
  res.json({ roles: roles || [], permissionsCatalog });
});

app.put('/api/roles/:roleId/permissions', authenticate, requirePermission('manageRoles'), async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body;

  const role = await getRole(roleId);
  if (!role) {
    return res.status(404).json({ message: 'Role not found.' });
  }

  if (role.permissions?.fullAccess) {
    return res.status(400).json({ message: 'Full-access roles cannot be modified.' });
  }

  await supabase
    .from('roles')
    .update({ permissions })
    .eq('id', roleId);

  await createNotification({
    title: 'Role permissions updated',
    message: `${role.name} permissions were updated.`,
    severity: 'info',
    meta: { roleId }
  });

  const updated = await getRole(roleId);
  res.json({ role: updated });
});

app.get('/api/employees', authenticate, async (req, res) => {
  const { data: employees } = await supabase.from('employees').select('*');
  res.json({ employees: employees || [] });
});

app.post('/api/employees', authenticate, requirePermission('manageRoles'), async (req, res) => {
  const { name, roleId, designation, department, email, password } = req.body;

  if (!name || !roleId || !email || !password) {
    return res.status(400).json({ message: 'Name, role, email, and password are required.' });
  }

  const role = await getRole(roleId);
  if (!role) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    const { data: authUser, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    await supabase.from('employees').insert({
      id: authUser.user.id,
      name,
      role_id: roleId,
      designation: designation || 'Associate',
      department: department || 'Operations',
      email
    });

    await createNotification({
      title: 'New employee added',
      message: `${name} joined as ${role.name}.`,
      severity: 'success',
      meta: { employeeId: authUser.user.id }
    });

    res.status(201).json({ employee: { id: authUser.user.id, name, role_id: roleId, designation, department, email } });
  } catch (err) {
    console.error('Employee creation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/inventory', authenticate, async (req, res) => {
  res.json(await getInventorySnapshot());
});

app.get('/api/inventory/items', async (req, res) => {
  try {
    const items = await fetchAllInventoryItems();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory items' });
  }
});

app.get('/api/inventory/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    const items = await inventoryStore.searchItems(q || '');
    const lowStock = items.filter((item) => Number(item.stock) <= Number(item.threshold));
    res.json({ items, lowStock });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search inventory items' });
  }
});

app.get('/api/inventory/lookup', authenticate, requirePermission('updateInventory'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }
    const item = await inventoryStore.findItemByBarcodeOrName(q);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to lookup item' });
  }
});

app.post('/api/inventory/scan', authenticate, requirePermission('updateInventory'), async (req, res) => {
  const { barcode, action, quantity, reason } = req.body;

  if (!barcode || !action || !quantity) {
    return res.status(400).json({ message: 'Barcode/name, action, and quantity are required.' });
  }

  const normalizedAction = String(action).toUpperCase();
  if (!['IN', 'OUT'].includes(normalizedAction)) {
    return res.status(400).json({ message: 'Action must be IN or OUT.' });
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'Quantity must be a positive number.' });
  }

  const item = await inventoryStore.findItemByBarcodeOrName(barcode);
  if (!item) {
    return res.status(404).json({ message: 'Inventory item not found. Please check the barcode or name.' });
  }

  const currentStock = Number(item.stock) || 0;
  const newStock = normalizedAction === 'IN' ? currentStock + qty : currentStock - qty;

  if (normalizedAction === 'OUT' && newStock < 0) {
    return res.status(400).json({ message: 'Insufficient stock for OUT operation.' });
  }

  await inventoryStore.updateItemStock(item.id, newStock);
  item.stock = newStock;

  const employee = await getEmployee(req.auth.employeeId);
  const transaction = {
    id: uuid(),
    itemId: item.id,
    itemName: item.name,
    barcode: item.barcode,
    action: normalizedAction,
    quantity: qty,
    user: employee ? employee.name : 'System',
    reason: reason || (normalizedAction === 'IN' ? 'Stock replenishment' : 'Inventory consumption'),
    timestamp: new Date().toISOString()
  };

  await inventoryStore.insertTransaction(transaction);

  const lowStockItems = await getLowStockItems();
  if (lowStockItems.some((lowItem) => lowItem.id === item.id)) {
    await createNotification({
      title: 'Low stock alert',
      message: `${item.name} is below its threshold (${item.stock} ${item.unit}).`,
      severity: 'warning',
      meta: { itemId: item.id }
    });
  }

  await broadcastInventory();
  await broadcastDashboard();

  res.json({ transaction, snapshot: await getInventorySnapshot() });
});

app.put('/api/inventory/items/:itemId', authenticate, requirePermission('configureThresholds'), async (req, res) => {
  const { itemId } = req.params;
  const { threshold } = req.body;

  const item = await inventoryStore.findItemById(itemId);
  if (!item) {
    return res.status(404).json({ message: 'Inventory item not found.' });
  }

  if (threshold !== undefined) {
    const value = Number(threshold);
    if (Number.isNaN(value) || value < 0) {
      return res.status(400).json({ message: 'Threshold must be a positive number.' });
    }
    await inventoryStore.updateItemThreshold(item.id, value);
    item.threshold = value;
  }

  await createNotification({
    title: 'Inventory threshold updated',
    message: `${item.name} threshold updated to ${item.threshold} ${item.unit}.`,
    severity: 'info',
    meta: { itemId: item.id }
  });

  await broadcastInventory();
  await broadcastDashboard();

  res.json({ item });
});

app.get('/api/attendance', authenticate, requirePermission('viewAttendance'), async (req, res) => {
  const canManageAttendance = await hasPermission(req.auth.roleId, 'manageAttendance');
  const filterEmployeeId = canManageAttendance ? null : req.auth.employeeId;
  res.json(await getAttendanceSnapshot(filterEmployeeId));
});

app.post('/api/attendance', authenticate, requirePermission('manageAttendance'), async (req, res) => {
  const { employeeId, status, note } = req.body;

  const employee = await getEmployee(employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const normalizedStatus = (status || '').trim().toLowerCase();
  const allowedStatuses = ['present', 'absent', 'late'];
  if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: 'Status must be Present, Absent, or Late.' });
  }

  const recordedByEmployee = await getEmployee(req.auth.employeeId);

  const { data: record } = await supabase
    .from('attendance')
    .insert({
      employee_id: employeeId,
      employee_name: employee.name,
      status: normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1),
      recorded_by: recordedByEmployee?.name || 'System',
      note: note || null
    })
    .select()
    .single();

  await createNotification({
    title: 'Attendance updated',
    message: `${employee.name} marked as ${record.status}.`,
    severity: 'info',
    meta: { employeeId }
  });

  await broadcastAttendance();
  await broadcastDashboard();

  res.status(201).json(record);
});

// Employee self-service Clock In/Out endpoint
app.post('/api/attendance/clock', authenticate, async (req, res) => {
  const { action } = req.body; // 'in' or 'out'

  if (!action || !['in', 'out'].includes(action.toLowerCase())) {
    return res.status(400).json({ message: 'Action must be "in" or "out".' });
  }

  const employee = await getEmployee(req.auth.employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  // Check if already clocked in/out today
  const today = new Date().toISOString().slice(0, 10);
  const { data: existingRecords } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('timestamp', today + 'T00:00:00')
    .lte('timestamp', today + 'T23:59:59');

  const clockedIn = existingRecords?.some(r => r.note === 'Clock In');
  const clockedOut = existingRecords?.some(r => r.note === 'Clock Out');

  if (action.toLowerCase() === 'in') {
    if (clockedIn) {
      return res.status(400).json({ message: 'You have already clocked in today.' });
    }

    // Determine if late (after 9 AM)
    const now = new Date();
    const hour = now.getHours();
    const isLate = hour >= 9;
    const status = isLate ? 'Late' : 'Present';

    const { data: record } = await supabase
      .from('attendance')
      .insert({
        employee_id: employee.id,
        employee_name: employee.name,
        status: status,
        recorded_by: 'Self',
        note: 'Clock In'
      })
      .select()
      .single();

    await broadcastAttendance();
    await broadcastDashboard();

    res.status(201).json({
      record,
      message: isLate ? 'Clocked in (marked as late)' : 'Successfully clocked in!'
    });
  } else {
    if (!clockedIn) {
      return res.status(400).json({ message: 'You must clock in before clocking out.' });
    }
    if (clockedOut) {
      return res.status(400).json({ message: 'You have already clocked out today.' });
    }

    const { data: record } = await supabase
      .from('attendance')
      .insert({
        employee_id: employee.id,
        employee_name: employee.name,
        status: 'Present',
        recorded_by: 'Self',
        note: 'Clock Out'
      })
      .select()
      .single();

    await broadcastAttendance();
    await broadcastDashboard();

    res.status(201).json({ record, message: 'Successfully clocked out!' });
  }
});

// Get today's clock status for current employee
app.get('/api/attendance/my-status', authenticate, async (req, res) => {
  const employee = await getEmployee(req.auth.employeeId);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: records } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('timestamp', today + 'T00:00:00')
    .lte('timestamp', today + 'T23:59:59')
    .order('timestamp', { ascending: true });

  const clockInRecord = records?.find(r => r.note === 'Clock In');
  const clockOutRecord = records?.find(r => r.note === 'Clock Out');

  res.json({
    clockedIn: !!clockInRecord,
    clockedOut: !!clockOutRecord,
    clockInTime: clockInRecord?.timestamp || null,
    clockOutTime: clockOutRecord?.timestamp || null,
    status: clockInRecord?.status || null
  });
});

app.get('/api/purchase-requests', authenticate, async (req, res) => {
  const canViewAll = await hasPermission(req.auth.roleId, 'supervisePurchaseRequest');
  const filterId = canViewAll ? null : req.auth.employeeId;
  res.json(await getPurchaseSnapshot(filterId));
});

async function generatePurchaseRequestId() {
  const { data: last } = await supabase
    .from('purchase_requests')
    .select('custom_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (last && last.custom_id) {
    const n = parseInt(String(last.custom_id || '').replace('PR-', ''), 10);
    if (!Number.isNaN(n)) return `PR-${String(n + 1).padStart(4, '0')}`;
  }
  return 'PR-0001';
}

app.post('/api/purchase-requests', authenticate, requirePermission('createPurchaseRequest'), async (req, res) => {
  const { items, reason, neededBy } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required.' });
  }

  const employee = await getEmployee(req.auth.employeeId);
  const customId = await generatePurchaseRequestId();

  const { data: request } = await supabase
    .from('purchase_requests')
    .insert({
      custom_id: customId,
      created_by_id: employee.id,
      created_by_name: employee.name,
      items: items.map((item) => ({
        id: uuid(),
        itemId: item.itemId,
        name: item.name,
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'pcs'
      })),
      reason: reason || 'Operational requirement',
      needed_by: neededBy || null,
      status: 'pending-supervisor',
      approvals: {
        supervisor: { status: 'pending', by: null, at: null, note: null },
        executive: { status: 'pending', by: null, at: null, note: null }
      },
      history: [
        { id: uuid(), action: 'created', message: `Request created by ${employee.name}.`, timestamp: new Date().toISOString() }
      ]
    })
    .select()
    .single();

  await createNotification({
    title: 'Purchase request submitted',
    message: `${employee.name} submitted purchase request ${customId}.`,
    severity: 'info',
    meta: { requestId: request.id }
  });

  await broadcastPurchase();
  await broadcastDashboard();

  res.status(201).json({ request });
});

app.post('/api/purchase-requests/:requestId/review', authenticate, async (req, res) => {
  const { requestId } = req.params;
  const { action, note } = req.body;

  const { data: request } = await supabase
    .from('purchase_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) {
    return res.status(404).json({ message: 'Purchase request not found.' });
  }

  const employee = await getEmployee(req.auth.employeeId);
  const roleId = req.auth.roleId;

  let updatedApprovals = { ...request.approvals };
  let updatedHistory = [...request.history];
  let newStatus = request.status;

  if (request.status === 'pending-supervisor') {
    if (!(await hasPermission(roleId, 'supervisePurchaseRequest'))) {
      return res.status(403).json({ message: 'Supervisor approval required.' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }

    updatedApprovals.supervisor = {
      status: action === 'approve' ? 'approved' : 'rejected',
      by: employee.name,
      at: new Date().toISOString(),
      note: note || null
    };
    updatedHistory.push({
      id: uuid(),
      action: 'supervisor-review',
      message: `${employee.name} ${action === 'approve' ? 'approved' : 'rejected'} at supervisor stage.`,
      timestamp: new Date().toISOString()
    });

    newStatus = action === 'approve' ? 'pending-executive' : 'rejected';

    await createNotification({
      title: 'Supervisor review completed',
      message: `${employee.name} ${action === 'approve' ? 'approved' : 'rejected'} purchase request ${request.custom_id}.`,
      severity: action === 'approve' ? 'info' : 'error',
      meta: { requestId }
    });
  } else if (request.status === 'pending-executive') {
    if (!(await hasPermission(roleId, 'approvePurchaseRequest'))) {
      return res.status(403).json({ message: 'Executive approval required.' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject.' });
    }

    updatedApprovals.executive = {
      status: action === 'approve' ? 'approved' : 'rejected',
      by: employee.name,
      at: new Date().toISOString(),
      note: note || null
    };
    updatedHistory.push({
      id: uuid(),
      action: 'executive-review',
      message: `${employee.name} ${action === 'approve' ? 'approved' : 'rejected'} at executive stage.`,
      timestamp: new Date().toISOString()
    });

    newStatus = action === 'approve' ? 'approved' : 'rejected';

    await createNotification({
      title: 'Executive decision recorded',
      message: `${employee.name} ${action === 'approve' ? 'approved' : 'rejected'} purchase request ${request.custom_id}.`,
      severity: action === 'approve' ? 'success' : 'error',
      meta: { requestId }
    });
  } else {
    return res.status(400).json({ message: 'Request is no longer pending review.' });
  }

  const { data: updated } = await supabase
    .from('purchase_requests')
    .update({
      status: newStatus,
      approvals: updatedApprovals,
      history: updatedHistory
    })
    .eq('id', requestId)
    .select()
    .single();

  await broadcastPurchase();
  await broadcastDashboard();

  res.json({ request: updated });
});

app.get('/api/notifications', authenticate, async (req, res) => {
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  res.json({ notifications: notifications || [] });
});

app.post('/api/notifications/:notificationId/read', authenticate, async (req, res) => {
  const { notificationId } = req.params;

  const { data: notification } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  await broadcastNotifications();
  res.json({ notification });
});

app.post('/api/notifications/read-all', authenticate, async (req, res) => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  await broadcastNotifications();
  res.json({ notifications: notifications || [] });
});

app.get('/api/dashboard/summary', authenticate, requirePermission('viewDashboard'), async (req, res) => {
  try {
    const summaryPromise = computeDashboardSummary();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Dashboard summary computation timed out')), 5000);
    });

    const summary = await Promise.race([summaryPromise, timeoutPromise]);
    res.json(summary);
  } catch (error) {
    console.error('Error computing dashboard summary:', error);
    res.status(500).json({ message: 'Failed to compute dashboard summary', error: error.message });
  }
});

// ✅ FIXED - GET dashboard stats with proper response format
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/dashboard/stats called');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);

    // Get today's attendance records
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, status, timestamp')
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`);

    if (attendanceError) throw attendanceError;

    console.log(`✅ Today's attendance records: ${todayAttendance.length}`);

    // Count present employees today
    const presentToday = todayAttendance.filter(
      record => record.status.toLowerCase() === 'present'
    ).length;

    console.log(`✅ Present today: ${presentToday}`);

    // Get total active employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('status', 'active');

    if (empError) throw empError;

    const totalEmployees = employees.length;
    console.log(`✅ Total employees: ${totalEmployees}`);

    // Calculate attendance percentage
    const attendancePercentage = totalEmployees > 0
      ? Math.round((presentToday / totalEmployees) * 100)
      : 0;

    console.log(`✅ Attendance: ${presentToday}/${totalEmployees} = ${attendancePercentage}%`);

    // Get inventory stats
    const { data: inventory, error: invError } = await supabase
      .from('inventory')
      .select('quantity, reorder_level');

    const totalInventory = inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const lowStockItems = inventory?.filter(item => item.quantity <= item.reorder_level).length || 0;

    // ✅ FIX: Wrap response in correct format for frontend
    res.json({
      success: true,
      data: {
        presentToday,
        totalEmployees,
        attendancePercentage,
        totalInventory,
        lowStockItems,
        pendingRequests: 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
wssInstance = wss;

wss.on('connection', (ws) => {
  console.log('✓ WebSocket client connected');
  ws.on('message', (message) => {
    console.log('WebSocket message received:', message.toString());
  });
  ws.on('close', () => {
    console.log('✓ WebSocket client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ WebSocket server ready`);
});

module.exports = app;
