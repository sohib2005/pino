'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { productsApi } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [client, setClient] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [pendingReturns, setPendingReturns] = useState(0);
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(false);
  const ordersType = searchParams.get('type');

  useEffect(() => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (!clientData) {
      router.push('/login');
      return;
    }
    
    const parsedClient = JSON.parse(clientData);
    if (parsedClient.role !== 'ADMIN') {
      router.push('/boutique');
      return;
    }
    
    setClient(parsedClient);
    checkStockAlerts();
    checkPendingOrders();
    checkTrashCount();
    checkPendingReturns();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(() => {
      checkStockAlerts();
      checkPendingOrders();
      checkTrashCount();
      checkPendingReturns();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) {
      setIsOrdersMenuOpen(true);
    }
  }, [pathname]);

  const checkStockAlerts = async () => {
    try {
      const products = await productsApi.getAll();
      let alertCount = 0;
      const LOW_STOCK_THRESHOLD = 10;
      
      // Count variants with low or zero stock
      products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            if (variant.stock <= LOW_STOCK_THRESHOLD) {
              alertCount++;
            }
          });
        }
      });
      
      setStockAlerts(alertCount);
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  };

  const checkPendingOrders = async () => {
    try {
      // Fetch both regular orders and custom orders
      const [ordersResponse, customOrdersResponse] = await Promise.all([
        fetch('http://localhost:3001/orders/all'),
        fetch('http://localhost:3001/custom-orders/all'),
      ]);
      
      if (!ordersResponse.ok || !customOrdersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const ordersData = await ordersResponse.json();
      const customOrdersData = await customOrdersResponse.json();
      
      const orders = Array.isArray(ordersData) ? ordersData : [];
      const customOrders = Array.isArray(customOrdersData) ? customOrdersData : [];
      
      // Count all orders with status EN_ATTENTE (both regular and custom)
      const pendingRegular = orders.filter((order: any) => order.status === 'EN_ATTENTE').length;
      const pendingCustom = customOrders.filter((order: any) => order.status === 'EN_ATTENTE').length;
      
      setPendingOrders(pendingRegular + pendingCustom);
    } catch (error) {
      console.error('Error checking pending orders:', error);
      setPendingOrders(0);
    }
  };

  const checkTrashCount = async () => {
    try {
      const trash = await productsApi.getTrash();
      setTrashCount(Array.isArray(trash) ? trash.length : 0);
    } catch (error) {
      console.error('Error checking trash count:', error);
      setTrashCount(0);
    }
  };

  const checkPendingReturns = async () => {
    try {
      const response = await fetch('http://localhost:3001/returns?status=EN_ATTENTE');
      if (!response.ok) {
        throw new Error('Failed to fetch returns');
      }
      const data = await response.json();
      const returns = Array.isArray(data) ? data : [];
      setPendingReturns(returns.length);
    } catch (error) {
      console.error('Error checking returns:', error);
      setPendingReturns(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('client');
    sessionStorage.removeItem('client');
    router.push('/');
  };

  const menuItems = [
    {
      name: 'Tableau de bord',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Commandes',
      href: '/admin/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      alert: pendingOrders > 0,
      alertCount: pendingOrders,
    },
    {
      name: 'Clients',
      href: '/admin/clients',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Produits',
      href: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      alert: trashCount > 0,
      alertCount: trashCount,
    },
    {
      name: 'Catégories',
      href: '/admin/categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      name: 'Carousel',
      href: '/admin/carousel',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Gestion du Stock',
      href: '/admin/stock',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      alert: stockAlerts > 0,
      alertCount: stockAlerts,
    },
    {
      name: 'Retours',
      href: '/admin/returns',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
      alert: pendingReturns > 0,
      alertCount: pendingReturns,
    },
    {
      name: 'Animateurs',
      href: '/admin/animateurs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Modèles (Album)',
      href: '/admin/templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  />
                </svg>
              </button>
              <Link href="/admin/dashboard" className="flex ml-2 md:mr-24">
                <img
                  src="/pino-logo.png"
                  className="h-12 mr-3"
                  alt="Pino Logo"
                />
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
                  Admin
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ml-3">
                <div className="mr-3 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Administrateur</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-20 w-64 h-screen pt-20 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
          <ul className="space-y-2 font-medium">
            {menuItems.map((item) => (
              <li key={item.href}>
                {item.name === 'Commandes' ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsOrdersMenuOpen((prev) => !prev)}
                      className={`w-full flex items-center p-2 rounded-lg group relative ${
                        pathname.startsWith('/admin/orders')
                          ? 'bg-pino-blue text-white'
                          : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                      {item.alert && item.alertCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {item.alertCount}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 ml-2 transition-transform ${isOrdersMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOrdersMenuOpen && (
                      <div className="ml-8 mt-3 space-y-2">
                        <Link
                          href="/admin/orders?type=all"
                          className="relative block px-2 py-2 pl-4 text-base text-gray-700 hover:text-pino-blue"
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-pino-blue transition-all duration-300 ${
                              ordersType === 'all' || !ordersType ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                            }`}
                          />
                          Tous
                        </Link>
                        <Link
                          href="/admin/orders?type=normal"
                          className="relative block px-2 py-2 pl-4 text-base text-gray-700 hover:text-pino-blue"
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-pino-blue transition-all duration-300 ${
                              ordersType === 'normal' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                            }`}
                          />
                          Normal
                        </Link>
                        <Link
                          href="/admin/orders?type=touristique"
                          className="relative block px-2 py-2 pl-4 text-base text-gray-700 hover:text-pino-blue"
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-pino-blue transition-all duration-300 ${
                              ordersType === 'touristique' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                            }`}
                          />
                          Touristique
                        </Link>
                        <Link
                          href="/admin/orders?type=personnaliser"
                          className="relative block px-2 py-2 pl-4 text-base text-gray-700 hover:text-pino-blue"
                        >
                          <span
                            className={`absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-pino-blue transition-all duration-300 ${
                              ordersType === 'personnaliser' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                            }`}
                          />
                          Personnalisé
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center p-2 rounded-lg group relative ${
                      pathname === item.href
                        ? 'bg-pino-blue text-white'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                    {item.alert && item.alertCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.alertCount}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="pt-4 mt-4 space-y-2 border-t border-gray-200">
            <Link
              href="/boutique"
              className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="ml-3">Retour au site</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-4 ${sidebarOpen ? 'ml-64' : ''} mt-14 transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
}
