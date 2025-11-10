"use client";
import { useEffect,useState } from "react";
import { collection, doc, updateDoc, getDocs, query, onSnapshot,getDoc, where } from "firebase/firestore";
import {db} from "@/app/db/firebase";

interface UserRequestData {
    requestId: string;
    docType: string;
    purpose: string;
    status: string;
    reqType: string;
    rejectionReason: string;
    createdAt: any;
}

interface UserHistoryProps {
  onClose: () => void;
  requestorFname?:string ;
  docType?:string ;
  purpose?:string ;
  requestId?:string ;
  reqType?:string ;
  residentId?:string ;
}

const UserHistory: React.FC<UserHistoryProps> = ({ onClose, requestorFname, docType, residentId,purpose }) => {
    
    const [UserHistory, setUserHistory] = useState<UserRequestData[]>([]);
    // parse createdAt (Firestore Timestamp, ISO, or "M/D/YYYY, h:mm:ss AM/PM")
    function createdAtToMillis(createdAt: any): number {
        if (!createdAt) return 0;

        // 1) Firestore Timestamp
        if (typeof createdAt.toMillis === "function") {
            return createdAt.toMillis();
        }

        // 2) If it's already a number
        if (typeof createdAt === "number") return createdAt;

        // 3) If it's a Date
        if (createdAt instanceof Date) return createdAt.getTime();

        // 4) If it's a string like: "11/9/2025, 6:07:52 AM"
        if (typeof createdAt === "string") {
            // try strict parse for "M/D/YYYY, h:mm:ss AM/PM"
            const m = createdAt.match(
            /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)\s*$/i
            );
            if (m) {
            const month = parseInt(m[1], 10) - 1; // JS months 0..11
            const day = parseInt(m[2], 10);
            const year = parseInt(m[3], 10);
            let hour = parseInt(m[4], 10);
            const minute = parseInt(m[5], 10);
            const second = parseInt(m[6], 10);
            const ampm = m[7].toUpperCase();

            if (ampm === "PM" && hour < 12) hour += 12;
            if (ampm === "AM" && hour === 12) hour = 0;

            return new Date(year, month, day, hour, minute, second).getTime();
            }

            // fallback: try Date.parse (may work for ISO or other formats)
            const fallback = Date.parse(createdAt);
            if (!Number.isNaN(fallback)) return fallback;
        }

        // unknown format -> return 0 so it sorts to the end
        return 0;
    }
    const newPurpose = purpose?.replace(/[()]/g, "").trim();
    console.log("Processed purpose:", newPurpose);

    useEffect(() => {
  const serviceRef = collection(db, "ServiceRequests");
  console.log("Fetching history for:", { residentId, docType, purpose: newPurpose });

  const unsubscribe = onSnapshot(serviceRef, (snapshot) => {
    const allRequests: UserRequestData[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.residentId === residentId && data.docType === docType && data.purpose === newPurpose) {
        allRequests.push({
          requestId: data.requestId,
          docType: data.docType,
          purpose: data.purpose,
          status: data.status,
          reqType: data.reqType,
          rejectionReason: data.rejectionReason,
          createdAt: data.createdAt,
        });
      }
    });

    // Sort newest → oldest
    allRequests.sort((a, b) => createdAtToMillis(b.createdAt) - createdAtToMillis(a.createdAt));
    console.log("Sorted requests:", allRequests);

    if (allRequests.length === 0) {
      setUserHistory([]);
      return;
    }

    // Find the most recent Completed/In-Progress request
    const lastAcceptedIndex = allRequests.findIndex(
      (req) => req.status === "Completed" || req.status === "In - Progress"
    );

    let rejectedAfterAccepted: UserRequestData[] = [];

    if (lastAcceptedIndex === -1) {
      // ✅ No Completed/In-Progress → show all Rejected requests
      rejectedAfterAccepted = allRequests.filter((req) => req.status === "Rejected");
    } else {
      // ✅ Show only rejections that occurred *after* the last Completed/In-Progress
      rejectedAfterAccepted = allRequests
        .slice(0, lastAcceptedIndex)
        .filter((req) => req.status === "Rejected");
    }

    // Update history
    setUserHistory(rejectedAfterAccepted);
  });

  return () => unsubscribe();
}, [residentId, docType, purpose]);


  
    console.log("User History Data:", UserHistory);
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
            <main className="userrequesthistory-modal">
              <div className="userrequesthistory-modal-container">
                <div className="userrequesthistory-modal-header">
                  <p>User Request History</p>
                </div>

                <div className="userrequesthistory-modal-body">
                  <p className="userrequesthistory-description">
                    Showing rejected {docType}
                    {newPurpose && newPurpose !== "undefined" && newPurpose !== "null" && newPurpose.trim() !== ""
                      ? ` (${newPurpose}) `
                      : " "}
                    history for: <b>{requestorFname}</b>
                  </p>

                  <div className="userrequesthistory-list">
                    {UserHistory.length === 0 ? (
                      <div className="userrequesthistory-empty">
                        <img src="/Images/no-results.png" alt="No results" className="no-result-icon-services" />
                        <p>No rejected requests found for this document.</p>
                      </div>
                    ) : (
                      UserHistory.map((request) => (
                        <div key={request.requestId} className="userrequesthistory-item">
                          <p><span className="label">Request ID:</span> {request.requestId}</p>
                          <p><span className="label">Document Type:</span> {request.docType}</p>
                          <p><span className="label">Purpose:</span> {request.purpose}</p>
                          <p><span className="label">Status:</span> {request.status}</p>
                          <p><span className="label">Rejection Reason:</span> {request.rejectionReason}</p>
                        </div>
                      ))
                    )}
                  </div>
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
