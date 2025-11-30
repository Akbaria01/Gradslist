import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/globals.css";

import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Map from "./pages/Map.jsx";
import Message from "./pages/Message.jsx";
import Listings from "./pages/Listings.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import CreateListings from "./pages/CreateListings.jsx";
import Login from "./pages/Login&Signup.jsx";
import SafeMeetup from "./pages/SafeMeetup.jsx";
import Help from "./pages/Help.jsx";

import { SearchProvider } from "./context/SearchContext.jsx";
import MapPage from "./pages/Map.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "profile", element: <Profile /> },
      { path: "map", element: <MapPage /> },
      { path: "inbox", element: <Message /> },
      { path: "listings", element: <Listings /> },
      { path: "listing/:id", element: <ListingDetail /> },
      { path: "listing/create", element: <CreateListings /> },
      { path: "meetup", element: <SafeMeetup /> },
      { path: "help", element: <Help /> },
    ],
  },
  { path: "/login&signup", element: <Login /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SearchProvider>
      <RouterProvider router={router} />
    </SearchProvider>
  </React.StrictMode>
);
