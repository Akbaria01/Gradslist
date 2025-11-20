import React from "react";
import MapComponent from "../components/Map";

export default function MapPage() {
  const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco example
  const markers = [
    { id: "sf", position: { lat: 37.7749, lng: -122.4194 }, title: "San Francisco" },
  ];

  return (
    <main className="page-map" style={{ padding: 16 }}>
      <h1>Map</h1>
      <MapComponent center={center} zoom={11} markers={markers} height="600px" />
    </main>
  );
}
