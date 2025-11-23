import { useState } from "react";

const CATEGORIES = [
  "Electronics & Media",
  "Home & Garden",
  "Clothing, Shoes, & Accessories",
  "Baby & Kids",
  "Vehicles",
  "Toys, Games, & Hobbies",
  "Sports & Outdoors",
  "Collectibles & Art",
  "Pet supplies",
  "More",
];

export default function Home() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const allProducts = [
    { id: 1, name: "Gaming Laptop", brand: "Dell · 16GB RAM", price: "$850", posted: "1 day ago", distance: "0.8 miles away", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400", alt: "Gaming laptop" },
    { id: 2, name: "Vintage Chair", brand: "Mid-century · Wood", price: "$120", posted: "3 hours ago", distance: "1.5 miles away", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", alt: "Vintage chair" },
    { id: 3, name: "Running Shoes", brand: "Nike · Size 10", price: "$65", posted: "2 days ago", distance: "2.1 miles away", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", alt: "Running shoes" },
    { id: 4, name: "Acoustic Guitar", brand: "Yamaha · Excellent condition", price: "$180", posted: "4 days ago", distance: "0.3 miles away", image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400", alt: "Guitar" },
    { id: 5, name: "Mountain Bike", brand: "Trek · 21 speed", price: "$320", posted: "1 week ago", distance: "3.2 miles away", image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400", alt: "Mountain bike" },
    { id: 6, name: "Board Game Set", brand: "Monopoly · Complete", price: "$25", posted: "5 days ago", distance: "1.8 miles away", image: "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400", alt: "Board games" },
    { id: 7, name: "Basketball", brand: "Spalding · Official size", price: "$15", posted: "6 hours ago", distance: "0.9 miles away", image: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400", alt: "Basketball" },
    { id: 8, name: "Vintage Painting", brand: "Oil on canvas · Framed", price: "$200", posted: "2 weeks ago", distance: "4.1 miles away", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400", alt: "Vintage painting" },
    { id: 9, name: "Wireless Headphones", brand: "Sony · Noise cancelling", price: "$150", posted: "3 days ago", distance: "1.2 miles away", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", alt: "Headphones" },
    { id: 10, name: "Coffee Maker", brand: "Keurig · Single serve", price: "$75", posted: "1 day ago", distance: "2.5 miles away", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", alt: "Coffee maker" },
    { id: 11, name: "Basketball", brand: "Spalding · Official size", price: "$15", posted: "6 hours ago", distance: "0.9 miles away", image: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400", alt: "Basketball" },
    { id: 12, name: "Vintage Painting", brand: "Oil on canvas · Framed", price: "$200", posted: "2 weeks ago", distance: "4.1 miles away", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400", alt: "Vintage painting" },
    { id: 13, name: "Wireless Headphones", brand: "Sony · Noise cancelling", price: "$150", posted: "3 days ago", distance: "1.2 miles away", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", alt: "Headphones" },
    { id: 14, name: "Coffee Maker", brand: "Keurig · Single serve", price: "$75", posted: "1 day ago", distance: "2.5 miles away", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", alt: "Coffee maker" }
  ];

  const totalPages = Math.ceil(allProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = allProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-[#eaecef] min-h-screen">
      {/* Top navigation bar */}
      <div className="bg-[#eaecef] border-b border-gray-300 shadow-sm w-full">
        <div className="py-4 px-10">
          <nav className="flex flex-nowrap gap-x-8 justify-center">
            {CATEGORIES.map((category) => (
              <a
                key={category}
                href="#"
                className="whitespace-nowrap text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {category}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Title + Filter + Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Trending products
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse items posted near you.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <span className="mr-2 inline-block h-4 w-4 rotate-45 border-b-2 border-r-2 border-gray-500" />
              Filters
            </button>

            <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
              <option value="recent">Sort: Most recent</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
              <option value="nearest">Nearest distance</option>
            </select>
          </div>
        </div>

        {/* Listing cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 px-6">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={product.image}
                  alt={product.alt}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.brand}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {product.price}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Posted {product.posted}</span>
                  <span>{product.distance}</span>
                </div>
                <button className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]">
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center mt-8 mb-16 px-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPage === page
                    ? "text-white bg-[#395A7F] border border-[#395A7F]"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Distance
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                  <option>Any distance</option>
                  <option>Within 1 mile</option>
                  <option>Within 3 miles</option>
                  <option>Within 5 miles</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price range ($)
                </label>
                <div className="mt-1 flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                  <option>Any condition</option>
                  <option>New</option>
                  <option>Like new</option>
                  <option>Good</option>
                  <option>Fair</option>
                </select>
              </div>

              {/* Date posted */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date posted
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500">
                  <option>Any time</option>
                  <option>Last 24 hours</option>
                  <option>Last 3 days</option>
                  <option>Last week</option>
                  <option>Last month</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="rounded-lg bg-[#395A7F] px-4 py-2 text-sm font-medium text-white hover:bg-[#A3CAE9]"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
