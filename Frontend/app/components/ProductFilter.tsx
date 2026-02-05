'use client';

interface ProductFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  productCount: number;
}

export default function ProductFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  productCount,
}: ProductFilterProps) {
  return (
    <div className="mb-8 space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pino-blue focus:outline-none transition-colors duration-200 text-gray-900 placeholder-gray-400"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-pino-blue text-white shadow-pino'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-pino-blue hover:text-pino-blue'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sort and Count */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 whitespace-nowrap">
            <span className="font-semibold text-pino-blue">{productCount}</span> produit{productCount > 1 ? 's' : ''}
          </span>
          
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:border-pino-blue focus:outline-none transition-colors duration-200 text-gray-700 font-medium bg-white cursor-pointer hover:border-pino-blue"
            >
              <option value="default">Par défaut</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom A-Z</option>
            </select>
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCategory !== 'Tous' || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Filtres actifs:</span>
          
          {selectedCategory !== 'Tous' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pino-blue-subtle text-pino-blue rounded-lg text-sm font-medium">
              <span>{selectedCategory}</span>
              <button
                onClick={() => onCategoryChange('Tous')}
                className="hover:bg-pino-blue hover:text-white rounded-full p-0.5 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {searchQuery && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pino-blue-subtle text-pino-blue rounded-lg text-sm font-medium">
              <span>"{searchQuery}"</span>
              <button
                onClick={() => onSearchChange('')}
                className="hover:bg-pino-blue hover:text-white rounded-full p-0.5 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          <button
            onClick={() => {
              onCategoryChange('Tous');
              onSearchChange('');
            }}
            className="text-sm text-pino-blue hover:text-pino-blue-dark font-medium transition-colors duration-200"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}
