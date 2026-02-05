'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset logic here
    console.log('Reset password for:', email);
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            {!submitted ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Mot de passe oublié ?
                </h1>
                <p className="text-gray-600 mb-8">
                  Entrez votre adresse e-mail et nous vous enverrons un lien pour
                  réinitialiser votre mot de passe.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Adresse e-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pino-blue focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-pino-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-pino-blue-dark transform hover:scale-[1.02] transition-all duration-200 shadow-pino hover:shadow-pino-lg"
                  >
                    ENVOYER LE LIEN
                  </button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm text-pino-blue hover:underline"
                    >
                      ← Retour à la connexion
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  E-mail envoyé !
                </h2>
                <p className="text-gray-600 mb-8">
                  Si un compte existe avec l'adresse{' '}
                  <span className="font-semibold">{email}</span>, vous recevrez un
                  lien de réinitialisation dans quelques minutes.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-pino-blue text-white font-semibold rounded-lg hover:bg-pino-blue-dark transition-colors duration-200"
                >
                  Retour à la connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
