import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineQrcode,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDotsVertical,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineCube,
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

  // Lookup State (Stock Modal)
  const [lookedUpItem, setLookedUpItem] = useState(null);

  // Local UI State
  const [catalogueSearch, setCatalogueSearch] = useState('');

  // Feature States
  const [sortOption, setSortOption] = useState('Default'); // 'Default', 'Name', 'Stock'
  const [filterOption, setFilterOption] = useState('All'); // 'All', 'Low Stock', or specific category
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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
      return;
    }
    try {
      const { data } = await api.get(`/inventory/lookup?q=${encodeURIComponent(query.trim())}`);
      setLookedUpItem(data.item);
    } catch (error) {
      setLookedUpItem(null);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // --- Handlers ---

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

  const handleProductClick = (item) => {
    setSelectedProduct(item);
    setShowProductModal(true);
  };

  const handleExport = () => {
    // Export current filtered items
    const csvContent = [
      Object.keys({ Name: '', Barcode: '', Category: '', Stock: '', Threshold: '' }).join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        `"${item.barcode}"`,
        `"${item.category}"`,
        item.stock,
        item.threshold
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  // --- Logic ---

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(inventory.items.map(i => i.category).filter(Boolean));
    return ['All', 'Low Stock', ...Array.from(cats)];
  }, [inventory.items]);

  const filteredItems = useMemo(() => {
    let result = [...inventory.items];

    // 1. Search
    if (catalogueSearch) {
      const lower = catalogueSearch.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(lower) ||
        item.barcode.includes(catalogueSearch) ||
        item.category.toLowerCase().includes(lower)
      );
    }

    // 2. Filter
    if (filterOption === 'Low Stock') {
      result = result.filter(i => i.stock <= i.threshold);
    } else if (filterOption !== 'All') {
      result = result.filter(i => i.category === filterOption);
    }

    // 3. Sort
    if (sortOption === 'Name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'Stock') {
      result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [inventory.items, catalogueSearch, filterOption, sortOption]);

  const recentTransactions = useMemo(() => {
    return (inventory.transactions || []).slice(0, 7);
  }, [inventory.transactions]);


  // --- Helper Components ---
  const TableHeaderCell = ({ children, className = "" }) => (
    <th className={`p-4 text-left font-bold text-[10px] uppercase tracking-wider text-white ${className}`}>
      {children}
    </th>
  );

  const TableRow = ({ children, index, onClick }) => (
    <tr
      onClick={onClick}
      className={`border-b border-primary/10 transition-colors 
            ${index % 2 === 0 ? 'bg-[#115e59]' : 'bg-[#0f766e]'} 
            hover:opacity-90 cursor-pointer text-white text-xs font-medium`}
    >
      {children}
    </tr>
  );

  const ModalBackdrop = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mint p-8 font-sans" onClick={() => { setShowSortMenu(false); setShowFilterMenu(false); }}>

      {/* 1. Header & Recent Items */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-primary">Inventory</h1>
          {/* Header Icons if needed */}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Recent Items</h2>
          <div className="flex items-center gap-4">
            <button onClick={handleExport} className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80 transition-opacity">
              <HiOutlineDownload className="text-lg" /> Export
            </button>
            <button
              onClick={() => setShowStockModal(true)}
              className="flex items-center gap-2 px-5 py-2 border border-primary text-primary rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-colors"
            >
              <HiOutlineQrcode className="text-lg" /> Bar Code Scanner
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg border border-primary/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0C3834] text-white">
                  <TableHeaderCell className="w-10 text-center"><div className="w-4 h-4 border border-white/50 rounded mx-auto" /></TableHeaderCell>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>ITEM NAME</TableHeaderCell>
                  <TableHeaderCell>CATEGORY</TableHeaderCell>
                  <TableHeaderCell>STOCK STATUS</TableHeaderCell>
                  <TableHeaderCell>PRICE</TableHeaderCell>
                  <TableHeaderCell>Time Stamp</TableHeaderCell>
                  <TableHeaderCell className="w-10"></TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr><td colSpan="8" className="p-8 text-center text-primary/50 italic bg-white">No recent items found.</td></tr>
                ) : (
                  recentTransactions.map((tx, idx) => {
                    // Mocking some data fields
                    const mockId = `COMP-${String(idx + 1).padStart(3, '0')}`;

                    return (
                      <TableRow key={idx} index={idx}>
                        <td className="p-4 text-center"><div className="w-4 h-4 border border-white/50 rounded mx-auto cursor-pointer" /></td>
                        <td className="p-4">{mockId}</td>
                        <td className="p-4 font-bold">{tx.itemName || tx.item_name}</td>
                        <td className="p-4">Component</td>
                        <td className="p-4 text-center">{tx.quantity}</td>
                        <td className="p-4">$300</td>
                        <td className="p-4">{new Date(tx.timestamp).toLocaleDateString()}</td>
                        <td className="p-4 text-center"><HiOutlineDotsVertical className="text-lg cursor-pointer hover:text-white/70" /></td>
                      </TableRow>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Inventory Catalogue Section */}
      <div className="mb-12">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-primary">Inventory Catalogue</h2>

          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {/* Search */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-lg" />
              <input
                type="text"
                placeholder="Search"
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                className="pl-12 pr-4 py-2 bg-transparent border border-primary rounded-full text-primary placeholder-primary/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
              />
            </div>

            <button onClick={handleExport} className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80">
              <HiOutlineDownload className="text-lg" /> Export
            </button>

            {/* Sort By Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                Sort By: {sortOption !== 'Default' ? sortOption : ''}
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white shadow-xl rounded-lg overflow-hidden border border-primary/10 z-20">
                  {['Default', 'Name', 'Stock'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setSortOption(opt); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-gray-700 ${sortOption === opt ? 'bg-emerald-50 font-bold text-primary' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80">
              <HiOutlinePlus className="text-lg" /> Add Item
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          {/* Filter Dropdown */}
          <div className="relative flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className="text-primary hover:text-primary/70 flex items-center gap-2"
              title="Filter Categories"
            >
              <HiOutlineFilter className="text-2xl" />
              <span className="text-sm font-bold text-primary">{filterOption !== 'All' ? filterOption : ''}</span>
            </button>

            {showFilterMenu && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white shadow-xl rounded-lg overflow-hidden border border-primary/10 z-20 max-h-60 overflow-y-auto custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterOption(cat); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-gray-700 ${filterOption === cat ? 'bg-emerald-50 font-bold text-primary' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Removed Toggle Switch as requested */}
          </div>

          <div className="flex items-center gap-4 text-sm font-bold text-primary">
            <span>1/10</span>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20"><HiOutlineChevronLeft /></button>
              <button className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center hover:bg-primary/90"><HiOutlineChevronRight /></button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg border border-primary/20 min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0C3834] text-white">
                  <TableHeaderCell className="w-10 text-center"><div className="w-4 h-4 border border-white/50 rounded mx-auto" /></TableHeaderCell>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>ITEM NAME</TableHeaderCell>
                  <TableHeaderCell>CATEGORY</TableHeaderCell>
                  <TableHeaderCell>STOCK STATUS</TableHeaderCell>
                  <TableHeaderCell>PRICE</TableHeaderCell>
                  <TableHeaderCell>Time Stamp</TableHeaderCell>
                  <TableHeaderCell className="w-10"></TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan="8" className="p-8 text-center text-primary/50 italic bg-white">No items found.</td></tr>
                ) : (
                  filteredItems.map((item, idx) => (
                    <TableRow key={item.id} index={idx} onClick={() => handleProductClick(item)}>
                      <td className="p-4 text-center"><div onClick={(e) => e.stopPropagation()} className="w-4 h-4 border border-white/50 rounded mx-auto cursor-pointer" /></td>
                      <td className="p-4 font-mono text-white/80">COMP-{String(idx + 1).padStart(3, '0')}</td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4">{item.category}</td>
                      <td className="p-4 text-center font-bold">{item.stock}</td>
                      <td className="p-4">$300</td>
                      <td className="p-4 text-white/80">25/12/2025</td>
                      <td className="p-4 text-center"><HiOutlineDotsVertical className="text-lg cursor-pointer hover:text-white/70" onClick={(e) => e.stopPropagation()} /></td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- STOCK MODAL --- */}
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
                {lookedUpItem && (
                  <div className="mt-2 text-xs text-emerald-300 font-bold bg-white/10 p-2 rounded flex justify-between">
                    <span>{lookedUpItem.name}</span>
                    <span>Stock: {lookedUpItem.stock}</span>
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
                  placeholder="Reason for update..."
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
            <div className="bg-white rounded-t-3xl p-8 flex items-center justify-center relative min-h-[180px]">
              <button onClick={() => setShowProductModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <HiOutlineX className="text-xl" />
              </button>

              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-32 h-32 object-contain" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                  <HiOutlineCube className="text-5xl" />
                </div>
              )}
            </div>

            <div className="bg-primary rounded-b-3xl p-6 text-white text-center">
              <h3 className="font-bold text-lg mb-4">{selectedProduct.name}</h3>
              <div className="space-y-2 text-sm text-left px-4">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/70 text-xs uppercase font-bold">Stock :</span>
                  <span className="font-bold">{selectedProduct.stock}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-white/70 text-xs uppercase font-bold">Threshold :</span>
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
