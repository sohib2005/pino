'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import ProductFilter from '../components/ProductFilter';
import ProductModal from '../components/ProductModal';
import Footer from '../components/Footer';
import { productsApi, Product as ApiProduct } from '@/lib/api';

export interface Product {
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

// Transform API product (t-shirt) to UI product
function transformProduct(apiProduct: ApiProduct): Product {
  // Calculate total stock from all variants
  const totalStock = apiProduct.variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0;
  
  // Get the first variant's size if available, or use a default
  const firstVariant = apiProduct.variants?.[0];
  const size = firstVariant?.size?.name || apiProduct.size || 'M';
  const sku = firstVariant?.sku || apiProduct.sku || apiProduct.code || '';
  
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    category: 'T-Shirts', // All products are t-shirts now
    price: Number(apiProduct.price),
    image: apiProduct.images?.[0]?.imageUrl || '/imgs/IMG1.png',
    description: apiProduct.description || '',
    color: apiProduct.color,
    size: size,
    sku: sku,
    stock: totalStock,
    featured: false,
    images: apiProduct.images, // Pass all images for gallery
    variants: apiProduct.variants, // Keep variants for size selection
  };
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

export default function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Tous']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiProducts = await productsApi.getAll();

        const transformedProducts = apiProducts.map(transformProduct);
        setProducts(transformedProducts);
        
        // Get unique colors from products for filtering
        const uniqueColors = Array.from(new Set(apiProducts.map(p => p.color)));
        setCategories(['Tous', ...uniqueColors]);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by color (using category filter UI for colors)
    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter((p) => p.color === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.color.toLowerCase().includes(query) ||
          p.size.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
    }

    // Sort
    let sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted = sorted.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.id - b.id;
        });
    }

    return sorted;
  }, [products, selectedCategory, sortBy, searchQuery]);

  return (
    <>
      <Header />
      
      {/* Hero Section - SIMPLIFIED */}
      <section 
        style={{ 
          backgroundImage: "url('/imgs/backgrounds/shopping-cart-red-bags_23-2148288209.avif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#1a1a1a'
        }}
        className="relative h-[280px] md:h-[360px] lg:h-[420px] pt-20 md:pt-24"
      >
        {/* VERY Light overlay for text readability ONLY */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center max-w-3xl mx-auto z-10">
            <div className="inline-flex items-center px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full mb-4 md:mb-6 shadow-lg">
              <svg className="w-5 h-5 text-pino-blue mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              <span className="text-sm font-medium text-pino-blue">
                Livraison rapide • Qualité garantie
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 drop-shadow-2xl">
              Notre{' '}
              <span className="text-cyan-400 relative">
                Boutique
                <svg className="absolute -bottom-2 left-0 w-full h-2 md:h-3 text-cyan-400/50" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 5 100 2 150 2C200 2 250 5 298 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-200 drop-shadow-lg px-4">
              Découvrez notre sélection de produits premium personnalisables. Qualité professionnelle garantie.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          // Loading State
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
            <p className="mt-4 text-gray-600">Chargement des produits...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <ProductFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              productCount={filteredAndSortedProducts.length}
            />

            {/* Products Grid */}
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                {filteredAndSortedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product)}
                    delay={index * 50}
                  />
                ))}
              </div>
            ) : (
              // Empty State
              <div className="text-center py-20 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier vos filtres ou votre recherche
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('Tous');
                    setSearchQuery('');
                    setSortBy('default');
                  }}
                  className="px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <Footer />
    </>
  );
}
