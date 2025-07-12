import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';

const initialItems = [
  {
    itemId: '1',
    title: 'Vintage Denim Jacket',
    description: 'Classic Levi’s denim jacket with a worn-in look and sustainable sourcing.',
    category: 'Jacket',
    type: 'Unisex',
    size: 'M',
    condition: 'Excellent',
    tags: ['vintage', 'denim', 'sustainable'],
    images: [],
    status: 'Available',
    createdAt: '2025-07-12',
  }
  // Add more items as needed
];

const emptyItem = {
  itemId: '',
  title: '',
  description: '',
  category: '',
  type: '',
  size: '',
  condition: '',
  tags: [],
  images: [],
  status: 'Available',
  createdAt: '',
};

const ItemListingPage = () => {
  const [items, setItems] = useState(initialItems);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyItem);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Handle input changes for text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tag input as comma-separated
  const handleTagChange = (e) => {
    setForm((prev) => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }));
  };

  // Handle image file uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: files }));
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Handle form submit (add or update)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      ...form,
      itemId: form.itemId || Date.now().toString(),
      createdAt: form.createdAt || new Date().toISOString().split('T')[0],
      images: imagePreviews, // Use local previews for demo; replace with actual upload logic for production
    };
    if (form.itemId) {
      setItems(items.map((item, idx) => idx === selectedIdx ? newItem : item));
    } else {
      setItems([...items, newItem]);
    }
    setShowForm(false);
    setForm(emptyItem);
    setImagePreviews([]);
  };

  // Handle edit
  const handleEdit = (idx) => {
    setForm(items[idx]);
    setShowForm(true);
    setImagePreviews(items[idx].images || []);
  };

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 max-w-5xl mx-auto">
      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="relative w-full sm:w-2/3">
          <input
            type="text"
            placeholder="Search items..."
            className="w-full rounded-xl border border-stone-300 px-4 py-3 pl-10 text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
        </div>
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
          onClick={() => { setShowForm(true); setForm(emptyItem); setImagePreviews([]); }}
        >
          <Plus className="h-5 w-5" /> Add Item
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="rounded-3xl overflow-hidden shadow-lg bg-white mb-4">
            <img
              src={items[selectedIdx]?.images[selectedImageIdx] || ''}
              alt={items[selectedIdx]?.title}
              className="w-full object-cover aspect-square"
            />
          </div>
          <div className="flex space-x-3 overflow-x-auto">
            {(items[selectedIdx]?.images || []).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIdx(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-4 transition ${
                  idx === selectedImageIdx
                    ? 'border-orange-600'
                    : 'border-transparent hover:border-stone-300'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">{items[selectedIdx]?.title}</h2>
            <p className="text-stone-600 mb-4">{items[selectedIdx]?.description}</p>
            <table className="w-full text-sm mb-4">
              <tbody>
                <tr>
                  <td className="font-semibold text-stone-700">Category:</td>
                  <td>{items[selectedIdx]?.category}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-stone-700">Type:</td>
                  <td>{items[selectedIdx]?.type}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-stone-700">Size:</td>
                  <td>{items[selectedIdx]?.size}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-stone-700">Condition:</td>
                  <td>{items[selectedIdx]?.condition}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-stone-700">Tags:</td>
                  <td>{(items[selectedIdx]?.tags || []).join(', ')}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-stone-700">Status:</td>
                  <td>{items[selectedIdx]?.status}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-stone-700">Created At:</td>
                  <td>{items[selectedIdx]?.createdAt}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            className="mt-4 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition"
            onClick={() => handleEdit(selectedIdx)}
          >
            Edit Item
          </button>
        </div>
      </div>

      {/* Item Thumbnails */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {items.map((item, idx) => (
          <button
            key={item.itemId}
            onClick={() => { setSelectedIdx(idx); setSelectedImageIdx(0); }}
            className={`group relative rounded-xl overflow-hidden shadow-md bg-white transition hover:scale-105 ${
              idx === selectedIdx ? 'ring-4 ring-orange-400' : ''
            }`}
            aria-label={`Select ${item.title}`}
          >
            <img src={item.images[0] || ''} alt={item.title} className="w-full h-24 object-cover" />
            <div className="p-2">
              <h3 className="text-xs font-semibold text-stone-800 truncate">{item.title}</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{item.condition}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Add/Edit Item Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleFormSubmit}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative"
          >
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">{form.itemId ? 'Edit Item' : 'Add New Item'}</h2>
            <div className="grid grid-cols-1 gap-4">
              <input name="title" value={form.title} onChange={handleInputChange} placeholder="Title" required className="border rounded-lg px-3 py-2" />
              <textarea name="description" value={form.description} onChange={handleInputChange} placeholder="Description" required className="border rounded-lg px-3 py-2" />
              <input name="category" value={form.category} onChange={handleInputChange} placeholder="Category" className="border rounded-lg px-3 py-2" />
              <input name="type" value={form.type} onChange={handleInputChange} placeholder="Type" className="border rounded-lg px-3 py-2" />
              <input name="size" value={form.size} onChange={handleInputChange} placeholder="Size" className="border rounded-lg px-3 py-2" />
              <input name="condition" value={form.condition} onChange={handleInputChange} placeholder="Condition" className="border rounded-lg px-3 py-2" />
              <input name="tags" value={form.tags.join(', ')} onChange={handleTagChange} placeholder="Tags (comma separated)" className="border rounded-lg px-3 py-2" />
              <div>
                <label className="block font-semibold mb-1">Upload Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="border rounded-lg px-3 py-2 w-full"
                />
                <div className="flex mt-2 space-x-2">
                  {imagePreviews.map((src, idx) => (
                    <img key={idx} src={src} alt="Preview" className="w-12 h-12 rounded object-cover" />
                  ))}
                </div>
              </div>
              <select name="status" value={form.status} onChange={handleInputChange} className="border rounded-lg px-3 py-2">
                <option value="Available">Available</option>
                <option value="Swapped">Swapped</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
            >
              {form.itemId ? 'Update Item' : 'Add Item'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ItemListingPage;
