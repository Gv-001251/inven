import React, { useState, useEffect, useMemo } from 'react';
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
    HiOutlineExclamationCircle
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

const EInvoice = () => {
    const { hasPermission, user } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState('sales');

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
        ]
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

    // Load history on mount
    useEffect(() => {
        loadHistory();
        loadStats();
    }, [selectedBusiness]);

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            const { data } = await api.get('/einvoice/history', {
                params: { gstin: selectedBusiness.gstin }
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
            const { data } = await api.get('/einvoice/stats', {
                params: { gstin: selectedBusiness.gstin }
            });
            setStats(data || { pending: 0, successToday: 0, failed: 0 });
        } catch (error) {
            console.error('Failed to load stats:', error);
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
                loadHistory();
                loadStats();

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

    return (
        <div className="min-h-screen bg-mint p-8">
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

            {/* Tabs */}
            <div className="bg-white rounded-t-2xl border-b border-gray-200">
                <div className="flex overflow-x-auto">
                    {[
                        { id: 'sales', label: 'Sales Bills' },
                        { id: 'purchase', label: 'Purchase Bills' },
                        { id: 'history', label: 'IRN History' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors relative
                                ${activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-gray-500 hover:text-primary'
                                }`}
                        >
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
                {(activeTab === 'sales' || activeTab === 'purchase') && (
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
                        <div className="flex justify-end">
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
                    </form>
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
            {showSuccessModal && generatedIRN && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="text-center space-y-6">
                            {/* Success Header */}
                            <div className="flex items-center justify-center gap-3 text-emerald-600">
                                <HiOutlineCheckCircle className="text-4xl" />
                                <h2 className="text-2xl font-bold">IRN Generated Successfully!</h2>
                            </div>

                            {/* IRN Display - Tally Prime Style */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                                <p className="text-sm text-gray-600 mb-2">IRN Number</p>
                                <p className="text-xl font-mono font-bold text-blue-900 tracking-wider break-all">
                                    {generatedIRN.irn}
                                </p>
                            </div>

                            {/* QR Code Display */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-800">Verification QR Code</h3>
                                {generatedIRN.qrcode ? (
                                    <div className="bg-white p-4 rounded-xl border-4 border-emerald-200 inline-block shadow-lg">
                                        <img
                                            src={generatedIRN.qrcode}
                                            alt="IRN QR Code"
                                            className="w-64 h-64 mx-auto"
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

                            {/* Action Buttons - Tally Prime Style */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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

                                        // Number to words helper
                                        const numberToWords = (num) => {
                                            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
                                                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                                            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                                            if (num === 0) return 'Zero';
                                            if (num < 20) return ones[num];
                                            if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
                                            if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
                                            if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
                                            if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
                                            return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
                                        };

                                        const amountInWords = (amt) => {
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
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary/5 transition-colors font-medium"
                                >
                                    <HiOutlinePrinter className="text-lg" />
                                    🖨️ Print Invoice
                                </button>
                                <button
                                    onClick={() => {
                                        // Download Signed JSON
                                        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(generatedIRN.signedInvoice || JSON.stringify({ irn: generatedIRN.irn }))}`;
                                        const dlAnchorElem = document.createElement('a');
                                        dlAnchorElem.setAttribute('href', dataStr);
                                        dlAnchorElem.setAttribute('download', `IRN-${generatedIRN.irn}-signed.json`);
                                        dlAnchorElem.click();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                                >
                                    <HiOutlineDownload className="text-lg" />
                                    💾 Download JSON
                                </button>
                                <button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EInvoice;

