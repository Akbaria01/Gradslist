export default function SavedItems() {
  const savedItems = [
    { id: 1, item: "Wireless Headphones", brand: "Sony · Noise cancelling", seller: "Emma Brown", price: "$150", condition: "Excellent", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", posted: "3 days ago", distance: "1.2 miles away" },
    { id: 2, item: "Running Shoes", brand: "Nike · Size 10", seller: "Liam Wilson", price: "$65", condition: "Good", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", posted: "2 days ago", distance: "2.1 miles away" },
    { id: 3, item: "Board Game Set", brand: "Monopoly · Complete", seller: "Sophia Martinez", price: "$25", condition: "Like New", image: "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400", posted: "5 days ago", distance: "1.8 miles away" },
  ];

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>Back</button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">Saved Items</h1>
        <div className="w-24" /> {/* Placeholder to balance flex */}
      </div>

      {/* Saved Items Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedItems.map((item) => (
          <div key={item.id} className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <img src={item.image} alt={item.item} className="h-full w-full object-cover transition group-hover:scale-105" />
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.item}</h3>
                  <p className="mt-1 text-xs text-gray-500">Seller: {item.seller}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.condition}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{item.price}</p>
              </div>
              <div className="mt-3 text-xs text-gray-500 flex justify-between">
                <span>Posted {item.posted}</span>
                <span>{item.distance}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="text-xs text-sky-600 hover:underline">View</button>
                <button className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

