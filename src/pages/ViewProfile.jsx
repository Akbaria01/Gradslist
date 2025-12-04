import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doSignOut } from "../auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db, app } from "../firebase";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function ViewProfile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: "User",
    email: "",
    phone: "",
    profilePic: "",
  });

  const [reviews, setReviews] = useState([]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const buttonStyle = "bg-[#2E4C6E] hover:bg-[#243c58] text-white";

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Load profile
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
            phone: data.phone || "",
            profilePic: data.profilePic || "",
          });
          if (data.profilePic) {
            setImagePreview(data.profilePic);
          }
        } else {
          const fallback = {
            name: currentUser.displayName || "User",
            email: currentUser.email || "",
            phone: "",
            profilePic: "",
          };
          setProfileData(fallback);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    loadProfile();
  }, [currentUser]);

  // Load reviews
  useEffect(() => {
    if (!currentUser) return;

    const loadReviews = async () => {
      try {
        const q = query(
          collection(db, "reviews"),
          where("reviewedUserId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const revs = querySnapshot.docs.map((doc) => doc.data());
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
          className={`text-2xl ${
            i <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
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

  const handleStartEdit = () => {
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setError("");
    setSuccess("");
    setEditing(false);
    setNewProfileImageFile(null);
    // Reset preview back to saved value
    setImagePreview(profileData.profilePic || "");
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setNewProfileImageFile(file);

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setError("");
    setSuccess("");

    const trimmedName = profileData.name.trim();
    const trimmedEmail = profileData.email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError("Username and email cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      let profilePicURL = profileData.profilePic || "";

      // If new image selected, upload to Firebase Storage
      if (newProfileImageFile) {
        const storage = getStorage(app);
        const destPath = `profilePics/${currentUser.uid}/${Date.now()}_${
          newProfileImageFile.name
        }`;
        const fileRef = storageRef(storage, destPath);
        const snap = await uploadBytes(fileRef, newProfileImageFile);
        console.log("Profile image upload snapshot:", snap);
        profilePicURL = await getDownloadURL(fileRef);
      }

      const userRef = doc(db, "users", currentUser.uid);

      // We use setDoc with merge: true to not blow away other fields
      await setDoc(
        userRef,
        {
          username: trimmedName,
          email: trimmedEmail,
          phone: profileData.phone.trim() || "",
          profilePic: profilePicURL || "",
        },
        { merge: true }
      );

      setProfileData((prev) => ({
        ...prev,
        name: trimmedName,
        email: trimmedEmail,
        phone: profileData.phone.trim() || "",
        profilePic: profilePicURL || "",
      }));

      setSuccess("Profile updated successfully.");
      setEditing(false);
      setNewProfileImageFile(null);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayPhone = profileData.phone?.trim() || "N/A";

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
          {/* Profile image / placeholder */}
          <div className="relative mb-4">
            <label className="block cursor-pointer">
              {imagePreview || profileData.profilePic ? (
                <img
                  src={imagePreview || profileData.profilePic}
                  alt="Profile"
                  className="w-56 h-56 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-56 h-56 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl shadow-lg">
                  No Photo
                </div>
              )}

              {/* Hidden input that triggers on click */}
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

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
          <form
            onSubmit={handleSaveProfile}
            className="p-8 rounded-xl shadow-md bg-white flex flex-col gap-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                Profile Information
              </h2>
              {!editing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className={`px-4 py-2 text-sm rounded-lg font-medium shadow-sm ${buttonStyle}`}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-[#395A7F] text-white hover:bg-[#2E4C6E] disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                {success}
              </p>
            )}

            {/* Name */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <p className="text-xl font-bold text-gray-900 w-24">Name:</p>
              {editing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-lg text-gray-900"
                  placeholder="Enter your username"
                />
              ) : (
                <span className="text-2xl text-gray-800">
                  {profileData.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <p className="text-xl font-bold text-gray-900 w-24">Email:</p>
              {editing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-lg text-gray-900"
                  placeholder="Enter your email"
                />
              ) : (
                <span className="text-2xl text-gray-800">
                  {profileData.email}
                </span>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <p className="text-xl font-bold text-gray-900 w-24">Phone:</p>
              {editing ? (
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-lg text-gray-900"
                  placeholder="Optional"
                />
              ) : (
                <span className="text-2xl text-gray-800">
                  {displayPhone}
                </span>
              )}
            </div>
          </form>

          {/* Reviews Section */}
          <div className="p-6 rounded-xl shadow-md bg-white">
            <div className="flex items-center gap-2 mt-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-xl text-gray-800 font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500 text-lg">
                ({reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-4">
              Reviews About You
            </h2>
            <div className="space-y-4">
              {reviews.length ? (
                reviews.map((rev, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-3 last:border-b-0"
                  >
                    <p className="text-lg font-medium text-gray-800 mb-1">
                      {rev.reviewerName}
                    </p>
                    <div className="flex items-center mt-1 gap-[2px]">
                      {renderStars(rev.rating)}
                    </div>
                    <p className="text-base text-gray-700 mt-1">
                      {rev.comment}
                    </p>
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
