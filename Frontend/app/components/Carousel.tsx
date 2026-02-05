'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveImageUrl } from '@/lib/image';

interface CarouselSlide {
  id: number;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  order: number;
  isActive: boolean;
}

export default function Carousel() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('http://localhost:3001/carousel');
        if (!response.ok) throw new Error('Failed to fetch carousel slides');
        const data = await response.json();
        setSlides(data);
      } catch (error) {
        console.error('Error fetching carousel slides:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleSlideClick = (slide: CarouselSlide) => {
    if (slide.link) {
      if (slide.link.startsWith('http')) {
        window.open(slide.link, '_blank');
      } else {
        router.push(slide.link);
      }
    }
  };

  if (loading) {
    return (
      <div className="relative w-full max-w-7xl mx-auto h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden bg-gray-100 mt-20 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full max-w-7xl mx-auto h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden bg-gradient-to-r from-blue-400 to-blue-600 mt-20 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Bienvenue</h2>
          <p className="text-lg">Découvrez nos produits personnalisés</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden bg-gray-100 mt-20 rounded-lg">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`min-w-full h-full relative ${slide.link ? 'cursor-pointer' : ''}`}
            onClick={() => handleSlideClick(slide)}
          >
            {/* Slide Image */}
            <img
              src={resolveImageUrl(slide.imageUrl) || '/imgs/IMG1.png'}
              alt={slide.title || 'Slide'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/imgs/IMG1.png';
              }}
            />
            
            {/* Overlay with Title and Subtitle */}
            {(slide.title || slide.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                <div className="p-6 md:p-8 lg:p-10 text-white">
                  {slide.title && (
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                      {slide.title}
                    </h2>
                  )}
                  {slide.subtitle && (
                    <p className="text-sm md:text-base lg:text-lg drop-shadow-lg">
                      {slide.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Previous Button */}
      {slides.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {slides.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                currentSlide === index
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
