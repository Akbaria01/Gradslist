import React from 'react';

function Message() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r">
        {/* Header */}
        <div className="bg-[#395A7F] text-white p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <button className="text-white">−</button>
        </div>
        
        {/* Chat List */}
        <div className="overflow-y-auto">
          <div className="p-3 border-b hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                A
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Alice</div>
                <div className="text-sm text-gray-600 truncate">Hoorayy!!</div>
              </div>
            </div>
          </div>
          </div>
          </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">Alice</h2>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center text-xs text-gray-500 mb-4">
            Today, 2:30 PM
          </div>
          
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              A
            </div>
            <div className="bg-white rounded-lg p-3 max-w-xs">
              <p className="text-gray-800">Hi, I saw the motorbike you posted and I'm interested. Is it still available?</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 justify-end">
            <div className="bg-[#395A7F] text-white rounded-lg p-3 max-w-xs">
              <p>Yes, it’s still available!</p>
            </div>
            <div className="w-8 h-8 bg-[#395A7F] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              B
            </div>
          </div>
          </div>
          
         
        
        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
            />
            <button className="bg-[#395A7F] text-white px-6 py-2 rounded-lg hover:bg-[#A3CAE9]">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;