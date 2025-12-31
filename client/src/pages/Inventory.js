import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineRefresh,
  HiOutlineBeaker,
  HiOutlineQrcode,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineDownload,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState({ items: [], lowStock: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ barcode: '', action: 'IN', quantity: 1, reason: '' });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [lookedUpItem, setLookedUpItem] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());

  const loadInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (query) => {
    if (!query || query.trim() === '') {
      setLookedUpItem(null);
      setLookupAttempted(false);
      return;
    }
    setLookingUp(true);
    setLookupAttempted(false);
    try {
      const { data } = await api.get(`/inventory/lookup?q=${encodeURIComponent(query.trim())}`);
      setLookedUpItem(data.item);
      setLookupAttempted(true);
    } catch (error) {
      setLookedUpItem(null);
      setLookupAttempted(true);
      if (error?.response?.status !== 404) {
        console.error('Failed to lookup item', error);
      }
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Barcode Scanner Integration - INCREASED DELAY TO 8 SECONDS
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();

      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // CHANGED: Increased delay from 120ms to 8000ms (8 seconds)
      if (currentTime - lastKeyTime > 8000) {
        setBarcodeBuffer('');
      }
      setLastKeyTime(currentTime);

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();

        if (barcodeBuffer.trim()) {
          const code = barcodeBuffer.trim();
          setForm((prev) => ({ ...prev, barcode: code }));
          handleLookup(code);
        }
        setBarcodeBuffer('');
        return;
      }

      if (e.key.length === 1) {
        setBarcodeBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [barcodeBuffer, lastKeyTime]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.name === 'barcode') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    setMessage(null);
    try {
      await api.post('/inventory/scan', { ...form, quantity: Number(form.quantity) });
      setMessage({ type: 'success', text: 'Inventory updated successfully.' });
      setForm({ barcode: '', action: form.action, quantity: 1, reason: '' });
      setLookedUpItem(null);
      setLookupAttempted(false);
      setBarcodeBuffer('');

      // CHANGED: Reload inventory to show latest transaction
      await loadInventory();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to process scan.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const lowStockItems = useMemo(() => inventory.lowStock || [], [inventory.lowStock]);
  const canConfigureThreshold = hasPermission && hasPermission('configureThresholds');

  const startEditingThreshold = (item) => {
    setEditingItem(item.id);
    setThresholdValue(item.threshold);
    setMessage(null);
  };

  const cancelEditingThreshold = () => {
    setEditingItem(null);
    setThresholdValue('');
  };

  const handleSaveThreshold = async (itemId) => {
    setSavingThreshold(true);
    setMessage(null);
    try {
      await api.put(`/inventory/items/${itemId}`, { threshold: Number(thresholdValue) });
      setMessage({ type: 'success', text: 'Threshold updated successfully.' });
      setEditingItem(null);
      setThresholdValue('');
      await loadInventory();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to update threshold.',
      });
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleExportInventory = () => {
    const exportData = inventory.items.map((item) => ({
      Name: item.name,
      Barcode: item.barcode,
      Category: item.category,
      Stock: item.stock,
      Unit: item.unit,
      Threshold: item.threshold,
      Status: item.stock <= item.threshold ? 'Low' : 'Healthy',
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleExportTransactions = () => {
    const exportData = inventory.transactions.map((tx) => ({
      Item: tx.itemName || tx.item_name,
      Action: tx.action,
      Quantity: tx.quantity,
      User: tx.user,
      Reason: tx.reason,
      Timestamp: new Date(tx.timestamp).toLocaleString(),
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const styles = {
    container: {
      padding: '24px',
      background: '#f8f9fa',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '12px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      marginRight: '8px',
      marginBottom: '8px'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    },
    formGroup: {
      marginBottom: '12px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: '10px 40px 10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxSizing: 'border-box',
      resize: 'none',
      fontFamily: 'inherit'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'white',
      background: '#0d9488',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#666',
      textTransform: 'uppercase',
      borderBottom: '1px solid #e5e7eb',
      background: '#f9fafb'
    },
    td: {
      padding: '12px',
      fontSize: '14px',
      borderBottom: '1px solid #f3f4f6'
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading inventory data...</div>;
  }

  const totalStock = inventory.items.reduce((acc, item) => acc + Number(item.stock || 0), 0);
  const categoriesCount = [...new Set(inventory.items.map((item) => item.category))].length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Inventory Management</h1>
        <p style={styles.subtitle}>
          Scan barcodes to update stock levels with real-time visibility.
        </p>
        <div style={{ marginTop: '12px' }}>
          <span style={{ ...styles.badge, background: '#e0f2fe', color: '#0369a1' }}>
            {inventory.items.length} Items
          </span>
          <span style={{ ...styles.badge, background: '#f3e8ff', color: '#7c3aed' }}>
            {totalStock} Total Stock
          </span>
          <span style={{ ...styles.badge, background: '#dbeafe', color: '#1e40af' }}>
            {categoriesCount} Categories
          </span>
          {lowStockItems.length > 0 && (
            <span style={{ ...styles.badge, background: '#fee2e2', color: '#dc2626' }}>
              <HiOutlineExclamation style={{ marginRight: '4px' }} />
              {lowStockItems.length} Low Stock
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button onClick={loadInventory} style={{ ...styles.button, background: '#6b7280' }}>
            <HiOutlineRefresh style={{ marginRight: '6px' }} /> Refresh data
          </button>
        </div>
      </div>

      {/* Stock In / Out + Low stock */}
      {hasPermission && hasPermission('updateInventory') && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={styles.card}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              Stock In / Stock Out
            </h2>
            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Barcode or Item Name</label>
                <div style={{ position: 'relative' }}>
                  <HiOutlineQrcode style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '20px' }} />
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    required
                    autoComplete="off"
                    placeholder="Scan barcode or enter item name..."
                    style={{ ...styles.input, paddingLeft: '40px' }}
                  />
                  {(form.barcode || lookedUpItem) && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, barcode: '' }));
                        setLookedUpItem(null);
                        setLookupAttempted(false);
                        setBarcodeBuffer('');
                      }}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {lookingUp && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>Looking up item...</p>
                )}
                {lookedUpItem && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                    <HiOutlineCheckCircle style={{ fontSize: '20px', color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#166534', margin: 0 }}>{lookedUpItem.name}</p>
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#15803d' }}>
                        <span>Barcode: {lookedUpItem.barcode}</span>
                        <span>Category: {lookedUpItem.category}</span>
                        <span style={{ fontWeight: '600' }}>
                          Current Stock: {lookedUpItem.stock} {lookedUpItem.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {!lookingUp && !lookedUpItem && lookupAttempted && form.barcode && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626' }}>
                    Item not found. Please check the name or barcode.
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Action</label>
                  <select name="action" value={form.action} onChange={handleChange} style={styles.select}>
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={form.quantity}
                    onChange={handleChange}
                    style={{ ...styles.input, paddingLeft: '12px' }}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Reason</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Reason for inventory update"
                  style={styles.textarea}
                />
              </div>

              <button type="submit" disabled={processing} style={styles.button}>
                <HiOutlineBeaker style={{ marginRight: '6px' }} />
                {processing ? 'Updating…' : 'Submit update'}
              </button>
            </form>

            {message && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: message.type === 'success' ? '#065f46' : '#991b1b',
                fontSize: '14px'
              }}>
                {message.text}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div style={styles.card}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              Low Stock Alerts
            </h2>
            {lowStockItems.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#9ca3af' }}>
                <HiOutlineCube style={{ marginRight: '8px', fontSize: '20px' }} />
                No low stock items.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {lowStockItems.map((item) => (
                  <li key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>{item.name}</p>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{item.barcode}</p>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                      <HiOutlineExclamation style={{ marginRight: '4px' }} />
                      {item.stock} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* MOVED: Recent Transactions NOW ABOVE Inventory Catalogue */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Recent Transactions</h2>
          <button onClick={handleExportTransactions} style={{ ...styles.button, background: '#6b7280', padding: '8px 12px', fontSize: '13px' }}>
            <HiOutlineDownload style={{ marginRight: '6px' }} /> Export
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {(inventory.transactions || []).length === 0 && (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                    No transactions yet.
                  </td>
                </tr>
              )}
              {(inventory.transactions || []).map((tx) => (
                <tr key={tx.id}>
                  <td style={styles.td}>{tx.itemName || tx.item_name}</td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: tx.action === 'IN' ? '#d1fae5' : '#fee2e2',
                      color: tx.action === 'IN' ? '#065f46' : '#991b1b'
                    }}>
                      {tx.action}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{tx.quantity}</td>
                  <td style={styles.td}>{tx.user}</td>
                  <td style={styles.td}>{tx.reason}</td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Catalogue NOW BELOW Recent Transactions */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Inventory Catalogue</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ ...styles.badge, background: '#dbeafe', color: '#1e40af' }}>
              {inventory.items.length} items
            </span>
            {hasPermission('manageInventory') && (
              <button onClick={handleExportInventory} style={{ ...styles.button, background: '#6b7280', padding: '8px 12px', fontSize: '13px' }}>
                <HiOutlineDownload style={{ marginRight: '6px' }} /> Export
              </button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Barcode</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Threshold</th>
                <th style={styles.th}>Status</th>
                {canConfigureThreshold && <th style={styles.th}></th>}
              </tr>
            </thead>
            <tbody>
              {inventory.items.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' }}>
                        <HiOutlineCube style={{ fontSize: '20px' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{item.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{item.barcode}</td>
                  <td style={styles.td}>{item.category}</td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{item.stock}</td>
                  <td style={styles.td}>
                    {editingItem === item.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          value={thresholdValue}
                          onChange={(e) => setThresholdValue(e.target.value)}
                          style={{ width: '80px', padding: '6px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />
                        <button
                          onClick={() => handleSaveThreshold(item.id)}
                          disabled={savingThreshold}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '500', color: 'white', background: '#0d9488', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditingThreshold}
                          style={{ padding: '6px', fontSize: '16px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <HiOutlineX />
                        </button>
                      </div>
                    ) : (
                      <span>{item.threshold}</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: item.stock <= item.threshold ? '#fee2e2' : '#d1fae5',
                      color: item.stock <= item.threshold ? '#dc2626' : '#065f46'
                    }}>
                      {item.stock <= item.threshold ? 'Low' : 'Healthy'}
                    </span>
                  </td>
                  {canConfigureThreshold && (
                    <td style={styles.td}>
                      {editingItem !== item.id && (
                        <button
                          onClick={() => startEditingThreshold(item)}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '500', color: '#0d9488', background: '#f0fdfa', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
                        >
                          <HiOutlinePencil style={{ marginRight: '4px', display: 'inline' }} /> Adjust
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
