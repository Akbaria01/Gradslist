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
import { useState } from "react";

export default function SavedItems() {
  const navigate = useNavigate();

  // 🔹 Saved items in local state
  const [savedItems, setSavedItems] = useState([
    {
      id: 1,
      item: "Wireless Headphones",
      brand: "Sony · Noise cancelling",
      seller: "Emma Brown",
      price: "$150",
      condition: "Excellent",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      posted: "3 days ago",
      distance: "1.2 miles away",
    },
    {
      id: 2,
      item: "Running Shoes",
      brand: "Nike · Size 10",
      seller: "Liam Wilson",
      price: "$65",
      condition: "Good",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      posted: "2 days ago",
      distance: "2.1 miles away",
    },
    {
      id: 3,
      item: "Board Game Set",
      brand: "Monopoly · Complete",
      seller: "Sophia Martinez",
      price: "$25",
      condition: "Like New",
      image:
        "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400",
      posted: "5 days ago",
      distance: "1.8 miles away",
    },
  ]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [itemToView, setItemToView] = useState(null);

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

  const handleView = (item) => {
    setItemToView(item);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setItemToView(null);
    setViewModalOpen(false);
  };

  // 🔹 Delete from local state only
  const handleDelete = (id) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>
          onClick={() => navigate("/profile")}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}
        >
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">
          Saved Items
        </h1>
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
      {/* Saved Items Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        {savedItems.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={item.image}
                alt={item.item}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {item.item}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Seller: {item.seller}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.condition}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {item.price}
                </p>
              </div>
              <div className="mt-3 text-xs text-gray-500 flex justify-between">
                <span>Posted {item.posted}</span>
                <span>{item.distance}</span>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                  onClick={() => handleView(item)}
                >
                  View
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-600"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {savedItems.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-500">
            You don&apos;t have any saved items.
          </p>
        )}
      </div>

      {/* View modal */}
      {viewModalOpen && itemToView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeViewModal}
        >
          <div
            className="bg-[#F5F7FA] rounded-xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
              <h2 className="text-lg font-semibold">{itemToView.item}</h2>
              <button
                type="button"
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Main content */}
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {/* Image */}
              <div className="md:w-1/2 bg-white rounded-lg overflow-hidden">
                <img
                  src={itemToView.image}
                  alt={itemToView.item}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="md:w-1/2 flex flex-col gap-3">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {itemToView.item}
                  </h3>
                  <p className="text-2xl font-bold">{itemToView.price}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Condition:{" "}
                    <span className="font-medium">
                      {itemToView.condition}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {itemToView.brand}
                  </p>
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Seller:</span>{" "}
                    {itemToView.seller}
                  </p>
                  <p>
                    <span className="font-semibold">Posted:</span>{" "}
                    {itemToView.posted}
                  </p>
                  <p>
                    <span className="font-semibold">Distance:</span>{" "}
                    {itemToView.distance}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / Description area */}
            <div className="bg-white border-t px-6 py-4">
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-sm text-gray-700">
                This is one of your saved items. In a real app, this could show
                the seller&apos;s full description.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
