"use client";
import "@/CSS/User&Roles/ViewUser.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, setDoc} from "firebase/firestore";
import { useSession } from "next-auth/react";
import { label } from "framer-motion/m";


export default function ViewUser() {

    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const userPosition = session?.user?.position;
    const isAuthorized = ["Assistant Secretary"].includes(userPosition || "");

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

    
    const handleRejectClick = (userId: string ) => {
        router.push(`/dashboard/admin/reasonForReject?id=${userId}`);
    };

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
        {label: "Date of Birth", key: "dateOfBirth" },
        { label: "Address", key: "address" },
        { label: "Created At", key: "createdAt" },
        { label: "Role", key: "role" },
        { label: "Status", key: "status" },
    ];

    const handleBack = () => {
        if (ResidentUserData?.status === "Verified") {
            window.location.href = "/dashboard/admin/ResidentUsers";
        } else {
            window.location.href = "/dashboard/admin/PendingResidentUsers";
        }
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

            // Create a notification for the resident
            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
            residentID: selectedUserId, // == user id
            message: `Your account is now VERIFIED.`,
            transactionType: "Verification",
            timestamp: new Date(),
            isRead: false,
            });
                
                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                    //router.push("/dashboard/admin");
                    router.push(`/dashboard/admin/ResidentUsers?highlight=${selectedUserId}`);
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
                <h1>
                    {ResidentUserData?.status === "Verified"
                        ? "Resident Users"
                        : "Pending Resident Users"}
                </h1>
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
                            {isAuthorized ? (
                            <>
                            <button 
                                className="viewadmin-action-accept" 
                                onClick={() => handleAcceptClick(residentUserId)}
                            >
                                Accept
                            </button>
                            <button 
                                className="viewadmin-action-reject" 
                                onClick={() => handleRejectClick(residentUserId)}
                            >
                                Reject
                            </button>
                            </>
                        ) : (
                            <>
                            <button className="residentmodule-action-edit opacity-0 cursor-not-allowed" disabled>
                                Edit
                            </button>
                            <button className="residentmodule-action-delete opacity-0 cursor-not-allowed" disabled>
                                Reject
                            </button>
                            </>
                        )}
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

                
                {ResidentUserData.status === "Resubmission" && (
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
                        {ResidentUserData.upload ? (
                            <div className="resident-id-container">
                                <img
                                    src={ResidentUserData.upload}
                                    alt="Resident's Valid ID"
                                    className="resident-id-image"
                                />
                                <a
                                    href={ResidentUserData.upload}
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
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
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
                    <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
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
