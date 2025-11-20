export default function MyListings() {
  const listings = [
    { id: 1, name: "Gaming Laptop", price: "$850", condition: "Like New", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", brand: "Dell · 16GB RAM", posted: "1 day ago" },
    { id: 2, name: "Mountain Bike", price: "$320", condition: "Good", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400", brand: "Trek · 21 speed", posted: "1 week ago" },
    { id: 3, name: "Acoustic Guitar", price: "$180", condition: "Excellent", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400", brand: "Yamaha", posted: "4 days ago" },
  ];

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>Back</button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">My Listings</h1>
        <div className="w-24" /> {/* Placeholder to balance flex */}
      </div>

      {/* Listings Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((item) => (
          <div key={item.id} className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover transition group-hover:scale-105" />
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.condition}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{item.price}</p>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <span>Posted {item.posted}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="text-xs text-sky-600 hover:underline">View</button>
                <button className="text-xs text-sky-600 hover:underline">Edit</button>
                <button className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
