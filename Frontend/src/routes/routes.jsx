import React, { useState } from "react";
import {
  User as UserIcon,
  List,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  Search,
  Shield,
  RefreshCw,
  X,
} from "lucide-react";

const initialUsers = [
  {
    id: 1,
    name: "Jane Doe",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    email: "jane.doe@email.com",
    status: "Active",
    joined: "2024-03-15",
    listings: 4,
    flagged: false,
  },
  {
    id: 2,
    name: "Alex Smith",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    email: "alex.smith@email.com",
    status: "Flagged",
    joined: "2023-12-21",
    listings: 2,
    flagged: true,
  },
];

const initialListings = [
  {
    id: 1,
    title: "Vintage Denim Jacket",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80",
    user: "Jane Doe",
    status: "Pending",
    date: "2025-07-10",
  },
  {
    id: 2,
    title: "Eco Cotton Dress",
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    user: "Alex Smith",
    status: "Approved",
    date: "2025-07-08",
  },
];

const initialOrders = [
  {
    id: 1,
    buyer: "Priya Patel",
    item: "Retro Corduroy Pants",
    status: "Completed",
    date: "2025-07-09",
  },
  {
    id: 2,
    buyer: "Jane Doe",
    item: "Eco Cotton Dress",
    status: "Pending",
    date: "2025-07-11",
  },
];

