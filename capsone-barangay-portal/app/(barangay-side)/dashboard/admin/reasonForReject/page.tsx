"use client"

import { useRouter, useSearchParams} from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import { db } from '@/app/db/firebase';
import { doc, updateDoc, collection, setDoc , getDoc} from "firebase/firestore";
import "@/CSS/User&Roles/ReasonForRejection.css";




const metadata:Metadata = { 
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


    const handleBack = () => {
        router.push("/dashboard/admin");
    };

    const handleSubmitClick = async () => {
        setShowSubmitPopup(true);
    }

    const confirmSubmit = async () => {
        if (!userId) {
            console.error("User ID is missing!");
            return;
        }

        const finalReason = selectedReason === "others" ? otherReason.trim() : selectedReason;

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
    
            if (docSnap.exists()) {
                const data = docSnap.data();
                const currentCount = data.resubmissionCount || 0;
                const newCount = currentCount + 1;
                const newStatus = newCount >= 2 ? "Rejected" : "Resubmission";
    
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
                            ? `Your account was REJECTED due to: "${finalReason}".`
                            : `Your account was REJECTED due to: "${finalReason}". Reupload valid ID in your profile.`,
                    transactionType: "Verification",
                    timestamp: new Date(),
                    isRead: false,
                });
    
                setPopupMessage("Reason for Rejection submitted successfully!");
                setShowPopup(true);
    
                setTimeout(() => {
                    setShowPopup(false);
                    router.push(`/dashboard/admin?highlight=${userId}`);
                }, 3000);
            } else {
                console.error("User document does not exist.");
            }
        } catch (error) {
            console.error("Error updating rejection reason:", error);
        }
    };
    

    
    return (
    <main className="reasonforrejection-main-container">
        <div className="reasonforrejection-section-1">
            <h1>Reject Resident User</h1>
        </div>

        <div className="reasonforrejection-main-section">
            <div className="reasonforrejection-main-section1">
                <div className="reasonforrejection-main-section1-left">
                    <button onClick={handleBack}>
                        <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                    </button>

                    <h1>Reason For Rejection</h1>
                </div>
                <div className="action-btn-section">
                    <button className="submit-btn" onClick={handleSubmitClick}>Submit</button>
                </div>
            </div>

            <hr/>

            <div className="main-fields-container">
          <div className="fields-container">
            <div className="fields-section">
              <p>Select Reason for Rejection</p>
              <select
                className="input-field-reasonforreject"
                value={selectedReason}
                onChange={(e) => {
                  setSelectedReason(e.target.value);
                  if (e.target.value !== "others") setOtherReason("");
                }}
              >
                <option value="">Select Reason for Rejection</option>
                <option value="ID is blurry or unclear">ID is blurry or unclear</option>
                <option value="ID is expired">ID is expired</option>
                <option value="ID does not match the name on the account">ID does not match the name on the account</option>
                <option value="ID is not government-issued">ID is not government-issued</option>
                <option value="ID photo is cropped or partially shown">ID photo is cropped or partially shown</option>
                <option value="others">Others</option>
              </select>
            </div>

            {selectedReason === "others" && (
              <div className="fields-section">
                <p>State Other Reason</p>
                <textarea
                  className="reason"
                  placeholder="Enter Description"
                  rows={10}
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>
        </div>

            
        </div>


        {showSubmitPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <img src="/Images/question.png" alt="warning icon" className="clarify-icon-popup" />
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmSubmit} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay show`}>
                    <div className="popup">
                        <img src={"/Images/check.png"} alt="popup icon" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
        )}

        {showErrorPopup && (
                <div className={`error-popup-overlay show`}>
                    <div className="popup">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
        )}

    </main>
);
}
