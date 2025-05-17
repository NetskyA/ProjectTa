// src/components/DialogTrueFalse.jsx

import React from "react";

const DialogTrueFalse = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    // Overlay dengan animasi fade-in
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300">
      {/* Modal dengan animasi scale-up */}
      <div className="bg-white rounded-lg shadow-lg w-fit transform transition-transform duration-300 scale-100">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-800">
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="p-4">
          <p className="text-sm">{message}</p>
        </div>
        {/* Footer */}
        <div className="flex justify-center px-4 py-2 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 mr-2 w-full text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm w-full text-white bg-red-600 rounded hover:bg-red-700"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogTrueFalse;
