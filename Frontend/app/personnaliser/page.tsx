/**
 * Personnaliser Page
 * T-Shirt design editor with header and footer
 */

import Header from '../components/Header';
import EditorClient from './EditorClient';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Personnaliser votre T-Shirt | Pino',
  description: 'Créez votre design personnalisé avec notre éditeur professionnel',
};

export default function PersonnaliserPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <EditorClient />
      </main>
      <Footer />
    </>
  );
}
