import React from "react";
import "../../.././index.css";

const Alert = ({ message, type = "info", onClose }) => {
  const typeClasses = {
    success: "bg-green-100 border-green-500 text-green-700",
    error: "bg-red-100 border-red-500 text-red-700",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
    info: "bg-blue-100 border-blue-500 text-blue-700",
  };

  return (
    <div
      className={`alert border-l-4 p-4 mb-4 rounded ${typeClasses[type]} flex items-start`}
      role="alert"
    >
      <div className="flex-1">
        <p className="font-bold capitalize">{type}</p>
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-bold ml-4 text-gray-700 hover:text-gray-900"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
