import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft, Calculator, DollarSign, CheckCircle, AlertCircle,
  TrendingUp, User, MessageCircle, X, Loader, Info, Wallet
} from 'lucide-react';

const SwapInterface = () => {
  const [userListings, setUserListings] = useState([]);
  const [availableListings, setAvailableListings] = useState([]);
  const [selectedUserItem, setSelectedUserItem] = useState(null);
  const [selectedPartnerItem, setSelectedPartnerItem] = useState(null);
  const [swapComparison, setSwapComparison] = useState(null);
  const [swapMessage, setSwapMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = ['T-Shirt', 'Pants', 'Blazer', 'Dress', 'Jacket', 'Shoes', 'Accessories'];

  // API helper
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
  };

  // Load data on component mount
  useEffect(() => {
    loadUserListings();
    loadAvailableListings();
  }, []);

  const loadUserListings = async () => {
    try {
      const result = await apiCall('/listings');
      setUserListings(result.data.filter(item => item.status === 'Active'));
    } catch (error) {
      console.error('Error loading user listings:', error);
    }
  };

  const loadAvailableListings = async () => {
    try {
      const result = await apiCall('/listings/available');
      setAvailableListings(result.data);
    } catch (error) {
      console.error('Error loading available listings:', error);
    }
  };

  // Calculate swap comparison
  const calculateSwap = async () => {
    if (!selectedUserItem || !selectedPartnerItem) return;

    setCalculating(true);
    try {
      const result = await apiCall('/swaps/calculate', {
        method: 'POST',
        body: JSON.stringify({
          initiatorListingId: selectedUserItem.id,
          receiverListingId: selectedPartnerItem.id
        })
      });
      setSwapComparison(result.data);
    } catch (error) {
      console.error('Error calculating swap:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Create swap request
  const createSwapRequest = async () => {
    setLoading(true);
    try {
      await apiCall('/swaps', {
        method: 'POST',
        body: JSON.stringify({
          initiatorListingId: selectedUserItem.id,
          receiverListingId: selectedPartnerItem.id,
          message: swapMessage
        })
      });
      
      setShowConfirmation(false);
      setSelectedUserItem(null);
      setSelectedPartnerItem(null);
      setSwapComparison(null);
      setSwapMessage('');
      alert('Swap request sent successfully!');
    } catch (error) {
      console.error('Error creating swap request:', error);
      alert('Failed to send swap request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter available listings
  const filteredListings = availableListings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate swap when both items are selected
  useEffect(() => {
    if (selectedUserItem && selectedPartnerItem) {
      calculateSwap();
    }
  }, [selectedUserItem, selectedPartnerItem]);

  const getFairnessColor = (fairnessRatio) => {
    if (fairnessRatio >= 0.95) return 'text-green-600 bg-green-100';
    if (fairnessRatio >= 0.85) return 'text-blue-600 bg-blue-100';
    if (fairnessRatio >= 0.75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFairnessLabel = (fairnessRatio) => {
    if (fairnessRatio >= 0.95) return 'Excellent';
    if (fairnessRatio >= 0.85) return 'Good';
    if (fairnessRatio >= 0.75) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4 flex items-center justify-center gap-3">
            <ArrowRightLeft className="h-8 w-8 text-orange-600" />
            Smart Swap Interface
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Find the perfect swap match with our intelligent pricing system. 
            Compare values and make fair exchanges with other ReWear members.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Items */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Your Items
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userListings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedUserItem(item)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedUserItem?.id === item.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-stone-200 hover:border-orange-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url || '/api/placeholder/60/60'}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-800 text-sm">{item.title}</h3>
                      <p className="text-xs text-stone-500">{item.category} • {item.condition}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-orange-600 font-bold">${item.final_price}</span>
                        <span className="text-xs text-stone-400">{item.brand}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Swap Analysis */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Swap Analysis
            </h2>

            {!selectedUserItem || !selectedPartnerItem ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">Select items from both sides to see swap analysis</p>
              </div>
            ) : calculating ? (
              <div className="text-center py-12">
                <Loader className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                <p className="text-stone-500">Calculating swap fairness...</p>
              </div>
            ) : swapComparison ? (
              <div className="space-y-6">
                {/* Items Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <img
                      src={selectedUserItem.image_url || '/api/placeholder/80/80'}
                      alt={selectedUserItem.title}
                      className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
                    />
                    <p className="text-sm font-medium text-stone-800">{selectedUserItem.title}</p>
                    <p className="text-lg font-bold text-green-600">${swapComparison.comparison.initiatorValue}</p>
                  </div>
                  
                  <div className="text-center">
                    <img
                      src={selectedPartnerItem.image_url || '/api/placeholder/80/80'}
                      alt={selectedPartnerItem.title}
                      className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"
                    />
                    <p className="text-sm font-medium text-stone-800">{selectedPartnerItem.title}</p>
                    <p className="text-lg font-bold text-green-600">${swapComparison.comparison.receiverValue}</p>
                  </div>
                </div>

                {/* Fairness Analysis */}
                <div className="bg-stone-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-stone-800">Fairness Analysis</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      getFairnessColor(swapComparison.comparison.fairnessRatio)
                    }`}>
                      {getFairnessLabel(swapComparison.comparison.fairnessRatio)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-stone-600">Price Difference:</span>
                      <div className="font-bold text-stone-800">
                        ${Math.abs(swapComparison.comparison.priceDifference)}
                      </div>
                    </div>
                    <div>
                      <span className="text-stone-600">Fairness Ratio:</span>
                      <div className="font-bold text-stone-800">
                        {Math.round(swapComparison.comparison.fairnessRatio * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra Payment */}
                {swapComparison.comparison.extraPayment > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Extra Payment Required</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600 mb-2">
                      ${swapComparison.comparison.extraPayment}
                    </div>
                    <p className="text-sm text-blue-700">
                      {swapComparison.comparison.paymentDirection === 'initiator_pays'
                        ? 'You need to pay extra'
                        : 'They need to pay extra'}
                    </p>
                  </div>
                )}

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={swapMessage}
                    onChange={(e) => setSwapMessage(e.target.value)}
                    placeholder="Add a personal message to your swap request..."
                    rows={3}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Request Swap
                </button>
              </div>
            ) : null}
          </div>

          {/* Available Items */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Available Items
            </h2>

            {/* Filters */}
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedPartnerItem(item)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    selectedPartnerItem?.id === item.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-stone-200 hover:border-blue-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url || '/api/placeholder/60/60'}
                      alt={item.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-800 text-sm">{item.title}</h3>
                      <p className="text-xs text-stone-500">{item.category} • {item.condition}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-orange-600 font-bold">${item.final_price}</span>
                        <div className="flex items-center gap-1">
                          <img
                            src={item.owner_avatar || '/api/placeholder/16/16'}
                            alt={item.owner_name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-xs text-stone-400">{item.owner_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
              <button
                onClick={() => setShowConfirmation(false)}
                className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              >
                <X className="h-6 w-6" />
              </button>
              
              <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Confirm Swap Request
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-600 mb-2">You're offering:</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedUserItem?.image_url || '/api/placeholder/40/40'}
                      alt={selectedUserItem?.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-stone-800">{selectedUserItem?.title}</p>
                      <p className="text-orange-600 font-bold">${selectedUserItem?.final_price}</p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <ArrowRightLeft className="h-6 w-6 text-stone-400 mx-auto" />
                </div>

                <div className="bg-stone-50 rounded-lg p-4">
                  <p className="text-sm text-stone-600 mb-2">For their:</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPartnerItem?.image_url || '/api/placeholder/40/40'}
                      alt={selectedPartnerItem?.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-stone-800">{selectedPartnerItem?.title}</p>
                      <p className="text-orange-600 font-bold">${selectedPartnerItem?.final_price}</p>
                    </div>
                  </div>
                </div>

                {swapComparison?.comparison.extraPayment > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Extra payment: ${swapComparison.comparison.extraPayment}</strong>
                      <br />
                      {swapComparison.comparison.paymentDirection === 'initiator_pays'
                        ? 'You will pay the difference'
                        : 'They will pay the difference'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createSwapRequest}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send Request'
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 border-2 border-stone-300 text-stone-600 py-3 rounded-xl font-semibold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapInterface;
