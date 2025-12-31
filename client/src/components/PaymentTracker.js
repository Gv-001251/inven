import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentTracker = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // week, month, year

  useEffect(() => {
    fetchPayments();
  }, [dateRange]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/billing/payments?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalReceived = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = payments
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalReceived, totalPending };
  };

  const stats = calculateStats();

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div className="payment-tracker">
      <div className="payment-stats">
        <div className="stat-card green">
          <h3>Received</h3>
          <p>₹{stats.totalReceived.toLocaleString()}</p>
        </div>
        <div className="stat-card orange">
          <h3>Pending</h3>
          <p>₹{stats.totalPending.toLocaleString()}</p>
        </div>
      </div>

      <div className="date-filter">
        <button 
          className={dateRange === 'week' ? 'active' : ''}
          onClick={() => setDateRange('week')}
        >
          This Week
        </button>
        <button 
          className={dateRange === 'month' ? 'active' : ''}
          onClick={() => setDateRange('month')}
        >
          This Month
        </button>
        <button 
          className={dateRange === 'year' ? 'active' : ''}
          onClick={() => setDateRange('year')}
        >
          This Year
        </button>
      </div>

      <table className="payments-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment._id}>
              <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
              <td>#{payment.invoiceNumber}</td>
              <td>{payment.customerName}</td>
              <td>₹{payment.amount.toLocaleString()}</td>
              <td>{payment.paymentMethod || 'Not specified'}</td>
              <td>
                <span className={`status-badge ${payment.status === 'paid' ? 'status-paid' : 'status-pending'}`}>
                  {payment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTracker;
