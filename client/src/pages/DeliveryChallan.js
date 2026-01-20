import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import {
    HiOutlineDownload,
    HiOutlineSave,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlinePrinter,
} from 'react-icons/hi';
import AlertModal from '../components/AlertModal';

const DeliveryChallan = () => {
    const [formData, setFormData] = useState({
        challanNumber: 'DC-0001',
        challanDate: new Date().toISOString().split('T')[0],
        poNumber: '',
        poDate: '',
        customerName: '',
        customerAddress: '',
        transport: '',
        consignedTo: '',
        partySalesTaxNo: '',
        items: [{ particulars: '', qty: 1, noOfPacks: 1 }],
        valueOfConsignment: '',
        notes: ''
    });

    const [challans, setChallans] = useState([]);
    const [activeTab, setActiveTab] = useState('create');
    const [loading, setLoading] = useState(false);

    // Alert State
    const [alert, setAlert] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        confirmText: 'Confirm'
    });

    const showAlert = (title, message, type = 'info', onConfirm = null, confirmText = 'Confirm') => {
        setAlert({ isOpen: true, title, message, type, onConfirm, confirmText });
    };

    const closeAlert = () => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    };

    const handleDeleteChallan = (id) => {
        showAlert(
            'Delete Challan?',
            'Are you sure you want to delete this delivery challan? This action cannot be undone.',
            'warning',
            () => {
                const updatedChallans = challans.filter(ch => ch.id !== id);
                setChallans(updatedChallans);
                localStorage.setItem('deliveryChallans', JSON.stringify(updatedChallans));
                showAlert('Deleted', 'Delivery Challan has been deleted.', 'success');
            },
            'Delete'
        );
    };

    // Generate sequential challan number
    useEffect(() => {
        const savedChallans = JSON.parse(localStorage.getItem('deliveryChallans') || '[]');
        setChallans(savedChallans);

        if (savedChallans.length > 0) {
            let maxNumber = 0;
            savedChallans.forEach(ch => {
                const match = ch.challanNumber?.match(/DC-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) maxNumber = num;
                }
            });
            setFormData(prev => ({
                ...prev,
                challanNumber: `DC-${String(maxNumber + 1).padStart(4, '0')}`
            }));
        }
    }, []);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { particulars: '', qty: 1, noOfPacks: 1 }]
        });
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = field === 'particulars' ? value : parseInt(value) || 0;
        setFormData({ ...formData, items: newItems });
    };

    const handleSave = () => {
        const newChallan = {
            ...formData,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };

        const updatedChallans = [...challans, newChallan];
        setChallans(updatedChallans);
        localStorage.setItem('deliveryChallans', JSON.stringify(updatedChallans));

        // Reset form with next number
        const nextNumber = parseInt(formData.challanNumber.replace('DC-', '')) + 1;
        setFormData({
            ...formData,
            challanNumber: `DC-${String(nextNumber).padStart(4, '0')}`,
            poNumber: '',
            poDate: '',
            customerName: '',
            customerAddress: '',
            transport: '',
            consignedTo: '',
            partySalesTaxNo: '',
            items: [{ particulars: '', qty: 1, noOfPacks: 1 }],
            valueOfConsignment: '',
            notes: ''
        });

        showAlert('Success', 'Delivery Challan saved successfully!', 'success');
    };

    const handleDownload = () => {
        const element = document.getElementById('challan-preview');
        if (!element) return;

        const opt = {
            margin: 10,
            filename: `DeliveryChallan_${formData.challanNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handlePrint = () => {
        const printContent = document.getElementById('challan-preview');
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Challan ${formData.challanNumber}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
    };

    return (
        <div className="min-h-screen bg-mint p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-primary">Delivery Challan</h1>
                <p className="text-primary/60 text-sm mt-1">Create and manage delivery challans</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 mb-8">
                <button
                    onClick={() => setActiveTab('create')}
                    className={`pb-1 text-base font-bold transition-all ${activeTab === 'create'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    New Challan
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`pb-1 text-base font-bold transition-all ${activeTab === 'list'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-500 hover:text-primary'
                        }`}
                >
                    View Challans
                </button>
            </div>

            {activeTab === 'create' && (
                <div className="max-w-5xl mx-auto">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 mb-8">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all text-sm"
                        >
                            <HiOutlineSave className="text-lg" /> Save Challan
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all text-sm"
                        >
                            <HiOutlineDownload className="text-lg" /> Download
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all text-sm"
                        >
                            <HiOutlinePrinter className="text-lg" /> Print
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-primary mb-6">Challan Details</h2>

                    {/* Form Container */}
                    <div className="bg-primary rounded-3xl p-8 mb-12 shadow-xl text-white">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Challan No.</label>
                                <div className="bg-emerald-custom/20 border border-emerald-custom/40 rounded-lg px-4 py-3 text-emerald-300 font-mono text-sm">
                                    {formData.challanNumber}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={formData.challanDate}
                                    onChange={(e) => setFormData({ ...formData, challanDate: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Transport</label>
                                <input
                                    type="text"
                                    placeholder="Transport details"
                                    value={formData.transport}
                                    onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                        </div>

                        {/* PO Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Your P.O. No.</label>
                                <input
                                    type="text"
                                    placeholder="Purchase Order Number"
                                    value={formData.poNumber}
                                    onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">P.O. Date</label>
                                <input
                                    type="date"
                                    value={formData.poDate}
                                    onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">M/s. (Customer Name)</label>
                                <input
                                    type="text"
                                    placeholder="Customer/Company Name"
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Material Despatched to</label>
                                <input
                                    type="text"
                                    placeholder="Despatch location"
                                    value={formData.customerAddress}
                                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                        </div>

                        {/* Consigned To */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/80 mb-2">Consigned to</label>
                            <textarea
                                placeholder="Full consignee address"
                                rows="2"
                                value={formData.consignedTo}
                                onChange={(e) => setFormData({ ...formData, consignedTo: e.target.value })}
                                className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 resize-none"
                            />
                        </div>

                        {/* Items */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Items / Particulars</h3>
                            <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase text-white/60 mb-2 px-2">
                                <div className="col-span-1">Sl.No</div>
                                <div className="col-span-7">PARTICULARS</div>
                                <div className="col-span-2 text-center">QTY</div>
                                <div className="col-span-1 text-center">PACKS</div>
                                <div className="col-span-1"></div>
                            </div>
                            <div className="border-b border-white/20 mb-4"></div>

                            <div className="space-y-3">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-center px-2">
                                        <div className="col-span-1 text-white/60">{index + 1}</div>
                                        <div className="col-span-7">
                                            <input
                                                type="text"
                                                placeholder="Item description"
                                                value={item.particulars}
                                                onChange={(e) => handleItemChange(index, 'particulars', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-center text-white focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.noOfPacks}
                                                onChange={(e) => handleItemChange(index, 'noOfPacks', e.target.value)}
                                                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-center text-white focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>
                                        <div className="col-span-1 text-right">
                                            {formData.items.length > 1 && (
                                                <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-300">
                                                    <HiOutlineTrash />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAddItem}
                                className="w-full mt-4 py-3 border border-dashed border-white/30 rounded-xl text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                            >
                                <HiOutlinePlus /> Add Item
                            </button>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Party's Sales Tax Regn. No.</label>
                                <input
                                    type="text"
                                    placeholder="Tax registration number"
                                    value={formData.partySalesTaxNo}
                                    onChange={(e) => setFormData({ ...formData, partySalesTaxNo: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">Value of Consignment (Rs.)</label>
                                <input
                                    type="text"
                                    placeholder="Value in Rupees"
                                    value={formData.valueOfConsignment}
                                    onChange={(e) => setFormData({ ...formData, valueOfConsignment: e.target.value })}
                                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Challan Preview */}
                    <div id="challan-preview" className="bg-white shadow-2xl mx-auto max-w-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {/* Header */}
                        <div style={{ backgroundColor: '#333', padding: '8px', textAlign: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>DELIVERY CHALLAN</h2>
                        </div>

                        <div style={{ padding: '20px', border: '2px solid #000' }}>
                            {/* Company Header */}
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>BREEZE TECHNIQUES</h1>
                                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>ADDRESS: 113-MAKKAVI NAGAR, IRUGUR, COIMBATORE - 641103</p>
                                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>TEL: +91 8056765859</p>
                            </div>

                            {/* No and Date Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 0' }}>
                                <div><strong>No.</strong> {formData.challanNumber}</div>
                                <div><strong>Date:</strong> {new Date(formData.challanDate).toLocaleDateString('en-IN')}</div>
                            </div>

                            {/* M/s Row */}
                            <div style={{ marginBottom: '15px', padding: '8px', borderBottom: '1px solid #ddd' }}>
                                <strong>M/s.</strong> {formData.customerName || '...................................'}
                            </div>

                            {/* PO and Transport Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '10px', borderBottom: '1px solid #000' }}>
                                <div style={{ padding: '8px', borderRight: '1px solid #000' }}>
                                    <strong>Your P.O. No.:</strong> {formData.poNumber}
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <strong>Date:</strong> {formData.poDate ? new Date(formData.poDate).toLocaleDateString('en-IN') : ''}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '10px', borderBottom: '1px solid #000' }}>
                                <div style={{ padding: '8px', borderRight: '1px solid #000' }}>
                                    <strong>Material Despatched to:</strong> {formData.customerAddress}
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <strong>Transport:</strong> {formData.transport}
                                </div>
                            </div>

                            {/* Consigned To */}
                            <div style={{ marginBottom: '15px', padding: '8px', borderBottom: '1px solid #000' }}>
                                <strong>Consigned to:</strong> {formData.consignedTo}
                            </div>

                            {/* Items Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#333' }}>
                                        <th style={{ border: '1px solid #000', padding: '8px', width: '10%', color: '#fff' }}>Sl.No.</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', width: '60%', color: '#fff' }}>PARTICULARS</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', width: '15%', color: '#fff' }}>Qty.</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', width: '15%', color: '#fff' }}>No. of Packs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.particulars}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>{item.noOfPacks}</td>
                                        </tr>
                                    ))}
                                    {/* Party's Sales Tax Row */}
                                    <tr>
                                        <td colSpan="4" style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            <strong>Party's Sales Tax Regn. No.:</strong> {formData.partySalesTaxNo}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Footer Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
                                <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                                    <p><strong>Value of the Consignment:</strong> Rs. {formData.valueOfConsignment}</p>
                                    <p><strong>E. & O.E.</strong></p>
                                    <p>1. Interest at 24% will be charged from due date.</p>
                                    <p>2. Goods once sold will not be taken back.</p>
                                    <p>3. Our responsibility ceases once the goods are delivered.</p>
                                    <p>4. All disputes subject to Coimbatore Jurisdiction.</p>
                                    <p><strong>TIN No.:</strong> ..................</p>
                                    <p><strong>CST No.:</strong> ..................</p>
                                    <br />
                                    <p><strong>Receiver's Signature</strong></p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p><strong>For BREEZE TECHNIQUES</strong></p>
                                    <div style={{ height: '80px' }}></div>
                                    <p><strong>AUTHORISED SIGNATORY</strong></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Challans List */}
            {activeTab === 'list' && (
                <div className="animate-fade-in-up">
                    {challans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-custom/10 blur-3xl rounded-full transform scale-150"></div>
                                <div className="relative w-64 h-64 flex items-center justify-center">
                                    <HiOutlineDownload className="text-8xl text-primary/30" />
                                </div>
                            </div>
                            <h2 className="text-primary text-xl font-medium">No Delivery Challans Found</h2>
                            <p className="text-primary/60 mt-2">Create your first delivery challan to get started</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-primary text-white text-xs uppercase tracking-wider">
                                            <th className="p-4 font-semibold">Challan No.</th>
                                            <th className="p-4 font-semibold">Customer</th>
                                            <th className="p-4 font-semibold">Date</th>
                                            <th className="p-4 font-semibold">Items</th>
                                            <th className="p-4 font-semibold">Value</th>
                                            <th className="p-4 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-gray-600">
                                        {challans.map((ch, idx) => (
                                            <tr key={ch.id} className={`border-b border-gray-50 last:border-0 hover:bg-mint/10 ${idx % 2 === 0 ? 'bg-mint/20' : 'bg-white'}`}>
                                                <td className="p-4 font-mono text-xs font-bold text-primary">{ch.challanNumber}</td>
                                                <td className="p-4 font-medium">{ch.customerName}</td>
                                                <td className="p-4 text-gray-500">{new Date(ch.challanDate).toLocaleDateString('en-IN')}</td>
                                                <td className="p-4">{ch.items?.length || 0} items</td>
                                                <td className="p-4 font-bold text-gray-800">₹{ch.valueOfConsignment || '0'}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteChallan(ch.id)}
                                                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                        title="Delete Challan"
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
                    )}
                </div>
            )}

            <AlertModal
                isOpen={alert.isOpen}
                onClose={closeAlert}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onConfirm={alert.onConfirm}
                confirmText={alert.confirmText}
            />
        </div>
    );
};

export default DeliveryChallan;
