import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineRefresh,
  HiOutlineQrcode,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineDownload,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineChevronDown
} from 'react-icons/hi';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const { hasPermission } = useAuth();
  const [inventory, setInventory] = useState({ items: [], lowStock: [], transactions: [] });
  const [loading, setLoading] = useState(true);

  // --- Modal States ---
  const [showStockModal, setShowStockModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State (Stock Modal)
  const [form, setForm] = useState({ barcode: '', action: 'IN', quantity: 1, reason: '' });
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  // Threshold Editing State
  const [editingItem, setEditingItem] = useState(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  // Lookup State (Stock Modal)
  const [lookedUpItem, setLookedUpItem] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  // Scanner State
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());

  // Local UI State
  const [catalogueSearch, setCatalogueSearch] = useState('');

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
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Barcode Scanner Integration (Opening Modal automatically if scan detected could be a nice touch, but following explicit button click for now)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (currentTime - lastKeyTime > 8000) {
        setBarcodeBuffer('');
      }
      setLastKeyTime(currentTime);

      if (e.key === 'Enter') {
        if (barcodeBuffer.trim()) {
          // Check if modals are open, if not, maybe open stock modal? 
          // For now, let's just populate the form if the modal is OPEN
          if (showStockModal) {
            const code = barcodeBuffer.trim();
            setForm((prev) => ({ ...prev, barcode: code }));
            handleLookup(code);
          }
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
  }, [barcodeBuffer, lastKeyTime, showStockModal]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      await loadInventory();
      // Optionally close modal after success?
      // setShowStockModal(false); 
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Unable to process scan.',
      });
    } finally {
      setProcessing(false);
    }
  };

  // --- handlers for Product Modal ---
  const handleProductClick = (item) => {
    setSelectedProduct(item);
    setShowProductModal(true);
  };

  const lowStockItems = useMemo(() => inventory.lowStock || [], [inventory.lowStock]);
  const canConfigureThreshold = hasPermission && hasPermission('configureThresholds');

  const startEditingThreshold = (item, e) => {
    e.stopPropagation(); // Prevent opening modal
    setEditingItem(item.id);
    setThresholdValue(item.threshold);
    setMessage(null);
  };

  const cancelEditingThreshold = (e) => {
    if (e) e.stopPropagation();
    setEditingItem(null);
    setThresholdValue('');
  };

  const handleSaveThreshold = async (itemId, e) => {
    if (e) e.stopPropagation();
    setSavingThreshold(true);
    setMessage(null);
    try {
      await api.put(`/inventory/items/${itemId}`, { threshold: Number(thresholdValue) });
      setEditingItem(null);
      setThresholdValue('');
      await loadInventory();
    } catch (error) {
      console.error(error);
    } finally {
      setSavingThreshold(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!catalogueSearch) return inventory.items;
    const lower = catalogueSearch.toLowerCase();
    return inventory.items.filter(item =>
      item.name.toLowerCase().includes(lower) ||
      item.barcode.includes(catalogueSearch) ||
      item.category.toLowerCase().includes(lower)
    );
  }, [inventory.items, catalogueSearch]);

  const totalStock = inventory.items.reduce((acc, item) => acc + Number(item.stock || 0), 0);

  // --- Generic Modal Component Styles ---
  const ModalBackdrop = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mint p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Inventory</h1>
          <p className="text-secondary text-sm mt-1">Manage stock, track movements, and configure alerts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-primary/10 text-xs font-semibold text-primary">
            <HiOutlineCube className="text-emerald-custom" /> {inventory.items.length} Items
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-primary/10 text-xs font-semibold text-primary">
            <HiOutlineCheckCircle className="text-blue-500" /> {totalStock} Total Stock
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors">
            <HiOutlineDownload className="text-lg" /> Export
          </button>

          <button
            onClick={() => setShowStockModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-primary text-primary rounded-full text-sm font-semibold hover:bg-primary/5 transition-colors shadow-sm"
          >
            <HiOutlineQrcode className="text-lg" /> Bar Code Scanner
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Low Stock (Moved to side or kept, but removing the big inline scanner as planned) */}
        <div className="col-span-12">
          {lowStockItems.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <HiOutlineExclamation className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-red-700">Low Stock Alert</h3>
                <p className="text-xs text-red-600">There are {lowStockItems.length} items below their threshold.</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="col-span-12 lg:col-span-4">
          {/* Re-using recent activity logic but maybe compacter if sidebar? Or keep full width? 
               User asks for modals, didn't ask to change page layout much, but the inline scanner is gone.
               Let's keep Recent Activity full width or side-by-side with Catalogue.
               Let's keep it below catalogue or above. 
               Let's put Search and Catalogue first as it's the main interaction point.
           */}
        </div>

        {/* Inventory Catalogue */}
        <div className="col-span-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">Inventory Catalogue</h2>
            <div className="relative w-64">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search catalogue..."
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-primary/20 rounded-lg text-sm focus:outline-none focus:border-emerald-custom"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white text-xs uppercase tracking-wider">
                    <th className="p-4 rounded-tl-lg">ID</th>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Stock</th>
                    <th className="p-4 text-center">Threshold</th>
                    <th className="p-4 text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-600">
                  {filteredItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => handleProductClick(item)}
                      className={`border-b border-gray-50 last:border-0 hover:bg-emerald-50/50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-mint/20' : 'bg-white'}`}
                    >
                      <td className="p-4 font-mono text-xs text-emerald-800/60">
                        COMP-{String(idx + 1).padStart(3, '0')}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">{item.name}</div>
                        <div className="text-[10px] text-gray-400">{item.barcode}</div>
                      </td>
                      <td className="p-4 text-gray-500">{item.category}</td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${item.stock <= item.threshold ? 'text-red-500' : 'text-emerald-600'}`}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={thresholdValue}
                              onChange={(e) => setThresholdValue(e.target.value)}
                              className="w-16 px-1 py-1 text-center border rounded font-mono text-xs"
                              autoFocus
                            />
                            <button onClick={(e) => handleSaveThreshold(item.id, e)} className="text-emerald-600"><HiOutlineCheckCircle /></button>
                            <button onClick={cancelEditingThreshold} className="text-red-500"><HiOutlineX /></button>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs cursor-pointer hover:text-primary" onClick={(e) => canConfigureThreshold && startEditingThreshold(item, e)}>
                            {item.threshold} <HiOutlinePencil className="inline ml-1 opacity-0 hover:opacity-100" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs text-emerald-500 font-bold hover:underline">View</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* --- STOCK IN/OUT MODAL --- */}
      {showStockModal && (
        <ModalBackdrop onClose={() => setShowStockModal(false)}>
          <div className="bg-primary rounded-3xl p-8 w-[500px] shadow-2xl relative text-white animate-scale-in">
            <button onClick={() => setShowStockModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <HiOutlineX className="text-xl" />
            </button>

            <h2 className="text-xl font-bold mb-6">Stock In / Stock Out</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">Barcode or Item Name</label>
                <div className="relative">
                  <HiOutlineQrcode className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg" />
                  <input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    onBlur={(e) => handleLookup(e.target.value)}
                    placeholder="Scan Barcode"
                    autoFocus
                    className="w-full bg-transparent border border-white/30 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-medium"
                  />
                </div>
                {/* Quick Item Preview if Looked Up */}
                {lookedUpItem && (
                  <div className="mt-2 text-xs text-emerald-300 font-bold bg-white/10 p-2 rounded flex justify-between">
                    <span>{lookedUpItem.name}</span>
                    <span>Current: {lookedUpItem.stock}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Action</label>
                  <div className="relative">
                    <select
                      name="action"
                      value={form.action}
                      onChange={handleChange}
                      className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="IN" className="bg-primary">Stock In</option>
                      <option value="OUT" className="bg-primary">Stock Out</option>
                    </select>
                    <HiOutlineChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={form.quantity}
                    onChange={handleChange}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white text-center font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-white/80 mb-2">Reason</label>
                <textarea
                  name="reason"
                  rows="3"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Reason for inventory update"
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-40 py-2.5 bg-[#D1FAE5] text-primary font-bold rounded-xl hover:bg-white transition-colors"
              >
                {processing ? 'Processing...' : 'Submit'}
              </button>

              {message && (
                <div className={`mt-4 text-center text-sm font-bold ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </ModalBackdrop>
      )}

      {/* --- PRODUCT CARD MODAL --- */}
      {showProductModal && selectedProduct && (
        <ModalBackdrop onClose={() => setShowProductModal(false)}>
          <div className="w-[300px] shadow-2xl animate-scale-in">
            {/* Top: Image Area (White) */}
            <div className="bg-white rounded-t-3xl p-8 flex items-center justify-center relative min-h-[180px]">
              <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <HiOutlineX className="text-xl" />
              </button>

              {/* Placeholder Image or Real Image */}
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-32 h-32 object-contain" />
              ) : (
                // 3D Placeholder if no image
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                  <HiOutlineCube className="text-5xl" />
                </div>
              )}
            </div>

            {/* Bottom: Info Area (Dark Green) */}
            <div className="bg-primary rounded-b-3xl p-6 text-white text-center">
              <h3 className="font-bold text-lg mb-4">{selectedProduct.name}</h3>

              <div className="space-y-2 text-sm text-left px-4">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/70 text-xs uppercase font-bold">Stock in Inventory :</span>
                  <span className="font-bold">{selectedProduct.stock}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-white/70 text-xs uppercase font-bold">Min. Stock :</span>
                  <span className="font-bold">{selectedProduct.threshold}</span>
                </div>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}

    </div>
  );
};

export default Inventory;
