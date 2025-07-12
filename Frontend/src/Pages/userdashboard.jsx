import React, { useState, useEffect, useRef } from "react";
import {
  Edit, Plus, Heart, ShoppingBag, Star, LogOut, ChevronRight,
  Image as ImageIcon, BadgeCheck, Trash, X, User as UserIcon,
  RefreshCw, CheckCircle, MessageCircle, Calculator, Info,
  TrendingUp, Calendar, DollarSign, ArrowRightLeft, Wallet
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [availableListings, setAvailableListings] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [tab, setTab] = useState("listings");
  const [swapTab, setSwapTab] = useState("all");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [showSwapInterface, setShowSwapInterface] = useState(false);
  const [selectedSwapItems, setSelectedSwapItems] = useState({ user: null, partner: null });
  const [swapComparison, setSwapComparison] = useState(null);
  const [listingForm, setListingForm] = useState({
    title: "", description: "", category: "", subcategory: "", brand: "",
    type: "", size: "", condition: "", tags: [], originalPrice: "",
    purchaseDate: "", finalPrice: ""
  });
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();
  const listingImageRef = useRef();

  const categoryOptions = [
    { value: "T-Shirt", subcategories: ["Basic Tee", "Graphic Tee", "Polo", "Tank Top"] },
    { value: "Pants", subcategories: ["Jeans", "Chinos", "Dress Pants", "Shorts"] },
    { value: "Blazer", subcategories: ["Business Blazer", "Casual Blazer", "Formal Blazer"] },
    { value: "Dress", subcategories: ["Casual Dress", "Formal Dress", "Summer Dress"] },
    { value: "Jacket", subcategories: ["Denim Jacket", "Leather Jacket", "Bomber Jacket"] },
    { value: "Shoes", subcategories: ["Sneakers", "Dress Shoes", "Boots", "Sandals"] },
    { value: "Accessories", subcategories: ["Bags", "Belts", "Watches", "Jewelry"] }
  ];

  const conditionOptions = [
    { value: "New with Tags", description: "Brand new, never worn, tags attached" },
    { value: "Like New", description: "Excellent condition, barely worn" },
    { value: "Excellent", description: "Very good condition, minor signs of wear" },
    { value: "Good", description: "Good condition, some visible wear" },
    { value: "Fair", description: "Noticeable wear, but still functional" },
    { value: "Poor", description: "Significant wear, may need repairs" }
  ];

  // Enhanced API call function with better error handling
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    if (!token && !endpoint.includes('/health')) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    // Default headers
    const defaultHeaders = {};
    
    // Add authorization header if token exists
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Only add Content-Type for JSON requests, not FormData
    if (options.body && typeof options.body === 'string') {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`http://localhost:5000/api${endpoint}`, {
        headers: {
          ...defaultHeaders,
          ...options.headers
        },
        ...options
      });
      
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/signup';
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  };

  // Load user data from localStorage and API
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get user data from localStorage first
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        setProfileForm({ 
          name: userData.name || userData.displayName || "", 
          email: userData.email || "" 
        });
      }

      // Load fresh data from API
      await Promise.all([
        loadUserData(),
        loadListings(),
        loadSwaps(),
        loadAvailableListings()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    }
  };

  const loadUserData = async () => {
    try {
      const result = await apiCall('/users/profile');
      if (result.success) {
        setUser(result.data);
        setProfileForm({ 
          name: result.data.name || "", 
          email: result.data.email || "" 
        });
        
        // Update localStorage with fresh data
        localStorage.setItem('userData', JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // If API fails, keep using localStorage data
    }
  };

  const loadListings = async () => {
    try {
      const result = await apiCall('/listings');
      if (result.success) {
        setListings(result.data || []);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load your listings.');
    }
  };

  const loadAvailableListings = async () => {
    try {
      const result = await apiCall('/listings/available');
      if (result.success) {
        setAvailableListings(result.data || []);
      }
    } catch (error) {
      console.error('Error loading available listings:', error);
      // Don't show error for this as it's not critical
    }
  };

  const loadSwaps = async () => {
    try {
      const result = await apiCall('/swaps');
      if (result.success) {
        setSwaps(result.data || []);
      }
    } catch (error) {
      console.error('Error loading swaps:', error);
      // Don't show error for this as it's not critical
    }
  };

  // Calculate price when form data changes
  const calculatePrice = async (formData) => {
    if (!formData.originalPrice || !formData.purchaseDate || !formData.condition || !formData.category) {
      return;
    }

    try {
      const result = await apiCall('/listings/calculate-price', {
        method: 'POST',
        body: JSON.stringify({
          category: formData.category,
          brand: formData.brand || 'Generic',
          originalPrice: parseFloat(formData.originalPrice),
          purchaseDate: formData.purchaseDate,
          condition: formData.condition
        })
      });

      if (result.success) {
        setListingForm(prev => ({
          ...prev,
          finalPrice: result.data.calculatedPrice,
          priceFactors: result.data.priceFactors
        }));
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      // Don't show error as this is automatic calculation
    }
  };

  // Handle form changes
  const handleListingChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...listingForm, [name]: value };
    setListingForm(updatedForm);

    // Auto-calculate price when key fields change
    if (['originalPrice', 'purchaseDate', 'condition', 'category', 'brand'].includes(name)) {
      calculatePrice(updatedForm);
    }
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setListingForm(prev => ({ ...prev, tags }));
  };

  // Submit listing form
  const handleListingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(listingForm).forEach(key => {
        if (key === 'tags') {
          formData.append(key, JSON.stringify(listingForm[key]));
        } else if (key === 'priceFactors') {
          formData.append(key, JSON.stringify(listingForm[key] || {}));
        } else if (key !== 'images') {
          formData.append(key, listingForm[key] || '');
        }
      });

      // Add image file if exists
      if (listingImageRef.current?.files[0]) {
        formData.append('image', listingImageRef.current.files[0]);
      }

      const endpoint = editIndex !== null ? `/listings/${listings[editIndex].id}` : '/listings';
      const method = editIndex !== null ? 'PUT' : 'POST';

      const result = await apiCall(endpoint, {
        method,
        body: formData
      });

      if (result.success) {
        setShowListingForm(false);
        resetForm();
        await loadListings();
      }
    } catch (error) {
      console.error('Error submitting listing:', error);
      setError(error.message || 'Failed to submit listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setListingForm({
      title: "", description: "", category: "", subcategory: "", brand: "",
      type: "", size: "", condition: "", tags: [], originalPrice: "",
      purchaseDate: "", finalPrice: ""
    });
    setEditIndex(null);
    if (listingImageRef.current) {
      listingImageRef.current.value = '';
    }
  };

  // Handle swap request
  const handleSwapRequest = async (userListingId, partnerListingId) => {
    try {
      const comparison = await apiCall('/swaps/calculate', {
        method: 'POST',
        body: JSON.stringify({
          initiatorListingId: userListingId,
          receiverListingId: partnerListingId
        })
      });

      if (comparison.success) {
        setSwapComparison(comparison.data);
        setSelectedSwapItems({
          user: listings.find(l => l.id === userListingId),
          partner: availableListings.find(l => l.id === partnerListingId)
        });
        setShowSwapInterface(true);
      }
    } catch (error) {
      console.error('Error calculating swap:', error);
      setError('Failed to calculate swap comparison.');
    }
  };

  // Confirm swap request
  const confirmSwapRequest = async (message) => {
    try {
      const result = await apiCall('/swaps', {
        method: 'POST',
        body: JSON.stringify({
          initiatorListingId: selectedSwapItems.user.id,
          receiverListingId: selectedSwapItems.partner.id,
          message: message || 'Swap request from dashboard'
        })
      });

      if (result.success) {
        setShowSwapInterface(false);
        setSwapComparison(null);
        await loadSwaps();
        alert('Swap request sent successfully!');
      }
    } catch (error) {
      console.error('Error creating swap request:', error);
      setError('Failed to send swap request.');
    }
  };

  // Respond to swap
  const respondToSwap = async (swapId, action, response) => {
    try {
      const result = await apiCall(`/swaps/${swapId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ action, response })
      });

      if (result.success) {
        await loadSwaps();
      }
    } catch (error) {
      console.error('Error responding to swap:', error);
      setError('Failed to respond to swap request.');
    }
  };

  // Edit listing
  const handleEditListing = (index) => {
    const item = listings[index];
    setListingForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      subcategory: item.subcategory || '',
      brand: item.brand || '',
      type: item.type || '',
      size: item.size || '',
      condition: item.condition || '',
      tags: item.tags || [],
      originalPrice: item.original_price || '',
      purchaseDate: item.purchase_date || '',
      finalPrice: item.final_price || '',
      status: item.status || 'Active'
    });
    setEditIndex(index);
    setShowListingForm(true);
  };

  // Delete listing
  const handleDeleteListing = async (index) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiCall(`/listings/${listings[index].id}`, { method: 'DELETE' });
        await loadListings();
      } catch (error) {
        console.error('Error deleting listing:', error);
        setError('Failed to delete listing.');
      }
    }
  };

  // Profile handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('email', profileForm.email);
      
      if (fileInputRef.current?.files[0]) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }

      const result = await apiCall('/users/profile', {
        method: 'PUT',
        body: formData
      });

      if (result.success) {
        setShowProfileEdit(false);
        await loadUserData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/';
  };

  // Stats calculations
  const totalItems = listings.length;
  const activeItems = listings.filter(l => l.status === "Active").length;
  const pendingSwaps = swaps.filter(s => s.status === "pending").length;
  const completedSwaps = swaps.filter(s => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-2 sm:px-6 lg:px-8">
      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
            <button 
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 mb-10">
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center md:w-1/3">
          <div className="relative">
            <img
              src={user?.avatar_url || "/api/placeholder/120/120"}
              alt={user?.name || "User"}
              className="w-28 h-28 rounded-full object-cover border-4 border-orange-500 shadow"
            />
            <button 
              onClick={() => setShowProfileEdit(true)}
              className="absolute bottom-2 right-2 bg-orange-100 text-orange-600 p-2 rounded-full shadow hover:bg-orange-200 transition"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-stone-800">{user?.name || "Loading..."}</h2>
          <div className="text-stone-500 text-sm">{user?.email || "Loading..."}</div>
          <div className="flex items-center gap-2 mt-2 text-green-600">
            <BadgeCheck className="h-4 w-4" /> 
            Member since {user?.member_since ? new Date(user.member_since).toLocaleDateString() : "N/A"}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{user?.points || 0}</div>
              <div className="text-xs text-stone-500">Points</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">${user?.wallet_balance || 0}</div>
              <div className="text-xs text-stone-500">Wallet</div>
            </div>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
          >
            <Edit className="inline h-4 w-4 mr-2" /> Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="mt-3 text-orange-600 hover:underline flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Stats & Overview */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-orange-100 rounded-xl p-5 flex flex-col items-center">
              <Plus className="h-6 w-6 text-orange-600 mb-1" />
              <span className="text-2xl font-bold text-orange-600">{totalItems}</span>
              <span className="text-stone-600 text-sm">Total Items</span>
            </div>
            <div className="bg-green-100 rounded-xl p-5 flex flex-col items-center">
              <RefreshCw className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-2xl font-bold text-green-600">{activeItems}</span>
              <span className="text-stone-600 text-sm">Active</span>
            </div>
            <div className="bg-blue-100 rounded-xl p-5 flex flex-col items-center">
              <ArrowRightLeft className="h-6 w-6 text-blue-600 mb-1" />
              <span className="text-2xl font-bold text-blue-600">{pendingSwaps}</span>
              <span className="text-stone-600 text-sm">Pending Swaps</span>
            </div>
            <div className="bg-purple-100 rounded-xl p-5 flex flex-col items-center">
              <CheckCircle className="h-6 w-6 text-purple-600 mb-1" />
              <span className="text-2xl font-bold text-purple-600">{completedSwaps}</span>
              <span className="text-stone-600 text-sm">Completed</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowListingForm(true);
                resetForm();
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition"
            >
              <Plus className="inline h-4 w-4 mr-2" /> Add New Listing
            </button>
            <button className="flex-1 border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition">
              <Heart className="inline h-4 w-4 mr-2" /> View Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-4 border-b border-stone-200">
          <button
            className={`py-2 px-4 font-semibold transition ${
              tab === "listings"
                ? "border-b-4 border-orange-600 text-orange-600"
                : "text-stone-600 hover:text-orange-600"
            }`}
            onClick={() => setTab("listings")}
          >
            My Listings ({listings.length})
          </button>
          <button
            className={`py-2 px-4 font-semibold transition ${
              tab === "available"
                ? "border-b-4 border-green-600 text-green-600"
                : "text-stone-600 hover:text-green-600"
            }`}
            onClick={() => setTab("available")}
          >
            Available for Swap ({availableListings.length})
          </button>
          <button
            className={`py-2 px-4 font-semibold transition ${
              tab === "swaps"
                ? "border-b-4 border-blue-600 text-blue-600"
                : "text-stone-600 hover:text-blue-600"
            }`}
            onClick={() => setTab("swaps")}
          >
            Swaps ({swaps.length})
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto">
        {/* My Listings Tab */}
        {tab === "listings" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-stone-500 text-lg">No listings yet</p>
                <button
                  onClick={() => {
                    setShowListingForm(true);
                    resetForm();
                  }}
                  className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              listings.map((item, idx) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition group relative">
                  <img
                    src={item.image_url || "/api/placeholder/300/400"}
                    alt={item.title}
                    className="w-full h-56 object-cover rounded-t-2xl"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-stone-800">{item.title}</h3>
                    <div className="text-stone-500 text-xs mb-2">
                      {item.category} • {item.brand} • {item.size}
                    </div>
                    <div className="flex items-center flex-wrap gap-1 mb-2">
                      {item.tags?.map((tag, i) => (
                        <span key={i} className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-orange-600 font-bold">${item.final_price}</span>
                        {item.calculated_price && item.calculated_price !== item.final_price && (
                          <span className="text-xs text-stone-400 ml-2">calc: ${item.calculated_price}</span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-stone-400">
                      <span>{item.views || 0} views</span>
                      <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => handleEditListing(idx)}
                        className="bg-orange-100 text-orange-600 p-2 rounded-full shadow hover:bg-orange-200 transition"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(idx)}
                        className="bg-red-100 text-red-600 p-2 rounded-full shadow hover:bg-red-200 transition"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Available for Swap Tab */}
        {tab === "available" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableListings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-stone-500 text-lg">No items available for swap</p>
              </div>
            ) : (
              availableListings.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition group relative">
                  <img
                    src={item.image_url || "/api/placeholder/300/400"}
                    alt={item.title}
                    className="w-full h-56 object-cover rounded-t-2xl"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-stone-800">{item.title}</h3>
                    <div className="text-stone-500 text-xs mb-2">
                      {item.category} • {item.brand} • {item.size}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-orange-600 font-bold">${item.final_price}</span>
                      <div className="flex items-center gap-2">
                        <img
                          src={item.owner_avatar || "/api/placeholder/20/20"}
                          alt={item.owner_name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-xs text-stone-500">{item.owner_name}</span>
                      </div>
                    </div>
                    {listings.length > 0 && (
                      <div className="mt-4">
                        <select
                          onChange={(e) => e.target.value && handleSwapRequest(parseInt(e.target.value), item.id)}
                          className="w-full text-xs border rounded-lg px-2 py-1"
                          defaultValue=""
                        >
                          <option value="">Select your item to swap</option>
                          {listings.filter(l => l.status === 'Active').map(listing => (
                            <option key={listing.id} value={listing.id}>
                              {listing.title} (${listing.final_price})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Swaps Tab */}
        {tab === "swaps" && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex gap-6 mb-4">
              <button
                className={`py-2 px-4 font-semibold transition ${
                  swapTab === "all"
                    ? "border-b-4 border-orange-600 text-orange-600"
                    : "text-stone-600 hover:text-orange-600"
                }`}
                onClick={() => setSwapTab("all")}
              >
                All Swaps
              </button>
              <button
                className={`py-2 px-4 font-semibold transition ${
                  swapTab === "pending"
                    ? "border-b-4 border-yellow-600 text-yellow-600"
                    : "text-stone-600 hover:text-yellow-600"
                }`}
                onClick={() => setSwapTab("pending")}
              >
                Pending
              </button>
              <button
                className={`py-2 px-4 font-semibold transition ${
                  swapTab === "completed"
                    ? "border-b-4 border-green-600 text-green-600"
                    : "text-stone-600 hover:text-green-600"
                }`}
                onClick={() => setSwapTab("completed")}
              >
                Completed
              </button>
            </div>
            
            <div className="space-y-4">
              {swaps.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-500">No swaps yet</p>
                </div>
              ) : (
                swaps
                  .filter(swap => swapTab === "all" || swap.status === swapTab)
                  .map((swap) => (
                    <div key={swap.id} className="border rounded-lg p-4 hover:bg-stone-50 transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={swap.initiator_avatar || "/api/placeholder/40/40"}
                            alt={swap.initiator_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-medium">{swap.initiator_name}</div>
                            <div className="text-xs text-stone-500">
                              {swap.initiator_id === user?.id ? "You initiated" : "Received request"}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          swap.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          swap.status === "accepted" ? "bg-blue-100 text-blue-700" :
                          swap.status === "completed" ? "bg-green-100 text-green-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {swap.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={swap.initiator_item_image || "/api/placeholder/60/60"}
                            alt={swap.initiator_item_title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium text-sm">{swap.initiator_item_title}</div>
                            <div className="text-orange-600 font-bold">${swap.initiator_item_value}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <ArrowRightLeft className="h-6 w-6 text-stone-400" />
                          <img
                            src={swap.receiver_item_image || "/api/placeholder/60/60"}
                            alt={swap.receiver_item_title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium text-sm">{swap.receiver_item_title}</div>
                            <div className="text-orange-600 font-bold">${swap.receiver_item_value}</div>
                          </div>
                        </div>
                      </div>
                      
                      {swap.extra_payment_required > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <div className="text-sm">
                            <strong>Extra Payment Required:</strong> ${swap.extra_payment_required}
                            <div className="text-xs text-stone-600">
                              {swap.payment_direction === 'initiator_pays' ? 'Initiator pays' : 'Receiver pays'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {swap.status === "pending" && swap.receiver_id === user?.id && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => respondToSwap(swap.id, 'accept', '')}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                          >
                            Accept Swap
                          </button>
                          <button
                            onClick={() => respondToSwap(swap.id, 'reject', '')}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Listing Form Modal */}
      {showListingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleListingSubmit}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowListingForm(false)}
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editIndex !== null ? "Edit Listing" : "Add New Listing"}
              <Calculator className="h-5 w-5 text-orange-600" />
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-stone-800 border-b pb-2">Basic Information</h3>
                
                <input
                  name="title"
                  value={listingForm.title}
                  onChange={handleListingChange}
                  placeholder="Item Title"
                  required
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <textarea
                  name="description"
                  value={listingForm.description}
                  onChange={handleListingChange}
                  placeholder="Description"
                  required
                  rows={3}
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="category"
                    value={listingForm.category}
                    onChange={handleListingChange}
                    required
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.value}</option>
                    ))}
                  </select>

                  <select
                    name="subcategory"
                    value={listingForm.subcategory}
                    onChange={handleListingChange}
                    className="border rounded-lg px-3 py-2"
                    disabled={!listingForm.category}
                  >
                    <option value="">Select Subcategory</option>
                    {listingForm.category && categoryOptions
                      .find(cat => cat.value === listingForm.category)
                      ?.subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="brand"
                    value={listingForm.brand}
                    onChange={handleListingChange}
                    placeholder="Brand"
                    className="border rounded-lg px-3 py-2"
                  />

                  <select
                    name="type"
                    value={listingForm.type}
                    onChange={handleListingChange}
                    required
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="size"
                    value={listingForm.size}
                    onChange={handleListingChange}
                    placeholder="Size"
                    required
                    className="border rounded-lg px-3 py-2"
                  />

                  <select
                    name="condition"
                    value={listingForm.condition}
                    onChange={handleListingChange}
                    required
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Condition</option>
                    {conditionOptions.map(condition => (
                      <option key={condition.value} value={condition.value}>
                        {condition.value}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  name="tags"
                  value={listingForm.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="Tags (comma separated)"
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <div>
                  <label className="block font-semibold mb-1">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={listingImageRef}
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                </div>
              </div>

              {/* Right Column - Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-stone-800 border-b pb-2 flex items-center gap-2">
                  Smart Pricing <TrendingUp className="h-4 w-4 text-green-600" />
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Price</label>
                    <input
                      name="originalPrice"
                      value={listingForm.originalPrice}
                      onChange={handleListingChange}
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Date</label>
                    <input
                      name="purchaseDate"
                      value={listingForm.purchaseDate}
                      onChange={handleListingChange}
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                  </div>
                </div>

                {listingForm.finalPrice > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 mb-3">
                      Calculated: ${listingForm.finalPrice}
                    </div>
                    
                    {listingForm.priceFactors && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original Price:</span>
                          <span>${listingForm.priceFactors.basePrice}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Age Depreciation:</span>
                          <span>${listingForm.priceFactors.ageDepreciation}</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>Condition Adjustment:</span>
                          <span>${listingForm.priceFactors.conditionAdjustment}</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span>Brand Value:</span>
                          <span>${listingForm.priceFactors.brandValue}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Final Listing Price</label>
                  <input
                    name="finalPrice"
                    value={listingForm.finalPrice}
                    onChange={handleListingChange}
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {editIndex !== null ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                editIndex !== null ? 'Update Listing' : 'Create Listing'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleProfileSubmit}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative"
          >
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowProfileEdit(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <input
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Name"
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
              <input
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="Email"
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
              <div>
                <label className="block font-semibold mb-1">Change Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Swap Interface Modal */}
      {showSwapInterface && swapComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowSwapInterface(false)}
            >
              <X className="h-6 w-6" />
            </button>
            
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Swap Analysis
            </h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-stone-800 mb-2">Your Item</h4>
                <img 
                  src={selectedSwapItems.user?.image_url || "/api/placeholder/150/150"} 
                  alt={selectedSwapItems.user?.title} 
                  className="w-full h-32 object-cover rounded mb-2" 
                />
                <p className="text-sm font-medium">{selectedSwapItems.user?.title}</p>
                <div className="text-lg font-bold text-green-600">
                  ${swapComparison.comparison?.initiatorValue}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-stone-800 mb-2">Their Item</h4>
                <img 
                  src={selectedSwapItems.partner?.image_url || "/api/placeholder/150/150"} 
                  alt={selectedSwapItems.partner?.title} 
                  className="w-full h-32 object-cover rounded mb-2" 
                />
                <p className="text-sm font-medium">{selectedSwapItems.partner?.title}</p>
                <div className="text-lg font-bold text-green-600">
                  ${swapComparison.comparison?.receiverValue}
                </div>
              </div>
            </div>

            {swapComparison.comparison?.extraPayment > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-2">Payment Required</h4>
                <div className="text-lg font-bold text-blue-600">
                  ${swapComparison.comparison.extraPayment}
                </div>
                <p className="text-sm text-stone-600">
                  {swapComparison.comparison.paymentDirection === 'initiator_pays' 
                    ? 'You need to pay extra' 
                    : 'They need to pay extra'}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => confirmSwapRequest('')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition"
              >
                Request Swap
              </button>
              <button
                onClick={() => setShowSwapInterface(false)}
                className="flex-1 border-2 border-stone-300 text-stone-600 py-3 rounded-xl font-semibold hover:bg-stone-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
