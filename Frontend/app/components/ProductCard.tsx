'use client';

import { useState, useEffect } from 'react';
import { Product } from '../boutique/page';
import { resolveImageUrl } from '@/lib/image';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  delay?: number;
}

export default function ProductCard({ product, onClick, delay = 0 }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAnimateur, setIsAnimateur] = useState(false);

  useEffect(() => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (clientData) {
      const client = JSON.parse(clientData);
      setIsAnimateur(client.role === 'ANIMATEUR');
    }
  }, []);

  const imageSrc = resolveImageUrl((product as any).imageUrl || (product as any).image) || '/imgs/IMG1.png';

  return (
    <div
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, opacity: 0 }}
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.featured && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-pino-blue text-white text-xs font-semibold rounded-full shadow-lg">
            ⭐ Populaire
          </div>
        )}
        
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-pino-blue/30 border-t-pino-blue rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={imageSrc}
              alt={product.name}
              className={`w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('/imgs/IMG1.png')) {
                  target.src = '/imgs/IMG1.png';
                  setImageLoaded(true);
                } else {
                  setImageError(true);
                }
              }}
            />
          </>
        ) : (
          // Fallback placeholder
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pino-blue-subtle to-gray-100">
            <svg className="w-16 h-16 text-pino-blue/40 mb-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">{product.name}</p>
          </div>
        )}
        
        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="px-6 py-3 bg-white text-pino-blue font-semibold rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg hover:bg-pino-blue hover:text-white">
            Voir détails
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-pino-blue uppercase tracking-wide">
            {product.category}
          </span>
          <div className="flex gap-1">
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{
                backgroundColor: 
                  product.color.toLowerCase() === 'blanc' ? '#ffffff' :
                  product.color.toLowerCase() === 'noir' ? '#000000' :
                  product.color.toLowerCase() === 'bleu' || product.color.toLowerCase() === 'bleu marine' ? '#2563eb' :
                  product.color.toLowerCase() === 'gris' || product.color.toLowerCase() === 'gris chiné' ? '#6b7280' :
                  product.color.toLowerCase() === 'rouge' ? '#ef4444' :
                  product.color.toLowerCase() === 'bordeaux' ? '#7f1d1d' :
                  product.color.toLowerCase() === 'kaki' ? '#78716c' :
                  product.color.toLowerCase() === 'beige' || product.color.toLowerCase() === 'naturel' ? '#d4a574' :
                  product.color.toLowerCase() === 'vert' ? '#22c55e' :
                  '#4AC4E5'
              }}
              title={product.color}
            />
          </div>
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-pino-blue transition-colors duration-200">
          {product.name}
        </h3>

        {/* Price and Size */}
        <div className="flex items-center justify-between">
          <div>
            {!isAnimateur && (
              <span className="text-2xl font-bold text-gray-900">
                {product.price.toFixed(2)} DT
              </span>
            )}
            <p className={`text-xs text-gray-500 ${!isAnimateur ? 'mt-1' : ''}`}>
              Taille: {product.size}
            </p>
          </div>
          
          {/* Quick Add Button - Opens modal for selection */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(); // Opens the modal for proper attribute selection
            }}
            className="p-3 bg-pino-blue-subtle text-pino-blue rounded-lg hover:bg-pino-blue hover:text-white transition-all duration-200 transform hover:scale-110"
            title="Voir les détails et ajouter au panier"
          >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
