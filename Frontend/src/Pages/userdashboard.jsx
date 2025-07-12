import React, { useState, useRef } from "react";
import {
  Edit,
  Plus,
  Heart,
  ShoppingBag,
  Star,
  LogOut,
  ChevronRight,
  Image as ImageIcon,
  BadgeCheck,
  Trash,
  X,
} from "lucide-react";

const initialUser = {
  name: "Jane Doe",
  avatar: "/api/placeholder/120/120",
  email: "jane.doe@email.com",
  memberSince: "2023-04-15",
  stats: {
    listings: 2,
    purchases: 1,
    favorites: 12,
    rating: 4.9,
  },
};

const initialListings = [
  {
    id: 1,
    title: "Vintage Denim Jacket",
    description: "Classic Levi’s denim jacket with a worn-in look and sustainable sourcing.",
    category: "Jacket",
    type: "Unisex",
    size: "M",
    condition: "Excellent",
    tags: ["vintage", "denim", "sustainable"],
    image: "/api/placeholder/300/400",
    status: "Active",
    views: 102,
    created: "2025-06-01",
    price: 45,
  },
  {
    id: 2,
    title: "Eco Cotton Dress",
    description: "Soft, eco-friendly cotton dress for summer.",
    category: "Dress",
    type: "Women",
    size: "S",
    condition: "Like New",
    tags: ["eco", "cotton", "summer"],
    image: "/api/placeholder/300/400?2",
    status: "Active",
    views: 87,
    created: "2025-06-10",
    price: 35,
  },
];

const initialPurchases = [
  {
    id: 1,
    name: "Designer Silk Blouse",
    image: "/api/placeholder/300/400?3",
    price: 65,
    status: "Delivered",
    date: "2025-06-20",
  },
];

const emptyListing = {
  title: "",
  description: "",
  category: "",
  type: "",
  size: "",
  condition: "",
  tags: [],
  image: null,
  status: "Active",
  price: "",
};

