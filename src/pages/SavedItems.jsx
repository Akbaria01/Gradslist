import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import Modal from "../components/Modal";

export default function SavedItems() {
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        navigate("/login&signup");
      }
    });
    return unsubscribe;
  }, [navigate]);

  // Fetch saved items from Firebase
  useEffect(() => {
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
            savedId: docSnap.id, // The saved item document ID
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
            // For viewing the actual listing
            _raw: data.listingData
          });
        });

        // Sort by most recent saved
        items.sort((a, b) => {
          const dateA = a.savedAt?.toDate?.() || new Date(0);
          const dateB = b.savedAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        setSavedItems(items);
      } catch (error) {
        console.error("Error fetching saved items:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchSavedItems();
    }
  }, [currentUser]);

  // Delete saved item function
  const handleDelete = async (savedId, itemName) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, "savedItems", savedId));
      
      // Update local state
      setSavedItems(prev => prev.filter(item => item.savedId !== savedId));
      
      // Show success modal
      setDeleteMessage(`"${itemName}" has been deleted from saved items!`);
      setShowDeleteModal(true);
      
    } catch (error) {
      console.error("Error deleting saved item:", error);
      setDeleteMessage("Failed to delete item. Please try again.");
      setShowDeleteModal(true);
    }
  };

  // View listing details function
  const handleView = (item) => {
    navigate(`/listing/${item.listingId}`, { 
      state: { 
        listing: {
          id: item.listingId,
          ...item._raw
        } 
      } 
    });
  };

  // Generate random stars (3-5) and distance (1.0-6.0) per item
  const randomMeta = useMemo(() => {
    const map = {};
    savedItems.forEach((item) => {
      const rating = Math.floor(Math.random() * 3) + 3; // 3..5
      const distance = (Math.random() * 5 + 1).toFixed(1); // 1.0..6.0
      map[item.savedId] = { rating, distance };
    });
    return map;
  }, [savedItems]);

  // Render stars function
  function renderStars(ratingValue = 4) {
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

  // Button style
  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">Saved Items</h1>
        <div className="w-24" /> {/* Placeholder to balance flex */}
      </div>

      {/* Loading State */}
      {loading ? (
          <div className="text-center py-12 col-span-4">
            <p className="text-gray-600 text-lg">Loading items...</p>
          </div>
        ) : savedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">You haven't saved any items yet.</p>
        </div>
      ) : (
        /* Saved Items Section - Using same layout as MyListings */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-6">
          {savedItems.map((item) => {
            const meta = randomMeta[item.savedId] || { rating: 4, distance: '2.3' };
            const city = (item.location || '')
              .toString()
              .replace(/\n+/g, ' ')
              .split(',')[0]
              .replace(/\s+/g, ' ')
              .trim() || 'Unknown';

            return (
              <div
                key={item.savedId}
                className="group relative flex flex-col h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {/* Username + stars above image */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="text-sm font-medium text-gray-900">{item.seller}</div>
                  </div>
                  <div className="text-sm">{renderStars(meta.rating)}</div>
                </div>

                {/* Image left, info right on larger screens - Same as MyListings */}
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
                      <div className="text-xs text-gray-500">
                        Saved {item.savedAt?.toDate?.().toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }) || "recently"}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">Distance: {meta.distance} mi</div>

                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="w-full inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => handleDelete(item.savedId, item.name)}
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
