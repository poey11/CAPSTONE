"use client"

import { useRouter, useSearchParams} from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import { db } from '@/app/db/firebase';
import { doc, updateDoc } from "firebase/firestore";
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
    const [rejectionReason, setRejectionReason] = useState("");


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

        try {
            const docRef = doc(db, "ResidentUsers", userId);
            await updateDoc(docRef, {
                rejectionReason: rejectionReason.trim(),
                status: "Rejected",
            });

            setPopupMessage("Reason for Rejection submitted successfully!");
            setShowPopup(true);

            setTimeout(() => {
                setShowPopup(false);
                router.push("/dashboard/admin");
            }, 3000);
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
                        <p>State the Reason for Rejection</p>
                            <textarea 
                                className="reason" 
                                placeholder="Enter Description"
                                rows={10}
                                value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            ></textarea>
                    </div>
                </div>

            </div>
            
        </div>


        {showSubmitPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
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
                        <p>{popupMessage}</p>
                    </div>
                </div>
        )}

    </main>
);
}
