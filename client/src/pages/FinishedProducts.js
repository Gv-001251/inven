import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiOutlineRefresh, HiOutlinePlus, HiOutlineTruck, HiOutlineCheckCircle } from 'react-icons/hi';
import { FaBarcode } from 'react-icons/fa';

const FinishedProducts = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('MANUFACTURED');
  const [formData, setFormData] = useState({
    quantity: '',
    reason: '',
    userName: localStorage.getItem('userName') || 'Supervisor'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Barcode scanning states
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
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const [productsRes, transactionsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/finished-products', config),
        axios.get('http://localhost:5001/api/finished-products/transactions', config)
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
    } finally {
      setLoading(false);
    }
  };

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
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const response = await axios.post(
        'http://localhost:5001/api/finished-products/update-stock',
        {
          productId: selectedProduct.id,
          action: actionType,
          quantity: parseInt(formData.quantity),
          reason: formData.reason,
          userName: formData.userName
        },
        config
      );

      if (response.data.success) {
        alert(`${actionType} successfully! New stock: ${response.data.newStock}`);
        setShowModal(false);
        fetchAllData();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock: ' + error.message);
    }
  };

  // Barcode scanning functions
  const handleBarcodeScan = async () => {
    setScanError('');
    setScanSuccess('');
    setScannedProduct(null);

    if (!barcodeInput.trim()) {
      setScanError('Please enter a barcode');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      // Search for product by barcode
      const response = await axios.get(
        `http://localhost:5001/api/finished-products?barcode=${encodeURIComponent(barcodeInput.trim())}`,
        config
      );

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const product = response.data.data[0];
        setScannedProduct(product);
        setScanSuccess(`✓ Product found: ${product.product_name}`);
      } else {
        setScanError('❌ Product not found. Please check the barcode.');
      }
    } catch (error) {
      setScanError('❌ Error scanning barcode. Please try again.');
      console.error('Barcode scan error:', error);
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
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const response = await axios.post(
        'http://localhost:5001/api/finished-products/update-stock',
        {
          productId: scannedProduct.id,
          action: scanAction,
          quantity: parseInt(scanQuantity),
          reason: scanReason || (scanAction === 'MANUFACTURED' ? 'Manufacturing completed' : 'Product dispatched'),
          userName: localStorage.getItem('userName') || 'Supervisor'
        },
        config
      );

      if (response.data.success) {
        setScanSuccess(`✓ ${scanAction} successfully! New stock: ${response.data.newStock}`);
        
        // Reset form
        setBarcodeInput('');
        setScanQuantity(1);
        setScanReason('');
        setScannedProduct(null);
        
        // Refresh data
        fetchAllData();

        // Auto-clear success message after 3 seconds
        setTimeout(() => {
          setScanSuccess('');
        }, 3000);
      }
    } catch (error) {
      setScanError('Error processing transaction. Please try again.');
      console.error('Transaction error:', error);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getActionColor = (action) => {
    switch(action) {
      case 'MANUFACTURED': return '#10b981';
      case 'DISPATCHED': return '#3b82f6';
      case 'RETURNED': return '#f59e0b';
      case 'DAMAGED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const styles = {
    container: {
      padding: '1.5rem',
      background: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: 0
    },
    subtitle: {
      fontSize: '0.95rem',
      color: '#666',
      marginTop: '0.25rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    },
    refreshBtn: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    barcodeBtn: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    statCard: (bgColor) => ({
      background: bgColor,
      padding: '1.25rem',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }),
    statLabel: {
      fontSize: '0.75rem',
      opacity: 0.9,
      marginBottom: '0.5rem',
      letterSpacing: '0.5px'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '0.25rem'
    },
    statSubtitle: {
      fontSize: '0.8rem',
      opacity: 0.85
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      marginBottom: '1.5rem'
    },
    scannerCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
      marginBottom: '1.5rem',
      border: '2px solid #e9d5ff'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    filterSection: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem',
      flexWrap: 'wrap'
    },
    searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '10px 15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '0.9rem'
    },
    select: {
      padding: '10px 15px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '0.9rem',
      background: 'white',
      cursor: 'pointer'
    },
    barcodeInputGroup: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    barcodeInput: {
      flex: 1,
      padding: '12px 15px',
      border: '2px solid #e9d5ff',
      borderRadius: '8px',
      fontSize: '1rem',
      fontFamily: 'monospace',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    scanBtn: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.95rem',
      transition: 'all 0.3s ease'
    },
    alertBox: (type) => ({
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '1rem',
      border: `2px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`,
      background: type === 'error' ? '#fee2e2' : '#dcfce7',
      color: type === 'error' ? '#dc2626' : '#16a34a',
      fontWeight: '500',
      fontSize: '0.9rem'
    }),
    scannedProductBox: {
      background: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem'
    },
    productInfo: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem'
    },
    infoItem: {
      fontSize: '0.85rem'
    },
    infoLabel: {
      color: '#6b7280',
      marginBottom: '0.25rem',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    infoValue: {
      fontWeight: '700',
      color: '#1f2937',
      fontSize: '1rem'
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.85rem'
    },
    th: {
      background: '#f8f9fa',
      padding: '0.75rem',
      textAlign: 'left',
      fontWeight: '600',
      color: '#495057',
      borderBottom: '2px solid #e9ecef',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #f0f0f0'
    },
    actionBtn: (bgColor, disabled = false) => ({
      padding: '6px 12px',
      background: disabled ? '#e9ecef' : bgColor,
      color: disabled ? '#6c757d' : 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '0.75rem',
      fontWeight: '500',
      marginRight: '0.5rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      opacity: disabled ? 0.6 : 1
    }),
    badge: (bgColor) => ({
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: bgColor,
      color: 'white'
    }),
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      width: '90%',
      maxWidth: '500px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#1a1a1a'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    label: {
      display: 'block',
      fontSize: '0.85rem',
      fontWeight: '500',
      marginBottom: '0.5rem',
      color: '#495057'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '0.9rem',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '10px',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '0.9rem',
      minHeight: '80px',
      boxSizing: 'border-box',
      resize: 'vertical'
    },
    modalActions: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    submitBtn: (bgColor) => ({
      flex: 1,
      padding: '12px',
      background: bgColor || 'linear-gradient(135deg, #0d9488, #14b8a6)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    }),
    cancelBtn: {
      flex: 1,
      padding: '12px',
      background: '#e9ecef',
      color: '#495057',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.95rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏭 Finished Products Management</h1>
          <p style={styles.subtitle}>Manage manufactured products and dispatch operations</p>
        </div>
        <div style={styles.buttonGroup}>
          <button 
            style={styles.barcodeBtn} 
            onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
          >
            <FaBarcode size={18} />
            {showBarcodeScanner ? 'Hide Scanner' : 'Barcode Scanner'}
          </button>
          <button style={styles.refreshBtn} onClick={fetchAllData}>
            <HiOutlineRefresh size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard('linear-gradient(135deg, #10b981, #059669)')}>
          <div style={styles.statLabel}>TOTAL STOCK</div>
          <div style={styles.statValue}>{stats.totalStock}</div>
          <div style={styles.statSubtitle}>units available</div>
        </div>
        <div style={styles.statCard('linear-gradient(135deg, #3b82f6, #2563eb)')}>
          <div style={styles.statLabel}>PRODUCT TYPES</div>
          <div style={styles.statValue}>{stats.totalProducts}</div>
          <div style={styles.statSubtitle}>varieties</div>
        </div>
        <div style={styles.statCard('linear-gradient(135deg, #8b5cf6, #7c3aed)')}>
          <div style={styles.statLabel}>CATEGORIES</div>
          <div style={styles.statValue}>{stats.categories}</div>
          <div style={styles.statSubtitle}>product lines</div>
        </div>
        <div style={styles.statCard(stats.lowStockCount > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6b7280, #4b5563)')}>
          <div style={styles.statLabel}>LOW STOCK</div>
          <div style={styles.statValue}>{stats.lowStockCount}</div>
          <div style={styles.statSubtitle}>need production</div>
        </div>
      </div>

      {/* Barcode Scanner Section */}
      {showBarcodeScanner && (
        <div style={styles.scannerCard}>
          <h3 style={styles.cardTitle}>
            <FaBarcode size={20} style={{color: '#8b5cf6'}} />
            Quick Stock Update - Barcode Scanner
          </h3>
          
          <div style={styles.barcodeInputGroup}>
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan()}
              placeholder="Scan or type barcode (e.g., FP-SC-007)"
              style={styles.barcodeInput}
              autoFocus
            />
            <button onClick={handleBarcodeScan} style={styles.scanBtn}>
              Scan
            </button>
          </div>

          {scanError && (
            <div style={styles.alertBox('error')}>
              {scanError}
            </div>
          )}

          {scanSuccess && (
            <div style={styles.alertBox('success')}>
              {scanSuccess}
            </div>
          )}

          {scannedProduct && (
            <div style={styles.scannedProductBox}>
              <div style={styles.productInfo}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Product Name</div>
                  <div style={styles.infoValue}>{scannedProduct.product_name}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Category</div>
                  <div style={styles.infoValue}>{scannedProduct.category}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Current Stock</div>
                  <div style={styles.infoValue}>{scannedProduct.stock} units</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Barcode</div>
                  <div style={{...styles.infoValue, color: '#8b5cf6'}}>{scannedProduct.barcode}</div>
                </div>
              </div>

              <div style={styles.actionGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Action</label>
                  <select
                    value={scanAction}
                    onChange={(e) => setScanAction(e.target.value)}
                    style={styles.select}
                  >
                    <option value="MANUFACTURED">Stock In (Manufacturing)</option>
                    <option value="DISPATCHED">Dispatch (Customer Order)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={scanAction === 'DISPATCHED' ? scannedProduct.stock : undefined}
                    value={scanQuantity}
                    onChange={(e) => setScanQuantity(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Reason (Optional)</label>
                <input
                  type="text"
                  value={scanReason}
                  onChange={(e) => setScanReason(e.target.value)}
                  placeholder="e.g., Order #1234, Bulk manufacturing"
                  style={styles.input}
                />
              </div>

              <button
                onClick={handleBarcodeSubmit}
                style={styles.submitBtn(
                  scanAction === 'MANUFACTURED' 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'linear-gradient(135deg, #3b82f6, #2563eb)'
                )}
              >
                {scanAction === 'MANUFACTURED' ? (
                  <>
                    <HiOutlinePlus size={18} />
                    Add {scanQuantity} Unit(s) to Stock
                  </>
                ) : (
                  <>
                    <HiOutlineTruck size={18} />
                    Dispatch {scanQuantity} Unit(s)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>All Finished Products</h3>
        </div>

        <div style={styles.filterSection}>
          <input
            type="text"
            placeholder="🔍 Search products or barcodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={styles.select}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Specification</th>
                <th style={{...styles.th, textAlign: 'center'}}>Stock</th>
                <th style={{...styles.th, textAlign: 'center'}}>Status</th>
                <th style={{...styles.th, textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{...styles.td, textAlign: 'center', padding: '2rem'}}>
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{...styles.td, textAlign: 'center', padding: '2rem', color: '#666'}}>
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>
                      <strong style={{display: 'block', marginBottom: '2px'}}>{product.product_name}</strong>
                      <div style={{fontSize: '0.75rem', color: '#8b5cf6', fontFamily: 'monospace', fontWeight: '600'}}>
                        {product.barcode}
                      </div>
                    </td>
                    <td style={styles.td}>{product.category}</td>
                    <td style={styles.td}>{product.specification}</td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <span style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: product.stock > 0 ? '#10b981' : '#dc3545'
                      }}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      {product.stock > product.min_stock ? (
                        <span style={styles.badge('#10b981')}>✓ Ready</span>
                      ) : product.stock > 0 ? (
                        <span style={styles.badge('#f59e0b')}>⚠ Low</span>
                      ) : (
                        <span style={styles.badge('#dc3545')}>✗ Empty</span>
                      )}
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <button
                        style={styles.actionBtn('#10b981')}
                        onClick={() => handleOpenModal(product, 'MANUFACTURED')}
                      >
                        <HiOutlinePlus size={14} />
                        Add Stock
                      </button>
                      <button
                        style={styles.actionBtn('#3b82f6', product.stock === 0)}
                        onClick={() => handleOpenModal(product, 'DISPATCHED')}
                        disabled={product.stock === 0}
                      >
                        <HiOutlineTruck size={14} />
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Recent Transactions</h3>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date & Time</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Action</th>
                <th style={{...styles.th, textAlign: 'center'}}>Quantity</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>User</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{...styles.td, textAlign: 'center', padding: '2rem', color: '#666'}}>
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 20).map((txn, index) => (
                  <tr key={index}>
                    <td style={styles.td}>
                      {new Date(txn.timestamp).toLocaleString()}
                    </td>
                    <td style={styles.td}>{txn.product_name}</td>
                    <td style={styles.td}>
                      <span style={{
                        color: getActionColor(txn.action),
                        fontWeight: '600'
                      }}>
                        {txn.action}
                      </span>
                    </td>
                    <td style={{...styles.td, textAlign: 'center', fontWeight: '700'}}>
                      {txn.quantity}
                    </td>
                    <td style={styles.td}>{txn.reason}</td>
                    <td style={styles.td}>{txn.user_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {actionType === 'MANUFACTURED' ? '✅ Add Manufactured Stock' : '🚚 Dispatch Product'}
            </h2>
            <p style={{color: '#666', marginBottom: '1.5rem'}}>
              <strong>{selectedProduct?.product_name}</strong><br />
              <span style={{fontSize: '0.85rem', color: '#8b5cf6', fontFamily: 'monospace', fontWeight: '600'}}>
                {selectedProduct?.barcode}
              </span><br />
              Current Stock: <strong>{selectedProduct?.stock} units</strong>
            </p>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={actionType === 'DISPATCHED' ? selectedProduct?.stock : undefined}
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  style={styles.input}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Reason / Notes</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  style={styles.textarea}
                  placeholder="Enter reason or notes (optional)"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Your Name</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({...formData, userName: e.target.value})}
                  style={styles.input}
                  placeholder="Enter your name"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitBtn()}>
                  <HiOutlineCheckCircle size={18} />
                  Confirm {actionType === 'MANUFACTURED' ? 'Add' : 'Dispatch'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
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
