import Header from './components/Header';
import Hero from './components/Hero';
import Carousel from './components/Carousel';
import HomeProducts from './components/HomeProducts';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <div className="bg-white">
        <Carousel />
      </div>
      <main className="min-h-screen">
        <Hero />
        <HomeProducts />
        {/* Additional sections will go here */}
      </main>
      <Footer />
    </>
  );
}
