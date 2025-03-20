"use client";
import "@/CSS/User&Roles/ViewUser.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc} from "firebase/firestore";



export default function ViewUser() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const residentUserId = searchParams.get("id");

    const [ResidentUserData, setResidentUserData] = useState<any>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showAcceptPopup, setShowAcceptPopup] = useState(false); 
    const [showAlertPopup, setshowAlertPopup] = useState(false); 

    


    useEffect(() => {
        if (!residentUserId) return;

        const fetchResident = async () => {
            try {
                const docRef = doc(db, "ResidentUsers", residentUserId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setResidentUserData(docSnap.data());
                } else {
                    console.error("Resident User not found");
                }
            } catch (error) {
                console.error("Error fetching Resident User:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResident();
    }, [residentUserId]);

    if (loading) return <p>Loading...</p>;
    if (!residentUserId) return <p>Resident User not found</p>;

    const residentUserFields = [
        { label: "Resident First Name", key: "first_name" },
        { label: "Resident Last Name", key: "last_name" },
        { label: "Contact Number", key: "phone" },
        { label: "Sex", key: "sex" },
        { label: "Email", key: "email" },
        { label: "Address", key: "address" },
        { label: "Created At", key: "createdAt" },
        { label: "Role", key: "role" },
        { label: "Status", key: "status" },
    ];

    const handleBack = () => {
        window.location.href = "/dashboard/admin";
    };

    const handleAcceptClick = (userId: string) => {
        setShowAcceptPopup(true);
        setSelectedUserId(userId);
    };

    const confirmAccept = async () => {
            if (!selectedUserId) return;
        
            try {
                await updateDoc(doc(db, "ResidentUsers", selectedUserId), {
                    status: "Verified",
                });
        
                setPopupMessage("User accepted successfully!");
                setShowPopup(true);
        
                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                    router.push("/dashboard/admin");
                }, 3000);
            } catch (error) {
                console.error("Error updating user status:", error);
            } finally {
                setShowAcceptPopup(false);
                setSelectedUserId(null);
            }
        };

    

    return (
        <main className="viewresident-main-container">
            <div className="viewresident-page-title-section-1">
                <h1>Admin Module</h1>
            </div>

            <div className="viewresident-main-content">
                <div className="viewresident-section-1">
                    <div className="viewresident-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>
                        <h1>Resident User Details</h1>
                    </div>

                    {ResidentUserData?.status !== "Verified" && (
                        <div className="action-btn-section">
                            <button 
                                className="viewadmin-action-accept" 
                                onClick={() => handleAcceptClick(residentUserId)}
                            >
                                Accept
                            </button>
                            <button 
                                className="viewadmin-action-reject"
                                onClick={() => router.push(`/dashboard/admin/reasonForReject?id=${residentUserId}`)}
                            >
                                Reject
                            </button>
                        </div>
                    )}

                </div>

                
                {residentUserFields.map((field) => (
                    <div className="viewresident-details-section" key={field.key}>
                        <div className="viewresident-title">
                            <p>{field.label}</p>
                        </div>
                        <div className={`viewresident-description ${field.key === "residentNumber" ? "disabled-field" : ""}`}>
                            <p>{ResidentUserData[field.key] ?? "N/A"}</p>
                        </div>
                    </div>
                ))}

                
                {ResidentUserData.status === "Rejected" && (
                    <div className="viewresident-details-section">
                        <div className="viewresident-title">
                            <p>Reason for Rejection</p>
                        </div>
                        <div className="viewresident-description">
                            <p>{ResidentUserData.rejectionReason ?? "N/A"}</p>
                        </div>
                    </div>
                )}

                
                <div className="viewresident-details-section">
                    <div className="viewresident-title">
                        <p>Valid ID</p>
                    </div>
                    <div className="viewresident-description">
                        {ResidentUserData.validIdDocID ? (
                            <div className="resident-id-container">
                                <img
                                    src={ResidentUserData.validIdDocID}
                                    alt="Resident's Valid ID"
                                    className="resident-id-image"
                                />
                                <a
                                    href={ResidentUserData.validIdDocID}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-image-link"
                                >
                                    View Image
                                </a>
                            </div>
                        ) : (
                            <p>No ID uploaded</p>
                        )}
                    </div>
                </div>
            </div>

            {showAcceptPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to accept this user?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowAcceptPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmAccept} className="yes-button">Yes</button>
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

            {showAlertPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>{popupMessage}</p>
                                <div className="yesno-container">
                                    <button onClick={() => setshowAlertPopup(false)} className="no-button">Continue</button>
                                </div> 
                            </div>
                        </div>
            )}
        </main>
    );
}
