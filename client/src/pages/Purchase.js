import React, { useEffect, useState } from 'react';
import {
  HiOutlineDownload,
  HiOutlinePlus,
  HiOutlineCalendar,
} from 'react-icons/hi';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const Purchase = () => {
  const { hasPermission } = useAuth();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [requests, setRequests] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    list: [],
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    itemId: '',
    quantity: 1,
    neededBy: '',
    reason: '',
    items: [],
  });

  const loadInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setInventoryItems(data?.items || []);
    } catch (error) {
      console.error('Failed to load inventory for purchase', error);
    }
  };

  const loadRequests = async () => {
    try {
      const { data } = await api.get('/purchase-requests');
      setRequests({
        pending: data?.pending || 0,
        approved: data?.approved || 0,
        rejected: data?.rejected || 0,
        list: data?.list || [],
      });
    } catch (error) {
      console.error('Failed to load purchase requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    loadRequests();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (!form.itemId || Number(form.quantity) <= 0) return;
    // Fix: Convert both IDs to strings for comparison to handle number/string mismatch
    const selected = (inventoryItems || []).find((i) => String(i.id) === String(form.itemId));
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          itemId: selected.id,
          itemName: selected.name,
          quantity: Number(prev.quantity),
        },
      ],
      itemId: '',
      quantity: 1,
    }));
  };

  const handleRemoveItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.items || form.items.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one item to the request.' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const payload = {
        items: (form.items || []).map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity,
        })),
        neededBy: form.neededBy || null,
        reason: form.reason,
      };

      await api.post('/purchase-requests', payload);

      setMessage({
        type: 'success',
        text: 'Purchase request created successfully.',
      });
      setForm({ itemId: '', quantity: 1, neededBy: '', reason: '', items: [] });
      loadRequests();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to create purchase request.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleExportRequests = () => {
    const exportData = (requests.list || []).map((req) => ({
      ID: req.id,
      Status: req.status,
      Items: (req.items || []).map((i) => `${i.itemName} x ${i.quantity}`).join(', '),
      NeededBy: req.neededBy ? new Date(req.neededBy).toLocaleDateString() : '',
      RequestedBy: req.requestedBy,
      Reason: req.reason || '',
      CreatedAt: req.createdAt ? new Date(req.createdAt).toLocaleString() : '',
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-requests-${new Date().toISOString().slice(0, 10)}.csv`;
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
      color: '#666'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '8px'
    },
    cardSubtitle: {
      fontSize: '12px',
      color: '#666',
      marginBottom: '16px'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginTop: '4px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginTop: '4px',
      boxSizing: 'border-box'
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
    secondaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 12px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      background: 'white',
      border: '1px solid #ddd',
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
    return <div style={styles.container}>Loading purchase requests...</div>;
  }

  const canCreate = hasPermission && hasPermission('createPurchaseRequest');
  const requestsList = requests.list || [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Purchase Requests</h1>
        <p style={styles.subtitle}>Create, track, and approve procurement workflows.</p>
      </div>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0, textTransform: 'uppercase' }}>Pending</p>
          <p style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', margin: '8px 0 0 0' }}>
            {requests.pending || 0}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0, textTransform: 'uppercase' }}>Approved</p>
          <p style={{ fontSize: '24px', fontWeight: '600', color: '#16a34a', margin: '8px 0 0 0' }}>
            {requests.approved || 0}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0, textTransform: 'uppercase' }}>Rejected</p>
          <p style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626', margin: '8px 0 0 0' }}>
            {requests.rejected || 0}
          </p>
        </div>
      </div>

      {/* Create Purchase Request Form */}
      {canCreate && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Create Purchase Request</h2>
          <p style={styles.cardSubtitle}>Raise procurement needs for supervisor approval.</p>

          <form onSubmit={handleSubmit}>
            {/* Item Selection + Quantity + Add Button */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', marginBottom: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Item</label>
                <select
                  name="itemId"
                  value={form.itemId}
                  onChange={handleFieldChange}
                  style={styles.select}
                >
                  <option value="">Select item</option>
                  {(inventoryItems || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.stock} {item.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleFieldChange}
                  style={styles.input}
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                style={{ ...styles.secondaryButton, marginTop: '20px' }}
              >
                <HiOutlinePlus style={{ marginRight: '6px' }} />
                Add Item
              </button>
            </div>

            {/* Needed By + Reason */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Needed by</label>
                <div style={{ position: 'relative' }}>
                  <HiOutlineCalendar style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '20px', marginTop: '2px' }} />
                  <input
                    type="date"
                    name="neededBy"
                    value={form.neededBy}
                    onChange={handleFieldChange}
                    style={{ ...styles.input, paddingLeft: '40px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Reason</label>
                <input
                  type="text"
                  name="reason"
                  value={form.reason}
                  onChange={handleFieldChange}
                  placeholder="Why do you need these materials?"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Request Items List */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
                Request Items
              </h3>
              {!form.items || form.items.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#666' }}>No items added yet.</p>
              ) : (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item</th>
                        <th style={styles.th}>Quantity</th>
                        <th style={styles.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.items || []).map((item, index) => (
                        <tr key={`${item.itemId}-${index}`}>
                          <td style={styles.td}>{item.itemName}</td>
                          <td style={styles.td}>{item.quantity}</td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              style={{ fontSize: '12px', color: '#666', cursor: 'pointer', border: 'none', background: 'none' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button type="submit" disabled={processing} style={styles.button}>
                {processing ? 'Submitting…' : 'Submit request'}
              </button>
            </div>

            {message && (
              <p style={{ marginTop: '16px', fontSize: '14px', color: message.type === 'success' ? '#16a34a' : '#dc2626' }}>
                {message.text}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Requests Table */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...styles.cardTitle, margin: 0 }}>Recent Purchase Requests</h2>
          {hasPermission('supervisePurchaseRequest') && (
            <button onClick={handleExportRequests} style={{ ...styles.secondaryButton, fontSize: '13px', padding: '8px 12px' }}>
              <HiOutlineDownload style={{ marginRight: '6px' }} /> Export
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Needed By</th>
                <th style={styles.th}>Requested By</th>
                <th style={styles.th}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {requestsList.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>
                    No purchase requests found.
                  </td>
                </tr>
              )}
              {requestsList.map((req) => (
                <tr key={req.id}>
                  <td style={{ ...styles.td, fontWeight: '500' }}>{req.id}</td>
                  <td style={styles.td}>
                    {(req.items || []).map((i) => `${i.itemName} x ${i.quantity}`).join(', ')}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: req.status === 'APPROVED' ? '#dcfce7' : req.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                      color: req.status === 'APPROVED' ? '#16a34a' : req.status === 'REJECTED' ? '#dc2626' : '#ca8a04'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {req.neededBy ? new Date(req.neededBy).toLocaleDateString() : '—'}
                  </td>
                  <td style={styles.td}>{req.requestedBy}</td>
                  <td style={{ ...styles.td, color: '#9ca3af' }}>
                    {req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
