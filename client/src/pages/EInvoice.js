import React, { useState, useEffect, useMemo } from 'react';
import { BlobProvider, pdf } from '@react-pdf/renderer';
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
import InvoicePDF from '../components/einvoice/InvoicePDF';
import EWayBillPDF from '../components/einvoice/EWayBillPDF';
import InvoiceEditorSimple from '../components/einvoice/InvoiceEditorSimple';

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
        recipientAddress: '',
        recipientPhone: '',
        recipientEmail: '',
        recipientState: '33',
        recipientPin: '',
        recipientCountry: '',
        placeOfSupply: '',
        // Reference details
        eInvoiceNo: '',
        deliveryNote: '',
        modeOfPayment: '',
        supplierRef: '',
        otherReferences: '',
        buyerOrderNo: '',
        buyerOrderDate: '',
        dispatchDocNo: '',
        deliveryNoteDate: '',
        despatchedThrough: '',
        destination: '',
        termsOfDelivery: '',
        items: [
            { id: 1, product: '', hsn: '8414', qty: 1, unit: 'Nos', rate: 0, gstPercent: 18 }
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
    const [missingFields, setMissingFields] = useState([]); // Track missing required fields

    // E-Way Bill state
    const [ewbInvoices, setEwbInvoices] = useState([]);
    const [ewbLoading, setEwbLoading] = useState(false);
    const [selectedEwbInvoice, setSelectedEwbInvoice] = useState(null);
    const [ewbForm, setEwbForm] = useState({
        // Transportation details (user input)
        distance: '',
        transId: '',
        transName: '',
        transGstin: '',
        vehicleNo: '',

        // Auto-populated from invoice (synced automatically)
        supplierName: '',
        supplierAddress: '',
        supplierGstin: '',
        recipientName: '',
        recipientAddress: '',
        recipientGstin: '',
        recipientState: '',
        invoiceNumber: '',
        invoiceDate: '',
        irn: '',
        productDescription: '',
        hsnCode: '',
        quantity: 0,
        taxableValue: 0,
        invoiceValue: 0,
        dispatchFrom: '',
        destination: '',
        despatchedThrough: ''
    });
    const [showEwbModal, setShowEwbModal] = useState(false);

    const [showEwbSuccessModal, setShowEwbSuccessModal] = useState(false);
    const [generatedEwb, setGeneratedEwb] = useState(null);
    const [generatingEwb, setGeneratingEwb] = useState(false);

    // Editor section state - default to 'items' to show form immediately
    const [activeSection, setActiveSection] = useState('items');

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

                // Form data persisted until manual reset
                // setEwbForm(prev => ({ ... }));
                // setSelectedEwbInvoice(null);
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

    // Download E-Way Bill PDF
    const downloadEwbPDF = async () => {
        try {
            if (!generatedEwb) {
                setMessage({ type: 'error', text: 'No E-Way Bill data available.' });
                return;
            }

            // Prepare data for EWayBillPDF component
            const ewbData = {
                ewbNumber: generatedEwb.ewbNo,
                generatedDate: generatedEwb.ewbValidFrom,
                validUntil: generatedEwb.ewbValidUpto,
                irn: generatedEwb.invoice?.irn || ewbForm.irn,

                // Supplier details
                supplierName: generatedEwb.invoice?.supplier_name || ewbForm.supplierName || selectedBusiness.name,
                supplierAddress: generatedEwb.invoice?.supplier_address || ewbForm.supplierAddress || selectedBusiness.address,
                supplierGstin: generatedEwb.invoice?.supplier_gstin || ewbForm.supplierGstin || selectedBusiness.gstin,

                // Recipient details
                recipientName: generatedEwb.invoice?.recipient_name || ewbForm.recipientName,
                recipientAddress: generatedEwb.invoice?.recipient_address || ewbForm.recipientAddress,
                recipientGstin: generatedEwb.invoice?.recipient_gstin || ewbForm.recipientGstin,

                // Product details
                productDescription: ewbForm.productDescription || 'Products',
                hsnCode: ewbForm.hsnCode,
                quantity: ewbForm.quantity,

                // Financial details
                taxableValue: ewbForm.taxableValue,
                invoiceValue: ewbForm.invoiceValue,

                // Transportation details
                transporterName: generatedEwb.transName || ewbForm.transName,
                transporterId: ewbForm.transId,
                transportMode: 'Road',
                vehicleNumber: generatedEwb.vehicleNo || ewbForm.vehicleNo,
                distance: generatedEwb.distance,

                // Invoice details
                invoiceNumber: generatedEwb.invoice?.invoice_number || ewbForm.invoiceNumber,
                invoiceDate: generatedEwb.invoice?.invoice_date || ewbForm.invoiceDate,

                // Logistics
                dispatchFrom: ewbForm.dispatchFrom,
                destination: ewbForm.destination,
                despatchedThrough: ewbForm.despatchedThrough
            };

            // Generate PDF blob
            const blob = await pdf(<EWayBillPDF data={ewbData} qrCode={generatedEwb.ewbQrCode} />).toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `EWayBill_${generatedEwb.ewbNo}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'E-Way Bill PDF downloaded successfully!' });
        } catch (error) {
            console.error('PDF download error:', error);
            setMessage({ type: 'error', text: 'Failed to download E-Way Bill PDF.' });
        }
    };

    // History Action Handlers
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);

    // View QR Code for a record
    const viewQRCode = (record) => {
        setSelectedRecord(record);
        setShowQRModal(true);
    };

    // Download invoice PDF for a history record
    const downloadInvoicePDF = async (record) => {
        try {
            // Prepare data from record
            const invoiceData = {
                supplierName: record.supplier_name || selectedBusiness.name,
                supplierAddress: selectedBusiness.address,
                supplierPhone: selectedBusiness.phone,
                supplierGstin: record.supplier_gstin,
                supplierState: selectedBusiness.stateCode,
                invoiceNumber: record.invoice_number,
                invoiceDate: record.invoice_date,
                recipientName: record.recipient_name,
                recipientAddress: record.recipient_address,
                recipientGstin: record.recipient_gstin,
                items: record.items || [],
                totals: {
                    taxableValue: record.taxable_amount,
                    cgst: record.cgst,
                    sgst: record.sgst,
                    igst: record.igst,
                    invoiceTotal: record.total_amount
                }
            };

            // Generate PDF
            const blob = await pdf(<InvoicePDF data={invoiceData} qrCode={record.qrcode} irn={record.irn} ackNo={null} />).toBlob();

            // Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_${record.invoice_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Invoice PDF downloaded successfully!' });
        } catch (error) {
            console.error('PDF download error:', error);
            setMessage({ type: 'error', text: 'Failed to download invoice PDF.' });
        }
    };

    // Download E-Way Bill PDF for a history record
    const downloadHistoryEwbPDF = async (record) => {
        try {
            if (!record.ewb_no) {
                setMessage({ type: 'error', text: 'No E-Way Bill available for this record.' });
                return;
            }

            const ewbData = {
                ewbNumber: record.ewb_no,
                generatedDate: record.ewb_generated_at,
                validUntil: record.ewb_valid_upto,
                irn: record.irn,
                supplierName: record.supplier_name,
                supplierGstin: record.supplier_gstin,
                recipientName: record.recipient_name,
                recipientGstin: record.recipient_gstin,
                invoiceNumber: record.invoice_number,
                invoiceDate: record.invoice_date,
                invoiceValue: record.total_amount,
                vehicleNumber: record.ewb_vehicle_no,
                distance: record.ewb_distance,
                transporterName: record.ewb_transporter_name
            };

            const blob = await pdf(<EWayBillPDF data={ewbData} qrCode={record.ewb_qrcode} />).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `EWayBill_${record.ewb_no}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'E-Way Bill PDF downloaded successfully!' });
        } catch (error) {
            console.error('EWB PDF download error:', error);
            setMessage({ type: 'error', text: 'Failed to download E-Way Bill PDF.' });
        }
    };

    // Download JSON data
    const downloadJSON = (record) => {
        try {
            const jsonData = JSON.stringify(record, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `IRN_${record.invoice_number}_${record.id}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'JSON data downloaded successfully!' });
        } catch (error) {
            console.error('JSON download error:', error);
            setMessage({ type: 'error', text: 'Failed to download JSON data.' });
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

    // Auto-populate E-Way Bill form from Invoice form data
    useEffect(() => {
        // Get first item or aggregate all items
        const firstItem = invoiceForm.items[0] || {};
        const allProducts = invoiceForm.items.map(i => i.product).filter(Boolean).join(', ');
        const totalQty = invoiceForm.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);

        setEwbForm(prev => ({
            ...prev,
            // Supplier details from selected business
            supplierName: selectedBusiness.name || '',
            supplierAddress: selectedBusiness.address || '',
            supplierGstin: selectedBusiness.gstin || '',

            // Recipient details from invoice form
            recipientName: invoiceForm.recipientName || '',
            recipientAddress: invoiceForm.recipientAddress || '',
            recipientGstin: invoiceForm.recipientGstin || '',
            recipientState: invoiceForm.recipientState || '',

            // Invoice details
            invoiceNumber: invoiceForm.invoiceNumber || '',
            invoiceDate: invoiceForm.invoiceDate || '',

            // Product details (from items)
            productDescription: allProducts || firstItem.product || '',
            hsnCode: firstItem.hsn || '',
            quantity: totalQty,

            // Financial details (from totals)
            taxableValue: totals?.taxableValue || 0,
            invoiceValue: totals?.invoiceTotal || 0,

            // Logistics details from invoice form
            dispatchFrom: invoiceForm.recipientAddress || selectedBusiness.address || '',
            destination: invoiceForm.destination || invoiceForm.recipientAddress || '',
            despatchedThrough: invoiceForm.despatchedThrough || prev.transName || '',

            // Keep user-entered transportation details (don't overwrite)
            distance: prev.distance,
            transId: prev.transId,
            transName: prev.transName || invoiceForm.despatchedThrough || '',
            transGstin: prev.transGstin,
            vehicleNo: prev.vehicleNo
        }));
    }, [invoiceForm, selectedBusiness, totals]);

    // Filter history based on search term
    const filteredHistory = useMemo(() => {
        if (!searchTerm.trim()) return history;

        const term = searchTerm.toLowerCase();
        return history.filter(record =>
            record.invoice_number?.toLowerCase().includes(term) ||
            record.recipient_name?.toLowerCase().includes(term) ||
            record.recipient_gstin?.toLowerCase().includes(term) ||
            record.irn?.toLowerCase().includes(term) ||
            record.ewb_no?.toLowerCase().includes(term)
        );
    }, [history, searchTerm]);


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

    // Reset all forms for new invoice
    const handleNewInvoice = () => {
        // Reset Invoice Form
        setInvoiceForm({
            invoiceType: 'sales',
            invoiceNumber: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            recipientGstin: '',
            recipientName: '',
            recipientAddress: '',
            recipientPhone: '',
            recipientEmail: '',
            recipientState: '33',
            recipientPin: '',
            recipientCountry: '',
            placeOfSupply: '',
            eInvoiceNo: '',
            deliveryNote: '',
            modeOfPayment: '',
            supplierRef: '',
            otherReferences: '',
            buyerOrderNo: '',
            buyerOrderDate: '',
            dispatchDocNo: '',
            deliveryNoteDate: '',
            despatchedThrough: '',
            destination: '',
            termsOfDelivery: '',
            items: [
                { id: 1, product: '', hsn: '8414', qty: 1, unit: 'Nos', rate: 0, gstPercent: 18 }
            ],
            vehicleNumber: '',
            transportDistance: ''
        });

        // Reset E-Way Bill Form
        setEwbForm(prev => ({
            ...prev,
            distance: '',
            transId: '',
            transName: '',
            transGstin: '',
            vehicleNo: '',
            // Don't reset auto-populated fields from invoice as they will update when invoice form updates or invoice is selected
        }));

        // Reset other states
        setGeneratedIRN(null);
        setGeneratedEwb(null);
        setSelectedEwbInvoice(null);
        setMessage(null);
        setMissingFields([]);
        setShowSuccessModal(false);
    };

    // Generate IRN with comprehensive validation
    const handleGenerateIRN = async (e) => {
        e.preventDefault();
        setMessage(null);
        setMissingFields([]); // Reset missing fields

        // Define required fields
        const requiredFields = {
            // Bill To (Customer Details)
            recipientName: 'Customer Name',
            recipientGstin: 'GST Number',
            recipientPhone: 'Phone Number',
            recipientEmail: 'Email',
            recipientAddress: 'Address',
            recipientCountry: 'Country',
            placeOfSupply: 'Place of Supply',

            // Invoice Details
            invoiceNumber: 'Invoice Number',
            invoiceDate: 'Invoice Date',

            // Reference Details
            eInvoiceNo: 'e-Invoice No.',
            deliveryNote: 'Delivery Note',
            modeOfPayment: 'Mode/Terms of Payment',
            supplierRef: "Supplier's Ref.",
            otherReferences: 'Other Reference(s)',
            buyerOrderNo: "Buyer's Order No.",
            buyerOrderDate: 'Buyer Order Date',
            dispatchDocNo: 'Despatch Document No.',
            deliveryNoteDate: 'Delivery Note Date',
            despatchedThrough: 'Despatched Through',
            destination: 'Destination',
            termsOfDelivery: 'Terms of Delivery'
        };

        // Check for missing fields
        const missing = [];
        Object.keys(requiredFields).forEach(field => {
            const value = invoiceForm[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                missing.push({
                    field,
                    label: requiredFields[field]
                });
            }
        });

        // Validate GSTIN format specifically
        if (invoiceForm.recipientGstin && invoiceForm.recipientGstin.length !== 15) {
            if (!missing.find(m => m.field === 'recipientGstin')) {
                missing.push({
                    field: 'recipientGstin',
                    label: 'GST Number (must be 15 characters)'
                });
            }
        }

        // Validate items
        const hasValidItems = invoiceForm.items.every(item =>
            item.product && item.hsn && item.qty > 0 && item.rate > 0
        );
        if (!hasValidItems) {
            missing.push({
                field: 'items',
                label: 'Item Details (Product, HSN, Qty, Rate)'
            });
        }

        // If there are missing fields, highlight them with overlays
        if (missing.length > 0) {
            setMissingFields(missing.map(m => m.field));

            // Scroll to first missing field
            setTimeout(() => {
                const firstMissingField = missing[0].field;
                const element = document.querySelector(`[name="${firstMissingField}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }, 100);

            return;
        }

        setGenerating(true);

        try {
            const payload = {
                supplierGstin: selectedBusiness.gstin,
                supplierName: selectedBusiness.name,
                supplierAddress: selectedBusiness.address,
                supplierPhone: selectedBusiness.phone,
                supplierState: selectedBusiness.stateCode,
                invoiceType: invoiceForm.invoiceType,
                invoiceNumber: invoiceForm.invoiceNumber,
                invoiceDate: invoiceForm.invoiceDate,
                eInvoiceNo: invoiceForm.eInvoiceNo,
                deliveryNote: invoiceForm.deliveryNote,
                recipientGstin: invoiceForm.recipientGstin,
                recipientName: invoiceForm.recipientName,
                recipientAddress: invoiceForm.recipientAddress,
                recipientPhone: invoiceForm.recipientPhone,
                recipientEmail: invoiceForm.recipientEmail,
                recipientState: invoiceForm.recipientState,
                recipientPin: invoiceForm.recipientPin,
                recipientCountry: invoiceForm.recipientCountry || 'India',
                placeOfSupply: invoiceForm.placeOfSupply,
                modeOfPayment: invoiceForm.modeOfPayment,
                supplierRef: invoiceForm.supplierRef,
                otherReferences: invoiceForm.otherReferences,
                buyerOrderNo: invoiceForm.buyerOrderNo,
                buyerOrderDate: invoiceForm.buyerOrderDate,
                dispatchDocNo: invoiceForm.dispatchDocNo,
                deliveryNoteDate: invoiceForm.deliveryNoteDate,
                despatchedThrough: invoiceForm.despatchedThrough,
                destination: invoiceForm.destination,
                termsOfDelivery: invoiceForm.termsOfDelivery,
                items: invoiceForm.items,
                totals: totals
            };

            const { data } = await api.post('/einvoice/generate-irn', payload);

            if (data.success) {
                if (data.warning) {
                    setMessage({ type: 'error', text: data.message });
                } else {
                    setMessage({ type: 'success', text: 'IRN generated successfully!' });
                }

                // Store complete invoice data for printing
                setGeneratedIRN({
                    ...data,
                    invoiceData: payload // Store the full invoice for print
                });
                setShowSuccessModal(true);

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

                // Form data persisted until manual reset
                // setInvoiceForm({ ... });
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
                </div>

                {/* Business Selector and Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleNewInvoice}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm font-medium flex items-center gap-2"
                    >
                        <HiOutlinePlus className="text-lg" />
                        New E-invoice
                    </button>

                    <div className="flex items-center gap-3 border-l pl-4 border-gray-300">
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
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> */}
            {/* Pending IRN */}
            {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Pending IRN</p>
                            <p className="text-3xl font-bold text-amber-700 mt-2">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <HiOutlineClock className="text-2xl text-amber-600" />
                        </div>
                    </div>
                </div> */}

            {/* Success Today */}
            {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-600 font-medium">Success Today</p>
                            <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.successToday}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <HiOutlineCheckCircle className="text-2xl text-emerald-600" />
                        </div>
                    </div>
                </div> */}

            {/* Failed */}
            {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
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
            </div> */}

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
                {/* Generate IRN Tab - SPLIT LAYOUT */}
                {activeTab === 'sales' && (
                    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        {/* LEFT SIDE: VISUAL PREVIEW */}
                        <div className="w-full lg:w-1/2 overflow-y-auto bg-gray-100/50 p-4 lg:p-8 scrollbar-thin scrollbar-thumb-gray-300">
                            {/* <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">PDF Preview</h2>
                            </div> */}

                            {/* React-PDF Viewer */}
                            <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '800px', height: 'calc(100vh - 250px)' }}>
                                <BlobProvider
                                    document={
                                        <InvoicePDF
                                            data={{
                                                supplierName: selectedBusiness.name,
                                                supplierAddress: selectedBusiness.address,
                                                supplierPhone: selectedBusiness.phone,
                                                supplierGstin: selectedBusiness.gstin,
                                                supplierState: selectedBusiness.stateCode,
                                                invoiceNumber: invoiceForm.invoiceNumber,
                                                invoiceDate: invoiceForm.invoiceDate,
                                                eInvoiceNo: invoiceForm.eInvoiceNo,
                                                recipientName: invoiceForm.recipientName,
                                                recipientAddress: invoiceForm.recipientAddress,
                                                recipientPhone: invoiceForm.recipientPhone,
                                                recipientEmail: invoiceForm.recipientEmail,
                                                recipientGstin: invoiceForm.recipientGstin,
                                                recipientState: invoiceForm.recipientState,
                                                recipientPin: invoiceForm.recipientPin,
                                                recipientCountry: invoiceForm.recipientCountry,
                                                placeOfSupply: invoiceForm.placeOfSupply,
                                                // Reference details
                                                deliveryNote: invoiceForm.deliveryNote,
                                                modeOfPayment: invoiceForm.modeOfPayment,
                                                supplierRef: invoiceForm.supplierRef,
                                                otherReferences: invoiceForm.otherReferences,
                                                buyerOrderNo: invoiceForm.buyerOrderNo,
                                                buyerOrderDate: invoiceForm.buyerOrderDate,
                                                dispatchDocNo: invoiceForm.dispatchDocNo,
                                                deliveryNoteDate: invoiceForm.deliveryNoteDate,
                                                despatchedThrough: invoiceForm.despatchedThrough,
                                                destination: invoiceForm.destination,
                                                termsOfDelivery: invoiceForm.termsOfDelivery,
                                                items: invoiceForm.items,
                                                totals: totals
                                            }}
                                            qrCode={null}
                                            irn={null}
                                            ackNo={null}
                                        />
                                    }
                                >
                                    {({ blob, url, loading, error }) => {
                                        if (loading) {
                                            return (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                                        <p className="text-gray-600">Generating PDF preview...</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (error) {
                                            return (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-center text-red-600">
                                                        <p className="font-bold">Error generating PDF:</p>
                                                        <p className="text-sm">{error.message}</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (url) {
                                            return (
                                                <iframe
                                                    src={url}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        minHeight: '800px',
                                                        border: 'none'
                                                    }}
                                                    title="Invoice PDF Preview"
                                                />
                                            );
                                        }
                                        return null;
                                    }}
                                </BlobProvider>
                            </div>
                        </div>

                        {/* RIGHT SIDE: EDITOR PANEL */}
                        <div className="w-full lg:w-1/2 bg-[#06302C] overflow-y-auto relative scrollbar-thin scrollbar-thumb-emerald-700 scrollbar-track-emerald-900/20">
                            {/* Empty State / Select Prompt if needed, or just default to showing editor */}
                            <InvoiceEditorSimple
                                invoiceForm={invoiceForm}
                                handleFormChange={handleFormChange}
                                handleItemChange={handleItemChange}
                                addItemRow={addItemRow}
                                removeItemRow={removeItemRow}
                                states={INDIAN_STATES}
                                hsnCodes={DEFAULT_HSN_CODES}
                                totals={totals}
                                generating={generating}
                                handleGenerateIRN={handleGenerateIRN}
                                selectedBusiness={selectedBusiness}
                                missingFields={missingFields}
                            />
                        </div>
                    </div>
                )}

                {/* E-Way Bill Tab Content */}
                {activeTab === 'eway' && (
                    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
                        {/* LEFT SIDE: PREVIEW PANEL */}
                        <div className="w-full lg:w-1/2 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col overflow-hidden relative">
                            <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur px-4 py-2 border-b border-gray-200 z-10 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                    <HiOutlineDocumentText className="text-lg" />
                                    E-Way Bill Preview
                                </span>
                                {selectedEwbInvoice && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {selectedEwbInvoice.invoice_number}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 overflow-hidden p-4 pt-12">
                                {!selectedEwbInvoice ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <HiOutlineTruck className="text-6xl mb-4 opacity-50" />
                                        <p>Select an invoice to preview E-Way Bill</p>
                                    </div>
                                ) : (
                                    <BlobProvider
                                        document={
                                            <EWayBillPDF
                                                data={{
                                                    // Base data from selected invoice
                                                    ewbNumber: selectedEwbInvoice.ewb_no || generatedEwb?.ewbNo || 'Not Generated',
                                                    generatedDate: selectedEwbInvoice.ewb_generated_at || new Date(),
                                                    validUntil: selectedEwbInvoice.ewb_valid_upto || new Date(new Date().setDate(new Date().getDate() + 1)),
                                                    irn: selectedEwbInvoice.irn,

                                                    // Parties
                                                    supplierName: selectedEwbInvoice.supplier_name,
                                                    supplierAddress: selectedEwbInvoice.supplier_address || (selectedEwbInvoice.signed_invoice ? JSON.parse(selectedEwbInvoice.signed_invoice).SellerDtls?.Addr1 : ''),
                                                    supplierGstin: selectedEwbInvoice.supplier_gstin,

                                                    recipientName: selectedEwbInvoice.recipient_name,
                                                    recipientAddress: selectedEwbInvoice.recipient_address || (selectedEwbInvoice.signed_invoice ? JSON.parse(selectedEwbInvoice.signed_invoice).BuyerDtls?.Addr1 : ''),
                                                    recipientGstin: selectedEwbInvoice.recipient_gstin,

                                                    dispatchFrom: selectedEwbInvoice.signed_invoice ? JSON.parse(selectedEwbInvoice.signed_invoice).DispDtls?.Addr1 : '',
                                                    destination: selectedEwbInvoice.signed_invoice ? JSON.parse(selectedEwbInvoice.signed_invoice).ShipDtls?.Addr1 : '',

                                                    // Goods (use first item as summary or map safely)
                                                    productDescription: selectedEwbInvoice.items?.[0]?.product || 'Multi-Product',
                                                    hsnCode: selectedEwbInvoice.items?.[0]?.hsn || 'Multi',
                                                    quantity: selectedEwbInvoice.items?.reduce((acc, item) => acc + (parseInt(item.qty) || 0), 0) || 0,
                                                    taxableValue: selectedEwbInvoice.total_amount, // Approximation
                                                    invoiceValue: selectedEwbInvoice.total_amount,
                                                    invoiceNumber: selectedEwbInvoice.invoice_number,
                                                    invoiceDate: selectedEwbInvoice.invoice_date,

                                                    // Transport (Live update from form)
                                                    transporterId: ewbForm.transId,
                                                    transporterName: ewbForm.transName,
                                                    vehicleNumber: ewbForm.vehicleNo,
                                                    distance: ewbForm.distance,
                                                    transportMode: 'Road'
                                                }}
                                                qrCode={selectedEwbInvoice.qrcode || null}
                                            />
                                        }
                                    >
                                        {({ url, loading, error }) => {
                                            if (loading) return (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                                </div>
                                            );
                                            if (error) return (
                                                <div className="h-full flex items-center justify-center text-red-500">
                                                    Error loading preview
                                                </div>
                                            );
                                            return (
                                                <iframe
                                                    src={url}
                                                    className="w-full h-full rounded shadow-sm border border-gray-200"
                                                    title="E-Way Bill Preview"
                                                />
                                            );
                                        }}
                                    </BlobProvider>
                                )}
                            </div>
                        </div>

                        {/* RIGHT SIDE: FORM PANEL */}
                        <div className="w-full lg:w-1/2 overflow-y-auto">
                            <div className="bg-[#0f2926] rounded-2xl shadow-sm border border-primary/10 p-6 h-full text-white">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <HiOutlineTruck className="text-2xl" />
                                    Generate E-Way Bill
                                </h2>

                                {!selectedEwbInvoice ? (
                                    <div className="text-center py-12 bg-[#0a1f1c] rounded-xl border-2 border-dashed border-[#2c7a7b]/30">
                                        <HiOutlineDocumentText className="text-4xl text-[#2c7a7b] mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No invoice selected</p>
                                        <p className="text-sm text-gray-400 mt-1">Select an invoice from the list below to proceed</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleGenerateEwb} className="space-y-6">
                                        <div className="bg-[#e6f4f1] border border-blue-100 rounded-xl p-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-[#2c7a7b] block text-xs uppercase tracking-wider font-semibold">Invoice No</span>
                                                    <span className="font-bold text-[#0f2926]">{selectedEwbInvoice.invoice_number}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[#2c7a7b] block text-xs uppercase tracking-wider font-semibold">Date</span>
                                                    <span className="font-bold text-[#0f2926]">{formatDate(selectedEwbInvoice.invoice_date)}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-[#2c7a7b] block text-xs uppercase tracking-wider font-semibold">Recipient</span>
                                                    <span className="font-bold text-[#0f2926]">{selectedEwbInvoice.recipient_name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Distance (km) *</label>
                                                <input
                                                    type="number"
                                                    name="distance"
                                                    value={ewbForm.distance}
                                                    onChange={handleEwbFormChange}
                                                    className="w-full bg-transparent rounded-lg border border-[#2c7a7b] text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
                                                    placeholder="Example: 150"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Vehicle No</label>
                                                <input
                                                    type="text"
                                                    name="vehicleNo"
                                                    value={ewbForm.vehicleNo}
                                                    onChange={handleEwbFormChange}
                                                    className="w-full bg-transparent rounded-lg border border-[#2c7a7b] text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors uppercase"
                                                    placeholder="TN01AB1234"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Transporter ID</label>
                                                <input
                                                    type="text"
                                                    name="transId"
                                                    value={ewbForm.transId}
                                                    onChange={handleEwbFormChange}
                                                    className="w-full bg-transparent rounded-lg border border-[#2c7a7b] text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
                                                    placeholder="Transporter ID"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Transporter Name</label>
                                                <input
                                                    type="text"
                                                    name="transName"
                                                    value={ewbForm.transName}
                                                    onChange={handleEwbFormChange}
                                                    className="w-full bg-transparent rounded-lg border border-[#2c7a7b] text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-colors"
                                                    placeholder="Transporter Name"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={generatingEwb}
                                                className="w-full bg-[#1b9c85] hover:bg-[#168a75] text-white py-3 px-4 rounded-xl transition-colors shadow-lg font-bold flex items-center justify-center gap-2"
                                            >
                                                {generatingEwb ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        Generating...
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

                                {/* Available Invoices List */}
                                <div className="mt-8">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        Select Invoice for E-Way Bill
                                    </h3>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                        {ewbInvoices.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No pending invoices found.</p>
                                        ) : (
                                            ewbInvoices.map(invoice => (
                                                <div
                                                    key={invoice.id}
                                                    onClick={() => setSelectedEwbInvoice(invoice)}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedEwbInvoice?.id === invoice.id
                                                        ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                                                        : 'bg-gray-50 border-gray-200 hover:border-teal-300'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-gray-800">{invoice.invoice_number}</span>
                                                        <span className="text-xs text-gray-500">{formatDate(invoice.invoice_date)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 truncate max-w-[150px]">{invoice.recipient_name}</span>
                                                        <span className="font-medium text-teal-700">{formatCurrency(invoice.total_amount)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                                            onClick={() => viewQRCode(record)}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="View QR Code"
                                                        >
                                                            <HiOutlineQrcode className="text-lg" />
                                                        </button>
                                                        <button
                                                            onClick={() => downloadInvoicePDF(record)}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Download Invoice PDF"
                                                        >
                                                            <HiOutlinePrinter className="text-lg" />
                                                        </button>
                                                        {record.ewb_no && (
                                                            <button
                                                                onClick={() => downloadHistoryEwbPDF(record)}
                                                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                                title="Download E-Way Bill PDF"
                                                            >
                                                                <HiOutlineTruck className="text-lg" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => downloadJSON(record)}
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
                                        onClick={async () => {
                                            // Print E-Invoice using React-PDF
                                            const inv = generatedIRN.invoiceData || {};

                                            // Create PDF blob
                                            const blob = await pdf(
                                                <InvoicePDF
                                                    data={inv}
                                                    qrCode={generatedIRN.qrcode || generatedIRN.signedQrCode}
                                                    irn={generatedIRN.irn}
                                                    ackNo={generatedIRN.ackNo}
                                                />
                                            ).toBlob();

                                            // Open blob in new tab for printing
                                            const url = URL.createObjectURL(blob);
                                            const printWindow = window.open(url, '_blank');
                                            if (printWindow) {
                                                printWindow.onload = () => {
                                                    printWindow.print();
                                                    // Clean up after print dialog closes
                                                    setTimeout(() => URL.revokeObjectURL(url), 100);
                                                };
                                            }
                                        }}
                                        className="flex items-center justify-center gap-1 px-3 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium text-sm">
                                        <HiOutlinePrinter className="text-base" />
                                        Print
                                    </button>
                                    <button
                                        onClick={async () => {
                                            // Download E-Invoice using React-PDF
                                            const inv = generatedIRN.invoiceData || {};

                                            // Create PDF blob
                                            const blob = await pdf(
                                                <InvoicePDF
                                                    data={inv}
                                                    qrCode={generatedIRN.qrcode || generatedIRN.signedQrCode}
                                                    irn={generatedIRN.irn}
                                                    ackNo={generatedIRN.ackNo}
                                                />
                                            ).toBlob();

                                            // Download the blob
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `E-Invoice_${inv.invoiceNumber || 'invoice'}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            URL.revokeObjectURL(url);
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
                                        onClick={downloadEwbPDF}
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

            {/* QR Code Viewer Modal for History */}
            {
                showQRModal && selectedRecord && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fade-in text-center relative">
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <HiOutlineXCircle className="text-2xl" />
                            </button>

                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Invoice QR Code</h2>

                            <div className="bg-white p-4 rounded-xl border-4 border-gray-200 inline-block shadow-lg mb-6">
                                {selectedRecord.qrcode ? (
                                    <img
                                        src={selectedRecord.qrcode}
                                        alt="Invoice QR Code"
                                        className="w-64 h-64"
                                    />
                                ) : (
                                    <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                                        No QR Code
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p><span className="font-semibold">Invoice:</span> {selectedRecord.invoice_number}</p>
                                <p><span className="font-semibold">IRN:</span> <span className="font-mono text-xs">{selectedRecord.irn?.substring(0, 20)}...</span></p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>

    );
};


export default EInvoice;
