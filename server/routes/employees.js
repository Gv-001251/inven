const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateSupabaseToken } = require('../middleware/auth');

// ✅ Apply Supabase auth middleware
router.get('/', authenticateSupabaseToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

router.post('/', authenticateSupabaseToken, async (req, res) => {
  try {
    const { name, email, phone, designation, salary, address } = req.body;
    
    const { data, error } = await supabase
      .from('employees')
      .insert([{ name, email, phone, designation, salary, address }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Failed to create employee' });
  }
});

router.put('/:id', authenticateSupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Failed to update employee' });
  }
});

router.delete('/:id', authenticateSupabaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Failed to delete employee' });
  }
});

module.exports = router;
