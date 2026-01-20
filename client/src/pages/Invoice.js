import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import html2pdf from 'html2pdf.js';
import {
  HiOutlineDownload,
  HiOutlineMail,
  HiOutlineSave,
  HiOutlinePlus,
  HiOutlineTrash,
} from 'react-icons/hi';
import AlertModal from '../components/AlertModal';

const Invoice = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerGST: '',
    items: [{ itemName: '', hsn: '', quantity: 1, rate: 0, gst: 18, amount: 0 }],
    discount: 0,
    taxPercentage: 18,
    currency: 'INR',
    invoiceNumber: 'INV-0001', // Will be updated by useEffect
    notes: 'Thank you for your business. Please make payment within 7 days.'
  });

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [signatureImage, setSignatureImage] = useState(null);

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

  // Handle signature upload
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('File Too Large', 'Signature file must be less than 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate sequential invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      const response = await api.get('/invoices/list');
      const existingInvoices = response.data.data || [];

      if (existingInvoices.length === 0) {
        return 'INV-0001';
      }

      // Find the highest invoice number
      let maxNumber = 0;
      existingInvoices.forEach(inv => {
        const invNum = inv.invoiceNumber || inv.invoice_number || '';
        const match = invNum.match(/INV-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });

      // Generate next number with padding
      const nextNumber = maxNumber + 1;
      return `INV-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error fetching invoice count:', error);
      // Fallback: use timestamp-based number
      return `INV-${String(Date.now()).slice(-4)}`;
    }
  };

  // Fetch next invoice number on component mount AND load saved form data
  useEffect(() => {
    const initInvoice = async () => {
      // Load saved form data from localStorage
      const savedFormData = localStorage.getItem('invoiceFormData');
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          setFormData(parsed);
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      } else {
        // Generate new invoice number only if no saved data
        const nextNumber = await generateNextInvoiceNumber();
        setFormData(prev => ({ ...prev, invoiceNumber: nextNumber }));
      }
    };
    initInvoice();
  }, []);

  // Save form data to localStorage whenever it changes (for persistence)
  useEffect(() => {
    // Only save if there's meaningful data
    if (formData.invoiceNumber) {
      localStorage.setItem('invoiceFormData', JSON.stringify(formData));
    }
  }, [formData]);

  // Load saved invoices from localStorage on mount
  useEffect(() => {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    setInvoices(savedInvoices);
  }, []);

  // Sync form data to localStorage for E-Invoice integration
  useEffect(() => {
    // Only save if there's meaningful data
    if (formData.customerName || formData.customerGST || formData.items[0]?.itemName) {
      const sharedInvoiceData = {
        invoiceNumber: formData.invoiceNumber,
        customerName: formData.customerName,
        customerGST: formData.customerGST,
        customerAddress: formData.customerAddress,
        customerPhone: formData.customerPhone,
        items: formData.items.map(item => ({
          product: item.itemName,
          hsn: item.hsn || '8414',
          qty: item.quantity,
          rate: item.rate,
          gstPercent: item.gst || 18
        })),
        vehicleNumber: formData.vehicleNumber || '',
        transportDistance: formData.transportDistance || ''
      };
      localStorage.setItem('sharedInvoiceData', JSON.stringify(sharedInvoiceData));
    }
  }, [formData]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', hsn: '', quantity: 1, rate: 0, gst: 18, amount: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'itemName' ? value : parseFloat(value) || 0;

    if (field === 'quantity' || field === 'rate') {
      const baseAmount = newItems[index].quantity * newItems[index].rate;
      newItems[index].amount = baseAmount;
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * formData.taxPercentage) / 100;
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + taxAmount - discount;

    return { subtotal, taxAmount, discount, total };
  };

  const totals = calculateTotals();

  // Save Invoice to localStorage
  const handleSaveInvoice = () => {
    // Validate required fields
    if (!formData.customerName) {
      showAlert('Missing Details', 'Please enter customer name', 'warning');
      return;
    }
    if (!formData.items[0]?.itemName) {
      showAlert('Empty Invoice', 'Please add at least one item', 'warning');
      return;
    }

    // Create invoice object
    const newInvoice = {
      id: Date.now(),
      invoiceNumber: formData.invoiceNumber,
      date: new Date().toISOString(),
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerPhone: formData.customerPhone,
      customerGST: formData.customerGST,
      items: formData.items,
      taxPercentage: formData.taxPercentage,
      discount: formData.discount,
      notes: formData.notes,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      cgst: totals.taxAmount / 2,
      sgst: totals.taxAmount / 2,
      vehicleNumber: formData.vehicleNumber,
      transportDistance: formData.transportDistance,
      createdAt: new Date().toISOString(),
      status: 'saved'
    };

    // Get existing invoices from localStorage
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');

    // Add new invoice
    const updatedInvoices = [newInvoice, ...existingInvoices];

    // Save to localStorage
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    // Update state
    setInvoices(updatedInvoices);

    // Generate next invoice number
    const nextNumber = parseInt(formData.invoiceNumber.replace('INV-', '')) + 1;

    // Reset form with new invoice number
    setFormData({
      invoiceNumber: `INV-${nextNumber}`,
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      customerGST: '',
      items: [{ itemName: '', hsn: '', quantity: 1, rate: 0, gst: 18, amount: 0 }],
      taxPercentage: 18,
      discount: 0,
      notes: '',
      vehicleNumber: '',
      transportDistance: ''
    });

    // Clear saved form data since invoice is now saved
    localStorage.removeItem('invoiceFormData');

    showAlert('Success', 'Invoice saved successfully!', 'success');
  };

  // Delete Invoice
  const handleDeleteInvoice = (id) => {
    showAlert(
      'Delete Invoice?',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      'warning',
      () => {
        const updatedInvoices = invoices.filter(inv => inv.id !== id);
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        setInvoices(updatedInvoices);
        showAlert('Deleted', 'Invoice has been deleted.', 'success');
      },
      'Delete'
    );
  };

  // Download Invoice as PDF
  const handleDownloadInvoice = () => {
    const invoiceElement = document.getElementById('invoice-preview');

    if (!invoiceElement) {
      showAlert('Error', 'Invoice preview not found. Please try again.', 'error');
      return;
    }

    // PDF options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Invoice_${formData.invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate and download PDF from existing element
    html2pdf().set(opt).from(invoiceElement).save();
  };

  const handleSubmit = async (type) => {
    setLoading(true);
    try {
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        gstTotal: totals.taxAmount,
        grandTotal: totals.total,
        invoiceDate: new Date(),
        paymentStatus: 'pending'
      };

      await api.post('/invoices/create', invoiceData);

      alert(`Invoice ${type === 'send' ? 'sent' : 'saved'} successfully!`);

      // Generate next invoice number and reset form
      const nextNumber = await generateNextInvoiceNumber();
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerGST: '',
        items: [{ itemName: '', quantity: 1, rate: 0, gst: 18, amount: 0 }],
        discount: 0,
        taxPercentage: 18,
        currency: 'INR',
        invoiceNumber: nextNumber,
        notes: 'Thank you for your business. Please make payment within 7 days.'
      });

    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices/list');
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // setInvoices([]); // Keep empty on error to show empty state
    }
  };

  const downloadPDF = (billNumber) => {
    // For direct links, we can use the base URL from the api config logic or hardcode relative if proxy setup, 
    // but here we are fixing the port mismatch so direct localhost:5000 is safer than 5001
    // Ideally we should export BASE_URL from axios.js but for now hardcoding 5000 is better than 5001.
    window.open(`http://localhost:5000/api/invoices/download/${billNumber}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-mint p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-primary">Invoice</h1>
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
          New Invoice
        </button>
        <button
          onClick={() => { setActiveTab('list'); fetchInvoices(); }}
          className={`pb-1 text-base font-bold transition-all ${activeTab === 'list'
            ? 'text-primary border-b-2 border-primary'
            : 'text-gray-500 hover:text-primary'
            }`}
        >
          View Invoices
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="max-w-5xl mx-auto">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleSaveInvoice}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all text-sm"
            >
              <HiOutlineSave className="text-lg" /> Save Invoice
            </button>
            <button
              onClick={() => handleSubmit('send')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all text-sm"
            >
              <HiOutlineMail className="text-lg" /> {loading ? 'Sending...' : 'Send Invoice'}
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all text-sm"
            >
              <HiOutlineDownload className="text-lg" /> Download
            </button>
          </div>

          <h2 className="text-xl font-bold text-primary mb-6">Invoice Details</h2>

          {/* Form Container - Dark Green */}
          <div className="bg-primary rounded-3xl p-8 mb-12 shadow-xl text-white">

            {/* Bill to & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Bill to</label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Phone no</label>
                <input
                  type="tel"
                  placeholder="Customer Phone no"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Address & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Address</label>
                <textarea
                  placeholder="Customer Address"
                  rows="3"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Customer Email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Currency & Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Currency</label>
                <select
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none appearance-none cursor-not-allowed opacity-80"
                  disabled
                >
                  <option className="bg-primary text-white">Indian Rupee (INR)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Invoice Number</label>
                  <div className="bg-emerald-custom/20 border border-emerald-custom/40 rounded-lg px-4 py-3 text-emerald-300 font-mono text-sm text-center">
                    {formData.invoiceNumber || 'Auto-Generated'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">GST Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.customerGST}
                    onChange={(e) => setFormData({ ...formData, customerGST: e.target.value })}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all text-sm"
                  />
                </div>
              </div>
            </div>


            {/* Transportation Details (Optional) */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Transportation Details (for E-Way Bill)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TN38AB1234"
                    value={formData.vehicleNumber || ''}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Approx Distance (km)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={formData.transportDistance || ''}
                    onChange={(e) => setFormData({ ...formData, transportDistance: e.target.value })}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-4">Item Details</h3>
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase text-white/60 mb-2 px-2">
                <div className="col-span-4">ITEM(s)</div>
                <div className="col-span-2 text-center">HSN</div>
                <div className="col-span-1 text-center">QTY</div>
                <div className="col-span-2 text-center">PRICE</div>
                <div className="col-span-2 text-right">TOTAL</div>
                <div className="col-span-1"></div>
              </div>
              <div className="border-b border-white/20 mb-4"></div>
            </div>

            <div className="space-y-4 mb-6">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center px-2">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Item Name"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="HSN Code"
                      value={item.hsn || ''}
                      onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-center text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-all text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-center text-white focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-center text-white focus:outline-none focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div className="col-span-2 text-right font-bold text-emerald-300 py-2">
                    ₹{item.amount.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right">
                    {formData.items.length > 1 && (
                      <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-300 transition-colors">
                        <HiOutlineTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddItem}
              className="w-full py-3 border border-dashed border-white/30 rounded-xl text-white/70 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all flex items-center justify-center gap-2 mb-8"
            >
              <HiOutlinePlus /> Add Item
            </button>

            {/* Tax & Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tax Percentage</label>
                <div className="bg-transparent border border-white/30 rounded-lg px-4 py-3 flex items-center justify-between">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                    className="bg-transparent text-white focus:outline-none w-20"
                  />
                  <span className="text-white/60 text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Discount (%)</label>
                <div className="bg-transparent border border-white/30 rounded-lg px-4 py-3 flex items-center justify-between">
                  <input
                    type="number"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="bg-transparent text-white focus:outline-none w-full"
                    placeholder="Enter discount amount"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Notes / Terms</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-all resize-none h-24"
              />
            </div>

            {/* Digital Signature Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-white/80 mb-2">Digital Signature</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="bg-transparent border border-dashed border-white/30 rounded-lg px-4 py-4 text-center hover:border-emerald-400 transition-all">
                    {signatureImage ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={signatureImage} alt="Signature" className="h-12 object-contain" />
                        <span className="text-emerald-400 text-sm">Signature uploaded ✓</span>
                      </div>
                    ) : (
                      <div className="text-white/50 text-sm">
                        <span className="text-emerald-400">Click to upload</span> signature image (PNG, JPG - Max 2MB)
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                </label>
                {signatureImage && (
                  <button
                    type="button"
                    onClick={() => setSignatureImage(null)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Invoice Preview (Paper) - New Clean Design */}
          <div id="invoice-preview" className="bg-white shadow-2xl mx-auto max-w-[800px] min-h-[900px]">
            {/* Top Header Bar */}
            <div className="bg-gray-100 text-center py-2 text-xs text-gray-500">
              {new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Breeze Techniques - Invoice {formData.invoiceNumber}
            </div>

            <div className="p-10">
              {/* Header Section - Company Info & Invoice Details */}
              <div className="flex justify-between items-start mb-8">
                {/* Left - Company Info */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">Breeze Techniques</h1>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Business Number</span> +91 8056765859
                  </p>
                  <p className="text-sm text-gray-600">113-MAKKAVI NAGAR, IRUGUR</p>
                  <p className="text-sm text-gray-600">COIMBATORE</p>
                  <p className="text-sm text-gray-600">641103</p>
                  <p className="text-sm text-gray-600 mt-2">+91 8056765859</p>
                  <p className="text-sm text-gray-600">breezetech@yahoo.com</p>
                </div>

                {/* Right - Invoice Details */}
                <div className="text-right">
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 uppercase font-medium">INVOICE</p>
                    <p className="text-base font-bold text-gray-900">{formData.invoiceNumber}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-500 uppercase font-medium">DATE</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">DUE</p>
                    <p className="text-xs font-medium text-gray-900">On Receipt</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Bill To Section */}
              <div className="mb-6">
                <p className="text-[10px] text-gray-500 uppercase font-medium mb-1">BILL TO</p>
                <h2 className="text-base font-bold text-gray-900 uppercase">{formData.customerName || 'Customer Name'}</h2>
                <p className="text-xs text-gray-600 mt-1">{formData.customerAddress || 'Customer Address'}</p>
                {formData.customerPhone && <p className="text-xs text-gray-600">Ph: {formData.customerPhone}</p>}
                {formData.customerGST && <p className="text-xs text-gray-600">GSTIN: {formData.customerGST}</p>}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Items Table */}
              <div className="mb-6">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-gray-500 pb-2 border-b border-gray-200">
                  <div className="col-span-6">DESCRIPTION</div>
                  <div className="col-span-2 text-right">RATE</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-2 text-right">AMOUNT</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 py-3 items-start">
                      <div className="col-span-6">
                        <p className="font-semibold text-sm text-gray-900 uppercase">{item.itemName || 'Item Name'}</p>
                        {item.hsn && <p className="text-[10px] text-gray-500 mt-0.5">HSN {item.hsn}</p>}
                      </div>
                      <div className="col-span-2 text-right text-xs text-gray-700">
                        ₹{(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-2 text-center text-xs text-gray-700">
                        {item.quantity || 0}
                      </div>
                      <div className="col-span-2 text-right text-xs font-medium text-gray-900">
                        ₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section with Transport Details Side by Side */}
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between">
                  {/* Left - Transportation Details */}
                  <div className="w-56">
                    {(formData.vehicleNumber || formData.transportDistance) && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">TRANSPORT INFO</p>
                        {formData.vehicleNumber && (
                          <div className="flex justify-between py-1 text-xs">
                            <span className="text-gray-600">Vehicle No</span>
                            <span className="text-gray-900 font-medium">{formData.vehicleNumber}</span>
                          </div>
                        )}
                        {formData.transportDistance && (
                          <div className="flex justify-between py-1 text-xs">
                            <span className="text-gray-600">Distance</span>
                            <span className="text-gray-900 font-medium">{formData.transportDistance} km</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Right - Totals */}
                  <div className="w-56">
                    <div className="flex justify-between py-1.5 text-xs">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-xs">
                      <span className="text-gray-600">CGST ({formData.taxPercentage / 2}%)</span>
                      <span className="text-gray-900">₹{(totals.taxAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-xs">
                      <span className="text-gray-600">SGST ({formData.taxPercentage / 2}%)</span>
                      <span className="text-gray-900">₹{(totals.taxAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-red-600">-₹{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 text-sm border-t border-gray-200 mt-2">
                      <span className="font-bold text-gray-900">TOTAL</span>
                      <span className="font-bold text-gray-900">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="mt-16 flex flex-col items-center">
                <div className="w-48 h-16 flex items-end justify-center mb-2">
                  {signatureImage ? (
                    <img src={signatureImage} alt="Signature" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <svg viewBox="0 0 200 60" className="w-full h-full text-gray-300">
                      <path d="M20,40 Q40,20 60,35 T100,30 T140,40 T180,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500 uppercase font-medium">DATE SIGNED</p>
                <p className="text-sm text-emerald-600 font-medium">
                  {new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div >
      )}

      {/* View Invoices (List) */}
      {
        activeTab === 'list' && (
          <div className="animate-fade-in-up">
            {invoices.length === 0 ? (
              // Empty State Logic
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  {/* Circle Background */}
                  <div className="absolute inset-0 bg-emerald-custom/10 blur-3xl rounded-full transform scale-150"></div>

                  {/* 
                             USER INSTRUCTION:
                             Replace this URL with the uploaded illustration.
                         */}
                  <img
                    src="/assets/Invoice-rafiki.png"
                    alt="No Invoices"
                    className="relative w-64 h-64 object-contain opacity-90"
                  />
                </div>
                <h2 className="text-primary text-xl font-medium">No Invoices Found</h2>
              </div>
            ) : (
              // Table View
              <div className="bg-white rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary text-white text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Bill Number</th>
                        <th className="p-4 font-semibold">Customer</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Amount</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-600">
                      {invoices.map((inv, idx) => (
                        <tr key={inv.id || inv._id || idx} className={`border-b border-gray-50 last:border-0 hover:bg-mint/10 ${idx % 2 === 0 ? 'bg-mint/20' : 'bg-white'}`}>
                          <td className="p-4 font-mono text-xs font-bold text-primary">{inv.invoiceNumber || inv.billNumber || '-'}</td>
                          <td className="p-4 font-medium">{inv.customerName || 'Unknown'}</td>
                          <td className="p-4 text-gray-500">{new Date(inv.date || inv.invoiceDate || Date.now()).toLocaleDateString('en-IN')}</td>
                          <td className="p-4 font-bold text-gray-800">₹{(inv.total || inv.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${(inv.status || inv.paymentStatus) === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                              (inv.status || inv.paymentStatus) === 'saved' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                              {inv.status || inv.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(inv)}
                              className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors mr-2"
                              title="Download PDF"
                            >
                              <HiOutlineDownload />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                              title="Delete Invoice"
                            >
                              <HiOutlineTrash />
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
        )
      }

      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={alert.onConfirm}
        confirmText={alert.confirmText}
      />
    </div >
  );
};

export default Invoice;
