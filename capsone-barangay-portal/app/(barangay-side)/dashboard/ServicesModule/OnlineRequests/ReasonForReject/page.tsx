"use client"

import { useRouter, useSearchParams} from "next/navigation";
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import "@/CSS/User&Roles/ReasonForRejection.css";

interface rejectProp {
    reason: string;
}


export default function reasonForRejection() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [rejectionReason, setRejectionReason] = useState<rejectProp>({
        reason: "",
    });
    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setRejectionReason({
            ...rejectionReason,
            [e.target.name]: e.target.value,
        });
    };
    const handleBack = () => {
        router.back();
    };

    const handleSubmitClick = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setShowSubmitPopup(true);
    }


    const confirmSubmit = () => {
        try {
            handleRejection();
            setPopupMessage("Reason for Rejection submitted successfully!");
            setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
                router.push("/dashboard/ServicesModule/OnlineRequests");
            }, 3000);
        } catch (error) {
            console.error("Error updating rejection reason:", error);
        }
    };

    const handleRejection = async() => {
        try {
            if(!id) return
            const docRef = doc(db, "ServiceRequests", id);
            const updatedData = {
                status: "Rejected",
                statusPriority: 4,
                rejectionReason: rejectionReason.reason,                

            }
            await updateDoc(docRef, updatedData).then(() => {
                alert("Status Updated");
            });
            
        } catch (error) {
            console.error("Error updating status:", error);
        }

    }
   

    return (

        <main className="reasonforrejection-main-container">
        <div className="reasonforrejection-section-1">
            <h1>Reject Resident User</h1>
        </div>
        <form onSubmit={handleSubmitClick}>
            <div className="reasonforrejection-main-section">
                <div className="reasonforrejection-main-section1">
                    <div className="reasonforrejection-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>

                        <h1>Reason For Rejection</h1>
                    </div>
                    <div className="action-btn-section">
                        <button className="submit-btn" type="submit">Submit</button>
                    </div>
                </div>

                <hr/>

                <div className="main-fields-container">
                    <div className="fields-container">
                        <div className="fields-section">
                            <p>State the Reason for Rejection</p>
                                <textarea 
                                    className="reason" 
                                    name="reason"
                                    id="reason"
                                    placeholder="Enter Description"
                                    rows={10}
                                    value={rejectionReason.reason}
                                    onChange={handleInputChange}
                                />
                        </div>
                    </div>

                </div>

            </div>
        </form>
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