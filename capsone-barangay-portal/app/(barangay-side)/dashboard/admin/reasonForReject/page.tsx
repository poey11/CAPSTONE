"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/User&Roles/ReasonForRejection.css";




const metadata:Metadata = { 
  title: "Reason For Rejection for Barangay Side",
  description: "Reason For Rejection for Barangay Side",
};

export default function reasonForRejection() {

    const router = useRouter();
    const handleBack = () => {
        router.push("/dashboard/admin");
    };


    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");


    const handleSubmitClick = async () => {
        setShowSubmitPopup(true);
    }

    const confirmSubmit = async () => {
        setShowSubmitPopup(false);

        setPopupMessage("Reason for Rejection submitted successfully!");
                setShowPopup(true);

                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                    router.push("/dashboard/admin");
                }, 3000);
    };
    
    return (
    <main className="reasonforrejection-main-container">
        <div className="section-1">
            <h1>Admin Module</h1>
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
