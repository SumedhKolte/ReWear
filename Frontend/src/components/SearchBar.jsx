import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
}) => (
  <div className="bg-white py-4 sm:py-6 border-b border-stone-200 flex justify-center">
    <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4 sm:gap-6 items-center px-4 sm:px-0">
      <div className="relative flex-1 w-full">
        <input
          type="text"
          placeholder="Search sustainable fashion..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-12 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 text-base sm:text-lg"
          aria-label="Search sustainable fashion"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-stone-400" />
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          className="p-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Filter options"
        >
          <Filter className="h-6 w-6 text-stone-600" />
        </button>
        <div className="flex border border-stone-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-stone-600 hover:bg-stone-50'} transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500`}
            aria-label="Grid view"
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-stone-600 hover:bg-stone-50'} transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500`}
            aria-label="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default SearchBar;
