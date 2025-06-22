"use client"

import { useRouter, useSearchParams} from "next/navigation";
import { useEffect, useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
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
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [data, setData] = useState<any>();
    useEffect(() => {
        if (!id) return
        try {
            const fetchData = async () => {
                // Fetch the document from Firestore
                const docRef = doc(db, "ServiceRequests", id);
                const docSnapshot = await getDoc(docRef);
                
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    setData(data);
                } else {
                    console.error("Document does not exist");
                }
            };
            fetchData();
        } catch (error: any) {
            console.error("Error fetching data:", error.message);
            
        }

    },[]);

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
    
        if (rejectionReason.reason.trim() === "") {
            setPopupErrorMessage("Please fill up all the fields.");
            setShowErrorPopup(true);
            setTimeout(() => {
                setShowErrorPopup(false);
            }, 3000);
            return;
        }
    
        setShowSubmitPopup(true);
    };
    


    const confirmSubmit = () => {
        try {
            handleRejection();
            setShowSubmitPopup(false)
            setPopupMessage("Reason for Rejection submitted successfully!");
            setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
                if(data?.reqType === "InBarangay") {
                    router.push(`/dashboard/ServicesModule/InBarangayRequests?highlight=${id}`);
                }
                else{
                    router.push(`/dashboard/ServicesModule/OnlineRequests?highlight=${id}`);
                }
                
            }, 3000);
        } catch (error) {
            console.error("Error updating rejection reason:", error);
        }
    };

    const handleRejection = async () => {
        try {
            if (!id) return;
            const docRef = doc(db, "ServiceRequests", id);
            const updatedData = {
                status: "Rejected",
                statusPriority: 4,
                rejectionReason: rejectionReason.reason,
            };
            await updateDoc(docRef, updatedData);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };
   

    return (
 
        <main className="reasonforrejection-main-container">
        <form onSubmit={handleSubmitClick}>
            <div className="reasonforreject-main-content">
                <div className="reasonforreject-main-section1">
                    <div className="reasonforreject-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Reason For Rejection </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-submit-reasonreject" type="submit">Submit</button>
                    </div>
                </div>

                <div className="reasonforreject-bottom-section">
                    <div className="box-container-outer-reasonforreject">
                        <div className="title-remarks-reasonforreject">
                            Reason For Reject
                        </div>
                        <div className="box-container-reasonforreject">
                            <textarea className="reasonforreject-input-field"
                                name="reason"
                                id="reason"
                                placeholder="Enter Reason For Reject"
                                value={rejectionReason.reason}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
        
        {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add-jobseeker">
                            <div className="confirmation-popup-add-jobseeker">
                            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmSubmit} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add-jobseeker show`}>
                    <div className="popup-add-jobseeker">
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
        )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add-jobseeker show`}>
                    <div className="popup-add-jobseeker">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
        )}


    </main>

    );
}