const Dashboard = () => {
  const [user, setUser] = useState(initialUser);
  const [listings, setListings] = useState(initialListings);
  const [purchases] = useState(initialPurchases);
  const [tab, setTab] = useState("listings");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState(user);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm, setListingForm] = useState(emptyListing);
  const [editIndex, setEditIndex] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef();
  const listingImageInputRef = useRef();

  // Profile Edit Handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };
  const handleProfileAvatar = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileForm({ ...profileForm, avatar: url });
    }
  };
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setUser(profileForm);
    setShowProfileEdit(false);
  };

  // Listing Handlers
  const handleListingChange = (e) => {
    const { name, value } = e.target;
    setListingForm({ ...listingForm, [name]: value });
  };
  const handleListingImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setListingForm({ ...listingForm, image: url });
    }
  };
  const handleListingTags = (e) => {
    setListingForm({ ...listingForm, tags: e.target.value.split(",").map((t) => t.trim()) });
  };
  const handleListingSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      const updated = [...listings];
      updated[editIndex] = {
        ...updated[editIndex],
        ...listingForm,
        price: Number(listingForm.price),
      };
      setListings(updated);
    } else {
      setListings([
        ...listings,
        {
          id: Date.now(),
          ...listingForm,
          views: 0,
          created: new Date().toISOString().split("T")[0],
          price: Number(listingForm.price),
        },
      ]);
    }
    setShowListingForm(false);
    setListingForm(emptyListing);
    setEditIndex(null);
  };
  const handleEditListing = (idx) => {
    setListingForm(listings[idx]);
    setEditIndex(idx);
    setShowListingForm(true);
  };
  const handleDeleteListing = (idx) => {
    setListings(listings.filter((_, i) => i !== idx));
  };

  // Logout
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    // Add actual logout logic here
    alert("You have been logged out.");
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-2 sm:px-6 lg:px-8">
      {/* Profile Card */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 mb-10">
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center md:w-1/3">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-orange-500 shadow"
            />
            <button
              className="absolute bottom-2 right-2 bg-orange-100 text-orange-600 p-2 rounded-full shadow hover:bg-orange-200 transition"
              aria-label="Edit Profile Picture"
              onClick={() => fileInputRef.current.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleProfileAvatar}
            />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-stone-800">{user.name}</h2>
          <div className="text-stone-500 text-sm">{user.email}</div>
          <div className="flex items-center gap-2 mt-2 text-green-600">
            <BadgeCheck className="h-4 w-4" /> Member since {user.memberSince}
          </div>
          <button
            className="mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
            onClick={() => {
              setProfileForm(user);
              setShowProfileEdit(true);
            }}
          >
            <Edit className="inline h-4 w-4 mr-2" /> Edit Profile
          </button>
          <button
            className="mt-3 text-orange-600 hover:underline flex items-center gap-1"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Stats & Quick Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-orange-100 rounded-xl p-5 flex flex-col items-center">
              <Plus className="h-6 w-6 text-orange-600 mb-1" />
              <span className="text-2xl font-bold text-orange-600">{listings.length}</span>
              <span className="text-stone-600 text-sm">Listings</span>
            </div>
            <div className="bg-green-100 rounded-xl p-5 flex flex-col items-center">
              <ShoppingBag className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-2xl font-bold text-green-600">{purchases.length}</span>
              <span className="text-stone-600 text-sm">Purchases</span>
            </div>
            <div className="bg-pink-100 rounded-xl p-5 flex flex-col items-center">
              <Heart className="h-6 w-6 text-pink-600 mb-1" />
              <span className="text-2xl font-bold text-pink-600">{user.stats.favorites}</span>
              <span className="text-stone-600 text-sm">Favorites</span>
            </div>
            <div className="bg-yellow-100 rounded-xl p-5 flex flex-col items-center">
              <Star className="h-6 w-6 text-yellow-500 mb-1" />
              <span className="text-2xl font-bold text-yellow-500">{user.stats.rating}</span>
              <span className="text-stone-600 text-sm">Rating</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition"
              onClick={() => {
                setShowListingForm(true);
                setListingForm(emptyListing);
                setEditIndex(null);
              }}
            >
              <Plus className="inline h-4 w-4 mr-2" /> Add New Listing
            </button>
            <button className="flex-1 border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition">
              View Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex gap-4 border-b border-stone-200">
          <button
            className={`py-2 px-4 font-semibold transition ${
              tab === "listings"
                ? "border-b-4 border-orange-600 text-orange-600"
                : "text-stone-600 hover:text-orange-600"
            }`}
            onClick={() => setTab("listings")}
          >
            My Listings
          </button>
          <button
            className={`py-2 px-4 font-semibold transition ${
              tab === "purchases"
                ? "border-b-4 border-green-600 text-green-600"
                : "text-stone-600 hover:text-green-600"
            }`}
            onClick={() => setTab("purchases")}
          >
            My Purchases
          </button>
        </div>
      </div>

      {/* Listings & Purchases */}
      <div className="max-w-5xl mx-auto">
        {tab === "listings" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {listings.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition group relative"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-56 object-cover rounded-t-2xl"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-stone-800">{item.title}</h3>
                  <div className="text-stone-500 text-xs mb-2">{item.category} • {item.type} • {item.size}</div>
                  <div className="flex items-center flex-wrap gap-1 mb-2">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-orange-600 font-bold">${item.price}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-stone-400">
                    <span>{item.views} views</span>
                    <span>Added {item.created}</span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      className="bg-orange-100 text-orange-600 p-2 rounded-full shadow hover:bg-orange-200 transition"
                      onClick={() => handleEditListing(idx)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="bg-red-100 text-red-600 p-2 rounded-full shadow hover:bg-red-200 transition"
                      onClick={() => handleDeleteListing(idx)}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {purchases.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition group relative"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-56 object-cover rounded-t-2xl"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-stone-800">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-orange-600 font-bold">${item.price}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-stone-400">
                    <span>Purchased {item.date}</span>
                  </div>
                  <button className="absolute top-3 right-3 bg-green-100 text-green-600 p-2 rounded-full shadow hover:bg-green-200 transition">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <div className="grid grid-cols-1 gap-4">
              <input
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Name"
                required
                className="border rounded-lg px-3 py-2"
              />
              <input
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="Email"
                required
                className="border rounded-lg px-3 py-2"
              />
              <div>
                <label className="block font-semibold mb-1">Change Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileAvatar}
                  className="border rounded-lg px-3 py-2 w-full"
                />
                {profileForm.avatar && (
                  <img
                    src={profileForm.avatar}
                    alt="Avatar Preview"
                    className="w-16 h-16 rounded-full mt-2 object-cover"
                  />
                )}
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Listing Add/Edit Modal */}
      {showListingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleListingSubmit}
            className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative"
          >
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowListingForm(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">{editIndex !== null ? "Edit Listing" : "Add New Listing"}</h2>
            <div className="grid grid-cols-1 gap-4">
              <input
                name="title"
                value={listingForm.title}
                onChange={handleListingChange}
                placeholder="Title"
                required
                className="border rounded-lg px-3 py-2"
              />
              <textarea
                name="description"
                value={listingForm.description}
                onChange={handleListingChange}
                placeholder="Description"
                required
                className="border rounded-lg px-3 py-2"
              />
              <input
                name="category"
                value={listingForm.category}
                onChange={handleListingChange}
                placeholder="Category"
                className="border rounded-lg px-3 py-2"
              />
              <input
                name="type"
                value={listingForm.type}
                onChange={handleListingChange}
                placeholder="Type"
                className="border rounded-lg px-3 py-2"
              />
              <input
                name="size"
                value={listingForm.size}
                onChange={handleListingChange}
                placeholder="Size"
                className="border rounded-lg px-3 py-2"
              />
              <input
                name="condition"
                value={listingForm.condition}
                onChange={handleListingChange}
                placeholder="Condition"
                className="border rounded-lg px-3 py-2"
              />
              <input
                name="tags"
                value={listingForm.tags.join(", ")}
                onChange={handleListingTags}
                placeholder="Tags (comma separated)"
                className="border rounded-lg px-3 py-2"
              />
              <div>
                <label className="block font-semibold mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={listingImageInputRef}
                  onChange={handleListingImage}
                  className="border rounded-lg px-3 py-2 w-full"
                />
                {listingForm.image && (
                  <img
                    src={listingForm.image}
                    alt="Preview"
                    className="w-20 h-20 rounded-xl mt-2 object-cover"
                  />
                )}
              </div>
              <select
                name="status"
                value={listingForm.status}
                onChange={handleListingChange}
                className="border rounded-lg px-3 py-2"
              >
                <option value="Active">Active</option>
                <option value="Swapped">Swapped</option>
                <option value="Pending">Pending</option>
              </select>
              <input
                name="price"
                value={listingForm.price}
                onChange={handleListingChange}
                placeholder="Price"
                type="number"
                min="0"
                required
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
            >
              {editIndex !== null ? "Update Listing" : "Add Listing"}
            </button>
          </form>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
              onClick={() => setShowLogoutConfirm(false)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
            <p className="mb-6 text-stone-700">Are you sure you want to log out of your account?</p>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 transition"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
              <button
                className="flex-1 border border-orange-600 text-orange-600 py-3 rounded-xl font-semibold hover:bg-orange-50 transition"
                onClick={() => setShowLogoutConfirm(false)}
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
