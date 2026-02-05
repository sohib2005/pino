'use client';

import { useState, useEffect } from 'react';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

interface Animateur {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  address: string | null;
  role: string;
  _count?: {
    customOrders: number;
  };
}

export default function AnimateursPage() {
  const { alertConfig, isOpen, hideAlert, showSuccess, showError, showConfirm } = useCustomAlert();
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnimateur, setEditingAnimateur] = useState<Animateur | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    hotelName: '',
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    email: false,
  });

  const validateField = (name: string, value: string) => {
    let isValid = false;
    
    switch (name) {
      case 'firstName':
      case 'lastName':
        // Seulement des lettres (et espaces/tirets pour noms composés)
        isValid = /^[a-zA-ZÀ-ÿ\s-]+$/.test(value) && value.length > 0;
        break;
      case 'phoneNumber':
        // Exactement 8 chiffres
        isValid = /^\d{8}$/.test(value);
        break;
      case 'email':
        // Doit contenir @ et .
        isValid = value.includes('@') && value.includes('.') && value.length > 5;
        break;
    }
    
    setValidationErrors(prev => ({ ...prev, [name]: !isValid && value.length > 0 }));
    return isValid;
  };

  const isFieldValid = (name: string, value: string) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return /^[a-zA-ZÀ-ÿ\s-]+$/.test(value) && value.length > 0;
      case 'phoneNumber':
        return /^\d{8}$/.test(value);
      case 'email':
        return value.includes('@') && value.includes('.') && value.length > 5;
      default:
        return false;
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  useEffect(() => {
    fetchAnimateurs();
  }, []);

  const fetchAnimateurs = async () => {
    try {
      const response = await fetch('http://localhost:3001/animateurs');
      const data = await response.json();
      setAnimateurs(data.animateurs);
    } catch (error) {
      console.error('Error fetching animateurs:', error);
      showError('Erreur lors du chargement des animateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number (8 digits)
    if (!/^[0-9]{8}$/.test(formData.phoneNumber)) {
      showError('Le numéro de téléphone doit contenir exactement 8 chiffres');
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('L\'adresse email n\'est pas valide');
      return;
    }

    try {
      const url = editingAnimateur
        ? `http://localhost:3001/animateurs/${editingAnimateur.id}`
        : 'http://localhost:3001/animateurs';
      
      const method = editingAnimateur ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur');
      }

      showSuccess(editingAnimateur ? 'Animateur mis à jour' : 'Animateur créé avec succès');
      setIsModalOpen(false);
      resetForm();
      fetchAnimateurs();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleEdit = (animateur: Animateur) => {
    setEditingAnimateur(animateur);
    setFormData({
      firstName: animateur.firstName,
      lastName: animateur.lastName,
      phoneNumber: animateur.phoneNumber,
      email: animateur.email || '',
      password: '',
      hotelName: animateur.address?.replace('Hôtel ', '') || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Êtes-vous sûr de vouloir supprimer cet animateur ?',
      async () => {
        try {
          const response = await fetch(`http://localhost:3001/animateurs/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) throw new Error('Erreur lors de la suppression');

          showSuccess('Animateur supprimé');
          fetchAnimateurs();
        } catch (error: any) {
          showError(error.message);
        }
      },
      'Supprimer'
    );
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
      hotelName: '',
    });
    setEditingAnimateur(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="p-6">
      <CustomAlert 
        isOpen={isOpen} 
        onClose={hideAlert}
        message={alertConfig?.message || ''}
        title={alertConfig?.title}
        type={alertConfig?.type}
        onConfirm={alertConfig?.onConfirm}
        confirmText={alertConfig?.confirmText}
        cancelText={alertConfig?.cancelText}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Animateurs</h1>
          <p className="text-gray-600">Comptes spéciaux pour les hôtels partenaires</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-pino-blue text-white px-6 py-2 rounded-lg hover:bg-pino-blue-dark transition-colors"
        >
          + Nouvel Animateur
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pino-blue mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hôtel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commandes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {animateurs.map((animateur) => (
                <tr key={animateur.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {animateur.firstName} {animateur.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {animateur.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {animateur.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {animateur.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {animateur._count?.customOrders || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(animateur)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(animateur.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-black mb-4">
              {editingAnimateur ? 'Modifier Animateur' : 'Nouvel Animateur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Prénom *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg transition-colors outline-none ${
                    formData.firstName === '' 
                      ? 'border-gray-300 focus:border-blue-500' 
                      : isFieldValid('firstName', formData.firstName)
                        ? 'border-green-500'
                        : 'border-red-500'
                  }`}
                  required
                  placeholder="Seulement des lettres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg transition-colors outline-none ${
                    formData.lastName === '' 
                      ? 'border-gray-300 focus:border-blue-500' 
                      : isFieldValid('lastName', formData.lastName)
                        ? 'border-green-500'
                        : 'border-red-500'
                  }`}
                  required
                  placeholder="Seulement des lettres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Téléphone *</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg transition-colors outline-none ${
                    formData.phoneNumber === '' 
                      ? 'border-gray-300 focus:border-blue-500' 
                      : isFieldValid('phoneNumber', formData.phoneNumber)
                        ? 'border-green-500'
                        : 'border-red-500'
                  }`}
                  required
                  maxLength={8}
                  placeholder="Ex: 50770418"
                  disabled={!!editingAnimateur}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Email</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border-2 rounded-lg transition-colors outline-none ${
                    formData.email === '' 
                      ? 'border-gray-300 focus:border-blue-500' 
                      : isFieldValid('email', formData.email)
                        ? 'border-green-500'
                        : 'border-red-500'
                  }`}
                  placeholder="exemple@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Nom de l'Hôtel</label>
                <input
                  type="text"
                  value={formData.hotelName}
                  onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pino-blue"
                  placeholder="Paradise Djerba"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Mot de passe {!editingAnimateur && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pino-blue"
                  required={!editingAnimateur}
                  placeholder={editingAnimateur ? 'Laisser vide pour ne pas changer' : ''}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pino-blue text-white rounded-lg hover:bg-pino-blue-dark"
                >
                  {editingAnimateur ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
