// src/pages/Review.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Modal from "../components/Modal";

export default function Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // State for the review
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [postedReview, setPostedReview] = useState(null);
  
  // State for the listing being reviewed
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  // Get listing data from navigation state or fallback
  useEffect(() => {
    if (location.state?.listing) {
      setListing(location.state.listing);
    } else {
      // Fallback mock data if no listing passed
      setListing({
        id: "mock-123",
        title: "Vintage Painting",
        price: "$200",
        condition: "Like New",
        image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
        category: "Art",
        seller: "John Doe",
        location: "New York, NY",
        description: "A beautiful vintage painting in excellent condition.",
        postedAt: "2 days ago",
        rating: 4.5 // Added seller rating
      });
    }
    setLoading(false);
  }, [location.state]);

  // Handle star rating selection
  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!rating) {
      alert("Please select a star rating!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save review to Firebase
      const reviewData = {
        userId: currentUser?.uid,
        userName: currentUser?.displayName || "Anonymous",
        listingId: listing?.id,
        listingTitle: listing?.title,
        rating: rating,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add to Firestore
      await addDoc(collection(db, "reviews"), reviewData);
      
      // Set the posted review for display
      setPostedReview({
        name: currentUser?.displayName || "You",
        rating: rating,
        text: reviewText.trim(),
        time: "Just now"
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stars for rating selection
  const renderStars = (forSelection = true, size = "text-2xl") => {
    const stars = [];
    const value = forSelection ? rating : (postedReview?.rating || 0);
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={forSelection ? () => handleStarClick(i) : null}
          className={`${size} ${forSelection ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
            i <= value ? "text-yellow-400" : "text-gray-300"
          }`}
          disabled={!forSelection || isSubmitting}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="bg-[#eaecef] min-h-screen p-6">
        <div className="text-center py-20">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">Leave a Review</h1>
        <div className="w-24" /> {/* Placeholder to balance flex */}
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side - Narrower Listing Card */}
        <div className="lg:col-span-2">
          {listing && (
            <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              {/* Seller Info - Top with Rating - Added more margin */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-base font-semibold text-gray-600">
                      {listing.seller?.charAt(0) || "S"}
                    </span>
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-900">{listing.seller || "Seller"}</div>
                    <div className="text-xs text-gray-500">{listing.location || "Unknown location"}</div>
                  </div>
                </div>
                {/* Seller Rating on Top Right */}
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="text-sm font-medium text-gray-900">
                    {listing.rating || "4.5"}
                  </span>
                </div>
              </div>

              {/* Image - Smaller */}
              <div className="mb-6">
                <div className="w-full h-48 rounded-lg bg-gray-100 overflow-hidden">
                  <img
                    src={listing.image || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600"}
                    alt={listing.title}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Item Details - Stacked */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900">
                    {listing.title || "Untitled Item"}
                  </h3>
                  <span className="text-lg font-bold text-gray-900">
                    {listing.price || "$0"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {listing.category || "General"}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    {listing.condition || "Good"}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {listing.description || "No description available."}
                  </p>
                </div>
              </div>

              {/* View Details Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="px-8 py-3 bg-[#2E4C6E] text-white text-base font-medium rounded-lg hover:bg-[#243c58] transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Smaller Review Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {/* Leave a Review Title - With Space Around */}
            <div className="text-center mb-10 py-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Leave a Review on Your Experience!
              </h2>
            </div>

            {/* Rating Selection - Stars on same line as label */}
            <div className="mb-10 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-lg font-semibold text-gray-700">
                  Rating:
                </label>
                {rating > 0 && (
                  <span className="text-lg font-medium text-gray-900">
                    {rating} out of 5
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {renderStars(true, "text-3xl")}
              </div>
            </div>

            {/* Review Text Area */}
            <div className="mb-10 p-6 bg-gray-50 rounded-lg">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Your Review:
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Type a Review..."
                className="w-full h-48 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-10">
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting || !rating}
                className={`px-10 py-3 text-base font-medium rounded-lg transition-colors ${
                  isSubmitting || !rating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#2E4C6E] hover:bg-[#243c58] text-white"
                }`}
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal 
        message="Review Successfully Posted!" 
        isVisible={showSuccessModal} 
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }} 
      />
    </div>
  );
}