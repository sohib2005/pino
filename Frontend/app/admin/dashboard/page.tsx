'use client';

import { useEffect, useState } from 'react';
import { clientsApi, ordersApi, productsApi, Client, Order, Product } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Activity {
  id: string;
  type: 'client' | 'order' | 'product';
  title: string;
  time: string;
  icon: string;
  color: string;
}

interface DailyOrderCount {
  date: string;
  count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersPerDay, setOrdersPerDay] = useState<DailyOrderCount[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedPeriodOrders, setSelectedPeriodOrders] = useState<Order[]>([]);
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      calculateChartData();
    }
  }, [chartPeriod, periodOffset, orders]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch both regular orders and custom orders (grandes commandes)
      const [clients, regularOrders, customOrdersRaw, productsData] = await Promise.all([
        clientsApi.getAll(),
        ordersApi.getAllAdmin(),
        fetch('http://localhost:3001/custom-orders/all')
          .then(async (res) => {
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) return data;
            if (Array.isArray((data as any)?.customOrders)) return (data as any).customOrders;
            if (Array.isArray((data as any)?.data)) return (data as any).data;
            return [];
          })
          .catch(() => []),
        productsApi.getAll(),
      ]);

      // Combine all orders
      const allOrders = [
        ...regularOrders,
        ...customOrdersRaw.map((order: any) => ({
          ...order,
          isCustomOrder: true
        }))
      ];

      setOrders(allOrders);
      setProducts(productsData);

      // Calculate stats from all order types
      const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      setStats({
        totalClients: clients.length,
        totalOrders: allOrders.length,
        totalRevenue,
        totalProducts: productsData.length,
      });

      // Calculate initial chart data with all orders
      calculateChartData(allOrders);

      // Generate recent activities
      const activities: Activity[] = [];

      // Add recent clients
      const recentClients = clients
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      recentClients.forEach(client => {
        activities.push({
          id: `client-${client.id}`,
          type: 'client',
          title: `Nouveau client inscrit: ${client.firstName || ''} ${client.lastName || client.phoneNumber}`,
          time: getTimeAgo(client.createdAt),
          icon: 'user',
          color: 'blue',
        });
      });

      // Add recent orders (all types)
      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      recentOrders.forEach((order: any) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Nouvelle commande ${order.orderNumber}${order.isCustomOrder ? ' (Grande Commande)' : ''}`,
          time: getTimeAgo(order.createdAt),
          icon: 'shopping',
          color: order.isCustomOrder ? 'purple' : 'green',
        });
      });

      // Add recent products
      const recentProducts = productsData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);
      
      recentProducts.forEach(product => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          title: `Nouveau produit ajouté: ${product.name}`,
          time: getTimeAgo(product.createdAt),
          icon: 'box',
          color: 'purple',
        });
      });

      // Sort all activities by time (most recent first)
      activities.sort((a, b) => {
        // Simple sorting, in a real app you'd use actual timestamps
        return 0; // Keep mixed order for now
      });

      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    return past.toLocaleDateString('fr-FR');
  };

  // Get orders pending for more than 48 hours
  const getPendingOrdersCount = () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    return orders.filter(order => 
      order.status === 'EN_ATTENTE' && 
      new Date(order.createdAt) < twoDaysAgo
    ).length;
  };

  // Get most ordered product today
  const getMostOrderedProductToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today;
    });

    if (todayOrders.length === 0) return null;

    // Count products from all order types
    const productCounts: { [key: string]: { name: string; count: number } } = {};
    todayOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        let productId, productName;
        
        // Handle custom orders vs regular orders
        if (order.isCustomOrder) {
          productId = item.variant?.product?.id || item.variantId;
          productName = item.variant?.product?.name || 'Produit personnalisé';
        } else {
          productId = item.tshirt?.id || item.tshirtId;
          productName = item.tshirt?.name || 'Unknown Product';
        }
        
        if (!productCounts[productId]) {
          productCounts[productId] = { name: productName, count: 0 };
        }
        productCounts[productId].count += item.quantity;
      });
    });

    // Find max
    let maxProduct = null;
    let maxCount = 0;
    Object.entries(productCounts).forEach(([id, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        maxProduct = data.name;
      }
    });

    return maxProduct;
  };

  // Get critical stock count (low stock or out of stock)
  const getCriticalStockCount = () => {
    const LOW_STOCK_THRESHOLD = 5;
    let count = 0;
    // Products are now t-shirts directly, no variants
    products.forEach(product => {
      if (product.stock <= LOW_STOCK_THRESHOLD) {
        count++;
      }
    });
    return count;
  };

  // Calculate chart data based on selected period and offset
  const calculateChartData = (ordersData: Order[] = orders) => {
    const chartData: DailyOrderCount[] = [];
    
    if (chartPeriod === 'day') {
      // Show 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i - (periodOffset * 7));
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const count = ordersData.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= date && orderDate < nextDay;
        }).length;
        
        chartData.push({
          date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          count,
        });
      }
    } else if (chartPeriod === 'week') {
      // Show 8 weeks
      for (let i = 7; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (i * 7) - (periodOffset * 56));
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        const count = ordersData.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        }).length;
        
        const weekNum = Math.ceil((endDate.getTime() - new Date(endDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        chartData.push({
          date: `S${weekNum}`,
          count,
        });
      }
    } else if (chartPeriod === 'month') {
      // Show 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i - (periodOffset * 6));
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        const count = ordersData.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= date && orderDate < nextMonth;
        }).length;
        
        chartData.push({
          date: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          count,
        });
      }
    }
    
    setOrdersPerDay(chartData);
  };

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setChartPeriod(newPeriod);
    setPeriodOffset(0); // Reset offset when changing period
  };

  const handleNavigateChart = (direction: 'prev' | 'next') => {
    if (direction === 'next' && periodOffset > 0) {
      setPeriodOffset(periodOffset - 1);
    } else if (direction === 'prev') {
      setPeriodOffset(periodOffset + 1);
    }
  };

  const handleChartBarClick = (index: number) => {
    let startDate: Date, endDate: Date, label: string;
    
    if (chartPeriod === 'day') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (6 - index) - (periodOffset * 7));
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      label = startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (chartPeriod === 'week') {
      endDate = new Date();
      endDate.setDate(endDate.getDate() - ((7 - index) * 7) - (periodOffset * 56));
      endDate.setHours(23, 59, 59, 999);
      
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      
      label = `Semaine du ${startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
    } else {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (5 - index) - (periodOffset * 6));
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      label = startDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate < endDate;
    });
    
    setSelectedPeriodOrders(filteredOrders);
    setSelectedPeriodLabel(label);
    setShowOrdersModal(true);
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'shopping':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'box':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Total Commandes',
      value: stats.totalOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'Revenu Total',
      value: `${stats.totalRevenue.toLocaleString()} DT`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Produits',
      value: stats.totalProducts,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
        </div>
      ) : (
        <>
          {/* Alert Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Pending Orders Alert */}
            <Link 
              href="/admin/orders?filter=EN_ATTENTE"
              className="block bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-sm font-semibold text-orange-800">Alerte Commandes</span>
                  </div>
                  <p className="text-xl font-bold text-orange-900 mb-1">
                    {getPendingOrdersCount()} commande{getPendingOrdersCount() > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-orange-700">en attente depuis +48h</p>
                </div>
                <div className="text-orange-400 group-hover:text-orange-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Most Ordered Product */}
            <Link 
              href="/admin/products"
              className="block bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <span className="text-sm font-semibold text-red-800">Top Produit</span>
                  </div>
                  <p className="text-sm font-bold text-red-900 mb-1 truncate">
                    {getMostOrderedProductToday() || 'Aucune vente'}
                  </p>
                  <p className="text-xs text-red-700">le plus commandé aujourd'hui</p>
                </div>
                <div className="text-red-400 group-hover:text-red-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Critical Stock Alert */}
            <Link 
              href="/admin/stock?filter=low-stock"
              className="block bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📉</span>
                    <span className="text-sm font-semibold text-yellow-800">Stock Critique</span>
                  </div>
                  <p className="text-xl font-bold text-yellow-900 mb-1">
                    {getCriticalStockCount()} produit{getCriticalStockCount() > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-700">nécessitent votre attention</p>
                </div>
                <div className="text-yellow-400 group-hover:text-yellow-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} text-white p-3 rounded-lg`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header with Period Buttons */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-pino-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Graphique des commandes
              </h2>
              
              {/* Period Selection Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePeriodChange('day')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    chartPeriod === 'day'
                      ? 'bg-pino-blue text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Jours
                </button>
                <button
                  onClick={() => handlePeriodChange('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    chartPeriod === 'week'
                      ? 'bg-pino-blue text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Semaines
                </button>
                <button
                  onClick={() => handlePeriodChange('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    chartPeriod === 'month'
                      ? 'bg-pino-blue text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Mois
                </button>
              </div>
            </div>

            {/* Navigation and Chart */}
            <div className="flex items-center gap-4">
              {/* Previous Arrow */}
              <button
                onClick={() => handleNavigateChart('prev')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex-shrink-0"
                title="Période précédente"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Chart */}
              <div className="flex-1 flex items-end justify-between h-48 gap-2">
              {ordersPerDay.map((day, index) => {
                const maxCount = Math.max(...ordersPerDay.map(d => d.count), 1);
                const heightPercent = (day.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '160px' }}>
                      <div 
                        onClick={() => day.count > 0 && handleChartBarClick(index)}
                        className={`w-full bg-gradient-to-t from-pino-blue to-blue-400 rounded-t-lg transition-all duration-300 hover:from-pino-blue-dark hover:to-blue-500 relative group ${day.count > 0 ? 'cursor-pointer' : ''}`}
                        style={{ height: `${heightPercent}%`, minHeight: day.count > 0 ? '20px' : '0' }}
                      >
                        {day.count > 0 && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.count} commande{day.count > 1 ? 's' : ''} - Cliquer pour voir
                          </div>
                        )}
                        <span className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white font-bold text-lg">
                          {day.count > 0 ? day.count : ''}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{day.date}</p>
                  </div>
                );
              })}
              </div>

              {/* Next Arrow */}
              <button
                onClick={() => handleNavigateChart('next')}
                disabled={periodOffset === 0}
                className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                  periodOffset === 0
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Période suivante"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Activité récente
            </h2>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center py-3 border-b border-gray-200 last:border-b-0">
                    <div className={`w-10 h-10 ${getColorClasses(activity.color)} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowOrdersModal(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Commandes - {selectedPeriodLabel}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPeriodOrders.length} commande{selectedPeriodOrders.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowOrdersModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedPeriodOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune commande pour cette période</p>
              ) : (
                <div className="space-y-4">
                  {selectedPeriodOrders.map((order: any) => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              Commande #{order.orderNumber}
                              {order.isCustomOrder && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  Grande Commande
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {order.user && (
                            <div className="text-sm text-gray-600">
                              {order.user.firstName} {order.user.lastName}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'EN_ATTENTE' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'LIVRE' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'EN_ATTENTE' ? 'En attente' :
                             order.status === 'EN_COURS' ? 'En cours' :
                             order.status === 'LIVRE' ? 'Livré' : 'Annulé'}
                          </span>
                          <span className="font-bold text-pino-blue">
                            {Number(order.totalAmount).toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Articles:</p>
                        <div className="space-y-1">
                          {order.items.map((item: any, idx: number) => {
                            const itemName = order.isCustomOrder 
                              ? `${item.variant?.product?.name || 'Produit'} (${item.printedName})`
                              : item.tshirt?.name || 'Product';
                            const itemPrice = order.isCustomOrder
                              ? (Number(item.variant?.product?.price || 0) * item.quantity)
                              : Number(item.totalPrice);
                            
                            return (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                  {itemName} × {item.quantity}
                                </span>
                                <span className="text-gray-600">
                                  {itemPrice.toFixed(2)} TND
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Link
                          href={`/admin/orders`}
                          onClick={() => setShowOrdersModal(false)}
                          className="text-sm text-pino-blue hover:text-pino-blue-dark font-medium"
                        >
                          Voir détails →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
