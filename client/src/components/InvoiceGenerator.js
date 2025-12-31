import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InvoiceGenerator = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerGST: '',
    items: [],
    discount: 0,
    shippingCharges: 0,
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/inventory/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: '',
        productName: '',
        quantity: 1,
        rate: 0,
        gst: 18,
        amount: 0
      }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-select product details
    if (field === 'productId') {
      const product = products.find(p => p._id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].rate = product.sellingPrice || product.price;
      }
    }

    // Calculate amount
    const quantity = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    const gst = parseFloat(newItems[index].gst) || 0;
    const baseAmount = quantity * rate;
    newItems[index].amount = baseAmount + (baseAmount * gst / 100);

    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const baseAmount = (item.quantity * item.rate);
      return sum + baseAmount;
    }, 0);

    const gstTotal = formData.items.reduce((sum, item) => {
      const baseAmount = (item.quantity * item.rate);
      return sum + (baseAmount * item.gst / 100);
    }, 0);

    const discount = parseFloat(formData.discount) || 0;
    const shipping = parseFloat(formData.shippingCharges) || 0;
    const grandTotal = subtotal + gstTotal - discount + shipping;

    return { subtotal, gstTotal, discount, shipping, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totals = calculateTotals();
      const invoiceData = {
        ...formData,
        ...totals,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      const response = await axios.post('/api/billing/invoices', invoiceData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      alert('Invoice created successfully!');
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerGST: '',
        items: [],
        discount: 0,
        shippingCharges: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="invoice-generator">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Customer Details</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Customer Name *"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Phone *"
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="GST Number"
              value={formData.customerGST}
              onChange={(e) => setFormData({...formData, customerGST: e.target.value})}
            />
          </div>
          <textarea
            placeholder="Address *"
            value={formData.customerAddress}
            onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
            required
          />
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Invoice Items</h3>
            <button type="button" onClick={addItem} className="btn-add">
              + Add Item
            </button>
          </div>

          <div className="items-table">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>GST %</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        min="1"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.gst}
                        onChange={(e) => updateItem(index, 'gst', e.target.value)}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td>₹{item.amount.toFixed(2)}</td>
                    <td>
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Details</h3>
          <div className="form-grid">
            <div>
              <label>Discount (₹)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({...formData, discount: e.target.value})}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label>Shipping Charges (₹)</label>
              <input
                type="number"
                value={formData.shippingCharges}
                onChange={(e) => setFormData({...formData, shippingCharges: e.target.value})}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <textarea
            placeholder="Notes / Terms & Conditions"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>GST Total:</span>
            <span>₹{totals.gstTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Discount:</span>
            <span>- ₹{totals.discount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>₹{totals.shipping.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Grand Total:</span>
            <span>₹{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Creating...' : 'Generate Invoice'}
        </button>
      </form>
    </div>
  );
};

export default InvoiceGenerator;
