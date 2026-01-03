import React, { useEffect, useState } from 'react';
import {
  HiOutlineDownload,
  HiOutlinePlus,
  HiOutlineCalendar,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock
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

  // Form State
  const [form, setForm] = useState({
    itemId: '',
    quantity: 1,
    neededBy: '',
    reason: '',
    items: [],
  });

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  const loadInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setInventoryItems(data?.items || []);
    } catch (error) {
      console.error('Failed to load inventory for purchase', error);
      // Fallback data for dev/demo if API fails
      setInventoryItems([
        { id: '1', name: 'Cement 50kg Bags', stock: 120, unit: 'bags' },
        { id: '2', name: 'Steel Rods 10mm', stock: 500, unit: 'kg' },
        { id: '3', name: 'Bricks (Red)', stock: 5000, unit: 'pcs' },
      ]);
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

      setMessage({ type: 'success', text: 'Purchase request submitted successfully.' });
      setForm({ itemId: '', quantity: 1, neededBy: '', reason: '', items: [] });
      loadRequests();

      // Auto dismiss success message
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to create purchase request.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = (requests.list || []).filter(req =>
    req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-mint">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canCreate = hasPermission && hasPermission('createPurchaseRequest');

  return (
    <div className="min-h-screen bg-mint p-8">
      {/* Page Header */}
      <h1 className="text-3xl font-extrabold text-primary mb-8">Purchase Request</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Pending', value: requests.pending, color: 'bg-emerald-800/20 text-emerald-900', border: 'border-emerald-800/20' },
          { label: 'Approved', value: requests.approved, color: 'bg-emerald-custom text-white', border: 'border-emerald-custom' },
          { label: 'Rejected', value: requests.rejected, color: 'bg-emerald-500 text-white', border: 'border-emerald-500' },
        ].map((stat, idx) => (
          <div key={idx} className={`rounded-2xl p-6 shadow-sm ${stat.color} relative overflow-hidden backdrop-blur-sm min-h-[120px] flex flex-col justify-between`}>
            <span className="text-sm font-bold uppercase tracking-wider opacity-80">{stat.label}</span>
            <span className="text-5xl font-extrabold">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Create Purchase Request - Dark Green Card */}
      {canCreate && (
        <div className="bg-primary rounded-3xl p-8 mb-12 shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10 w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-6">Create Purchase Request</h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              {/* Barcode / Item Name */}
              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-white/80 mb-2">Barcode or Item Name</label>
                <div className="relative">
                  <select
                    name="itemId"
                    value={form.itemId}
                    onChange={handleFieldChange}
                    className="w-full bg-transparent border border-white/30 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-primary">Select Item Name</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-primary">
                        {item.name} ({item.stock} in stock)
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-white/80 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleFieldChange}
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white text-center focus:outline-none focus:border-emerald-400 font-bold"
                />
              </div>

              {/* Add Item Button */}
              <div className="md:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-3 border border-dashed border-white/40 rounded-lg text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <HiOutlinePlus /> Add Item
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
              {/* Needed By */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-white/80 mb-2">Needed By</label>
                <div className="relative">
                  <input
                    type="date"
                    name="neededBy"
                    value={form.neededBy}
                    onChange={handleFieldChange}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-400"
                  />
                  <HiOutlineCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none text-lg" />
                </div>
              </div>

              {/* Reason */}
              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-white/80 mb-2">Reason</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleFieldChange}
                  rows="2"
                  placeholder="Why do you need this materials?"
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>
            </div>

            {/* Requested Items List (Preview) */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-white mb-2">Requested Items</h3>
              {form.items.length === 0 ? (
                <div className="text-white/40 text-sm italic">No items added yet</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {form.items.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white border border-white/20 flex items-center gap-2">
                      {item.itemName} <span className="text-emerald-300">x{item.quantity}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="px-8 py-3 bg-[#D1FAE5] text-primary font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? 'Submitting...' : 'Submit'}
            </button>

            {/* Alert Message */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {message.type === 'success' ? <HiOutlineCheckCircle className="text-lg" /> : <HiOutlineXCircle className="text-lg" />}
                {message.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Purchase Requests */}
      <div>
        <h2 className="text-xl font-bold text-primary mb-6">Recent Purchase Requests</h2>

        <div className="flex justify-between items-center mb-4">
          {/* Search */}
          <div className="relative w-64">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-primary/30 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Export */}
          {hasPermission('supervisePurchaseRequest') && (
            <button
              onClick={() => alert('Exporting...')} // Implement export logic
              className="flex items-center gap-2 text-primary font-bold text-sm hover:text-emerald-700"
            >
              <HiOutlineDownload className="text-lg" /> Export
            </button>
          )}
        </div>

        <div className="bg-primary rounded-2xl overflow-hidden shadow-lg border border-primary/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary-dark/20 text-white/70 text-[10px] uppercase tracking-wider">
                  <th className="p-4 w-12">
                    <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center"></div>
                  </th>
                  <th className="p-4 font-bold text-white">ID</th>
                  <th className="p-4 font-bold text-white">ITEMS</th>
                  <th className="p-4 font-bold text-white text-center">STATUS</th>
                  <th className="p-4 font-bold text-white text-center">NEEDED BY</th>
                  <th className="p-4 font-bold text-white text-center">REQUESTED BY</th>
                  <th className="p-4 font-bold text-white text-right">CREATED AT</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredRequests.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-white/50">No requests found.</td></tr>
                ) : (
                  filteredRequests.map((req, idx) => (
                    <tr key={req.id} className={`border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-primary' : 'bg-[#0E423D]'}`}>
                      <td className="p-4 align-middle">
                        <div className="w-4 h-4 border border-white/30 rounded cursor-pointer"></div>
                      </td>
                      <td className="p-4 font-mono text-xs text-emerald-300 font-bold">
                        {req.id}
                      </td>
                      <td className="p-4 text-white/90 text-xs font-semibold">
                        {(req.items || []).map(i => `${i.itemName} x${i.quantity}`).join(', ')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase text-primary border-none
                                               ${req.status === 'APPROVED' ? 'bg-[#D1FAE5]' : req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-[#FEF3C7] text-amber-800'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-white/60 text-xs font-medium">
                        {req.neededBy ? new Date(req.neededBy).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-4 text-center text-white/80 text-xs font-bold">
                        {req.requestedBy}
                      </td>
                      <td className="p-4 text-right text-white/60 text-[10px] font-mono">
                        {req.createdAt ? new Date(req.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Purchase;
