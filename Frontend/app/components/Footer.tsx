import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/pino-logo.png"
                alt="Pino Logo"
                className="h-12 w-auto bg-white rounded-md p-1"
              />
              <span className="text-lg font-semibold text-white">Pino</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Impression textile personnalisée avec qualité professionnelle et livraison rapide.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/personnaliser" className="hover:text-white transition-colors">
                  Personnaliser
                </Link>
              </li>
              <li>
                <Link href="/boutique" className="hover:text-white transition-colors">
                  Boutique
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Panier
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Aide</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">
                  S'inscrire
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Mes commandes
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="hover:text-white transition-colors">
                  Mot de passe oublié
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📍 Tunis, Tunisie</li>
              <li>📞 +216 00 000 000</li>
              <li>✉️ contact@pino.tn</li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.facebook.com" className="hover:text-white transition-colors" aria-label="Facebook">
                Facebook
              </a>
              <a href="https://www.instagram.com" className="hover:text-white transition-colors" aria-label="Instagram">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <span>© {new Date().getFullYear()} Pino. Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">
              Conditions
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
