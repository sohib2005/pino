'use client';

import { useState, useEffect } from 'react';
import { cartApi, Cart, ordersApi } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/image';
import Link from 'next/link';
import Header from '../components/Header';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import Footer from '../components/Footer';

export default function CartPage() {
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showWarning } = useCustomAlert();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    notes: '',
  });
  const [isCheckout, setIsCheckout] = useState(false);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (clientData) {
      const parsedClient = JSON.parse(clientData);
      setClient(parsedClient);
      // Auto-fill data from logged-in user
      setCheckoutData(prev => ({
        ...prev,
        firstName: parsedClient.firstName || '',
        lastName: parsedClient.lastName || '',
        phoneNumber: parsedClient.phoneNumber || '',
        address: parsedClient.address || '',
      }));
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await cartApi.update(itemId, quantity);
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError('Erreur lors de la mise à jour de la quantité');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartApi.remove(itemId);
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
      showError('Erreur lors de la suppression de l\'article');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkoutData.address) {
      showWarning('Veuillez remplir l\'adresse de livraison');
      return;
    }

    if (!client && (!checkoutData.firstName || !checkoutData.lastName || !checkoutData.phoneNumber)) {
      showWarning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      // Use guest order endpoint if not logged in
      const order = client 
        ? await ordersApi.create(checkoutData)
        : await fetch('http://localhost:3001/orders/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...checkoutData,
              items: cart?.items.map(item => ({
                variantId: item.variant?.id,
                quantity: item.quantity
              })) || []
            })
          }).then(async res => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || 'Erreur lors de la création de la commande');
            }
            return res.json();
          });
      showSuccess(`Commande créée avec succès ! Numéro: ${order.orderNumber}`);
      setIsCheckout(false);
      setCheckoutData({ firstName: '', lastName: '', address: '', phoneNumber: '', notes: '' });
      if (!client) {
        // Clear guest cart
        await cartApi.clear();
      }
      await fetchCart();
      
      // Dispatch cart update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      setTimeout(() => {
        window.location.href = '/boutique';
      }, 1500);
    } catch (error: any) {
      console.error('Error creating order:', error);
      showError(error.message || 'Erreur lors de la création de la commande');
    }
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => {
      return total + Number(item.variant?.product?.price || 0) * item.quantity;
    }, 0);
  };

  const getPersonalizationPreviewUrls = (item: any): { front?: string; back?: string } => {
    const designJson = item?.personalization?.designJson;
    const payload = typeof designJson === 'string' ? (() => {
      try { return JSON.parse(designJson); } catch { return null; }
    })() : designJson;

    const front = payload?.front?.previewUrl;
    const back = payload?.back?.previewUrl;

    return {
      front: typeof front === 'string' ? front : undefined,
      back: typeof back === 'string' ? back : undefined,
    };
  };

  const toAbsoluteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `http://localhost:3001${url}`;
    return `http://localhost:3001/${url}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Panier</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">Votre panier est vide</p>
            <Link
              href="/boutique"
              className="inline-block px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors"
            >
              Continuer vos achats
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Articles du panier */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow p-6 flex gap-6"
                >
                  {/* Product Image / Personalization Previews */}
                  <div className="flex-shrink-0">
                    {item.personalizationId ? (
                      <div className="grid grid-cols-2 gap-2">
                        {(() => {
                          const previews = getPersonalizationPreviewUrls(item);
                          const frontUrl = previews.front ? toAbsoluteUrl(previews.front) : '';
                          const backUrl = previews.back ? toAbsoluteUrl(previews.back) : '';

                          const Frame = ({ label, src }: { label: string; src?: string }) => (
                            <div className="w-24">
                              <div className="text-[11px] font-semibold text-gray-700 mb-1">{label}</div>
                              <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                {src ? (
                                  <img
                                    src={src}
                                    alt={label}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="text-xs text-gray-400">Image indisponible</div>
                                )}
                              </div>
                            </div>
                          );

                          return (
                            <>
                              <Frame label="Avant" src={frontUrl || undefined} />
                              <Frame label="Arrière" src={backUrl || undefined} />
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <img
                        src={resolveProductImageUrl(item.variant?.product) || '/imgs/IMG1.png'}
                        alt={item.variant?.product?.name || 'Product'}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                        }}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {item.variant?.product?.name || 'T-Shirt'}
                    </h3>
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="mr-3">Couleur: {item.variant?.product?.color || 'N/A'}</span>
                      <span className="mr-3">Taille: {item.variant?.size?.name || 'N/A'}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">SKU: {item.variant?.sku || 'N/A'}</p>
                    {client?.role !== 'ANIMATEUR' && (
                      <p className="text-pino-blue font-bold mt-2">
                        {Number(item.variant?.product?.price || 0).toFixed(2)} DT
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.variant?.stock || 0)}
                        className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Récapitulatif</h2>
                
                {client?.role !== 'ANIMATEUR' && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Sous-total</span>
                      <span>{calculateTotal().toFixed(2)} DT</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Livraison</span>
                      <span>Gratuite</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-pino-blue">{calculateTotal().toFixed(2)} DT</span>
                    </div>
                  </div>
                )}

                {!isCheckout ? (
                  <>
                    {!client && (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-800 font-medium mb-3">
                          Choisissez votre mode de commande :
                        </p>
                        <div className="flex gap-2">
                          <Link
                            href="/login"
                            className="flex-1 py-2 px-3 bg-pino-blue text-white text-center rounded-lg hover:bg-pino-blue-dark font-semibold text-sm"
                          >
                            Se connecter
                          </Link>
                          <button
                            onClick={() => setIsCheckout(true)}
                            className="flex-1 py-2 px-3 bg-gray-600 text-white text-center rounded-lg hover:bg-gray-700 font-semibold text-sm"
                          >
                            Commander en invité
                          </button>
                        </div>
                      </div>
                    )}
                    {client && (
                      <button
                        onClick={() => setIsCheckout(true)}
                        className="w-full py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors font-semibold"
                      >
                        Passer la commande
                      </button>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleCheckout} className="space-y-4 mt-6">
                    {!client && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Prénom *
                            </label>
                            <input
                              type="text"
                              required
                              value={checkoutData.firstName}
                              onChange={(e) => setCheckoutData({ ...checkoutData, firstName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                              placeholder="Votre prénom"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nom *
                            </label>
                            <input
                              type="text"
                              required
                              value={checkoutData.lastName}
                              onChange={(e) => setCheckoutData({ ...checkoutData, lastName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                              placeholder="Votre nom"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Numéro de téléphone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={checkoutData.phoneNumber}
                            onChange={(e) => setCheckoutData({ ...checkoutData, phoneNumber: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                            placeholder="Ex: 50770418"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse de livraison *
                      </label>
                      <textarea
                        required
                        value={checkoutData.address}
                        onChange={(e) => setCheckoutData({ ...checkoutData, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                        rows={3}
                        placeholder="Votre adresse complète"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={checkoutData.notes}
                        onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                        rows={2}
                        placeholder="Instructions spéciales..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckout(false)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        Confirmer
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    
    {/* Custom Alert */}
    {alertConfig && (
      <CustomAlert
        isOpen={isOpen}
        onClose={hideAlert}
        {...alertConfig}
      />
    )}
      <Footer />
    </>
  );
}
