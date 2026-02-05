'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

interface CustomOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  hotelName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
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
}

const statusLabels = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  LIVRE: 'Livré',
  ANNULE: 'Annulé',
};

const statusColors = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  LIVRE: 'bg-green-100 text-green-800',
  ANNULE: 'bg-red-100 text-red-800',
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (!clientData) {
      router.push('/login');
      return;
    }
    
    const parsedClient = JSON.parse(clientData);
    if (parsedClient.role !== 'ANIMATEUR') {
      router.push('/boutique');
      return;
    }
    
    setClient(parsedClient);
    fetchOrders(parsedClient.id);
  }, [router]);

  const fetchOrders = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/custom-orders/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportProblem = (order: CustomOrder) => {
    if (order.status !== 'LIVRE') {
      alert('Vous pouvez uniquement signaler un problème pour une commande livrée');
      return;
    }
    router.push(`/mes-commandes/retour/${order.id}`);
  };

  if (!client) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes Commandes</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Vous n'avez pas encore de commandes</p>
            <button
              onClick={() => router.push('/grandes-commandes')}
              className="mt-4 px-6 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors"
            >
              Passer une commande
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Commande #{order.orderNumber}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {order.hotelName && (
                      <p className="text-sm text-gray-600">
                        Hôtel: <span className="font-medium">{order.hotelName}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[order.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                    <p className="text-lg font-bold text-purple-600 mt-2">
                      {Number(order.totalAmount).toFixed(2)} DT
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Articles:</h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.variant.product.code}</span>
                          {' - '}
                          Taille: {item.variant.size.name}
                          {' - '}
                          "{item.printedName}"
                        </div>
                        <span className="text-gray-600">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {order.status === 'LIVRE' && (
                    <button
                      onClick={() => handleReportProblem(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Signaler un problème
                    </button>
                  )}
                  <button
                    onClick={() => router.push(`/mes-commandes/${order.id}`)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
