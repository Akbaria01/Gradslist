// src/components/ProtectedRoute.jsx
// --------------------------------------------------
// A wrapper component that protects routes that require
// the user to be logged in (Profile, Create Listing, etc.)
// --------------------------------------------------
// If the user is not logged in, they get redirected to
// the /login&signup page.

import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

export default function protectedRoute({ children }) {
  const [user, loading, error] = useAuthState(auth);

    // While auth state is still loading, render nothing or a loader
  if (loading) {
    return null; 
  }

  // Optional: render something if there's an error
  if (error) {
    console.error(error);
    return <div>Something went wrong. Please refresh.</div>;
  }

  // If not logged in, send to login/signup
  if (!user) {
    return <Navigate to="/login&signup" replace />;
  }

  // If logged in, show the protected page
  return children;
}
