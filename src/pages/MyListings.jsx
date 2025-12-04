import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import Modal from "../components/Modal";

export default function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deleteMessage, setDeleteMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  // Fetch current user's listings
  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/login");
          return;
        }

        const q = query(
          collection(db, "listings"),
          where("sellerId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const userListings = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          userListings.push({
            id: docSnap.id,
            name: data.title || data.name || "Untitled",
            price: data.price !== undefined 
              ? typeof data.price === "number" 
                ? `$${data.price}` 
                : data.price
              : "$0",
            priceValue: typeof data.price === "number" ? data.price : 0,
            condition: data.condition || "Not specified",
            image: data.imageUrl || data.image || data.photoUrl || "",
            brand: data.brand || "",
            posted: data.postedText || (() => {
              // Calculate time ago from postedAt
              if (data.postedAt) {
                const postedDate = data.postedAt.toDate ? data.postedAt.toDate() : new Date(data.postedAt);
                const now = new Date();
                const diffMs = now - postedDate;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                if (diffHours < 24) {
                  return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                } else if (diffDays < 7) {
                  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                } else {
                  return "Over a week ago";
                }
              }
              return "Recently";
            })(),
            postedAt: data.postedAt || data.createdAt || new Date(),
            description: data.description || "",
            category: data.category || "",
            subcategory: data.subcategory || "",
            location: data.location || "",
            seller: data.seller || currentUser.displayName || "Seller",
            sellerId: data.sellerId,
            // Include all fields needed for editing
            title: data.title || "",
            priceNumber: typeof data.price === "number" ? data.price : 0,
            photoUrl: data.photoUrl || data.imageUrl || "",
            details: data.details || "",
            _raw: data
          });
        });

        // Sort by most recent first
        userListings.sort((a, b) => {
          const dateA = a.postedAt instanceof Date ? a.postedAt : new Date(a.postedAt);
          const dateB = b.postedAt instanceof Date ? b.postedAt : new Date(b.postedAt);
          return dateB - dateA;
        });

        setListings(userListings);
      } catch (error) {
        console.error("Error fetching user listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [navigate]);

  // Delete listing function
  const handleDelete = async (listingId, listingName) => {
    try {
      await deleteDoc(doc(db, "listings", listingId));
      setListings(prev => prev.filter(item => item.id !== listingId));
      
      // Show success modal
      setDeleteMessage(`"${listingName}" has been deleted successfully!`);
      setShowDeleteModal(true);
      
    } catch (error) {
      console.error("Error deleting listing:", error);
      setDeleteMessage("Failed to delete listing. Please try again.");
      setShowDeleteModal(true);
    }
  };

  // Edit listing function - navigates to CreateListing with edit mode
  const handleEdit = (listing) => {
    // Pass the listing data to CreateListing page for editing
    navigate("/listing/create", { 
      state: { 
        editMode: true,
        listingData: {
          id: listing.id,
          title: listing.title || listing.name,
          price: listing.priceNumber,
          condition: listing.condition,
          category: listing.category,
          subcategory: listing.subcategory,
          location: listing.location,
          brand: listing.brand,
          description: listing.description,
          details: listing.details,
          photoUrl: listing.photoUrl || listing.image,
          seller: listing.seller,
          sellerId: listing.sellerId
        }
      } 
    });
  };

  // View listing details function
  const handleView = (listing) => {
    navigate(`/listing/${listing.id}`, { 
      state: { 
        listing: {
          id: listing.id,
          ...listing._raw
        } 
      } 
    });
  };

  // Generate random stars (3-5) and distance (1.0-6.0) per listing
  const randomMeta = useMemo(() => {
    const map = {};
    listings.forEach((listing) => {
      const rating = Math.floor(Math.random() * 3) + 3; // 3..5
      const distance = (Math.random() * 5 + 1).toFixed(1); // 1.0..6.0
      map[listing.id] = { rating, distance };
    });
    return map;
  }, [listings]);


  // Button style
  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/profile")}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">My Listings</h1>
        <div className="w-24" /> {/* Placeholder to balance flex */}
      </div>

      {/* Loading State */}
      {loading ? (
          <div className="text-center py-12 col-span-4">
            <p className="text-gray-600 text-lg">Loading items...</p>
          </div>
        ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">You haven't created any listings yet.</p>
        </div>
      ) : (
        /* Listings Section - Using same layout as Home */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-6">
          {listings.map((item) => {
            const meta = randomMeta[item.id] || { rating: 4, distance: '2.3' };
            const city = (item.location || '')
              .toString()
              .replace(/\n+/g, ' ')
              .split(',')[0]
              .replace(/\s+/g, ' ')
              .trim() || 'Unknown';

            return (
              <div
                key={item.id}
                className="group relative flex flex-col h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                {/* Image left, info right on larger screens - Same as Home */}
                <div className="flex flex-col md:flex-row gap-4 h-full items-stretch">
                  {/* Image: fixed size container */}
                  <div className="md:w-1/2 w-full">
                    <div className="w-full h-40 md:h-48 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Info column: full height + evenly spaced vertically */}
                  <div className="flex-1 flex flex-col justify-between md:py-1 h-full">
                    {/* Top block: title + price + location */}
                    <div>
                      <h3
                        className="text-lg font-semibold text-gray-900 h-[48px]"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
                      )}
                      <p className="mt-2 text-sm font-bold text-gray-900">{item.price}</p>
                      <p className="mt-1 text-xs text-gray-500">Condition: {item.condition}</p>
                      <p className="mt-1 text-xs text-gray-500">Location: {city}</p>
                    </div>

                    {/* Bottom block: uniform placement */}
                    <div className="pt-2">
                      <div className="text-xs text-gray-500">Posted {item.posted}</div>
                      <div className="mt-1 text-xs text-gray-500">Distance: {meta.distance} mi</div>

                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="w-full inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-full inline-flex items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="w-full inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal 
        message={deleteMessage} 
        isVisible={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />
    </div>
  );
}
