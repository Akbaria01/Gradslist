import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
import MapComponent from '../components/Map';

export default function ListingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [listing, setListing] = useState(location.state?.listing || null);
  const [loading, setLoading] = useState(!listing);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (listing) return; // already have it via navigate state
    async function load() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'listings', id));
        if (!snap.exists()) {
          setError('Listing not found');
        } else {
          const data = snap.data();
          setListing({ id: snap.id, ...data });
        }
      } catch (err) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, listing]);

  if (loading) return <div className="p-6">Loading listing…</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!listing) return <div className="p-6">Listing not found</div>;

  // Rich detail layout: large image/gallery left, details on right
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="w-full rounded-lg overflow-hidden bg-gray-100">
            <img
              src={listing.image}
              alt={listing.item}
              className="w-full h-[480px] object-cover"
            />
          </div>
          {/* Optionally: thumbnails or gallery would go here */}
        </div>

        <aside className="lg:col-span-1">
          <h1 className="text-2xl font-bold text-gray-900">{listing.item}</h1>
          {listing.brand && <div className="text-sm text-gray-600 mt-1">{listing.brand}</div>}
          <div className="mt-4 text-3xl font-extrabold text-gray-900">{listing.price}</div>

          <div className="mt-4 flex items-center gap-3">
            <div className="text-sm text-gray-600">Condition: {listing.condition}</div>
          </div>

          <div className="mt-6">
            <button className="w-full bg-[#395A7F] text-white py-3 rounded-md font-semibold">Contact Seller</button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <div>Seller: {listing.seller || 'Unknown'}</div>
            <div>Posted: {listing.posted}</div>
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
        {/* Determine center: prefer listing.location if it has lat/lng, otherwise default to San Francisco */}
        {(() => {
          const sf = { lat: 37.7749, lng: -122.4194 };
          const hasLatLng = listing.location && typeof listing.location === 'object' && listing.location.lat && listing.location.lng;
          const center = hasLatLng ? listing.location : sf;
          const markers = [{ id: listing.id || 'listing', position: center, title: listing.item }];
          return (
            <div className="flex justify-center">
              <MapComponent center={center} zoom={11} markers={markers} height="320px" />
            </div>
          );
        })()}
      </section>
    </main>
  );
}