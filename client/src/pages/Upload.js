import React, { useState, useEffect } from 'react';
import {
    HiOutlineViewList,
    HiOutlineViewGrid,
    HiOutlineCalendar,
    HiOutlineDownload,
    HiOutlineDocumentText,
    HiOutlineReceiptTax,
    HiOutlineTruck,
    HiOutlineClipboard,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineTrash
} from 'react-icons/hi';
import AlertModal from '../components/AlertModal';


const Upload = () => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [uploadToGST, setUploadToGST] = useState(false);
    const [selectedBills, setSelectedBills] = useState([]);
    const [bills, setBills] = useState([]);

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

    // Get month name
    const getMonthName = (date) => {
        return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    };

    // Load bills from localStorage (invoices, e-invoices, delivery challans)
    useEffect(() => {
        const loadBills = () => {
            const allBills = [];

            // Load invoices
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            invoices.forEach(inv => {
                allBills.push({
                    id: `inv-${inv.id}`,
                    type: 'Invoice',
                    icon: HiOutlineDocumentText,
                    number: inv.invoiceNumber || inv.number,
                    date: inv.createdAt || inv.date,
                    customer: inv.customerName,
                    amount: inv.total || inv.amount,
                    data: inv
                });
            });

            // Load e-invoices from history (localStorage simulation)
            const einvoices = JSON.parse(localStorage.getItem('einvoiceHistory') || '[]');
            einvoices.forEach(einv => {
                allBills.push({
                    id: `einv-${einv.id}`,
                    type: 'E-Invoice',
                    icon: HiOutlineReceiptTax,
                    number: einv.invoice_number || einv.invoiceNumber,
                    date: einv.created_at || einv.createdAt,
                    customer: einv.recipient_name || einv.recipientName,
                    amount: einv.total_amount || einv.totalAmount,
                    irn: einv.irn,
                    data: einv
                });
            });

            // Load e-way bills
            const ewayBills = JSON.parse(localStorage.getItem('ewayBills') || '[]');
            ewayBills.forEach(ewb => {
                allBills.push({
                    id: `ewb-${ewb.id}`,
                    type: 'E-Way Bill',
                    icon: HiOutlineTruck,
                    number: ewb.ewbNo || ewb.number,
                    date: ewb.createdAt || ewb.date,
                    customer: ewb.recipientName,
                    validUpto: ewb.ewbValidUpto,
                    data: ewb
                });
            });

            // Load delivery challans
            const challans = JSON.parse(localStorage.getItem('deliveryChallans') || '[]');
            challans.forEach(ch => {
                allBills.push({
                    id: `dc-${ch.id}`,
                    type: 'Delivery Challan',
                    icon: HiOutlineClipboard,
                    number: ch.challanNumber,
                    date: ch.createdAt || ch.date,
                    customer: ch.customerName,
                    value: ch.value,
                    data: ch
                });
            });

            // Sort by date descending
            allBills.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Filter by selected month
            const filteredBills = allBills.filter(bill => {
                const billDate = new Date(bill.date);
                return billDate.getMonth() === selectedMonth.getMonth() &&
                    billDate.getFullYear() === selectedMonth.getFullYear();
            });

            setBills(filteredBills);
        };

        loadBills();
    }, [selectedMonth]);

    const handleMonthChange = (direction) => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedMonth(newDate);
    };

    const handleSelectBill = (billId) => {
        setSelectedBills(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        );
    };

    const handleSelectAll = () => {
        if (selectedBills.length === bills.length) {
            setSelectedBills([]);
        } else {
            setSelectedBills(bills.map(b => b.id));
        }
    };

    const handleDeleteSelected = () => {
        showAlert(
            'Delete Items?',
            `Are you sure you want to delete ${selectedBills.length} selected items? This action cannot be undone.`,
            'warning',
            () => {
                // Group IDs by type
                const idsToDelete = new Set(selectedBills);
                const remainingBills = bills.filter(b => !idsToDelete.has(b.id));
                setBills(remainingBills);
                setSelectedBills([]);

                // Update localStorage for each type
                const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                const newInvoices = invoices.filter(inv => !idsToDelete.has(`inv-${inv.id}`));
                localStorage.setItem('invoices', JSON.stringify(newInvoices));

                // E-invoices
                const einvoices = JSON.parse(localStorage.getItem('einvoiceHistory') || '[]');
                const newEinvoices = einvoices.filter(einv => !idsToDelete.has(`einv-${einv.id}`));
                localStorage.setItem('einvoiceHistory', JSON.stringify(newEinvoices));

                // E-Way Bills
                const ewayBills = JSON.parse(localStorage.getItem('ewayBills') || '[]');
                const newEwayBills = ewayBills.filter(ewb => !idsToDelete.has(`ewb-${ewb.id}`));
                localStorage.setItem('ewayBills', JSON.stringify(newEwayBills));

                // Delivery Challans
                const challans = JSON.parse(localStorage.getItem('deliveryChallans') || '[]');
                const newChallans = challans.filter(ch => !idsToDelete.has(`dc-${ch.id}`));
                localStorage.setItem('deliveryChallans', JSON.stringify(newChallans));

                showAlert('Deleted', 'Selected items have been deleted.', 'success');
            },
            'Delete'
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatAmount = (amount) => {
        if (!amount) return '-';
        return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="min-h-screen bg-green-50 p-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-6">
                {/* View Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-all cursor-pointer ${viewMode === 'list'
                            ? 'bg-primary text-white'
                            : 'bg-white text-primary hover:bg-primary/10'
                            }`}
                    >
                        <HiOutlineViewList className="text-xl" />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-xl transition-all cursor-pointer ${viewMode === 'grid'
                            ? 'bg-primary text-white'
                            : 'bg-white text-primary hover:bg-primary/10'
                            }`}
                    >
                        <HiOutlineViewGrid className="text-xl" />
                    </button>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleMonthChange(-1)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <HiOutlineChevronLeft className="text-xl" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl">
                        <span className="text-primary font-medium">{getMonthName(selectedMonth)}</span>
                        <HiOutlineCalendar className="text-primary text-lg" />
                    </div>
                    <button
                        onClick={() => handleMonthChange(1)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <HiOutlineChevronRight className="text-xl" />
                    </button>
                </div>

                {/* Select All & Upload to GST */}
                <div className="flex items-center gap-4">
                    <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${selectedBills.length === bills.length && bills.length > 0
                            ? 'bg-primary border-primary'
                            : 'bg-white border-primary/30'
                            }`}
                        onClick={handleSelectAll}
                        title="Select All"
                    >
                        {selectedBills.length === bills.length && bills.length > 0 && (
                            <span className="text-white text-sm">✓</span>
                        )}
                    </div>
                    <button
                        onClick={() => showAlert('Coming Soon', 'Upload to GST functionality coming soon!', 'info')}
                        className="bg-primary px-4 py-2 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                        Upload to GST
                    </button>
                </div>
            </div>

            {/* Bills Display */}
            {bills.length === 0 ? (
                <div className="text-center py-20 text-primary/50">
                    <img src="/assets/Audit-amico.png" alt="Empty" className="w-80 h-80 mx-auto mb-4" />
                    <p className="text-lg">No bills found for {getMonthName(selectedMonth)}</p>
                </div>
            ) : viewMode === 'list' ? (
                /* List View */
                <div className="space-y-3">
                    {bills.map((bill) => {
                        const Icon = bill.icon;
                        const isSelected = selectedBills.includes(bill.id);

                        return (
                            <div
                                key={bill.id}
                                className="bg-primary rounded-2xl p-5 flex items-center justify-between transition-all hover:shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <Icon className="text-2xl text-white/70" />
                                    <div>
                                        <p className="text-white font-semibold">{bill.number || 'N/A'}</p>
                                        <p className="text-white/60 text-sm">{bill.type}</p>
                                    </div>
                                </div>
                                <div className="text-white/80 text-sm">{bill.customer || '-'}</div>
                                <div className="text-white/80 text-sm">{formatDate(bill.date)}</div>
                                <div className="text-emerald-300 font-semibold">{formatAmount(bill.amount || bill.value)}</div>
                                <div
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-white border-white' : 'bg-transparent border-white/50'
                                        }`}
                                    onClick={() => handleSelectBill(bill.id)}
                                >
                                    {isSelected && <span className="text-primary text-sm">✓</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {bills.map((bill) => {
                        const Icon = bill.icon;
                        const isSelected = selectedBills.includes(bill.id);

                        return (
                            <div
                                key={bill.id}
                                className="bg-primary rounded-2xl p-5 aspect-square flex flex-col justify-between transition-all hover:shadow-lg relative"
                            >
                                <div
                                    className={`absolute top-4 right-4 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-white border-white' : 'bg-transparent border-white/50'
                                        }`}
                                    onClick={() => handleSelectBill(bill.id)}
                                >
                                    {isSelected && <span className="text-primary text-sm">✓</span>}
                                </div>

                                <div>
                                    <Icon className="text-3xl text-white/70 mb-3" />
                                    <p className="text-white font-semibold text-lg">{bill.number || 'N/A'}</p>
                                    <p className="text-white/60 text-sm">{bill.type}</p>
                                </div>

                                <div>
                                    <p className="text-white/70 text-xs">{bill.customer || '-'}</p>
                                    <p className="text-emerald-300 font-semibold mt-1">{formatAmount(bill.amount || bill.value)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Bar (when bills selected) */}
            {selectedBills.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary rounded-2xl px-6 py-4 flex items-center gap-6 shadow-2xl">
                    <span className="text-white font-medium">{selectedBills.length} selected</span>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer">
                        <HiOutlineDownload className="text-lg" />
                        Download All
                    </button>
                    <button
                        onClick={() => setSelectedBills([])}
                        className="text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-200 border border-red-500/50 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    >
                        <HiOutlineTrash className="text-lg" />
                        Delete
                    </button>
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

export default Upload;
