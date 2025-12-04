// src/pages/Home.jsx
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext"; 
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

const CATEGORY_OPTIONS = {
  "Electronics & Media": [
    "Phones & Accessories",
    "Computers & Laptops",
    "Cameras & Photo",
    "Video Games & Consoles",
    "Audio Equipment",
    "TVs & Home Theater",
  ],
  "Home & Garden": [
    "Furniture",
    "Kitchen & Dining",
    "Appliances",
    "Decor",
    "Lawn & Garden",
    "Tools",
  ],
  "Clothing, Shoes, & Accessories": [
    "Women’s Clothing",
    "Men’s Clothing",
    "Shoes",
    "Jewelry & Watches",
    "Bags & Accessories",
  ],
  "Baby & Kids": [
    "Baby Gear",
    "Kids’ Clothing",
    "Toys",
    "Strollers & Car Seats",
    "Nursery Furniture",
  ],
  Vehicles: ["Cars", "Trucks", "Motorcycles", "Auto Parts", "Tires & Wheels"],
  "Toys, Games, & Hobbies": [
    "Board Games",
    "Action Figures",
    "Trading Cards",
    "Crafts & Hobbies",
    "Puzzles",
    "Outdoor Toys",
  ],
  "Sports & Outdoors": [
    "Exercise Equipment",
    "Bicycles",
    "Camping & Hiking",
    "Fishing",
    "Team Sports Gear",
  ],
  "Collectibles & Art": [
    "Paintings & Prints",
    "Antiques",
    "Vintage Items",
    "Handmade Art",
    "Memorabilia",
  ],
  "Pet supplies": [
    "Dog Supplies",
    "Cat Supplies",
    "Fish & Reptile",
    "Bird Supplies",
    "Pet Food",
  ],
  More: [
    "Books & Stationery",
    "Musical Instruments",
    "Health & Beauty",
    "Office Supplies",
    "Miscellaneous",
  ],
};

