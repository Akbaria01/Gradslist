import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

function Message() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const fromListing = location.state?.fromListing || null;

  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  // Helper for initials
  const getInitials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // Full date + time for conversation header (top of messages)
  const formatFullDateTime = (ts) => {
    if (!ts || !ts.toDate) return "";
    try {
      return ts.toDate().toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      });
    } catch {
      return "";
    }
  };

  // 🔐 Guard: must be logged in
  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Please log in to view your inbox.
      </div>
    );
  }

  //
  // 1) LOAD ALL CONVERSATIONS FOR CURRENT USER
  //
  useEffect(() => {
    const convRef = collection(db, "conversations");

    // ❌ no orderBy here (avoids index / type issues)
    const qConv = query(
      convRef,
      where("participants", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(
      qConv,
      (snap) => {
        const convs = snap.docs.map((d) => {
          const data = d.data();

          const contactName =
            data.buyerId === currentUser.uid
              ? data.sellerName
              : data.buyerName || data.sellerName;

          let lastTimestampString = "";
          if (data.lastTimestamp && data.lastTimestamp.toDate) {
            lastTimestampString = data.lastTimestamp
              .toDate()
              .toLocaleString("en-US", {
                dateStyle: "short",
                timeStyle: "short",
              });
          }

          return {
            id: d.id,
            contactName,
            contactInitials: getInitials(contactName || "User"),
            avatarColor: "bg-indigo-500",

            listingTitle: data.listingTitle,
            listingPrice: data.listingPrice,
            listingCondition: data.listingCondition,
            listingSeller: data.sellerName,
            listingPosted: data.listingPostedString || "",
            listingLocation: data.listingLocationString || "",
            listingDescription: data.listingDescription || "",
            listingImage: data.listingImage || "",

            lastMessage: data.lastMessage || "",
            lastTimestamp: lastTimestampString,
            rawLastTimestamp: data.lastTimestamp || null,
          };
        });

        // Sort newest → oldest in JS instead of Firestore
        convs.sort((a, b) => {
          if (!a.rawLastTimestamp || !b.rawLastTimestamp) return 0;
          if (!a.rawLastTimestamp.toMillis || !b.rawLastTimestamp.toMillis)
            return 0;
          return (
            b.rawLastTimestamp.toMillis() - a.rawLastTimestamp.toMillis()
          );
        });

        setConversations(convs);
        setLoadingConvs(false);

        if (!selectedId && convs.length > 0) {
          setSelectedId(convs[0].id);
        }
      },
      (err) => {
        console.error("Error loading conversations:", err);
        setLoadingConvs(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  //
  // 2) HANDLE "CONTACT SELLER" NAVIGATION (FROM LISTING DETAIL)
  //
  useEffect(() => {
    if (!fromListing) return;

    const convId = `${fromListing.listingId}-${fromListing.sellerId}-${currentUser.uid}`;

    const trySelectOrCreate = async () => {
      const convDocRef = doc(db, "conversations", convId);
      const snap = await getDoc(convDocRef);

      if (snap.exists()) {
        setSelectedId(convId);
      } else {
        await setDoc(convDocRef, {
          participants: [currentUser.uid, fromListing.sellerId],
          buyerId: currentUser.uid,
          buyerName:
            currentUser.displayName || currentUser.email || "Buyer",
          sellerId: fromListing.sellerId,
          sellerName: fromListing.sellerName,
          listingId: fromListing.listingId,
          listingTitle: fromListing.title,
          listingPrice: Number(fromListing.price),
          listingCondition: fromListing.condition || "used - good",
          listingLocationString: fromListing.locationString || "",
          listingPostedString: fromListing.postedString || "",
          listingDescription: fromListing.description || "",
          listingImage: fromListing.image || "",
          lastMessage: "",
          lastTimestamp: serverTimestamp(),
        });
        setSelectedId(convId);
      }
    };

    trySelectOrCreate().catch((e) =>
      console.error("Error handling fromListing conversation:", e)
    );
  }, [fromListing, currentUser.uid]);

  const activeConversation =
    conversations.find((c) => c.id === selectedId) || null;

  //
  // 3) LOAD MESSAGES FOR SELECTED CONVERSATION
  //
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const msgsRef = collection(db, "conversations", selectedId, "messages");
    const qMsgs = query(msgsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(
      qMsgs,
      (snap) => {
        const msgs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            from: data.fromUid === currentUser.uid ? "me" : "them",
            text: data.text,
            time: data.createdAt
              ? data.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            rawTimestamp: data.createdAt || null,
          };
        });
        setMessages(msgs);
        setLoadingMessages(false);
      },
      (err) => {
        console.error("Error loading messages:", err);
        setLoadingMessages(false);
      }
    );

    return () => unsub();
  }, [selectedId, currentUser.uid]);

  //
  // 4) AUTO-SCROLL
  //
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, selectedId]);

  //
  // 5) HANDLERS
  //
  const handleSelectConversation = (id) => {
    setSelectedId(id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !activeConversation || !selectedId) return;

    const convDocRef = doc(db, "conversations", selectedId);
    const msgsRef = collection(convDocRef, "messages");

    try {
      await addDoc(msgsRef, {
        fromUid: currentUser.uid,
        text,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        convDocRef,
        {
          lastMessage: text,
          lastTimestamp: serverTimestamp(),
        },
        { merge: true }
      );

      setInputValue("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleViewListing = () => {
    if (!activeConversation) return;
    setIsListingModalOpen(true);
  };

  const closeListingModal = () => {
    setIsListingModalOpen(false);
  };

  //
  // 6) UI
  //
  if (loadingConvs) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading inbox…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div
        className={`${
          isSidebarOpen ? "w-56" : "w-0"
        } bg-white border-r flex flex-col transition-all duration-300`}
      >
        <div className="bg-[#395A7F] text-white p-4">
          <h1 className="text-lg font-semibold">Inbox</h1>
        </div>

        <div className="flex-1">
          {conversations.map((conv) => {
            const isActive = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full text-left p-3 border-b cursor-pointer transition-colors ${
                  isActive ? "bg-[#E5F0FA]" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 ${conv.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}
                    >
                      {conv.contactInitials}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="font-semibold text-sm text-gray-900">
                      {conv.contactName}
                    </h2>
                    <p className="text-xs text-gray-600 leading-snug">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {conv.listingTitle}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {conv.lastTimestamp}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {conversations.length === 0 && (
            <div className="p-4 text-xs text-gray-500">
              No conversations yet. Use “Contact Seller” on a listing to start a
              chat.
            </div>
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="mr-2 text-gray-500 border rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                >
                  {isSidebarOpen ? "⟨" : "☰"}
                </button>

                <div
                  className={`w-10 h-10 ${activeConversation.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}
                >
                  {activeConversation.contactInitials}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {activeConversation.contactName}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {activeConversation.listingTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleViewListing}
                className="text-xs text-[#395A7F] border border-[#395A7F] px-3 py-1 rounded-full hover:bg-[#395A7F] hover:text-white transition-colors"
              >
                View Listing
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Conversation start timestamp: full date + time */}
              {messages.length > 0 && (
                <div className="flex justify-center mb-4">
                  <span className="text-xs text-gray-500">
                    {formatFullDateTime(messages[0].rawTimestamp)}
                  </span>
                </div>
              )}

              {loadingMessages && (
                <div className="text-xs text-gray-400 text-center mb-2">
                  Loading messages…
                </div>
              )}

              {!loadingMessages &&
                messages.map((msg) => {
                  const isMe = msg.from === "me";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-2 ${
                        isMe ? "justify-end" : ""
                      }`}
                    >
                      {!isMe && (
                        <div
                          className={`w-8 h-8 ${activeConversation.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                        >
                          {activeConversation.contactInitials}
                        </div>
                      )}

                      <div
                        className={`rounded-lg p-3 max-w-xs ${
                          isMe
                            ? "bg-[#395A7F] text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p
                          className={`mt-1 text-[10px] text-left ${
                            isMe ? "text-[#E5F0FA]" : "text-gray-400"
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>

                      {isMe && (
                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-indigo-500 flex items-center justify-center text-xs text-white font-bold">
                          {getInitials(
                            currentUser.displayName ||
                              currentUser.email ||
                              "Me"
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="bg-white border-t px-4 py-3 flex items-center space-x-3"
            >
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#395A7F]"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#395A7F] text-white px-6 py-2 rounded-lg hover:bg-[#A3CAE9] transition-colors"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Select a conversation from the left to start messaging.
          </div>
        )}
      </div>

      {/* Listing Modal */}
      {isListingModalOpen && activeConversation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeListingModal}
        >
          <div
            className="bg-[#F5F7FA] rounded-xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
              <h2 className="text-lg font-semibold">
                {activeConversation.listingTitle}
              </h2>
              <button
                type="button"
                onClick={closeListingModal}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-6">
              <div className="md:w-1/2 bg-white rounded-lg overflow-hidden">
                {activeConversation.listingImage ? (
                  <img
                    src={activeConversation.listingImage}
                    alt={activeConversation.listingTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-400 text-sm">
                    No image available
                  </div>
                )}
              </div>

              <div className="md:w-1/2 flex flex-col gap-3">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {activeConversation.listingTitle}
                  </h3>
                  {activeConversation.listingPrice != null && (
                    <p className="text-2xl font-bold">
                      ${activeConversation.listingPrice}
                    </p>
                  )}
                  {activeConversation.listingCondition && (
                    <p className="text-sm text-gray-600 mt-1">
                      Condition:{" "}
                      <span className="font-medium">
                        {activeConversation.listingCondition}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  {activeConversation.listingSeller && (
                    <p>
                      <span className="font-semibold">Seller:</span>{" "}
                      {activeConversation.listingSeller}
                    </p>
                  )}
                  {activeConversation.listingPosted && (
                    <p>
                      <span className="font-semibold">Posted:</span>{" "}
                      {activeConversation.listingPosted}
                    </p>
                  )}
                  {activeConversation.listingLocation && (
                    <p>
                      <span className="font-semibold">Location:</span>{" "}
                      {activeConversation.listingLocation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border-t px-6 py-4">
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-sm text-gray-700">
                {activeConversation.listingDescription || "No description."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Message;
