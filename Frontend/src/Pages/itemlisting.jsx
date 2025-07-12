import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, X, Edit, Trash, Calculator, DollarSign, 
  Calendar, TrendingUp, ArrowRightLeft, Eye, Heart,
  AlertCircle, CheckCircle, Loader
} from 'lucide-react';

const ItemListingPage = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [swapComparison, setSwapComparison] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    type: '',
    size: '',
    condition: '',
    tags: [],
    originalPrice: '',
    purchaseDate: '',
    finalPrice: '',
    status: 'Active'
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [priceCalculating, setPriceCalculating] = useState(false);
  const fileInputRef = useRef();

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

  // API helper function
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

  // Load items on component mount
  useEffect(() => {
    loadItems();
    loadAvailableItems();
  }, []);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await apiCall('/listings');
      setItems(result.data);
      setFilteredItems(result.data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const result = await apiCall('/listings/available');
      setAvailableItems(result.data);
    } catch (error) {
      console.error('Error loading available items:', error);
    }
  };

  // Calculate price when form data changes
  const calculatePrice = async (formData) => {
    if (!formData.originalPrice || !formData.purchaseDate || !formData.condition || !formData.category) {
      return;
    }

    setPriceCalculating(true);
    try {
      const result = await apiCall('/listings/calculate-price', {
        method: 'POST',
        body: JSON.stringify({
          category: formData.category,
          brand: formData.brand,
          originalPrice: formData.originalPrice,
          purchaseDate: formData.purchaseDate,
          condition: formData.condition
        })
      });

      setForm(prev => ({
        ...prev,
        finalPrice: result.data.calculatedPrice,
        priceFactors: result.data.priceFactors
      }));
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setPriceCalculating(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);

    // Auto-calculate price when key fields change
    if (['originalPrice', 'purchaseDate', 'condition', 'category', 'brand'].includes(name)) {
      calculatePrice(updatedForm);
    }
  };

  // Handle tag input
  const handleTagChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setForm(prev => ({ ...prev, tags }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({ ...prev, images: files }));
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'tags') {
          formData.append(key, JSON.stringify(form[key]));
        } else if (key === 'images') {
          // Skip images key, handle files separately
        } else {
          formData.append(key, form[key]);
        }
      });

      // Add image files
      if (fileInputRef.current?.files) {
        Array.from(fileInputRef.current.files).forEach((file, index) => {
          formData.append(`image`, file);
        });
      }

      const endpoint = editingIndex !== null ? `/listings/${items[editingIndex].id}` : '/listings';
      const method = editingIndex !== null ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        headers: {}, // Remove Content-Type to let browser set it for FormData
        body: formData
      });

      setShowForm(false);
      resetForm();
      loadItems();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: '',
      subcategory: '',
      brand: '',
      type: '',
      size: '',
      condition: '',
      tags: [],
      originalPrice: '',
      purchaseDate: '',
      finalPrice: '',
      status: 'Active'
    });
    setImagePreviews([]);
    setEditingIndex(null);
  };

  // Handle edit
  const handleEdit = (idx) => {
    const item = filteredItems[idx];
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory || '',
      brand: item.brand || '',
      type: item.type,
      size: item.size,
      condition: item.condition,
      tags: item.tags || [],
      originalPrice: item.original_price || '',
      purchaseDate: item.purchase_date || '',
      finalPrice: item.final_price || '',
      status: item.status
    });
    setImagePreviews(item.image_url ? [item.image_url] : []);
    setEditingIndex(idx);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (idx) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await apiCall(`/listings/${filteredItems[idx].id}`, { method: 'DELETE' });
        loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  // Handle swap request
  const handleSwapRequest = async (targetItemId) => {
    try {
      const userItemId = filteredItems[selectedIdx].id;
      const comparison = await apiCall('/swaps/calculate', {
        method: 'POST',
        body: JSON.stringify({
          initiatorListingId: userItemId,
          receiverListingId: targetItemId
        })
      });
      setSwapComparison(comparison.data);
      setShowSwapModal(true);
    } catch (error) {
      console.error('Error calculating swap:', error);
    }
  };

  // Confirm swap
  const confirmSwap = async () => {
    try {
      await apiCall('/swaps', {
        method: 'POST',
        body: JSON.stringify({
          initiatorListingId: filteredItems[selectedIdx].id,
          receiverListingId: swapComparison.receiverListing.id,
          message: 'Swap request from item listing page'
        })
      });
      setShowSwapModal(false);
      setSwapComparison(null);
      alert('Swap request sent successfully!');
    } catch (error) {
      console.error('Error creating swap:', error);
    }
  };

  const currentItem = filteredItems[selectedIdx];

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="relative w-full sm:w-2/3">
          <input
            type="text"
            placeholder="Search items by title, category, brand, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 pl-10 text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
        </div>
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
          onClick={() => { setShowForm(true); resetForm(); }}
        >
          <Plus className="h-5 w-5" /> Add Item
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-stone-500 text-lg">No items found</p>
        </div>
      )}

      {filteredItems.length > 0 && (
        <>
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Product Images */}
            <div>
              <div className="rounded-3xl overflow-hidden shadow-lg bg-white mb-4 aspect-square">
                {currentItem?.image_url ? (
                  <img
                    src={currentItem.image_url}
                    alt={currentItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100">
                    <span className="text-stone-400">No image available</span>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(selectedIdx)}
                  className="flex-1 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedIdx)}
                  className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition flex items-center justify-center gap-2"
                >
                  <Trash className="h-4 w-4" /> Delete
                </button>
                <button
                  onClick={() => setShowSwapModal(true)}
                  className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" /> Swap
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-stone-800">{currentItem?.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentItem?.status === 'Active' ? 'bg-green-100 text-green-700' :
                  currentItem?.status === 'Swapped' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {currentItem?.status}
                </span>
              </div>
              
              <p className="text-stone-600 mb-6">{currentItem?.description}</p>
              
              {/* Price Information */}
              {currentItem?.final_price && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Pricing Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-stone-600">Current Price:</span>
                      <div className="text-xl font-bold text-green-600">${currentItem.final_price}</div>
                    </div>
                    {currentItem.original_price && (
                      <div>
                        <span className="text-stone-600">Original Price:</span>
                        <div className="text-lg text-stone-800">${currentItem.original_price}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Item Details Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-stone-700">Category:</span>
                    <p className="text-stone-600">{currentItem?.category}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">Brand:</span>
                    <p className="text-stone-600">{currentItem?.brand || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">Type:</span>
                    <p className="text-stone-600">{currentItem?.type}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">Size:</span>
                    <p className="text-stone-600">{currentItem?.size}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">Condition:</span>
                    <p className="text-stone-600">{currentItem?.condition}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">Views:</span>
                    <p className="text-stone-600 flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {currentItem?.views || 0}
                    </p>
                  </div>
                </div>
                
                {currentItem?.tags && currentItem.tags.length > 0 && (
                  <div>
                    <span className="font-semibold text-stone-700">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentItem.tags.map((tag, idx) => (
                        <span key={idx} className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <span className="font-semibold text-stone-700">Created:</span>
                  <p className="text-stone-600">{new Date(currentItem?.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Item Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => { setSelectedIdx(idx); setSelectedImageIdx(0); }}
                className={`group relative rounded-xl overflow-hidden shadow-md bg-white transition hover:scale-105 ${
                  idx === selectedIdx ? 'ring-4 ring-orange-400' : ''
                }`}
                aria-label={`Select ${item.title}`}
              >
                <div className="aspect-square">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100">
                      <span className="text-stone-400 text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-stone-800 truncate">{item.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.condition === 'Excellent' ? 'bg-green-100 text-green-700' :
                      item.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.condition}
                    </span>
                    {item.final_price && (
                      <span className="text-xs font-bold text-orange-600">${item.final_price}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleFormSubmit}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editingIndex !== null ? 'Edit Item' : 'Add New Item'}
              <Calculator className="h-5 w-5 text-orange-600" />
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-stone-800 border-b pb-2">Basic Information</h3>
                
                <input
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Item Title"
                  required
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Description"
                  required
                  rows={3}
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
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
                    value={form.subcategory}
                    onChange={handleInputChange}
                    className="border rounded-lg px-3 py-2"
                    disabled={!form.category}
                  >
                    <option value="">Select Subcategory</option>
                    {form.category && categoryOptions
                      .find(cat => cat.value === form.category)
                      ?.subcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleInputChange}
                    placeholder="Brand"
                    className="border rounded-lg px-3 py-2"
                  />

                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
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
                    value={form.size}
                    onChange={handleInputChange}
                    placeholder="Size"
                    required
                    className="border rounded-lg px-3 py-2"
                  />

                  <select
                    name="condition"
                    value={form.condition}
                    onChange={handleInputChange}
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
                  value={form.tags.join(', ')}
                  onChange={handleTagChange}
                  placeholder="Tags (comma separated)"
                  className="border rounded-lg px-3 py-2 w-full"
                />

                <div>
                  <label className="block font-semibold mb-1">Upload Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                  <div className="flex mt-2 space-x-2">
                    {imagePreviews.map((src, idx) => (
                      <img key={idx} src={src} alt="Preview" className="w-12 h-12 rounded object-cover" />
                    ))}
                  </div>
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
                      value={form.originalPrice}
                      onChange={handleInputChange}
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
                      value={form.purchaseDate}
                      onChange={handleInputChange}
                      type="date"
                      className="border rounded-lg px-3 py-2 w-full"
                    />
                  </div>
                </div>

                {form.finalPrice > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-green-800">Calculated Price</span>
                      {priceCalculating && (
                        <Loader className="h-4 w-4 animate-spin text-green-600" />
                      )}
                    </div>
                    
                    <div className="text-2xl font-bold text-green-600 mb-3">
                      ${form.finalPrice}
                    </div>

                    {form.priceFactors && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original Price:</span>
                          <span>${form.priceFactors.basePrice}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Age Depreciation:</span>
                          <span>${form.priceFactors.ageDepreciation}</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>Condition Adjustment:</span>
                          <span>${form.priceFactors.conditionAdjustment}</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span>Brand Value:</span>
                          <span>${form.priceFactors.brandValue}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Final Listing Price</label>
                  <input
                    name="finalPrice"
                    value={form.finalPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="border rounded-lg px-3 py-2 w-full"
                  />
                </div>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className="border rounded-lg px-3 py-2 w-full"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  {editingIndex !== null ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                editingIndex !== null ? 'Update Item' : 'Create Item'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowSwapModal(false)}
            >
              <X className="h-6 w-6" />
            </button>
            
            <h3 className="text-xl font-bold mb-4">Available Items for Swap</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {availableItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-stone-50 transition">
                  <img 
                    src={item.image_url || '/api/placeholder/150/150'} 
                    alt={item.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-stone-600 mb-2">{item.category} • {item.condition}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-bold">${item.final_price}</span>
                    <button
                      onClick={() => handleSwapRequest(item.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition"
                    >
                      Request Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Swap Comparison Modal */}
      {swapComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => { setSwapComparison(null); setShowSwapModal(false); }}
            >
              <X className="h-6 w-6" />
            </button>
            
            <h3 className="text-xl font-bold mb-4">Swap Analysis</h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Your Item</h4>
                <p className="text-sm">{swapComparison.initiatorListing.title}</p>
                <div className="text-lg font-bold text-green-600">
                  ${swapComparison.initiatorListing.value}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Their Item</h4>
                <p className="text-sm">{swapComparison.receiverListing.title}</p>
                <div className="text-lg font-bold text-green-600">
                  ${swapComparison.receiverListing.value}
                </div>
              </div>
            </div>

            {swapComparison.comparison.extraPayment > 0 && (
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
                onClick={confirmSwap}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Confirm Swap Request
              </button>
              <button
                onClick={() => { setSwapComparison(null); setShowSwapModal(false); }}
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

export default ItemListingPage;
