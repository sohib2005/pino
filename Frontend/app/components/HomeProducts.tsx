'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { productsApi, Product as ApiProduct } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  featured?: boolean;
  images?: Array<{
    id: number;
    imageUrl: string;
    viewType: string;
    order: number;
  }>;
  variants?: Array<{
    id: number;
    sku: string;
    stock: number;
    size: {
      name: string;
    };
  }>;
}

function transformProduct(apiProduct: ApiProduct): Product {
  const totalStock =
    apiProduct.variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0;
  const firstVariant = apiProduct.variants?.[0];
  const size = firstVariant?.size?.name || apiProduct.size || 'M';
  const sku = firstVariant?.sku || apiProduct.sku || apiProduct.code || '';

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    category: 'T-Shirts',
    price: Number(apiProduct.price),
    image: apiProduct.images?.[0]?.imageUrl || '/imgs/IMG1.png',
    description: apiProduct.description || '',
    color: apiProduct.color,
    size,
    sku,
    stock: totalStock,
    featured: false,
    images: apiProduct.images,
    variants: apiProduct.variants,
  };
}

export default function HomeProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiProducts = await productsApi.getAll();
        const transformed = apiProducts.map(transformProduct);
        setProducts(transformed);
      } catch (error) {
        console.error('Error fetching products for home:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const previewProducts = useMemo(() => products.slice(0, 4), [products]);

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-pino-blue">
              <span className="w-2 h-2 rounded-full bg-pino-blue"></span>
              Produits populaires
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">
              Découvrez quelques créations
            </h2>
            <p className="text-gray-600 mt-3 max-w-2xl">
              Une sélection rapide de nos t-shirts personnalisables pour vous inspirer.
            </p>
          </div>
          <Link
            href="/boutique"
            className="inline-flex items-center justify-center px-6 py-3 bg-pino-blue text-white font-semibold rounded-lg hover:bg-pino-blue-dark transition-colors duration-200 shadow-pino"
          >
            Voir la boutique
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : previewProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                delay={index * 50}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-600">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </section>
  );
}
