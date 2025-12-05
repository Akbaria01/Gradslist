import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db, app } from "../firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Modal from "../components/Modal";

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Local state for profile name + email
  const [profileName, setProfileName] = useState("User");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileRating, setProfileRating] = useState(0);
  const [profilePic, setProfilePic] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [pfpUploading, setPfpUploading] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [reviewsToLeave, setReviewsToLeave] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingSavedItems, setLoadingSavedItems] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);
  // Load user data from Firestore "users" collection
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setProfileName(data.username || currentUser.displayName || "User");
          setProfileEmail(data.email || currentUser.email || "");
          setProfilePic(data.profilePic || "");
          setImagePreview(data.profilePic || "");
        } else {
          // fallback to auth info if no doc
          setProfileName(currentUser.displayName || "User");
          setProfileEmail(currentUser.email || "");
          setProfilePic("");
          setImagePreview("");
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setProfileName(currentUser.displayName || "User");
        setProfileEmail(currentUser.email || "");
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // Fetch user's listings for the "My Listings" section
  const fetchUserListings = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "listings"),
        where("sellerId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const listings = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        listings.push({
          id: docSnap.id,
          name: data.title || data.name || "Untitled",
          price: data.price !== undefined 
            ? typeof data.price === "number" 
              ? `$${data.price}` 
              : data.price
            : "$0",
          condition: data.condition || "Not specified",
          image: data.imageUrl || data.image || data.photoUrl || "",
          brand: data.brand || "",
          posted: data.postedText || "Recently",
          location: data.location || "",
          seller: data.seller || currentUser.displayName || "Seller",
          _raw: data
        });
      });

      // Sort by most recent first and take only 3
      listings.sort((a, b) => {
        const dateA = a._raw.createdAt?.toDate?.() || new Date(0);
        const dateB = b._raw.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setUserListings(listings.slice(0, 3)); // Only show 3 listings
    } catch (error) {
      console.error("Error fetching user listings:", error);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch saved items from Firebase
  const fetchSavedItems = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "savedItems"),
        where("userId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const items = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          savedId: docSnap.id,
          listingId: data.listingId,
          savedAt: data.savedAt,
          name: data.listingData?.title || data.listingData?.name || "Untitled",
          price: data.listingData?.price !== undefined 
            ? typeof data.listingData.price === "number" 
              ? `$${data.listingData.price}` 
              : data.listingData.price
            : "$0",
          condition: data.listingData?.condition || "Not specified",
          image: data.listingData?.image || data.listingData?.imageUrl || data.listingData?.photoUrl || "",
          brand: data.listingData?.brand || "",
          location: data.listingData?.location || "Unknown",
          seller: data.listingData?.seller || "Unknown",
          posted: data.listingData?.postedText || "Recently",
          _raw: data.listingData
        });
      });

      // Sort by most recent saved and take only 3
      items.sort((a, b) => {
        const dateA = a.savedAt?.toDate?.() || new Date(0);
        const dateB = b.savedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setSavedItems(items.slice(0, 3)); // Only show 3 saved items
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setLoadingSavedItems(false);
    }
  };

  // Fetch items that need reviews (using saved items as placeholder)
  const fetchReviewsToLeave = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "savedItems"),
        where("userId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const items = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          savedId: docSnap.id,
          listingId: data.listingId,
          savedAt: data.savedAt,
          name: data.listingData?.title || data.listingData?.name || "Untitled",
          price: data.listingData?.price !== undefined 
            ? typeof data.listingData.price === "number" 
              ? `$${data.listingData.price}` 
              : data.listingData.price
            : "$0",
          condition: data.listingData?.condition || "Not specified",
          image: data.listingData?.image || data.listingData?.imageUrl || data.listingData?.photoUrl || "",
          brand: data.listingData?.brand || "",
          location: data.listingData?.location || "Unknown",
          seller: data.listingData?.seller || "Unknown",
          posted: data.listingData?.postedText || "Recently",
          _raw: data.listingData
        });
      });

      // Sort by most recent and take only 3
      items.sort((a, b) => {
        const dateA = a.savedAt?.toDate?.() || new Date(0);
        const dateB = b.savedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setReviewsToLeave(items.slice(0, 3)); // Only show 3 items
    } catch (error) {
      console.error("Error fetching items for review:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Initial fetch of data
  useEffect(() => {
    fetchUserListings();
    fetchSavedItems();
    fetchReviewsToLeave();
  }, [currentUser]);

  const user = {
    name: profileName,
    email: profileEmail,
    profilePic: imagePreview || profilePic,
    ratingCount: 0,
  };

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  const handleCreateListing = () => {
    navigate("/listing/create");
  };

  const renderStars = (ratingValue = 4) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-xl ${
            i <= ratingValue ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const goToMyListings = () => navigate("/mylistings");
  const goToSavedItems = () => navigate("/SavedItems");
  const goToLeaveReview = () => navigate("/LeaveReview");

  // Helper function to handle view listing
  const handleViewListing = (listing) => {
    navigate(`/listing/${listing.id}`, { 
      state: { 
        listing: {
          id: listing.id,
          ...listing._raw
        } 
      } 
    });
  };

  // Helper function to handle edit listing
  const handleEditListing = (listing) => {
    navigate("/listing/create", { 
      state: { 
        editMode: true,
        listingData: {
          id: listing.id,
          title: listing._raw.title || listing.name,
          price: listing._raw.price,
          condition: listing.condition,
          category: listing._raw.category || "",
          subcategory: listing._raw.subcategory || "",
          location: listing.location,
          brand: listing.brand,
          description: listing._raw.description || "",
          details: listing._raw.details || "",
          photoUrl: listing._raw.imageUrl || listing.image,
          seller: listing.seller,
          sellerId: currentUser?.uid
        }
      } 
    });
  };

  // Delete listing function
  const handleDeleteListing = async (listingId, listingName) => {
    try {
      await deleteDoc(doc(db, "listings", listingId));
      
      // Update the local state
      setUserListings(prev => prev.filter(item => item.id !== listingId));
      
      // Show success modal
      setDeleteMessage(`"${listingName}" has been deleted successfully!`);
      setShowDeleteModal(true);
      
      // Refresh the listings after deletion
      await fetchUserListings();
      
    } catch (error) {
      console.error("Error deleting listing:", error);
      setDeleteMessage("Failed to delete listing. Please try again.");
      setShowDeleteModal(true);
    }
  };

  // View saved item function
  const handleViewSavedItem = (item) => {
    navigate(`/listing/${item.listingId}`, { 
      state: { 
        listing: {
          id: item.listingId,
          ...item._raw
        } 
      } 
    });
  };

  // Delete saved item function
  const handleDeleteSavedItem = async (savedId, itemName) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "savedItems", savedId));
      
      // Update local state
      setSavedItems(prev => prev.filter(item => item.savedId !== savedId));
      
      // Show success modal
      setDeleteMessage(`"${itemName}" has been deleted from saved items!`);
      setShowDeleteModal(true);
      
      // Refresh saved items and reviews to leave after deletion
      await fetchSavedItems();
      await fetchReviewsToLeave();
      
    } catch (error) {
      console.error("Error deleting saved item:", error);
      setDeleteMessage("Failed to delete item. Please try again.");
      setShowDeleteModal(true);
    }
  };

  // Handle leaving a review - navigates to Review.jsx with listing data
  const handleLeaveReview = (item) => {
    navigate("/review", { 
      state: { 
        listing: {
          id: item.listingId,
          title: item.name,
          price: item.price,
          condition: item.condition,
          image: item.image,
          category: item.brand,
          seller: item.seller,
          location: item.location,
          description: "Item purchased and ready for review",
          postedAt: item.posted,
          rating: 4.5
        }
      } 
    });
  };
  

  return (
    <div className="bg-[#eaecef] p-4 pt-6 pb-9">
      {/* Top Row: Dashboard Title + Profile + Rating */}
      <div className="flex flex-nowrap justify-center items-center gap-40 mb-10">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            {user.name} Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleCreateListing}
              className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}
            >
              Create New Listing
            </button>
          </div>
        </div>

        {/* Profile Box */}
        {/* Profile Box */}
