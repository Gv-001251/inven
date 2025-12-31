import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InvoiceList = ({ onStatsUpdate }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, paid, pending, overdue

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/billing/invoices?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (invoiceId) => {
    try {
      const response = await axios.get(`/api/billing/invoices/${invoiceId}/pdf`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const markAsPaid = async (invoiceId) => {
    if (!window.confirm('Mark this invoice as paid?')) return;

    try {
      await axios.patch(`/api/billing/invoices/${invoiceId}/payment`, 
        { status: 'paid', paidDate: new Date() },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }}
      );
      fetchInvoices();
      if (onStatsUpdate) onStatsUpdate();
      alert('Invoice marked as paid');
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment status');
    }
  };

  const getStatusClass = (invoice) => {
    if (invoice.paymentStatus === 'paid') return 'status-paid';
    if (new Date(invoice.dueDate) < new Date()) return 'status-overdue';
    return 'status-pending';
  };

  const getStatusText = (invoice) => {
    if (invoice.paymentStatus === 'paid') return 'Paid';
    if (new Date(invoice.dueDate) < new Date()) return 'Overdue';
    return 'Pending';
  };

  if (loading) return <div className="loading">Loading invoices...</div>;

  return (
    <div className="invoice-list">
      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'paid' ? 'active' : ''}
          onClick={() => setFilter('paid')}
        >
          Paid
        </button>
        <button 
          className={filter === 'overdue' ? 'active' : ''}
          onClick={() => setFilter('overdue')}
        >
          Overdue
        </button>
      </div>

      <table className="invoices-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-data">No invoices found</td>
            </tr>
          ) : (
            invoices.map(invoice => (
              <tr key={invoice._id}>
                <td>#{invoice.invoiceNumber}</td>
                <td>
                  <div className="customer-info">
                    <strong>{invoice.customerName}</strong>
                    <small>{invoice.customerPhone}</small>
                  </div>
                </td>
                <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td>₹{invoice.grandTotal?.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(invoice)}`}>
                    {getStatusText(invoice)}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    onClick={() => downloadPDF(invoice._id)}
                    className="btn-icon"
                    title="Download PDF"
                  >
                    📄
                  </button>
                  {invoice.paymentStatus !== 'paid' && (
                    <button 
                      onClick={() => markAsPaid(invoice._id)}
                      className="btn-icon"
                      title="Mark as Paid"
                    >
                      ✓
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
