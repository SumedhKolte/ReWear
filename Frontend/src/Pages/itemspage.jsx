import React, { useRef, useState } from "react";
import { Heart, RefreshCw, Eye, X } from "lucide-react";
import { fetchImageAsBlob, runVirtualTryOn } from "../services/idmVtonService";

const products = [
  {
    id: 1,
    title: "Vintage Denim Jacket",
    price: 45,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    title: "Eco Cotton Dress",
    price: 35,
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    title: "Retro Corduroy Pants",
    price: 28,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    title: "Sustainable Hoodie",
    price: 40,
    image: "https://images.pexels.com/photos/532221/pexels-photo-532221.jpeg?auto=compress&w=400&h=500&fit=crop",
  },
];

const AllClothesPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [resultImages, setResultImages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const personImageInput = useRef();

  const handleSwap = (title) => {
    alert(`Swap request initiated for: ${title}`);
  };

  const handleTryOn = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
    setResultImages(null);
    setError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setResultImages(null);
    setError("");
    if (personImageInput.current) personImageInput.current.value = "";
  };

  const handleSubmitTryOn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResultImages(null);
    setError("");

    try {
      const personFile = personImageInput.current.files[0];
      if (!personFile) {
        setError("Please upload your photo.");
        setLoading(false);
        return;
      }
      // Fetch garment image as Blob
      const garmentBlob = await fetchImageAsBlob(selectedProduct.image);

      // Call Gradio API
      const result = await runVirtualTryOn(personFile, garmentBlob);

      setResultImages({
        output: result[0], // Final try-on image
        masked: result[1], // Masked image
      });
    } catch (err) {
      setError("Virtual try-on failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-3 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-stone-800 mb-8 text-center">All Clothes</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col group">
            <div className="relative">
              <img src={product.image} alt={product.title} className="w-full h-60 object-cover" />
              <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow hover:bg-orange-50 transition">
                <Heart className="h-5 w-5 text-orange-600" />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h2 className="text-lg font-semibold text-stone-800 mb-2">{product.title}</h2>
              <div className="flex items-center mb-4">
                <span className="text-xl font-bold text-orange-600">${product.price}</span>
              </div>
              <div className="mt-auto flex gap-2">
                <button
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-600 transition flex items-center justify-center gap-2"
                  onClick={() => handleSwap(product.title)}
                >
                  <RefreshCw className="h-4 w-4" /> Swap
                </button>
                <button
                  className="flex-1 border-2 border-orange-600 text-orange-600 py-2 rounded-lg font-semibold hover:bg-orange-50 transition flex items-center justify-center gap-2"
                  onClick={() => handleTryOn(product)}
                >
                  <Eye className="h-4 w-4" /> Try On
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Try On */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button onClick={handleCloseModal} className="absolute top-3 right-3 text-stone-400 hover:text-stone-600">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Try On: {selectedProduct.title}</h2>
            <form onSubmit={handleSubmitTryOn}>
              <div className="mb-4 flex flex-col items-center">
                <label className="mb-2 font-medium">Upload Your Photo:</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={personImageInput}
                  className="border rounded px-3 py-2"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-2 rounded font-semibold hover:bg-orange-700 transition"
                disabled={loading}
              >
                {loading ? "Processing..." : "Generate Try-On"}
              </button>
            </form>
            {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
            {resultImages && (
              <div className="mt-6 flex flex-col items-center">
                <div>
                  <span className="font-semibold">Result:</span>
                  <img src={resultImages.output} alt="Try-on result" className="mt-2 rounded shadow max-w-xs" />
                </div>
                <div className="mt-4">
                  <span className="font-semibold">Masked Image:</span>
                  <img src={resultImages.masked} alt="Masked" className="mt-2 rounded shadow max-w-xs" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllClothesPage;
