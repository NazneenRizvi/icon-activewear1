import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  BarChart3,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Truck,
  Clock,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Filter,
  Crown,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { STORE_OWNER_CONFIG } from '../config';
import { Order, Product, ProductCategory } from '../types';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'categories' | 'coupons' | 'customers' | 'settings';

export const AdminPanel: React.FC = () => {
  const {
    isAdminViewOpen,
    setIsAdminViewOpen,
    orders, ordersError, ordersLoading, refreshOrders,
    updateOrderStatus,
    deleteOrder,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    ownerWhatsApp,
    setOwnerWhatsApp,
    ownerEmail
  } = useCart();

  const { formatPrice } = useCurrency();
  const { user, isOwner, login } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Search and filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Tracking modal / dialog
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [trackingCarrier, setTrackingCarrier] = useState('Trax Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Add Product Form modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('seamless-leggings');
  const [newProdPricePkr, setNewProdPricePkr] = useState<number>(8500);
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdFabric, setNewProdFabric] = useState('88% Polyamide, 12% Elastane');

  const addProductModalRef = useRef<HTMLDivElement>(null);

  // Close Add Product modal when clicking outside
  useEffect(() => {
    if (!isAddProductModalOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (addProductModalRef.current && !addProductModalRef.current.contains(event.target as Node)) {
        setIsAddProductModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isAddProductModalOpen]);

  // Close Add Product modal on Escape key
  useEffect(() => {
    if (!isAddProductModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddProductModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddProductModalOpen]);

  // Toast notice
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  // Live Real Store KPI Calculations (100% genuine data, no fake additives)
  const totalRevenuePkr = useMemo(() => {
    return orders.reduce((acc, o) => {
      const val = typeof o.total === 'number' ? o.total : Number(o.total) || 0;
      return acc + (o.currency === 'PKR' ? val : Math.round(val * 277.5));
    }, 0);
  }, [orders]);

  const totalOrdersCount = orders.length;

  const totalCustomersCount = useMemo(() => {
    return new Set(orders.map((o) => o.email?.toLowerCase().trim()).filter(Boolean)).size;
  }, [orders]);

  const avgOrderValuePkr = totalOrdersCount > 0 ? Math.round(totalRevenuePkr / totalOrdersCount) : 0;

  // Live Revenue Trend calculated strictly from real store orders
  const liveRevenueTrend = useMemo(() => {
    if (orders.length === 0) return [];
    const dateMap = new Map<string, { revenue: number; orders: number }>();
    const sorted = [...orders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (const order of sorted) {
      const dateKey = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recent';
      const existing = dateMap.get(dateKey) || { revenue: 0, orders: 0 };
      const val = typeof order.total === 'number' ? order.total : Number(order.total) || 0;
      existing.revenue += (order.currency === 'PKR' ? val : Math.round(val * 277.5));
      existing.orders += 1;
      dateMap.set(dateKey, existing);
    }

    return Array.from(dateMap.entries()).map(([day, val]) => ({
      day,
      revenue: val.revenue,
      orders: val.orders,
    }));
  }, [orders]);

  // Live Top Products calculated strictly from real customer purchases
  const liveTopProducts = useMemo(() => {
    if (orders.length === 0) return [];
    const productMap = new Map<string, { name: string; units: number; revenue: number }>();

    for (const order of orders) {
      if (!order.items) continue;
      for (const item of order.items) {
        const prodName = item.name || 'Activewear Item';
        const existing = productMap.get(prodName) || { name: prodName, units: 0, revenue: 0 };
        const qty = item.quantity || 1;
        const price = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
        existing.units += qty;
        existing.revenue += (order.currency === 'PKR' ? price * qty : Math.round(price * qty * 277.5));
        productMap.set(prodName, existing);
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [orders]);

  if (!isAdminViewOpen || !isOwner) return null;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesSearch =
      orderSearch === '' ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone.includes(orderSearch) ||
      o.city.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesSearch =
      productSearch === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'City', 'Status', 'Total USD', 'Date'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName}"`,
      o.email,
      o.phone,
      `"${o.city}"`,
      o.status,
      o.total,
      o.createdAt
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICON_ACTIVEWEAR_ORDERS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV successfully!');
  };

  // Handle Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName.toUpperCase(),
      slug: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newProdCategory as any,
      categoryLabel: newProdCategory === 'seamless-leggings' ? 'SHOP SEAMLESS' : 'ACTIVEWEAR',
      usdPrice: Math.round((newProdPricePkr / 277.5) * 100) / 100,
      pkrPrice: newProdPricePkr,
      image: newProdImage || '/images/hero_pink_activewear_1790852235638.jpg',
      colors: [
        { name: 'Obsidian Black', hex: '#111111' },
        { name: 'Blush Rose', hex: '#cf9893' }
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      description: newProdDesc || 'Premium high-density 280 GSM circular seamless activewear engineered for extreme performance and zero roll-down.',
      details: ['4-Way Micro-Knit', 'Zero front seam', 'Anti-slip ribbed waistband'],
      fabric: newProdFabric,
      rating: 5.0,
      reviewsCount: 1,
      isNew: true,
      inStock: true
    };

    addProduct(newProduct);
    setIsAddProductModalOpen(false);
    setNewProdName('');
    setNewProdImage('');
    setNewProdDesc('');
    showToast(`Product "${newProduct.name}" created successfully!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#F8F9FA] flex text-neutral-900 font-sans">
      {(ordersError || ordersLoading) && <div role="status" className="fixed bottom-4 left-4 right-4 z-[60] bg-amber-50 border border-amber-300 p-3 text-sm">
        {ordersLoading ? 'Loading orders…' : `Orders unavailable: ${ordersError}`}
        {!ordersLoading && <button className="ml-3 underline" onClick={() => void refreshOrders()}>Retry</button>}
      </div>}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-black text-white px-4 py-2.5 rounded-sm shadow-xl text-xs font-bold flex items-center gap-2 animate-fade-in border border-neutral-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } transition-all duration-300 bg-white border-r border-neutral-200 flex flex-col justify-between shrink-0 z-20`}
      >
        <div>
          {/* Logo & Toggle Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            {isSidebarOpen ? (
              <div>
                <span className="text-xs font-black tracking-widest uppercase font-display block text-neutral-900">
                  ICON ACTIVEWEAR
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                  Store Admin HQ (Karachi)
                </span>
              </div>
            ) : (
              <span className="font-black text-sm">IA</span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Dashboard Overview</span>}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'products' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <span className="flex-1 flex items-center justify-between">
                  <span>Products Catalog</span>
                  <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded-full">
                    {products.length}
                  </span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'orders' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <span className="flex-1 flex items-center justify-between">
                  <span>Customer Orders</span>
                  <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.2 rounded-full">
                    {orders.length}
                  </span>
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'coupons' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Coupons & Discounts</span>}
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'customers' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Customers CRM</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer ${
                activeTab === 'settings' ? 'bg-black text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>Store & WhatsApp Settings</span>}
            </button>
          </nav>
        </div>

        {/* Bottom User & Return to Store */}
        <div className="p-3 border-t border-neutral-200 space-y-2">
          {isSidebarOpen && (
            <div className="px-3 py-2 bg-neutral-50 border border-neutral-200 text-[11px]">
              <p className="font-bold text-neutral-900 truncate">{STORE_OWNER_CONFIG.name}</p>
              <p className="text-neutral-500 truncate">{ownerEmail}</p>
            </div>
          )}

          <button
            onClick={() => setIsAdminViewOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            {isSidebarOpen && <span>Return to Storefront</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
              {activeTab === 'dashboard' && 'Executive Store Dashboard'}
              {activeTab === 'products' && 'Product Catalog Management'}
              {activeTab === 'orders' && 'Real-Time Orders Fulfillment'}
              {activeTab === 'coupons' && 'Promotions & Coupons Manager'}
              {activeTab === 'customers' && 'Customer Base & Orders History'}
              {activeTab === 'settings' && 'Store Configuration & WhatsApp Dispatch'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${ownerWhatsApp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp: {ownerWhatsApp}</span>
            </a>

            <button
              onClick={() => setIsAdminViewOpen(false)}
              className="p-1.5 text-neutral-500 hover:text-black cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  Rs. {totalRevenuePkr.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                  <span>{totalOrdersCount > 0 ? 'Live confirmed sales' : 'Fresh store (0 sales yet)'}</span>
                </div>
              </div>

              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  {totalOrdersCount} Orders
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                  <span>{totalOrdersCount > 0 ? `${totalOrdersCount} live order${totalOrdersCount > 1 ? 's' : ''}` : '0 orders placed yet'}</span>
                </div>
              </div>

              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Customers</span>
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  {totalCustomersCount} {totalCustomersCount === 1 ? 'Customer' : 'Customers'}
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                  <span>{totalCustomersCount > 0 ? `${totalCustomersCount} buyer${totalCustomersCount > 1 ? 's' : ''} on record` : 'Ready for first buyer'}</span>
                </div>
              </div>

              <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <span>Avg Order Value (AOV)</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-neutral-900">
                  Rs. {avgOrderValuePkr.toLocaleString()}
                </div>
                <div className="text-[11px] text-neutral-500 font-semibold">
                  <span>Target: Rs. 8,000 for Free COD</span>
                </div>
              </div>
            </div>

            {/* Charts Row using Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Revenue Over Time Chart */}
              <div className="lg:col-span-8 bg-white p-6 border border-neutral-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                      Revenue Trend (Live Storefront Sales)
                    </h3>
                    <p className="text-xs text-neutral-500">Gross sales across Pakistan in PKR</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-neutral-100 text-neutral-800">
                    Live Database
                  </span>
                </div>

                {liveRevenueTrend.length === 0 ? (
                  <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-300 bg-neutral-50/60">
                    <TrendingUp className="w-8 h-8 text-neutral-400 mb-2 stroke-1" />
                    <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">No Sales Recorded Yet</p>
                    <p className="text-[11px] text-neutral-500 max-w-sm mt-1">
                      As customer orders are placed on your storefront, your live revenue trend will plot here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={liveRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Rs.${val / 1000}k`} />
                        <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top Products Units Chart */}
              <div className="lg:col-span-4 bg-white p-6 border border-neutral-200 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                    Top Sellers By Volume
                  </h3>
                  <p className="text-xs text-neutral-500">Units ordered by Pakistani customers</p>
                </div>

                {liveTopProducts.length === 0 ? (
                  <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-300 bg-neutral-50/60">
                    <Package className="w-8 h-8 text-neutral-400 mb-2 stroke-1" />
                    <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">No Items Sold Yet</p>
                    <p className="text-[11px] text-neutral-500 max-w-xs mt-1">
                      Your best-selling activewear pieces will rank here automatically once customer orders start coming in.
                    </p>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={liveTopProducts} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip formatter={(val: any) => [`${val} units`, 'Sold']} />
                        <Bar dataKey="units" fill="#111111" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders Preview Table */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                    Latest Store Orders
                  </h3>
                  <p className="text-xs text-neutral-500">New customer orders ready for packing and dispatch</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-black underline hover:text-neutral-600 cursor-pointer"
                >
                  View All Orders ({orders.length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-400">
                          No orders placed yet. Orders from the storefront will appear here live!
                        </td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-neutral-900">{order.id}</td>
                          <td className="p-3 font-semibold text-neutral-800">{order.customerName}</td>
                          <td className="p-3 font-mono">{order.phone}</td>
                          <td className="p-3">{order.city}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-neutral-100 text-neutral-800">
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 font-black text-neutral-900">{formatPrice(order.total)}</td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setEditingOrder(order);
                              }}
                              className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase hover:bg-neutral-800 cursor-pointer"
                            >
                              Dispatch
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Catalog */}
        {activeTab === 'products' && (
          <div className="p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-neutral-200">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 focus:outline-hidden focus:border-black"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="text-xs border border-neutral-300 p-1.5 bg-white font-medium focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="seamless-leggings">Seamless Leggings</option>
                  <option value="sports-bras">Sports Bras</option>
                  <option value="bottoms">Bottoms & Shorts</option>
                  <option value="must-haves">Must Haves</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Activewear Item</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price (PKR)</th>
                    <th className="p-3">Price (USD)</th>
                    <th className="p-3">Sizes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-10 h-12 object-cover border border-neutral-200 shrink-0" />
                        <div>
                          <p className="font-bold text-neutral-900">{prod.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono">SKU: {prod.slug}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium uppercase text-neutral-600">{prod.category}</td>
                      <td className="p-3 font-bold text-neutral-900">Rs. {prod.pkrPrice.toLocaleString()}</td>
                      <td className="p-3 font-bold text-neutral-700">${prod.usdPrice}</td>
                      <td className="p-3 text-[11px] font-mono text-neutral-600">{prod.sizes.join(', ')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-emerald-100 text-emerald-800">
                          Active & In Stock
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${prod.name}?`)) {
                              deleteProduct(prod.id);
                              showToast(`Deleted ${prod.name}`);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Orders & Dispatch */}
        {activeTab === 'orders' && (
          <div className="p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-neutral-200">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by order #, phone, customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 focus:outline-hidden focus:border-black"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs border border-neutral-300 p-1.5 bg-white font-medium focus:outline-hidden"
                >
                  <option value="all">All Statuses ({orders.length})</option>
                  <option value="confirmed">New Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV for Courier</span>
              </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer & Contact</th>
                    <th className="p-3">Delivery Address</th>
                    <th className="p-3">Items Summary</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-neutral-400">
                        No orders match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-3">
                          <p className="font-mono font-bold text-neutral-900">{order.id}</p>
                          <p className="text-[10px] text-neutral-400">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-neutral-900">{order.customerName}</p>
                          <p className="font-mono text-emerald-700">{order.phone}</p>
                          <p className="text-[10px] text-neutral-400">{order.email}</p>
                        </td>

                        <td className="p-3 max-w-[200px]">
                          <p className="truncate text-neutral-800">{order.address}</p>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase">{order.city}, PK</p>
                        </td>

                        <td className="p-3">
                          <p className="font-semibold text-neutral-900">{order.items.length} item(s)</p>
                          <p className="text-[10px] text-neutral-500 line-clamp-1">
                            {order.items.map((it) => `${it.name} (${it.size})`).join(', ')}
                          </p>
                        </td>

                        <td className="p-3">
                          <p className="font-black text-neutral-900">{formatPrice(order.total)}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">
                            {order.paymentMethod === 'cash_on_delivery' ? 'COD' : 'Paid'}
                          </p>
                        </td>

                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) => {
                              updateOrderStatus(order.id, e.target.value as any);

                            }}
                            className="p-1 text-xs border border-neutral-300 font-bold uppercase rounded-xs bg-white cursor-pointer"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>

                        <td className="p-3 text-right space-x-2">
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `*Assalam-o-Alaikum ${order.customerName}!* 👋\n\n` +
                              `Your activewear order *${order.id}* from *ICON Activewear Karachi* is being processed!\n\n` +
                              `• *Total Amount:* ${formatPrice(order.total)} (Cash on Delivery)\n` +
                              `• *Shipping Address:* ${order.address}, ${order.city}\n\n` +
                              `Please confirm if you are available to receive the parcel at this address. Shukriya!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xs transition-colors cursor-pointer inline-block"
                            title="Chat with Customer on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => {
                              if (confirm(`Delete Order ${order.id}?`)) {
                                deleteOrder(order.id);
                                
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer inline-block"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Coupons */}
        {activeTab === 'coupons' && (
          <div className="p-6 space-y-4">
            <div className="bg-white p-5 border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Active Promo Codes & Coupons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300">
                      FLASH40
                    </span>
                    <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.2 rounded-full uppercase">
                      40% OFF
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">Active Flash Sale promotion on all drops.</p>
                </div>

                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300">
                      ICON15 / VIP15
                    </span>
                    <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                      15% OFF
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">Newsletter signup VIP club reward.</p>
                </div>

                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300">
                      FREESHIP
                    </span>
                    <span className="text-[10px] bg-blue-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                      FREE COD
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">Free delivery unlock across Pakistan.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Customers */}
        {activeTab === 'customers' && (
          <div className="p-6 space-y-4">
            <div className="bg-white border border-neutral-200 shadow-2xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Total Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-900">{o.customerName}</td>
                      <td className="p-3 text-neutral-600">{o.email}</td>
                      <td className="p-3 font-mono text-emerald-700">{o.phone}</td>
                      <td className="p-3">{o.city}</td>
                      <td className="p-3 font-bold">1 Order ({formatPrice(o.total)})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Settings */}
        {activeTab === 'settings' && (
          <div className="p-6 max-w-2xl space-y-6">
            <div className="bg-white p-6 border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Official Karachi HQ Settings
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    Store Owner Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Nazneen Rizvi (Store Owner)"
                    className="w-full p-2 border border-neutral-300 bg-neutral-100 text-neutral-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    Store Owner Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={ownerEmail}
                    className="w-full p-2 border border-neutral-300 bg-neutral-100 text-neutral-600 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    WhatsApp Order Receiving Phone Number
                  </label>
                  <input
                    type="text"
                    value={ownerWhatsApp}
                    onChange={(e) => setOwnerWhatsApp(e.target.value)}
                    className="w-full p-2 border border-neutral-300 focus:outline-hidden focus:border-black font-mono font-bold text-emerald-800"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Customer inquiries and instant 1-click orders from the storefront route directly to this WhatsApp number.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => showToast('Settings saved successfully!')}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                  >
                    Save Store Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <div
          onClick={() => setIsAddProductModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            ref={addProductModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-lg w-full p-6 shadow-2xl border border-neutral-300 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                Add New Activewear Item
              </h3>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ULTRA GLUTE SEAMLESS SHORTS"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2 border border-neutral-300 focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 bg-white focus:outline-hidden"
                  >
                    <option value="seamless-leggings">Seamless Leggings</option>
                    <option value="sports-bras">Sports Bras</option>
                    <option value="bottoms">Bottoms & Shorts</option>
                    <option value="must-haves">Must Haves</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    value={newProdPricePkr}
                    onChange={(e) => setNewProdPricePkr(Number(e.target.value))}
                    className="w-full p-2 border border-neutral-300 focus:outline-hidden focus:border-black font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste image link or leave blank for default"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full p-2 border border-neutral-300 focus:outline-hidden focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="High density micro-knit designed for training..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full p-2 border border-neutral-300 focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Create & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
