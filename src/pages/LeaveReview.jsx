import { useNavigate } from "react-router-dom";

export default function LeaveReview() {
  const navigate = useNavigate();

  const reviewsToLeave = [
    { id: 1, item: "Vintage Painting", brand: "Oil on canvas · Framed", seller: "John Doe", price: "$200", condition: "Like New", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400", posted: "2 weeks ago", distance: "4.1 miles away" },
    { id: 2, item: "Coffee Maker", brand: "Keurig · Single serve", seller: "Alice Smith", price: "$75", condition: "Good", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", posted: "1 day ago", distance: "2.5 miles away" },
    { id: 3, item: "Vintage Chair", brand: "Mid-century · Wood", seller: "Bob Johnson", price: "$120", condition: "Like New", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", posted: "3 hours ago", distance: "1.5 miles away" },
  ];

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  return (
    <div className="bg-[#eaecef] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate("/profile")}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle}`}>
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">Leave a Review</h1>
        <div className="w-24" /> {/* Placeholder to balance flex */}
      </div>

      {/* Review Items Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        {reviewsToLeave.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={item.image}
                alt={item.item}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
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
              <div className="mt-4 flex flex-col gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-[#395A7F] px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#A3CAE9]"
                >
                  Leave Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
