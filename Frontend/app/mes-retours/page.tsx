'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

interface Return {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  userComment?: string;
  adminComment?: string;
  createdAt: string;
  processedAt?: string;
  order?: {
    orderNumber: string;
  } | null;
  customOrder?: {
    orderNumber: string;
  } | null;
  items: Array<{
    id: number;
    quantityReturned: number;
    action?: string;
    processed: boolean;
    orderItem?: {
      variant: {
        product: {
          name: string;
          code: string;
        };
        size: {
          name: string;
        };
      };
      personalization?: {
        text?: string;
      };
    } | null;
    customOrderItem?: {
      printedName: string;
      variant: {
        product: {
          name: string;
          code: string;
        };
        size: {
          name: string;
        };
      };
    } | null;
  }>;
}

const statusLabels = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  EN_TRAITEMENT: 'En traitement',
  TRAITE: 'Traité',
  REFUSE: 'Refusé',
};

const statusColors = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  APPROUVE: 'bg-blue-100 text-blue-800',
  EN_TRAITEMENT: 'bg-purple-100 text-purple-800',
  TRAITE: 'bg-green-100 text-green-800',
  REFUSE: 'bg-red-100 text-red-800',
};

const reasonLabels = {
  ERREUR_IMPRESSION: 'Erreur d\'impression',
  MAUVAISE_TAILLE: 'Mauvaise taille',
  MAUVAISE_LANGUE: 'Mauvaise langue',
  PRODUIT_DEFECTUEUX: 'Produit défectueux',
  AUTRE: 'Autre',
};

const actionLabels = {
  REIMPRESSION: 'Réimpression',
  CHANGEMENT_TAILLE: 'Changement de taille',
  AVOIR: 'Avoir',
  REMBOURSEMENT: 'Remboursement',
};

export default function MyReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
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
    fetchReturns(parsedClient.id);
  }, [router]);

  const fetchReturns = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/returns/my/returns?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error('Failed to fetch returns');
      
      const data = await response.json();
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mes Demandes de Retour</h1>
          <p className="text-gray-600 mt-2">Suivez l'état de vos demandes de retour et échange</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue"></div>
          </div>
        ) : returns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mb-4">Vous n'avez aucune demande de retour</p>
            <button
              onClick={() => router.push('/mes-commandes')}
              className="px-6 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark transition-colors"
            >
              Voir mes commandes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((returnRecord) => (
              <div key={returnRecord.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Retour {returnRecord.returnNumber}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Commande: {returnRecord.customOrder?.orderNumber || returnRecord.order?.orderNumber || '—'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Demandé le: {new Date(returnRecord.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[returnRecord.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[returnRecord.status as keyof typeof statusLabels]}
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">Raison:</p>
                    <p className="font-medium text-gray-900">
                      {reasonLabels[returnRecord.reason as keyof typeof reasonLabels]}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Articles retournés:</h3>
                    <div className="space-y-2">
                      {returnRecord.items.map((item) => (
                        (() => {
                          const productCode = item.customOrderItem?.variant?.product?.code || item.orderItem?.variant?.product?.code;
                          const sizeName = item.customOrderItem?.variant?.size?.name || item.orderItem?.variant?.size?.name;
                          const printedName = item.customOrderItem?.printedName;
                          return (
                        <div key={item.id} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {productCode} - 
                              Taille: {sizeName}
                            </p>
                            {printedName && (
                              <p className="text-sm text-gray-600">
                                "{printedName}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Quantité: {item.quantityReturned}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            {item.processed ? (
                              <div>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  Traité
                                </span>
                                {item.action && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {actionLabels[item.action as keyof typeof actionLabels]}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                En attente
                              </span>
                            )}
                          </div>
                        </div>
                          );
                        })()
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  {returnRecord.userComment && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <p className="text-xs text-blue-800 font-medium mb-1">Votre commentaire:</p>
                      <p className="text-sm text-blue-900">{returnRecord.userComment}</p>
                    </div>
                  )}

                  {returnRecord.adminComment && (
                    <div className="mb-4 p-3 bg-purple-50 rounded">
                      <p className="text-xs text-purple-800 font-medium mb-1">Réponse de l'administrateur:</p>
                      <p className="text-sm text-purple-900">{returnRecord.adminComment}</p>
                    </div>
                  )}

                  {/* Status Info */}
                  <div className="pt-4 border-t border-gray-200">
                    {returnRecord.status === 'EN_ATTENTE' && (
                      <p className="text-sm text-gray-600">
                        ⏳ Votre demande est en cours d'examen par notre équipe
                      </p>
                    )}
                    {returnRecord.status === 'APPROUVE' && (
                      <p className="text-sm text-green-600">
                        ✅ Votre demande a été approuvée et sera traitée prochainement
                      </p>
                    )}
                    {returnRecord.status === 'EN_TRAITEMENT' && (
                      <p className="text-sm text-blue-600">
                        🔄 Votre retour est en cours de traitement
                      </p>
                    )}
                    {returnRecord.status === 'TRAITE' && (
                      <p className="text-sm text-green-600">
                        ✅ Votre retour a été traité
                        {returnRecord.processedAt && ` le ${new Date(returnRecord.processedAt).toLocaleDateString('fr-FR')}`}
                      </p>
                    )}
                    {returnRecord.status === 'REFUSE' && (
                      <p className="text-sm text-red-600">
                        ❌ Votre demande a été refusée
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
