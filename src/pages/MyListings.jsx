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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function MyListings() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // For View modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // For Delete confirmation modal
  const [listingToDelete, setListingToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);


  // Button style
  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  // If somehow they reach here without being logged in
  if (!currentUser) {
    return (
      <div className="bg-[#eaecef] min-h-screen flex items-center justify-center">
        <p className="text-gray-700 text-sm">
          Please log in to view your listings.
        </p>
      </div>
    );
  }

  // Helper: format "Posted" label from createdAt timestamp
  const formatPosted = (createdAt) => {
    if (!createdAt) return "";
    let d;
    if (typeof createdAt.toDate === "function") {
      d = createdAt.toDate();
    } else {
      d = new Date(createdAt);
    }

    return d.toLocaleDateString("en-US", { dateStyle: "medium" });
  };

  // 🔄 Load this user's listings from Firestore
  useEffect(() => {
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, where("sellerId", "==", currentUser.uid));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || "Untitled",
            price: data.price,
            condition: data.condition || "Used",
            category: data.category || "",
            location: data.location || "",
            description: data.description || "",
            image: data.image || "",
            createdAt: data.createdAt || null,
          };
        });
        setListings(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading listings:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser.uid]);

  // Handlers
  const handleBack = () => {
    navigate("/profile");
  };

  const handleView = (listing) => {
    setSelectedListing(listing);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedListing(null);
  };

  const handleEdit = (listing) => {
    // go to create listing page in "edit" mode with this listing data
    navigate("/listing/create", {
      state: { mode: "edit", listing },
    });
  };

  const handleDeleteClick = (listing) => {
    setListingToDelete(listing);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setIsDeleteModalOpen(false);
    setListingToDelete(null);
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "listings", listingToDelete.id));
      // onSnapshot will auto-update UI
      setIsDeleteModalOpen(false);
      setListingToDelete(null);
    } catch (err) {
      console.error("Error deleting listing:", err);
    } finally {
      setDeleting(false);
    }
  };

  // UI
  if (loading) {
    return (
      <div className="bg-[#eaecef] min-h-screen flex items-center justify-center">
        <p className="text-gray-700 text-sm">Loading your listings…</p>
      </div>
    );
  }

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}
        >
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">
          My Listings
        </h1>
        <div className="w-24" />
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
      {/* Listings Section */}
      {listings.length === 0 ? (
        <div className="px-6 text-sm text-gray-600">
          You haven&apos;t created any listings yet. Use{" "}
          <span className="font-medium">Create New Listing</span> on your
          dashboard to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    {item.category && (
                      <p className="mt-1 text-xs text-gray-500">
                        {item.category}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {item.condition}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    ${item.price}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Posted {item.createdAt ? formatPosted(item.createdAt) : ""}
                  </span>
                  {item.location && <span>{item.location}</span>}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                    onClick={() => handleView(item)}
                  >
                    View
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-3 py-2 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-300"
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-600"
                    onClick={() => handleDeleteClick(item)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeViewModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {selectedListing.title}
              </h2>
              <button
                type="button"
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {/* Image */}
              <div className="md:w-1/2 bg-gray-100 rounded-lg overflow-hidden">
                {selectedListing.image ? (
                  <img
                    src={selectedListing.image}
                    alt={selectedListing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="md:w-1/2 flex flex-col gap-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${selectedListing.price}
                  </p>
                  {selectedListing.category && (
                    <p className="text-sm text-gray-600 mt-1">
                      Category:{" "}
                      <span className="font-medium">
                        {selectedListing.category}
                      </span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    Condition:{" "}
                    <span className="font-medium">
                      {selectedListing.condition}
                    </span>
                  </p>
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  {selectedListing.createdAt && (
                    <p>
                      <span className="font-semibold">Posted:</span>{" "}
                      {formatPosted(selectedListing.createdAt)}
                    </p>
                  )}
                  {selectedListing.location && (
                    <p>
                      <span className="font-semibold">Location:</span>{" "}
                      {selectedListing.location}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {selectedListing.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && listingToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete listing?
              </h2>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                "{listingToDelete.title}"
              </span>
              ? This action cannot be undone.
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
