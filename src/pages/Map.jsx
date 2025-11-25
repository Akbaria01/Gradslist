import React, { useState } from "react";
import MapComponent from "../components/Map";
import LocationsList from "../components/LocationsList";

export default function MapPage() {
  // center on Charlotte, NC
  const center = { lat: 35.2271, lng: -80.8431 };
  // marker position data (original list)
  const charlotteLocations = [
    {
      lat: 35.3103,
      lng: -80.9595,
      address: "U.S. National Whitewater Center\n5000 Whitewater Center Pkwy\nCharlotte, NC 28214",
    },
    {
      lat: 35.1524,
      lng: -80.8326,
      address: "SouthPark Mall\n4400 Sharon Rd\nCharlotte, NC 28211",
    },
    {
      lat: 35.3517,
      lng: -80.8522,
      address: "Northlake Mall\n6801 Northlake Mall Dr\nCharlotte, NC 28216",
    },
    {
      lat: 35.2258,
      lng: -80.8528,
      address: "Bank of America Stadium\n800 S Mint St\nCharlotte, NC 28202",
    },
    {
      lat: 35.2251,
      lng: -80.8392,
      address: "Spectrum Center\n333 E Trade St\nCharlotte, NC 28202",
    },
    {
      lat: 35.2135,
      lng: -80.8275,
      address: "CPCC Central Campus\n1201 Elizabeth Ave\nCharlotte, NC 28204",
    },
    {
      lat: 35.3050,
      lng: -80.7320,
      address: "UNC Charlotte\n9201 University City Blvd\nCharlotte, NC 28223",
    },
    {
      lat: 35.2053,
      lng: -80.8392,
      address: "Atrium Health Carolinas Medical Center\n1000 Blythe Blvd\nCharlotte, NC 28203",
    },
    {
      lat: 35.2132,
      lng: -80.8249,
      address: "Novant Health Presbyterian Medical Center\n200 Hawthorne Ln\nCharlotte, NC 28204",
    },
    {
      lat: 35.1992,
      lng: -80.8452,
      address: "Freedom Park\n1900 East Blvd\nCharlotte, NC 28203",
    },
    {
      lat: 35.2937,
      lng: -80.7405,
      address: "Reedy Creek Park\n2900 Rocky River Rd\nCharlotte, NC 28215",
    },
    {
      lat: 35.2144,
      lng: -80.9473,
      address: "Charlotte Douglas International Airport\n5501 Josh Birmingham Pkwy\nCharlotte, NC 28208",
    },
    {
      lat: 35.1040,
      lng: -80.9390,
      address: "Carowinds\n300 Carowinds Blvd\nCharlotte, NC 28273",
    },
    {
      lat: 35.3369,
      lng: -80.7548,
      address: "Trader Joe's\n1820 E Arbors Dr\nCharlotte, NC 28262",
    },
    {
      lat: 35.2116,
      lng: -80.8356,
      address: "Trader Joe's\n1133 Metropolitan Ave\nCharlotte, NC 28204",
    },
    {
      lat: 35.0675,
      lng: -80.8178,
      address: "Trader Joe's\n6418 Rea Rd\nCharlotte, NC 28277",
    },
    {
      lat: 35.3286,
      lng: -80.9451,
      address: "Walmart Supercenter\n9820 Callabridge Ct\nCharlotte, NC 28216",
    },
    {
      lat: 35.1446,
      lng: -80.9344,
      address: "Walmart Supercenter\n8180 S Tryon St\nCharlotte, NC 28273",
    },
    {
      lat: 35.0906,
      lng: -80.8662,
      address: "Walmart Supercenter\n11530 N Tryon St\nCharlotte, NC 28262",
    },
    {
      lat: 35.2275,
      lng: -80.8358,
      address: "CMPD Headquarters\n601 E Trade St\nCharlotte, NC 28202",
    },
  ];

  // convert to standardized marker objects: { id, position, title, description }
  const markers = charlotteLocations.map((c, i) => ({
    id: `loc-${i}`,
    position: { lat: c.lat, lng: c.lng },
    title: (c.address || '').split('\n')[0] || `Place ${i}`,
    description: c.address,
  }));

  // fictional user location to compute distances from
  const userLocation = { lat: 35.2271, lng: -80.8431 };
  const [selectedId, setSelectedId] = useState(null);

  return (
    <main className="page-map p-4">
      <h1 className="text-2xl font-bold mb-4">Recommended Meetup Locations</h1>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3 pl-4 md:pl-8">
          <LocationsList markers={markers} userLocation={userLocation} onSelect={(id) => setSelectedId(id)} />
        </div>

        <div className="md:w-2/3 flex justify-center">
          <div style={{ width: '100%', maxWidth: 720 }}>
            <MapComponent center={center} zoom={11} markers={markers} selectedMarkerId={selectedId} height="760px" />
          </div>
        </div>
      </div>
    </main>
  );
}