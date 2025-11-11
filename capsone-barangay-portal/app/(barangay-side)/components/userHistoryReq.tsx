"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/db/firebase";

interface UserRequestData {
  requestId: string;
  docType: string;
  purpose: string;
  status: string;
  reqType: string;
  rejectionReason: string;
  createdAt: any;
  businessName?: string;
  businessNature?: string;
  businessLocation?: string;
}

interface UserHistoryProps {
  onClose: () => void;
  requestorFname?: string;
  docType?: string;
  purpose?: string;
  requestId?: string; // Firestore doc ID of the current request
  reqType?: string;
  residentId?: string;
}

// parse createdAt (Firestore Timestamp, ISO, or "M/D/YYYY, h:mm:ss AM/PM")
function createdAtToMillis(createdAt: any): number {
  if (!createdAt) return 0;

  // 1) Firestore Timestamp
  if (typeof createdAt?.toMillis === "function") {
    return createdAt.toMillis();
  }

  // 2) If it's already a number
  if (typeof createdAt === "number") return createdAt;

  // 3) If it's a Date
  if (createdAt instanceof Date) return createdAt.getTime();

  // 4) If it's a string like: "11/9/2025, 6:07:52 AM"
  if (typeof createdAt === "string") {
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

    const fallback = Date.parse(createdAt);
    if (!Number.isNaN(fallback)) return fallback;
  }

  return 0;
}

