import { Link, useNavigate } from "react-router-dom";
import { Home, User, MapPin, MessageSquare, Pencil } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import logo from "../assets/images/logo.svg";
import "../styles/header.css";

export default function Header() {
  const { setSearchQuery } = useSearch();

  const navigate = useNavigate();
   // Hook from react-firebase-hooks to get the current user
   const [user] = useAuthState(auth);

   // Decide where to go when the Profile icon is clicked
   const handleProfileClick = () => {
     if (!user) {
       // If not logged in, go to login & signup page
       navigate("/login&signup");
     } else {
       // If logged in, go to user profile/dashboard
       navigate("/profile");
     }
  };

  return (
    <header className="header">
      
      {/* LEFT — Logo */}
      <div className="header-left">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="header-logo" />
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

        <button onClick={handleProfileClick} className="header-nav-link">
          <User size={28} />
          <span>Profile</span>
        </button>

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