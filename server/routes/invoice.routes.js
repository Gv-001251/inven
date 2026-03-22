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

// Add product (ACID-compliant via stored procedure)
router.post('/products', async (req, res) => {
  try {
    const { data: result, error } = await supabase.rpc('create_product_with_inventory', {
      p_product_data: req.body
    })
    
    if (error) throw error
    
    res.status(201).json(result)
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
