'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { resolveProductImageUrl } from '../../lib/image';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import Footer from '../components/Footer';

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface Size {
  id: number;
  name: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
}

interface ProductVariant {
  id: number;
  sku: string;
  stock: number;
  size: Size;
}

interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  color: string;
  price: number;
  imageUrl: string | null;
  categoryId: number;
  variants: ProductVariant[];
  images?: Array<{
    id: number;
    imageUrl: string;
    viewType?: string;
    order?: number;
  }>;
}

interface OrderItem {
  variantId: number;
  productId?: number;
  product?: Product;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  printedName: string;
  textLanguage: 'FRENCH_ARABIC' | 'ARABIC_ONLY' | 'FRENCH_ONLY';
  withDjerbaLogo: boolean;
  quantity: number;
  price: number;
}

export default function GrandesCommandesPage() {
  const router = useRouter();
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showWarning } = useCustomAlert();
  const [client, setClient] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<OrderItem>>({
    size: 'M',
    textLanguage: 'FRENCH_ARABIC',
    withDjerbaLogo: false,
    quantity: 1,
  });
  const [orderData, setOrderData] = useState({
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is ANIMATEUR
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (!clientData) {
      router.push('/login');
      return;
    }

    const parsedClient = JSON.parse(clientData);
    if (parsedClient.role !== 'ANIMATEUR') {
      showError('Accès réservé aux animateurs uniquement');
      setTimeout(() => router.push('/boutique'), 2000);
      return;
    }

    setClient(parsedClient);
    fetchTouristicProducts();
  }, []);

  const fetchTouristicProducts = async () => {
    try {
      // First get all categories to find "Touristique"
      const categoriesResponse = await fetch('http://localhost:3001/categories');
      const categories = await categoriesResponse.json();
      
      const touristicCategory = categories.find((cat: Category) => 
        cat.name.toLowerCase() === 'touristique'
      );

      if (!touristicCategory) {
        showError('Catégorie Touristique introuvable');
        setLoading(false);
        return;
      }

      // Fetch products from Touristique category
      const productsResponse = await fetch(`http://localhost:3001/products/category/${touristicCategory.id}`);
      const data = await productsResponse.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching touristic products:', error);
      showError('Erreur lors du chargement des produits touristiques');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentItem({
      productId: product.id,
      size: 'M',
      printedName: '',
      textLanguage: 'FRENCH_ARABIC',
      withDjerbaLogo: false,
      quantity: 1,
    });
    setShowModal(true);
  };

  const addItemToOrder = () => {
    if (!currentItem.productId || !currentItem.size || !currentItem.printedName) {
      showWarning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const product = selectedProduct;
    if (!product) return;

    // Find the variant for this product+size combination
    const variant = product.variants.find(v => v.size.name === currentItem.size);
    if (!variant) {
      showError('Cette taille n\'est pas disponible pour ce produit');
      return;
    }

    const newItem: OrderItem = {
      variantId: variant.id,
      productId: currentItem.productId,
      product: product,
      size: currentItem.size as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
      printedName: currentItem.printedName!,
      textLanguage: currentItem.textLanguage as 'FRENCH_ARABIC' | 'ARABIC_ONLY' | 'FRENCH_ONLY',
      withDjerbaLogo: currentItem.withDjerbaLogo || false,
      quantity: currentItem.quantity || 1,
      price: product.price,
    };

    setOrderItems([...orderItems, newItem]);
    
    showSuccess('Article ajouté à la commande');
    
    // Close modal and reset
    setShowModal(false);
    setSelectedProduct(null);
    setCurrentItem({
      size: 'M',
      printedName: '',
      textLanguage: 'FRENCH_ARABIC',
      withDjerbaLogo: false,
      quantity: 1,
    });
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
    } else {
      const updatedItems = [...orderItems];
      updatedItems[index].quantity = newQuantity;
      setOrderItems(updatedItems);
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'FRENCH_ARABIC': return 'Français & Arabe';
      case 'FRENCH_ONLY': return 'Français seulement';
      case 'ARABIC_ONLY': return 'Arabe seulement';
      default: return lang;
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      showWarning('Veuillez ajouter au moins un article à votre commande');
      return;
    }

    if (!client) {
      showError('Vous devez être connecté');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/custom-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': client.id,
        },
        body: JSON.stringify({
          hotelName: client.address || '',
          notes: orderData.notes,
          items: orderItems.map(item => ({
            variantId: item.variantId,
            printedName: item.printedName,
            textLanguage: item.textLanguage,
            withDjerbaLogo: item.withDjerbaLogo,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de la commande');
      }

      const order = await response.json();
      showSuccess(`Grande commande créée avec succès ! Numéro: ${order.orderNumber}`);
      
      // Reset form
      setOrderItems([]);
      setCurrentItem({
        size: 'M',
        textLanguage: 'FRENCH_ARABIC',
        withDjerbaLogo: false,
        quantity: 1,
      });
      setOrderData(prev => ({ ...prev, notes: '' }));

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

  if (!client || client.role !== 'ANIMATEUR') {
    return null;
  }

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
      <main className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Grandes Commandes - T-Shirts Touristiques
            </h1>
            <p className="text-gray-600">
              Sélectionnez un produit touristique pour créer une commande personnalisée
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Products Cards */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue mx-auto"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-500">Aucun produit touristique disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-md"
                    >
                      {/* Image placeholder */}
                      <div className="h-48 sm:h-56 lg:h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={resolveProductImageUrl(product) || '/imgs/IMG1.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/imgs/IMG1.png';
                          }}
                        />
                      </div>
                      
                      {/* Product info */}
                      <div className="p-4">
                        <div className="mb-3">
                          <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">
                            T-SHIRTS
                          </span>
                          <h3 className="text-base font-bold text-gray-900 mt-1 leading-tight">
                            {product.name}
                          </h3>
                        </div>
                        
                        {/* Size badges */}
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-700 mb-1">
                            Tailles disponibles:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {product.variants?.map((variant) => (
                              <span
                                key={variant.id}
                                className={`px-2 py-1 text-xs font-semibold rounded ${
                                  variant.stock > 0
                                    ? 'bg-cyan-100 text-cyan-800'
                                    : 'bg-gray-100 text-gray-400 line-through'
                                }`}
                              >
                                {variant.size.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Shopping cart icon */}
                        <div className="flex justify-end">
                          <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Récapitulatif</h2>

                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-sm mb-4">Aucun article dans la commande</p>
                ) : (
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {orderItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-pino-blue">
                              {item.product?.code} - {item.size}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              "{item.printedName}"
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.price} DT / unité
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="ml-2 text-red-500 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateItemQuantity(index, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-900 rounded hover:bg-gray-200 font-extrabold"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-900 rounded hover:bg-gray-200 font-extrabold"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {(item.price * item.quantity).toFixed(2)} DT
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-900">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={orderData.notes}
                      onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-pino-blue"
                      rows={2}
                      placeholder="Instructions spéciales..."
                    />
                  </div>

                  <div className="border-t pt-3 mb-4 text-gray-900">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Articles:</span>
                      <span className="font-semibold">{orderItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Quantité totale:</span>
                      <span className="font-semibold">
                        {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-3">
                      <span>Total:</span>
                      <span className="text-gray-900">{calculateTotal().toFixed(2)} DT</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || orderItems.length === 0}
                    className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'En cours...' : 'Confirmer la Commande'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <Footer />

        {/* Modal for product customization */}
        {showModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Personnaliser: {selectedProduct.name}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedProduct(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Product Images */}
                  {(selectedProduct.images?.length || selectedProduct.imageUrl) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-semibold text-gray-900 mb-3">
                        Images du produit
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(selectedProduct.images?.length
                          ? selectedProduct.images
                          : selectedProduct.imageUrl
                          ? [{ imageUrl: selectedProduct.imageUrl }]
                          : []
                        ).map((img, idx) => (
                          <div
                            key={`${selectedProduct.id}-img-${idx}`}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={resolveProductImageUrl({ images: [{ imageUrl: img.imageUrl }] }) || '/imgs/IMG1.png'}
                              alt={`${selectedProduct.name} ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Code:</span>
                        <span className="ml-2 font-semibold text-pino-blue">{selectedProduct.code}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Prix:</span>
                        <span className="ml-2 text-xl font-bold text-gray-900">{selectedProduct.price} DT</span>
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Taille <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentItem.size}
                      onChange={(e) => setCurrentItem({ ...currentItem, size: e.target.value as any })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-pino-blue text-gray-900 font-medium"
                    >
                      {selectedProduct.variants.map((variant) => (
                        <option key={variant.id} value={variant.size.name}>
                          {variant.size.name} {variant.stock === 0 ? '(Rupture)' : `(Stock: ${variant.stock})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Printed Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Nom à imprimer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentItem.printedName || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, printedName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-pino-blue text-gray-900 font-medium"
                      placeholder="Ex: SOHIB"
                      required
                    />
                  </div>

                  {/* Text Language */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Langue du texte <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-pino-blue transition-all">
                        <input
                          type="radio"
                          value="FRENCH_ARABIC"
                          checked={currentItem.textLanguage === 'FRENCH_ARABIC'}
                          onChange={(e) => setCurrentItem({ ...currentItem, textLanguage: e.target.value as any })}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="font-medium text-gray-900">Français et Arabe</span>
                      </label>
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-pino-blue transition-all">
                        <input
                          type="radio"
                          value="FRENCH_ONLY"
                          checked={currentItem.textLanguage === 'FRENCH_ONLY'}
                          onChange={(e) => setCurrentItem({ ...currentItem, textLanguage: e.target.value as any })}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="font-medium text-gray-900">Français seulement</span>
                      </label>
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-pino-blue transition-all">
                        <input
                          type="radio"
                          value="ARABIC_ONLY"
                          checked={currentItem.textLanguage === 'ARABIC_ONLY'}
                          onChange={(e) => setCurrentItem({ ...currentItem, textLanguage: e.target.value as any })}
                          className="mr-3 w-4 h-4"
                        />
                        <span className="font-medium text-gray-900">Arabe seulement</span>
                      </label>
                    </div>
                  </div>

                  {/* Djerba Logo */}
                  <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-pino-blue transition-all">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentItem.withDjerbaLogo}
                        onChange={(e) => setCurrentItem({ ...currentItem, withDjerbaLogo: e.target.checked })}
                        className="mr-3 w-5 h-5"
                      />
                      <span className="font-semibold text-gray-900">Avec logo Djerba</span>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={addItemToOrder}
                      className="flex-1 bg-pino-blue text-white font-semibold py-3 rounded-lg hover:bg-pino-blue-dark transition-all"
                    >
                      Ajouter à la commande
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
