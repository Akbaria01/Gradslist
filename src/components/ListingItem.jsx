import React from "react";
import { Link } from "react-router-dom";

/**
 * ListingItem
 * Props:
 *  - listing: { id, item, brand, seller, price, condition, image, posted, distance }
 * Renders a clickable card linking to /listing/:id
 */
export default function ListingItem({ listing }) {
  if (!listing) return null;

  const {
    id,
    item = "Untitled",
    brand = "",
    seller = "",
    price = "",
    condition = "",
    image = "",
    posted = "",
    distance = "",
  } = listing;

  return (
    <Link to={`/listing/${id}`} className="block">
      <article className="flex gap-4 p-4 bg-white rounded shadow-sm hover:shadow-md transition">
        <div className="w-28 h-28 flex-shrink-0 overflow-hidden rounded">
          <img src={image} alt={item} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{item}</h3>
              {brand && <div className="text-sm text-gray-500">{brand}</div>}
            </div>
            <div className="text-lg font-bold">{price}</div>
          </div>

          <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
            <span>{condition}</span>
            <span>&middot;</span>
            <span>{seller}</span>
            <span>&middot;</span>
            <span>{posted}</span>
            <span>&middot;</span>
            <span>{distance}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
