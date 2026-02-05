'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

export default function ProfilePage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    if (!clientData) {
      router.push('/login');
      return;
    }
    
    const parsedClient = JSON.parse(clientData);
    setClient(parsedClient);
    setFormData({
      firstName: parsedClient.firstName || '',
      lastName: parsedClient.lastName || '',
      email: parsedClient.email || '',
      phoneNumber: parsedClient.phoneNumber || '',
      address: parsedClient.address || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate phone number (8 digits)
    if (!/^[0-9]{8}$/.test(formData.phoneNumber)) {
      setError('Le numéro de téléphone doit contenir exactement 8 chiffres');
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('L\'adresse email n\'est pas valide');
      return;
    }

    // Validate password change if attempted
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Veuillez entrer votre mot de passe actuel');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Les nouveaux mots de passe ne correspondent pas');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    setLoading(true);

    try {
      // Here you would call your API to update the profile
      // For now, we'll just update localStorage/sessionStorage
      const updatedClient = {
        ...client,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      };

      if (localStorage.getItem('client')) {
        localStorage.setItem('client', JSON.stringify(updatedClient));
      } else {
        sessionStorage.setItem('client', JSON.stringify(updatedClient));
      }

      setClient(updatedClient);
      setSuccess('Profil mis à jour avec succès');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return null; // or a loading spinner
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-pino-blue p-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white text-pino-blue rounded-full flex items-center justify-center text-3xl font-bold">
                  {client.firstName?.charAt(0).toUpperCase() || client.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">
                    {client.firstName} {client.lastName}
                  </h1>
                  <p className="text-white/80">{client.email || client.phoneNumber}</p>
                  {client.role && (
                    <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded ${client.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}>
                      {client.role === 'ADMIN' ? 'Administrateur' : 'Client'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Modifier le profil
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Informations personnelles
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-gray-900 mb-2">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-gray-900 mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                      required
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500">Le numéro de téléphone ne peut pas être modifié</p>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
                      Adresse
                    </label>
                    <textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password Change */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Changer le mot de passe
                  </h3>

                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-pino-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-pino-blue-dark transform hover:scale-[1.02] transition-all duration-200 shadow-pino hover:shadow-pino-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/boutique')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
