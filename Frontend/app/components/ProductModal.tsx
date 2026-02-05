'use client';

import { useState, useEffect } from 'react';
import { Product } from '../boutique/page';
import { cartApi } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import CustomAlert from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { alertConfig, isOpen, hideAlert, showSuccess, showError } = useCustomAlert();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [isAnimateur, setIsAnimateur] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(product.variants?.[0]?.size?.name || product.size);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get the selected variant based on size
  const selectedVariant = product.variants?.find(v => v.size?.name === selectedSize) || product.variants?.[0];
  const availableStock = selectedVariant?.stock || product.stock;
  const selectedSku = selectedVariant?.sku || product.sku;

  // Get product images array
  const rawImages = product.images?.map((img) => img.imageUrl) || (product.image ? [product.image] : []);
  const productImages = rawImages
    .map((url) => resolveImageUrl(url))
    .filter((url): url is string => Boolean(url));
  const displayImages = productImages.length > 0 ? productImages : ['/imgs/IMG1.png'];

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Check if user is ANIMATEUR
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (clientData) {
      const client = JSON.parse(clientData);
      setIsAnimateur(client.role === 'ANIMATEUR');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleAddToCart = async () => {
    if (availableStock < quantity) {
      showError(`Stock insuffisant. Seulement ${availableStock} disponible(s) pour cette taille.`);
      return;
    }

    if (!selectedVariant) {
      showError('Veuillez sélectionner une taille');
      return;
    }

    try {
      setAdding(true);
      // Use variant id instead of product id
      await cartApi.add(selectedVariant.id, quantity);
      
      showSuccess(`${quantity}x ${product.name} (${selectedSize}) ajouté au panier !`);
      
      // Dispatch cart update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      showError(error.message || 'Erreur lors de l\'ajout au panier');
    } finally {
      setAdding(false);
    }
  };

  const getColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      'blanc': '#ffffff',
      'noir': '#000000',
      'bleu': '#2563eb',
      'bleu marine': '#1e3a8a',
      'gris': '#6b7280',
      'rouge': '#ef4444',
      'bordeaux': '#7f1d1d',
      'vert': '#22c55e',
    };
    return colorMap[color.toLowerCase()] || '#4AC4E5';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
              <img
                src={displayImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/imgs/IMG1.png';
                }}
              />
              
              {/* Navigation Arrows - Only show if multiple images */}
              {displayImages.length > 1 && (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? displayImages.length - 1 : prev - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === displayImages.length - 1 ? 0 : prev + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Indicator Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentImageIndex === index 
                            ? 'bg-pino-blue w-6' 
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Strip - Only show if multiple images */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {displayImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-pino-blue shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - Vue ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col">
            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-pino-blue-subtle text-pino-blue text-sm font-semibold rounded-full">
                {product.category}
              </span>
              {availableStock < 10 && availableStock > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                  Stock limité
                </span>
              )}
              {availableStock === 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  Rupture de stock
                </span>
              )}
            </div>

            {/* Product Name */}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>

            {/* SKU */}
            <p className="text-sm text-gray-500 mb-4">SKU: {selectedSku}</p>

            {/* Price */}
            {!isAnimateur && (
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-pino-blue">{product.price.toFixed(2)} DT</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Attributes */}
            <div className="space-y-4 mb-6">
              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Couleur
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-pino-blue shadow-md"
                    style={{ backgroundColor: getColorStyle(product.color) }}
                    title={product.color}
                  />
                  <span className="text-gray-700 font-medium">{product.color}</span>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Taille
                </label>
                {product.variants && product.variants.length > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const sizeName = variant.size?.name || '';
                      const isSelected = selectedSize === sizeName;
                      const isOutOfStock = variant.stock === 0;
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={() => !isOutOfStock && setSelectedSize(sizeName)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-lg border-2 font-bold transition-all ${
                            isOutOfStock
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-pino-blue border-pino-blue text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-pino-blue'
                          }`}
                        >
                          {sizeName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center px-4 py-2 bg-pino-blue-subtle text-pino-blue font-bold rounded-lg border-2 border-pino-blue">
                    {product.size}
                  </div>
                )}
              </div>
            </div>

            {/* Stock Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {availableStock > 10 ? (
                  <>
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium">En stock ({availableStock} disponibles)</span>
                  </>
                ) : availableStock > 0 ? (
                  <>
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-orange-700 font-medium">Stock limité ({availableStock} disponibles)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 font-medium">Rupture de stock</span>
                  </>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            {availableStock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Quantité
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(availableStock, parseInt(e.target.value) || 1)))}
                    className="w-20 px-4 py-2 text-center border-2 border-gray-300 rounded-lg focus:border-pino-blue focus:outline-none font-semibold"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    disabled={quantity >= availableStock}
                  >
                    <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-500">Max: {availableStock}</span>
                </div>
              </div>
            )}

            {/* Total Price */}
            {availableStock > 0 && (
              <div className="mb-6 p-4 bg-pino-blue-subtle rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-pino-blue">
                    {(product.price * quantity).toFixed(2)} DT
                  </span>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={adding || availableStock === 0}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                availableStock > 0
                  ? 'bg-pino-blue text-white hover:bg-pino-blue-dark shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ajout en cours...
                </span>
              ) : availableStock === 0 ? (
                'Rupture de stock'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Ajouter au panier
                </span>
              )}
            </button>
          </div>
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
    </div>
  );
}
