import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Recycle, User, Heart, ShoppingBag, LogOut, Settings } from 'lucide-react';

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuthStatus();

    // Listen for storage changes (useful for multiple tabs)
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Handle user account click
  const handleUserClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      navigate('/signup');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
  };

  // Handle profile navigation - Updated to redirect to UserDashboard
  const handleProfile = () => {
    setShowUserMenu(false);
    navigate('/UserDashboard');
  };

  // Handle settings navigation
  const handleSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  return (
    <header className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="bg-gradient-to-br from-orange-600 to-red-600 p-1.5 rounded-lg">
              <Recycle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              ReWear
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button 
              onClick={() => navigate('/shop')}
              className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200"
            >
              Shop
            </button>
            <button 
              onClick={() => navigate('/sell')}
              className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200"
            >
              Sell
            </button>
            <button 
              onClick={() => navigate('/about')}
              className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200"
            >
              About
            </button>
            <button 
              onClick={() => navigate('/impact')}
              className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200"
            >
              Impact
            </button>
            <a href="#contact" className="text-stone-700 hover:text-orange-600 font-medium transition-colors duration-200">
              Contact
            </a>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Account Section */}
            <div className="relative">
              <button 
                onClick={handleUserClick}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors duration-200 relative"
              >
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 hover:text-orange-600" />
                {/* Online indicator for authenticated users */}
                {isAuthenticated && (
                  <span className="absolute top-1 right-1 bg-green-500 rounded-full h-2 w-2"></span>
                )}
              </button>

              {/* User Dropdown Menu */}
              {isAuthenticated && showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-200">
                    <p className="text-sm font-medium text-stone-800">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-stone-500">
                      {user?.email}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleProfile}
                    className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </button>
                  
                  <button
                    onClick={handleSettings}
                    className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <button 
              onClick={() => navigate('/wishlist')}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors duration-200"
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-stone-600 hover:text-orange-600" />
            </button>

            {/* Shopping Cart */}
            <button 
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-stone-100 rounded-full transition-colors duration-200"
            >
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
            <button 
              onClick={() => { navigate('/shop'); setIsMenuOpen(false); }}
              className="block w-full text-left py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
            >
              Shop
            </button>
            <button 
              onClick={() => { navigate('/sell'); setIsMenuOpen(false); }}
              className="block w-full text-left py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
            >
              Sell
            </button>
            <button 
              onClick={() => { navigate('/about'); setIsMenuOpen(false); }}
              className="block w-full text-left py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => { navigate('/impact'); setIsMenuOpen(false); }}
              className="block w-full text-left py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
            >
              Impact
            </button>
            <a 
              href="#contact" 
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
            >
              Contact
            </a>

            {/* Mobile Authentication Section */}
            <hr className="my-2" />
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="py-2">
                  <p className="text-sm font-medium text-stone-800">
                    Welcome, {user?.displayName || 'User'}!
                  </p>
                  <p className="text-xs text-stone-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => { handleProfile(); setIsMenuOpen(false); }}
                  className="block w-full text-left py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { handleSettings(); setIsMenuOpen(false); }}
                  className="block w-full text-left py-2 text-stone-700 hover:text-orange-600 font-medium transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="block w-full text-left py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                className="block w-full text-left py-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
