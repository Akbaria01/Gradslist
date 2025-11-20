import { Link } from "react-router-dom";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

export default function MapComponent({
  center = { lat: 37.7749, lng: -122.4194 },
  zoom = 12,
  markers = [],
  height = "500px",
  onMapClick = null,
  options = {},
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });
  if (loadError) return <div>Map failed to load: {String(loadError)}</div>;
  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <div style={{ width: "70%", height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={zoom}
        options={options}
        onClick={(e) => {
          if (onMapClick) onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id ?? `${m.position.lat}-${m.position.lng}`}
            position={m.position}
            title={m.title}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

