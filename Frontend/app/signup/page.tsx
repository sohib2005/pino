'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isFieldValid = (name: string, value: string) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return /^[a-zA-ZÀ-ÿ\s-]+$/.test(value) && value.length > 0;
      case 'phoneNumber':
        return /^\d{8}$/.test(value);
      case 'email':
        return value === '' || (value.includes('@') && value.includes('.') && value.length > 5);
      case 'password':
        return value.length >= 6;
      case 'confirmPassword':
        return value === formData.password && value.length >= 6;
      default:
        return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

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

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          address: formData.address || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte');
      }

      const data = await response.json();
      setSuccess(true);
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        address: '',
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Sign Up Form Section - Left Side */}
            <div className="p-8 md:p-12 lg:p-16">
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  CRÉER UN COMPTE
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* First Name Field */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${
                        formData.firstName === ''
                          ? 'border-gray-300 focus:border-blue-500'
                          : isFieldValid('firstName', formData.firstName)
                            ? 'border-green-500'
                            : 'border-red-500'
                      }`}
                      placeholder="Seulement des lettres"
                      required
                    />
                  </div>

                  {/* Last Name Field */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${
                        formData.lastName === ''
                          ? 'border-gray-300 focus:border-blue-500'
                          : isFieldValid('lastName', formData.lastName)
                            ? 'border-green-500'
                            : 'border-red-500'
                      }`}
                      placeholder="Seulement des lettres"
                      required
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Adresse e-mail (optionnel)
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${
                        formData.email === ''
                          ? 'border-gray-300 focus:border-blue-500'
                          : isFieldValid('email', formData.email)
                            ? 'border-green-500'
                            : 'border-red-500'
                      }`}
                      placeholder="exemple@email.com"
                    />
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-200 ${
                        formData.phoneNumber === ''
                          ? 'border-gray-300 focus:border-blue-500'
                          : isFieldValid('phoneNumber', formData.phoneNumber)
                            ? 'border-green-500'
                            : 'border-red-500'
                      }`}
                      required
                      maxLength={8}
                      placeholder="Ex: 50770418"
                    />
                  </div>

                  {/* Address Field */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Adresse
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent transition-all duration-200"
                      placeholder="Adresse complète (optionnel)"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 focus:border-blue-500 rounded-lg outline-none transition-all duration-200"
                        required
                        minLength={6}
                        placeholder="Minimum 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Confirmer le mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-lg outline-none transition-all duration-200 ${
                          formData.confirmPassword === ''
                            ? 'border-gray-300 focus:border-blue-500'
                            : isFieldValid('confirmPassword', formData.confirmPassword)
                              ? 'border-green-500'
                              : 'border-red-500'
                        }`}
                        required
                        minLength={6}
                        placeholder="Doit correspondre au mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      Compte créé avec succès ! Redirection en cours...
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-pino-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-pino-blue-dark transform hover:scale-[1.02] transition-all duration-200 shadow-pino hover:shadow-pino-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'CRÉATION EN COURS...' : 'CRÉER MON COMPTE'}
                  </button>
                </form>
              </div>
            </div>

            {/* Login Section - Right Side */}
            <div className="relative bg-pino-blue p-8 md:p-12 lg:p-16 flex items-center justify-center overflow-hidden">
              {/* T-shirt Pattern Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-5 gap-8 transform -rotate-12 scale-150">
                  {[...Array(25)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
                      />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Login Content */}
              <div className="relative z-10 text-center text-white max-w-md">
                <h2 className="text-3xl font-bold mb-4">DÉJÀ MEMBRE ?</h2>
                <p className="text-lg mb-8 text-white/90">
                  Vous avez déjà un compte ? Connectez-vous !
                </p>
                <Link
                  href="/login"
                  className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pino-blue transform hover:scale-105 transition-all duration-200"
                >
                  SE CONNECTER
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
