import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MapComponent from '../components/Map';
import { useAuth } from '../context/AuthContext';

export default function ListingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [listing, setListing] = useState(location.state?.listing || null);
  const [loading, setLoading] = useState(!listing);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Map center state: default to Charlotte
  const [center, setCenter] = useState({ lat: 35.2271, lng: -80.8431 });
  const [markerPos, setMarkerPos] = useState(null);
  // Random-ish items sold count (stable per mount)
  const [itemsSold] = useState(() => Math.floor(Math.random() * 6) + 5);

  // When listing changes, pick a center/marker. If listing.location has lat/lng use it.
  // Otherwise if it's a string, attempt a best-effort geocode via Google Maps API when available.
  useEffect(() => {
    if (!listing) return;
    // Prefer structured lat/lng
    if (listing.location && typeof listing.location === 'object' && listing.location.lat && listing.location.lng) {
      const pos = { lat: Number(listing.location.lat), lng: Number(listing.location.lng) };
      setCenter(pos);
      setMarkerPos(pos);
      return;
    }

    // If location is a string, try to geocode it (best-effort). Fall back to Charlotte.
    if (typeof listing.location === 'string' && listing.location.trim()) {
      const addr = listing.location;
      // wait for Google Maps API to be ready
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
              // try heuristic: if the string mentions Charlotte/NC, center Charlotte
              const low = addr.toLowerCase();
              if (low.includes('charlotte') || low.includes('nc') || low.includes('concord')) {
                const pos = { lat: 35.2271, lng: -80.8431 };
                setCenter(pos);
                setMarkerPos(pos);
              } else {
                // fallback: keep default center (Charlotte)
                setMarkerPos({ lat: center.lat, lng: center.lng });
              }
            }
          });
          return true;
        }
        return false;
      };

      // Try immediately, otherwise poll a few times while the maps script loads
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
  }, [listing]);

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

  // Helper to format Firestore Timestamp or Date-like objects
  function formatTimestamp(ts) {
    if (!ts) return 'Unknown';
    let d;
    // Firestore Timestamp
    if (typeof ts.toDate === 'function') {
      d = ts.toDate();
    } else if (ts.seconds) {
      d = new Date(ts.seconds * 1000);
    } else {
      d = new Date(ts);
    }
    try {
      // long date and medium time with locale
      return d.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'medium' });
    } catch (e) {
      return d.toString();
    }
  }

  // Format date-only (e.g., "November 28, 2025")
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
  function renderStars(ratingValue = 4) {
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
    if (listing.seller) return listing.seller; // stored username
    if (currentUser && listing.sellerId && currentUser.uid === listing.sellerId) {
      return currentUser.displayName || currentUser.email || 'You';
    }
    // fallback to id
    return listing.sellerId || 'Unknown';
  })();

  // Determine readable location string
  const locationString = (() => {
    if (!listing) return 'Unknown';
    if (typeof listing.location === 'string') return listing.location;
    if (listing.location && listing.location.address) return listing.location.address;
    // if lat/lng available, show coordinates
    if (listing.location && listing.location.lat && listing.location.lng) {
      return `Lat ${listing.location.lat.toFixed(4)}, Lng ${listing.location.lng.toFixed(4)}`;
    }
    return 'Unknown';
  })();

  // readable title and createdAt
  const title = listing?.title || listing?.item || 'Untitled';
  const createdAtString = formatDateOnly(listing?.createdAt || listing?.posted);

  return (
    <div className="bg-[#eaecef] min-h-screen">
      {/* Sticky top bar — safe-area aware for iOS */}
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
          </div>
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: image + details */}
          <div>
            <div className="w-full rounded-lg overflow-hidden bg-gray-100">
              <img
                src={listing.image}
                alt={title}
                className="w-full h-[480px] object-cover"
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
              <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
              <div className="text-lg font-semibold text-gray-900">{sellerName}</div>
              <div className="mt-2 flex">{renderStars(4)}</div>
              <div className="mt-2 text-sm text-gray-500">(4.0)</div>
              <div className="mt-2 text-sm text-gray-600">Items sold: {itemsSold}</div>
            </div>

            <div className="mt-6">
              <button className="w-full bg-[#395A7F] text-white py-3 rounded-md font-semibold">
                Contact Seller
              </button>
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