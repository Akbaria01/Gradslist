// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/globals.css";

import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import MapPage from "./pages/Map.jsx";
import Message from "./pages/Message.jsx";
import Listings from "./pages/Listings.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import CreateListings from "./pages/CreateListings.jsx";
import Login from "./pages/Login&Signup.jsx";
import SafeMeetup from "./pages/SafeMeetup.jsx";

import { SearchProvider } from "./context/SearchContext.jsx";
import ProtectedRoute from "./components/protectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {
        // Profile (protected)
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      // Map (public)
      { path: "map", element: <MapPage /> },
      {
        // inbox (protected)
        path: "inbox",
        element: (
          <ProtectedRoute>
            <Message />
          </ProtectedRoute>
        ),
      },
      // listings and listings/:id (public)
      { path: "listings", element: <Listings /> },
      { path: "listing/:id", element: <ListingDetail /> },
      {
        // listing/create (protected)
        path: "listing/create",
        element: (
          <ProtectedRoute>
            <CreateListings />
          </ProtectedRoute>
        ),
      },
      {
        // meetup (protected)
        path: "meetup",
        element: (
          <ProtectedRoute>
            <SafeMeetup />
          </ProtectedRoute>
        ),
      },
        // Login & Signup page (no ProtectedRoute)
      { path: "login&signup", element: <Login /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* AuthProvider manages Firebase auth state for the whole app */}
    <AuthProvider>
    <SearchProvider>
      <RouterProvider router={router} />
    </SearchProvider>
    </AuthProvider>
  </React.StrictMode>
);
