import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
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
  //
  const handleContactSeller = () => {
    // (optional) if routes to /inbox are already protected, this is just extra safety
    if (!currentUser) {
      navigate("/login&signup");
      return;
    }
  
    // send listing + seller info to Inbox via route state
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

  // Rich detail layout: large image/gallery left, details on right
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="w-full rounded-lg overflow-hidden bg-gray-100">
            <img
              src={listing.image}
              alt={title}
              className="w-full h-[480px] object-cover"
            />
          </div>
          {/* Optionally: thumbnails or gallery would go here */}
        </div>

        <aside className="lg:col-span-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {listing.brand && <div className="text-sm text-gray-600 mt-1">{listing.brand}</div>}
          <div className="mt-4 text-3xl font-extrabold text-gray-900">${Number(listing.price || 0)}</div>

          <div className="mt-4 flex items-center gap-3">
            <div className="text-base text-gray-600">Condition: {listing.condition}</div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleContactSeller}
              className="w-full bg-[#395A7F] text-white py-3 rounded-md font-semibold"
            >
              Contact Seller
            </button>
          </div>

          <div className="mt-6 text-base text-gray-600">
            <div>Seller: {sellerName}</div>
            <div>Posted: {createdAtString}</div>
            <div>Location: {locationString}</div>
            {listing.distance && <div>Distance: {listing.distance}</div>}
          </div>
        </aside>
      </div>

      <section className="mt-8 bg-white p-6 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-gray-700 whitespace-pre-line">{listing.description || 'No description provided.'}</p>
      </section>

      <section className="mt-8 bg-white p-6 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Location</h2>
        <div className="flex justify-center">
          <MapComponent
            center={center}
            zoom={11}
            markers={markerPos ? [{ id: listing.id || 'listing', position: markerPos, title }] : []}
            height="320px"
          />
        </div>
      </section>
    </main>
  );
}