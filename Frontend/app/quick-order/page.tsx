'use client';

import { useState, useEffect } from 'react';
import { Product as ApiProduct, productsApi } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface Product extends ApiProduct {
  variants?: any[];
}

interface CartItem {
  variantId: number;
  quantity: number;
  product: Product;
  variant: any;
  size: string;
  sku: string;
  price: number;
}

interface GuestFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  notes: string;
}

export default function QuickOrderPage() {
  const router = useRouter();
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showWarning } = useCustomAlert();
  
  // Products & Filters
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [guestForm, setGuestForm] = useState<GuestFormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Size Selection Modal
  const [sizeModalProduct, setSizeModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Check if user is ANIMATEUR and redirect
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (clientData) {
      const parsedClient = JSON.parse(clientData);
      if (parsedClient.role === 'ANIMATEUR') {
        showError('Les animateurs doivent utiliser la section "Grandes Commandes"');
        setTimeout(() => router.push('/grandes-commandes'), 2000);
        return;
      }
    }
    
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedColor, sortBy]);

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll();
      setProducts(data.filter(p => p.isActive));
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Search
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.color.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Color filter
    if (selectedColor) {
      filtered = filtered.filter(p => p.color === selectedColor);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
      return 0;
    });
    
    setFilteredProducts(filtered);
  };

  const availableColors = Array.from(new Set(products.map(p => p.color)));

  const handleAddToCart = (product: Product, variant?: any) => {
    if (!variant && product.variants && product.variants.length > 0) {
      // Open size selection modal
      setSizeModalProduct(product);
      return;
    }
    
    const selectedVariant = variant || product.variants?.[0];
    if (!selectedVariant) {
      showError('Aucune variante disponible');
      return;
    }
    
    if (selectedVariant.stock === 0) {
      showError('Produit en rupture de stock');
      return;
    }
    
    const existingIndex = cart.findIndex(item => item.variantId === selectedVariant.id);
    
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        variantId: selectedVariant.id,
        quantity: 1,
        product,
        variant: selectedVariant,
        size: selectedVariant.size?.name || selectedVariant.size,
        sku: selectedVariant.sku,
        price: Number(product.price)
      }]);
    }
    
    setIsCartOpen(true);
    setSizeModalProduct(null);
    showSuccess('Produit ajouté au panier');
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    setCart(cart.map(item => 
      item.variantId === variantId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (variantId: number) => {
    setCart(cart.filter(item => item.variantId !== variantId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      showError('Votre panier est vide');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        ...guestForm,
        items: cart.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        }))
      };
      
      const response = await fetch('http://localhost:3001/orders/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la commande');
      }
      
      const order = await response.json();
      
      showSuccess(`Commande créée avec succès ! Numéro: ${order.orderNumber}`);
      
      // Clear cart and form
      setCart([]);
      setGuestForm({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        address: '',
        notes: ''
      });
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      
      setTimeout(() => {
        router.push('/boutique');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      showError(error.message || 'Erreur lors de la création de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <CustomAlert 
        isOpen={isOpen} 
        onClose={hideAlert}
        message={alertConfig?.message || ''}
        title={alertConfig?.title}
        type={alertConfig?.type}
        onConfirm={alertConfig?.onConfirm}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
      />

      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Commande sans compte
            </h1>
            <p className="text-gray-600 text-lg">
              Parcourez nos produits et passez votre commande rapidement
            </p>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                />
              </div>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
              >
                <option value="name">Nom (A-Z)</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
            </div>
            
            {/* Color Filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedColor('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedColor === '' 
                    ? 'bg-pino-blue text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes les couleurs
              </button>
              {availableColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedColor === color 
                      ? 'bg-pino-blue text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={resolveProductImageUrl(product) || '/imgs/IMG1.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                      }}
                    />
                    {product.variants?.every(v => v.stock === 0) && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Épuisé</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{product.color}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-pino-blue">
                        {Number(product.price).toFixed(2)} DT
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.variants?.every(v => v.stock === 0)}
                        className="p-2 bg-pino-blue text-white rounded-full hover:bg-pino-blue-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Cart Button (Mobile) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="md:hidden fixed bottom-6 right-6 bg-pino-blue text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cart.length > 0 && (
            <span className="bg-white text-pino-blue font-bold px-2 py-1 rounded-full text-sm">
              {cart.length}
            </span>
          )}
        </button>

        {/* Cart Drawer */}
        <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* Cart Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Votre panier</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-gray-500">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.variantId} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                      <img
                        src={resolveProductImageUrl(item.product) || '/imgs/IMG1.png'}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">Taille: {item.size}</p>
                        <p className="text-sm font-bold text-pino-blue mt-1">
                          {item.price.toFixed(2)} DT
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="font-semibold text-gray-900 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.variantId)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-pino-blue">
                    {calculateTotal().toFixed(2)} DT
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-4 bg-pino-blue text-white rounded-xl font-semibold hover:bg-pino-blue-dark transition-colors"
                >
                  Commander sans compte
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Size Selection Modal */}
        {sizeModalProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Sélectionner la taille</h3>
                <button
                  onClick={() => setSizeModalProduct(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">{sizeModalProduct.name}</p>
              <div className="grid grid-cols-3 gap-3">
                {sizeModalProduct.variants?.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => handleAddToCart(sizeModalProduct, variant)}
                    disabled={variant.stock === 0}
                    className={`p-4 border-2 rounded-xl font-semibold transition-all ${
                      variant.stock === 0
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-pino-blue hover:bg-pino-blue hover:text-white'
                    }`}
                  >
                    <div className="text-lg">{variant.size?.name || variant.size}</div>
                    <div className="text-xs mt-1">
                      {variant.stock === 0 ? 'Épuisé' : `Stock: ${variant.stock}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 my-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Finaliser ma commande</h2>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestForm.firstName}
                      onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestForm.lastName}
                      onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guestForm.phoneNumber}
                    onChange={(e) => setGuestForm({ ...guestForm, phoneNumber: e.target.value })}
                    placeholder="Ex: 50770418"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Adresse de livraison *
                  </label>
                  <textarea
                    required
                    value={guestForm.address}
                    onChange={(e) => setGuestForm({ ...guestForm, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    placeholder="Votre adresse complète"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={guestForm.notes}
                    onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    placeholder="Instructions spéciales..."
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total à payer</span>
                    <span className="text-2xl font-bold text-pino-blue">
                      {calculateTotal().toFixed(2)} DT
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-pino-blue text-white rounded-xl font-semibold hover:bg-pino-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isSubmitting ? 'Création en cours...' : 'Confirmer ma commande'}
                </button>

                <Link
                  href="/boutique"
                  className="block text-center text-gray-600 hover:text-pino-blue mt-4 font-medium"
                >
                  Retour à la boutique
                </Link>
              </form>
            </div>
          </div>
        )}

        {/* Backdrop for Cart */}
        {isCartOpen && (
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
          />
        )}
      </main>
    </>
  );
}
