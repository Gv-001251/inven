const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedInventoryItems(componentDefs) {
  for (const def of componentDefs) {
    const { data: existing } = await supabase
      .from('inventory')
      .select('id')
      .eq('barcode', def.barcode)
      .single();
    
    if (!existing) {
      await supabase.from('inventory').insert({
        name: def.name,
        barcode: def.barcode,
        category: def.category,
        unit: def.unit,
        stock: def.stock,
        threshold: def.threshold
      });
    }
  }
}

async function getAllItems() {
  const { data } = await supabase
    .from('inventory')
    .select('*')
    .order('name');
  return data || [];
}

async function findItemById(itemId) {
  const { data } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', itemId)
    .single();
  return data;
}

async function findItemByBarcodeOrName(query) {
  const { data } = await supabase
    .from('inventory')
    .select('*')
    .or(`barcode.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(1)
    .single();
  return data;
}

async function searchItems(query) {
  if (!query) return getAllItems();
  
  const { data } = await supabase
    .from('inventory')
    .select('*')
    .or(`barcode.ilike.%${query}%,name.ilike.%${query}%`)
    .order('name');
  return data || [];
}

async function updateItemStock(itemId, newStock) {
  await supabase
    .from('inventory')
    .update({ stock: newStock })
    .eq('id', itemId);
}

async function updateItemThreshold(itemId, threshold) {
  await supabase
    .from('inventory')
    .update({ threshold })
    .eq('id', itemId);
}

async function insertTransaction(transaction) {
  await supabase
    .from('transactions')
    .insert({
      item_id: transaction.itemId,
      item_name: transaction.itemName,
      barcode: transaction.barcode,
      action: transaction.action,
      quantity: transaction.quantity,
      user: transaction.user,
      reason: transaction.reason
    });
}

async function getTransactions(limit = 20) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  return data || [];
}

async function getTransactionsFromDate(dateString) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .gte('timestamp', dateString)
    .order('timestamp', { ascending: false });
  return data || [];
}

module.exports = {
  seedInventoryItems,
  getAllItems,
  findItemById,
  findItemByBarcodeOrName,
  searchItems,
  updateItemStock,
  updateItemThreshold,
  insertTransaction,
  getTransactions,
  getTransactionsFromDate
};
