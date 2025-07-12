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
} from "lucide-react";

const users = [
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
  // More users...
];

const listings = [
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
  // More listings...
];

const orders = [
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
  // More orders...
];

const tabs = [
  { name: "Manage Users", icon: <UserIcon className="h-5 w-5" /> },
  { name: "Manage Listings", icon: <List className="h-5 w-5" /> },
  { name: "Manage Orders", icon: <ShoppingBag className="h-5 w-5" /> },
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("Manage Users");
  const [search, setSearch] = useState("");

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
              .map(user => (
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
                    <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center gap-1">
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                  </div>
                </div>
              ))}
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
              .map(listing => (
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
                    <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center gap-1">
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
              .map(order => (
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
                    <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Mark Complete
                    </button>
                    <button className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" /> Update
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
