import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
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
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null); // Add distance to state

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  // Get listing data from navigation state or fetch from Firestore
  useEffect(() => {
    const loadListing = async () => {
      try {
        // Calculate random distance once (1.0-6.0 mi)
        const randomDistance = (Math.random() * 5 + 1).toFixed(1);
        setDistance(randomDistance);
        
        // First check if listing data was passed in navigation state
        if (location.state?.listing) {
          setListing(location.state.listing);
          setLoading(false);
          return;
        }

        // If listing has an ID but no data, fetch from Firestore
        if (location.state?.listingId) {
          const listingRef = doc(db, "listings", location.state.listingId);
          const listingSnap = await getDoc(listingRef);
          
          if (listingSnap.exists()) {
            const data = listingSnap.data();
            setListing({
              id: listingSnap.id,
              title: data.title || data.item || "Untitled",
              price: typeof data.price === "number" ? `$${data.price}` : data.price || "$0",
              condition: data.condition || "Not specified",
              image: data.image || data.imageUrl || data.photoUrl || "",
              brand: data.brand || "",
              category: data.category || "",
              location: (() => {
                if (typeof data.location === "string") return data.location;
                if (data.location && data.location.address) return data.location.address;
                if (data.location && data.location.lat && data.location.lng) {
                  return `Lat ${data.location.lat.toFixed(4)}, Lng ${data.location.lng.toFixed(4)}`;
                }
                return "Unknown";
              })(),
              seller: data.seller || "Unknown",
              sellerId: data.sellerId,
              postedAt: data.createdAt?.toDate?.()?.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              }) || "recently",
              rating: 4.5 // Default rating
            });
          } else {
            setError("Listing not found");
          }
        } else {
          // No backup data - show error if no listing data
          setError("No listing data provided");
        }
      } catch (error) {
        console.error("Error loading listing:", error);
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [location.state]);

  // Handle star rating selection - FIXED
  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  // Handle review submission - MODIFIED: Doesn't save to Firebase
  const handleSubmitReview = async () => {
    if (!rating) {
      alert("Please select a star rating!");
      return;
    }

    if (!listing || !listing.id) {
      alert("Listing information is missing!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create review data but DON'T save to Firebase
      const reviewData = {
        userId: currentUser?.uid,
        userName: currentUser?.displayName || "Anonymous",
        listingId: listing.id,
        listingTitle: listing.title,
        sellerId: listing.sellerId,
        rating: rating,
        reviewText: reviewText.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Set the posted review for display in modal
      setPostedReview({
        name: currentUser?.displayName || "You",
        rating: rating,
        text: reviewText.trim(),
        time: "Just now"
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Clear form
      setRating(0);
      setReviewText("");
      
    } catch (error) {
      console.error("Error in review submission:", error);
      // Still show success for demo purposes
      setPostedReview({
        name: currentUser?.displayName || "You",
        rating: rating,
        text: reviewText.trim(),
        time: "Just now"
      });
      setShowSuccessModal(true);
      setRating(0);
      setReviewText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stars for rating selection - FIXED
  const renderStars = (forSelection = true, size = "text-2xl") => {
    const stars = [];
    const value = forSelection ? rating : (postedReview?.rating || 0);
    
    for (let i = 1; i <= 5; i++) {
      if (forSelection) {
        stars.push(
          <button
            key={i}
            type="button"
            onClick={() => handleStarClick(i)}
            className={`${size} cursor-pointer hover:scale-110 transition-transform ${
              i <= value ? "text-yellow-400" : "text-gray-300"
            }`}
            disabled={isSubmitting}
          >
            ★
          </button>
        );
      } else {
        stars.push(
          <span
            key={i}
            className={`${size} ${i <= value ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </span>
        );
      }
    }
    return stars;
  };

  // Render stars for listing card (multiple stars)
  function renderListingStars(ratingValue = 4) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-sm ${i <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      );
    }
    return stars;
  }

  // Custom modal content for review success - SIMPLIFIED
  const ReviewSuccessModal = () => (
    <div className="bg-white px-8 py-8 rounded-lg shadow-lg border border-gray-200 relative max-w-md w-full mx-4">
      <button 
        onClick={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
      >
        ✕
      </button>
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Review Successfully Posted!</h2>
      </div>
      
      {postedReview && (
        <div className="border border-gray-300 rounded-lg p-6">
          {/* User Info Section - Left Aligned */}
          <div className="flex items-center gap-4 mb-4">
            {/* User Name */}
            <div>
              <p className="font-medium text-gray-900 text-lg">{postedReview.name}</p>
            </div>
          </div>
          {/* Star Rating - Left Aligned */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {renderStars(false, "text-xl")}
            </div>
          </div>
          {/* Review Text */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2"></h3>
            <p className="text-gray-700">{postedReview.text}</p>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-[#eaecef] min-h-screen p-6">
        <div className="text-center py-20">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-[#eaecef] min-h-screen p-6">
        <div className="text-center py-20">
          <p className="text-red-600">{error || "Listing not found"}</p>
          <button
            onClick={() => navigate("/profile")}
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}
          >
            Back to Profile
          </button>
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
        {/* Left Side - Stacked Vertical Listing Card */}
        <div className="lg:col-span-2">
          {listing && (
            <div className="group relative flex flex-col h-full rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              {/* Seller Info */}
              <div className="flex items-center justify-between mb-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {listing.seller?.charAt(0) || "S"}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{listing.seller}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {renderListingStars(listing.rating || 4.5)}
                </div>
              </div>
              
              {/* Bigger Image - Full width */}
              <div className="w-full h-80 overflow-hidden flex items-center justify-center px-4">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover transition group-hover:scale-105"
                />
              </div>

              {/* Item Details - Stacked */}
              <div className="p-4 space-y-4">
                {/* Item Name and Price - Stacked */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {listing.title}
                  </h3>
                  <span className="text-lg font-bold text-gray-900 block">
                    {listing.price}
                  </span>
                </div>
                
                {/* Condition, Location, Posted, Distance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Condition:</span>
                    <span className="text-sm text-gray-900">{listing.condition}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm text-gray-900">{listing.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Posted:</span>
                    <span className="text-sm text-gray-900">{listing.postedAt || "recently"}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Distance:</span>
                    <span className="text-sm text-gray-900">{distance} mi</span>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="pt-4">
                  <button
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Review Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Leave a Review Title */}
            <div className="text-center mb-8 pt-4">
              <h2 className="text-xl font-bold text-gray-900">
                Leave a Review on Your Experience!
              </h2>
            </div>

            {/* Rating Selection - Stars next to "Rating:" - FIXED */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <label className="block text-base font-semibold text-gray-700">
                  Rating:
                </label>
                <div className="flex items-center gap-2">
                  {renderStars(true, "text-2xl")}
                </div>
                {rating > 0 && (
                  <span className="text-base font-medium text-gray-900 ml-2">
                    {rating} out of 5
                  </span>
                )}
              </div>
            </div>

            {/* Review Text Area */}
            <div className="mb-8">
              <label className="block text-base font-semibold text-gray-700 mb-3">
                Your Review:
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Type a Review..."
                className="w-full h-40 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmitReview}
                disabled={isSubmitting || !rating}
                className={`px-8 py-2 text-base font-medium rounded-lg transition-colors ${
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

      {/* Success Modal with custom content */}
      <Modal 
        isVisible={showSuccessModal} 
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }}
        customContent={<ReviewSuccessModal />}
      />
    </div>
  );
}