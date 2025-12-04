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