function formatCreatedAt(createdAt: any): string {
  const ms = createdAtToMillis(createdAt);
  if (!ms) return "N/A";

  const d = new Date(ms);
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// 🔹 These two get strict same-business filtering
const businessFilterDocTypes = ["Business Permit", "Temporary Business Permit"];

// 🔹 These get extra business detail fields (includes Construction)
const businessDetailDocTypes = [
  "Business Permit",
  "Temporary Business Permit",
  "Construction",
];

const UserHistory: React.FC<UserHistoryProps> = ({
  onClose,
  requestorFname,
  docType,
  residentId,
  purpose,
  requestId, // current Firestore document ID
}) => {
  const [UserHistory, setUserHistory] = useState<UserRequestData[]>([]);

  // remove parentheses that you passed from parent (e.g. " (Renewal)")
  const newPurpose = purpose?.replace(/[()]/g, "").trim();
  console.log("Processed purpose:", newPurpose);

  useEffect(() => {
    if (!residentId || !docType) {
      setUserHistory([]);
      return;
    }

    const serviceRef = collection(db, "ServiceRequests");
    console.log("Fetching history for:", {
      residentId,
      docType,
      purpose: newPurpose,
      requestId,
    });

    const unsubscribe = onSnapshot(serviceRef, (snapshot) => {
      type RawDoc = { id: string; data: any };

      const matchingDocs: RawDoc[] = [];

      snapshot.forEach((docu) => {
        const data = docu.data();

        // Filter by resident + docType first
        if (data.residentId === residentId && data.docType === docType) {
          matchingDocs.push({ id: docu.id, data });
        }
      });

      let filteredDocs: RawDoc[] = [];

      const isBusinessFilterType =
        docType && businessFilterDocTypes.includes(docType);

      let currentDoc: RawDoc | undefined;

      if (requestId) {
        // Find the current document so we can:
        // 1) use its business fields for strict match
        // 2) exclude it later
        currentDoc = matchingDocs.find(
          (d) => d.id === requestId || d.data.requestId === requestId
        );
      }

      if (isBusinessFilterType && currentDoc) {
        // 🔹 For Business Permit / Temporary Business Permit:
        //   show only requests with:
        //   - same businessName
        //   - same businessNature
        //   - same businessLocation
        //   (purpose can be New or Renewal; we don't filter by purpose here)
        const {
          businessName: currentBusinessName,
          businessNature: currentBusinessNature,
          businessLocation: currentBusinessLocation,
        } = currentDoc.data;

        filteredDocs = matchingDocs.filter(({ data }) => {
          return (
            data.businessName === currentBusinessName &&
            data.businessNature === currentBusinessNature &&
            data.businessLocation === currentBusinessLocation
          );
        });
      } else {
        // 🔹 Default for other doc types:
        // residentId + docType + purpose
        filteredDocs = matchingDocs.filter(
          ({ data }) => data.purpose === newPurpose
        );
      }

      // ✅ Remove the current request from the list
      if (requestId) {
        filteredDocs = filteredDocs.filter(
          (d) => d.id !== requestId && d.data.requestId !== requestId
        );
      }

      // Map to our local type
      let allRequests: UserRequestData[] = filteredDocs.map(({ data }) => ({
        requestId: data.requestId,
        docType: data.docType,
        purpose: data.purpose,
        status: data.status,
        reqType: data.reqType,
        rejectionReason: data.rejectionReason,
        createdAt: data.createdAt,
        businessName: data.businessName,
        businessNature: data.businessNature,
        businessLocation: data.businessLocation,
      }));

      // Sort newest → oldest
      allRequests.sort(
        (a, b) => createdAtToMillis(b.createdAt) - createdAtToMillis(a.createdAt)
      );

      // 🔹 Always limit to last 3 previous requests (for ALL doc types)
      allRequests = allRequests.slice(0, 3);

      console.log("Sorted requests (final):", allRequests);

      setUserHistory(allRequests);
    });

    return () => unsubscribe();
  }, [residentId, docType, newPurpose, requestId]);

  console.log("User History Data:", UserHistory);

  const isBusinessDetailType = (type?: string) =>
    type != null && businessDetailDocTypes.includes(type);

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
                  Showing{" "}
                  {docType ? (
                    <>
                      {docType}
                      {newPurpose &&
                      newPurpose !== "undefined" &&
                      newPurpose !== "null" &&
                      newPurpose.trim() !== ""
                        ? ` (${newPurpose}) `
                        : " "}
                    </>
                  ) : (
                    "request "
                  )}
                  history for: <b>{requestorFname}</b>
                </p>

                <div className="userrequesthistory-list">
                  {UserHistory.length === 0 ? (
                    <div className="userrequesthistory-empty">
                      <img
                        src="/Images/no-results.png"
                        alt="No results"
                        className="no-result-icon-services"
                      />
                      <p>No requests found for this document.</p>
                    </div>
                  ) : (
                    UserHistory.map((request) => (
                      <div
                        key={request.requestId}
                        className="userrequesthistory-item"
                      >
                        <p>
                          <span className="label">Request ID:</span>{" "}
                          {request.requestId}
                        </p>
                        <p>
                          <span className="label">Date Requested:</span>{" "}
                          {formatCreatedAt(request.createdAt)}
                        </p>
                        <p>
                          <span className="label">Document Type:</span>{" "}
                          {request.docType}
                        </p>
                        <p>
                          <span className="label">Purpose:</span>{" "}
                          {request.purpose}
                        </p>
                        <p>
                          <span className="label">Status:</span>{" "}
                          {request.status}
                        </p>

                        {request.rejectionReason && (
                          <p>
                            <span className="label">Rejection Reason:</span>{" "}
                            {request.rejectionReason}
                          </p>
                        )}

                        {/* Extra details for Business Permit / Temporary Business Permit / Construction */}
                        {isBusinessDetailType(request.docType) && (
                          <>
                            {request.businessName && (
                              <p>
                                <span className="label">Business Name:</span>{" "}
                                {request.businessName}
                              </p>
                            )}
                            {request.businessNature && (
                              <p>
                                <span className="label">Business Nature:</span>{" "}
                                {request.businessNature}
                              </p>
                            )}
                            {request.businessLocation && (
                              <p>
                                <span className="label">
                                  Business Location:
                                </span>{" "}
                                {request.businessLocation}
                              </p>
                            )}
                          </>
                        )}
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
