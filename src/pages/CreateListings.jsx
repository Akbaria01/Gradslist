import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateListings() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!price.trim()) e.price = "Price is required";
    return e;
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const newListing = {
      id: String(Date.now()),
      item: title,
      brand: category,
      seller: "You",
      price,
      condition,
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
      posted: "just now",
      distance: location,
      description,
    };

    // navigate to ListingDetail and pass listing in router state so the page can render immediately
    navigate(`/listing/${newListing.id}`, { state: { listing: newListing } });
  }

  return (
    <div className="bg-gray-100 p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Item For Sale</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Title and Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter your value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
              </div>
            </div>

            {/* Category and Condition Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter your value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="Enter your value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div className="flex justify-center">
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter your value"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="flex flex-col">
            <div className="w-full">
              <div className="bg-gray-400 rounded-lg flex flex-col items-center justify-center p-8 aspect-[4/3]">
              <div className="text-white mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  <path d="M12,11L16,15H13V19H11V15H8L12,11Z" />
                </svg>
              </div>
                <h3 className="text-white text-xl font-semibold mb-2">Add Photos</h3>
                <p className="text-white text-sm">or drag and drop</p>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="mt-6 text-white font-semibold py-3 px-16 rounded-lg transition duration-200 hover:opacity-90"
                style={{ backgroundColor: '#395A7F' }}
              >
                Submit
              </button>
            </div>
          </div>
      </form>
    </div>
  );
}
