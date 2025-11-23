// src/context/AuthContext.jsx
// -------------------------------------------------
// React Context that exposes the current Firebase user
// -------------------------------------------------
// This listens to Firebase auth state and makes
// `currentUser`, `userLoggedIn`, and `loading`
// available to any component via the `useAuth()` hook.

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

// Create the context object
const AuthContext = createContext();

// Provider component that wraps the app in main.jsx
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth changes (login, logout, initial load)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
         // User is logged in
        setCurrentUser({ ...user });
        setUserLoggedIn(true);
      } else {
         // User is logged out
        setCurrentUser(null);
        setUserLoggedIn(false);
      }
      // We now know the auth state
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userLoggedIn,
    loading,
  };
  // Don't render children until we've finished checking auth state
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook so components can easily access auth state
export function useAuth() {
  return useContext(AuthContext);
}
