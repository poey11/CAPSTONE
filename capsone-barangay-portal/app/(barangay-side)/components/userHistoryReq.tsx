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
  accID?: string;
  onClose: () => void;
  requestorFname?:string ;
  docType?:string ;
  purpose?:string ;
  requestId?:string ;
  reqType?:string ;
  residentId?:string ;
}

const UserHistory: React.FC<UserHistoryProps> = ({ accID, onClose, requestorFname, docType, residentId,purpose }) => {
    
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

    useEffect(() => {
        const serviceRef = collection(db, "ServiceRequests");
        const newPurpose = purpose?.replace(/[()]/g, "").trim();
        console.log("Fetching history for:", { accID, docType, purpose: newPurpose });

        const unsubscribe = onSnapshot(serviceRef, (snapshot) => {
            const allRequests: UserRequestData[] = [];

            snapshot.forEach((doc) => {
            const data = doc.data();
            if(accID){
                if (data.accID === accID  && data.docType === docType && data.purpose === newPurpose) {
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
            }
            else if(residentId){
                if (data.residentId === residentId  && data.docType === docType && data.purpose === newPurpose) {
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
            }
            });

            // Sort newest to oldest
            allRequests.sort((a, b) => createdAtToMillis(b.createdAt) - createdAtToMillis(a.createdAt));

            if (allRequests.length === 0) {
                setUserHistory([]);
            return;
            }
            console.log("All matching requests:", allRequests);

            const latest = allRequests[1]; // most recent request

            // ✅ If latest is not rejected → no history
            if (latest.status !== "Rejected") {
                setUserHistory([]);
            return;
            }

            // ✅ Find the most recent Accepted (or Approved) request
            const lastAcceptedIndex = allRequests.findIndex(req => 
            req.status === "Completed" || req.status === "In - Progress"
            );

            // ✅ Get only rejected requests that come AFTER the last Accepted one
            const rejectedAfterAccepted = allRequests
            .slice(0, lastAcceptedIndex === -1 ? allRequests.length : lastAcceptedIndex)
            .filter(req => req.status === "Rejected");

            setUserHistory(rejectedAfterAccepted);
        });

        return () => unsubscribe();
    }, [accID, docType, purpose]);

  
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
                  Showing rejected {docType}{purpose} history for : <b>{requestorFname}</b>
                </p>
                <div className="mt-4 space-y-4">
                    {UserHistory.length === 0 ? (
                        <p className="text-gray-500 text-center">No rejected requests found.</p>
                    ) : (
                        UserHistory.map((request) => (
                            <div key={request.requestId} className="p-4 border border-gray-300 rounded-lg shadow-sm">
                                <p><span className="font-semibold">Request ID:</span> {request.requestId}</p>
                                <p><span className="font-semibold">Document Type:</span> {request.docType}</p>
                                <p><span className="font-semibold">Purpose:</span> {request.purpose}</p>
                                <p><span className="font-semibold">Status:</span> {request.status}</p>
                                <p><span className="font-semibold">Rejection Reason:</span> {request.rejectionReason}</p>
                            </div>
                        ))
                    )}
                </div>


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
