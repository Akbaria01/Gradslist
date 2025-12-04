// src/components/Modal.jsx
import { useEffect } from 'react';
export default function Modal({ message, isVisible, onClose, customContent }) {
  useEffect(() => {
    if (isVisible && !customContent) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, customContent]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      {customContent ? (
        customContent
      ) : (
        <div className="bg-white px-8 py-16 rounded-lg shadow-lg border border-black relative max-w-md w-full mx-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
          >
            ✕
          </button>
          <h2 className="text-3xl font-semibold text-gray-800 text-center">{message}</h2>
        </div>
      )}
    </div>
  );
}