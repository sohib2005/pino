'use client';

import { useEffect, useState } from 'react';
import { productsApi, Product } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface StockItem {
  productId: number;
  variantId: number;
  productName: string;
  sku: string;
  price: number;
  stock: number;
  color: string;
  size: string;
  isActive: boolean;
}

export default function StockManagement() {
  const searchParams = useSearchParams();
  const { alertConfig, isOpen, hideAlert, showSuccess, showError } = useCustomAlert();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);

  const LOW_STOCK_THRESHOLD = 10;

  useEffect(() => {
    fetchStockData();
    // Check for filter param in URL
    const filterParam = searchParams.get('filter');
    if (filterParam === 'low-stock' || filterParam === 'out-of-stock' || filterParam === 'in-stock') {
      setFilterStock(filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    filterStockItems();
  }, [searchQuery, filterCategory, filterStock, stockItems]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const products = await productsApi.getAll();
      
      // Extract unique colors (instead of categories)
      const uniqueColors = Array.from(new Set(products.map(p => p.color)));
      setCategories(uniqueColors);

      // Transform products with variants to stock items
      const items: StockItem[] = [];
      products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            items.push({
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              sku: variant.sku,
              price: Number(product.price),
              stock: variant.stock || 0,
              color: product.color,
              size: variant.size?.name || variant.size || 'N/A',
              isActive: product.isActive,
            });
          });
        }
      });

      setStockItems(items);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      showError('Erreur lors du chargement des données de stock');
    } finally {
      setLoading(false);
    }
  };

  const filterStockItems = () => {
    let filtered = [...stockItems];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        item.size.toLowerCase().includes(query)
      );
    }

    // Color filter (was category)
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.color === filterCategory);
    }

    // Stock filter
    switch (filterStock) {
      case 'out-of-stock':
        filtered = filtered.filter(item => item.stock === 0);
        break;
      case 'low-stock':
        filtered = filtered.filter(item => item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD);
        break;
      case 'in-stock':
        filtered = filtered.filter(item => item.stock > LOW_STOCK_THRESHOLD);
        break;
    }

    setFilteredItems(filtered);
  };

  const handleUpdateStock = async (variantId: number, newStock: number) => {
    try {
      await productsApi.updateVariantStock(variantId, { quantity: newStock, reason: 'Ajustement manuel par admin' });
      
      // Update local state
      setStockItems(items =>
        items.map(item =>
          item.variantId === variantId ? { ...item, stock: newStock } : item
        )
      );
      
      setEditingStock(null);
      setNewStockValue(0);
      showSuccess('Stock mis à jour avec succès!');
    } catch (error) {
      console.error('Error updating stock:', error);
      showError('Erreur lors de la mise à jour du stock');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Rupture', color: 'bg-red-100 text-red-700', icon: '❌' };
    if (stock <= LOW_STOCK_THRESHOLD) return { label: 'Stock faible', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' };
    return { label: 'En stock', color: 'bg-green-100 text-green-700', icon: '✓' };
  };

  const getLowStockCount = () => stockItems.filter(item => item.stock > 0 && item.stock <= LOW_STOCK_THRESHOLD).length;
  const getOutOfStockCount = () => stockItems.filter(item => item.stock === 0).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Stock</h1>
          <p className="text-gray-500 mt-1">Gérez et surveillez votre inventaire</p>
        </div>
        <button
          onClick={fetchStockData}
          className="px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Alert Cards */}
      {(getOutOfStockCount() > 0 || getLowStockCount() > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getOutOfStockCount() > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Rupture de stock</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {getOutOfStockCount()} produit{getOutOfStockCount() > 1 ? 's' : ''} en rupture de stock
                  </p>
                </div>
              </div>
            </div>
          )}
          {getLowStockCount() > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Stock faible</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {getLowStockCount()} produit{getLowStockCount() > 1 ? 's' : ''} avec stock faible
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
            >
              <option value="all">Toutes les couleurs</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              État du stock
            </label>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
            >
              <option value="all">Tous les états</option>
              <option value="in-stock">En stock</option>
              <option value="low-stock">Stock faible</option>
              <option value="out-of-stock">Rupture de stock</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''} sur {stockItems.length} produit{stockItems.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Couleur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.stock);
                  const isEditing = editingStock === item.variantId;

                  return (
                    <tr key={item.variantId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.color}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{item.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.price.toFixed(2)} TND</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={newStockValue || 0}
                              onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-gray-900">{item.stock}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStock(item.variantId, newStockValue || 0)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              ✓ Sauv.
                            </button>
                            <button
                              onClick={() => {
                                setEditingStock(null);
                                setNewStockValue(0);
                              }}
                              className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                              ✕ Ann.
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStock(item.variantId);
                              setNewStockValue(item.stock || 0);
                            }}
                            className="text-pino-blue hover:text-pino-blue-dark font-medium"
                          >
                            Modifier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
