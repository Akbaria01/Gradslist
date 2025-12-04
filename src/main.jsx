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
import ListingDetail from "./pages/ListingDetail.jsx";
import CreateListings from "./pages/CreateListings.jsx";
import Login from "./pages/Login&Signup.jsx";
import SafeMeetup from "./pages/SafeMeetup.jsx";
import Help from "./pages/Help.jsx";
import MyListings from "./pages/MyListings.jsx";
import SavedItems from "./pages/SavedItems.jsx";
import LeaveReview from "./pages/LeaveReview.jsx";
import ViewProfile from "./pages/ViewProfile.jsx";


import { SearchProvider } from "./context/SearchContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/protectedRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      { 
        path: "map", 
        element: (
          <ProtectedRoute>
             <MapPage /> 
          </ProtectedRoute>
          ), 
        },
      {
        path: "inbox",
        element: (
          <ProtectedRoute>
            <Message />
          </ProtectedRoute>
        ),
      },
      { path: "listing/:id", element: <ListingDetail /> },
      {
        path: "listing/create",
        element: (
          <ProtectedRoute>
            <CreateListings />
          </ProtectedRoute>
        ),
      },

      {
        path: "meetup",
        element: (
          <ProtectedRoute>
            <SafeMeetup />
          </ProtectedRoute>
        ),
      },
      { path: "help", element: <Help /> },
      { path: "/login&signup", element: <Login /> },
      {
        path: "mylistings",
        element: (
          <ProtectedRoute>
            <MyListings />
          </ProtectedRoute>
        ),
      },
      {
        path: "saveditems",
        element: (
          <ProtectedRoute>
            <SavedItems />
          </ProtectedRoute>
        ),
      },
      {
        path: "leavereview",
        element: (
          <ProtectedRoute>
            <LeaveReview />
          </ProtectedRoute>
        ),
      },
      {
        path: "viewprofile",
        element: (
          <ProtectedRoute>
            <ViewProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SearchProvider>
        <RouterProvider router={router} />
      </SearchProvider>
    </AuthProvider>
  </React.StrictMode>
);
