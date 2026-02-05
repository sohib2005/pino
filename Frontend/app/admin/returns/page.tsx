'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Return {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  userComment?: string;
  adminComment?: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    phoneNumber: string;
    role: string;
  };
  order?: {
    orderNumber: string;
  };
  customOrder?: {
    orderNumber: string;
  };
  items: any[];
}

const statusColors = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  APPROUVE: 'bg-blue-100 text-blue-800',
  EN_TRAITEMENT: 'bg-purple-100 text-purple-800',
  TRAITE: 'bg-green-100 text-green-800',
  REFUSE: 'bg-red-100 text-red-800',
};

const statusLabels = {
  EN_ATTENTE: 'En attente',
  APPROUVE: 'Approuvé',
  EN_TRAITEMENT: 'En traitement',
  TRAITE: 'Traité',
  REFUSE: 'Refusé',
};

const reasonLabels = {
  ERREUR_IMPRESSION: 'Erreur d\'impression',
  MAUVAISE_TAILLE: 'Mauvaise taille',
  MAUVAISE_LANGUE: 'Mauvaise langue',
  PRODUIT_DEFECTUEUX: 'Produit défectueux',
  AUTRE: 'Autre',
};

export default function AdminReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    approuve: 0,
    enTraitement: 0,
    traite: 0,
    refuse: 0,
  });

  useEffect(() => {
    fetchReturns();
    fetchStats();
  }, [filterStatus]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all' 
        ? 'http://localhost:3001/returns'
        : `http://localhost:3001/returns?status=${filterStatus}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch returns');
      
      const data = await response.json();
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/returns/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleReturnClick = (returnId: string) => {
    router.push(`/admin/returns/${returnId}`);
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Retours</h1>
          <p className="text-gray-600">Gérez les demandes de retour et échanges</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <p className="text-sm text-yellow-800 mb-1">En Attente</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.enAttente}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <p className="text-sm text-blue-800 mb-1">Approuvé</p>
            <p className="text-3xl font-bold text-blue-900">{stats.approuve}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-6">
            <p className="text-sm text-purple-800 mb-1">En Traitement</p>
            <p className="text-3xl font-bold text-purple-900">{stats.enTraitement}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <p className="text-sm text-green-800 mb-1">Traité</p>
            <p className="text-3xl font-bold text-green-900">{stats.traite}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6">
            <p className="text-sm text-red-800 mb-1">Refusé</p>
            <p className="text-3xl font-bold text-red-900">{stats.refuse}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-pino-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({stats.total})
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
              onClick={() => setFilterStatus('APPROUVE')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'APPROUVE'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvé ({stats.approuve})
            </button>
            <button
              onClick={() => setFilterStatus('EN_TRAITEMENT')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'EN_TRAITEMENT'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En Traitement ({stats.enTraitement})
            </button>
            <button
              onClick={() => setFilterStatus('TRAITE')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'TRAITE'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Traité ({stats.traite})
            </button>
            <button
              onClick={() => setFilterStatus('REFUSE')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'REFUSE'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Refusé ({stats.refuse})
            </button>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((returnRecord) => (
                  <tr
                    key={returnRecord.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleReturnClick(returnRecord.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {returnRecord.returnNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {returnRecord.order?.orderNumber || returnRecord.customOrder?.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {returnRecord.user.firstName} {returnRecord.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {returnRecord.user.role === 'ANIMATEUR' ? '(Animateur)' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reasonLabels[returnRecord.reason as keyof typeof reasonLabels]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {returnRecord.items.length} article(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[returnRecord.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[returnRecord.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(returnRecord.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReturnClick(returnRecord.id);
                        }}
                        className="text-pino-blue hover:text-pino-blue-dark"
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {returns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun retour trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
