import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from './EmployeeDashboard';
import { HiOutlineArrowRight, HiOutlineArrowUp, HiOutlineCalendar, HiOutlineQrcode, HiOutlineChevronDown, HiOutlineX } from 'react-icons/hi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import CubeLoader from '../components/CubeLoader';

const Dashboard = () => {
  const { hasPermission, user } = useAuth();

  // Check if user is an Employee (limited access)
  const isEmployee = user?.permissions && !user.permissions.fullAccess && !hasPermission('viewAttendance');
  const [stats, setStats] = useState({
    totalInventory: 0,
    lowStockItems: 0,
    pendingRequests: 0,
    presentToday: 0,
    attendancePercentage: 0,
    totalEmployees: 0,
    distinctItems: 0
  });

  const [inventoryMovement, setInventoryMovement] = useState({
    dates: [],
    inbound: [],
    outbound: []
  });

  const [topItems, setTopItems] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState({
    totalStock: 0,
    totalProducts: 0,
    readyForDispatch: 0,
    lowStockCount: 0,
    categoryStats: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  // Stock Modal States
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ barcode: '', action: 'IN', quantity: 1, reason: '' });
  const [stockProcessing, setStockProcessing] = useState(false);
  const [stockMessage, setStockMessage] = useState(null);
  const [lookedUpItem, setLookedUpItem] = useState(null);

  const fetchDashboardData = async () => {
    console.log('📊 Fetching dashboard data...');
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/dashboard/inventory-movement'),
        api.get('/dashboard/top-items'),
        api.get('/dashboard/low-stock'),
        api.get('/dashboard/recent-transactions'),
        api.get('/finished-products/summary')
      ]);

      if (results[0].status === 'fulfilled') {
        const statsResponse = results[0].value.data;
        if (statsResponse.success) {
          const statsData = statsResponse.data;
          setStats({
            totalInventory: statsData.totalInventory || 0,
            lowStockItems: statsData.lowStockItems || 0,
            pendingRequests: statsData.pendingRequests || 0,
            presentToday: statsData.presentToday || 0,
            totalEmployees: statsData.totalEmployees || 0,
            attendancePercentage: statsData.attendancePercentage || 0,
            distinctItems: statsData.distinctItems || 0
          });
        }
      }

      if (results[1].status === 'fulfilled' && results[1].value.data.success) {
        setInventoryMovement(results[1].value.data.data);
      }
      if (results[2].status === 'fulfilled' && results[2].value.data.success) {
        setTopItems(results[2].value.data.data || []);
      }
      if (results[3].status === 'fulfilled' && results[3].value.data.success) {
        setLowStockList(results[3].value.data.data || []);
      }
      if (results[4].status === 'fulfilled' && results[4].value.data.success) {
        setRecentTransactions(results[4].value.data.data || []);
      }
      if (results[5].status === 'fulfilled' && results[5].value.data.success) {
        const fpData = results[5].value.data.data;
        setFinishedProducts({
          totalStock: fpData?.totalStock || 0,
          totalProducts: fpData?.totalProducts || 0,
          readyForDispatch: fpData?.totalProducts || 0,
          lowStockCount: fpData?.lowStockCount || 0,
          categoryStats: fpData?.categories || [],
          topProducts: fpData?.recentlyAdded || []
        });
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Stock Modal Handlers
  const handleStockFormChange = (e) => {
    const { name, value } = e.target;
    setStockForm(prev => ({ ...prev, [name]: value }));
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

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setStockProcessing(true);
    setStockMessage(null);
    try {
      await api.post('/inventory/scan', { ...stockForm, quantity: Number(stockForm.quantity) });
      setStockMessage({ type: 'success', text: 'Inventory updated successfully.' });
      setStockForm({ barcode: '', action: stockForm.action, quantity: 1, reason: '' });
      setLookedUpItem(null);
      fetchDashboardData();
      setTimeout(() => {
        setShowStockModal(false);
        setStockMessage(null);
      }, 1500);
    } catch (error) {
      setStockMessage({ type: 'error', text: error?.response?.data?.message || 'Unable to process scan.' });
    } finally {
      setStockProcessing(false);
    }
  };

  if (isEmployee) {
    return <EmployeeDashboard />;
  }

  // --- Prepare Chart Data ---
  const movementChartData = (inventoryMovement?.dates || []).map((date, index) => ({
    name: date,
    inbound: inventoryMovement.inbound[index] || 0,
    outbound: Math.abs(inventoryMovement.outbound[index] || 0)
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <CubeLoader />
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* Page Title & Actions */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-primary">Dashboard</h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStockModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-primary/30 rounded-full text-sm font-medium text-primary hover:bg-white transition-colors"
          >
            <span>+</span> Add Item
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-primary/30 rounded-full text-sm font-medium text-primary hover:bg-white transition-colors">
            This Month <span className="ml-1 text-xs">▼</span>
          </button>
          <div className="p-2 border border-primary/30 rounded-lg text-primary hover:bg-white cursor-pointer">
            <HiOutlineCalendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Left Column (Cards) - Span 4 */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Total Products */}
            <div className="bg-[#B4DBD0] p-5 rounded-2xl relative shadow-sm">
              <p className="text-sm font-medium text-primary/70 mb-1">Total Products</p>
              <h2 className="text-4xl font-bold text-primary mb-2">{stats.distinctItems}</h2>
              <div className="flex items-center text-xs font-semibold text-primary/60">
                <HiOutlineArrowUp className="mr-1" /> 12% vs last month
              </div>
            </div>

            {/* Card 2: Low Stock (Detailed) */}
            <div className="bg-emerald-custom p-5 rounded-2xl relative shadow-sm text-white">
              <div className="absolute top-4 right-4 bg-black/20 p-1 rounded-full cursor-pointer hover:bg-black/30">
                <HiOutlineArrowRight className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm font-medium text-white/90 mb-1">Low Stock</p>
              <h2 className="text-4xl font-bold text-white mb-2">{stats.lowStockItems}</h2>
            </div>

            {/* Card 3: Total Inventory */}
            <div className="bg-emerald-custom p-5 rounded-2xl relative shadow-sm text-white">
              <p className="text-sm font-medium text-white/90 mb-1">Total in Inventory</p>
              <h2 className="text-4xl font-bold text-white mb-2">{stats.totalInventory}</h2>
              <div className="flex items-center text-xs font-medium text-white/80">
                <HiOutlineArrowUp className="mr-1" /> 1% vs last month
              </div>
            </div>

            {/* Card 4: Out of Stock */}
            <div className="bg-[#B4DBD0] p-5 rounded-2xl relative shadow-sm">
              <div className="absolute top-4 right-4 bg-primary/10 p-1 rounded-full cursor-pointer hover:bg-primary/20">
                <HiOutlineArrowRight className="w-3 h-3 text-primary" />
              </div>
              <p className="text-sm font-medium text-primary/70 mb-1">Out of Stock</p>
              <h2 className="text-4xl font-bold text-primary mb-2">0</h2>
            </div>
          </div>

          {/* White Card: Ready for Dispatch */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary mb-1">Ready For Dispatch</p>
            </div>
            <div className="text-3xl font-bold text-primary">{finishedProducts.readyForDispatch}</div>
            <div className="bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-light">
              <HiOutlineArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Orders / Customers Stats */}
          <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-2xl">
            <div className="bg-emerald-custom p-6 flex flex-col justify-center items-start text-white relative">
              <h2 className="text-3xl font-bold mb-1">{stats.pendingRequests}</h2>
              <p className="text-lg font-semibold mb-2">Orders</p>
              <span className="text-[10px] opacity-80">awaiting confirmation</span>

              <div className="absolute top-1/2 -right-6 -translate-y-1/2 w-12 h-12 bg-mint rounded-full flex items-center justify-center z-10 border-4 border-white">
                <HiOutlineArrowRight className="text-emerald-custom w-5 h-5" />
              </div>
            </div>
            <div className="bg-emerald-custom/90 p-6 flex flex-col justify-center items-end text-white text-right pl-8">
              <h2 className="text-3xl font-bold mb-1">{stats.totalEmployees}</h2>
              <p className="text-lg font-semibold mb-2">Staff</p>
              <span className="text-[10px] opacity-80">active members</span>
            </div>
          </div>

          {/* Low Stocks List - Moved here from right column */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary">Low Stocks</h3>
            </div>
            <div className="flex flex-col gap-3">
              {lowStockList.length === 0 ? (
                <p className="text-sm text-gray-400">No items low on stock.</p>
              ) : (
                lowStockList.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">{item.quantity} / {item.threshold}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Charts & Tables) - Span 8 */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

          {/* Inventory Movement Chart */}
          <div className="bg-primary rounded-3xl p-6 text-white h-[320px] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Inventory Movement</h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-custom/60 rounded-sm"></span> InBound
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#B4DBD0] rounded-sm"></span> OutBound
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={movementChartData} barSize={20}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0C3834', borderColor: '#2D5F5A', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="inbound" stackId="a" fill="rgba(16, 185, 129, 0.6)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="outbound" stackId="a" fill="#B4DBD0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Sales Table - Now Full Width */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">Recent Sales</h3>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5">
              <div className="bg-primary text-white grid grid-cols-5 px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                <div>ID</div>
                <div className="col-span-2">Item Name</div>
                <div>Status</div>
                <div className="text-right">Qty</div>
              </div>
              <div className="flex flex-col">
                {recentTransactions.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No recent transactions.</div>
                ) : (
                  recentTransactions.slice(0, 7).map((tx, idx) => (
                    <div key={idx} className={`grid grid-cols-5 px-6 py-4 text-sm items-center border-b border-gray-100 last:border-0
                                          ${idx % 2 === 0 ? 'bg-primary/5' : 'bg-white'}`}>
                      <div className="font-mono text-xs opacity-70">COMP-{String(idx + 1).padStart(3, '0')}</div>
                      <div className="font-medium text-primary col-span-2">{tx.item_name || tx.itemName || 'Unknown Item'}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                                                 ${(tx.action === 'IN' || tx.type === 'in') ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {(tx.action === 'IN' || tx.type === 'in') ? 'Stock In' : 'Stock Out'}
                        </span>
                      </div>
                      <div className="font-bold text-primary text-right">{tx.quantity}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Finished Products Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary">Top Products In Stock</h3>
              <button className="text-xs font-bold text-emerald-custom hover:text-emerald-600 transition-colors uppercase tracking-wider">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Name</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Spec</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stock</th>
                    <th className="pb-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {(finishedProducts.topProducts || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-4 text-center text-gray-400 italic">No products available</td>
                    </tr>
                  ) : (
                    finishedProducts.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 font-medium text-primary">{product.name || product.product_name}</td>
                        <td className="py-3 text-gray-500">{product.category}</td>
                        <td className="py-3 text-center text-gray-500">{product.specification || '-'}</td>
                        <td className="py-3 text-center font-bold text-primary">{product.stock}</td>
                        <td className="py-3 text-center">
                          {product.stock > (product.min_stock || 10) ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">READY</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">LOW</span>
                          )}
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

      {/* Stock In/Out Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowStockModal(false)}>
          <div className="bg-primary rounded-3xl p-8 w-[500px] shadow-2xl relative text-white" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowStockModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <HiOutlineX className="text-xl" />
            </button>

            <h2 className="text-xl font-bold mb-6">Stock In / Stock Out</h2>

            <form onSubmit={handleStockSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">Barcode or Item Name</label>
                <div className="relative">
                  <HiOutlineQrcode className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg" />
                  <input
                    name="barcode"
                    value={stockForm.barcode}
                    onChange={handleStockFormChange}
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
                      value={stockForm.action}
                      onChange={handleStockFormChange}
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
                    value={stockForm.quantity}
                    onChange={handleStockFormChange}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white text-center font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-white/80 mb-2">Reason</label>
                <textarea
                  name="reason"
                  rows="3"
                  value={stockForm.reason}
                  onChange={handleStockFormChange}
                  placeholder="Reason for inventory update"
                  className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={stockProcessing}
                className="w-40 py-2.5 bg-[#D1FAE5] text-primary font-bold rounded-xl hover:bg-white transition-colors"
              >
                {stockProcessing ? 'Processing...' : 'Submit'}
              </button>

              {stockMessage && (
                <div className={`mt-4 text-center text-sm font-bold ${stockMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {stockMessage.text}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
