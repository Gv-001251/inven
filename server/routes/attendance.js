const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticateSupabaseToken } = require('../middleware/auth');


// GET attendance records
router.get('/', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('📋 Fetching attendance records...');
    
    // First, get all attendance records
    const { data: records, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .order('timestamp', { ascending: false });

    if (attendanceError) {
      console.error('❌ Attendance query error:', attendanceError);
      return res.status(500).json({ 
        message: 'Failed to fetch attendance',
        error: attendanceError.message 
      });
    }

    console.log(`✅ Found ${records?.length || 0} attendance records`);

    // If no records, return empty response
    if (!records || records.length === 0) {
      return res.json({
        records: [],
        summary: { present: 0, absent: 0, late: 0 },
        attendancePercentage: 0
      });
    }

    // Get unique employee IDs
    const employeeIds = [...new Set(records.map(r => r.employee_id).filter(id => id))];
    
    console.log(`👥 Fetching ${employeeIds.length} unique employees...`);

    // Fetch employee names
    let employeeMap = {};
    if (employeeIds.length > 0) {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', employeeIds);

      if (empError) {
        console.error('⚠️ Employee query error:', empError);
        // Continue anyway, just use "Unknown" for names
      } else if (employees) {
        employees.forEach(emp => {
          employeeMap[emp.id] = emp.name;
        });
        console.log(`✅ Loaded ${employees.length} employee names`);
      }
    }

    // Format records
    const formattedRecords = records.map(record => ({
      id: record.id,
      employeeName: employeeMap[record.employee_id] || 'Unknown Employee',
      status: record.status,
      note: record.note || '',
      timestamp: record.timestamp,
      recordedBy: record.recorded_by || 'System'
    }));

    // Calculate summary
    const summary = {
      present: formattedRecords.filter(r => r.status?.toLowerCase() === 'present').length,
      absent: formattedRecords.filter(r => r.status?.toLowerCase() === 'absent').length,
      late: formattedRecords.filter(r => r.status?.toLowerCase() === 'late').length
    };

    const total = summary.present + summary.absent + summary.late;
    const attendancePercentage = total > 0 ? Math.round((summary.present / total) * 100) : 0;

    console.log('📊 Summary:', summary, '| Percentage:', attendancePercentage);

    res.json({
      records: formattedRecords,
      summary,
      attendancePercentage
    });
  } catch (error) {
    console.error('💥 Error fetching attendance:', error);
    res.status(500).json({ 
      message: 'Failed to fetch attendance',
      error: error.message 
    });
  }
});


// POST new attendance record
router.post('/', authenticateSupabaseToken, async (req, res) => {
  try {
    console.log('📝 Creating new attendance record...');
    
    const { employeeId, status, note } = req.body;
    const recordedBy = req.user?.email || 'Unknown';

    // Validate required fields
    if (!employeeId || !status) {
      return res.status(400).json({ 
        message: 'Employee ID and status are required' 
      });
    }

    // Validate status
    const validStatuses = ['Present', 'Absent', 'Late'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be Present, Absent, or Late' 
      });
    }

    console.log('👤 Recording:', { employeeId, status, recordedBy });

    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        employee_id: employeeId,
        status,
        note: note || null,
        recorded_by: recordedBy,
        timestamp: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('❌ Insert error:', error);
      return res.status(500).json({ 
        message: 'Failed to record attendance',
        error: error.message 
      });
    }

    console.log('✅ Attendance recorded successfully');
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('💥 Error creating attendance:', error);
    res.status(500).json({ 
      message: 'Failed to record attendance',
      error: error.message 
    });
  }
});


module.exports = router;
