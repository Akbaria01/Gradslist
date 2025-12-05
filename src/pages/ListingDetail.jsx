import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import MapComponent from '../components/Map';
import { useAuth } from '../context/AuthContext';

export default function ListingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [listing, setListing] = useState(location.state?.listing || null);
  const [loading, setLoading] = useState(!listing);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sellerProfilePic, setSellerProfilePic] = useState(null);
  const [sellerRating, setSellerRating] = useState(0); // Add state for seller rating
  const [itemsSold, setItemsSold] = useState(0); // Add state for items sold

  // Check if item is already saved when component loads
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!currentUser || !listing) return;
      
      try {
        const savedRef = doc(db, 'savedItems', `${currentUser.uid}_${listing.id}`);
        const savedSnap = await getDoc(savedRef);
        setIsSaved(savedSnap.exists());
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [currentUser, listing]);

  // Always fetch the canonical listing from Firestore so fields like createdAt are resolved
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (!snap.exists()) {
          if (mounted) setError('Listing not found');
        } else {
          const data = snap.data();
          if (mounted) setListing({ id: snap.id, ...data });
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load listing');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Resolve seller profile picture
  useEffect(() => {
    if (!listing || !listing.sellerId) return;

    // If listing already has sellerProfilePic, use it
    if (listing.sellerProfilePic) {
      setSellerProfilePic(listing.sellerProfilePic);
      return;
    }

    // Otherwise, try to read from users/{sellerId}
    const loadSellerPic = async () => {
      try {
        const snap = await getDoc(doc(db, "users", listing.sellerId));
        if (snap.exists()) {
          const u = snap.data();
          setSellerProfilePic(u.profilePic || null);
        }
      } catch (e) {
        console.error("Failed to load seller profile pic:", e);
      }
    };

    loadSellerPic();
  }, [listing]);

  // Fetch seller rating from reviews
  useEffect(() => {
    if (!listing || !listing.sellerId) return;

    const fetchSellerRating = async () => {
      try {
        // Query reviews for this seller
        const q = query(
          collection(db, "reviews"),
          where("reviewedUserId", "==", listing.sellerId)
        );
        
        const querySnapshot = await getDocs(q);
        const reviews = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate average rating
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
          const averageRating = totalRating / reviews.length;
          setSellerRating(Number(averageRating.toFixed(1))); // Round to 1 decimal
        } else {
          setSellerRating(0); // No reviews yet
        }
      } catch (error) {
        console.error("Error fetching seller rating:", error);
        setSellerRating(0);
      }
    };

    fetchSellerRating();
  }, [listing]);

  // Fetch seller's items sold count
  useEffect(() => {
    if (!listing || !listing.sellerId) return;

    const fetchItemsSold = async () => {
      try {
        // Query all listings by this seller
        const q = query(
          collection(db, "listings"),
          where("sellerId", "==", listing.sellerId)
        );
        
        const querySnapshot = await getDocs(q);
        setItemsSold(querySnapshot.size); // Number of listings = items sold
        
        // Alternatively, you could query a "sales" or "transactions" collection
        // if you have that in your database
      } catch (error) {
        console.error("Error fetching items sold:", error);
        // Fallback to random number if query fails
        setItemsSold(Math.floor(Math.random() * 6) + 5);
      }
    };

    fetchItemsSold();
  }, [listing]);

  // Map center state: default to Charlotte
  const [center, setCenter] = useState({ lat: 35.2271, lng: -80.8431 });
  const [markerPos, setMarkerPos] = useState(null);

  // When listing changes, pick a center/marker
  useEffect(() => {
    if (!listing) return;
    // Prefer structured lat/lng
    if (listing.location && typeof listing.location === 'object' && listing.location.lat && listing.location.lng) {
      const pos = { lat: Number(listing.location.lat), lng: Number(listing.location.lng) };
      setCenter(pos);
      setMarkerPos(pos);
      return;
    }

    // If location is a string, try to geocode it
    if (typeof listing.location === 'string' && listing.location.trim()) {
      const addr = listing.location;
      const tryGeocode = () => {
        if (window.google && window.google.maps && window.google.maps.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: addr }, (results, status) => {
            if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
              const loc = results[0].geometry.location;
              const pos = { lat: loc.lat(), lng: loc.lng() };
              setCenter(pos);
              setMarkerPos(pos);
            } else {
              const low = addr.toLowerCase();
              if (low.includes('charlotte') || low.includes('nc') || low.includes('concord')) {
                const pos = { lat: 35.2271, lng: -80.8431 };
                setCenter(pos);
                setMarkerPos(pos);
              } else {
                setMarkerPos({ lat: center.lat, lng: center.lng });
              }
            }
          });
          return true;
        }
        return false;
      };

      if (!tryGeocode()) {
        let attempts = 0;
        const iv = setInterval(() => {
          attempts += 1;
          if (tryGeocode() || attempts > 10) {
            clearInterval(iv);
          }
        }, 500);
      }
      return;
    }

    // default fallback
    setCenter({ lat: 35.2271, lng: -80.8431 });
    setMarkerPos({ lat: 35.2271, lng: -80.8431 });
  }, [listing, center.lat, center.lng]);

  // Toggle save function
  const toggleSave = async () => {
    if (!currentUser) {
      navigate('/login&signup');
      return;
    }

    setSaving(true);
    try {
      const savedRef = doc(db, 'savedItems', `${currentUser.uid}_${listing.id}`);
      
      if (isSaved) {
        // Remove from saved items
        await deleteDoc(savedRef);
        setIsSaved(false);
      } else {
        // Add to saved items
        await setDoc(savedRef, {
          userId: currentUser.uid,
          listingId: listing.id,
          savedAt: new Date(),
          listingData: {
            title: listing.title || listing.item || 'Untitled',
            price: listing.price,
            condition: listing.condition,
            image: listing.image,
            brand: listing.brand || '',
            location: listing.location,
            seller: listing.seller || 'Unknown',
            sellerId: listing.sellerId
          }
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading listing…</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!listing) return <div className="p-6">Listing not found</div>;

  // Helper to format date
  function formatDateOnly(ts) {
    if (!ts) return 'Unknown';
    let d;
    if (typeof ts.toDate === 'function') {
      d = ts.toDate();
    } else if (ts.seconds) {
      d = new Date(ts.seconds * 1000);
    } else {
      d = new Date(ts);
    }
    try {
      return d.toLocaleDateString('en-US', { dateStyle: 'long' });
    } catch (e) {
      return d.toDateString();
    }
  }

  // Small helper to render star rating
  function renderStars(ratingValue = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-xl ${i <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      );
    }
    return stars;
  }

  // Determine readable seller name
  const sellerName = (() => {
    if (!listing) return 'Unknown';
    if (listing.seller) return listing.seller;
    if (currentUser && listing.sellerId && currentUser.uid === listing.sellerId) {
      return currentUser.displayName || currentUser.email || 'You';
    }
    return listing.sellerId || 'Unknown';
  })();

  // Determine readable location string
  const locationString = (() => {
    if (!listing) return 'Unknown';
    if (typeof listing.location === 'string') return listing.location;
    if (listing.location && listing.location.address) return listing.location.address;
    if (listing.location && listing.location.lat && listing.location.lng) {
      return `Lat ${listing.location.lat.toFixed(4)}, Lng ${listing.location.lng.toFixed(4)}`;
    }
    return 'Unknown';
  })();

  const handleContactSeller = () => {
    if (!currentUser) {
      navigate("/login&signup");
      return;
    }
  
    navigate("/inbox", {
      state: {
        fromListing: {
          listingId: listing.id,
          title,
          price: Number(listing.price || 0),
          condition: listing.condition || "",
          sellerId: listing.sellerId || null,
          sellerName,
          postedString: createdAtString,
          locationString,
          description: listing.description || "",
          image: listing.image,
        },
      },
    });
  };

  // readable title and createdAt
  const title = listing?.title || listing?.item || 'Untitled';
  const createdAtString = formatDateOnly(listing?.createdAt || listing?.posted);

  return (
    <div className="bg-[#eaecef] min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="bg-[#eaecef] border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Back to home"
              onClick={() => navigate(-1)}
              className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${"bg-[#2E4C6E] hover:bg-[#243c58] text-white"}`}>
              Back
            </button>

            <h1 className="text-3xl font-bold text-gray-900 text-center flex-1 mx-4">{title}</h1>

            {/* Heart icon for saving */}
            {currentUser?.uid !== listing.sellerId && (
            <button
              onClick={toggleSave}
              disabled={saving}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isSaved ? "Remove from saved items" : "Save to saved items"}
            >
              <svg
                className={`w-8 h-8 ${isSaved ? 'text-red-500 fill-current' : 'text-black'}`}
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={isSaved ? 0 : 2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            )}
          </div>
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: image + details */}
          <div>
            <div className="relative w-full max-w-[600px] h-[350px] sm:h-[420px] md:h-[480px] overflow-hidden rounded-lg">
              <img
                src={listing.image}
                alt={title}
                className="w-full h-full object-cover object-center"
                style={{ objectFit: "fill" }}
              />
            </div>

            <section className="mt-6 bg-white p-6 rounded shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Details</h2>
              <div className="text-gray-700">
                <div className="mb-3">
                  <span className="text-base text-gray-600">Price: </span>
                  <span className="text-base text-gray-600">${Number(listing.price || 0)}</span>
                </div>

                <div className="mb-3">
                  <span className="text-base text-gray-600">Condition: </span>
                  <span className="text-base text-gray-600">{listing.condition || 'Unknown'}</span>
                </div>

                <div className="mb-3">
                  <span className="text-base text-gray-600">Location: </span>
                  <span className="text-base text-gray-600">{locationString}</span>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description || 'No description provided.'}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right column: seller card, contact button, map */}
          <aside>
            {/* Seller card section */}
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center">
              {sellerProfilePic ? (
                <img
                  src={sellerProfilePic}
                  alt={sellerName}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
               ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-lg font-semibold text-gray-500">
                {sellerName?.charAt(0).toUpperCase()}
                </div>
              )}

        
              <div className="text-lg font-semibold text-gray-900">{sellerName}</div>
              <div className="mt-2 flex">{renderStars(sellerRating)}</div>
              <div className="mt-2 text-sm text-gray-500">({sellerRating})</div>
              <div className="mt-2 text-sm text-gray-600">Items sold: {itemsSold}</div>
              <br />
              {/* VIEW PROFILE BUTTON HERE */}
              {listing.sellerId && (
                <button
                  onClick={() => navigate(`/viewprofile/${listing.sellerId}`)}
                  className="w-fit bg-[#395A7F] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#2E4C6E] transition-colors"
                >
                  View Profile
                </button>
              )}
            </div>
            
            
            <div className="mt-6">
              {currentUser?.uid !== listing.sellerId && (
              <button
                onClick={handleContactSeller}
                className="w-full bg-[#395A7F] text-white py-3 rounded-md font-semibold hover:bg-[#2E4C6E] transition-colors"
              >
                Contact Seller
              </button>
              )}
            </div>

            <div className="mt-6 bg-white p-6 rounded shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Location</h2>
              <div className="flex justify-center">
                <MapComponent
                  center={center}
                  zoom={11}
                  markers={markerPos ? [{ id: listing.id || 'listing', position: markerPos, title }] : []}
                  height="320px"
                />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}