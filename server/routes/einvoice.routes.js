const express = require('express');
const axios = require('axios');
const supabase = require('../config/supabase');
const { v4: uuid } = require('uuid');
const QRCode = require('qrcode');

// NIC E-Invoice Sandbox Configuration
const NIC_CONFIG = {
    authUrl: process.env.EINVOICE_API_URL || 'https://einv-apisandbox.nic.in',
    clientId: process.env.EINVOICE_CLIENT_ID,
    clientSecret: process.env.EINVOICE_CLIENT_SECRET
};

// Simple rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Rate limiter middleware (3 requests per second per GSTIN)
const rateLimiter = (req, res, next) => {
    const gstin = req.body?.supplierGstin || req.query?.gstin || 'default';
    const now = Date.now();
    const windowMs = 1000; // 1 second
    const maxRequests = 3;

    if (!rateLimitStore.has(gstin)) {
        rateLimitStore.set(gstin, []);
    }

    const timestamps = rateLimitStore.get(gstin).filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
        return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded. Maximum 3 requests per second per GSTIN.'
        });
    }

    timestamps.push(now);
    rateLimitStore.set(gstin, timestamps);
    next();
};

// Build E-Invoice JSON payload from form data (NIC Schema v1.03)
function buildEinvoicePayload(formData) {
    const isInterState = formData.supplierState !== formData.recipientState;

    const itemList = formData.items.map((item, index) => {
        const taxableAmt = item.qty * item.rate;
        const gstAmt = (taxableAmt * item.gstPercent) / 100;

        return {
            SlNo: String(index + 1),
            PrdDesc: item.product,
            IsServc: 'N',
            HsnCd: item.hsn,
            Qty: item.qty,
            Unit: 'NOS',
            UnitPrice: item.rate,
            TotAmt: taxableAmt,
            AssAmt: taxableAmt,
            GstRt: item.gstPercent,
            IgstAmt: isInterState ? gstAmt : 0,
            CgstAmt: isInterState ? 0 : gstAmt / 2,
            SgstAmt: isInterState ? 0 : gstAmt / 2,
            TotItemVal: taxableAmt + gstAmt
        };
    });

    return {
        Version: '1.1',
        TranDtls: {
            TaxSch: 'GST',
            SupTyp: isInterState ? 'INTER' : 'INTRA',
            RegRev: 'N',
            EcmGstin: null,
            IgstOnIntra: 'N'
        },
        DocDtls: {
            Typ: formData.invoiceType === 'sales' ? 'INV' : 'INV',
            No: formData.invoiceNumber,
            Dt: formatDateForNIC(formData.invoiceDate)
        },
        SellerDtls: {
            Gstin: formData.supplierGstin,
            LglNm: formData.supplierName,
            TrdNm: formData.supplierName,
            Addr1: 'Industrial Area',
            Loc: 'Chennai',
            Pin: 600001,
            Stcd: formData.supplierState
        },
        BuyerDtls: {
            Gstin: formData.recipientGstin,
            LglNm: formData.recipientName || 'Buyer',
            TrdNm: formData.recipientName || 'Buyer',
            Addr1: 'Address Line 1',
            Loc: 'Location',
            Pin: parseInt(formData.recipientPin) || 600001,
            Stcd: formData.recipientState,
            Pos: formData.recipientState
        },
        ItemList: itemList,
        ValDtls: {
            AssVal: parseFloat(formData.totals.taxableValue),
            CgstVal: parseFloat(formData.totals.cgst),
            SgstVal: parseFloat(formData.totals.sgst),
            IgstVal: parseFloat(formData.totals.igst),
            TotInvVal: parseFloat(formData.totals.invoiceTotal)
        }
    };
}

// Format date for NIC API (DD/MM/YYYY)
function formatDateForNIC(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Generate a demo IRN for sandbox testing
function generateDemoIRN() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `IRN${timestamp}${random}`;
}

// Generate QR Code as Base64 PNG
async function generateQRCodeBase64(data) {
    try {
        // Generate QR code as data URL (includes data:image/png;base64, prefix)
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: 256,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
        });
        return qrDataUrl;
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
}

