import React, { useEffect, useState, useRef } from 'react';
import {
    HiOutlineUpload,
    HiOutlineCalendar,
    HiOutlineSearch,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineDocumentText,
    HiOutlineDownload,
    HiOutlineFilter,
    HiOutlineEye
} from 'react-icons/hi';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const GSTUpload = () => {
    const { hasPermission, user } = useAuth();

    // Records state
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    // Filter state
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Sales form state
    const [salesForm, setSalesForm] = useState({
        file: null,
        businessDate: '',
        customerName: '',
        invoiceAmount: '',
        gstAmount: ''
    });

    // Purchase form state
    const [purchaseForm, setPurchaseForm] = useState({
        file: null,
        businessDate: '',
        vendorName: '',
        totalAmount: '',
        gstAmount: ''
    });

    // File input refs
    const salesFileRef = useRef(null);
    const purchaseFileRef = useRef(null);

    const loadRecords = async () => {
        try {
            setLoading(true);
            const params = filterType !== 'all' ? `?type=${filterType}` : '';
            const { data } = await api.get(`/gst/records${params}`);
            setRecords(data?.records || []);
        } catch (error) {
            console.error('Failed to load GST records:', error);
            setMessage({ type: 'error', text: 'Failed to load records.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [filterType]);

    const handleSalesFormChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setSalesForm(prev => ({ ...prev, file: files[0] }));
        } else {
            setSalesForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePurchaseFormChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setPurchaseForm(prev => ({ ...prev, file: files[0] }));
        } else {
            setPurchaseForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSalesUpload = async (e) => {
        e.preventDefault();

        if (!salesForm.file) {
            setMessage({ type: 'error', text: 'Please select a file to upload.' });
            return;
        }

        if (!salesForm.businessDate) {
            setMessage({ type: 'error', text: 'Please select a business date.' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', salesForm.file);
            formData.append('type', 'sales');
            formData.append('business_date', salesForm.businessDate);
            formData.append('metadata', JSON.stringify({
                customer_name: salesForm.customerName,
                amount: salesForm.invoiceAmount,
                gst_amount: salesForm.gstAmount
            }));

            const { data } = await api.post('/gst/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success) {
                setMessage({ type: 'success', text: 'Sales bill uploaded successfully!' });
                setSalesForm({ file: null, businessDate: '', customerName: '', invoiceAmount: '', gstAmount: '' });
                if (salesFileRef.current) salesFileRef.current.value = '';
                loadRecords();
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Upload failed.' });
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || 'Failed to upload sales bill.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    const handlePurchaseUpload = async (e) => {
        e.preventDefault();

        if (!purchaseForm.file) {
            setMessage({ type: 'error', text: 'Please select a file to upload.' });
            return;
        }

        if (!purchaseForm.businessDate) {
            setMessage({ type: 'error', text: 'Please select a business date.' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('file', purchaseForm.file);
            formData.append('type', 'purchase');
            formData.append('business_date', purchaseForm.businessDate);
            formData.append('metadata', JSON.stringify({
                vendor_name: purchaseForm.vendorName,
                amount: purchaseForm.totalAmount,
                gst_amount: purchaseForm.gstAmount
            }));

            const { data } = await api.post('/gst/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (data.success) {
                setMessage({ type: 'success', text: 'Purchase bill uploaded successfully!' });
                setPurchaseForm({ file: null, businessDate: '', vendorName: '', totalAmount: '', gstAmount: '' });
                if (purchaseFileRef.current) purchaseFileRef.current.value = '';
                loadRecords();
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Upload failed.' });
            }
        } catch (error) {
            const errorMsg = error?.response?.data?.message || 'Failed to upload purchase bill.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    const filteredRecords = records.filter(record => {
        const matchesSearch =
            record.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        if (!amount && amount !== 0) return '-';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading && records.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-mint">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mint p-8">
            {/* Page Header */}
            <h1 className="text-3xl font-extrabold text-primary mb-8">GST Upload</h1>

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

            {/* Upload Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

                {/* Sales Bills Upload */}
                <div className="bg-primary rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-custom/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-custom/20 rounded-lg">
                                <HiOutlineDocumentText className="text-2xl text-emerald-custom" />
                            </div>
                            <h2 className="text-xl font-bold">Sales Bill Upload</h2>
                        </div>

                        <form onSubmit={handleSalesUpload} className="space-y-4">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Select File (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    ref={salesFileRef}
                                    onChange={handleSalesFormChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-custom file:text-white hover:file:bg-emerald-500 cursor-pointer"
                                />
                                {salesForm.file && (
                                    <p className="mt-2 text-sm text-emerald-300">Selected: {salesForm.file.name}</p>
                                )}
                            </div>

                            {/* Business Date */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Business Date *</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="businessDate"
                                        value={salesForm.businessDate}
                                        onChange={handleSalesFormChange}
                                        required
                                        className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                    />
                                    <HiOutlineCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg" />
                                </div>
                            </div>

                            {/* Customer Name */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Customer Name</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={salesForm.customerName}
                                    onChange={handleSalesFormChange}
                                    placeholder="Enter customer name"
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            {/* Invoice Amount & GST */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Invoice Amount</label>
                                    <input
                                        type="number"
                                        name="invoiceAmount"
                                        value={salesForm.invoiceAmount}
                                        onChange={handleSalesFormChange}
                                        placeholder="₹ 0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">GST Amount</label>
                                    <input
                                        type="number"
                                        name="gstAmount"
                                        value={salesForm.gstAmount}
                                        onChange={handleSalesFormChange}
                                        placeholder="₹ 0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-3 bg-[#D1FAE5] text-primary font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineUpload className="text-lg" />
                                        Upload Sales Bill
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Purchase Bills Upload */}
                <div className="bg-primary rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <HiOutlineDocumentText className="text-2xl text-amber-400" />
                            </div>
                            <h2 className="text-xl font-bold">Purchase Bill Upload</h2>
                        </div>

                        <form onSubmit={handlePurchaseUpload} className="space-y-4">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Select File (PDF, JPG, PNG)</label>
                                <input
                                    type="file"
                                    ref={purchaseFileRef}
                                    onChange={handlePurchaseFormChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                                />
                                {purchaseForm.file && (
                                    <p className="mt-2 text-sm text-amber-300">Selected: {purchaseForm.file.name}</p>
                                )}
                            </div>

                            {/* Business Date */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Business Date *</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="businessDate"
                                        value={purchaseForm.businessDate}
                                        onChange={handlePurchaseFormChange}
                                        required
                                        className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    />
                                    <HiOutlineCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg" />
                                </div>
                            </div>

                            {/* Vendor Name */}
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Vendor Name</label>
                                <input
                                    type="text"
                                    name="vendorName"
                                    value={purchaseForm.vendorName}
                                    onChange={handlePurchaseFormChange}
                                    placeholder="Enter vendor name"
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            {/* Total Amount & GST */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Total Amount</label>
                                    <input
                                        type="number"
                                        name="totalAmount"
                                        value={purchaseForm.totalAmount}
                                        onChange={handlePurchaseFormChange}
                                        placeholder="₹ 0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">GST Amount</label>
                                    <input
                                        type="number"
                                        name="gstAmount"
                                        value={purchaseForm.gstAmount}
                                        onChange={handlePurchaseFormChange}
                                        placeholder="₹ 0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-3 bg-amber-400 text-primary font-bold rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineUpload className="text-lg" />
                                        Upload Purchase Bill
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* GST Records Table */}
            <div>
                <h2 className="text-xl font-bold text-primary mb-6">Uploaded GST Records</h2>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <HiOutlineFilter className="text-primary" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                        >
                            <option value="all">All Records</option>
                            <option value="sales">Sales Only</option>
                            <option value="purchase">Purchase Only</option>
                        </select>
                    </div>
                </div>

                <div className="bg-primary rounded-2xl overflow-hidden shadow-lg border border-primary/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary-dark/20 text-white/70 text-[10px] uppercase tracking-wider">
                                    <th className="p-4 font-bold text-white">Type</th>
                                    <th className="p-4 font-bold text-white">File Name</th>
                                    <th className="p-4 font-bold text-white">Business Date</th>
                                    <th className="p-4 font-bold text-white">Vendor/Customer</th>
                                    <th className="p-4 font-bold text-white text-right">Amount</th>
                                    <th className="p-4 font-bold text-white text-right">GST</th>
                                    <th className="p-4 font-bold text-white">Uploaded By</th>
                                    <th className="p-4 font-bold text-white">Uploaded At</th>
                                    <th className="p-4 font-bold text-white text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="p-8 text-center text-white/50">
                                            {loading ? 'Loading records...' : 'No records found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record, idx) => (
                                        <tr
                                            key={record.id}
                                            className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-primary' : 'bg-[#0E423D]'
                                                }`}
                                        >
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${record.type === 'sales'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {record.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white/90 text-xs font-medium max-w-[150px] truncate" title={record.file_name}>
                                                {record.file_name}
                                            </td>
                                            <td className="p-4 text-white/80 text-xs font-medium">
                                                {formatDate(record.business_date)}
                                            </td>
                                            <td className="p-4 text-white/80 text-xs font-medium">
                                                {record.type === 'sales' ? record.customer_name : record.vendor_name || '-'}
                                            </td>
                                            <td className="p-4 text-white/80 text-xs font-medium text-right">
                                                {formatAmount(record.total_amount)}
                                            </td>
                                            <td className="p-4 text-emerald-300 text-xs font-medium text-right">
                                                {formatAmount(record.gst_amount)}
                                            </td>
                                            <td className="p-4 text-white/80 text-xs font-bold">
                                                {record.uploaded_by_name}
                                            </td>
                                            <td className="p-4 text-white/60 text-[10px] font-mono">
                                                {formatDateTime(record.created_at)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <a
                                                        href={record.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                        title="View File"
                                                    >
                                                        <HiOutlineEye className="text-white/80" />
                                                    </a>
                                                    <a
                                                        href={record.file_url}
                                                        download={record.file_name}
                                                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                        title="Download File"
                                                    >
                                                        <HiOutlineDownload className="text-white/80" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Record Count */}
                <div className="mt-4 text-sm text-primary/60">
                    Showing {filteredRecords.length} of {records.length} records
                </div>
            </div>
        </div>
    );
};

export default GSTUpload;
