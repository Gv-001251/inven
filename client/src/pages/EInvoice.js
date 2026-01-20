import React, { useState, useEffect, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import {
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineClock,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineRefresh,
    HiOutlineDownload,
    HiOutlinePrinter,
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineQrcode,
    HiOutlineExclamationCircle,
    HiOutlineTruck
} from 'react-icons/hi';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

// Breeze Tech HSN Master - 4-digit codes (GST compliant for <₹5Cr turnover)
const DEFAULT_HSN_CODES = [
    { code: '8414', description: 'Compressor', rate: 18, category: 'Pneumatic Equipment' },
    { code: '8421', description: 'Dryer', rate: 18, category: 'Pneumatic Equipment' },
    { code: '8421', description: 'Filter', rate: 18, category: 'Pneumatic Equipment' },
    { code: '7309', description: 'Air Receiver', rate: 18, category: 'Air Storage' }
];

// Sample businesses/GSTINs
const SAMPLE_BUSINESSES = [
    { id: '1', name: 'Breeze Techniques', gstin: '33AABCT1234A1Z5', state: 'Tamil Nadu', stateCode: '33' },
    { id: '2', name: 'Breeze Pneumatics', gstin: '33AABCP5678B2Z6', state: 'Tamil Nadu', stateCode: '33' }
];

// Indian states for dropdown
const INDIAN_STATES = [
    { code: '01', name: 'Jammu & Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' }
];


const EInvoice = ({ defaultTab = 'sales' }) => {
    const { hasPermission, user } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Stats state
    const [stats, setStats] = useState({
        pending: 0,
        successToday: 0,
        failed: 0
    });

    // Business selection
    const [selectedBusiness, setSelectedBusiness] = useState(SAMPLE_BUSINESSES[0]);

    // Form state
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceType: 'sales',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        recipientGstin: '',
        recipientName: '',
        recipientState: '33',
        recipientPin: '',
        items: [
            { id: 1, product: '', hsn: '8414', qty: 1, rate: 0, gstPercent: 18 }
        ],
        vehicleNumber: '',
        transportDistance: ''
    });

    // History state
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Loading and message states
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [generatedIRN, setGeneratedIRN] = useState(null);

    // E-Way Bill state
    const [ewbInvoices, setEwbInvoices] = useState([]);
    const [ewbLoading, setEwbLoading] = useState(false);
    const [selectedEwbInvoice, setSelectedEwbInvoice] = useState(null);
    const [ewbForm, setEwbForm] = useState({
        distance: '',
        transId: '',
        transName: '',
        transGstin: '',
        vehicleNo: ''
    });
    const [showEwbModal, setShowEwbModal] = useState(false);

    const [showEwbSuccessModal, setShowEwbSuccessModal] = useState(false);
    const [generatedEwb, setGeneratedEwb] = useState(null);
    const [generatingEwb, setGeneratingEwb] = useState(false);

    // Helpers
    const formatINR = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

    const amountInWords = (num) => {
        if (!num) return 'Zero';
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
        return str;
    };

    const getInvoiceTemplate = (data, type = 'preview') => {
        const isDraft = type === 'preview';
        const inv = data;
        const items = inv.items || [];

        // Calculate totals if not provided
        let taxableValue = 0, totalTax = 0, invoiceTotal = 0;
        items.forEach(item => {
            const amt = (item.qty || item.quantity || 0) * (item.rate || 0);
            taxableValue += amt;
            const tax = amt * ((item.gstPercent || 18) / 100);
            totalTax += tax;
        });
        invoiceTotal = taxableValue + totalTax;
        const cgst = totalTax / 2;
        const sgst = totalTax / 2;

        return `
            <div style="font-family: Arial, sans-serif; font-size: 9pt; color: #000; line-height: 1.3; background: white; padding: 10px; width: 100%;">
                <!-- Header Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
                    <tr>
                        <td style="width: 20%; vertical-align: top; font-size: 8pt;">
                            ${!isDraft ? `
                                <div><b>IRN:</b> ${inv.irn || '-'}</div>
                                <div><b>Ack No:</b> ${inv.ackNo || '-'}</div>
                                <div><b>Ack Date:</b> ${inv.ackDate || '-'}</div>
                            ` : '<div style="color: #666;">(IRN Generated Post-Submission)</div>'}
                        </td>
                        <td style="width: 60%; text-align: center; vertical-align: top;">
                            <h2 style="font-size: 14pt; font-weight: bold; margin: 0;">TAX INVOICE</h2>
                        </td>
                        <td style="width: 20%; text-align: right; vertical-align: top;">
                            <div style="font-size: 8pt; font-weight: bold;">e-Invoice</div>
                            ${inv.qrcode ? `<img src="${inv.qrcode}" style="width: 80px; height: 80px; display: block; margin-left: auto;" />` : '<div style="width: 80px; height: 80px; border: 1px dashed #ccc; margin-left: auto;">QR</div>'}
                        </td>
                    </tr>
                </table>

                <!-- Main Details Table -->
                <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
                    <tr>
                        <!-- Left Column -->
                        <td style="width: 50%; border-right: 1px solid #000; vertical-align: top;">
                            <!-- Supplier -->
                            <div style="padding: 5px; border-bottom: 1px solid #000;">
                                <div style="font-weight: bold; font-size: 10pt;">${selectedBusiness?.name || 'Breeze Techniques'}</div>
                                <div style="font-size: 8pt;">
                                    ${selectedBusiness?.address || '113-Makkavi Nagar, Irugur'}<br/>
                                    Ph: ${selectedBusiness?.phone || '8056765859'}<br/>
                                    GSTIN/UIN: <b>${selectedBusiness?.gstin || ''}</b><br/>
                                    State Name: ${selectedBusiness?.state || 'Tamil Nadu'}, Code: 33<br/>
                                    CIN: -
                                </div>
                            </div>
                            
                            <!-- Consignee -->
                            <div style="padding: 5px; border-bottom: 1px solid #000;">
                                <div style="font-size: 8pt; color: #444;">Consignee (Ship to)</div>
                                <div style="font-weight: bold;">${inv.recipientName || 'Buyer Name'}</div>
                                <div style="font-size: 8pt;">
                                    ${inv.recipientAddress || 'Address'}<br/>
                                    GSTIN/UIN: <b>${inv.recipientGstin || ''}</b><br/>
                                    State Name: ${inv.recipientState || 'Tamil Nadu'}, Code: 33
                                </div>
                            </div>

                            <!-- Buyer -->
                            <div style="padding: 5px;">
                                <div style="font-size: 8pt; color: #444;">Buyer (Bill to)</div>
                                <div style="font-weight: bold;">${inv.recipientName || 'Buyer Name'}</div>
                                <div style="font-size: 8pt;">
                                    ${inv.recipientAddress || 'Address'}<br/>
                                    GSTIN/UIN: <b>${inv.recipientGstin || ''}</b><br/>
                                    State Name: ${inv.recipientState || 'Tamil Nadu'}, Code: 33
                                </div>
                            </div>
                        </td>

                        <!-- Right Column -->
                        <td style="width: 50%; vertical-align: top;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000; width: 50%;">
                                        <div style="font-size: 7pt;">Invoice No.</div>
                                        <div style="font-weight: bold;">${inv.invoiceNumber || 'DRAFT'}</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Dated</div>
                                        <div style="font-weight: bold;">${inv.invoiceDate || new Date().toLocaleDateString()}</div>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000;">
                                        <div style="font-size: 7pt;">Delivery Note</div>
                                        <div>-</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Mode/Terms of Payment</div>
                                        <div>Immediate</div>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000;">
                                        <div style="font-size: 7pt;">Reference No. & Date</div>
                                        <div>-</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Other References</div>
                                        <div>-</div>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000;">
                                        <div style="font-size: 7pt;">Buyer's Order No.</div>
                                        <div>-</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Dated</div>
                                        <div>-</div>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000;">
                                        <div style="font-size: 7pt;">Dispatch Doc No.</div>
                                        <div>-</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Delivery Note Date</div>
                                        <div>-</div>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000;">
                                        <div style="font-size: 7pt;">Dispatched through</div>
                                        <div>Road</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Destination</div>
                                        <div>${inv.recipientState || '-'}</div>
                                    </td>
                                </tr>
                                <tr style="border-bottom: 1px solid #000;">
                                    <td style="padding: 5px; border-right: 1px solid #000;">
                                        <div style="font-size: 7pt;">Bill of Lading/LR-RR No.</div>
                                        <div>-</div>
                                    </td>
                                    <td style="padding: 5px;">
                                        <div style="font-size: 7pt;">Motor Vehicle No.</div>
                                        <div style="font-weight: bold;">${inv.vehicleNumber || '-'}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 5px;">
                                        <div style="font-size: 7pt;">Terms of Delivery</div>
                                        <div style="font-size: 8pt;">-</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <!-- Items Table -->
                <table style="width: 100%; border: 1px solid #000; border-top: none; border-collapse: collapse; font-size: 8pt;">
                    <thead>
                        <tr style="border-top: 1px solid #000;">
                            <th style="border-right: 1px solid #000; padding: 5px; width: 30px;">Sl</th>
                            <th style="border-right: 1px solid #000; padding: 5px;">Description of Goods</th>
                            <th style="border-right: 1px solid #000; padding: 5px; width: 60px;">HSN/SAC</th>
                            <th style="border-right: 1px solid #000; padding: 5px; width: 60px;">Quantity</th>
                            <th style="border-right: 1px solid #000; padding: 5px; width: 70px;">Rate</th>
                            <th style="border-right: 1px solid #000; padding: 5px; width: 40px;">Per</th>
                            <th style="padding: 5px; width: 80px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, i) => `
                            <tr style="border-top: 1px solid #000;">
                                <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">${i + 1}</td>
                                <td style="border-right: 1px solid #000; padding: 5px;"><b>${item.product || item.itemName}</b></td>
                                <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">${item.hsn || '8414'}</td>
                                <td style="border-right: 1px solid #000; padding: 5px; text-align: center;"><b>${item.qty || item.quantity}</b></td>
                                <td style="border-right: 1px solid #000; padding: 5px; text-align: right;">${formatINR(item.rate)}</td>
                                <td style="border-right: 1px solid #000; padding: 5px; text-align: center;">Nos</td>
                                <td style="padding: 5px; text-align: right;"><b>${formatINR((item.qty || item.quantity) * item.rate)}</b></td>
                            </tr>
                        `).join('')}
                        <!-- Spacer row -->
                        <tr style="border-top: 1px solid #000; height: 50px;">
                            <td style="border-right: 1px solid #000;"></td>
                            <td style="border-right: 1px solid #000;"></td>
                            <td style="border-right: 1px solid #000;"></td>
                            <td style="border-right: 1px solid #000;"></td>
                            <td style="border-right: 1px solid #000;"></td>
                            <td style="border-right: 1px solid #000;"></td>
                            <td></td>
                        </tr>
                        
                        <!-- Tax rows -->
                        <tr style="border-top: 1px solid #000;">
                            <td colspan="3" style="border-right: 1px solid #000;"></td>
                            <td colspan="3" style="border-right: 1px solid #000; text-align: right; padding: 5px;">
                                <i>Output CGST 9%</i><br/>
                                <i>Output SGST 9%</i>
                            </td>
                            <td style="text-align: right; padding: 5px;">
                                ${formatINR(cgst)}<br/>
                                ${formatINR(sgst)}
                            </td>
                        </tr>
                        <tr style="border-top: 1px solid #000; font-weight: bold;">
                            <td colspan="6" style="border-right: 1px solid #000; text-align: right; padding: 5px;">Total</td>
                            <td style="text-align: right; padding: 5px;">₹ ${formatINR(invoiceTotal)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Footer -->
                <table style="width: 100%; border: 1px solid #000; border-top: none; border-collapse: collapse;">
                    <tr>
                        <td style="width: 50%; border-right: 1px solid #000; padding: 5px; font-size: 8pt; vertical-align: top;">
                            <div>Amount Chargeable (in words)</div>
                            <div style="font-weight: bold; margin-bottom: 10px;">INR ${amountInWords(Math.round(invoiceTotal))} Only</div>
                            
                            <div style="margin-top: 10px;">
                                <b>Company's Bank Details</b><br/>
                                Bank Name: KARUR VYSYA BANK<br/>
                                A/c No: 1620223000000404<br/>
                                Branch & IFS Code : R.N PURAM, CBE & KVBL0001620
                            </div>
                        </td>
                        <td style="width: 50%; padding: 5px; font-size: 8pt; vertical-align: top;">
                            <div style="text-align: right; font-weight: bold;">for Breeze Techniques</div>
                            <div style="height: 40px;"></div>
                            <div style="text-align: right; border-top: 1px solid #ccc; padding-top: 2px; margin-top: 10px;">Authorised Signatory</div>
                        </td>
                    </tr>
                </table>
                
                <div style="text-align: center; font-size: 7pt; margin-top: 5px;">This is a Computer Generated Invoice</div>
            </div>
        `;
    };

    // Load history on mount
    useEffect(() => {
        loadHistory();
        loadStats();
    }, [selectedBusiness]);

    // Load shared invoice data from Invoice page (localStorage)
    useEffect(() => {
        const sharedData = localStorage.getItem('sharedInvoiceData');
        if (sharedData) {
            try {
                const data = JSON.parse(sharedData);
                // Extract PIN from address if available (last 6 digits)
                const pinMatch = data.customerAddress?.match(/(\d{6})/);
                const pin = pinMatch ? pinMatch[1] : '';

                // Extract state code from GSTIN (first 2 characters)
                const stateCode = data.customerGST?.substring(0, 2) || '33';

                setInvoiceForm(prev => ({
                    ...prev,
                    invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
                    recipientGstin: data.customerGST || '',
                    recipientName: data.customerName || '',
                    recipientState: stateCode,
                    recipientPin: pin,
                    items: data.items?.length > 0 ? data.items.map((item, idx) => ({
                        id: idx + 1,
                        product: item.product || '',
                        hsn: item.hsn || '8414',
                        qty: item.qty || 1,
                        rate: item.rate || 0,
                        gstPercent: item.gstPercent || 18
                    })) : prev.items,
                    vehicleNumber: data.vehicleNumber || '',
                    transportDistance: data.transportDistance || ''
                }));
            } catch (e) {
                console.error('Error parsing shared invoice data:', e);
            }
        }
    }, []);

    // Load E-Way Bill invoices when tab changes
    useEffect(() => {
        if (activeTab === 'eway') {
            loadEwbInvoices();
        }
    }, [activeTab, selectedBusiness]);

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            const gstin = selectedBusiness?.gstin || '';
            const { data } = await api.get('/einvoice/history', {
                params: { gstin }
            });
            setHistory(data?.records || []);
        } catch (error) {
            console.error('Failed to load IRN history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const gstin = selectedBusiness?.gstin || '';
            const { data } = await api.get('/einvoice/stats', {
                params: { gstin }
            });
            setStats(data || { pending: 0, successToday: 0, failed: 0 });
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    // Load invoices with IRN for E-Way Bill generation
    const loadEwbInvoices = async () => {
        try {
            setEwbLoading(true);
            const gstin = selectedBusiness?.gstin || '';
            const { data } = await api.get('/einvoice/invoices-with-irn', {
                params: { gstin }
            });
            setEwbInvoices(data?.records || []);
        } catch (error) {
            console.error('Failed to load EWB invoices:', error);
        } finally {
            setEwbLoading(false);
        }
    };

    // Handle E-Way Bill form change
    const handleEwbFormChange = (e) => {
        const { name, value } = e.target;
        setEwbForm(prev => ({ ...prev, [name]: value }));
    };

    // Generate E-Way Bill
    const handleGenerateEwb = async (e) => {
        e?.preventDefault();
        setMessage(null);

        if (!selectedEwbInvoice) {
            setMessage({ type: 'error', text: 'Please select an invoice first.' });
            return;
        }

        if (!ewbForm.distance || parseInt(ewbForm.distance) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid distance (in km).' });
            return;
        }

        setGeneratingEwb(true);

        try {
            const payload = {
                recordId: selectedEwbInvoice.id,
                irn: selectedEwbInvoice.irn,
                distance: parseInt(ewbForm.distance),
                transId: ewbForm.transId || null,
                transName: ewbForm.transName || null,
                transGstin: ewbForm.transGstin || null,
                vehicleNo: ewbForm.vehicleNo || null
            };

            const { data } = await api.post('/einvoice/generate-ewb', payload);

            if (data.success) {
                setGeneratedEwb({
                    ...data,
                    invoice: selectedEwbInvoice,
                    distance: ewbForm.distance,
                    vehicleNo: ewbForm.vehicleNo,
                    transName: ewbForm.transName,
                    transGstin: ewbForm.transGstin
                });
                setShowEwbSuccessModal(true);
                setShowEwbModal(false);
                setMessage({ type: 'success', text: 'E-Way Bill generated successfully!' });

                // Refresh all data
                loadEwbInvoices();
                loadHistory();
                loadStats();

                // Reset form
                setEwbForm({
                    distance: '',
                    transId: '',
                    transName: '',
                    transGstin: '',
                    vehicleNo: ''
                });
                setSelectedEwbInvoice(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to generate E-Way Bill.' });
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || 'Failed to generate E-Way Bill.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setGeneratingEwb(false);
        }
    };

    // Open EWB modal from IRN success modal
    const openEwbFromIrn = () => {
        console.log('openEwbFromIrn called', generatedIRN);

        // Use record if available, otherwise use invoiceData
        const record = generatedIRN?.record;
        const invoiceData = generatedIRN?.invoiceData;

        if (generatedIRN?.irn) {
            const ewbInvoice = {
                id: record?.id || `temp-${Date.now()}`,
                irn: generatedIRN.irn,
                invoice_number: record?.invoice_number || invoiceData?.invoiceNumber,
                supplier_name: record?.supplier_name || invoiceData?.supplierName || selectedBusiness?.name,
                supplier_gstin: record?.supplier_gstin || invoiceData?.supplierGstin || selectedBusiness?.gstin,
                recipient_name: record?.recipient_name || invoiceData?.recipientName,
                recipient_gstin: record?.recipient_gstin || invoiceData?.recipientGstin,
                total_amount: record?.total_amount || invoiceData?.totals?.invoiceTotal || 0
            };

            console.log('Setting EWB invoice:', ewbInvoice);
            setSelectedEwbInvoice(ewbInvoice);
            setShowSuccessModal(false);
            setActiveTab('eway'); // Switch to E-Way Bill tab
            setMessage({ type: 'info', text: 'Enter distance and generate E-Way Bill for this invoice.' });

            // Try to load cached transportation details
            try {
                const cachedMeta = JSON.parse(localStorage.getItem(`ewb_meta_${ewbInvoice.invoice_number}`) || '{}');
                if (cachedMeta.vehicleNo || cachedMeta.distance) {
                    setEwbForm(prev => ({
                        ...prev,
                        distance: cachedMeta.distance || '',
                        vehicleNo: cachedMeta.vehicleNo || ''
                    }));
                }
            } catch (e) {
                console.error('Error loading cached transport details:', e);
            }
        } else {
            setMessage({ type: 'error', text: 'IRN data not available. Please try from E-Way Bill tab.' });
        }
    };

    // Calculate totals
    const totals = useMemo(() => {
        const taxableValue = invoiceForm.items.reduce((sum, item) => {
            return sum + (item.qty * item.rate);
        }, 0);

        const supplierStateCode = selectedBusiness.stateCode;
        const recipientStateCode = invoiceForm.recipientState;
        const isInterState = supplierStateCode !== recipientStateCode;

        let cgst = 0, sgst = 0, igst = 0;

        invoiceForm.items.forEach(item => {
            const lineTotal = item.qty * item.rate;
            const gstAmount = (lineTotal * item.gstPercent) / 100;

            if (isInterState) {
                igst += gstAmount;
            } else {
                cgst += gstAmount / 2;
                sgst += gstAmount / 2;
            }
        });

        return {
            taxableValue: taxableValue.toFixed(2),
            cgst: cgst.toFixed(2),
            sgst: sgst.toFixed(2),
            igst: igst.toFixed(2),
            invoiceTotal: (taxableValue + cgst + sgst + igst).toFixed(2),
            isInterState
        };
    }, [invoiceForm.items, invoiceForm.recipientState, selectedBusiness]);

    // Handle form changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setInvoiceForm(prev => ({ ...prev, [name]: value }));
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
        setInvoiceForm(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    // Add new item row
    const addItemRow = () => {
        setInvoiceForm(prev => ({
            ...prev,
            items: [
                ...prev.items,
                { id: Date.now(), product: '', hsn: '8414', qty: 1, rate: 0, gstPercent: 18 }
            ]
        }));
    };

    // Remove item row
    const removeItemRow = (index) => {
        if (invoiceForm.items.length === 1) return;
        setInvoiceForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Generate IRN
    const handleGenerateIRN = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!invoiceForm.recipientGstin || invoiceForm.recipientGstin.length !== 15) {
            setMessage({ type: 'error', text: 'Please enter a valid 15-character GSTIN.' });
            return;
        }

        if (!invoiceForm.invoiceNumber) {
            setMessage({ type: 'error', text: 'Invoice number is required.' });
            return;
        }

        const hasValidItems = invoiceForm.items.every(item =>
            item.product && item.hsn && item.qty > 0 && item.rate > 0
        );
        if (!hasValidItems) {
            setMessage({ type: 'error', text: 'Please fill all item details (Product, HSN, Qty, Rate).' });
            return;
        }

        setGenerating(true);

        try {
            const payload = {
                supplierGstin: selectedBusiness.gstin,
                supplierName: selectedBusiness.name,
                supplierState: selectedBusiness.stateCode,
                invoiceType: invoiceForm.invoiceType,
                invoiceNumber: invoiceForm.invoiceNumber,
                invoiceDate: invoiceForm.invoiceDate,
                recipientGstin: invoiceForm.recipientGstin,
                recipientName: invoiceForm.recipientName,
                recipientState: invoiceForm.recipientState,
                recipientPin: invoiceForm.recipientPin,
                items: invoiceForm.items,
                totals: totals
            };

            const { data } = await api.post('/einvoice/generate-irn', payload);

            if (data.success) {
                // Store complete invoice data for printing
                setGeneratedIRN({
                    ...data,
                    invoiceData: payload // Store the full invoice for print
                });
                setShowSuccessModal(true);
                setMessage({ type: 'success', text: 'IRN generated successfully!' });

                // Cache transportation details for E-Way Bill
                try {
                    localStorage.setItem(`ewb_meta_${payload.invoiceNumber}`, JSON.stringify({
                        vehicleNo: invoiceForm.vehicleNumber,
                        distance: invoiceForm.transportDistance
                    }));
                } catch (e) { console.error('Error caching transport details', e); }

                // Refresh all data
                loadHistory();
                loadStats();
                loadEwbInvoices();

                // Reset form
                setInvoiceForm(prev => ({
                    ...prev,
                    invoiceNumber: '',
                    recipientGstin: '',
                    recipientName: '',
                    recipientPin: '',
                    items: [{ id: 1, product: '', hsn: '8414', qty: 1, rate: 0, gstPercent: 18 }]
                }));
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to generate IRN.' });
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || 'Failed to generate IRN. Please try again.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setGenerating(false);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Filter history
    const filteredHistory = history.filter(record =>
        record.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.irn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reusable E-Way Bill Template Function
    const getEwayBillTemplate = (ewbData, invoiceData) => {
        const ewb = ewbData || {};
        const invoice = invoiceData || {};
        // Use items from ewb, invoice, or fallback to invoiceForm if matching
        const items = ewb.items || invoice.items || (invoiceForm.invoiceNumber === invoice.invoice_number ? invoiceForm.items : []) || [];

        const formatDate = (d) => {
            if (!d) return '-';
            const date = new Date(d);
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        return `
            <div style="font-family: Arial, sans-serif; max-width: 210mm; background: white; color: #000; font-size: 10px; padding: 10px;">
                <!-- Header -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border-bottom: 2px solid #000;">
                    <tr>
                        <td style="color: #000; font-size: 24px; font-weight: bold; padding: 10px;">E-Way Bill</td>
                        <td style="text-align: right; padding: 10px;">
                            ${ewb.ewbQrCode ? `<img src="${ewb.ewbQrCode}" style="width: 80px; height: 80px;" />` : ''}
                            <div style="font-size: 8px;">Add Your Qr Here</div>
                        </td>
                    </tr>
                </table>

                <!-- 1. E-WAY BILL Details -->
                <div style="background: #f0f0f0; color: #000; padding: 4px 8px; font-weight: bold; border: 1px solid #ccc; border-bottom: none;">1. E-WAY BILL Details</div>
                <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; margin-bottom: 15px;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 5px; border-right: 1px solid #eee; width: 33.3%;">eWay Bill No: <b>${ewb.ewbNo || '-'}</b></td>
                        <td style="padding: 5px; border-right: 1px solid #eee; width: 33.3%;">
                            Generated Date: <b>${formatDate(ewb.ewbDate) || new Date().toLocaleDateString()}</b>
                            <div style="font-size: 9px;">${new Date().toLocaleTimeString()}</div>
                        </td>
                        <td style="padding: 5px; width: 33.3%;">
                            Generated By: <b>${selectedBusiness?.gstin || '-'}</b>
                            <div>Valid Upto: <b>${formatDate(ewb.ewbValidUpto)}</b></div>
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 5px; border-right: 1px solid #eee;">Mode: <b>Road</b></td>
                        <td style="padding: 5px; border-right: 1px solid #eee;">Approx Distance: <b>${ewb.distance || '-'}km</b></td>
                        <td style="padding: 5px;">Transaction type: <b>Regular</b></td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-right: 1px solid #eee;">Type: <b>Outward-Supply</b></td>
                        <td colspan="2" style="padding: 5px;">
                            Document Details: <b>Tax-Invoice-${invoice.invoice_number}</b>
                            <div>${formatDate(invoice.invoice_date)}</div>
                        </td>
                    </tr>
                </table>

                <!-- 2. Address Details -->
                <div style="background: #f0f0f0; color: #000; padding: 4px 8px; font-weight: bold; border: 1px solid #ccc; border-bottom: none;">2. Address Details</div>
                <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="border-right: 1px solid #ccc; width: 50%; vertical-align: top;">
                            <div style="background: #f8f8f8; padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">From</div>
                            <div style="padding: 8px;">
                                <div style="margin-bottom: 3px;">GSTIN: <b>${invoice.supplier_gstin || selectedBusiness?.gstin}</b></div>
                                <div style="margin-bottom: 3px;">${invoice.supplier_name || selectedBusiness?.name}</div>
                                <div style="margin-bottom: 8px;">${invoice.supplier_state || selectedBusiness?.state}</div>
                                <div style="color: #444; font-size: 9px; margin-bottom: 2px;">::Dispatch From::</div>
                                <div>${invoice.supplier_address || ''}</div>
                            </div>
                        </td>
                        <td style="width: 50%; vertical-align: top;">
                            <div style="background: #f8f8f8; padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #eee;">To</div>
                            <div style="padding: 8px;">
                                <div style="margin-bottom: 3px;">GSTIN: <b>${invoice.recipient_gstin || '-'}</b></div>
                                <div style="margin-bottom: 3px;">${invoice.recipient_name || '-'}</div>
                                <div style="margin-bottom: 8px;">${invoice.recipient_state || '-'}</div>
                                <div style="color: #444; font-size: 9px; margin-bottom: 2px;">::Ship To::</div>
                                <div>${invoice.recipient_address || ''}</div>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- 3. Goods Details -->
                <div style="background: #f0f0f0; color: #000; padding: 4px 8px; font-weight: bold; border: 1px solid #ccc; border-bottom: none;">3. Goods Details</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #ccc; margin-bottom: 15px;">
                    <tr style="background: #f8f8f8;">
                        <th style="border: 1px solid #ccc; padding: 6px;">HSN Code</th>
                        <th style="border: 1px solid #ccc; padding: 6px;">Product Name & Desc</th>
                        <th style="border: 1px solid #ccc; padding: 6px;">Quantity</th>
                        <th style="border: 1px solid #ccc; padding: 6px;">Taxable Amount Rs.</th>
                        <th style="border: 1px solid #ccc; padding: 6px;">Tax Rate</th>
                    </tr>
                    ${items.map(item => `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 6px;">${item.hsn || '-'}</td>
                        <td style="border: 1px solid #ccc; padding: 6px;">${item.product || item.itemName || 'Item'}</td>
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${item.qty || 0}</td>
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: right;">${((item.rate || 0) * (item.qty || 0)).toFixed(2)}</td>
                        <td style="border: 1px solid #ccc; padding: 6px; text-align: center;">${item.gstPercent || 18}%</td>
                    </tr>
                    `).join('')}
                </table>

                <!-- 4. Transportation Details -->
                <div style="background: #f0f0f0; color: #000; padding: 4px 8px; font-weight: bold; border: 1px solid #ccc; border-bottom: none;">4. Transportation Details</div>
                <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 8px;">Transport ID & Name: <b>${ewb.transId || '-'} & ${ewb.transName || '-'}</b></td>
                        <td style="padding: 8px; text-align: right;">Transport Doc. No. & Date: <b>${formatDate(new Date())}</b></td>
                    </tr>
                </table>

                <!-- 5. Vehicle Details -->
                <div style="background: #f0f0f0; color: #000; padding: 4px 8px; font-weight: bold; border: 1px solid #ccc; border-bottom: none;">5. Vehicle Details</div>
                <table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse; margin-bottom: 10px; font-size: 8px;">
                    <tr style="background: #f8f8f8; font-weight: bold; border-bottom: 1px solid #aaa;">
                        <th style="border-right: 1px solid #ccc; padding: 6px 2px; width: 10%;">Mode</th>
                        <th style="border-right: 1px solid #ccc; padding: 6px 2px; width: 25%;">Vehicle No.</th>
                        <th style="border-right: 1px solid #ccc; padding: 6px 2px; width: 15%;">From</th>
                        <th style="border-right: 1px solid #ccc; padding: 6px 2px; width: 15%;">Entered Date</th>
                        <th style="border-right: 1px solid #ccc; padding: 6px 2px; width: 15%;">Entered By</th>
                        <th style="border-right: 1px solid #ccc; padding: 6px 2px; width: 10%;">CEWB No.</th>
                        <th style="padding: 6px 2px; width: 10%;">Multi Veh.</th>
                    </tr>
                    <tr style="text-align: center;">
                        <td style="border-right: 1px solid #ccc; padding: 6px 2px;">Road</td>
                        <td style="border-right: 1px solid #ccc; padding: 6px 2px;">${ewb.vehicleNo || '-'}</td>
                        <td style="border-right: 1px solid #ccc; padding: 6px 2px;">${invoice.supplier_state || '-'}</td>
                        <td style="border-right: 1px solid #ccc; padding: 6px 2px;">${formatDate(new Date())}</td>
                        <td style="border-right: 1px solid #ccc; padding: 6px 2px;">${selectedBusiness?.gstin || '-'}</td>
                        <td style="border-right: 1px solid #ccc; padding: 6px 2px;">-</td>
                        <td style="padding: 6px 2px;">-</td>
                    </tr>
                </table>

                <div style="text-align: center; margin-top: 10px;">
                    <div style="font-size: 8px;">No : ${ewb.ewbNo || '-'}</div>
                </div>
            </div>
        `;
    };

    return (
        <div className="min-h-screen bg-mint p-8">
            {/* Hidden E-Way Bill Preview for Bulk Download */}
            <div
                id="eway-preview"
                style={{ display: 'none' }}
                dangerouslySetInnerHTML={{
                    __html: getEwayBillTemplate(
                        generatedEwb || ((selectedEwbInvoice && selectedEwbInvoice.ewb_no) ? { ...selectedEwbInvoice, ewbNo: selectedEwbInvoice.ewb_no, ewbDate: selectedEwbInvoice.ewb_date, ewbValidUpto: selectedEwbInvoice.ewb_valid_upto, distance: selectedEwbInvoice.distance, vehicleNo: selectedEwbInvoice.vehicle_no } : null),
                        generatedEwb?.invoice || selectedEwbInvoice || invoiceForm
                    )
                }}
            />
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">E-Invoice Generation</h1>
                    <p className="text-primary/60 text-sm mt-1">Generate IRN directly like Tally Prime</p>
                </div>

                {/* Business Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-primary/80">Business:</label>
                    <select
                        value={selectedBusiness.id}
                        onChange={(e) => setSelectedBusiness(SAMPLE_BUSINESSES.find(b => b.id === e.target.value))}
                        className="bg-white border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary focus:outline-none focus:border-primary shadow-sm"
                    >
                        {SAMPLE_BUSINESSES.map(business => (
                            <option key={business.id} value={business.id}>
                                {business.name} ({business.gstin})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Alert Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in ${message.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <HiOutlineCheckCircle className="text-xl flex-shrink-0" />
                    ) : (
                        <HiOutlineXCircle className="text-xl flex-shrink-0" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Pending IRN */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Pending IRN</p>
                            <p className="text-3xl font-bold text-amber-700 mt-2">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <HiOutlineClock className="text-2xl text-amber-600" />
                        </div>
                    </div>
                </div>

                {/* Success Today */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-600 font-medium">Success Today</p>
                            <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.successToday}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <HiOutlineCheckCircle className="text-2xl text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Failed */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Failed</p>
                            <p className="text-3xl font-bold text-red-700 mt-2">{stats.failed}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <HiOutlineXCircle className="text-2xl text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs - 3 Tab Layout */}
            <div className="bg-white rounded-t-2xl border-b border-gray-200">
                <div className="flex overflow-x-auto">
                    {[
                        { id: 'sales', label: 'Generate IRN', icon: HiOutlineDocumentText },
                        { id: 'eway', label: 'E-Way Bill', icon: HiOutlineTruck },
                        { id: 'history', label: 'History', icon: HiOutlineClock }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors relative flex items-center gap-2
                                ${activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-gray-500 hover:text-primary'
                                }`}
                        >
                            <tab.icon className="text-lg" />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-2xl shadow-lg p-6">
                {/* Generate IRN Tab */}
                {activeTab === 'sales' && (
                    <form onSubmit={handleGenerateIRN}>
                        {/* Invoice Type Toggle */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-primary mb-2">Invoice Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="invoiceType"
                                        value="sales"
                                        checked={invoiceForm.invoiceType === 'sales'}
                                        onChange={handleFormChange}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-sm text-primary">Sales Invoice</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="invoiceType"
                                        value="purchase"
                                        checked={invoiceForm.invoiceType === 'purchase'}
                                        onChange={handleFormChange}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <span className="text-sm text-primary">Purchase Invoice</span>
                                </label>
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Invoice Number *</label>
                                <input
                                    type="text"
                                    name="invoiceNumber"
                                    value={invoiceForm.invoiceNumber}
                                    onChange={handleFormChange}
                                    placeholder="INV-2026-001"
                                    required
                                    className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Invoice Date *</label>
                                <input
                                    type="date"
                                    name="invoiceDate"
                                    value={invoiceForm.invoiceDate}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">Supplier GSTIN</label>
                                <input
                                    type="text"
                                    value={selectedBusiness.gstin}
                                    disabled
                                    className="w-full border border-primary/10 rounded-lg px-4 py-3 text-primary/60 bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Recipient Details */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Recipient Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">GSTIN *</label>
                                    <input
                                        type="text"
                                        name="recipientGstin"
                                        value={invoiceForm.recipientGstin}
                                        onChange={handleFormChange}
                                        placeholder="33AABCU1234A1Z5"
                                        maxLength={15}
                                        required
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">Legal Name</label>
                                    <input
                                        type="text"
                                        name="recipientName"
                                        value={invoiceForm.recipientName}
                                        onChange={handleFormChange}
                                        placeholder="Recipient Company Name"
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">State</label>
                                    <select
                                        name="recipientState"
                                        value={invoiceForm.recipientState}
                                        onChange={handleFormChange}
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary focus:outline-none focus:border-primary"
                                    >
                                        {INDIAN_STATES.map(state => (
                                            <option key={state.code} value={state.code}>
                                                {state.code} - {state.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">PIN Code</label>
                                    <input
                                        type="text"
                                        name="recipientPin"
                                        value={invoiceForm.recipientPin}
                                        onChange={handleFormChange}
                                        placeholder="600001"
                                        maxLength={6}
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Transportation Details (Optional for IRN, Required for EWB) */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Transportation Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">Vehicle Number</label>
                                    <input
                                        type="text"
                                        name="vehicleNumber"
                                        value={invoiceForm.vehicleNumber || ''}
                                        onChange={handleFormChange}
                                        placeholder="e.g. TN38AB1234"
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">Approx Distance (km)</label>
                                    <input
                                        type="number"
                                        name="transportDistance"
                                        value={invoiceForm.transportDistance || ''}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 150"
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-primary">Invoice Items</h3>
                                <button
                                    type="button"
                                    onClick={addItemRow}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                                >
                                    <HiOutlinePlus className="text-lg" />
                                    Add Item
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-primary text-white text-sm">
                                            <th className="p-3 text-left rounded-tl-lg">Product/Service</th>
                                            <th className="p-3 text-left">HSN Code</th>
                                            <th className="p-3 text-center w-24">Qty</th>
                                            <th className="p-3 text-right w-32">Rate (₹)</th>
                                            <th className="p-3 text-center w-24">GST %</th>
                                            <th className="p-3 text-right w-32">Amount</th>
                                            <th className="p-3 text-center w-16 rounded-tr-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceForm.items.map((item, index) => (
                                            <tr key={item.id} className="border-b border-gray-100">
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={item.product}
                                                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                                                        placeholder="Pneumatic Valve"
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        value={item.hsn}
                                                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                                    >
                                                        {DEFAULT_HSN_CODES.map(hsn => (
                                                            <option key={hsn.code} value={hsn.code}>
                                                                {hsn.code} - {hsn.description}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={item.qty}
                                                        onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                                                        min="1"
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-primary"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:border-primary"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        value={item.gstPercent}
                                                        onChange={(e) => handleItemChange(index, 'gstPercent', parseInt(e.target.value))}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-primary"
                                                    >
                                                        <option value={0}>0%</option>
                                                        <option value={5}>5%</option>
                                                        <option value={12}>12%</option>
                                                        <option value={18}>18%</option>
                                                        <option value={28}>28%</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-right font-medium text-primary">
                                                    {formatCurrency(item.qty * item.rate)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItemRow(index)}
                                                        disabled={invoiceForm.items.length === 1}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <HiOutlineTrash className="text-lg" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full md:w-80 bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-primary/70">Taxable Value:</span>
                                    <span className="font-medium text-primary">{formatCurrency(totals.taxableValue)}</span>
                                </div>
                                {totals.isInterState ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary/70">IGST:</span>
                                        <span className="font-medium text-primary">{formatCurrency(totals.igst)}</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-primary/70">CGST:</span>
                                            <span className="font-medium text-primary">{formatCurrency(totals.cgst)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-primary/70">SGST:</span>
                                            <span className="font-medium text-primary">{formatCurrency(totals.sgst)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="border-t border-gray-200 pt-3 flex justify-between">
                                    <span className="font-bold text-primary">Invoice Total:</span>
                                    <span className="font-bold text-xl text-primary">{formatCurrency(totals.invoiceTotal)}</span>
                                </div>
                            </div>
                        </div>



                        {/* Generate Button */}
                        <div className="flex justify-end mb-6">
                            <button
                                type="submit"
                                disabled={generating}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Generating IRN...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineQrcode className="text-xl" />
                                        Generate IRN
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Live Invoice Preview */}
                        <div className="mt-8 border-t border-gray-200 pt-8 animate-fade-in">
                            <div className="bg-gray-100 p-4 rounded-xl overflow-x-auto shadow-inner">
                                <div id="einvoice-preview" dangerouslySetInnerHTML={{ __html: getInvoiceTemplate(invoiceForm, 'preview') }} />
                            </div>
                        </div>
                    </form>
                )}

                {/* E-Way Bill Tab Content */}
                {activeTab === 'eway' && (
                    <div>
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-primary mb-2">Generate E-Way Bill</h3>
                            <p className="text-sm text-primary/60">Select an invoice with IRN to generate E-Way Bill</p>
                        </div>

                        {/* Invoice Selection */}
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                            <h4 className="text-sm font-medium text-primary mb-4">Select Invoice</h4>
                            {ewbLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    <span className="ml-2 text-primary/60">Loading invoices...</span>
                                </div>
                            ) : ewbInvoices.length === 0 ? (
                                <div className="text-center py-8 text-primary/60">
                                    <HiOutlineDocumentText className="text-4xl mx-auto mb-2" />
                                    <p>No invoices with IRN available for E-Way Bill generation.</p>
                                    <p className="text-sm mt-1">Generate an IRN first from Sales/Purchase tab.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {ewbInvoices.map(inv => (
                                        <div
                                            key={inv.id}
                                            onClick={() => {
                                                setSelectedEwbInvoice(inv);
                                                // Try to load cached transportation details
                                                try {
                                                    const cachedMeta = JSON.parse(localStorage.getItem(`ewb_meta_${inv.invoice_number}`) || '{}');
                                                    if (cachedMeta.vehicleNo || cachedMeta.distance) {
                                                        setEwbForm(prev => ({
                                                            ...prev,
                                                            distance: cachedMeta.distance || '',
                                                            vehicleNo: cachedMeta.vehicleNo || ''
                                                        }));
                                                    }
                                                } catch (e) { console.error('Error loading config', e); }
                                            }}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedEwbInvoice?.id === inv.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-primary">{inv.invoice_number}</p>
                                                    <p className="text-sm text-primary/60">{inv.recipient_name || inv.recipient_gstin}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-primary">{formatCurrency(inv.total_amount)}</p>
                                                    {inv.ewb_no ? (
                                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">EWB: {inv.ewb_no}</span>
                                                    ) : (
                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Pending EWB</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-primary/40 mt-2 font-mono truncate">IRN: {inv.irn}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* E-Way Bill Form */}
                        {selectedEwbInvoice && !selectedEwbInvoice.ewb_no && (
                            <form onSubmit={handleGenerateEwb} className="bg-blue-50 rounded-xl p-6">
                                <h4 className="text-sm font-medium text-primary mb-4">E-Way Bill Details</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Distance (km) *</label>
                                        <input
                                            type="number"
                                            name="distance"
                                            value={ewbForm.distance}
                                            onChange={handleEwbFormChange}
                                            placeholder="e.g., 250"
                                            min="1"
                                            required
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Vehicle Number</label>
                                        <input
                                            type="text"
                                            name="vehicleNo"
                                            value={ewbForm.vehicleNo}
                                            onChange={handleEwbFormChange}
                                            placeholder="e.g., TN38AB1234"
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Transporter Name</label>
                                        <input
                                            type="text"
                                            name="transName"
                                            value={ewbForm.transName}
                                            onChange={handleEwbFormChange}
                                            placeholder="e.g., ABC Logistics"
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Transporter GSTIN</label>
                                        <input
                                            type="text"
                                            name="transGstin"
                                            value={ewbForm.transGstin}
                                            onChange={handleEwbFormChange}
                                            placeholder="e.g., 33AAABC1234C1ZB"
                                            maxLength={15}
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Transporter ID</label>
                                        <input
                                            type="text"
                                            name="transId"
                                            value={ewbForm.transId}
                                            onChange={handleEwbFormChange}
                                            placeholder="e.g., TRN123"
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={generatingEwb}
                                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {generatingEwb ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Generating EWB...
                                            </>
                                        ) : (
                                            <>
                                                <HiOutlineTruck className="text-xl" />
                                                Generate E-Way Bill
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Selected invoice already has EWB */}
                        {selectedEwbInvoice && selectedEwbInvoice.ewb_no && (
                            <div className="bg-emerald-50 rounded-xl p-6 text-center">
                                <HiOutlineCheckCircle className="text-4xl text-emerald-600 mx-auto mb-2" />
                                <p className="text-emerald-700 font-medium">E-Way Bill already generated for this invoice</p>
                                <p className="text-emerald-600 font-mono mt-2">EWB No: {selectedEwbInvoice.ewb_no}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div>
                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="relative w-full sm:w-64">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search IRN, Invoice..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:border-primary"
                                />
                            </div>
                            <button
                                onClick={loadHistory}
                                className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            >
                                <HiOutlineRefresh className={`text-lg ${historyLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {/* History Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-primary text-white text-sm">
                                        <th className="p-3 text-left rounded-tl-lg">Invoice No</th>
                                        <th className="p-3 text-left">Date</th>
                                        <th className="p-3 text-left">Recipient</th>
                                        <th className="p-3 text-right">Amount</th>
                                        <th className="p-3 text-left">IRN</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center rounded-tr-lg">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyLoading ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                                    Loading history...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                No IRN records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map((record, idx) => (
                                            <tr key={record.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <td className="p-3 font-medium text-primary">{record.invoice_number}</td>
                                                <td className="p-3 text-gray-600">{formatDate(record.invoice_date)}</td>
                                                <td className="p-3 text-gray-600">{record.recipient_name || record.recipient_gstin}</td>
                                                <td className="p-3 text-right font-medium text-primary">{formatCurrency(record.total_amount)}</td>
                                                <td className="p-3">
                                                    {record.irn ? (
                                                        <span className="text-xs font-mono text-gray-500 max-w-[200px] truncate block" title={record.irn}>
                                                            {record.irn.substring(0, 20)}...
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${record.status === 'generated'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : record.status === 'failed'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="View QR Code"
                                                        >
                                                            <HiOutlineQrcode className="text-lg" />
                                                        </button>
                                                        <button
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Print"
                                                        >
                                                            <HiOutlinePrinter className="text-lg" />
                                                        </button>
                                                        <button
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Download JSON"
                                                        >
                                                            <HiOutlineDownload className="text-lg" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Record Count */}
                        <div className="mt-4 text-sm text-primary/60">
                            Showing {filteredHistory.length} of {history.length} records
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal with QR Code - TALLY PRIME STYLE */}
            {
                showSuccessModal && generatedIRN && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in">
                            <div className="text-center space-y-4">
                                {/* Success Header */}
                                <div className="flex items-center justify-center gap-3 text-emerald-600">
                                    <HiOutlineCheckCircle className="text-4xl" />
                                    <h2 className="text-2xl font-bold">IRN Generated Successfully!</h2>
                                </div>

                                {/* IRN Display - Tally Prime Style */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                                    <p className="text-sm text-gray-600 mb-2">IRN Number</p>
                                    <p className="text-xl font-mono font-bold text-blue-900 tracking-wider break-all">
                                        {generatedIRN.irn}
                                    </p>
                                </div>

                                {/* QR Code Display */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-800">Verification QR Code</h3>
                                    {generatedIRN.qrcode ? (
                                        <div className="bg-white p-3 rounded-xl border-4 border-emerald-200 inline-block shadow-lg">
                                            <img
                                                src={generatedIRN.qrcode}
                                                alt="IRN QR Code"
                                                className="w-48 h-48 mx-auto"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-64 h-64 mx-auto bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                                            <div className="text-center">
                                                <HiOutlineQrcode className="text-6xl mx-auto mb-2" />
                                                <p className="text-sm">QR Code unavailable</p>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500">Scan to verify e-invoice on GST portal</p>
                                </div>

                                {/* Action Buttons - Compact Row */}
                                <div className="grid grid-cols-4 gap-2 pt-3">
                                    <button
                                        onClick={() => {
                                            // Get invoice data
                                            const inv = generatedIRN.invoiceData || {};
                                            const items = inv.items || [];
                                            const totals = inv.totals || {};

                                            // Format currency
                                            const formatINR = (amt) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt || 0);

                                            // Format date
                                            const formatDt = (d) => {
                                                const date = new Date(d);
                                                return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
                                            };

                                            // Number to words helper - with safeguards against infinite recursion
                                            const numberToWords = (num) => {
                                                // Safeguards
                                                if (num === null || num === undefined || isNaN(num)) return 'Zero';
                                                num = Math.floor(Math.abs(num)); // Handle negatives and decimals
                                                if (num > 999999999999) return 'Amount Too Large'; // Limit to prevent stack overflow

                                                const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                                                    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                                                const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

                                                if (num === 0) return 'Zero';
                                                if (num < 20) return ones[num] || 'Zero';
                                                if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
                                                if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
                                                if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
                                                if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
                                                return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
                                            };

                                            const amountInWords = (amt) => {
                                                if (amt === null || amt === undefined || isNaN(amt)) return 'Indian Rupee Zero Only';
                                                amt = Math.abs(amt || 0);
                                                const rupees = Math.floor(amt);
                                                const paise = Math.round((amt - rupees) * 100);
                                                let result = 'Indian Rupee ' + numberToWords(rupees);
                                                if (paise > 0) result += ' and ' + numberToWords(paise) + ' Paise';
                                                result += ' Only';
                                                return result;
                                            };

                                            // Get state info
                                            const getStateInfo = (code) => {
                                                const states = { '27': 'Maharashtra', '33': 'Tamil Nadu', '29': 'Karnataka', '07': 'Delhi', '24': 'Gujarat' };
                                                return { name: states[code] || 'State', code: code };
                                            };

                                            const supplierState = getStateInfo(inv.supplierState || '33');
                                            const buyerState = getStateInfo(inv.recipientState || '29');

                                            // HSN tax breakdown
                                            const hsnBreakdown = {};
                                            items.forEach(item => {
                                                const taxable = item.qty * item.rate;
                                                const rate = item.gstPercent / 2; // CGST/SGST rate
                                                const taxAmt = taxable * (item.gstPercent / 100) / 2;
                                                if (!hsnBreakdown[item.hsn]) {
                                                    hsnBreakdown[item.hsn] = { taxable: 0, rate: rate, cgst: 0, sgst: 0 };
                                                }
                                                hsnBreakdown[item.hsn].taxable += taxable;
                                                hsnBreakdown[item.hsn].cgst += taxAmt;
                                                hsnBreakdown[item.hsn].sgst += taxAmt;
                                            });

                                            // Build items rows
                                            let totalQty = 0;
                                            const itemsHtml = items.map((item, idx) => {
                                                const lineTotal = item.qty * item.rate;
                                                totalQty += item.qty;
                                                return `
                                                <tr>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
                                                    <td style="border: 1px solid #000; padding: 6px;">${item.product}</td>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.hsn}</td>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.qty} No</td>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatINR(item.rate)}</td>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">No</td>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;"></td>
                                                    <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatINR(lineTotal)}</td>
                                                </tr>
                                            `;
                                            }).join('');

                                            // CGST/SGST rows
                                            const cgstHtml = `
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px; text-align: right; font-style: italic;">CGST</td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatINR(totals.cgst || 0)}</td>
                                            </tr>
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px; text-align: right; font-style: italic;">SGST</td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatINR(totals.sgst || 0)}</td>
                                            </tr>
                                        `;

                                            // HSN breakdown table
                                            const hsnRows = Object.entries(hsnBreakdown).map(([hsn, data]) => `
                                            <tr>
                                                <td style="border: 1px solid #000; padding: 4px;">${hsn}</td>
                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(data.taxable)}</td>
                                                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${data.rate}%</td>
                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(data.cgst)}</td>
                                                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${data.rate}%</td>
                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(data.sgst)}</td>
                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(data.cgst + data.sgst)}</td>
                                            </tr>
                                        `).join('');

                                            const totalTax = (totals.cgst || 0) + (totals.sgst || 0);

                                            // Print layout - Tax Invoice format
                                            const printWindow = window.open('', '_blank');
                                            printWindow.document.write(`
                                            <!DOCTYPE html>
                                            <html>
                                            <head>
                                                <title>Tax Invoice - ${inv.invoiceNumber || 'Invoice'}</title>
                                                <style>
                                                    @page { size: A4 portrait; margin: 10mm; }
                                                    * { box-sizing: border-box; margin: 0; padding: 0; }
                                                    body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; line-height: 1.3; }
                                                    .invoice-container { max-width: 210mm; margin: 0 auto; padding: 10px; }
                                                    table { border-collapse: collapse; width: 100%; }
                                                    @media print {
                                                        body { -webkit-print-color-adjust: exact !important; }
                                                    }
                                                </style>
                                            </head>
                                            <body>
                                                <div class="invoice-container">
                                                    <!-- Header with Title and QR -->
                                                    <table style="margin-bottom: 10px;">
                                                        <tr>
                                                            <td style="width: 70%; text-align: center; font-size: 18pt; font-weight: bold;">Tax Invoice</td>
                                                            <td style="width: 30%; text-align: right;">
                                                                <div style="display: inline-block; text-align: center;">
                                                                    <div style="font-size: 9pt; font-weight: bold; margin-bottom: 5px;">e-Invoice</div>
                                                                    ${generatedIRN.qrcode ? `<img src="${generatedIRN.qrcode}" style="width: 80px; height: 80px; border: 1px solid #000;" />` : '<div style="width: 80px; height: 80px; border: 1px solid #000; display: inline-block;"></div>'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- IRN Details -->
                                                    <table style="margin-bottom: 10px; font-size: 9pt;">
                                                        <tr>
                                                            <td style="width: 60px;"><strong>IRN</strong></td>
                                                            <td>: <span style="font-family: monospace; word-break: break-all;">${generatedIRN.irn}</span></td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Ack No.</strong></td>
                                                            <td>: ${generatedIRN.ackNo || '1120100365633X'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Ack Date</strong></td>
                                                            <td>: ${formatDt(inv.invoiceDate)}</td>
                                                        </tr>
                                                    </table>

                                                    <!-- Main Details Table -->
                                                    <table style="border: 1px solid #000; margin-bottom: 10px;">
                                                        <!-- Seller & Invoice Details Row -->
                                                        <tr>
                                                            <td style="border: 1px solid #000; width: 50%; padding: 8px; vertical-align: top;" rowspan="5">
                                                                <strong>${inv.supplierName || 'Breeze Techniques'}</strong><br/>
                                                                HSR Layout<br/>
                                                                Bangalore<br/>
                                                                GSTIN/UIN: ${inv.supplierGstin || '33AAKCS0734Q1ZA'}<br/>
                                                                State Name : ${supplierState.name}, Code : ${supplierState.code}
                                                            </td>
                                                            <td style="border: 1px solid #000; padding: 4px; width: 25%;">Invoice No.</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Dated</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">${inv.invoiceNumber || 'SHB/456/20'}</td>
                                                            <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">${formatDt(inv.invoiceDate)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px;">Delivery Note</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Mode/Terms of Payment</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px;">Reference No. & Date.</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Other References</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px;">Buyer's Order No.</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Dated</td>
                                                        </tr>

                                                        <!-- Consignee Row -->
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px; background: #f5f5f5;" colspan="1">Consignee (Ship to)</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Dispatch Doc No.</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Delivery Note Date</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 8px; vertical-align: top;" rowspan="3">
                                                                <strong>${inv.recipientName || 'Customer'}</strong><br/>
                                                                12th Cross<br/>
                                                                GSTIN/UIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${inv.recipientGstin || 'N/A'}<br/>
                                                                State Name&nbsp;&nbsp;&nbsp;: ${buyerState.name}, Code : ${buyerState.code}
                                                            </td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Dispatched through</td>
                                                            <td style="border: 1px solid #000; padding: 4px;">Destination</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px;" colspan="2">Terms of Delivery</td>
                                                        </tr>

                                                        <!-- Buyer Row -->
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 4px; background: #f5f5f5;" colspan="2">Buyer (Bill to)</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 8px; vertical-align: top;" colspan="3">
                                                                <strong>${inv.recipientName || 'Customer'}</strong><br/>
                                                                12th Cross<br/>
                                                                GSTIN/UIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${inv.recipientGstin || 'N/A'}<br/>
                                                                State Name&nbsp;&nbsp;&nbsp;: ${buyerState.name}, Code : ${buyerState.code}
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Items Table -->
                                                    <table style="border: 1px solid #000; margin-bottom: 5px;">
                                                        <thead>
                                                            <tr style="background: #f5f5f5;">
                                                                <th style="border: 1px solid #000; padding: 6px; width: 30px;">Sl No.</th>
                                                                <th style="border: 1px solid #000; padding: 6px;">Description of Goods</th>
                                                                <th style="border: 1px solid #000; padding: 6px; width: 60px;">HSN/SAC</th>
                                                                <th style="border: 1px solid #000; padding: 6px; width: 60px;">Quantity</th>
                                                                <th style="border: 1px solid #000; padding: 6px; width: 70px;">Rate</th>
                                                                <th style="border: 1px solid #000; padding: 6px; width: 30px;">per</th>
                                                                <th style="border: 1px solid #000; padding: 6px; width: 50px;">Disc. %</th>
                                                                <th style="border: 1px solid #000; padding: 6px; width: 80px;">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${itemsHtml}
                                                            ${cgstHtml}
                                                            <tr style="font-weight: bold;">
                                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                                <td style="border: 1px solid #000; padding: 6px; text-align: right;">Total</td>
                                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${totalQty} No</td>
                                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                                <td style="border: 1px solid #000; padding: 6px;"></td>
                                                                <td style="border: 1px solid #000; padding: 6px; text-align: right; font-size: 11pt;">₹ ${formatINR(totals.invoiceTotal)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <!-- Amount in Words -->
                                                    <table style="border: 1px solid #000; margin-bottom: 10px;">
                                                        <tr>
                                                            <td style="padding: 6px;">
                                                                <span style="font-size: 8pt; color: #666;">Amount Chargeable (in words)</span><br/>
                                                                <strong>${amountInWords(totals.invoiceTotal)}</strong>
                                                                <span style="float: right; font-size: 8pt;">E. & O.E</span>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- HSN/SAC Tax Table -->
                                                    <table style="border: 1px solid #000; margin-bottom: 5px; font-size: 9pt;">
                                                        <thead>
                                                            <tr style="background: #f5f5f5;">
                                                                <th style="border: 1px solid #000; padding: 4px;" rowspan="2">HSN/SAC</th>
                                                                <th style="border: 1px solid #000; padding: 4px;" rowspan="2">Taxable Value</th>
                                                                <th style="border: 1px solid #000; padding: 4px;" colspan="2">Central Tax</th>
                                                                <th style="border: 1px solid #000; padding: 4px;" colspan="2">State Tax</th>
                                                                <th style="border: 1px solid #000; padding: 4px;" rowspan="2">Total Tax Amount</th>
                                                            </tr>
                                                            <tr style="background: #f5f5f5;">
                                                                <th style="border: 1px solid #000; padding: 4px;">Rate</th>
                                                                <th style="border: 1px solid #000; padding: 4px;">Amount</th>
                                                                <th style="border: 1px solid #000; padding: 4px;">Rate</th>
                                                                <th style="border: 1px solid #000; padding: 4px;">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${hsnRows}
                                                            <tr style="font-weight: bold;">
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">Total</td>
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(totals.taxableValue)}</td>
                                                                <td style="border: 1px solid #000; padding: 4px;"></td>
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(totals.cgst)}</td>
                                                                <td style="border: 1px solid #000; padding: 4px;"></td>
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(totals.sgst)}</td>
                                                                <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatINR(totalTax)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <!-- Tax Amount in Words -->
                                                    <p style="font-size: 9pt; margin-bottom: 10px;">
                                                        <strong>Tax Amount (in words) :</strong> ${amountInWords(totalTax)}
                                                    </p>

                                                    <!-- Declaration & Signature -->
                                                    <table style="border: 1px solid #000;">
                                                        <tr>
                                                            <td style="border: 1px solid #000; padding: 8px; width: 60%; vertical-align: top; font-size: 9pt;">
                                                                <strong>Declaration</strong><br/>
                                                                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                                                            </td>
                                                            <td style="border: 1px solid #000; padding: 8px; text-align: right; vertical-align: top;">
                                                                <strong>for ${inv.supplierName || 'Breeze Techniques'}</strong><br/><br/><br/><br/>
                                                                <span style="font-size: 9pt;">Authorised Signatory</span>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Footer -->
                                                    <p style="text-align: center; margin-top: 15px; font-size: 9pt; color: #666;">
                                                        This is a Computer Generated Invoice
                                                    </p>
                                                </div>
                                            </body>
                                            </html>
                                        `);
                                            printWindow.document.close();
                                            printWindow.focus();
                                            setTimeout(() => printWindow.print(), 300);
                                        }}
                                        className="flex items-center justify-center gap-1 px-3 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium text-sm">
                                        <HiOutlinePrinter className="text-base" />
                                        Print
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Download E-Invoice as PDF
                                            const inv = generatedIRN.invoiceData || {};
                                            const formatINR = (val) => parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                            const totalTax = parseFloat(totals.cgst || 0) + parseFloat(totals.sgst || 0) + parseFloat(totals.igst || 0);

                                            // Ensure items array exists
                                            const invoiceData = {
                                                ...generatedIRN.invoiceData,
                                                irn: generatedIRN.irn,
                                                ackNo: generatedIRN.ackNo,
                                                ackDate: generatedIRN.ackDate,
                                                qrcode: generatedIRN.signedQrCode || generatedIRN.qrcode,
                                                // Fallback to form items if generated data is missing items
                                                items: (generatedIRN.invoiceData && generatedIRN.invoiceData.items) ? generatedIRN.invoiceData.items : invoiceForm.items
                                            };

                                            const pdfElement = document.createElement('div');
                                            pdfElement.innerHTML = getInvoiceTemplate(invoiceData, 'final');

                                            // Position off-screen but keeping it visible for html2canvas
                                            pdfElement.style.position = 'absolute';
                                            pdfElement.style.top = '-10000px';
                                            pdfElement.style.left = '-10000px';
                                            pdfElement.style.width = '794px'; // A4 width at 96dpi approx
                                            pdfElement.style.background = 'white';

                                            document.body.appendChild(pdfElement);

                                            // Wait for images to load
                                            setTimeout(() => {
                                                const opt = {
                                                    margin: 0,
                                                    filename: `E-Invoice_${invoiceForm.invoiceNumber}.pdf`,
                                                    image: { type: 'jpeg', quality: 0.98 },
                                                    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
                                                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                                };

                                                html2pdf().set(opt).from(pdfElement).save().then(() => {
                                                    document.body.removeChild(pdfElement);
                                                }).catch(err => {
                                                    console.error('PDF Generation Error:', err);
                                                    document.body.removeChild(pdfElement);
                                                });
                                            }, 500);
                                        }}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm">
                                        <HiOutlineDownload className="text-base" />
                                        Download
                                    </button>
                                    <button
                                        onClick={openEwbFromIrn}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                                        <HiOutlineTruck className="text-base" />
                                        E-Way Bill
                                    </button>
                                    <button
                                        onClick={() => setShowSuccessModal(false)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* E-Way Bill Quick Generate Modal */}
            {
                showEwbModal && selectedEwbInvoice && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 animate-fade-in">
                            <h2 className="text-2xl font-bold text-primary mb-4">🚚 Generate E-Way Bill</h2>
                            <div className="mb-6">
                                <p className="text-sm text-primary/60 mb-2">Invoice: <span className="font-medium text-primary">{selectedEwbInvoice.invoice_number}</span></p>
                                <p className="text-sm text-primary/60">IRN: <span className="font-mono text-xs">{selectedEwbInvoice.irn?.substring(0, 30)}...</span></p>
                            </div>

                            <form onSubmit={handleGenerateEwb} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">Distance (km) *</label>
                                    <input
                                        type="number"
                                        name="distance"
                                        value={ewbForm.distance}
                                        onChange={handleEwbFormChange}
                                        placeholder="e.g., 250"
                                        min="1"
                                        required
                                        autoFocus
                                        className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Vehicle Number</label>
                                        <input
                                            type="text"
                                            name="vehicleNo"
                                            value={ewbForm.vehicleNo}
                                            onChange={handleEwbFormChange}
                                            placeholder="TN38AB1234"
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">Transporter Name</label>
                                        <input
                                            type="text"
                                            name="transName"
                                            value={ewbForm.transName}
                                            onChange={handleEwbFormChange}
                                            placeholder="ABC Logistics"
                                            className="w-full border border-primary/20 rounded-lg px-4 py-3 text-primary placeholder-primary/40 focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEwbModal(false);
                                            setSelectedEwbInvoice(null);
                                            setEwbForm({ distance: '', transId: '', transName: '', transGstin: '', vehicleNo: '' });
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={generatingEwb}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-70"
                                    >
                                        {generatingEwb ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <HiOutlineTruck className="text-lg" />
                                                Generate EWB
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* E-Way Bill Success Modal */}
            {
                showEwbSuccessModal && generatedEwb && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
                            <div className="text-center space-y-6">
                                {/* Success Header */}
                                <div className="flex items-center justify-center gap-3 text-blue-600">
                                    <HiOutlineTruck className="text-4xl" />
                                    <h2 className="text-2xl font-bold">E-Way Bill Generated!</h2>
                                </div>

                                {/* EWB Number Display */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                                    <p className="text-sm text-gray-600 mb-2">E-Way Bill Number</p>
                                    <p className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                                        {generatedEwb.ewbNo}
                                    </p>
                                </div>

                                {/* Validity Period */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                        <p className="text-xs text-emerald-600 mb-1">Valid From</p>
                                        <p className="font-medium text-emerald-800">{formatDate(generatedEwb.ewbValidFrom)}</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                        <p className="text-xs text-amber-600 mb-1">Valid Until</p>
                                        <p className="font-medium text-amber-800">{formatDate(generatedEwb.ewbValidUpto)}</p>
                                    </div>
                                </div>

                                {/* QR Code Display */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-800">E-Way Bill QR Code</h3>
                                    {generatedEwb.ewbQrCode ? (
                                        <div className="bg-white p-4 rounded-xl border-4 border-blue-200 inline-block shadow-lg">
                                            <img
                                                src={generatedEwb.ewbQrCode}
                                                alt="EWB QR Code"
                                                className="w-48 h-48 mx-auto"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                                            <HiOutlineQrcode className="text-6xl" />
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500">Scan to verify E-Way Bill</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            const ewb = generatedEwb || {};
                                            const invoice = generatedEwb?.invoice || selectedEwbInvoice || {};

                                            // Create temporary element for PDF generation using reusable template
                                            const element = document.createElement('div');
                                            element.innerHTML = getEwayBillTemplate(ewb, invoice);
                                            element.style.position = 'absolute';
                                            element.style.top = '-10000px';
                                            element.style.left = '-10000px';
                                            element.style.background = 'white';
                                            document.body.appendChild(element);

                                            const opt = {
                                                margin: 5,
                                                filename: `EWayBill-${ewb.ewbNo || 'draft'}.pdf`,
                                                image: { type: 'jpeg', quality: 0.98 },
                                                html2canvas: { scale: 2 },
                                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                            };

                                            html2pdf().set(opt).from(element).save().then(() => {
                                                document.body.removeChild(element);
                                            });
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium"
                                    >
                                        <HiOutlineDownload className="text-lg" />
                                        Download E-Way Bill
                                    </button>
                                    <button
                                        onClick={() => setShowEwbSuccessModal(false)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};


export default EInvoice;
