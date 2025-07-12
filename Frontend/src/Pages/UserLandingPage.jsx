import React, { useState, useEffect } from 'react';
import { 
  Search, Menu, X, Heart, ShoppingBag, User, Star, Leaf, 
  Recycle, Award, ChevronRight, Filter, Grid, List, 
  Truck, Shield, RefreshCw, ArrowUp, Play, MapPin,
  Phone, Mail, Instagram, Facebook, Twitter
} from 'lucide-react';

const ReWearLandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showScrollTop, setShowScrollTop] = useState(false);
//   const [activeFilter, setActiveFilter] = useState('all');

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    { 
      name: 'Women\'s Fashion', 
      image: '/api/placeholder/300/200', 
      items: '2,450+ items',
      color: 'from-rose-100 to-pink-100',
      icon: '👗'
    },
    { 
      name: 'Men\'s Clothing', 
      image: '/api/placeholder/300/200', 
      items: '1,890+ items',
      color: 'from-blue-100 to-indigo-100',
      icon: '👔'
    },
    { 
      name: 'Designer Pieces', 
      image: '/api/placeholder/300/200', 
      items: '567+ items',
      color: 'from-purple-100 to-violet-100',
      icon: '💎'
    },
    { 
      name: 'Vintage Collection', 
      image: '/api/placeholder/300/200', 
      items: '1,234+ items',
      color: 'from-amber-100 to-orange-100',
      icon: '🕰️'
    },
    { 
      name: 'Accessories', 
      image: '/api/placeholder/300/200', 
      items: '3,456+ items',
      color: 'from-emerald-100 to-teal-100',
      icon: '👜'
    },
    { 
      name: 'Sustainable Brands', 
      image: '/api/placeholder/300/200', 
      items: '890+ items',
      color: 'from-green-100 to-lime-100',
      icon: '🌱'
    }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: 'Vintage Denim Jacket',
      brand: 'Levi\'s',
      price: 45,
      originalPrice: 120,
      image: '/api/placeholder/300/400',
      rating: 4.8,
      condition: 'Excellent',
      badge: 'Trending',
      sustainability: 95
    },
    {
      id: 2,
      name: 'Designer Silk Blouse',
      brand: 'Theory',
      price: 65,
      originalPrice: 180,
      image: '/api/placeholder/300/400',
      rating: 4.9,
      condition: 'Like New',
      badge: 'Premium',
      sustainability: 88
    },
    {
      id: 3,
      name: 'Cashmere Sweater',
      brand: 'Everlane',
      price: 55,
      originalPrice: 150,
      image: '/api/placeholder/300/400',
      rating: 4.7,
      condition: 'Very Good',
      badge: 'Cozy',
      sustainability: 92
    },
    {
      id: 4,
      name: 'Leather Ankle Boots',
      brand: 'Madewell',
      price: 75,
      originalPrice: 200,
      image: '/api/placeholder/300/400',
      rating: 4.6,
      condition: 'Good',
      badge: 'Classic',
      sustainability: 85
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      location: "San Francisco, CA",
      text: "Found my dream vintage Chanel bag at 60% off retail! The quality verification process gave me complete confidence.",
      rating: 5,
      image: "/api/placeholder/60/60"
    },
    {
      name: "Marcus Johnson",
      location: "New York, NY", 
      text: "Selling my clothes here was so easy. Great prices and the sustainability impact makes me feel good about my choices.",
      rating: 5,
      image: "/api/placeholder/60/60"
    },
    {
      name: "Emma Rodriguez",
      location: "Austin, TX",
      text: "The app is incredibly user-friendly. I love seeing the environmental impact of each purchase!",
      rating: 5,
      image: "/api/placeholder/60/60"
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-orange-600 to-red-600 p-1.5 rounded-lg">
                <Recycle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                ReWear
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#" className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200">Shop</a>
              <a href="#" className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200">Sell</a>
              <a href="#" className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200">About</a>
              <a href="#" className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200">Impact</a>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="p-2 hover:bg-stone-100 rounded-full transition-colors duration-200">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 hover:text-orange-600" />
              </button>
              <button className="p-2 hover:bg-stone-100 rounded-full transition-colors duration-200">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 hover:text-orange-600" />
              </button>
              <button className="relative p-2 hover:bg-stone-100 rounded-full transition-colors duration-200">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 hover:text-orange-600" />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                  3
                </span>
              </button>
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 hover:bg-stone-100 rounded-full transition-colors duration-200"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-stone-200 shadow-lg">
            <div className="px-4 py-3 space-y-3">
              <a href="#" className="block py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors">Shop</a>
              <a href="#" className="block py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors">Sell</a>
              <a href="#" className="block py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors">About</a>
              <a href="#" className="block py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors">Impact</a>
            </div>
          </div>
        )}
      </header>

      {/* Enhanced Search Bar */}
      <div className="bg-white py-3 sm:py-4 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
            <div className="relative flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="Search sustainable fashion..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 sm:py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 text-sm sm:text-base"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-stone-400" />
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-stone-600" />
              </button>
              <div className="flex border border-stone-300 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-stone-600 hover:bg-stone-50'} transition-colors`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-stone-600 hover:bg-stone-50'} transition-colors`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 via-stone-50 to-green-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1.5 rounded-full">
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-green-700 font-semibold text-sm sm:text-base">Sustainable Fashion Revolution</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-stone-800 mb-4 sm:mb-6 leading-tight">
              Give Fashion a <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Second Life</span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover pre-loved designer pieces, vintage treasures, and sustainable fashion. 
              Shop guilt-free knowing every purchase helps reduce fashion waste by up to 73%.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
              <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                Start Shopping
              </button>
              <button className="border-2 border-orange-600 text-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 transform hover:scale-105">
                Sell Your Items
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm text-stone-600">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Authenticity Guaranteed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-green-600" />
                <span>Free Shipping Over $75</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span>30-Day Returns</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Impact Stats */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-4">Our Environmental Impact</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">Together, we're making a real difference in reducing fashion waste and carbon emissions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 p-4 sm:p-6 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-200">
                <Recycle className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 mx-auto" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">50,000+</h3>
              <p className="text-stone-600 font-medium">Items Given New Life</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-4 sm:p-6 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-200">
                <Leaf className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 mx-auto" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">2.5M lbs</h3>
              <p className="text-stone-600 font-medium">CO2 Emissions Saved</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-4 sm:p-6 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-200">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mx-auto" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">25,000+</h3>
              <p className="text-stone-600 font-medium">Happy Customers</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 sm:p-6 rounded-2xl mb-4 group-hover:scale-105 transition-transform duration-200">
                <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 mx-auto" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">150+</h3>
              <p className="text-stone-600 font-medium">Cities Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Categories Section */}
      <section className="py-12 sm:py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800 mb-4">Shop by Category</h2>
            <p className="text-lg sm:text-xl text-stone-600">Find your perfect sustainable style</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="relative">
                    <div className={`bg-gradient-to-br ${category.color} h-32 sm:h-48 flex items-center justify-center`}>
                      <span className="text-4xl sm:text-6xl">{category.icon}</span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <ChevronRight className="h-4 w-4 text-stone-600" />
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-stone-800 mb-2">{category.name}</h3>
                    <p className="text-orange-600 font-medium text-sm sm:text-base">{category.items}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Featured Products */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800 mb-4">Featured Finds</h2>
            <p className="text-lg sm:text-xl text-stone-600">Curated pieces you'll love</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="relative">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-48 sm:h-64 object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {product.badge}
                      </span>
                    </div>
                    <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors">
                      <Heart className="h-4 w-4 text-stone-600" />
                    </button>
                    <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 font-medium">Sustainability Score</span>
                        <span className="font-bold text-green-600">{product.sustainability}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${product.sustainability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-stone-500 font-medium">{product.brand}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-stone-600 font-medium">{product.rating}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-stone-800 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-orange-600">${product.price}</span>
                        <span className="text-sm text-stone-400 line-through">${product.originalPrice}</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        {product.condition}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Testimonials Section */}
      <section className="py-12 sm:py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800 mb-4">What Our Community Says</h2>
            <p className="text-lg sm:text-xl text-stone-600">Real stories from real customers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-stone-800">{testimonial.name}</h4>
                    <p className="text-sm text-stone-500">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-stone-600 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-stone-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-1.5 rounded-lg">
                  <Recycle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">ReWear</span>
              </div>
              <p className="text-stone-300 mb-6 max-w-md">
                Making sustainable fashion accessible to everyone. Join the circular fashion revolution and help us build a more sustainable future.
              </p>
              <div className="flex space-x-4">
                <button className="p-2 bg-stone-700 rounded-full hover:bg-stone-600 transition-colors">
                  <Instagram className="h-5 w-5" />
                </button>
                <button className="p-2 bg-stone-700 rounded-full hover:bg-stone-600 transition-colors">
                  <Facebook className="h-5 w-5" />
                </button>
                <button className="p-2 bg-stone-700 rounded-full hover:bg-stone-600 transition-colors">
                  <Twitter className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-orange-400">Shop</h4>
              <ul className="space-y-2 text-stone-300">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Women</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Men</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Accessories</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Vintage</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Designer</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-orange-400">Company</h4>
              <ul className="space-y-2 text-stone-300">
                <li><a href="#" className="hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Sustainability</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-orange-400">Support</h4>
              <ul className="space-y-2 text-stone-300">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Shipping</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-stone-700 mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-stone-300 text-sm mb-4 sm:mb-0">
                &copy; 2025 ReWear. All rights reserved. Made with ♻️ for a sustainable future.
              </p>
              <div className="flex items-center space-x-4 text-sm text-stone-300">
                <a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-orange-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-50"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ReWearLandingPage;
