const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

// Get all products with inventory
router.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, inventory(*)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add product
router.post('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(req.body)
      .select()
      .single()
    
    if (error) throw error
    
    // Create inventory record
    await supabase.from('inventory').insert({
      product_id: data.id,
      quantity: 0
    })
    
    res.status(201).json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update product
router.put('/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()
    
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    res.json({ message: 'Product deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
