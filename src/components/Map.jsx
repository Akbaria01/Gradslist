import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";

export default function MapComponent({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 12,
  markers = [], // expected: [{ id, position: {lat,lng}, title, description, placeId? }]
  selectedMarkerId = null,
  height = "500px",
  onMapClick = null,
  options = {},
}) {
  // load Places library so we can optionally fetch place details
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // hooks must be stable and declared before returns
  const [mapRef, setMapRef] = useState(null);
  const [placeInfo, setPlaceInfo] = useState(null); // { id, position, details, displayName }

  // If the parent provides a new center, pan the map to it when possible.
  useEffect(() => {
    if (!mapRef || !center) return;
    try {
      mapRef.panTo(center);
      if (mapRef.setZoom) mapRef.setZoom(11);
    } catch (e) {
      // ignore pan errors
    }
  }, [mapRef, center]);

  useEffect(() => {
    if (!selectedMarkerId || !mapRef) return;
    const m = markers.find((x) => x.id === selectedMarkerId);
    if (!m) return;
    try {
      mapRef.panTo(m.position);
      if (mapRef.setZoom) mapRef.setZoom(14);
    } catch (e) {
      // ignore
    }
  // open InfoWindow with fallback content and try to fetch details
  setPlaceInfo({ id: m.id, position: m.position, details: null, displayName: m.title, fallback: m });
  // If the marker already includes a local description/address, prefer that and skip Places lookup.
  if (m.description) return;
  // attempt to fetch Google Places details (best-effort)
  if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.PlacesService(mapRef);
      if (m.placeId) {
        service.getDetails({ placeId: m.placeId }, (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPlaceInfo((prev) => ({ ...prev, details: result, displayName: result.name || prev.displayName }));
          }
        });
      } else {
        service.nearbySearch({ location: m.position, radius: 200 }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const chosen = results[0];
            service.getDetails({ placeId: chosen.place_id }, (result, s2) => {
              if (s2 === window.google.maps.places.PlacesServiceStatus.OK) {
                setPlaceInfo((prev) => ({ ...prev, details: result, displayName: result.name || prev.displayName }));
              }
            });
          }
        });
      }
    }
  }, [selectedMarkerId, mapRef, markers]);

  if (loadError) return <div>Map failed to load: {String(loadError)}</div>;
  if (!isLoaded) return <div>Loading map…</div>;

  const handleMarkerClick = (m) => {
    // open InfoWindow and try to fetch place details similar to selection behavior
  setPlaceInfo({ id: m.id, position: m.position, details: null, displayName: m.title, fallback: m });
  // If marker supplies a description/address we trust it and skip external lookup
  if (m.description) return;
  if (mapRef && window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.PlacesService(mapRef);
      if (m.placeId) {
        service.getDetails({ placeId: m.placeId }, (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPlaceInfo((prev) => ({ ...prev, details: result, displayName: result.name || prev.displayName }));
          }
        });
      } else {
        service.nearbySearch({ location: m.position, radius: 200 }, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const chosen = results[0];
            service.getDetails({ placeId: chosen.place_id }, (result, s2) => {
              if (s2 === window.google.maps.places.PlacesServiceStatus.OK) {
                setPlaceInfo((prev) => ({ ...prev, details: result, displayName: result.name || prev.displayName }));
              }
            });
          }
        });
      }
    }
  };

  return (
    <div style={{ width: "100%", height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={zoom}
        options={options}
        onLoad={(map) => setMapRef(map)}
        onClick={(e) => {
          setPlaceInfo(null);
          if (onMapClick) onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            title={m.title}
            onClick={() => handleMarkerClick(m)}
          />
        ))}

        {placeInfo && (
          <InfoWindow position={placeInfo.position} onCloseClick={() => setPlaceInfo(null)}>
            <div style={{ maxWidth: 320 }}>
              <strong>{placeInfo.displayName}</strong>
              {placeInfo.details && placeInfo.details.formatted_address && (
                <div style={{ marginTop: 6 }}>{placeInfo.details.formatted_address}</div>
              )}
              {placeInfo.details && placeInfo.details.rating && (
                <div style={{ marginTop: 6 }}>Rating: {placeInfo.details.rating}</div>
              )}
              {placeInfo.details && placeInfo.details.website && (
                <div style={{ marginTop: 6 }}>
                  <a href={placeInfo.details.website} target="_blank" rel="noreferrer">Website</a>
                </div>
              )}
              {placeInfo.details && (
                <div style={{ marginTop: 6 }}>
                  <a href={`https://www.google.com/maps/place/?q=place_id:${placeInfo.details.place_id}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
                </div>
              )}
              {!placeInfo.details && placeInfo.fallback && placeInfo.fallback.description && (
                <div style={{ marginTop: 6 }}>{placeInfo.fallback.description}</div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
