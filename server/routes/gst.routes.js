const express = require('express');
const multer = require('multer');
const supabase = require('../config/supabase');
const { v4: uuid } = require('uuid');

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'), false);
        }
    }
});

// Helper to get file extension from mimetype
const getExtension = (mimetype) => {
    const map = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png'
    };
    return map[mimetype] || 'bin';
};

// Export a function that creates the router with authenticate middleware
module.exports = function (authenticate) {
    const router = express.Router();

    // POST /api/gst/upload - Upload a GST bill
    router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
        try {
            const { type, business_date, metadata } = req.body;
            const file = req.file;

            // Validation
            if (!file) {
                return res.status(400).json({ success: false, message: 'File is required.' });
            }

            if (!type || !['sales', 'purchase'].includes(type.toLowerCase())) {
                return res.status(400).json({ success: false, message: 'Type must be "sales" or "purchase".' });
            }

            if (!business_date) {
                return res.status(400).json({ success: false, message: 'Business date is required.' });
            }

            // Parse metadata
            let parsedMetadata = {};
            try {
                parsedMetadata = metadata ? JSON.parse(metadata) : {};
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid metadata format.' });
            }

            // Get user info from request (set by authenticate middleware)
            const userId = req.auth?.employeeId || req.auth?.userId;

            // Get employee name
            const { data: employee } = await supabase
                .from('employees')
                .select('name')
                .eq('id', userId)
                .single();

            const uploadedByName = employee?.name || 'Unknown';

            // Generate unique filename
            const timestamp = Date.now();
            const ext = getExtension(file.mimetype);
            const uniqueFilename = `${type}_${timestamp}_${uuid().slice(0, 8)}.${ext}`;
            const storagePath = `${type}/${uniqueFilename}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('gst_uploads')
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload file to storage.',
                    error: uploadError.message
                });
            }

            // Get public URL for the file
            const { data: urlData } = supabase.storage
                .from('gst_uploads')
                .getPublicUrl(storagePath);

            const fileUrl = urlData?.publicUrl || storagePath;

            // Insert record into gst_records table
            const recordData = {
                id: uuid(),
                file_url: fileUrl,
                file_name: file.originalname,
                type: type.toLowerCase(),
                business_date: business_date,
                uploaded_by: userId,
                uploaded_by_name: uploadedByName,
                vendor_name: parsedMetadata.vendor_name || null,
                customer_name: parsedMetadata.customer_name || null,
                gst_amount: parsedMetadata.gst_amount ? parseFloat(parsedMetadata.gst_amount) : null,
                total_amount: parsedMetadata.amount ? parseFloat(parsedMetadata.amount) : null,
                created_at: new Date().toISOString()
            };

            const { data: record, error: insertError } = await supabase
                .from('gst_records')
                .insert(recordData)
                .select()
                .single();

            if (insertError) {
                console.error('Database insert error:', insertError);
                // Try to clean up the uploaded file
                await supabase.storage.from('gst_uploads').remove([storagePath]);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save record to database.',
                    error: insertError.message
                });
            }

            res.status(201).json({
                success: true,
                message: 'Bill uploaded successfully.',
                record
            });

        } catch (error) {
            console.error('GST upload error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error.'
            });
        }
    });

    // GET /api/gst/records - Get GST records
    router.get('/records', authenticate, async (req, res) => {
        try {
            const { type } = req.query;
            const userId = req.auth?.employeeId || req.auth?.userId;
            const roleId = req.auth?.roleId;

            // Check if user has full access (admin)
            const { data: role } = await supabase
                .from('roles')
                .select('permissions')
                .eq('id', roleId)
                .single();

            const hasFullAccess = role?.permissions?.fullAccess || role?.permissions?.manageInvoices;

            // Build query
            let query = supabase
                .from('gst_records')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by type if specified
            if (type && ['sales', 'purchase'].includes(type.toLowerCase())) {
                query = query.eq('type', type.toLowerCase());
            }

            // Non-admin users can only see their own records
            if (!hasFullAccess) {
                query = query.eq('uploaded_by', userId);
            }

            const { data: records, error } = await query;

            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch records.',
                    error: error.message
                });
            }

            res.json({
                success: true,
                records: records || [],
                total: records?.length || 0
            });

        } catch (error) {
            console.error('GST records fetch error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error.'
            });
        }
    });

    // Error handling middleware for multer errors
    router.use((error, req, res, next) => {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds the 10MB limit.'
                });
            }
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        next();
    });

    return router;
};

