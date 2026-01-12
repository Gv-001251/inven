import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import {
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineDotsVertical
} from 'react-icons/hi';
import { FaBarcode } from 'react-icons/fa';

const FinishedProducts = () => {
  // --- State Management ---
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('MANUFACTURED');
  const [formData, setFormData] = useState({
    quantity: '',
    reason: '',
    userName: localStorage.getItem('userName') || 'Supervisor'
  });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Barcode Scanning State
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanAction, setScanAction] = useState('MANUFACTURED');
  const [scanQuantity, setScanQuantity] = useState(1);
  const [scanReason, setScanReason] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // API calls using centralized instance
      const [productsRes, transactionsRes] = await Promise.all([
        api.get('/finished-products'),
        api.get('/finished-products/transactions')
      ]);

      if (productsRes.data.success) {
        setProducts(productsRes.data.data);
        setStats(productsRes.data.stats);
      }

      if (transactionsRes.data.success) {
        setTransactions(transactionsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback for demo/dev if API fails
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleOpenModal = (product, action) => {
    setSelectedProduct(product);
    setActionType(action);
    setFormData({
      quantity: '',
      reason: '',
      userName: localStorage.getItem('userName') || 'Supervisor'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.quantity || formData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    if (actionType === 'DISPATCHED' && formData.quantity > selectedProduct.stock) {
      alert('Cannot dispatch more than available stock!');
      return;
    }

    try {
      const response = await api.post('/finished-products/update-stock', {
        productId: selectedProduct.id,
        action: actionType,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
        userName: formData.userName
      });

      if (response.data.success) {
        alert(`${actionType} successfully! New stock: ${response.data.newStock}`);
        setShowModal(false);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleExport = (data, filename) => {
    // Simple CSV export logic
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  // --- Barcode Logic ---
  const handleBarcodeScan = async () => {
    setScanError('');
    setScanSuccess('');
    setScannedProduct(null);

    if (!barcodeInput.trim()) {
      setScanError('Please enter a barcode');
      return;
    }

    try {
      const response = await api.get(`/finished-products?barcode=${encodeURIComponent(barcodeInput.trim())}`);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const product = response.data.data[0];
        setScannedProduct(product);
        setScanSuccess(`✓ Product found: ${product.product_name}`);
      } else {
        setScanError('❌ Product not found. Please check the barcode.');
      }
    } catch (error) {
      setScanError('❌ Error scanning barcode. Please try again.');
    }
  };

  const handleBarcodeSubmit = async () => {
    if (!scannedProduct) return;
    setScanError('');
    setScanSuccess('');

    if (!scanQuantity || scanQuantity <= 0) {
      setScanError('Please enter a valid quantity');
      return;
    }
    if (scanAction === 'DISPATCHED' && scanQuantity > scannedProduct.stock) {
      setScanError('Cannot dispatch more than available stock!');
      return;
    }

    try {
      const response = await api.post('/finished-products/update-stock', {
        productId: scannedProduct.id,
        action: scanAction,
        quantity: parseInt(scanQuantity),
        reason: scanReason || (scanAction === 'MANUFACTURED' ? 'Manufacturing completed' : 'Product dispatched'),
        userName: localStorage.getItem('userName') || 'Supervisor'
      });

      if (response.data.success) {
        setScanSuccess(`✓ ${scanAction} successfully! New stock: ${response.data.newStock}`);
        setBarcodeInput('');
        setScanQuantity(1);
        setScanReason('');
        setScannedProduct(null);
        fetchAllData();
        setTimeout(() => setScanSuccess(''), 3000);
      }
    } catch (error) {
      setScanError('Error processing transaction.');
    }
  };

  // --- Filtering ---
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // --- UI Helpers ---
  const getActionColorDetails = (action) => {
    switch (action) {
      case 'MANUFACTURED': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'In Stock' };
      case 'DISPATCHED': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sold' };
      case 'RETURNED': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Returned' };
      case 'DAMAGED': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Damaged' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: action };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-mint">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint p-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Finished Products</h1>
          <p className="text-secondary text-sm mt-1">Manage manufactured inventory and dispatches.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExport(products, 'finished-products.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            <HiOutlineDownload className="text-lg" /> Export
          </button>

          <button
            onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-semibold transition-colors 
                    ${showBarcodeScanner ? 'bg-primary text-white border-primary' : 'bg-white border-primary text-primary hover:bg-primary/5'}`}
          >
            <FaBarcode /> {showBarcodeScanner ? 'Close Scanner' : 'Bar Code Scanner'}
          </button>
        </div>
      </div>

      {/* Barcode Scanner Section (Collapsible) */}
      {showBarcodeScanner && (
        <div className="bg-white rounded-2xl shadow-sm border border-primary/5 p-6 mb-8 animate-fade-in-down">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <FaBarcode /> Quick Stock Update
          </h2>
          <div className="flex gap-4 mb-4">
            <input
              autoFocus
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan()}
              placeholder="Scan barcode or type here..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={handleBarcodeScan} className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-light transition-colors">
              Scan
            </button>
          </div>

          {/* Feedback Messages */}
          {scanError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium mb-4">{scanError}</div>}
          {scanSuccess && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium mb-4">{scanSuccess}</div>}

          {/* Scanned Product Actions */}
          {scannedProduct && (
            <div className="mt-6 p-6 bg-mint/30 rounded-xl border border-primary/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Product</span>
                  <div className="font-bold text-primary">{scannedProduct.product_name}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Stock</span>
                  <div className="font-bold text-primary">{scannedProduct.stock} units</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Category</span>
                  <div className="font-bold text-gray-700">{scannedProduct.category}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold">Barcode</span>
                  <div className="font-mono text-primary">{scannedProduct.barcode}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Action</label>
                  <select
                    value={scanAction}
                    onChange={(e) => setScanAction(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-primary"
                  >
                    <option value="MANUFACTURED">Stock In (Manufacturing)</option>
                    <option value="DISPATCHED">Dispatch (Order)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={scanQuantity}
                    onChange={(e) => setScanQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-primary text-center font-bold"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Reason</label>
                  <input
                    type="text"
                    value={scanReason}
                    onChange={(e) => setScanReason(e.target.value)}
                    placeholder="Order #..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={handleBarcodeSubmit}
                    className="w-full py-2 bg-emerald-custon bg-primary text-white font-bold rounded-lg hover:brightness-110"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex flex-col gap-8">

        {/* Section 1: All Finished Products */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-primary">All Finished Products</h2>

            {/* Search & Filter */}
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold w-12 text-center rounded-tl-lg">
                      <div className="w-4 h-4 border-2 border-white/50 rounded mx-auto"></div>
                    </th>
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Product Name</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold text-center">Specification</th>
                    <th className="p-4 font-semibold text-center">Stock Status</th>
                    <th className="p-4 font-semibold text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600">
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-400">No products found.</td></tr>
                  ) : (
                    filteredProducts.map((product, idx) => (
                      <tr key={product.id} className={`border-b border-gray-50 last:border-0 hover:bg-emerald-50/30 transition-colors ${idx % 2 === 0 ? 'bg-mint/20' : 'bg-white'}`}>
                        <td className="p-4 text-center">
                          <div className="w-4 h-4 border-2 border-gray-300 rounded mx-auto cursor-pointer"></div>
                        </td>
                        <td className="p-4 font-mono text-xs text-emerald-800/60">
                          COMP-{String(product.id || idx + 1).padStart(3, '0')}
                        </td>
                        <td className="p-4 font-semibold text-primary">{product.product_name}</td>
                        <td className="p-4 text-gray-500">{product.category}</td>
                        <td className="p-4 text-center font-mono text-xs">{product.specification || '30'}</td>
                        <td className="p-4 text-center">
                          <span className={`font-bold ${product.stock > 0 ? 'text-primary' : 'text-red-500'}`}>
                            ${product.stock}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {/* Functionality: using the buttons to open Modal */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal(product, 'MANUFACTURED')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Add Stock"
                            >
                              <HiOutlinePlus />
                            </button>
                            <button
                              onClick={() => handleOpenModal(product, 'DISPATCHED')}
                              disabled={product.stock <= 0}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Dispatch"
                            >
                              <HiOutlineTruck />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-primary">
                              <HiOutlineDotsVertical />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary">Recent Transactions</h2>
            <button
              onClick={() => handleExport(transactions, 'transactions.csv')}
              className="flex items-center gap-2 text-emerald-custom font-bold text-sm hover:text-emerald-700"
            >
              <HiOutlineDownload /> Export
            </button>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold w-12 text-center rounded-tl-lg">
                      <div className="w-4 h-4 border-2 border-white/50 rounded mx-auto"></div>
                    </th>
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold text-center">Quantity</th>
                    <th className="p-4 font-semibold rounded-tr-lg">User</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600">
                  {transactions.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-400">No transactions recorded.</td></tr>
                  ) : (
                    transactions.slice(0, 10).map((txn, idx) => {
                      const status = getActionColorDetails(txn.action);
                      return (
                        <tr key={idx} className={`border-b border-gray-50 last:border-0 hover:bg-emerald-50/30 transition-colors ${idx % 2 === 0 ? 'bg-mint/20' : 'bg-white'}`}>
                          <td className="p-4 text-center">
                            <div className="w-4 h-4 border-2 border-gray-300 rounded mx-auto cursor-pointer"></div>
                          </td>
                          <td className="p-4 font-mono text-xs text-emerald-800/60">
                            COMP-{String(txn.id || idx + 1).padStart(3, '0')}
                          </td>
                          <td className="p-4 text-xs font-medium text-gray-500">
                            {new Date(txn.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 font-medium text-primary">
                            {txn.product_name}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-gray-700">
                            {txn.quantity}
                          </td>
                          <td className="p-4 text-xs font-semibold text-gray-500 uppercase">
                            {txn.user_name}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Manual Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {actionType === 'MANUFACTURED' ? 'Add Stock' : 'Dispatch Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="bg-mint/30 p-4 rounded-xl mb-6 border border-primary/10">
              <h4 className="font-bold text-primary">{selectedProduct?.product_name}</h4>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Current Stock</span>
                <span className="font-bold text-gray-800">{selectedProduct?.stock} units</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={actionType === 'DISPATCHED' ? selectedProduct?.stock : undefined}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-bold text-lg"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Reason / Notes</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm"
                  placeholder="Add notes..."
                  rows="2"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg 
                            ${actionType === 'MANUFACTURED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinishedProducts;
