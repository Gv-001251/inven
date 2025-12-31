import React, { useState } from 'react';
import axios from 'axios';

const Invoice = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerGST: '',
    items: [{ itemName: '', quantity: 1, rate: 0, gst: 18, amount: 0 }],
    discount: 0,
    taxPercentage: 18,
    notes: 'Thank you for your business. Please make payment within 7 days.'
  });

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('create');

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantity: 1, rate: 0, gst: 18, amount: 0 }]
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

  const handleSubmit = async (type) => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const totals = calculateTotals();
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        gstTotal: totals.taxAmount,
        grandTotal: totals.total,
        invoiceDate: new Date(),
        paymentStatus: 'pending'
      };

      await axios.post('http://localhost:5001/api/invoices/create', invoiceData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Invoice ${type === 'send' ? 'sent' : 'saved'} successfully!`);
      
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerGST: '',
        items: [{ itemName: '', quantity: 1, rate: 0, gst: 18, amount: 0 }],
        discount: 0,
        taxPercentage: 18,
        notes: 'Thank you for your business. Please make payment within 7 days.'
      });
      
      setShowPreview(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    alert('PDF download will be implemented with backend');
  };

  const handleEmail = () => {
    alert('Email functionality will be implemented');
  };

  const handleSaveDraft = () => {
    const draft = JSON.stringify(formData);
    localStorage.setItem('invoiceDraft', draft);
    alert('Draft saved to local storage!');
  };

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/invoices/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const downloadPDF = (billNumber) => {
    window.open(`http://localhost:5001/api/invoices/download/${billNumber}`, '_blank');
  };

  const totals = calculateTotals();

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
      margin: 0
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '0'
    },
    tab: (active) => ({
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
      color: active ? '#0d9488' : '#666',
      background: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid #0d9488' : '2px solid transparent',
      cursor: 'pointer',
      marginBottom: '-2px'
    }),
    actions: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    actionBtn: (primary = false) => ({
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '500',
      color: primary ? 'white' : '#374151',
      background: primary ? '#0d9488' : 'white',
      border: primary ? 'none' : '1px solid #ddd',
      borderRadius: '8px',
      cursor: 'pointer'
    }),
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #f3f4f6'
    },
    formGroup: {
      marginBottom: '16px'
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
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '16px'
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#666',
      textTransform: 'uppercase',
      borderBottom: '2px solid #e5e7eb',
      background: '#f9fafb'
    },
    td: {
      padding: '12px',
      fontSize: '14px',
      borderBottom: '1px solid #f3f4f6'
    },
    addBtn: {
      padding: '8px 16px',
      fontSize: '14px',
      color: '#0d9488',
      background: 'transparent',
      border: '1px dashed #0d9488',
      borderRadius: '8px',
      cursor: 'pointer',
      width: '100%'
    },
    previewCard: {
      background: 'white',
      padding: '32px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Invoices</h1>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={styles.tab(activeTab === 'create')}
          onClick={() => setActiveTab('create')}
        >
          New Invoice
        </button>
        <button
          style={styles.tab(activeTab === 'list')}
          onClick={() => {
            setActiveTab('list');
            fetchInvoices();
          }}
        >
          View Invoices
        </button>
      </div>

      {activeTab === 'create' && (
        <div>
          {/* Action Buttons */}
          <div style={styles.actions}>
            <button
              style={styles.actionBtn(false)}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
            </button>
            <button style={styles.actionBtn(false)} onClick={handleEmail}>
              ✉️ Email
            </button>
            <button style={styles.actionBtn(false)} onClick={handleSaveDraft}>
              💾 Save Draft
            </button>
            <button
              style={styles.actionBtn(true)}
              onClick={() => handleSubmit('send')}
              disabled={loading}
            >
              {loading ? '⏳ Sending...' : '📤 Send Invoice'}
            </button>
            <button style={styles.actionBtn(false)} onClick={handleDownloadPDF}>
              📥 Download
            </button>
          </div>

          {/* Main Content */}
          <div style={{display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '20px'}}>
            {/* Form Section */}
            <div style={styles.card}>
              <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '20px'}}>Invoice details</h3>

              {/* Customer Name */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Bill to</label>
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              {/* Address */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <textarea
                  placeholder="Customer Address"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  rows="2"
                  style={styles.textarea}
                />
              </div>

              {/* Invoice Number and Currency */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Invoice Number</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    disabled
                    style={{...styles.input, background: '#f5f5f5'}}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Currency</label>
                  <select disabled style={{...styles.input, background: '#f5f5f5'}}>
                    <option value="INR">🇮🇳 Indian Rupee</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    placeholder="Customer Phone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    placeholder="Customer Email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* GST Number */}
              <div style={styles.formGroup}>
                <label style={styles.label}>GST Number (Optional)</label>
                <input
                  type="text"
                  placeholder="GST Number"
                  value={formData.customerGST}
                  onChange={(e) => setFormData({ ...formData, customerGST: e.target.value })}
                  style={styles.input}
                />
              </div>

              {/* Items Table */}
              <div style={{marginTop: '24px'}}>
                <h3 style={{fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>Items details</h3>
                <div style={{overflowX: 'auto'}}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Item</th>
                        <th style={styles.th}>QTY</th>
                        <th style={styles.th}>Rate</th>
                        <th style={styles.th}>Total</th>
                        <th style={styles.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td style={styles.td}>
                            <input
                              type="text"
                              placeholder="Item name"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                              style={{...styles.input, marginBottom: 0}}
                            />
                          </td>
                          <td style={styles.td}>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              min="1"
                              style={{...styles.input, marginBottom: 0, width: '80px'}}
                            />
                          </td>
                          <td style={styles.td}>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                              min="0"
                              step="0.01"
                              style={{...styles.input, marginBottom: 0, width: '100px'}}
                            />
                          </td>
                          <td style={{...styles.td, fontWeight: '600'}}>₹{item.amount.toFixed(2)}</td>
                          <td style={styles.td}>
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px'}}
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" style={styles.addBtn} onClick={handleAddItem}>
                  + Add item
                </button>
              </div>

              {/* Tax and Discount */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tax percentage</label>
                  <input
                    type="number"
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                    min="0"
                    max="100"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Discount (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter discount amount"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    min="0"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes / Terms</label>
                <textarea
                  placeholder="Thank you for your business..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  style={styles.textarea}
                />
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div style={styles.previewCard}>
                <div style={{textAlign: 'center', marginBottom: '24px'}}>
                  <h1 style={{fontSize: '32px', fontWeight: '700', margin: 0}}>INVOICE</h1>
                  <p style={{color: '#666', fontSize: '14px'}}>Invoice Number: Auto-generated</p>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px'}}>
                  <div>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Billed by:</p>
                    <p style={{fontWeight: '600', margin: '4px 0'}}>Breeze Techniques</p>
                    <p style={{fontSize: '14px', color: '#666', margin: '2px 0'}}>contact@breeze.tech</p>
                    <p style={{fontSize: '14px', color: '#666', margin: '2px 0'}}>Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>Billed to:</p>
                    <p style={{fontWeight: '600', margin: '4px 0'}}>{formData.customerName || 'Customer Name'}</p>
                    <p style={{fontSize: '14px', color: '#666', margin: '2px 0'}}>{formData.customerEmail}</p>
                    <p style={{fontSize: '14px', color: '#666', margin: '2px 0'}}>{formData.customerAddress}</p>
                  </div>
                </div>

                <table style={{...styles.table, marginBottom: '24px'}}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Items</th>
                      <th style={styles.th}>QTY</th>
                      <th style={styles.th}>Rate</th>
                      <th style={styles.th}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td style={styles.td}>{item.itemName || 'Item name'}</td>
                        <td style={styles.td}>{item.quantity}</td>
                        <td style={styles.td}>₹{item.rate.toFixed(2)}</td>
                        <td style={styles.td}>₹{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{borderTop: '2px solid #e5e7eb', paddingTop: '16px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <span>Tax ({formData.taxPercentage}%)</span>
                    <span>₹{totals.taxAmount.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <span>Discount</span>
                      <span>-₹{totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #0d9488', fontSize: '18px', fontWeight: '700'}}>
                    <span>Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {formData.notes && (
                  <div style={{marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px'}}>
                    <p style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Notes:</p>
                    <p style={{fontSize: '14px', color: '#374151'}}>{formData.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice List */}
      {activeTab === 'list' && (
        <div style={styles.card}>
          {invoices.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
              <p style={{fontSize: '48px', margin: 0}}>📄</p>
              <p>No invoices found</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Bill Number</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td style={{...styles.td, fontWeight: '600'}}>{invoice.billNumber}</td>
                    <td style={styles.td}>{invoice.customerName}</td>
                    <td style={styles.td}>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                    <td style={styles.td}>₹{invoice.grandTotal.toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: invoice.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                        color: invoice.paymentStatus === 'paid' ? '#16a34a' : '#ca8a04'
                      }}>
                        {invoice.paymentStatus}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => downloadPDF(invoice.billNumber)}
                        style={{...styles.actionBtn(false), padding: '6px 12px', fontSize: '13px'}}
                      >
                        📥 PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Invoice;
