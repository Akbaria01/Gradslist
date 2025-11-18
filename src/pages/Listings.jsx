import { useSearch } from "../context/SearchContext.jsx";

export default function Listings() {
  const { searchQuery } = useSearch();

  const items = [
    { id: 1, title: "IKEA Table" },
    { id: 2, title: "MacBook Pro" },
    { id: 3, title: "Bike for Sale" },
    { id: 4, title: "Dorm Mini Fridge" },
  ];

  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>Listings</h1>

      {filtered.length === 0 ? (
        <p>No results found.</p>
      ) : (
        filtered.map(item => <p key={item.id}>{item.title}</p>)
      )}
    </div>
  );
}
