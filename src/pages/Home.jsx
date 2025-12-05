// src/pages/Home.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext"; 
import { Menu, X } from "lucide-react";
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
    "Women's Clothing",
    "Men's Clothing",
    "Shoes",
    "Jewelry & Watches",
    "Bags & Accessories",
  ],
  "Baby & Kids": [
    "Baby Gear",
    "Kids' Clothing",
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

// Great-circle distance between two coords in miles
function haversineMiles(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    return null;
  }

  const R = 3958.8; // Radius of Earth in miles
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


export default function Home() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sellerRatings, setSellerRatings] = useState({}); // Store ratings by sellerId
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng } or null

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.state?.resetHome) {
      setSelectedFilter("");
      setCurrentPage(1);
      setProducts([]);
      fetchListings(null, "");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [products, setProducts] = useState([]);
    // Ask browser for current location (once on mount)
    useEffect(() => {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported in this browser.");
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          // If user denies permission, we just leave userLocation = null and show N/A
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    }, []);
  

  const [products, setProducts] = useState([]); // from Firestore
  const itemsPerPage = 12;

  const [filters, setFilters] = useState({
    distance: "any",
    minPrice: "",
    maxPrice: "",
    condition: "any",
    datePosted: "any",
  });

  const { searchQuery } = useSearch();

  // Fetch seller ratings from reviews
  const fetchSellerRatings = useCallback(async (listings) => {
    if (!listings.length) {
      setLoadingRatings(false);
      return;
    }

    try {
      const ratings = {};
      const uniqueSellerIds = [...new Set(listings.map(p => p._raw?.sellerId).filter(Boolean))];
      
      // For each unique seller, fetch their reviews and calculate average rating
      for (const sellerId of uniqueSellerIds) {
        try {
          const q = query(
            collection(db, "reviews"),
            where("reviewedUserId", "==", sellerId)
          );
          const querySnapshot = await getDocs(q);
          
          let totalRating = 0;
          let reviewCount = 0;
          
          querySnapshot.forEach((doc) => {
            const review = doc.data();
            if (review.rating) {
              totalRating += review.rating;
              reviewCount++;
            }
          });
          
          if (reviewCount > 0) {
            const averageRating = totalRating / reviewCount;
            ratings[sellerId] = Number(averageRating.toFixed(1));
          } else {
            ratings[sellerId] = 0; // No reviews yet
          }
        } catch (error) {
          console.error(`Error fetching ratings for seller ${sellerId}:`, error);
          ratings[sellerId] = 0;
        }
      }
      
      setSellerRatings(ratings);
    } catch (error) {
      console.error("Error fetching seller ratings:", error);
    } finally {
      setLoadingRatings(false);
    }
  }, []);

  // Helper: run a query and return mapped products
  const runAndMap = async (q) => {
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((doc) => {
      const data = doc.data();
      const mapped = {
        id: doc.id,
        name: data.title ?? data.name ?? "Untitled",
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
        description: data.description ?? "",
        seller: data.seller || data.sellerName || "Seller",
        sellerId: data.sellerId,
        sellerProfilePic: data.sellerProfilePic || null,
        location: data.location || "",
        _raw: data,
      };
      results.push(mapped);
    });
    return results;
  };

  // Fetch listings from Firestore
  const fetchListings = useCallback(
    async (filter = selectedFilter, search = searchQuery) => {
      try {
        let finalResults = [];
        const hasSearch = typeof search === "string" && search.trim().length > 0;
        const s = hasSearch ? search.trim().toLowerCase() : null;

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

        // CASE 1 — NO FILTER
        if (!filter) {
          if (hasSearch) {
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
          fetchSellerRatings(finalResults);
          setCurrentPage(1);
          return;
        }

        // CASE 2 — FILTER ACTIVE
        const normalizedFilter = filter.toLowerCase();
        const qSub = query(
          collection(db, "listings"),
          where("subcategoryLower", "==", normalizedFilter),
          limit(1000)
        );

        let subResults = await runAndMap(qSub);

        if (subResults.length === 0) {
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
        fetchSellerRatings(finalResults);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setProducts([]);
        setLoadingRatings(false);
      }
    },
    [selectedFilter, searchQuery, fetchSellerRatings]
  );

  // Fetch on mount
  useEffect(() => {
    fetchListings(null, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When searchQuery changes
  useEffect(() => {
    fetchListings(selectedFilter, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle subcategory click
  const handleSubcategoryClick = async (sub) => {
    const normalized = sub.toLowerCase();
    setSelectedFilter(normalized);
    await fetchListings(normalized, searchQuery);
  };

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const numericPrice = p.price
        ? Number(String(p.price).replace(/[^0-9.]/g, "")) || 0
        : 0;

      if (filters.minPrice && numericPrice < Number(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && numericPrice > Number(filters.maxPrice)) {
        return false;
      }

      const rawCondition =
        (p._raw?.condition || p.condition || "").toString().toLowerCase();

      if (filters.condition !== "any" && rawCondition) {
        if (rawCondition !== filters.condition) {
          return false;
        }
      }

  
           // ---- DISTANCE filter ----
           if (filters.distance !== "any") {
            let distNum = null;
    
            // 1) Try real GPS distance using coords
            const coords = p._raw?.locationCoords;
            if (
              userLocation &&
              coords &&
              typeof coords.lat === "number" &&
              typeof coords.lng === "number"
            ) {
              const d = haversineMiles(
                userLocation.lat,
                userLocation.lng,
                coords.lat,
                coords.lng
              );
              if (!Number.isNaN(d)) {
                distNum = d;
              }
            } else {
              // 2) Fallback: use stored distance field if present
              const rawDistance = p._raw?.distance ?? p.distance ?? null;
              if (rawDistance !== null && rawDistance !== "") {
                distNum =
                  typeof rawDistance === "number"
                    ? rawDistance
                    : Number(String(rawDistance).replace(/[^0-9.]/g, ""));
              }
            }
    
            const maxMiles = Number(filters.distance); // "1", "3", "5"
    
            if (
              distNum !== null &&
              !Number.isNaN(distNum) &&
              distNum > maxMiles
            ) {
              return false;
            }
          }
    
  
      // ---- DATE POSTED filter ----
      if (filters.datePosted !== "any") {
        const raw = p._raw || {};
        const ts = raw.createdAt || raw.postedAt || p.createdAt;

        if (ts) {
          const d = ts.toDate ? ts.toDate() : new Date(ts);
          const diffMs = Date.now() - d.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (filters.datePosted === "24h" && diffDays > 1) return false;
          if (filters.datePosted === "3d" && diffDays > 3) return false;
          if (filters.datePosted === "7d" && diffDays > 7) return false;
          if (filters.datePosted === "30d" && diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [products, filters]);
  }, [products, filters, userLocation]);
  
  

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Helper to render star rating - updated to show actual ratings
  function renderStars(ratingValue = 0) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-sm ${i <= ratingValue ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return stars;
  }

  // Calculate distance - keep random for now since we don't have real location data
  const randomMeta = useMemo(() => {
    const map = {};
    filteredProducts.forEach((p) => {
      const id = p.id || JSON.stringify(p).slice(0, 8);
      const distance = (Math.random() * 5 + 1).toFixed(1); // 1.0..6.0
      map[id] = { distance };
      const rating = Math.floor(Math.random() * 3) + 3; // 3..5
      map[id] = { rating };
    });
    return map;
  }, [filteredProducts]);

  function formatPosted(product) {
    const raw = product._raw || {};
    const ts = raw.createdAt || raw.postedAt || product.createdAt;

    if (!ts) {
      return product.posted || "";
    }

    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMinutes / 60;
    const diffDays = diffHours / 24;

    if (diffMinutes < 60) {
      const m = Math.max(1, Math.round(diffMinutes));
      return `${m} min${m === 1 ? "" : "s"} ago`;
    }
    if (diffHours < 24) {
      const h = Math.round(diffHours);
      return `${h} hour${h === 1 ? "" : "s"} ago`;
    }
    if (diffDays < 7) {
      const d = Math.round(diffDays);
      return `${d} day${d === 1 ? "" : "s"} ago`;
    }
    if (diffDays < 30) {
      const w = Math.round(diffDays / 7);
      return `${w} week${w === 1 ? "" : "s"} ago`;
    }
    const months = Math.round(diffDays / 30);
    if (months < 12) {
      return `${months} month${months === 1 ? "" : "s"} ago`;
    }
    const years = Math.round(diffDays / 365);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }

  return (
    <div className="bg-[#eaecef] min-h-screen overflow-x-hidden">
      {/* -------- SUBHEADER -------- */}
      <div className="bg-[#eaecef] border-b border-gray-300 shadow-sm w-full">
        <div className="py-4 px-4 lg:px-10">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-nowrap gap-x-8 justify-center relative">
            {Object.keys(CATEGORY_OPTIONS).map((category) => (
              <div key={category} className="relative group">
                <span className="whitespace-nowrap text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">
                  {category}
                </span>
                <ul
                  className={`
                    absolute mt-2 w-48 bg-white shadow-lg rounded-md
                    opacity-0 invisible 
                    group-hover:opacity-100 group-hover:visible 
                    transition-all duration-200 z-50
                    pointer-events-auto
                    ${category === 'More' ? 'right-0' : 'left-0'}
                  `}
                >
                  {CATEGORY_OPTIONS[category].map((sub) => (
                    <li
                      key={sub}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
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

          {/* Responsive Navigation */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Categories</span>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-gray-900"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {isMobileMenuOpen && (
              <div className="mt-4 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                {Object.keys(CATEGORY_OPTIONS).map((category) => (
                  <div key={category} className="border-b border-gray-100 last:border-b-0">
                    <div
                      className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 cursor-pointer"
                      onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                    >
                      <div className="flex items-center justify-between">
                        {category}
                        <span className={`transform transition-transform ${activeCategory === category ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>
                    {activeCategory === category && (
                      <div className="bg-white">
                        {CATEGORY_OPTIONS[category].map((sub) => (
                          <div
                            key={sub}
                            className="px-6 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-l-2 border-transparent hover:border-blue-500"
                            onClick={() => {
                              handleSubcategoryClick(sub);
                              setCurrentPage(1);
                              setIsMobileMenuOpen(false);
                              setActiveCategory(null);
                            }}
                          >
                            {sub}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-2 min-h-[calc(100vh-200px)] flex flex-col">
        {/* Title + Filter + Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {selectedFilter ? selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) : 'Trending products'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse items posted near you.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 hover:bg-gray-50 flex items-center justify-between"
            >
              Filters
              <span className="ml-2 inline-block h-2 w-2 rotate-45 border-b border-r border-gray-500" />
            </button>

            <div className="relative">
              <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 appearance-none">
                <option value="recent">Sort: Most recent</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
                <option value="nearest">Nearest distance</option>
              </select>
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 inline-block h-2 w-2 rotate-45 border-b border-r border-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* No results message */}
        {products.length === 0 && (
          <div className="text-center py-16 text-gray-600 text-xl px-4">
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
        
        {/* Listing cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4 lg:px-6">
          {currentProducts.map((product) => {
            const meta = randomMeta[product.id] || { distance: "2.3" };
            const sellerName = product.seller || product._raw?.seller || "Seller";
            const sellerPic = product.sellerProfilePic || product._raw?.sellerProfilePic || null;
            const sellerId = product.sellerId || product._raw?.sellerId;
            
            // Get seller rating from fetched ratings
            const sellerRating = sellerId ? sellerRatings[sellerId] || 0 : 0;
            const ratingValue = sellerRating > 0 ? sellerRating : 0;
            const meta = randomMeta[product.id] || { rating: "4.6" };

            let distanceMiles = null;
            const coords = product._raw?.locationCoords;

            if (
              userLocation &&
              coords &&
              typeof coords.lat === "number" &&
              typeof coords.lng === "number"
            ) {
              const d = haversineMiles(
                userLocation.lat,
                userLocation.lng,
                coords.lat,
                coords.lng
              );
              if (!Number.isNaN(d)) {
                distanceMiles = d.toFixed(1); // e.g., "2.3"
              }
            } else {
              // fallback to stored distance
              const stored = product._raw?.distance ?? product.distance ?? null;
              if (stored !== null && stored !== "") {
                distanceMiles = stored;
              }
            }

            const sellerName =
              product.seller ||
              product._raw?.seller ||
              product._raw?.sellerName ||
              "Seller";

            const sellerPic =
              product.sellerProfilePic ||
              product._raw?.sellerProfilePic ||
              null;

            const city =
              (product.location || product._raw?.location || "")
                .toString()
                .replace(/\n+/g, " ")
                .split(",")[0]
                .replace(/\s+/g, " ")
                .trim() || "Unknown";

            return (
              <div
                key={product.id}
                className="group relative flex flex-col h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {/* Username + stars above image - NOW WITH REAL RATINGS */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {sellerPic ? (
                      <img
                        src={sellerPic}
                        alt={sellerName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        {sellerName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-900">{sellerName}</div>
                  </div>

                  <div className="text-sm">
                    {renderStars(ratingValue)}
                    {sellerRating > 0 && (
                      <span className="ml-1 text-xs text-gray-500">
                        {sellerRating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Image left, info right on larger screens */}
                <div className="flex flex-col md:flex-row gap-4 h-full items-stretch">
                  {/* Image */}
                  <div className="md:w-1/2 w-full overflow-hidden rounded-lg bg-gray-100 h-[220px] md:h-full">
                    <img
                      src={product.image}
                      alt={product.alt}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>

                  {/* Info column */}
                  <div className="flex-1 flex flex-col justify-between md:py-1 h-full">
                    {/* Top block: title + price + location */}
                    <div>
                      <h3
                        className="text-sm font-semibold text-gray-900 h-[48px]"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {product.name || product.title || 'Untitled'}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-gray-900">{product.price}</p>
                      <p className="mt-1 text-xs text-gray-500">Location: {city}</p>
                    </div>

                    {/* Bottom block */}
                    <div className="pt-2">
                      <div className="text-xs text-gray-500">Posted {formatPosted(product)}</div>
                      <div className="mt-1 text-xs text-gray-500">Distance: {meta.distance} mi</div>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            const payload = product._raw
                              ? { id: product.id, ...product._raw }
                              : { id: product.id, ...product };
                            navigate(`/listing/${product.id}`, { state: { listing: payload } });
                          }}
                          className="w-full inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            {/* Bottom block: uniform placement */}
            <div className="pt-2">
              <div className="text-xs text-gray-500">Posted {formatPosted(product)}</div>
               {/* <div className="mt-1 text-xs text-gray-500">Distance: {meta.distance} mi</div>  */}
            <div className="mt-1 text-xs text-gray-500">
              Distance:{" "}
              {distanceMiles !== null && distanceMiles !== ""
                ? `${distanceMiles} mi`
                : "N/A"}
            </div>

              <div className="mt-3">
                <button
                  onClick={() => {
                    const payload = product._raw
                      ? { id: product.id, ...product._raw }
                      : { id: product.id, ...product };
                    navigate(`/listing/${product.id}`, { state: { listing: payload } });
                  }}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                >
                  View details
                </button>
              </div>
            );
          })}
        </div>   

        <div className="flex-1"></div>
      </div>
      
      {/* Pagination */}
      {true && (
        <div className="flex items-center justify-center px-4 lg:px-6 py-8">
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
      )}

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
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={filters.distance}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, distance: e.target.value }))
                  }
                >
                  <option value="any">Any distance</option>
                  <option value="1">Within 1 mile</option>
                  <option value="3">Within 3 miles</option>
                  <option value="5">Within 5 miles</option>
                </select>
              </div>
      <div className="mt-4 space-y-4">
        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Distance
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={filters.distance}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, distance: e.target.value }))
            }
          >
            <option value="any">Any distance</option>
            <option value="5">Within 5 mile</option>
            <option value="10">Within 10 miles</option>
            <option value="15">Within 15 miles</option>
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
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={filters.condition}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, condition: e.target.value }))
                  }
                >
                  <option value="used">Used</option>
                  <option value="new">New</option>
                  <option value="new without tags">New without tags</option>
                  <option value="Used - like new">Used - like new</option>
                </select>
              </div>

              {/* Date posted */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date posted
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  value={filters.datePosted}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, datePosted: e.target.value }))
                  }
                >
                  <option value="any">Any time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="3d">Last 3 days</option>
                  <option value="7d">Last week</option>
                  <option value="30d">Last month</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setFilters({
                    distance: "any",
                    minPrice: "",
                    maxPrice: "",
                    condition: "any",
                    datePosted: "any",
                  });
                  setCurrentPage(1);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  setIsFilterOpen(false);
                }}
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


