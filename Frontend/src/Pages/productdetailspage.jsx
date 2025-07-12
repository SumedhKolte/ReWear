import React, { useState } from "react";
import {
  User as UserIcon,
  Heart,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  RefreshCw,
  Star,
  ShoppingBag,
} from "lucide-react";

// Sample product with Unsplash/Pexels images
const product = {
  title: "Vintage Denim Jacket",
  description:
    "Classic Levi’s denim jacket with a worn-in look and sustainable sourcing. Perfect for eco-conscious style lovers.",
  images: [
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80", // denim jacket front
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80", // denim jacket on model
    "https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&w=600&h=600&fit=crop", // close-up denim
  ],
  price: 45,
  originalPrice: 120,
  condition: "Excellent",
  size: "M",
  category: "Jacket",
  status: "Available",
  tags: ["vintage", "denim", "sustainable"],
  uploader: {
    name: "Alex Smith",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    memberSince: "2024-11-02",
    rating: 4.8,
  },
};

const previousListings = [
  {
    id: 1,
    title: "Eco Cotton Dress",
    image:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
    price: 35,
    status: "Swapped",
  },
  {
    id: 2,
    title: "Retro Corduroy Pants",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
    price: 28,
    status: "Available",
  },
  {
    id: 3,
    title: "Sustainable Hoodie",
    image:
      "https://images.pexels.com/photos/532221/pexels-photo-532221.jpeg?auto=compress&w=400&h=500&fit=crop",
    price: 40,
    status: "Pending",
  },
];

const ProductDetailPage = () => {
  const [selectedImg, setSelectedImg] = useState(0);

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image Gallery */}
        <div>
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col items-center">
            <div className="relative w-full">
              <img
                src={product.images[selectedImg]}
                alt={product.title}
                className="w-full aspect-square object-cover"
              />
              <button
                className="absolute top-1/2 left-3 -translate-y-1/2 bg-orange-100 text-orange-600 p-2 rounded-full shadow hover:bg-orange-200 transition"
                onClick={() =>
                  setSelectedImg((prev) =>
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )
                }
                aria-label="Previous image"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                className="absolute top-1/2 right-3 -translate-y-1/2 bg-orange-100 text-orange-600 p-2 rounded-full shadow hover:bg-orange-200 transition"
                onClick={() =>
                  setSelectedImg((prev) =>
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )
                }
                aria-label="Next image"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-4 mb-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-4 transition ${
                    idx === selectedImg
                      ? "border-orange-600"
                      : "border-transparent hover:border-stone-300"
                  }`}
                  onClick={() => setSelectedImg(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 mb-2">{product.title}</h1>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600 font-bold text-xl">${product.price}</span>
              <span className="text-sm text-stone-400 line-through">${product.originalPrice}</span>
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
                {product.condition}
              </span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full ml-2">
                {product.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
              <span>{product.category}</span>
              <span>•</span>
              <span>Size: {product.size}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {product.tags.map((tag) => (
                <span key={tag} className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-stone-700 mb-4">{product.description}</p>
            <div className="flex gap-4 mb-4">
              <button className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600 transition flex items-center gap-2">
                <RefreshCw className="h-5 w-5" /> Swap Request
              </button>
              <button className="border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" /> Redeem via Points
              </button>
              <button className="bg-white border border-stone-300 text-stone-600 p-3 rounded-full hover:bg-orange-50 transition">
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Uploader Info */}
          <div className="flex items-center gap-4 bg-stone-100 rounded-xl p-4">
            <img
              src={product.uploader.avatar}
              alt={product.uploader.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-orange-400"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">{product.uploader.name}</span>
                <BadgeCheck className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-xs text-stone-500">
                Member since {product.uploader.memberSince}
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Star className="h-4 w-4" />
                <span>{product.uploader.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Listings */}
      <div className="max-w-5xl mx-auto mt-12">
        <h3 className="text-lg font-bold text-stone-800 mb-4">Previous Listings by {product.uploader.name}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {previousListings.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden group">
              <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
              <div className="p-3">
                <h4 className="text-sm font-semibold text-stone-800 truncate">{item.title}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-orange-600 font-bold text-xs">${item.price}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    item.status === "Available"
                      ? "bg-green-100 text-green-700"
                      : item.status === "Swapped"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
