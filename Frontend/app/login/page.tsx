'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPhoneDigits = /^\d*$/.test(phoneNumber);
  const showPhoneError = phoneTouched && phoneNumber.length > 0 && !isPhoneDigits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate phone number (8 digits)
    if (!/^[0-9]{8}$/.test(phoneNumber)) {
      setError('Le numéro de téléphone doit contenir exactement 8 chiffres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/client/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la connexion');
      }

      // Save client data in localStorage
      sessionStorage.setItem('client', JSON.stringify(data.client));

      // Redirect to home or dashboard
      router.push('/boutique');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Login Section - Left Side */}
            <div className="p-8 md:p-12 lg:p-16">
              <div className="max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                  SE CONNECTER
                </h1>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onBlur={() => setPhoneTouched(true)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                        showPhoneError
                          ? 'border-red-500 focus:ring-red-500 focus:border-transparent'
                          : 'border-gray-300 focus:ring-pino-blue focus:border-transparent'
                      }`}
                      required
                      disabled={loading}
                      pattern="[0-9]{8}"
                      maxLength={8}
                      placeholder="Ex: 50770418"
                      title="Le numéro de téléphone doit contenir exactement 8 chiffres"
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent transition-all duration-200"
                        required
                        disabled={loading}
                        placeholder="Mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
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

                  {/* Submit Button */}
                  <div className="h-8" aria-hidden="true" />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-pino-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-pino-blue-dark transform hover:scale-[1.02] transition-all duration-200 shadow-pino hover:shadow-pino-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? 'CONNEXION...' : 'SE CONNECTER'}
                  </button>


                </form>
              </div>
            </div>

            {/* Sign Up Section - Right Side */}
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

              {/* Sign Up Content */}
              <div className="relative z-10 text-center text-white max-w-md">
                <h2 className="text-3xl font-bold mb-4">S'INSCRIRE</h2>
                <p className="text-lg mb-8 text-white/90">
                  Vous n'avez pas de compte ? Créez-en un !
                </p>
                <Link
                  href="/signup"
                  className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-pino-blue transform hover:scale-105 transition-all duration-200"
                >
                  CRÉER UN COMPTE
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
