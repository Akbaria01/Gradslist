import { Link } from "react-router-dom";
import { Home, User, MapPin, MessageSquare, Pencil } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import logo from "../assets/images/logo.svg";
import "../styles/header.css";

export default function Header() {
  const { setSearchQuery } = useSearch();

  return (
    <header className="header">
      
      {/* LEFT — Logo */}
      <div className="header-left">
        <img src={logo} alt="Logo" className="header-logo" />
        <Link to="/" className="header-nav-link" style={{ flexDirection: "row", fontSize: "50px" }}>
        </Link>
      </div>

      {/* CENTER — Search Bar */}
      <div className="header-search-container">
        <input
          type="text"
          placeholder="Search listings…"
          className="header-search-input"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="header-search-button">Search</button>
      </div>

      {/* RIGHT — Navigation Icons */}
      <nav className="header-nav">
        <Link to="/" className="header-nav-link">
          <Home size={28} />
          <span>Home</span>
        </Link>

        <Link to="/profile" className="header-nav-link">
          <User size={28} />
          <span>Profile</span>
        </Link>

        <Link to="/map" className="header-nav-link">
          <MapPin size={28} />
          <span>Map</span>
        </Link>

        <Link to="/inbox" className="header-nav-link">
          <MessageSquare size={28} />
          <span>Inbox</span>
        </Link>

        <Link to="/listing/create" className="header-nav-link">
          <Pencil size={28} />
          <span>List</span>
        </Link>
      </nav>
    </header>
  );
}
