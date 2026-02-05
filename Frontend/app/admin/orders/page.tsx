'use client';

import { useState, useEffect } from 'react';
import { ordersApi, Order } from '@/lib/api';
import { resolveImageUrl, resolveProductImageUrl } from '@/lib/image';
import { useSearchParams } from 'next/navigation';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

// Print styles - Professional Receipt Design
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Hide print area on screen */
    .print-area {
      display: none;
    }
    
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide everything by default */
      body * {
        visibility: hidden;
      }
      
      /* Show only print area */
      .print-area,
      .print-area * {
        visibility: visible;
      }
      
      /* Position print area */
      .print-area {
        display: block !important;
        position: absolute;
        top: 0;
        left: 0;
        width: 210mm;
        max-width: 210mm;
        background: white;
        padding: 0;
        margin: 0;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
      }
      
      .print-receipt {
        width: 100%;
        max-width: 100%;
      }
      
      /* Header */
      .print-header {
        text-align: center;
        padding-bottom: 15mm;
        margin-bottom: 10mm;
        border-bottom: 2px solid #000;
      }
      
      .print-logo {
        font-size: 28pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 5mm;
        letter-spacing: 2px;
      }
      
      .print-subtitle {
        font-size: 14pt;
        color: #333;
        margin-bottom: 3mm;
      }
      
      /* Order info grid */
      .print-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5mm;
        margin-bottom: 8mm;
        padding: 5mm;
        border: 1px solid #ddd;
        background: #f9f9f9;
      }
      
      .print-info-item {
        margin-bottom: 2mm;
      }
      
      .print-info-label {
        font-weight: bold;
        color: #000;
        font-size: 11px;
      }
      
      .print-info-value {
        color: #333;
        font-size: 12px;
      }
      
      /* Client box */
      .print-client-box {
        padding: 5mm;
        border: 1.5pt solid #000;
        margin-bottom: 8mm;
        background: white;
      }
      
      .print-client-title {
        font-size: 13pt;
        font-weight: bold;
        margin-bottom: 3mm;
        color: #000;
      }
      
      /* Items table */
      .print-items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8mm;
        font-size: 11px;
      }
      
      .print-items-table thead {
        background: #f0f0f0;
        border-top: 2pt solid #000;
        border-bottom: 2pt solid #000;
      }
      
      .print-items-table th {
        padding: 3mm 2mm;
        text-align: left;
        font-weight: bold;
        font-size: 11px;
        color: #000;
      }
      
      .print-items-table td {
        padding: 3mm 2mm;
        border-bottom: 1px solid #ddd;
        vertical-align: top;
      }
      
      .print-items-table tbody tr {
        page-break-inside: avoid;
      }
      
      .print-items-table tbody tr:last-child td {
        border-bottom: 2pt solid #000;
      }
      
      .print-item-details {
        font-size: 10px;
        color: #555;
        margin-top: 1mm;
      }
      
      /* Total section */
      .print-total-section {
        margin-top: 8mm;
        text-align: right;
      }
      
      .print-total-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 2mm;
      }
      
      .print-total-label {
        width: 40mm;
        text-align: right;
        padding-right: 5mm;
        font-size: 12px;
      }
      
      .print-total-value {
        width: 35mm;
        text-align: right;
        font-size: 12px;
      }
      
      .print-grand-total {
        border-top: 2pt solid #000;
        padding-top: 3mm;
        margin-top: 3mm;
      }
      
      .print-grand-total .print-total-label {
        font-weight: bold;
        font-size: 14px;
      }
      
      .print-grand-total .print-total-value {
        font-weight: bold;
        font-size: 16px;
      }
      
      /* Footer */
      .print-footer {
        margin-top: 15mm;
        padding-top: 5mm;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 10px;
        color: #666;
      }
      
      .print-footer-thanks {
        font-size: 13px;
        font-weight: bold;
        color: #000;
        margin-bottom: 2mm;
      }
      
      /* Prevent page breaks */
      .print-client-box,
      .print-items-table,
      .print-total-section {
        page-break-inside: avoid;
      }
      
      /* Status badge */
      .print-status-badge {
        display: inline-block;
        padding: 2mm 4mm;
        border: 1px solid #000;
        font-weight: bold;
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);
}

