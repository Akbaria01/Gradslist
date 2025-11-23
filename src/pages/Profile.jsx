import { useState } from "react";

export default function Profile() {
  const [rating, setRating] = useState(4.0);
  const [hoverRating, setHoverRating] = useState(0);

  const user = {
    name: "Jane Doe",
    profilePic: "", 
    ratingCount: 10,
  };

  const listings = [
    { id: 1, name: "Gaming Laptop", price: "$850", condition: "Like New", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400" },
    { id: 2, name: "Mountain Bike", price: "$320", condition: "Good", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400" },
    { id: 3, name: "Acoustic Guitar", price: "$180", condition: "Excellent", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400" },
  ];

  const savedItems = [
    { id: 4, name: "Wireless Headphones", price: "$150", condition: "Excellent", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
    { id: 5, name: "Running Shoes", price: "$65", condition: "Good", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
    { id: 6, name: "Board Game Set", price: "$25", condition: "Like New", image: "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400" },
  ];

  const reviews = [
    { id: 7, seller: "John Doe", item: "Vintage Painting", price: "$200", condition: "Like New", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400" },
    { id: 8, seller: "Alice Smith", item: "Coffee Maker", price: "$75", condition: "Good", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400" },
    { id: 9, seller: "Bob Johnson", item: "Vintage Chair", price: "$120", condition: "Like New", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400" },
  ];

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          className={`cursor-pointer text-xl ${i <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Dashboard Title + Profile + Rating */}
      <div className="flex flex-nowrap justify-center items-center gap-20 mb-10">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">User Dashboard</h1>
          <button className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>
            Create New Listing
          </button>
        </div>

        {/* Profile Box */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200" style={{ width: '260px', height: '100px' }}>
          {user.profilePic ? <img src={user.profilePic} className="w-20 h-20 rounded-full object-cover" /> : <div className="w-20 h-20 rounded-full bg-gray-200" />} 
          <div className="flex flex-col justify-center h-full justify-between">
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <button className="text-sm text-sky-600 hover:underline">View Profile</button>
          </div>
        </div>

        {/* Rating Box */}
        <div className="flex flex-col justify-center items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200" style={{ width: '260px', height: '100px' }}>
          <p className="text-lg font-semibold text-gray-700">Your Profile Rating</p>
          <div className="flex items-center mt-1">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-600">{rating} ({user.ratingCount} ratings)</span>
          </div>
        </div>
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Listings</h2>
            <button className={`text-sm ${buttonStyle} px-3 py-1 rounded`}>View All</button>
          </div>

          <div className="space-y-4">
            {listings.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50">
                <img src={item.image} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.price}</p>
                  <p className="text-sm text-gray-600">{item.condition}</p>
                  <div className="mt-2 flex gap-3">
                    <button className="text-xs text-sky-600 hover:underline">View</button>
                    <button className="text-xs text-sky-600 hover:underline">Edit</button>
                    <button className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Saved Items</h2>
            <button className={`text-sm ${buttonStyle} px-3 py-1 rounded`}>View All</button>
          </div>

          <div className="space-y-4">
            {savedItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50">
                <img src={item.image} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.price}</p>
                  <p className="text-sm text-gray-600">{item.condition}</p>
                  <div className="mt-2 flex gap-3">
                    <button className="text-xs text-sky-600 hover:underline">View</button>
                    <button className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave a Review */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Leave a Review</h2>
            <button className={`text-sm ${buttonStyle} px-3 py-1 rounded`}>View All</button>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50">
                <img src={review.image} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{review.item}</p>
                  <p className="text-sm text-gray-600">Seller: {review.seller}</p>
                  <p className="text-sm text-gray-600">{review.price}</p>
                  <p className="text-sm text-gray-600">{review.condition}</p>
                  <button className="mt-2 text-xs text-sky-600 hover:underline">Leave a Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
