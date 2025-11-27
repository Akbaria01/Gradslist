import React from 'react';

// simple haversine distance (km)
function haversineDistance(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export default function LocationsList({ markers = [], userLocation = null, onSelect = () => {}, maxItems = 17 }) {
  const computeDistance = (m) => {
    if (!userLocation) return null;
    const km = haversineDistance(userLocation, m.position);
    return km;
  };

  // compute distances then sort ascending (closest first)
  const withDistance = markers.map((m) => {
    const km = computeDistance(m);
    return { m, km, miles: km != null ? (km * 0.621371).toFixed(1) : null };
  });

  const sorted = withDistance.sort((a, b) => {
    const ak = a.km == null ? Infinity : a.km;
    const bk = b.km == null ? Infinity : b.km;
    return ak - bk;
  });

  const displayed = sorted.slice(0, maxItems);

  return (
    <aside className="bg-white rounded shadow p-4 w-full">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold mb-3">Nearby Places</h2>
      </div>

  <div className="space-y-3 max-h-[620px] overflow-y-scroll pr-2">
        {markers.length === 0 && <div className="text-gray-500">No locations</div>}
        {displayed.map(({ m, km, miles }) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="w-full text-left p-3 rounded hover:bg-gray-50 flex justify-between items-start"
          >
            <div>
              <div className="font-medium">{m.title || 'Unnamed'}</div>
              {m.description && <div className="text-sm text-gray-600">{m.description}</div>}
            </div>
            <div className="text-sm text-gray-500">
              {m.position && km != null ? (
                <div>{miles} mi</div>
              ) : (
                <div>—</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