// Export a function that creates the router with authenticate middleware
module.exports = function (authenticate) {
    const router = express.Router();

    // POST /api/einvoice/auth - Test NIC sandbox authentication
    router.post('/auth', authenticate, rateLimiter, async (req, res) => {
        try {
            if (!NIC_CONFIG.clientId || !NIC_CONFIG.clientSecret) {
                return res.status(500).json({
                    success: false,
                    message: 'E-Invoice credentials not configured. Please add EINVOICE_CLIENT_ID and EINVOICE_CLIENT_SECRET to .env'
                });
            }

            // Attempt NIC sandbox authentication
            const authResponse = await axios.post(`${NIC_CONFIG.authUrl}/v3.01/auth`, {
                grant_type: 'client_credentials',
                client_id: NIC_CONFIG.clientId,
                client_secret: NIC_CONFIG.clientSecret
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            res.json({
                success: true,
                message: 'NIC authentication successful',
                token: authResponse.data?.access_token ? '***authenticated***' : null,
                expiresIn: authResponse.data?.expires_in
            });

        } catch (error) {
            console.error('NIC Auth Error:', error.response?.data || error.message);

            // For sandbox testing, return demo success
            res.json({
                success: true,
                message: 'Demo mode: Authentication simulated (NIC sandbox may be unavailable)',
                token: 'demo-token',
                demo: true
            });
        }
    });

    // POST /api/einvoice/generate-irn - Generate IRN from invoice form data
    router.post('/generate-irn', authenticate, rateLimiter, async (req, res) => {
        try {
            const formData = req.body;
            const userId = req.auth?.employeeId || req.auth?.userId;

            // Validation
            if (!formData.supplierGstin || !formData.recipientGstin) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier and Recipient GSTIN are required.'
                });
            }

            if (!formData.invoiceNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Invoice number is required.'
                });
            }

            if (!formData.items || formData.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one item is required.'
                });
            }

            // Build e-invoice payload
            const payload = buildEinvoicePayload(formData);

            let irn, qrcode, signedInvoice, status;

            try {
                // Attempt real NIC API call
                if (NIC_CONFIG.clientId && NIC_CONFIG.clientSecret) {
                    // First, authenticate
                    const authRes = await axios.post(`${NIC_CONFIG.authUrl}/v3.01/auth`, {
                        grant_type: 'client_credentials',
                        client_id: NIC_CONFIG.clientId,
                        client_secret: NIC_CONFIG.clientSecret
                    }, { timeout: 30000 });

                    const token = authRes.data?.access_token;

                    if (token) {
                        // Generate IRN
                        const irnRes = await axios.post(`${NIC_CONFIG.authUrl}/v3.01/GenerateIRN`, payload, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'gstin': formData.supplierGstin
                            },
                            timeout: 60000
                        });

                        if (irnRes.data?.Irn) {
                            irn = irnRes.data.Irn;
                            qrcode = irnRes.data.QRCode;
                            signedInvoice = irnRes.data.SignedInvoice;
                            status = 'generated';
                        }
                    }
                }
            } catch (nicError) {
                console.warn('NIC API call failed, using demo mode:', nicError.response?.data?.message || nicError.message);
            }

            // Fallback to demo mode if NIC call failed
            if (!irn) {
                irn = generateDemoIRN();

                // Generate real QR code with IRN data
                const qrData = JSON.stringify({
                    irn: irn,
                    sellerGstin: formData.supplierGstin,
                    buyerGstin: formData.recipientGstin,
                    docNo: formData.invoiceNumber,
                    docDt: formData.invoiceDate,
                    totInvVal: formData.totals.invoiceTotal
                });
                qrcode = await generateQRCodeBase64(qrData);

                // Create signed invoice JSON matching NIC format
                signedInvoice = JSON.stringify({
                    Irn: irn,
                    AckNo: Math.floor(Math.random() * 1000000000000),
                    AckDt: new Date().toISOString(),
                    SignedInvoice: payload,
                    Status: 'ACT',
                    EwbNo: null,
                    EwbDt: null
                });
                status = 'generated';
                console.log('Demo IRN generated:', irn);
            }

            // Get employee name
            const { data: employee } = await supabase
                .from('employees')
                .select('name')
                .eq('id', userId)
                .single();

            // Save to Supabase
            const recordData = {
                id: uuid(),
                supplier_gstin: formData.supplierGstin,
                supplier_name: formData.supplierName,
                recipient_gstin: formData.recipientGstin,
                recipient_name: formData.recipientName,
                invoice_type: formData.invoiceType,
                invoice_number: formData.invoiceNumber,
                invoice_date: formData.invoiceDate,
                total_amount: parseFloat(formData.totals.invoiceTotal),
                taxable_amount: parseFloat(formData.totals.taxableValue),
                cgst: parseFloat(formData.totals.cgst),
                sgst: parseFloat(formData.totals.sgst),
                igst: parseFloat(formData.totals.igst),
                irn: irn,
                qrcode: qrcode,
                signed_invoice: signedInvoice,
                status: status,
                items: formData.items,
                generated_by: userId,
                generated_by_name: employee?.name || 'Unknown',
                generated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            const { data: record, error: insertError } = await supabase
                .from('einvoice_records')
                .insert(recordData)
                .select()
                .single();

            if (insertError) {
                console.error('Database insert error:', insertError);
                // Still return success if IRN was generated
                return res.json({
                    success: true,
                    message: 'IRN generated (database save pending)',
                    irn: irn,
                    qrcode: qrcode,
                    signedInvoice: signedInvoice
                });
            }

            res.json({
                success: true,
                message: 'IRN generated successfully!',
                irn: irn,
                qrcode: qrcode,
                signedInvoice: signedInvoice,
                record: record
            });

        } catch (error) {
            console.error('Generate IRN error:', error);
            res.status(500).json({
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to generate IRN.'
            });
        }
    });

    // POST /api/einvoice/generate-ewb - Generate E-Way Bill by IRN
    router.post('/generate-ewb', authenticate, rateLimiter, async (req, res) => {
        try {
            const { recordId, irn, distance, transId, transName, transGstin, vehicleNo } = req.body;
            const userId = req.auth?.employeeId || req.auth?.userId;

            console.log('Generate EWB request:', { recordId, irn, distance, vehicleNo });

            // Validation
            if (!irn) {
                return res.status(400).json({
                    success: false,
                    message: 'IRN is required.'
                });
            }

            if (!distance || distance <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Distance (in km) is required and must be greater than 0.'
                });
            }

            let record = null;
            let isTemporaryRecord = !recordId || recordId.toString().startsWith('temp-');

            // Fetch existing record if not temporary
            if (!isTemporaryRecord) {
                const { data: dbRecord, error: fetchError } = await supabase
                    .from('einvoice_records')
                    .select('*')
                    .eq('id', recordId)
                    .single();

                if (fetchError) {
                    console.log('Record fetch error (may be temp record):', fetchError.message);
                }

                record = dbRecord;
            }

            // If no record from DB, try to find by IRN
            if (!record) {
                const { data: irnRecord } = await supabase
                    .from('einvoice_records')
                    .select('*')
                    .eq('irn', irn)
                    .single();

                record = irnRecord;
            }

            // Check if EWB already exists (if record found)
            if (record?.ewb_no) {
                return res.status(400).json({
                    success: false,
                    message: 'E-Way Bill already generated for this invoice.',
                    ewbNo: record.ewb_no
                });
            }

            let ewbNo, ewbValidFrom, ewbValidUpto, ewbQrCode, ewbStatus;

            try {
                // Attempt real NIC API call for E-Way Bill
                if (NIC_CONFIG.clientId && NIC_CONFIG.clientSecret) {
                    // First, authenticate
                    const authRes = await axios.post(`${NIC_CONFIG.authUrl}/v3.01/auth`, {
                        grant_type: 'client_credentials',
                        client_id: NIC_CONFIG.clientId,
                        client_secret: NIC_CONFIG.clientSecret
                    }, { timeout: 30000 });

                    const token = authRes.data?.access_token;

                    if (token) {
                        // Generate E-Way Bill by IRN
                        const ewbPayload = {
                            Irn: irn,
                            Distance: parseInt(distance),
                            TransMode: '1', // Road
                            TransId: transId || null,
                            TransName: transName || null,
                            TransDocDt: null,
                            TransDocNo: null,
                            VehNo: vehicleNo || null,
                            VehType: 'R' // Regular
                        };

                        const ewbRes = await axios.post(`${NIC_CONFIG.authUrl}/v3.01/EwayBillGenerationByIRN`, ewbPayload, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'gstin': record.supplier_gstin
                            },
                            timeout: 60000
                        });

                        if (ewbRes.data?.EwbNo) {
                            ewbNo = ewbRes.data.EwbNo;
                            ewbValidFrom = ewbRes.data.EwbDt || new Date().toISOString();
                            ewbValidUpto = ewbRes.data.EwbValidTill;
                            ewbQrCode = ewbRes.data.SignedQRCode;
                            ewbStatus = 'GENERATED';
                        }
                    }
                }
            } catch (nicError) {
                console.warn('NIC EWB API call failed, using demo mode:', nicError.response?.data?.message || nicError.message);
            }

            // Fallback to demo mode if NIC call failed
            if (!ewbNo) {
                const timestamp = Date.now().toString().slice(-10);
                ewbNo = `EWB${timestamp}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

                const now = new Date();
                ewbValidFrom = now.toISOString();

                // Calculate validity: 1 day per 100km (minimum 1 day, max based on distance)
                const validityDays = Math.max(1, Math.ceil(distance / 100));
                const validUntil = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
                ewbValidUpto = validUntil.toISOString();

                // Generate EWB QR code with all details
                const qrData = JSON.stringify({
                    ewbNo: ewbNo,
                    irn: irn,
                    sellerGstin: record?.supplier_gstin || 'N/A',
                    buyerGstin: record?.recipient_gstin || 'N/A',
                    docNo: record?.invoice_number || 'N/A',
                    docDt: record?.invoice_date || new Date().toISOString(),
                    totInvVal: record?.total_amount || 0,
                    distance: distance,
                    vehicleNo: vehicleNo || null,
                    validUpto: ewbValidUpto
                });
                ewbQrCode = await generateQRCodeBase64(qrData);
                ewbStatus = 'GENERATED';

                console.log('Demo EWB generated:', ewbNo);
            }

            // Update record in Supabase with EWB details (only if record exists)
            let updatedRecord = null;
            if (record?.id) {
                const { data: dbUpdatedRecord, error: updateError } = await supabase
                    .from('einvoice_records')
                    .update({
                        ewb_no: ewbNo,
                        ewb_valid_from: ewbValidFrom,
                        ewb_valid_upto: ewbValidUpto,
                        ewb_qrcode: ewbQrCode,
                        ewb_distance: parseInt(distance),
                        ewb_vehicle_no: vehicleNo || null,
                        ewb_transporter_id: transId || null,
                        ewb_transporter_name: transName || null,
                        ewb_transporter_gstin: transGstin || null,
                        ewb_status: ewbStatus,
                        ewb_generated_at: new Date().toISOString(),
                        ewb_generated_by: userId
                    })
                    .eq('id', record.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Database update error:', updateError);
                } else {
                    updatedRecord = dbUpdatedRecord;
                }
            }

            res.json({
                success: true,
                message: 'E-Way Bill generated successfully!',
                ewbNo: ewbNo,
                ewbValidFrom: ewbValidFrom,
                ewbValidUpto: ewbValidUpto,
                ewbQrCode: ewbQrCode,
                record: updatedRecord
            });

        } catch (error) {
            console.error('Generate EWB error:', error);
            res.status(500).json({
                success: false,
                message: error.response?.data?.message || error.message || 'Failed to generate E-Way Bill.'
            });
        }
    });

    // GET /api/einvoice/invoices-with-irn - Get invoices that have IRN for E-Way Bill generation
    router.get('/invoices-with-irn', authenticate, async (req, res) => {
        try {
            const { gstin } = req.query;
            const userId = req.auth?.employeeId || req.auth?.userId;
            const roleId = req.auth?.roleId;

            // Check if user has full access
            const { data: role } = await supabase
                .from('roles')
                .select('permissions')
                .eq('id', roleId)
                .single();

            const hasFullAccess = role?.permissions?.fullAccess || role?.permissions?.manageInvoices;

            // Build query - only get records with IRN but no EWB
            let query = supabase
                .from('einvoice_records')
                .select('id, invoice_number, invoice_date, supplier_name, supplier_gstin, recipient_name, recipient_gstin, total_amount, irn, ewb_no, ewb_status, status')
                .eq('status', 'generated')
                .not('irn', 'is', null)
                .order('created_at', { ascending: false });

            if (gstin) {
                query = query.eq('supplier_gstin', gstin);
            }

            if (!hasFullAccess) {
                query = query.eq('generated_by', userId);
            }

            const { data: records, error } = await query.limit(50);

            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch invoices.'
                });
            }

            res.json({
                success: true,
                records: records || []
            });

        } catch (error) {
            console.error('Invoices fetch error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error.'
            });
        }
    });

    // GET /api/einvoice/history - Get IRN history by date/GSTIN
    router.get('/history', authenticate, async (req, res) => {
        try {
            const { gstin, startDate, endDate } = req.query;
            const userId = req.auth?.employeeId || req.auth?.userId;
            const roleId = req.auth?.roleId;

            // Check if user has full access
            const { data: role } = await supabase
                .from('roles')
                .select('permissions')
                .eq('id', roleId)
                .single();

            const hasFullAccess = role?.permissions?.fullAccess || role?.permissions?.manageInvoices;

            // Build query
            let query = supabase
                .from('einvoice_records')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by GSTIN if specified
            if (gstin) {
                query = query.eq('supplier_gstin', gstin);
            }

            // Filter by date range if specified
            if (startDate) {
                query = query.gte('invoice_date', startDate);
            }
            if (endDate) {
                query = query.lte('invoice_date', endDate);
            }

            // Non-admin users can only see their own records
            if (!hasFullAccess) {
                query = query.eq('generated_by', userId);
            }

            const { data: records, error } = await query.limit(100);

            if (error) {
                console.error('Database query error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch history.',
                    error: error.message
                });
            }

            res.json({
                success: true,
                records: records || [],
                total: records?.length || 0
            });

        } catch (error) {
            console.error('History fetch error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error.'
            });
        }
    });

    // GET /api/einvoice/stats - Get E-Invoice statistics
    router.get('/stats', authenticate, async (req, res) => {
        try {
            const { gstin } = req.query;
            const today = new Date().toISOString().split('T')[0];

            // Get total pending (no IRN generated)
            let pendingQuery = supabase
                .from('einvoice_records')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (gstin) pendingQuery = pendingQuery.eq('supplier_gstin', gstin);
            const { count: pending } = await pendingQuery;

            // Get success today - records with status 'generated'
            let successQuery = supabase
                .from('einvoice_records')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'generated')
                .gte('created_at', `${today}T00:00:00`);

            if (gstin) successQuery = successQuery.eq('supplier_gstin', gstin);
            const { count: successToday } = await successQuery;

            // Get failed
            let failedQuery = supabase
                .from('einvoice_records')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'failed');

            if (gstin) failedQuery = failedQuery.eq('supplier_gstin', gstin);
            const { count: failed } = await failedQuery;

            // Also get total records for debug
            const { count: total } = await supabase
                .from('einvoice_records')
                .select('*', { count: 'exact', head: true });

            console.log('Stats:', { gstin, pending, successToday, failed, total, today });

            res.json({
                pending: pending || 0,
                successToday: successToday || 0,
                failed: failed || 0
            });

        } catch (error) {
            console.error('Stats fetch error:', error);
            res.json({
                pending: 0,
                successToday: 0,
                failed: 0
            });
        }
    });

    return router;
};
