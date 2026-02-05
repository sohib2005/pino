'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api';

export default function Header() {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (clientData) {
      setClient(JSON.parse(clientData));
    }
    
    // Fetch cart item count
    fetchCartCount();
    
    // Listen for cart update events
    const handleCartUpdate = () => {
      fetchCartCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCartCount = async () => {
    try {
      const cart = await cartApi.get();
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartItemCount(0);
    }
  };

  useEffect(() => {
    // Close profile menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('client');
    sessionStorage.removeItem('client');
    setClient(null);
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { label: 'Accueil', href: '/' },
      { label: 'Personnaliser', href: '/boutique/personaliser' },
      { label: 'Boutique', href: '/boutique' },
    ];

    // Commande Rapide disabled - users checkout as guest from cart
    // if (!client || client.role !== 'ANIMATEUR') {
    //   baseItems.push({ label: 'Commande Rapide', href: '/quick-order' });
    // }

    // Add "Grandes commandes" only for ANIMATEUR
    if (client && client.role === 'ANIMATEUR') {
      baseItems.push({ label: 'Grandes Commandes', href: '/grandes-commandes' });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <img 
                src="/pino-logo.png" 
                alt="Pino Logo" 
                className="h-20 w-auto transform group-hover:scale-105 transition-transform duration-200"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-pino-blue font-medium transition-colors duration-200 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pino-blue group-hover:w-full transition-all duration-200"></span>
              </Link>
            ))}
          </div>

          {/* Auth Buttons / Profile Menu & Cart */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-pino-blue transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Orders Icon for logged in users */}
            {client && (
              <Link
                href="/orders"
                className="relative p-2 text-gray-600 hover:text-pino-blue transition-colors duration-200"
                title="Mes commandes"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </Link>
            )}

            {client ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-pino-blue text-white rounded-full flex items-center justify-center font-semibold">
                    {client.firstName?.charAt(0).toUpperCase() || client.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-100 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {client.email || client.phoneNumber}
                      </p>
                      {client.role && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${client.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {client.role === 'ADMIN' ? 'Administrateur' : 'Client'}
                        </span>
                      )}
                    </div>
                    {client.role === 'ADMIN' && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Tableau de bord
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Modifier le profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 bg-pino-blue text-white font-medium rounded-lg hover:bg-pino-blue-dark transform hover:scale-105 transition-all duration-200 shadow-pino hover:shadow-pino-lg"
                >
                  Se connecter
                </Link>
                <Link
                  href="/signup"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-pino-blue hover:bg-gray-100 transition-colors duration-200"
            aria-label="Menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-6 space-y-3 bg-white border-t border-gray-100">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 text-gray-600 hover:text-pino-blue hover:bg-gray-50 rounded-lg font-medium transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            {client ? (
              <>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-900">
                    {client.firstName} {client.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {client.email || client.phoneNumber}
                  </p>
                  {client.role && (
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${client.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {client.role === 'ADMIN' ? 'Administrateur' : 'Client'}
                    </span>
                  )}
                </div>
                {client.role === 'ADMIN' && (
                  <Link
                    href="/admin/dashboard"
                    className="block w-full px-4 py-2.5 text-center text-gray-600 hover:text-gray-900 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Tableau de bord
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block w-full px-4 py-2.5 text-center text-gray-600 hover:text-gray-900 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Modifier le profil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2.5 text-center text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full px-4 py-2.5 text-center bg-pino-blue text-white font-medium rounded-lg hover:bg-pino-blue-dark transition-colors duration-200 shadow-pino"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Se connecter
                </Link>
                <Link
                  href="/signup"
                  className="block w-full px-4 py-2.5 text-center text-gray-600 hover:text-gray-900 font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