const tabs = [
  { name: "Manage Users", icon: <UserIcon className="h-5 w-5" /> },
  { name: "Manage Listings", icon: <List className="h-5 w-5" /> },
  { name: "Manage Orders", icon: <ShoppingBag className="h-5 w-5" /> },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("Manage Users");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [orders, setOrders] = useState(initialOrders);

  // User editing
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [userEditForm, setUserEditForm] = useState({});
  const [userEditIdx, setUserEditIdx] = useState(null);

  // Listing editing (optional: can add similar modal if needed)
  // Order updating
  const [showOrderUpdate, setShowOrderUpdate] = useState(false);
  const [orderUpdateForm, setOrderUpdateForm] = useState({});
  const [orderUpdateIdx, setOrderUpdateIdx] = useState(null);

  // User actions
  const handleUserApprove = idx => {
    const updated = [...users];
    updated[idx].status = "Active";
    updated[idx].flagged = false;
    setUsers(updated);
  };
  const handleUserReject = idx => {
    const updated = [...users];
    updated[idx].status = "Flagged";
    updated[idx].flagged = true;
    setUsers(updated);
  };
  const handleUserEdit = idx => {
    setUserEditForm(users[idx]);
    setUserEditIdx(idx);
    setShowUserEdit(true);
  };
  const handleUserEditChange = e => {
    const { name, value } = e.target;
    setUserEditForm({ ...userEditForm, [name]: value });
  };
  const handleUserEditSubmit = e => {
    e.preventDefault();
    const updated = [...users];
    updated[userEditIdx] = userEditForm;
    setUsers(updated);
    setShowUserEdit(false);
  };

  // Listing actions
  const handleListingApprove = idx => {
    const updated = [...listings];
    updated[idx].status = "Approved";
    setListings(updated);
  };
  const handleListingReject = idx => {
    const updated = [...listings];
    updated[idx].status = "Rejected";
    setListings(updated);
  };
  const handleListingRemove = idx => {
    setListings(listings.filter((_, i) => i !== idx));
  };

  // Order actions
  const handleOrderComplete = idx => {
    const updated = [...orders];
    updated[idx].status = "Completed";
    setOrders(updated);
  };
  const handleOrderUpdate = idx => {
    setOrderUpdateForm(orders[idx]);
    setOrderUpdateIdx(idx);
    setShowOrderUpdate(true);
  };
  const handleOrderUpdateChange = e => {
    const { name, value } = e.target;
    setOrderUpdateForm({ ...orderUpdateForm, [name]: value });
  };
  const handleOrderUpdateSubmit = e => {
    e.preventDefault();
    const updated = [...orders];
    updated[orderUpdateIdx] = orderUpdateForm;
    setOrders(updated);
    setShowOrderUpdate(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-2 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-orange-600" />
          <span className="text-2xl font-bold text-stone-800">ReWear Admin Panel</span>
        </div>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search users, listings, orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-stone-400" />
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-8 flex gap-4">
        {tabs.map(tab => (
          <button
            key={tab.name}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === tab.name
                ? "bg-orange-600 text-white shadow"
                : "bg-white text-stone-700 hover:bg-orange-50"
            }`}
            onClick={() => setActiveTab(tab.name)}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto">
        {/* Manage Users */}
        {activeTab === "Manage Users" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users
              .filter(u =>
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
              )
              .map((user, idx) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl shadow p-6 flex items-center gap-6 hover:shadow-lg transition"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-400"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-stone-800">{user.name}</h3>
                    <div className="text-stone-500 text-sm">{user.email}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {user.status}
                      </span>
                      <span>Joined: {user.joined}</span>
                      <span>Listings: {user.listings}</span>
                      {user.flagged && (
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full">Flagged</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-1"
                      onClick={() => handleUserApprove(idx)}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition flex items-center gap-1"
                      onClick={() => handleUserReject(idx)}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button
                      className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center gap-1"
                      onClick={() => handleUserEdit(idx)}
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* User Edit Modal */}
        {showUserEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              onSubmit={handleUserEditSubmit}
              className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative"
            >
              <button
                type="button"
                className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
                onClick={() => setShowUserEdit(false)}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  name="name"
                  value={userEditForm.name}
                  onChange={handleUserEditChange}
                  placeholder="Name"
                  required
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  name="email"
                  value={userEditForm.email}
                  onChange={handleUserEditChange}
                  placeholder="Email"
                  required
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  name="joined"
                  value={userEditForm.joined}
                  onChange={handleUserEditChange}
                  placeholder="Joined Date"
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  name="listings"
                  value={userEditForm.listings}
                  onChange={handleUserEditChange}
                  placeholder="Listings"
                  type="number"
                  className="border rounded-lg px-3 py-2"
                />
                <select
                  name="status"
                  value={userEditForm.status}
                  onChange={handleUserEditChange}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Flagged">Flagged</option>
                </select>
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

        {/* Manage Listings */}
        {activeTab === "Manage Listings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listings
              .filter(l =>
                l.title.toLowerCase().includes(search.toLowerCase()) ||
                l.user.toLowerCase().includes(search.toLowerCase())
              )
              .map((listing, idx) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl shadow p-6 flex items-center gap-6 hover:shadow-lg transition"
                >
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-orange-400"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-stone-800">{listing.title}</h3>
                    <div className="text-stone-500 text-sm">By {listing.user}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className={`px-2 py-1 rounded-full font-semibold ${
                        listing.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : listing.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {listing.status}
                      </span>
                      <span>Date: {listing.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-1"
                      onClick={() => handleListingApprove(idx)}
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition flex items-center gap-1"
                      onClick={() => handleListingReject(idx)}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button
                      className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center gap-1"
                      onClick={() => handleListingRemove(idx)}
                    >
                      <Trash className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Manage Orders */}
        {activeTab === "Manage Orders" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders
              .filter(o =>
                o.buyer.toLowerCase().includes(search.toLowerCase()) ||
                o.item.toLowerCase().includes(search.toLowerCase())
              )
              .map((order, idx) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow p-6 flex items-center gap-6 hover:shadow-lg transition"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-stone-800">{order.item}</h3>
                    <div className="text-stone-500 text-sm">Buyer: {order.buyer}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className={`px-2 py-1 rounded-full font-semibold ${
                        order.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.status}
                      </span>
                      <span>Date: {order.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-1"
                      onClick={() => handleOrderComplete(idx)}
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Complete
                    </button>
                    <button
                      className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center gap-1"
                      onClick={() => handleOrderUpdate(idx)}
                    >
                      <RefreshCw className="h-4 w-4" /> Update
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Order Update Modal */}
        {showOrderUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              onSubmit={handleOrderUpdateSubmit}
              className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative"
            >
              <button
                type="button"
                className="absolute top-3 right-3 text-stone-400 hover:text-red-500"
                onClick={() => setShowOrderUpdate(false)}
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-bold mb-4">Update Order</h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  name="item"
                  value={orderUpdateForm.item}
                  onChange={handleOrderUpdateChange}
                  placeholder="Item"
                  required
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  name="buyer"
                  value={orderUpdateForm.buyer}
                  onChange={handleOrderUpdateChange}
                  placeholder="Buyer"
                  required
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  name="date"
                  value={orderUpdateForm.date}
                  onChange={handleOrderUpdateChange}
                  placeholder="Date"
                  className="border rounded-lg px-3 py-2"
                />
                <select
                  name="status"
                  value={orderUpdateForm.status}
                  onChange={handleOrderUpdateChange}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
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
      </div>
    </div>
  );
};

export default AdminPanel;
