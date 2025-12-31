const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (using same credentials from environment)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Import authentication middleware
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

    req.auth = { userId: user.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// GET summary for dashboard (MUST be before the '/' route)
router.get('/summary', authenticate, async (req, res) => {
  try {
    console.log('📊 Fetching finished products summary for dashboard');
    
    const { data: allProducts, error } = await supabase
      .from('finished_products')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
    
    const summary = {
      totalProducts: allProducts?.length || 0,
      totalStock: allProducts?.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0) || 0,
      categories: [...new Set(allProducts?.map(p => p.category) || [])].length,
      lowStockCount: allProducts?.filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.min_stock) || 1)).length || 0,
      recentlyAdded: allProducts?.slice(-5).map(p => ({
        id: p.id,
        name: p.product_name,
        category: p.category,
        stock: p.stock
      })) || []
    };
    
    console.log('✅ Summary generated:', summary);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// GET all finished products (with optional barcode filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const { barcode } = req.query;
    
    console.log('📦 Fetching finished products, barcode:', barcode);
    
    let query = supabase.from('finished_products').select('*');
    
    if (barcode) {
      query = query.eq('barcode', barcode);
      console.log('🔍 Searching for barcode:', barcode);
    }
    
    query = query.order('category').order('product_name');
    
    const { data: products, error } = await query;
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log('✅ Found products:', products?.length || 0);
    
    // Get all products for stats
    const { data: allProducts } = await supabase
      .from('finished_products')
      .select('*');
    
    const stats = {
      totalProducts: allProducts?.length || 0,
      totalStock: allProducts?.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0) || 0,
      categories: [...new Set(allProducts?.map(p => p.category) || [])].length,
      lowStockCount: allProducts?.filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.min_stock) || 1)).length || 0
    };
    
    console.log('📊 Stats:', stats);
    
    res.json({
      success: true,
      data: products || [],
      stats: stats
    });
  } catch (error) {
    console.error('❌ Error fetching finished products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// POST - Update stock (manufactured or dispatched)
router.post('/update-stock', authenticate, async (req, res) => {
  try {
    const { productId, action, quantity, reason, userName } = req.body;
    
    console.log('📝 Updating stock:', { productId, action, quantity });
    
    if (!productId || !action || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: productId, action, quantity' 
      });
    }
    
    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('finished_products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (fetchError || !product) {
      console.error('❌ Product not found:', productId);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    let newStock = parseInt(product.stock) || 0;
    
    // Calculate new stock based on action
    if (action === 'MANUFACTURED') {
      newStock += parseInt(quantity);
    } else if (action === 'DISPATCHED') {
      newStock -= parseInt(quantity);
      if (newStock < 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action. Must be MANUFACTURED or DISPATCHED' 
      });
    }
    
    // Update stock
    const { error: updateError } = await supabase
      .from('finished_products')
      .update({ stock: newStock })
      .eq('id', productId);
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }
    
    // Log transaction
    const { error: logError } = await supabase
      .from('finished_product_transactions')
      .insert({
        product_id: productId,
        product_name: product.product_name,
        action: action,
        quantity: parseInt(quantity),
        reason: reason || '',
        user_name: userName || 'System'
      });
    
    if (logError) {
      console.error('❌ Transaction log error:', logError);
    }
    
    console.log('✅ Stock updated successfully. New stock:', newStock);
    
    res.json({
      success: true,
      newStock: newStock,
      message: `${action} ${quantity} units successfully`
    });
  } catch (error) {
    console.error('❌ Error updating stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// GET transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    console.log('📜 Fetching finished product transactions');
    
    const { data: transactions, error } = await supabase
      .from('finished_product_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('❌ Error fetching transactions:', error);
      throw error;
    }
    
    console.log('✅ Found transactions:', transactions?.length || 0);
    
    res.json({
      success: true,
      data: transactions || []
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