export default function Home() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.state?.resetHome) {
    // reset filters & reload backend
      setSelectedFilter("");
      setCurrentPage(1);
      setProducts([]);
      fetchListings(null, "");

    // remove reset flag so it doesn't run again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [products, setProducts] = useState([]); // from Firestore
  const itemsPerPage = 8;

  // SearchContext from your header
  const { searchQuery } = useSearch();

  // Helper: run a query and return mapped products
  const runAndMap = async (q) => {

    const snap = await getDocs(q);
    const results = [];
    snap.forEach((doc) => {
      const data = doc.data();
      // map Firestore fields to the UI fields your page expects
      const mapped = {
        id: doc.id,
        // UI expects `name` for the card title — map from title/name
        name: data.title ?? data.name ?? "Untitled",
        // keep brand separate; don't fall back to description
        brand: data.brand ?? data.subtitle ?? "",
        price:
          data.price !== undefined
            ? typeof data.price === "number"
              ? `$${data.price}`
              : data.price
            : data.priceText ?? "$0",
        posted: data.postedText ?? (data.postedAt ? "recent" : "some time ago"),
        distance: data.distance ?? "",
        image: data.imageUrl ?? data.image ?? data.photoUrl ?? "",
        alt: data.title ?? data.name ?? "listing image",
        // keep description in raw if needed, but don't show it on the card
        description: data.description ?? "",
        // preserve original doc data if needed later
        _raw: data,
      };
      results.push(mapped);
    });
    return results;
  };

  // Fetch listings from Firestore depending on selectedFilter and search

  const fetchListings = useCallback(
  async (filter = selectedFilter, search = searchQuery) => {
    try {
      let finalResults = [];

      // normalize search
      const hasSearch =
        typeof search === "string" && search.trim().length > 0;
      const s = hasSearch ? search.trim().toLowerCase() : null;

      // Firestore query builder
      const buildEqualityQuery = (field, value) => {
        const ref = collection(db, "listings");

        if (!value) {
          try {
            return query(ref, orderBy("createdAt", "desc"), limit(1000));
          } catch {
            return query(ref, limit(1000));
          }
        }

        if (hasSearch) {
          const start = s;
          const end = s + "\uf8ff";

          try {
            return query(
              ref,
              where(field, "==", value),
              where("titleLower", ">=", start),
              where("titleLower", "<=", end),
              orderBy("titleLower"),
              limit(1000)
            );
          } catch {
            return query(ref, where(field, "==", value), limit(1000));
          }
        } else {
          return query(ref, where(field, "==", value), limit(1000));
        }
      };

      // -----------------------------
      // CASE 1 — NO FILTER
      // -----------------------------
      if (!filter) {
        if (hasSearch) {
          // search by prefix
          try {
            const q = query(
              collection(db, "listings"),
              where("titleLower", ">=", s),
              where("titleLower", "<=", s + "\uf8ff"),
              orderBy("titleLower"),
              limit(1000)
            );
            finalResults = await runAndMap(q);
          } catch {
            const qAll = query(collection(db, "listings"), limit(1000));
            const all = await runAndMap(qAll);
            finalResults = all.filter((p) =>
              p.name?.toLowerCase().includes(s)
            );
          }
        } else {
          // fetch all
          const q = (() => {
            try {
              return query(
                collection(db, "listings"),
                orderBy("createdAt", "desc"),
                limit(1000)
              );
            } catch {
              return query(collection(db, "listings"), limit(1000));
            }
          })();

          finalResults = await runAndMap(q);
        }

        setProducts(finalResults);
        setCurrentPage(1);
        return;
      }

      // -----------------------------
      // CASE 2 — FILTER ACTIVE
      // Fix = lowercase compare fallback
      // -----------------------------

      const normalizedFilter = filter.toLowerCase();

      // Try subcategory first
      const qSub = query(
        collection(db, "listings"),
        where("subcategoryLower", "==", normalizedFilter),
        limit(1000)
      );

      let subResults = await runAndMap(qSub);

      if (subResults.length === 0) {
        // fallback: manually match lowercase
        const qAll = query(collection(db, "listings"), limit(1000));
        const all = await runAndMap(qAll);

        subResults = all.filter((p) => {
          const raw = p._raw || {};
          return (
            raw.subcategory?.toLowerCase() === normalizedFilter ||
            raw.category?.toLowerCase() === normalizedFilter
          );
        });
      }

      finalResults = subResults;

      // If still empty AND search is active, do global search
      if (finalResults.length === 0 && hasSearch) {
        try {
          const q = query(
            collection(db, "listings"),
            where("titleLower", ">=", s),
            where("titleLower", "<=", s + "\uf8ff"),
            orderBy("titleLower"),
            limit(1000)
          );

          const global = await runAndMap(q);
          finalResults = global.filter((p) => {
            const raw = p._raw || {};
            return (
              raw.subcategory?.toLowerCase() === normalizedFilter ||
              raw.category?.toLowerCase() === normalizedFilter
            );
          });
        } catch {
          finalResults = [];
        }
      }

      setProducts(finalResults);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setProducts([]);
    }
  },
  [selectedFilter, searchQuery]
);


  // Fetch on mount (load ALL listings)
  useEffect(() => {
    fetchListings(null, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // When searchQuery changes (Header sets it), always query backend
  useEffect(() => {
    fetchListings(selectedFilter, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // When selectedFilter changes due to clicking subcategory, fetchListings will be called
  // We call fetchListings on click handler directly to ensure clicking same filter re-fetches
  const handleSubcategoryClick = async (sub) => {
  const normalized = sub.toLowerCase();
  setSelectedFilter(normalized);
  await fetchListings(normalized, searchQuery);
};

  // -------------------------
  // Pagination (client-side slice of backend results)
  // -------------------------
  const filteredProducts = products; // products already come from backend
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  

  // Keep all JSX identical to original — only data source changed
  return (
    <div className="bg-[#eaecef] min-h-screen">
      {/* -------- SUBHEADER -------- */}
      <div className="bg-[#eaecef] border-b border-gray-300 shadow-sm w-full">
        <div className="py-4 px-10">
          <nav className="flex flex-nowrap gap-x-8 justify-center relative">
            {Object.keys(CATEGORY_OPTIONS).map((category) => (
              <div key={category} className="relative group">
                {/* CATEGORY LABEL */}
                <span className="whitespace-nowrap text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">
                  {category}
                </span>


                {/* FIXED DROPDOWN  */}
                <ul
                  className="
                    absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md
                    opacity-0 invisible 
                    group-hover:opacity-100 group-hover:visible 
                    transition-all duration-200 z-50
                    pointer-events-auto
                  "
                >
                  {CATEGORY_OPTIONS[category].map((sub) => (
                    <li
                      key={sub}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // Use the handler that ALWAYS fetches backend (even if clicking same)
                        handleSubcategoryClick(sub);
                        setCurrentPage(1);
                      }}
                    >
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
      {/* ---------- NO RESULTS MESSAGE GOES HERE ---------- */}
      {products.length === 0 && (
        <div className="text-center py-16 text-gray-600 text-lg">
          {selectedFilter ? (
            <>
              <p>No items listed under:</p>
              <p className="font-semibold">{selectedFilter}</p>
            </>
          ) : (
            <p>No items listed</p>
          )}
        </div>
      )}


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
                    <p className="mt-1 text-xs text-gray-500">{product.brand}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {product.price}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Posted {product.posted}</span>
                  <span>{product.distance}</span>
                </div>
                <button
                  onClick={() => {
                    const payload = product._raw ? { id: product.id, ...product._raw } : { id: product.id, ...product };
                    navigate(`/listing/${product.id}`, { state: { listing: payload } });
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                >
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