<div
  className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200"
  style={{ width: "260px", height: "100px" }}
>
  <div className="relative">
    <label className="block cursor-pointer">
      {user.profilePic ? (
        <img
          src={user.profilePic}
          className="w-20 h-20 rounded-full object-cover"
          alt="Profile"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
          No Photo
        </div>
      )}

    </label>

    {pfpUploading && (
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
        Updating…
      </span>
    )}
  </div>

  <div className="flex flex-col justify-center h-full">
    <p className="text-lg font-semibold text-gray-900">{user.name}</p>
    {user.email && (
      <p className="text-xs text-gray-500 truncate">{user.email}</p>
    )}
    <button
      onClick={() => navigate(`/viewprofile/${currentUser?.uid}`)}
      className="text-sm text-sky-600 hover:underline mt-1"
    >
      View Profile
    </button>
  </div>
</div>


        {/* Rating Box */}
        <div
          className="flex flex-col justify-center items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          style={{ width: "260px", height: "100px" }}
        >
          <p className="text-lg font-semibold text-gray-700">
            Your Profile Rating
          </p>
          <div className="flex items-center mt-1">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-600">
              {profileRating} ({user.ratingCount})
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings - Using real data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              My Listings
            </h2>
            <button onClick={goToMyListings} className={`text-sm ${buttonStyle} px-3 py-1 rounded`}>
              View All
            </button>
          </div>

          <div className="space-y-4">
            {loadingListings ? (
              <div className="text-center py-4">
                <p className="text-gray-600">Loading listings...</p>
              </div>
            ) : userListings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">No listings yet</p>
              </div>
            ) : (
              userListings.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-25 h-25 rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.price}</p>
                    <p className="text-sm text-gray-600">{item.condition}</p>
                    {item.brand && (
                      <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                    )}
                    <div className="mt-2 flex gap-3">
                      <button 
                        onClick={() => handleViewListing(item)}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditListing(item)}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteListing(item.id, item.name)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Saved Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Saved Items
            </h2>
            <button onClick={goToSavedItems} className={`text-sm ${buttonStyle} px-3 py-1 rounded`}>
              View All
            </button>
          </div>

          <div className="space-y-4">
            {loadingSavedItems ? (
              <div className="text-center py-4">
                <p className="text-gray-600">Loading saved items...</p>
              </div>
            ) : savedItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">No saved items yet</p>
              </div>
            ) : (
              savedItems.map((item) => (
                <div
                  key={item.savedId}
                  className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-25 h-25 rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.price}</p>
                    <p className="text-sm text-gray-600">{item.condition}</p>
                    {item.brand && (
                      <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                    )}
                    <div className="mt-2 flex gap-3">
                      <button 
                        onClick={() => handleViewSavedItem(item)}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleDeleteSavedItem(item.savedId, item.name)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leave a Review - Updated to match Saved Items format */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Leave a Review
            </h2>
            <button onClick={goToLeaveReview} className={`text-sm ${buttonStyle} px-3 py-1 rounded`}>
              View All
            </button>
          </div>

          <div className="space-y-4">
            {loadingReviews ? (
              <div className="text-center py-4">
                <p className="text-gray-600">Loading items...</p>
              </div>
            ) : reviewsToLeave.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">No items to review yet</p>
              </div>
            ) : (
              reviewsToLeave.map((item) => (
                <div
                  key={item.savedId}
                  className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-25 h-25 rounded-lg bg-gray-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.price}</p>
                    <p className="text-sm text-gray-600">{item.condition}</p>
                    {item.brand && (
                      <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                    )}
                    <div className="mt-2 flex gap-3">
                      <button 
                        onClick={() => handleLeaveReview(item)}
                        className="text-xs text-sky-600 hover:underline"
                      >
                        Leave a Review
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Modal at the bottom */}
      <Modal 
        message={deleteMessage} 
        isVisible={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </div>
  );
}