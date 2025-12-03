import React, { useState, useRef, useEffect } from "react";
import bikeImg from "../assets/images/bike.jpg";
import tableImg from "../assets/images/table.jpg";
import bookImg from "../assets/images/book.png";

const initialConversations = [
  {
    id: "thread-1",
    contactName: "Alex Johnson",
    contactInitials: "A",
    avatarColor: "bg-red-400",
    // listing info for alex
    listingTitle: "Red Motorbike - 2016",
    listingPrice: "$2,200",
    listingCondition: "used - good",
    listingSeller: "Alex Johnson",
    listingPosted: "november 28, 2025",
    listingLocation: "Charlotte, NC",
    listingDescription:
      "2016 red bike, runs smooth, recently serviced. clean title and ready to ride.",
    listingImage: bikeImg,
    lastMessage: "Hi, I saw the motorbike you posted. Is it still available?",
    lastTimestamp: "Today, 2:30 PM",
    unreadCount: 1,
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Hi, I saw the motorbike you posted and I'm interested. Is it still available?",
        time: "2:30 PM",
      },
    ],
  },
  {
    id: "thread-2",
    contactName: "Sarah Lee",
    contactInitials: "S",
    avatarColor: "bg-blue-400",
    // listing info for sarah
    listingTitle: "Dining Table Set",
    listingPrice: "$120",
    listingCondition: "used - like new",
    listingSeller: "Sarah Lee",
    listingPosted: "November 25, 2025",
    listingLocation: "Concord, NC",
    listingDescription:
      "dining table with four chairs. barely used, no big scratches. perfect for an apartment or small space.",
    listingImage: tableImg,
    lastMessage: "Thanks! I’ll see you at the meetup spot.",
    lastTimestamp: "Yesterday, 6:45 PM",
    unreadCount: 0,
    messages: [
      {
        id: "m2",
        from: "me",
        text: "Sounds good! I’ll be there at 7.",
        time: "6:40 PM",
      },
      {
        id: "m3",
        from: "them",
        text: "Thanks! I’ll see you at the meetup spot.",
        time: "6:45 PM",
      },
    ],
  },
  {
    id: "thread-3",
    contactName: "Jake Thompson",
    contactInitials: "J",
    avatarColor: "bg-green-500",
    // listing info for jake
    listingTitle: "Textbooks Bundle",
    listingPrice: "$40",
    listingCondition: "used - good",
    listingSeller: "Jake Thompson",
    listingPosted: "November 20, 2025",
    listingLocation: "Charlotte, NC",
    listingDescription:
      "Bundle of cs and data structures textbooks. some highlighting, but everything is readable and in good shape.",
    listingImage: bookImg,
    lastMessage: "No worries, just let me know.",
    lastTimestamp: "Mon, 4:10 PM",
    unreadCount: 0,
    messages: [
      {
        id: "m4",
        from: "them",
        text: "If you still need the textbooks, I can drop them off on campus.",
        time: "4:05 PM",
      },
      {
        id: "m5",
        from: "me",
        text: "I’m still deciding, I’ll let you know tonight!",
        time: "4:08 PM",
      },
      {
        id: "m6",
        from: "them",
        text: "No worries, just let me know.",
        time: "4:10 PM",
      },
    ],
  },
];

function Message() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(
    initialConversations[0]?.id || null
  );
  const [inputValue, setInputValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const activeConversation =
    conversations.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages.length, selectedId]);

  const handleSelectConversation = (id) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              unreadCount: 0,
            }
          : c
      )
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !activeConversation) return;

    const newMessage = {
      id: `local-${Date.now()}`,
      from: "me",
      text,
      time: "Just now",
      time: "just now",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: text,
              lastTimestamp: "Just now",
              lastTimestamp: "just now",
              unreadCount: 0,
            }
          : c
      )
    );

    setInputValue("");
  };

  const handleViewListing = () => {
    if (!activeConversation) return;
    setIsListingModalOpen(true);
  };

  const closeListingModal = () => {
    setIsListingModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {/* sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-56" : "w-0"
        } bg-white border-r flex flex-col transition-all duration-300 overflow-hidden`}
      >
        <div className="bg-[#395A7F] text-white p-4">
          <h1 className="text-lg font-semibold">Inbox</h1>
        </div>

        {/* Chat List */}
        {/* chat list */}
        <div className="overflow-y-auto flex-1">
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
                      className={`w-10 h-10 ${conv.avatarColor} rounded-full flex items-center justify-center text-white font-bold p-0`}
                    >
                      {conv.contactInitials}
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* Name */}
                    <h2 className="font-semibold text-sm text-gray-900">
                      {conv.contactName}
                    </h2>

                    {/* Last message preview */}
                    <p className="text-xs text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>

                    {/* Listing + timestamp on their own lines so nothing gets cut */}
                    <p className="text-[11px] text-gray-400 mt-1 truncate">
                      {conv.listingTitle}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {conv.lastTimestamp}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-[#395A7F] text-white text-[10px] px-2 py-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {/* main chat area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            {/* chat header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Sidebar toggle from main header */}
                {/* sidebar toggle */}
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
            {/* messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center mb-2">
                <span className="text-xs text-gray-500">
                  {activeConversation.lastTimestamp}
                </span>
              </div>

              {activeConversation.messages.map((msg) => {
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
                      <div className="w-8 h-8 rounded-full flex-shrink-0" />
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {/* message input */}
            <form
              onSubmit={handleSendMessage}
              className="bg-white border-t px-4 py-3 flex items-center space-x-3"
            >
              <input
                type="text"
                placeholder="Type a message..."
                placeholder="type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#395A7F]"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#395A7F] text-white px-6 py-2 rounded-lg hover:bg-[#A3CAE9] transition-colors"
              >
                Send
                send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Select a conversation from the left to start messaging.
            select a conversation from the left to start messaging.
          </div>
        )}
      </div>

      {/* listing modal */}
      {isListingModalOpen && activeConversation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeListingModal}
        >
          <div
            className="bg-[#F5F7FA] rounded-xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* modal header */}
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

            {/* main content */}
            <div className="flex flex-col md:flex-row gap-6 p-6">
              {/* image */}
              <div className="md:w-1/2 bg-white rounded-lg overflow-hidden">
                <img
                  src={activeConversation.listingImage}
                  alt={activeConversation.listingTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* details */}
              <div className="md:w-1/2 flex flex-col gap-3">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {activeConversation.listingTitle}
                  </h3>
                  <p className="text-2xl font-bold">
                    {activeConversation.listingPrice}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Condition:{" "}
                    <span className="font-medium">
                      {activeConversation.listingCondition}
                    </span>
                  </p>
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Seller:</span>{" "}
                    {activeConversation.listingSeller}
                  </p>
                  <p>
                    <span className="font-semibold">Posted:</span>{" "}
                    {activeConversation.listingPosted}
                  </p>
                  <p>
                    <span className="font-semibold">Location:</span>{" "}
                    {activeConversation.listingLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* description */}
            <div className="bg-white border-t px-6 py-4">
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-sm text-gray-700">
                {activeConversation.listingDescription}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Message;
