import { Link, useNavigate } from "react-router-dom";
import { Home, User, MapPin, MessageSquare, Pencil } from "lucide-react";
import { useSearch } from "../context/SearchContext";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import logo from "../assets/images/logo.svg";
import "../styles/header.css";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs,
  limit,
} from "firebase/firestore";

export default function Header() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // PROFILE CLICK HANDLER
  const handleProfileClick = () => {
    if (!user) navigate("/login&signup");
    else navigate("/profile");
  };

  // FETCH SUGGESTIONS FROM FIRESTORE
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(
          listingsRef,
          orderBy("titleLower"),
          startAt(searchQuery.toLowerCase()),
          endAt(searchQuery.toLowerCase() + "\uf8ff"),
          limit(5)
        );

        const snap = await getDocs(q);
        const results = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSuggestions(results);
      } catch (err) {
        console.error("Error fetching search suggestions:", err);
      }
    };

    const delay = setTimeout(() => {
      fetchSuggestions();
      setShowDropdown(true);
    }, 200);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // CHOOSE A SUGGESTION
  const handleSuggestionClick = (title) => {
    setSearchQuery(title);
    setShowDropdown(false);
    navigate("/"); // loads Home + filtered results
  };

  return (
    <header className="header">
      {/* LEFT — Logo */}
      <div className="header-left">
        <Link
          to="/"
          state={{ resetHome: true }}
          className="flex items-center gap-2"
        >
          <img src={logo} alt="Logo" className="header-logo" />
        </Link>
      </div>

      {/* CENTER — Search */}
      <div className="header-search-container" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search listings…"
          className="header-search-input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
        />

        <button className="header-search-button" onClick={() => navigate("/")}>
          Search
        </button>

        {/* DROPDOWN */}
        {showDropdown && suggestions.length > 0 && (
          <div className="search-dropdown">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className="search-dropdown-item"
                onClick={() => handleSuggestionClick(item.title)}
              >
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — Nav Icons */}
      <nav className="header-nav">
        <Link to="/" state={{ resetHome: true }} className="header-nav-link">
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
