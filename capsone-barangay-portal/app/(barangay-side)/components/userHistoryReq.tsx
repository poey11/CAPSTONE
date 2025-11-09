"use client";
import { useEffect,useState } from "react";
import { collection, doc, updateDoc, getDocs, query, onSnapshot,getDoc, where } from "firebase/firestore";




interface UserHistoryProps {
  residentId: string;
  onClose: () => void;
}

const UserHistory: React.FC<UserHistoryProps> = ({ residentId, onClose }) => {
  return (
    <>
      {/* Overlay (dark background) */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        {/* Modal container */}
        <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 relative animate-fadeIn">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>

          {/* Modal content */}
          <main className="flex flex-col items-center">
            <div className="w-full">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <p className="text-2xl font-semibold text-gray-800 text-center">
                  User Request History
                </p>
              </div>

              {/* Example placeholder for request data */}
              <div className="max-h-[60vh] overflow-y-auto">
                <p className="text-gray-600 text-center">
                  Showing rejected permit history for : <b>{residentId}</b>
                </p>
                {/* You can map over request data here later */}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Optional animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default UserHistory;
