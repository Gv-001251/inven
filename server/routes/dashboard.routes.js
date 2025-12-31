const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateSupabaseToken } = require('../middleware/auth'); // ✅ Import auth middleware


// Get dashboard stats
router.get('/stats', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Get total inventory count
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('stock, threshold');

    if (itemsError) throw itemsError;

    const totalInventory = items?.reduce((sum, item) => sum + (item.stock || 0), 0) || 0;

    // Get low stock items - items where stock <= threshold
    const lowStockItems = items?.filter(item => item.stock <= item.threshold) || [];

    console.log('✅ Stats calculated:', {
      totalInventory,
      lowStockItems: lowStockItems.length
    });

    // Get total employees count
    const { count: totalEmployees, error: empError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    if (empError) throw empError;

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`);

    if (attendanceError) throw attendanceError;

    // Calculate presence stats
    // specific "Present" count
    const presentCount = attendanceData?.filter(r => r.status === 'Present').length || 0;
    // We might also consider 'Late' as present for the total count of people here, 
    // but usually 'Present' is the main metric. Let's count 'Present' + 'Late' as effectively present. 
    // Actually, sticking to strict 'Present' matches the other file's logic unless 'presentToday' means 'people in office'.
    // Let's assume 'Present' + 'Late' means they are in.
    const effectivePresent = attendanceData?.filter(r => ['Present', 'Late'].includes(r.status)).length || 0;

    const attendancePercentage = totalEmployees > 0
      ? Math.round((effectivePresent / totalEmployees) * 100)
      : 0;

    console.log('✅ Stats calculated:', {
      totalInventory,
      lowStockItems: lowStockItems.length,
      effectivePresent,
      totalEmployees
    });

    // Get pending purchase requests count
    const { count: pendingRequests, error: purchaseError } = await supabase
      .from('purchase_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');

    if (purchaseError) {
      console.error('Failed to get pending requests:', purchaseError);
    }

    res.json({
      success: true,
      data: {
        totalInventory,
        lowStockItems: lowStockItems.length,
        pendingRequests: pendingRequests || 0,
        presentToday: effectivePresent, // Changed from todayAttendance to match frontend
        attendancePercentage: attendancePercentage,
        totalEmployees: totalEmployees || 0
      }
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get inventory movement (last 7 days)
router.get('/inventory-movement', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('📈 Fetching inventory movement...');

    const dates = [];
    const inbound = [];
    const outbound = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const { data: transactions } = await supabase
        .from('transactions')
        .select('action, quantity')
        .gte('timestamp', `${dateStr}T00:00:00`)
        .lte('timestamp', `${dateStr}T23:59:59`);

      const inSum = transactions?.filter(t => t.action === 'IN').reduce((sum, t) => sum + t.quantity, 0) || 0;
      const outSum = transactions?.filter(t => t.action === 'OUT').reduce((sum, t) => sum + t.quantity, 0) || 0;

      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      inbound.push(inSum);
      outbound.push(outSum);
    }

    console.log('✅ Movement data calculated');

    res.json({
      success: true,
      data: { dates, inbound, outbound }
    });
  } catch (error) {
    console.error('❌ Movement error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get top items by stock
router.get('/top-items', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('🔝 Fetching top items...');

    const { data, error } = await supabase
      .from('items')
      .select('name, stock')
      .order('stock', { ascending: false })
      .limit(6);

    if (error) throw error;

    const topItems = data?.map(item => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) : item.name,
      quantity: item.stock
    })) || [];

    console.log('✅ Top items fetched');

    res.json({ success: true, data: topItems });
  } catch (error) {
    console.error('❌ Top items error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get low stock items
router.get('/low-stock', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('⚠️ Fetching low stock items...');

    const { data, error } = await supabase
      .from('items')
      .select('id, name, stock, threshold');

    if (error) throw error;

    // Filter where stock <= threshold
    const lowStockData = data?.filter(item => item.stock <= item.threshold) || [];

    const lowStock = lowStockData.slice(0, 5).map(item => ({
      _id: item.id,
      name: item.name,
      quantity: item.stock,
      reorderLevel: item.threshold
    }));

    console.log('✅ Found low stock items:', lowStock.length);

    res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error('❌ Low stock error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get recent transactions
router.get('/recent-transactions', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('🕒 Fetching recent transactions...');

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) throw error;

    const transactions = data?.map(tx => ({
      _id: tx.id,
      itemId: { name: tx.item_name },
      type: tx.action === 'IN' ? 'in' : 'out',
      quantity: tx.quantity,
      timestamp: tx.timestamp
    })) || [];

    console.log('✅ Recent transactions fetched');

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('❌ Recent transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Get recent purchase requests
router.get('/recent-purchases', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('🛒 Fetching recent purchase requests...');

    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const purchases = data?.map(pr => ({
      _id: pr.id,
      customId: pr.custom_id,
      createdBy: pr.created_by_name,
      items: pr.items,
      status: pr.status,
      reason: pr.reason,
      createdAt: pr.created_at
    })) || [];

    console.log('✅ Recent purchases fetched:', purchases.length);

    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error('❌ Recent purchases error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