interface CustomOrder {
  id: string;
  orderNumber: string;
  status: 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' | 'ANNULE';
  totalAmount: string | number;
  hotelName?: string;
  notes?: string;
  userId: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber: string;
    address?: string;
  };
  items: Array<{
    id: string;
    printedName: string;
    textLanguage: string;
    withDjerbaLogo: boolean;
    quantity: number;
    variant: {
      product: {
        name: string;
        code: string;
        price: number;
      };
      size: {
        name: string;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

type CombinedOrder = (Order | CustomOrder) & { isCustomOrder?: boolean };

const statusColors = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  LIVRE: 'bg-green-100 text-green-800',
  ANNULE: 'bg-red-100 text-red-800',
};

const statusLabels = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  LIVRE: 'Livré',
  ANNULE: 'Annulé',
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const { alertConfig, isOpen, hideAlert, showSuccess, showError } = useCustomAlert();
  const [orders, setOrders] = useState<CombinedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CombinedOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filtersByType, setFiltersByType] = useState<Record<string, { status: string; query: string }>>({
    all: { status: 'all', query: '' },
    normal: { status: 'all', query: '' },
    touristique: { status: 'all', query: '' },
    personnaliser: { status: 'all', query: '' },
  });

  const getPersonalizationPreviewUrls = (item: any): { front?: string; back?: string } => {
    const designJson = item?.personalization?.designJson;
    const payload = typeof designJson === 'string'
      ? (() => {
          try { return JSON.parse(designJson); } catch { return null; }
        })()
      : designJson;

    const front = payload?.front?.previewUrl;
    const back = payload?.back?.previewUrl;

    return {
      front: typeof front === 'string' ? front : undefined,
      back: typeof back === 'string' ? back : undefined,
    };
  };

  const getProductImageByView = (images: any[] | undefined, view: 'AVANT' | 'DOS') => {
    if (!images?.length) return undefined;
    return images.find((img) => String(img.viewType).toUpperCase() === view)?.imageUrl;
  };

  const getProductFrontBackImages = (item: any) => {
    const images = item?.variant?.product?.images || item?.tshirt?.images || [];
    const front = getProductImageByView(images, 'AVANT') || resolveProductImageUrl(item?.variant?.product) || resolveProductImageUrl(item?.tshirt);
    const back = getProductImageByView(images, 'DOS');

    return {
      front: front ? resolveImageUrl(front) : undefined,
      back: back ? resolveImageUrl(back) : undefined,
    };
  };

  useEffect(() => {
    fetchOrders();
    // Check for filter param in URL
    const filterParam = searchParams.get('filter');
    const typeParam = searchParams.get('type') || 'all';

    setFilterType(typeParam);

    const stored = filtersByType[typeParam] || { status: 'all', query: '' };
    setFilterStatus(filterParam || stored.status || 'all');
    setSearchQuery(stored.query || '');
  }, [searchParams, filtersByType]);

  useEffect(() => {
    const typeKey = filterType || 'all';
    setFiltersByType((prev) => ({
      ...prev,
      [typeKey]: { status: filterStatus, query: searchQuery },
    }));
  }, [filterType, filterStatus, searchQuery]);

  const fetchOrders = async () => {
    try {
      // Fetch both regular and custom orders
      const [regularOrders, customOrdersRaw] = await Promise.all([
        ordersApi.getAllAdmin(),
        fetch('http://localhost:3001/custom-orders/all')
          .then(async (res) => {
            if (!res.ok) return [];
            const data = await res.json();
            if (Array.isArray(data)) return data;
            if (Array.isArray((data as any)?.customOrders)) return (data as any).customOrders;
            if (Array.isArray((data as any)?.data)) return (data as any).data;
            return [];
          })
          .catch(() => [])
      ]);
      
      // Mark custom orders
      const markedCustomOrders = customOrdersRaw.map((order: CustomOrder) => ({
        ...order,
        isCustomOrder: true
      }));
      
      // Combine and sort by date
      const combined = [...regularOrders, ...markedCustomOrders].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(combined);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status'], isCustomOrder?: boolean) => {
    try {
      let updatedOrder;
      
      if (isCustomOrder) {
        await fetch(`http://localhost:3001/custom-orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        
        // Fetch the updated custom order with items
        const response = await fetch(`http://localhost:3001/custom-orders/${orderId}`, {
          headers: { 'x-user-id': 'admin' }
        });
        updatedOrder = await response.json();
        updatedOrder = { ...updatedOrder, isCustomOrder: true };
      } else {
        // updateStatus already returns the full order with items
        updatedOrder = await ordersApi.updateStatus(orderId, status);
      }
      
      await fetchOrders();
      
      // Update selected order if it's the one being modified
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      
      showSuccess('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erreur lors de la mise à jour du statut');
    }
  };

  const isPersonalizedOrder = (order: CombinedOrder) => {
    if ((order as any).isCustomOrder) return false;
    return Array.isArray(order.items)
      ? order.items.some((it: any) => it?.personalizationId || it?.personalization)
      : false;
  };

  const orderMatchesQuery = (order: CombinedOrder, query: string) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();

    const baseFields = [
      order.orderNumber,
      order.user?.firstName,
      order.user?.lastName,
      order.user?.phoneNumber,
      (order as any).phoneNumber,
      (order as any).address,
      (order as any).hotelName,
    ].filter(Boolean).join(' ').toLowerCase();

    if (baseFields.includes(q)) return true;

    const items = Array.isArray(order.items) ? order.items : [];
    return items.some((item: any) => {
      const sku = item?.variant?.sku || item?.tshirt?.sku || '';
      const name = item?.variant?.product?.name || item?.tshirt?.name || '';
      const color = item?.variant?.product?.color || item?.tshirt?.color || '';
      const size = item?.variant?.size?.name || item?.tshirt?.size || '';
      const printedName = item?.printedName || '';
      const row = `${sku} ${name} ${color} ${size} ${printedName}`.toLowerCase();
      return row.includes(q);
    });
  };

  const typeFilteredOrders = orders.filter((order) => {
    if (filterType === 'touristique') return Boolean((order as any).isCustomOrder);
    if (filterType === 'personnaliser') return !Boolean((order as any).isCustomOrder) && isPersonalizedOrder(order);
    if (filterType === 'normal') return !Boolean((order as any).isCustomOrder) && !isPersonalizedOrder(order);
    return true;
  });

  const filteredByStatus = filterStatus === 'all'
    ? typeFilteredOrders
    : typeFilteredOrders.filter(order => order.status === filterStatus);

  const filteredOrders = filteredByStatus.filter((order) => orderMatchesQuery(order, searchQuery));

  const stats = {
    total: typeFilteredOrders.length,
    enAttente: typeFilteredOrders.filter(o => o.status === 'EN_ATTENTE').length,
    enCours: typeFilteredOrders.filter(o => o.status === 'EN_COURS').length,
    livre: typeFilteredOrders.filter(o => o.status === 'LIVRE').length,
    totalRevenue: typeFilteredOrders
      .filter(o => o.status !== 'ANNULE')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Commandes</h1>
          <p className="text-gray-600">Gérez toutes les commandes de vos clients</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Commandes</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <p className="text-sm text-yellow-800 mb-1">En Attente</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.enAttente}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <p className="text-sm text-blue-800 mb-1">En Cours</p>
            <p className="text-3xl font-bold text-blue-900">{stats.enCours}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <p className="text-sm text-green-800 mb-1">Livrées</p>
            <p className="text-3xl font-bold text-green-900">{stats.livre}</p>
          </div>
        </div>

        {/* Live Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par commande, client, SKU, couleur..."
              className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pino-blue focus:border-transparent bg-white"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-pino-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('EN_ATTENTE')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'EN_ATTENTE'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Attente ({stats.enAttente})
            </button>
            <button
              onClick={() => setFilterStatus('EN_COURS')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'EN_COURS'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Cours ({stats.enCours})
            </button>
            <button
              onClick={() => setFilterStatus('LIVRE')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'LIVRE'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Livrées ({stats.livre})
            </button>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                        {order.isCustomOrder && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Grande Commande
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user?.firstName} {order.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{order.user?.phoneNumber}</div>
                      {order.isCustomOrder && (order as CustomOrder).hotelName && (
                        <div className="text-xs text-purple-600 mt-1">
                          🏨 {(order as CustomOrder).hotelName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items.length} article(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-pino-blue">
                        {Number(order.totalAmount).toFixed(2)} TND
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as Order['status'], order.isCustomOrder)}
                        className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${
                          statusColors[order.status]
                        }`}
                      >
                        <option value="EN_ATTENTE">En attente</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="LIVRE">Livré</option>
                        <option value="ANNULE">Annulé</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-pino-blue hover:text-pino-blue-dark font-medium"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          )}
        </div>

        {/* Modal de détails */}
        {selectedOrder && (
          <>
            {/* PRINT-ONLY RECEIPT - Professional Invoice Layout */}
            <div className="print-area">
              <div className="print-receipt">
                {/* Header */}
                <div className="print-header">
                  <div className="print-logo">PINO SHOP</div>
                  <div className="print-subtitle">
                    {selectedOrder.isCustomOrder ? 'Grande Commande Personnalisée' : 'Commande / Reçu'}
                  </div>
                </div>

                {/* Order Information Grid */}
                <div className="print-info-grid">
                  <div>
                    <div className="print-info-item">
                      <div className="print-info-label">Numéro de commande:</div>
                      <div className="print-info-value">#{selectedOrder.orderNumber}</div>
                    </div>
                    <div className="print-info-item">
                      <div className="print-info-label">Date:</div>
                      <div className="print-info-value">
                        {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="print-info-item">
                      <div className="print-info-label">Statut:</div>
                      <div className="print-info-value">
                        <span className="print-status-badge">
                          {selectedOrder.status === 'EN_ATTENTE' ? 'EN ATTENTE' :
                           selectedOrder.status === 'EN_COURS' ? 'EN COURS' :
                           selectedOrder.status === 'LIVRE' ? 'LIVRÉE' :
                           selectedOrder.status === 'ANNULE' ? 'ANNULÉE' : selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="print-info-item">
                      <div className="print-info-label">Type:</div>
                      <div className="print-info-value">
                        {selectedOrder.isCustomOrder ? 'Grande Commande' : 'Commande Standard'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Information Box */}
                <div className="print-client-box">
                  <div className="print-client-title">Informations Client</div>
                  <div className="print-info-item">
                    <div className="print-info-label">Nom:</div>
                    <div className="print-info-value">
                      {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                    </div>
                  </div>
                  <div className="print-info-item">
                    <div className="print-info-label">Téléphone:</div>
                    <div className="print-info-value">
                      {selectedOrder.user?.phoneNumber || (selectedOrder as any).phoneNumber || 'N/A'}
                    </div>
                  </div>
                  {selectedOrder.isCustomOrder && (selectedOrder as CustomOrder).hotelName ? (
                    <div className="print-info-item">
                      <div className="print-info-label">Hôtel:</div>
                      <div className="print-info-value">{(selectedOrder as CustomOrder).hotelName}</div>
                    </div>
                  ) : (
                    <div className="print-info-item">
                      <div className="print-info-label">Adresse:</div>
                      <div className="print-info-value">{(selectedOrder as Order).address}</div>
                    </div>
                  )}
                  {selectedOrder.notes && (
                    <div className="print-info-item">
                      <div className="print-info-label">Notes:</div>
                      <div className="print-info-value">{selectedOrder.notes}</div>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="print-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Article</th>
                      <th style={{ width: '30%' }}>Détails</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Qté</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Prix Unit.</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any) => {
                        const personalizationPreviews = getPersonalizationPreviewUrls(item);
                        const productImages = getProductFrontBackImages(item);
                        const frontPreview = resolveImageUrl(personalizationPreviews.front) || productImages.front;
                        const backPreview = resolveImageUrl(personalizationPreviews.back) || productImages.back;
                        const sku = item?.variant?.sku || item?.tshirt?.sku || 'N/A';
                        const color = item?.variant?.product?.color || item?.tshirt?.color || 'N/A';
                        const size = item?.variant?.size?.name || item?.tshirt?.size || 'N/A';

                        return (
                          <tr key={item.id}>
                            <td>
                              <div style={{ display: 'flex', gap: '6mm', alignItems: 'flex-start' }}>
                                <div>
                                  <strong>
                                    {selectedOrder.isCustomOrder
                                      ? `${item.variant?.product?.code || ''} - ${item.variant?.product?.name || 'N/A'}`
                                      : item?.variant?.product?.name || item?.tshirt?.name || 'N/A'}
                                  </strong>
                                  <div className="print-item-details">
                                    <div>SKU: {sku}</div>
                                    <div>Couleur: {color}</div>
                                    <div>Taille: {size}</div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '3mm' }}>
                                  {frontPreview && (
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ fontSize: '9px', marginBottom: '1mm' }}>Avant</div>
                                      <img
                                        src={frontPreview}
                                        alt="Avant"
                                        style={{ width: '22mm', height: '22mm', objectFit: 'cover', border: '1px solid #ddd' }}
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                                        }}
                                      />
                                    </div>
                                  )}
                                  {backPreview && (
                                    <div style={{ textAlign: 'center' }}>
                                      <div style={{ fontSize: '9px', marginBottom: '1mm' }}>Arrière</div>
                                      <img
                                        src={backPreview}
                                        alt="Arrière"
                                        style={{ width: '22mm', height: '22mm', objectFit: 'cover', border: '1px solid #ddd' }}
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="print-item-details">
                                {selectedOrder.isCustomOrder ? (
                                  <>
                                    <div>Nom imprimé: {item.printedName}</div>
                                    <div>Langue: {item.textLanguage === 'FRENCH_ARABIC' ? 'FR & AR' : 
                                                      item.textLanguage === 'FRENCH_ONLY' ? 'FR' : 'AR'}</div>
                                    <div>Logo Djerba: {item.withDjerbaLogo ? 'Oui' : 'Non'}</div>
                                  </>
                                ) : (
                                  <>
                                    <div>SKU: {sku}</div>
                                    <div>Couleur: {color}</div>
                                    <div>Taille: {size}</div>
                                  </>
                                )}
                              </div>
                            </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>
                            {selectedOrder.isCustomOrder
                              ? Number(item.variant.product.price).toFixed(2)
                              : Number(item.unitPrice).toFixed(2)} DT
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong>
                              {selectedOrder.isCustomOrder
                                ? (Number(item.variant.product.price) * item.quantity).toFixed(2)
                                : Number(item.totalPrice).toFixed(2)} DT
                            </strong>
                          </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '5mm' }}>
                          Aucun article dans cette commande
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Total Section */}
                <div className="print-total-section">
                  <div className="print-total-row print-grand-total">
                    <div className="print-total-label">TOTAL:</div>
                    <div className="print-total-value">
                      {Number(selectedOrder.totalAmount).toFixed(2)} DT
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="print-footer">
                  <div className="print-footer-thanks">Merci pour votre commande!</div>
                  <div>PINO T-Shirts</div>
                  <div style={{ marginTop: '2mm' }}>
                    Imprimé le {new Date().toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* SCREEN MODAL - Hidden when printing */}
            <div className="no-print fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header - Buttons only visible on screen */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Commande #{selectedOrder.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimer
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>


              <div className="p-6 space-y-6">
                {/* Informations client */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Informations Client
                    {selectedOrder.isCustomOrder && (
                      <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                        Grande Commande Personnalisée
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedOrder.user?.phoneNumber || (selectedOrder as any).phoneNumber || 'N/A'}
                      </p>
                    </div>
                    {selectedOrder.isCustomOrder && (selectedOrder as CustomOrder).hotelName ? (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">🏨 Hôtel</p>
                        <p className="text-sm font-medium text-purple-700">
                          {(selectedOrder as CustomOrder).hotelName}
                        </p>
                      </div>
                    ) : (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Adresse de livraison</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(selectedOrder as Order).address}
                        </p>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détails (t-shirt personnalisé) */}
                {!selectedOrder.isCustomOrder && (() => {
                  const personalizedItems = (selectedOrder.items || []).filter(
                    (it: any) => it?.personalizationId || it?.personalization,
                  );
                  if (personalizedItems.length === 0) return null;

                  const otherItems = (selectedOrder.items || []).filter(
                    (it: any) => !it?.personalizationId && !it?.personalization,
                  );

                  const abs = (u?: string) => {
                    if (!u) return undefined;
                    if (u.startsWith('http')) return u;
                    if (u.startsWith('/')) return `http://localhost:3001${u}`;
                    return `http://localhost:3001/${u}`;
                  };

                  return (
                    <div className="space-y-5">
                      {personalizedItems.map((personalizedItem: any, index: number) => {
                        const personalizedItemAny = personalizedItem as any;
                        const designJson = personalizedItemAny?.personalization?.designJson;
                        const payload = typeof designJson === 'string' ? (() => {
                          try { return JSON.parse(designJson); } catch { return null; }
                        })() : designJson;

                        const frontUrl = typeof payload?.front?.previewUrl === 'string' ? payload.front.previewUrl : undefined;
                        const backUrl = typeof payload?.back?.previewUrl === 'string' ? payload.back.previewUrl : undefined;

                        return (
                          <div key={personalizedItemAny?.id || index} className="bg-white border border-gray-200 rounded-lg p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                              Détails {personalizedItems.length > 1 ? `(${index + 1}/${personalizedItems.length})` : ''}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <div className="px-3 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200 bg-white">
                                  Avant
                                </div>
                                <div className="aspect-[1/1] flex items-center justify-center">
                                  {frontUrl ? (
                                    <img
                                      src={abs(frontUrl)}
                                      alt="Avant"
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="text-sm text-gray-400">Image indisponible</div>
                                  )}
                                </div>
                              </div>

                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                <div className="px-3 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200 bg-white">
                                  Arrière
                                </div>
                                <div className="aspect-[1/1] flex items-center justify-center">
                                  {backUrl ? (
                                    <img
                                      src={abs(backUrl)}
                                      alt="Arrière"
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="text-sm text-gray-400">Image indisponible</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-5">
                              <div className="font-semibold text-gray-900 mb-2">Détails :</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="text-gray-600">Taille</div>
                                  <div className="font-semibold text-gray-900">{personalizedItemAny?.variant?.size?.name || 'N/A'}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="text-gray-600">Quantité</div>
                                  <div className="font-semibold text-gray-900">{personalizedItemAny?.quantity}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="text-gray-600">Prix unitaire</div>
                                  <div className="font-semibold text-gray-900">{Number(personalizedItemAny?.unitPrice || 0).toFixed(2)} DT</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="text-gray-600">Total</div>
                                  <div className="font-semibold text-gray-900">{Number(personalizedItemAny?.totalPrice || 0).toFixed(2)} DT</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="text-gray-600">Statut</div>
                                  <div className="font-semibold text-gray-900">{selectedOrder.status}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <div className="text-gray-600">Date</div>
                                  <div className="font-semibold text-gray-900">
                                    {new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="mt-1">
                          <ul className="list-disc pl-5 text-sm text-gray-800">
                            <li className="font-semibold">Les autres tshirt</li>
                            {otherItems.length === 0 ? (
                              <li className="text-gray-500">Aucun autre article</li>
                            ) : (
                              otherItems.map((it: any) => (
                                <li key={it.id}>
                                  {(it?.variant?.product?.name || 'Produit')} • {it?.variant?.size?.name || 'N/A'} • x{it?.quantity}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Articles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Articles Commandés</h3>
                  <div className="space-y-3">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex gap-4 border border-gray-200 rounded-lg p-4">
                        {selectedOrder.isCustomOrder ? (
                          <>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {item.variant.product.code} - {item.variant.product.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Nom imprimé:</strong> "{item.printedName}"
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Taille: {item.variant.size.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Langue: {item.textLanguage === 'FRENCH_ARABIC' ? 'Français & Arabe' : 
                                         item.textLanguage === 'FRENCH_ONLY' ? 'Français' : 'Arabe'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Logo Djerba: {item.withDjerbaLogo ? 'Oui' : 'Non'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                              <p className="text-sm text-gray-600">Prix unitaire: {Number(item.variant.product.price).toFixed(2)} DT</p>
                              <p className="text-lg font-bold text-purple-600 mt-1">
                                {(Number(item.variant.product.price) * item.quantity).toFixed(2)} DT
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={resolveProductImageUrl(item?.variant?.product) || '/imgs/IMG1.png'}
                              alt={item?.variant?.product?.name || 'T-Shirt'}
                              className="w-20 h-20 object-cover rounded"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item?.variant?.product?.name || 'T-Shirt'}</h4>
                              <p className="text-sm text-gray-600">SKU: {item?.variant?.sku || 'N/A'}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Couleur: {item?.variant?.product?.color || 'N/A'} | Taille: {item?.variant?.size?.name || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                              <p className="text-sm text-gray-600">Prix unitaire: {Number(item.unitPrice).toFixed(2)} DT</p>
                              <p className="text-lg font-bold text-pino-blue mt-1">
                                {Number(item.totalPrice).toFixed(2)} DT
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Aucun article dans cette commande</p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className={`text-2xl font-bold ${selectedOrder.isCustomOrder ? 'text-purple-600' : 'text-pino-blue'}`}>
                      {Number(selectedOrder.totalAmount).toFixed(2)} DT
                    </span>
                  </div>
                </div>

                {/* Statut - Hidden on print */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Changer le statut
                  </label>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      updateStatus(selectedOrder.id, e.target.value as Order['status'], selectedOrder.isCustomOrder);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                  >
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="LIVRE">Livré</option>
                    <option value="ANNULE">Annulé</option>
                  </select>
                </div>
              </div>
            </div>
            </div>
          </>
        )}
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
