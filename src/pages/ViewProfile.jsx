import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doSignOut } from "../auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function ViewProfile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: "User",
    email: "",
    phone: "N/A",
    profilePic: ""
  });

  const [reviews, setReviews] = useState([]);

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  useEffect(() => {
    if (!currentUser) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfileData({
            name: data.username || currentUser.displayName || "User",
            email: data.email || currentUser.email || "",
            phone: data.phone || "N/A",
            profilePic: data.profilePic || ""
          });
        } else {
          setProfileData({
            name: currentUser.displayName || "User",
            email: currentUser.email || "",
            phone: "N/A",
            profilePic: ""
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const loadReviews = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("reviewedUserId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const revs = querySnapshot.docs.map(doc => doc.data());
        setReviews(revs);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
    };

    loadReviews();
  }, [currentUser]);

  const handleLogOut = async () => {
    try {
      await doSignOut();
      navigate("/login&signup");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-2xl ${i <= rating ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="bg-[#f4f6f8] min-h-screen p-6">
      {/* Top Row: Back Button + Title */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm ${buttonStyle} mr-6`}
        >
          Back
        </button>
        <h1 className="text-4xl font-bold text-gray-900 text-center flex-1">
          My Account
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Picture + Log Out */}
        <div className="flex flex-col items-center">
          {profileData.profilePic ? (
            <img
              src={profileData.profilePic}
              alt="Profile"
              className="w-56 h-56 rounded-full object-cover mb-6 shadow-lg"
            />
          ) : (
            <div className="w-56 h-56 rounded-full bg-gray-200 mb-6 flex items-center justify-center text-gray-500 text-2xl shadow-lg">
              No Photo
            </div>
          )}
          <button
            onClick={handleLogOut}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg"
          >
            Log Out
          </button>
        </div>

        {/* Right Column: User Info + Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* User Info Card */}
          <div className="p-8 rounded-xl shadow-md bg-white flex flex-col gap-4">
            <div className="flex items-center gap-6">
              <p className="text-2xl font-bold text-gray-900">Name:</p>
              <span className="text-2xl text-gray-800">{profileData.name}</span>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-2xl font-bold text-gray-900">Email:</p>
              <span className="text-2xl text-gray-800">{profileData.email}</span>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-2xl font-bold text-gray-900">Phone:</p>
              <span className="text-2xl text-gray-800">{profileData.phone}</span>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="p-6 rounded-xl shadow-md bg-white">
            {/* Overall Rating */}
            <div className="flex items-center gap-2 mt-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-xl text-gray-800 font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-gray-500 text-lg">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-4">Reviews About You</h2>
            <div className="space-y-4">
                {reviews.length ? (
                reviews.map((rev, index) => (
                    <div
                    key={index}
                    className="border-b border-gray-200 pb-3 last:border-b-0"
                    >
                    <p className="text-lg font-medium text-gray-800 mb-1">{rev.reviewerName}</p>
                    <div className="flex items-center mt-1 gap-[2px]">
                        {renderStars(rev.rating)}
                    </div>
                    <p className="text-base text-gray-700 mt-1">{rev.comment}</p>
                    </div>
                ))
                ) : (
                <p className="text-sm text-gray-500">No reviews yet.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

