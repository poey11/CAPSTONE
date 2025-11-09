"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Metadata } from "next";
import { useState, useEffect } from "react";
import { db } from "@/app/db/firebase";
import {
  doc,
  updateDoc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import "@/CSS/User&Roles/ReasonForRejection.css";
import Link from "next/link";

const metadata: Metadata = {
  title: "Reason For Rejection for Barangay Side",
  description: "Reason For Rejection for Barangay Side",
};

export default function reasonForRejection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  // 🔍 Track if this user has a match in the barangay DB (via name + DOB)
  const [hasMatch, setHasMatch] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) return;

    const checkMatch = async () => {
      try {
        // 1. Get the ResidentUsers record
        const userRef = doc(db, "ResidentUsers", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setHasMatch(false);
          return;
        }

        const userData = userSnap.data() as {
          first_name?: string;
          middle_name?: string;
          last_name?: string;
          dateOfBirth?: string;
        };

        const firstName = (userData.first_name || "").trim();
        const middleName = (userData.middle_name || "").trim();
        const lastName = (userData.last_name || "").trim();
        const dateOfBirth = (userData.dateOfBirth || "").trim();

        // If any piece of info is missing, we can't reliably match → treat as no match
        if (!firstName || !lastName || !dateOfBirth) {
          setHasMatch(false);
          return;
        }

        // 2. Query Residents collection using the name + DOB
        const residentsRef = collection(db, "Residents");
        const qResidents = query(
          residentsRef,
          where("firstName", "==", firstName),
          where("middleName", "==", middleName),
          where("lastName", "==", lastName),
          where("dateOfBirth", "==", dateOfBirth)
        );

        const residentsSnap = await getDocs(qResidents);

        // If there is at least one matching record → hasMatch = true
        setHasMatch(!residentsSnap.empty);
      } catch (err) {
        console.error("Error checking resident match:", err);
        setHasMatch(false);
      }
    };

    checkMatch();
  }, [userId]);

  const handleBack = () => {
    router.push(`/dashboard/admin/ResidentUsers?id=${userId}`);
  };

  const handleSubmitClick = async () => {
    setShowSubmitPopup(true);
  };

  const confirmSubmit = async () => {
    if (!userId) {
      console.error("User ID is missing!");
      return;
    }

    const finalReason =
      selectedReason === "others" ? otherReason.trim() : selectedReason;

    if (!finalReason) {
      setPopupErrorMessage("Please select a reason before submitting.");
      setShowSubmitPopup(false);
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }

    try {
      const docRef = doc(db, "ResidentUsers", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error("User document does not exist.");
        return;
      }

      const data = docSnap.data();
      const currentCount = (data.resubmissionCount as number | undefined) || 0;
      const newCount = currentCount + 1;

      // 🔍 Use the same matching logic as above to determine hasMatchInDB
      const userData = data as {
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        dateOfBirth?: string;
      };

      const firstName = (userData.first_name || "").trim();
      const middleName = (userData.middle_name || "").trim();
      const lastName = (userData.last_name || "").trim();
      const dateOfBirth = (userData.dateOfBirth || "").trim();

      let hasMatchInDB = false;

      if (firstName && lastName && dateOfBirth) {
        const residentsRef = collection(db, "Residents");
        const qResidents = query(
          residentsRef,
          where("firstName", "==", firstName),
          where("middleName", "==", middleName),
          where("lastName", "==", lastName),
          where("dateOfBirth", "==", dateOfBirth)
        );
        const residentsSnap = await getDocs(qResidents);
        hasMatchInDB = !residentsSnap.empty;
      }

        // ✅ Status rules:
        // - If NO match: auto Rejected (kahit ano reason, including Others)
        // - If HAS match:
        //     • 1st rejection  -> Resubmission
        //     • 2nd rejection -> Rejected
        let newStatus: "Rejected" | "Resubmission";

        if (!hasMatchInDB) {
        // No record in Residents → auto reject
        newStatus = "Rejected";
        } else {
        // Has match in Residents → use resubmissionCount
        // currentCount = previous rejections; newCount = currentCount + 1
        if (newCount >= 2) {
            newStatus = "Rejected";
        } else {
            newStatus = "Resubmission";
        }
        }


      await updateDoc(docRef, {
        rejectionReason: finalReason,
        resubmissionCount: newCount,
        status: newStatus,
      });

      const notificationRef = doc(collection(db, "Notifications"));
      await setDoc(notificationRef, {
        residentID: userId,
        message:
          newStatus === "Rejected"
            ? `Your account was REJECTED due to: "${finalReason}". 24 hours until deactivation.`
            : `Your account was REJECTED due to: "${finalReason}". Reupload valid ID in your profile.`,
        transactionType: "Verification",
        timestamp: new Date(),
        isRead: false,
      });

      setShowSubmitPopup(false);
      setPopupMessage("Reason for Rejection submitted successfully!");
      setShowPopup(true);

      setTimeout(() => {
        setShowPopup(false);
        router.push(`/dashboard/admin/ResidentUsers?highlight=${userId}`);
      }, 3000);
    } catch (error) {
      console.error("Error updating rejection reason:", error);
    }
  };

  return (
    <main className="reasonforrejection-main-container">
      <div className="add-barangayuser-main-content">
        <div className="add-barangayuser-main-section1">
          <div className="add-barangayuser-main-section1-left">
            <button onClick={handleBack}>
              <img
                src="/Images/left-arrow.png"
                alt="Left Arrow"
                className="back-btn"
              />
            </button>

            <h1> Reason For Rejection </h1>
          </div>

          <div className="action-btn-section">
            <button className="submit-btn" onClick={handleSubmitClick}>
              Submit
            </button>
          </div>
        </div>

        <div className="create-new-barangay-user">
          <div className="fields-container-barangay-user">
            <div className="fields-container-reasonforreject">
              <div className="fields-section-reasonforreject">
                <p>Select Reason for Rejection:</p>
                <select
                  className="input-field-reasonforreject"
                  value={selectedReason}
                  onChange={(e) => {
                    setSelectedReason(e.target.value);
                    if (e.target.value !== "others") setOtherReason("");
                  }}
                >
                  <option value="">Select Reason</option>

                  {/* If NO match in DB: show only "User not a resident" + "Others" */}
                  {hasMatch === false && (
                    <>
                      <option value="User not a resident">
                        User not a resident
                      </option>
                      <option value="others">Others</option>
                    </>
                  )}

                  {/* If HAS match in DB: show ID-related options + Others */}
                  {hasMatch === true && (
                    <>
                      <option value="ID is blurry or unclear">
                        ID is blurry or unclear
                      </option>
                      <option value="ID is expired">ID is expired</option>
                      <option value="ID does not match the name on the account">
                        ID does not match the name on the account
                      </option>
                      <option value="ID is not government-issued">
                        ID is not government-issued
                      </option>
                      <option value="ID photo is cropped or partially shown">
                        ID photo is cropped or partially shown
                      </option>
                      <option value="others">Others</option>
                    </>
                  )}

                  {/* While hasMatch is still loading, we don't add any options beyond the placeholder */}
                </select>
              </div>

              <div className="fields-section-reasonforreject">
                <p>State Other Reason</p>
                <textarea
                  className="reason"
                  placeholder="Enter Description"
                  rows={5}
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  disabled={selectedReason !== "others"}
                ></textarea>
                {selectedReason !== "others" && (
                  <p
                    className="helper-text"
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginTop: "5px",
                    }}
                  >
                    You must select ‘Others’ above to type in this field.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSubmitPopup && (
        <div className="confirmation-popup-overlay-reject">
          <div className="confirmation-popup-reject">
            <img
              src="/Images/question.png"
              alt="warning icon"
              className="clarify-icon-popup"
            />
            <p>Are you sure you want to submit?</p>
            <div className="yesno-container">
              <button
                onClick={() => setShowSubmitPopup(false)}
                className="no-button"
              >
                No
              </button>
              <button onClick={confirmSubmit} className="yes-button">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className={`popup-overlay-reject show`}>
          <div className="popup-reject">
            <img
              src={"/Images/check.png"}
              alt="popup icon"
              className="icon-alert"
            />
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {showErrorPopup && (
        <div className={`error-popup-overlay-reject show`}>
          <div className="popup-reject">
            <img
              src={"/Images/warning-1.png"}
              alt="popup icon"
              className="icon-alert"
            />
            <p>{popupErrorMessage}</p>
          </div>
        </div>
      )}
    </main>
  );
}
