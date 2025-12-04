import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { doSignOut } from "../auth";
import { useNavigate } from "react-router-dom";
import {
 doc,
 getDoc,
 collection,
 query,
 where,
 getDocs,
 deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";


export default function Profile() {
 const { currentUser } = useAuth();
 const navigate = useNavigate();


 const [profileName, setProfileName] = useState("User");
 const [profileEmail, setProfileEmail] = useState("");
 const [profileRating, setProfileRating] = useState(0);


 const [myListings, setMyListings] = useState([]);
 const [loadingListings, setLoadingListings] = useState(true);


 // 🔹 Saved items now as STATE (local-only)
 const [savedItems, setSavedItems] = useState([
   {
     id: 4,
     name: "Wireless Headphones",
     price: "$150",
     condition: "Excellent",
     image:
       "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
   },
   {
     id: 5,
     name: "Running Shoes",
     price: "$65",
     condition: "Good",
     image:
       "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
   },
   {
     id: 6,
     name: "Board Game Set",
     price: "$25",
     condition: "Like New",
     image:
       "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400",
   },
 ]);


 const [viewModalOpen, setViewModalOpen] = useState(false);
 const [itemToView, setItemToView] = useState(null);


 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [listingToDelete, setListingToDelete] = useState(null);


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
       } else {
         setProfileName(currentUser.displayName || "User");
         setProfileEmail(currentUser.email || "");
       }
     } catch (err) {
       console.error("Failed to load user profile:", err);
       setProfileName(currentUser.displayName || "User");
       setProfileEmail(currentUser.email || "");
     }
   };
   loadUserProfile();
 }, [currentUser]);


 useEffect(() => {
   const loadListings = async () => {
     if (!currentUser) {
       setMyListings([]);
       setLoadingListings(false);
       return;
     }
     try {
       const listingsRef = collection(db, "listings");
       const q = query(listingsRef, where("sellerId", "==", currentUser.uid));
       const snap = await getDocs(q);
       const results = snap.docs.map((d) => ({
         id: d.id,
         ...d.data(),
       }));
       setMyListings(results);
     } catch (err) {
       console.error("Failed to load user listings:", err);
     } finally {
       setLoadingListings(false);
     }
   };
   loadListings();
 }, [currentUser]);


 const user = {
   name: profileName,
   email: profileEmail,
   profilePic: "",
   ratingCount: 0,
 };


 const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";


 const handleLogout = async () => {
   try {
     await doSignOut();
     navigate("/login&signup");
   } catch (err) {
     console.error("Error signing out:", err);
   }
 };


 const handleCreateListing = () => {
   navigate("/listing/create");
 };


 const renderStars = (ratingValue) => {
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


 const goToMyListings = () => navigate("/Mylistings");
 const goToSavedItems = () => navigate("/SavedItems");
 const goToLeaveReview = () => navigate("/LeaveReview");


 // ---------- My Listings actions ----------
 const handleViewListing = (listing) => {
   setItemToView({
     type: "listing",
     ...listing,
   });
   setViewModalOpen(true);
 };


 const handleEditListing = (listing) => {
   navigate("/listing/create", {
     state: { mode: "edit", listing },
   });
 };


 const openDeleteModal = (listing) => {
   setListingToDelete(listing);
   setDeleteModalOpen(true);
 };


 const closeDeleteModal = () => {
   setListingToDelete(null);
   setDeleteModalOpen(false);
 };


 const confirmDeleteListing = async () => {
   if (!listingToDelete) return;
   try {
     await deleteDoc(doc(db, "listings", listingToDelete.id));
     setMyListings((prev) =>
       prev.filter((l) => l.id !== listingToDelete.id)
     );
   } catch (err) {
     console.error("Failed to delete listing:", err);
   } finally {
     closeDeleteModal();
   }
 };


 const formatPosted = (ts) => {
   if (!ts) return "";
   let d;
   if (typeof ts.toDate === "function") {
     d = ts.toDate();
   } else if (ts.seconds) {
     d = new Date(ts.seconds * 1000);
   } else {
     d = new Date(ts);
   }
   try {
     return d.toLocaleDateString("en-US", {
       dateStyle: "long",
     });
   } catch {
     return d.toDateString();
   }
 };


 // ---------- Saved Items handlers (LOCAL ONLY) ----------
 const handleViewSavedItem = (item) => {
   setItemToView({
     type: "saved",
     ...item,
   });
   setViewModalOpen(true);
 };


 const handleDeleteSavedItem = (id) => {
   setSavedItems((prev) => prev.filter((item) => item.id !== id));
 };


 const closeViewModal = () => {
   setItemToView(null);
   setViewModalOpen(false);
 };


 const reviews = [
   {
     id: 7,
     seller: "John Doe",
     item: "Vintage Painting",
     price: "$200",
     condition: "Like New",
     image:
       "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
   },
   {
     id: 8,
     seller: "Alice Smith",
     item: "Coffee Maker",
     price: "$75",
     condition: "Good",
     image:
       "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
   },
   {
     id: 9,
     seller: "Bob Johnson",
     item: "Vintage Chair",
     price: "$120",
     condition: "Like New",
     image:
       "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
   },
 ];


 return (
   <div className="bg-[#eaecef] min-h-screen p-6">
     {/* Top Row: Dashboard Title + Profile + Rating */}
     <div className="flex flex-nowrap justify-center items-center gap-40 mb-10">
       <div className="flex flex-col items-center">
         <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
           {user.name} Dashboard
         </h1>
         <div className="flex gap-3">
           <button
             onClick={handleCreateListing}
             className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle} hover:bg-[#A3CAE9]`}
           >
             Create New Listing
           </button>
           <button
             onClick={handleLogout}
             className="rounded-lg px-4 py-2 text-sm font-medium shadow-sm bg-red-500 hover:bg-red-600 text-white"
           >
             Log out
           </button>
         </div>
       </div>


       {/* Profile Box */}
       <div
         className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200"
         style={{ width: "260px", height: "100px" }}
       >
         {user.profilePic ? (
           <img
             src={user.profilePic}
             className="w-20 h-20 rounded-full object-cover"
           />
         ) : (
           <div className="w-20 h-20 rounded-full bg-gray-200" />
         )}
         <div className="flex flex-col justify-center h-full">
           <p className="text-lg font-semibold text-gray-900">{user.name}</p>
           {user.email && (
             <p className="text-xs text-gray-500 truncate">{user.email}</p>
           )}
           <button
             onClick={() => navigate("/viewprofile")}
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
           {renderStars(profileRating)}
           <span className="ml-2 text-sm text-gray-600">
             {profileRating} ({user.ratingCount})
           </span>
         </div>
       </div>
     </div>


     {/* Main Grid Sections */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* My Listings */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-gray-900">
             My Listings
           </h2>
           <button
             onClick={goToMyListings}
             className={`text-sm ${buttonStyle} px-3 py-1 rounded hover:bg-[#A3CAE9]`}
           >
             View All
           </button>
         </div>


         {loadingListings ? (
           <p className="text-sm text-gray-500">Loading your listings…</p>
         ) : myListings.length === 0 ? (
           <p className="text-sm text-gray-500">
             You haven&apos;t created any listings yet.
           </p>
         ) : (
           <div className="space-y-4">
             {myListings.slice(0, 3).map((item) => (
               <div
                 key={item.id}
                 className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
               >
                 <img
                   src={item.image}
                   className="w-20 h-20 rounded-lg object-cover"
                   alt={item.title}
                 />
                 <div className="flex-1">
                   <p className="font-medium text-gray-900">
                     {item.title || item.name}
                   </p>
                   <p className="text-sm text-gray-600">
                     ${Number(item.price || 0)}
                   </p>
                   <p className="text-sm text-gray-600">
                     {item.condition || "Used"}
                   </p>
                   <div className="mt-2 flex gap-3">
                     <button
                       className="text-xs text-sky-600 hover:underline"
                       onClick={() => handleViewListing(item)}
                     >
                       View
                     </button>
                     <button
                       className="text-xs text-sky-600 hover:underline"
                       onClick={() => navigate(`/listing/${item.id}/edit`)}
                     >
                       Edit
                     </button>
                     <button
                       className="text-xs text-red-500 hover:underline"
                       onClick={() => openDeleteModal(item)}
                     >
                       Delete
                     </button>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>


       {/* Saved Items */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-gray-900">
             Saved Items
           </h2>
           <button
             onClick={goToSavedItems}
             className={`text-sm ${buttonStyle} px-3 py-1 rounded hover:bg-[#A3CAE9]`}
           >
             View All
           </button>
         </div>


         <div className="space-y-4">
           {savedItems.map((item) => (
             <div
               key={item.id}
               className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
             >
               <img
                 src={item.image}
                 className="w-20 h-20 rounded-lg object-cover"
                 alt={item.name}
               />
               <div className="flex-1">
                 <p className="font-medium text-gray-900">{item.name}</p>
                 <p className="text-sm text-gray-600">{item.price}</p>
                 <p className="text-sm text-gray-600">{item.condition}</p>
                 <div className="mt-2 flex gap-3">
                   <button
                     className="text-xs text-sky-600 hover:underline"
                     onClick={() => handleViewSavedItem(item)}
                   >
                     View
                   </button>
                   <button
                     className="text-xs text-red-500 hover:underline"
                     onClick={() => handleDeleteSavedItem(item.id)}
                   >
                     Delete
                   </button>
                 </div>
               </div>
             </div>
           ))}


           {savedItems.length === 0 && (
             <p className="text-xs text-gray-500">
               You don&apos;t have any saved items yet.
             </p>
           )}
         </div>
       </div>


       {/* Leave a Review */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-semibold text-gray-900">
             Leave a Review
           </h2>
           <button
             onClick={goToLeaveReview}
             className={`text-sm ${buttonStyle} px-3 py-1 rounded hover:bg-[#A3CAE9]`}
           >
             View All
           </button>
         </div>


         <div className="space-y-4">
           {reviews.map((review) => (
             <div
               key={review.id}
               className="flex gap-4 p-3 border rounded-lg hover:bg-gray-50"
             >
               <img
                 src={review.image}
                 className="w-20 h-20 rounded-lg object-cover"
                 alt={review.item}
               />
               <div className="flex-1">
                 <p className="font-medium text-gray-900">{review.item}</p>
                 <p className="text-sm text-gray-600">
                   Seller: {review.seller}
                 </p>
                 <p className="text-sm text-gray-600">{review.price}</p>
                 <p className="text-sm text-gray-600">{review.condition}</p>
                 <button className="mt-2 text-xs text-sky-600 hover:underline">
                   Leave a Review
                 </button>
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>


     {/* Shared View Modal (My Listings + Saved Items) */}
     {viewModalOpen && itemToView && (
       <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
         onClick={closeViewModal}
       >
         <div
           className="bg-[#F5F7FA] rounded-xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden"
           onClick={(e) => e.stopPropagation()}
         >
           <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
             <h2 className="text-lg font-semibold">
               {itemToView.title || itemToView.name || "Item"}
             </h2>
             <button
               type="button"
               onClick={closeViewModal}
               className="text-gray-500 hover:text-gray-700 text-xl leading-none"
             >
               ×
             </button>
           </div>


           <div className="flex flex-col md:flex-row gap-6 p-6">
             <div className="md:w-1/2 bg-white rounded-lg overflow-hidden">
               <img
                 src={itemToView.image}
                 alt={itemToView.title || itemToView.name}
                 className="w-full h-full object-cover"
               />
             </div>


             <div className="md:w-1/2 flex flex-col gap-3">
               <div>
                 <h3 className="text-xl font-semibold mb-1">
                   {itemToView.title || itemToView.name}
                 </h3>
                 <p className="text-2xl font-bold">
                   {typeof itemToView.price === "number"
                     ? `$${itemToView.price}`
                     : itemToView.price}
                 </p>
                 {itemToView.condition && (
                   <p className="text-sm text-gray-600 mt-1">
                     Condition:{" "}
                     <span className="font-medium">
                       {itemToView.condition}
                     </span>
                   </p>
                 )}
                 {itemToView.category && (
                   <p className="text-sm text-gray-600 mt-1">
                     Category:{" "}
                     <span className="font-medium">
                       {itemToView.category}
                     </span>
                   </p>
                 )}
               </div>


               <div className="mt-4 text-sm text-gray-700 space-y-1">
                 {itemToView.createdAt && (
                   <p>
                     <span className="font-semibold">Posted:</span>{" "}
                     {formatPosted(itemToView.createdAt)}
                   </p>
                 )}
                 {itemToView.location && (
                   <p>
                     <span className="font-semibold">Location:</span>{" "}
                     {itemToView.location}
                   </p>
                 )}
               </div>
             </div>
           </div>


           <div className="bg-white border-t px-6 py-4">
             <h3 className="font-semibold mb-1">Description</h3>
             <p className="text-sm text-gray-700 whitespace-pre-line">
               {itemToView.description ||
                 (itemToView.type === "saved"
                   ? "This is one of your saved items."
                   : "No description provided.")}
             </p>
           </div>
         </div>
       </div>
     )}


     {/* Delete confirmation modal (for real listings) */}
     {deleteModalOpen && listingToDelete && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
         <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
           <h2 className="text-lg font-semibold text-gray-900 mb-2">
             Delete listing?
           </h2>
           <p className="text-sm text-gray-600 mb-4">
             Are you sure you want to delete{" "}
             <span className="font-semibold">
               {listingToDelete.title || listingToDelete.name}
             </span>
             ? This action cannot be undone.
           </p>
           <div className="flex justify-end gap-3">
             <button
               type="button"
               onClick={closeDeleteModal}
               className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
             >
               Cancel
             </button>
             <button
               type="button"
               onClick={confirmDeleteListing}
               className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
             >
               Delete
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
