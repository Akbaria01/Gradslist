import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CityAutocomplete from "../components/CityAutocomplete";
import { useLoadScript } from "@react-google-maps/api";
import { useAuth } from "../context/AuthContext";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, app } from "../firebase";

export default function CreateListings() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  React.useEffect(() => {
    return () => {
      // cleanup created object URL when component unmounts
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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

  const CONDITION_OPTIONS = [
    "New",
    "New without tags",
    "Used",
    "Used - like new",
  ];

  // load Google Maps script with Places library for the city autocomplete
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const { currentUser } = useAuth();

  function validate() {
    const e = {};
    if (!title.trim()) e.title = "Title is required";
    if (!price.trim()) e.price = "Price is required";
    return e;
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    // require logged-in user
    if (!currentUser) {
      // redirect to login
      navigate("/login");
      return;
    }

    (async () => {
      try {
        // optional image upload to Firebase Storage
        let imageURL = "";
        if (imageFile) {
          try {
            console.log("Preparing to upload image", {
              name: imageFile.name,
              type: imageFile.type,
              size: imageFile.size,
            });

            const storage = getStorage(app);
            const configuredBucket = storage?.app?.options?.storageBucket;
            if (!configuredBucket || !configuredBucket.includes("appspot")) {
              console.warn("Firebase storage bucket appears misconfigured:", configuredBucket);
            }

            const destPath = `listings/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
            console.log("Uploading to storage path:", destPath);
            const fileRef = storageRef(storage, destPath);

            const snap = await uploadBytes(fileRef, imageFile);
            console.log("uploadBytes snapshot:", snap);

            imageURL = await getDownloadURL(fileRef);
            console.log("Got downloadURL:", imageURL);
          } catch (uploadErr) {
            // more verbose logging for debugging client-side upload failures (CORS / auth / network)
            console.error("Image upload failed:", uploadErr?.code || uploadErr, uploadErr?.message || "");
            // fail gracefully: continue without image so listing can still be created
            imageURL = null;
            // surface a non-blocking error to the user
            setErrors((prev) => ({ ...prev, upload: "Image upload failed; listing created without image." }));
          }
        }

        // Resolve seller display name at creation time so ListingDetail doesn't need an extra read.
        let sellerName = currentUser.displayName || currentUser.email || null;
        try {
          // Prefer a username stored in users/{uid} if available
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userSnap.exists()) {
            const u = userSnap.data();
            sellerName = u.username || u.displayName || u.name || sellerName;
          }
        } catch (e) {
          console.warn('Could not read users/{uid} to resolve seller name:', e?.message || e);
        }

        const payload = {
          title: title,
          titleLower: title.toLowerCase(),
          price: Number(price) || price,
          description,
          category,
          subcategory,
          subcategoryLower: subcategory.toLowerCase(),
          condition,
          location,
          image: imageURL || null,
          sellerId: currentUser.uid,
          seller: sellerName || null,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "listings"), payload);

        // navigate to detail with the new doc id and payload (include id)
        navigate(`/listing/${docRef.id}`, { state: { listing: { id: docRef.id, ...payload } } });
      } catch (err) {
        console.error("Failed to create listing:", err);
        setErrors({ submit: "Failed to create listing. Try again." });
      }
    })();
  }

  return (
    <div className="bg-gray-100 p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Item For Sale</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Title and Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter your price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
              </div>
            </div>

            {/* Category and Condition Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubcategory(""); // reset subcategory when category changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>

                  {Object.keys(CATEGORY_OPTIONS).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {/* Subcategory */}
                {category && CATEGORY_OPTIONS[category] && (
                  <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a subcategory</option>
                        {CATEGORY_OPTIONS[category].map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                      ))}
                    </select>
                  </div>
                  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  {CONDITION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="flex justify-center">
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Location (city only)</label>
                {loadError ? (
                  <div className="text-sm text-red-500">Failed to load Google Maps script. Check console for errors.</div>
                ) : !isLoaded ? (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Loading map..."
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                ) : (
                  <CityAutocomplete value={location} onChange={(v) => setLocation(v)} />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter your description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="flex flex-col">
            <div className="w-full">
                <div className="bg-gray-400 rounded-lg flex items-center justify-center p-4 aspect-[4/3] relative overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-white p-8">
                      <div className="text-white mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          <path d="M12,11L16,15H13V19H11V15H8L12,11Z" />
                        </svg>
                      </div>
                      <h3 className="text-white text-xl font-semibold mb-2">Add Photos</h3>
                      <p className="text-white text-sm">JPEG or PNG — or drag and drop</p>
                    </div>
                  )}

                  {/* file input positioned over the area */}
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      setImageFile(f);
                      const url = URL.createObjectURL(f);
                      setImagePreview(url);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="mt-6 text-white font-semibold py-3 px-16 rounded-lg transition duration-200 hover:opacity-90"
                style={{ backgroundColor: '#395A7F' }}
              >
                Submit
              </button>
            </div>
          </div>
      </form>
    </div>
  );
}
