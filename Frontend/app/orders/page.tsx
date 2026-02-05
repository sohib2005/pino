'use client';

import { useState, useEffect } from 'react';
import { ordersApi, Order } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/image';
import Link from 'next/link';
import Header from '../components/Header';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface CustomOrder {
  id: string;
  orderNumber: string;
  status: 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' | 'ANNULE';
  totalAmount: string | number;
  hotelName?: string;
  createdAt: string;
  items: Array<{
    id: number;
    printedName: string;
    quantity: number;
    variant: {
      product: {
        name: string;
        images?: Array<{
          id: number;
          imageUrl: string;
          viewType: string;
          order: number;
        }>;
      };
      size: {
        name: string;
      };
    };
  }>;
}

type CombinedOrder = (Order & { orderType: 'normal' }) | (CustomOrder & { orderType: 'custom' });

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

export default function OrdersPage() {
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();
  const [orders, setOrders] = useState<CombinedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Get user from localStorage
      const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
      const client = clientData ? JSON.parse(clientData) : null;

      // Fetch both regular and custom orders
      const [regularOrders, customOrdersData] = await Promise.all([
        ordersApi.getAll(),
        client?.id 
          ? fetch('http://localhost:3001/custom-orders', {
              headers: {
                'x-user-id': client.id
              }
            }).then(res => res.json()).catch(() => [])
          : Promise.resolve([])
      ]);

      // Ensure customOrders is an array
      const customOrders = Array.isArray(customOrdersData) ? customOrdersData : [];

      // Combine and mark order types
      const combined: CombinedOrder[] = [
        ...regularOrders.map((o: Order) => ({ ...o, orderType: 'normal' as const })),
        ...customOrders.map((o: CustomOrder) => ({ ...o, orderType: 'custom' as const }))
      ];

      // Sort by date (most recent first)
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(combined);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderType: 'normal' | 'custom') => {
    showConfirm(
      'Êtes-vous sûr de vouloir annuler cette commande ?',
      async () => {
        try {
          if (orderType === 'normal') {
            await ordersApi.cancel(orderId);
          } else {
            await fetch(`http://localhost:3001/custom-orders/${orderId}/cancel`, {
              method: 'PUT',
            });
          }
          await fetchOrders();
          showSuccess('Commande annulée avec succès');
        } catch (error: any) {
          console.error('Error canceling order:', error);
          showError(error.message || 'Erreur lors de l\'annulation de la commande');
        }
      },
      'Annuler la commande'
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes Commandes</h1>
          <Link
            href="/boutique"
            className="px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors"
          >
            Continuer vos achats
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">Vous n'avez aucune commande</p>
            <Link
              href="/boutique"
              className="inline-block px-6 py-3 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Commande #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                      <p className="text-lg font-bold text-pino-blue mt-2">
                        {Number(order.totalAmount).toFixed(2)} TND
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          {order.orderType === 'custom' ? 'Hôtel' : 'Adresse de livraison'}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.orderType === 'custom' 
                            ? (order as CustomOrder & { orderType: 'custom' }).hotelName || 'N/A'
                            : (order as Order & { orderType: 'normal' }).address
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(order as Order & { orderType: 'normal' }).phoneNumber || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {order.orderType === 'normal' && (order as Order & { orderType: 'normal' }).notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-sm text-gray-900">
                          {(order as Order & { orderType: 'normal' }).notes}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Articles ({order.items.length})
                        {order.orderType === 'custom' && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Commande personnalisée
                          </span>
                        )}
                      </p>
                      {order.items.map((item) => {
                        const isCustom = order.orderType === 'custom';
                        const customItem = isCustom ? item as CustomOrder['items'][0] : null;
                        const normalItem = !isCustom ? item as Order['items'][0] : null;
                        
                        return (
                          <div key={item.id} className="flex gap-4 items-center">
                            <img
                              src={resolveProductImageUrl(item.variant?.product) || '/imgs/IMG1.png'}
                              alt={item.variant?.product?.name || 'Product'}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/imgs/IMG1.png';
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.variant?.product?.name || 'Product'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {normalItem?.variant?.product?.color && `Couleur: ${normalItem.variant.product.color}`}
                                {item.variant?.size?.name && ` • Taille: ${item.variant.size.name}`}
                                {customItem && ` • Nom: "${customItem.printedName}"`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">x{item.quantity}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {normalItem?.totalPrice 
                                  ? Number(normalItem.totalPrice).toFixed(2)
                                  : 'N/A'
                                } TND
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                      {order.status === 'EN_ATTENTE' && (
                        <button
                          onClick={() => handleCancelOrder(order.id, order.orderType)}
                          className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Annuler la commande
                        </button>
                      )}
                      
                      {order.status === 'LIVRE' && (
                        <Link
                          href={order.orderType === 'normal' 
                            ? `/orders/retour/${order.id}` 
                            : `/mes-commandes/retour/${order.id}`
                          }
                          className="px-4 py-2 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          Signaler un problème
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </>
  );
}
