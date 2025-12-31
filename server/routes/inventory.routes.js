const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (itemsError) {
      console.error('❌ Items fetch error:', itemsError);
      throw itemsError;
    }
    
    console.log(`✅ Fetched ${items?.length || 0} items`);
    
    // Get transactions in DESCENDING order (newest first)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (txError) {
      console.error('❌ Transactions fetch error:', txError);
      throw txError;
    }
    
    console.log(`✅ Fetched ${transactions?.length || 0} transactions`);
    
    res.json({
      success: true,
      items: items || [],
      lowStock: items?.filter(item => item.stock <= item.threshold) || [],
      transactions: transactions || []
    });
  } catch (error) {
    console.error('❌ Inventory fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lookup item by barcode or name
router.get('/lookup/:query', async (req, res) => {
  try {
    const query = req.params.query;
    console.log(`🔍 Looking up: "${query}"`);
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .or(`barcode.eq.${query},name.ilike.%${query}%`)
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Lookup error:', error);
      throw error;
    }
    
    if (data) {
      console.log(`✅ Found item: ${data.name}`);
    } else {
      console.log('⚠️ Item not found');
    }
    
    res.json({
      success: true,
      item: data || null
    });
  } catch (error) {
    console.error('❌ Lookup error:', error);
    res.status(404).json({ success: false, error: 'Item not found' });
  }
});

// Stock in/out
router.post('/scan', async (req, res) => {
  try {
    const { barcode, action, quantity, reason } = req.body;
    
    console.log('📦 === SCAN REQUEST START ===');
    console.log('Barcode:', barcode);
    console.log('Action:', action);
    console.log('Quantity:', quantity);
    console.log('Reason:', reason);
    
    // Find item by barcode or name
    const { data: item, error: findError } = await supabase
      .from('items')
      .select('*')
      .or(`barcode.eq.${barcode},name.ilike.%${barcode}%`)
      .limit(1)
      .single();
    
    if (findError || !item) {
      console.error('❌ Item not found. Error:', findError);
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found. Please check the barcode or name.' 
      });
    }
    
    console.log(`✅ Found item: ${item.name} (ID: ${item.id})`);
    console.log(`   Current stock: ${item.stock}`);
    
    // Calculate new stock
    const newStock = action === 'IN' 
      ? item.stock + quantity 
      : item.stock - quantity;
    
    console.log(`   New stock will be: ${newStock}`);
    
    if (newStock < 0) {
      console.error('❌ Insufficient stock');
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock for OUT operation' 
      });
    }
    
    // Update stock
    console.log('💾 Updating stock...');
    const { error: updateError } = await supabase
      .from('items')
      .update({ stock: newStock })
      .eq('id', item.id);
    
    if (updateError) {
      console.error('❌ Stock update failed:', updateError);
      throw updateError;
    }
    
    console.log('✅ Stock updated successfully');
    
    // Log transaction
    console.log('📝 Inserting transaction...');
    const transactionData = {
      item_id: item.id,
      item_name: item.name,
      action: action,
      quantity: quantity,
      reason: reason || 'No reason provided',
      user: 'Admin',
      timestamp: new Date().toISOString()
    };
    
    console.log('Transaction data:', JSON.stringify(transactionData, null, 2));
    
    const { data: insertedTx, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (txError) {
      console.error('❌ Transaction insert failed:', txError);
      console.error('Error details:', JSON.stringify(txError, null, 2));
      // Don't fail the request, just warn
      console.warn('⚠️ Stock updated but transaction not logged');
    } else {
      console.log('✅ Transaction logged successfully');
      console.log('Inserted transaction:', JSON.stringify(insertedTx, null, 2));
    }
    
    console.log('📦 === SCAN REQUEST END ===\n');
    
    res.json({
      success: true,
      message: `Stock ${action === 'IN' ? 'added' : 'removed'} successfully`,
      item: { ...item, stock: newStock }
    });
  } catch (error) {
    console.error('❌ Scan error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update item threshold
router.put('/items/:id/threshold', async (req, res) => {
  try {
    const { id } = req.params;
    const { threshold } = req.body;
    
    console.log(`🔧 Updating threshold for item ${id} to ${threshold}`);
    
    const { data, error } = await supabase
      .from('items')
      .update({ threshold: threshold })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Threshold update failed:', error);
      throw error;
    }
    
    console.log('✅ Threshold updated successfully');
    
    res.json({
      success: true,
      message: 'Threshold updated successfully',
      item: data
    });
  } catch (error) {
    console.error('❌ Threshold update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all products (backward compatibility)
router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, inventory(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product
router.post('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    
    await supabase.from('inventory').insert({
      product_id: data.id,
      quantity: 0
    });
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
