'use client';

import { useState, useEffect } from 'react';
import { productsApi, Product } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/image';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function AdminProductsPage() {
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();
  const [activeTab, setActiveTab] = useState<'products' | 'trash'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [trashProducts, setTrashProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{id: number, code?: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState<{
    productId: number;
    productName: string;
    blockingOrders: any[];
  } | null>(null);
  
  const colors = ['Noir', 'Blanc', 'Gris', 'Bleu Marine', 'Rouge', 'Vert'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    categoryId: '',
    price: '',
    images: [{ url: '', viewType: 'AVANT' as 'AVANT' | 'DOS' | 'COTE' }],
  });
  const [selectedSizes, setSelectedSizes] = useState<{[key: string]: {selected: boolean, stock: number}}>(
    sizes.reduce((acc, size) => ({ ...acc, [size]: { selected: false, stock: 0 } }), {})
  );
  const [filterColor, setFilterColor] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(true); // Show all products by default in admin

  // No need for SKU generation in frontend - backend will handle it

  useEffect(() => {
    fetchData();
  }, [showInactive, activeTab]); // Refetch when filter or tab changes

  const handleImageUpload = async (file: File, index: number) => {
    try {
      console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Create instant local preview
      const localPreview = URL.createObjectURL(file);
      console.log('🖼️ Created local preview:', localPreview);
      
      // Show local preview immediately
      const tempImages = [...formData.images];
      tempImages[index] = { ...tempImages[index], url: localPreview };
      setFormData({ ...formData, images: tempImages });
      
      // Start upload
      setUploadingImage(index);
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      console.log('📤 Sending to backend...');
      
      const response = await fetch('http://localhost:3001/products/upload-image', {
        method: 'POST',
        body: formDataUpload,
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(`Failed to upload image: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Upload response:', data);
      console.log('🔗 Image URL:', data.imageUrl);
      
      // Replace local preview with server URL
      URL.revokeObjectURL(localPreview); // Clean up blob URL
      const newImages = [...formData.images];
      newImages[index] = { ...newImages[index], url: data.imageUrl };
      setFormData({ ...formData, images: newImages });
      
      console.log('✅ Image URL updated in state:', data.imageUrl);
      showSuccess('Image uploadée avec succès !');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showError(error.message || 'Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'products') {
        const [productsData, categoriesData] = await Promise.all([
          productsApi.getAll(undefined, showInactive, false), // Normal products
          fetch('http://localhost:3001/categories').then(r => r.json())
        ]);
        
        // Calculate total stock from variants for each product
        const productsWithStock = productsData.map(product => ({
          ...product,
          stock: product.variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0
        }));
        
        setProducts(productsWithStock);
        setCategories(categoriesData);
      } else {
        // Trash tab
        const trashData = await productsApi.getTrash();
        setTrashProducts(trashData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm(
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      async () => {
        try {
          console.log('🗑️ Deleting product:', id);
          const result = await productsApi.delete(id);
          console.log('📥 Delete response:', result);
          
          if (result.action === 'moved_to_trash') {
            // Moved to trash
            console.log('📦 Product moved to trash');
            setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
            showSuccess('Produit déplacé vers la corbeille');
          } else if (result.action === 'deleted') {
            // Hard delete
            console.log('✅ Product hard deleted');
            setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
            showSuccess('Produit supprimé avec succès !');
          } else {
            console.warn('⚠️ Unknown action:', result.action);
            showError('Action inconnue: ' + result.action);
          }
        } catch (error: any) {
          console.error('❌ Error deleting product:', error);
          showError(error.message || 'Erreur lors de la suppression');
        }
      },
      'Supprimer'
    );
  };

  const handleRestore = async (id: number) => {
    try {
      const result = await productsApi.restore(id);
      showSuccess(result.message || 'Produit restauré');
      setTrashProducts(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la restauration');
    }
  };

  const handlePermanentDelete = async (id: number, productName: string) => {
    try {
      const result = await productsApi.permanentDelete(id);
      
      if (result.action === 'blocked') {
        // Show modal with blocking orders
        setDeleteModalData({
          productId: id,
          productName,
          blockingOrders: result.blockingOrders,
        });
        setShowDeleteModal(true);
      } else if (result.action === 'deleted_permanently') {
        // Success
        showSuccess(result.message || 'Produit supprimé définitivement');
        setTrashProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la suppression définitive');
    }
  };

  const handleDeleteWithOrders = async () => {
    if (!deleteModalData) return;
    
    try {
      const result = await productsApi.permanentDeleteWithOrders(deleteModalData.productId);
      showSuccess(result.message || 'Produit et commandes supprimés');
      setTrashProducts(prev => prev.filter(p => p.id !== deleteModalData.productId));
      setShowDeleteModal(false);
      setDeleteModalData(null);
    } catch (error: any) {
      showError(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleKeepInTrash = () => {
    showSuccess('Produit conservé dans la corbeille');
    setShowDeleteModal(false);
    setDeleteModalData(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    
    // Load images from product.images array with viewType
    let productImages: Array<{ url: string; viewType: 'AVANT' | 'DOS' | 'COTE' }> = [{ url: '', viewType: 'AVANT' }];
    if (product.images && product.images.length > 0) {
      productImages = product.images.map((img: any) => ({
        url: img.imageUrl || '',
        viewType: img.viewType || 'AVANT',
      }));
    }
    
    setFormData({
      name: product.name,
      description: product.description || '',
      color: product.color,
      categoryId: product.categoryId?.toString() || '',
      price: product.price.toString(),
      images: productImages,
    });
    
    // Pre-fill sizes and stock from variants
    const sizesFromVariants: {[key: string]: {selected: boolean, stock: number}} = {};
    sizes.forEach(size => {
      sizesFromVariants[size] = { selected: false, stock: 0 };
    });
    
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: any) => {
        const sizeName = variant.size?.name || variant.size;
        if (sizeName && sizesFromVariants[sizeName] !== undefined) {
          sizesFromVariants[sizeName] = {
            selected: true,
            stock: variant.stock || 0
          };
        }
      });
    }
    
    setSelectedSizes(sizesFromVariants);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      await productsApi.update(editingProduct.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        price: Number(formData.price),
        categoryId: Number(formData.categoryId),
        images: formData.images.filter(img => img.url.trim()),
      });

      setShowEditModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        color: '',
        categoryId: '',
        price: '',
        images: [{ url: '', viewType: 'AVANT' }],
      });
      await fetchData();
      showSuccess('T-shirt modifié avec succès !');
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Erreur lors de la modification du t-shirt');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get selected sizes with their stock
    const sizesData = Object.entries(selectedSizes)
      .filter(([_, data]) => data.selected && data.stock > 0)
      .map(([size, data]) => ({ size, stock: data.stock }));

    if (sizesData.length === 0) {
      showError('Veuillez sélectionner au moins une taille avec un stock');
      return;
    }
    
    try {
      await productsApi.create({
        name: formData.name,
        description: formData.description,
        color: formData.color,
        categoryId: parseInt(formData.categoryId),
        sizes: sizesData,
        price: Number(formData.price),
        images: formData.images.filter(img => img.url.trim()),
        isActive: true,
      });

      setShowEditModal(false);
      setFormData({
        name: '',
        description: '',
        color: '',
        categoryId: '',
        price: '',
        images: [{ url: '', viewType: 'AVANT' }],
      });
      setSelectedSizes(sizes.reduce((acc, size) => ({ ...acc, [size]: { selected: false, stock: 0 } }), {}));
      await fetchData();
      showSuccess('T-shirt créé avec succès !');
    } catch (error: any) {
      console.error('Error creating product:', error);
      showError(error.message || 'Erreur lors de la création du t-shirt');
    }
  };

  const filteredProducts = products.filter(product => {
    if (filterColor && product.color !== filterColor) return false;
    if (filterSize && product.size !== filterSize) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
          <p className="text-gray-600 mt-2">
            {activeTab === 'products' 
              ? `${products.length} produit(s)` 
              : `${trashProducts.length} produit(s) dans la corbeille`}
          </p>
        </div>
        {activeTab === 'products' && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                description: '',
                color: '',
                categoryId: '',
                price: '',
                images: [{ url: '', viewType: 'AVANT' }],
              });
              setShowEditModal(true);
            }}
            className="px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un produit
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'products'
              ? 'text-pino-blue border-b-2 border-pino-blue'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📦 Produits
          {products.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-pino-blue text-white text-xs rounded-full">
              {products.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('trash')}
          className={`px-6 py-3 font-semibold transition-colors relative ${
            activeTab === 'trash'
              ? 'text-pino-blue border-b-2 border-pino-blue'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🗑️ Corbeille
          {trashProducts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {trashProducts.length}
            </span>
          )}
        </button>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-pino-blue border-gray-300 rounded focus:ring-pino-blue"
                />
                <span className="text-sm font-medium text-gray-700">
                  Afficher les produits inactifs
                </span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <select
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
            >
              <option value="">Toutes les couleurs</option>
              {colors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taille
            </label>
            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
            >
              <option value="">Toutes les tailles</option>
              {sizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                T-Shirt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Couleur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taille
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img 
                      src={resolveProductImageUrl(product) || '/imgs/IMG1.png'} 
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover mr-3"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description?.substring(0, 40)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.color}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.variants && product.variants.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {product.variants.map((variant: any, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {variant.size?.name || variant.size}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {Number(product.price).toFixed(2)} DT
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${product.stock < 10 ? 'text-red-600' : product.stock < 30 ? 'text-orange-600' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                    {product.variants && product.variants.length > 1 && (
                      <span className="text-xs text-gray-400">
                        {product.variants.length} tailles
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.isActive ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-pino-blue hover:text-pino-blue-dark mr-4"
                    onClick={() => handleEdit(product)}
                    title="Modifier"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className={`mr-4 ${product.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                    onClick={async () => {
                      try {
                        await productsApi.update(product.id, { isActive: !product.isActive });
                        await fetchData();
                        showSuccess(`Produit ${product.isActive ? 'désactivé' : 'activé'} avec succès !`);
                      } catch (error: any) {
                        showError(error.message || 'Erreur lors de la modification du statut');
                      }
                    }}
                    title={product.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {product.isActive ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDelete(product.id)}
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-sm font-medium text-gray-500">Total T-Shirts</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{products.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-sm font-medium text-gray-500">Couleurs</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {new Set(products.map(p => p.color)).size}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-sm font-medium text-gray-500">Stock Total</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {products.reduce((sum, p) => sum + p.stock, 0)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-sm font-medium text-gray-500">Produits Actifs</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {products.filter(p => p.isActive).length}
          </div>
        </div>
      </div>
        </>
      )}

      {/* Trash Tab Content */}
      {activeTab === 'trash' && (
        <div className="space-y-4">
          {trashProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🗑️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Corbeille vide
              </h3>
              <p className="text-gray-600">
                Aucun produit dans la corbeille
              </p>
            </div>
          ) : (
            trashProducts.map((product: any) => {
              const allOrders = [
                ...(product.variants?.flatMap((v: any) => v.orderItems?.map((oi: any) => oi.order) || []) || []),
                ...(product.variants?.flatMap((v: any) => v.customOrderItems?.map((coi: any) => coi.customOrder) || []) || []),
              ];
              
              const orderSummary = {
                total: allOrders.length,
                enAttente: allOrders.filter((o: any) => o?.status === 'EN_ATTENTE').length,
                enCours: allOrders.filter((o: any) => o?.status === 'EN_COURS').length,
                livre: allOrders.filter((o: any) => o?.status === 'LIVRE').length,
                annule: allOrders.filter((o: any) => o?.status === 'ANNULE').length,
              };

              return (
                <div key={product.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between">
                    {/* Product Info */}
                    <div className="flex gap-4 flex-1">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={resolveProductImageUrl(product) || '/imgs/IMG1.png'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.code} - {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.color}
                        </p>
                        
                        {/* Deletion Info */}
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-gray-500">
                            🗑️ Supprimé le: {new Date(product.deletedAt).toLocaleDateString('fr-FR')}
                          </p>
                          {product.deletionRequest && (
                            <>
                              <p className="text-xs text-gray-500">
                                👤 Par: {product.deletionRequest.admin?.firstName || 'Admin'}
                              </p>
                              {product.deletionRequest.reason && (
                                <p className="text-xs text-gray-500">
                                  📝 Raison: {product.deletionRequest.reason}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Order Summary */}
                        {orderSummary.total > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              📦 Lié à {orderSummary.total} commande(s):
                            </p>
                            <div className="flex gap-2 flex-wrap text-xs">
                              {orderSummary.enAttente > 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                  {orderSummary.enAttente} en attente
                                </span>
                              )}
                              {orderSummary.enCours > 0 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                  {orderSummary.enCours} en cours
                                </span>
                              )}
                              {orderSummary.livre > 0 && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                  {orderSummary.livre} livrées
                                </span>
                              )}
                              {orderSummary.annule > 0 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                  {orderSummary.annule} annulées
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleRestore(product.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restaurer
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(product.id, `${product.code} - ${product.name}`)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Supprimer définitivement
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit/Create Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Modifier le T-Shirt' : 'Ajouter un T-Shirt'}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.code ? `[${category.code}] ` : ''}{category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Aucune catégorie disponible. Veuillez d'abord créer des catégories.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur *
                </label>
                <select
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                >
                  <option value="">Sélectionner une couleur</option>
                  {colors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tailles et Stock *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sizes.map((size) => (
                    <div key={size} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-pino-blue transition-colors">
                      <input
                        type="checkbox"
                        id={`size-${size}`}
                        checked={selectedSizes[size]?.selected || false}
                        onChange={(e) => setSelectedSizes({
                          ...selectedSizes,
                          [size]: { ...selectedSizes[size], selected: e.target.checked }
                        })}
                        className="w-4 h-4 text-pino-blue border-gray-300 rounded focus:ring-pino-blue"
                      />
                      <label htmlFor={`size-${size}`} className="flex-1 flex items-center gap-2">
                        <span className="font-medium text-gray-900">{size}</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Stock"
                          disabled={!selectedSizes[size]?.selected}
                          value={selectedSizes[size]?.stock || 0}
                          onChange={(e) => setSelectedSizes({
                            ...selectedSizes,
                            [size]: { ...selectedSizes[size], stock: parseInt(e.target.value) || 0 }
                          })}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pino-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cochez les tailles disponibles et indiquez le stock pour chacune. Les SKU seront générés automatiquement.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (DT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images du produit
                </label>
                <div className="space-y-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={image.viewType}
                        onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[index] = { ...newImages[index], viewType: e.target.value as 'AVANT' | 'DOS' | 'COTE' };
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent bg-white"
                      >
                        <option value="AVANT">Avant</option>
                        <option value="DOS">Dos</option>
                        <option value="COTE">Côté</option>
                      </select>
                      
                      <input
                        type="text"
                        value={image.url}
                        onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[index] = { ...newImages[index], url: e.target.value };
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                        placeholder="URL de l'image ou uploadez un fichier"
                      />
                      
                      <label className="px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors cursor-pointer flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {uploadingImage === index ? (
                          <span>Upload...</span>
                        ) : (
                          <span>Fichier</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, index);
                            }
                          }}
                          className="hidden"
                          disabled={uploadingImage !== null}
                        />
                      </label>
                      
                      {image.url && (
                        <div className="w-12 h-12 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                          <img 
                            src={image.url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={() => {
                              console.error('❌ Image failed to load:', image.url);
                            }}
                          />
                        </div>
                      )}
                      
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, images: [...formData.images, { url: '', viewType: 'AVANT' }] })}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pino-blue hover:text-pino-blue transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une image
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Les images "Avant" seront affichées en premier. Choisissez la position pour chaque image.
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors font-semibold"
                >
                  {editingProduct ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteModalData && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          productName={deleteModalData.productName}
          blockingOrders={deleteModalData.blockingOrders}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteModalData(null);
          }}
          onDeleteWithOrders={handleDeleteWithOrders}
          onKeepInTrash={handleKeepInTrash}
        />
      )}
      
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
