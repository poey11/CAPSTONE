"use client";
import "@/CSS/User&Roles/ViewUser.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, setDoc, getDocs } from "firebase/firestore";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

    const [residents, setResidents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showResidentsPopup, setShowResidentsPopup] = useState(false);
    const [showNoMatchResidentsPopup, setShowNoMatchResidentsPopup] = useState(false);
    const [linkedResidentName, setLinkedResidentName] = useState<string>("N/A");


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
                    const userData = docSnap.data();
                    setResidentUserData(userData);
    
                    // If the user has a linked resident ID, fetch their full name
                    if (userData.residentID) {
                        const linkedResidentRef = doc(db, "Residents", userData.residentID);
                        const linkedResidentSnap = await getDoc(linkedResidentRef);
    
                        if (linkedResidentSnap.exists()) {
                            const linkedResidentData = linkedResidentSnap.data();
                            const fullName = `${linkedResidentData.firstName || ""} ${linkedResidentData.middleName || ""} ${linkedResidentData.lastName || ""}`.trim();
                            setLinkedResidentName(fullName);
                        }
                    }
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
        { label: "First Name", key: "first_name" },
        { label: "Middle Name", key: "middle_name" },
        { label: "Last Name", key: "last_name" },
        { label: "Contact Number", key: "phone" },
        { label: "Sex", key: "sex" },
        { label: "Email", key: "email" },
        { label: "Date of Birth", key: "dateOfBirth" },
        { label: "Address", key: "address" },
        { label: "Created At", key: "createdAt" },
        { label: "Role", key: "role" },
        { label: "Status", key: "status" },
        { label: "Linked Resident", key: "residentID" },
    ];

    const handleBack = () => {
        if (ResidentUserData?.status === "Verified") {
            window.location.href = "/dashboard/admin/ResidentUsers";
        } else {
            window.location.href = "/dashboard/admin/PendingResidentUsers";
        }
    };

    const handleVerifyClick = async (userId: string) => {
        setSelectedUserId(userId);
        try {
            const residentsCollection = collection(db, "Residents");
            const residentsSnapshot = await getDocs(residentsCollection);
            const residentsList = residentsSnapshot.docs.map(doc => {
                const data = doc.data() as {
                    firstName: string;
                    middleName: string;
                    lastName: string;
                };
    
                return {
                    id: doc.id,
                    ...data
                };
            });
    
            setResidents(residentsList);
    
            const matchingResident = residentsList.find(resident =>
                resident.firstName?.toLowerCase().trim() === ResidentUserData.first_name?.toLowerCase().trim() &&
                resident.middleName?.toLowerCase().trim() === ResidentUserData.middle_name?.toLowerCase().trim() &&
                resident.lastName?.toLowerCase().trim() === ResidentUserData.last_name?.toLowerCase().trim()
            );
    
            if (matchingResident) {
                // Open popup and prefill search term with matched name
                setSearchTerm(`${matchingResident.firstName} ${matchingResident.middleName} ${matchingResident.lastName}`);
                setShowResidentsPopup(true);
            } else {
                setShowNoMatchResidentsPopup(true);
            }
    
        } catch (error) {
            console.error("Error verifying resident:", error);
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
    
            setPopupMessage("User accepted and linked successfully!");
            setShowPopup(true);

            // Create a notification for the resident
            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
            residentID: selectedUserId, // == user id
            message: `Your account is now VERIFIED and linked to your resident record.`,
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

               {/*
            <div className="path-section">
                <h1 className="breadcrumb">User and Roles<span className="chevron">/</span></h1>
                <h1 className="breadcrumb">
                    <Link
                        href={
                            ResidentUserData?.status === "Verified"
                            ? "/dashboard/admin/ResidentUsers"
                            : "/dashboard/admin/PendingResidentUsers"
                        }
                    >
                        {ResidentUserData?.status === "Verified"
                            ? "Resident Users"
                            : "Pending Resident Users"}
                    </Link>
                    <span className="chevron">/</span>
                </h1>
                <h2 className="breadcrumb">Resident User Details<span className="chevron"></span></h2>
            </div>
        

            <div className="viewresident-page-title-section-1">
                <h1>
                    {ResidentUserData?.status === "Verified"
                        ? "Resident Users"
                        : "Pending Resident Users"}
                </h1>
            </div>
            */}


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
                                onClick={() => handleVerifyClick(residentUserId)}
                            >
                                Verify
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
                                {field.key === "residentID" ? (
                                    ResidentUserData.residentID ? (
                                        <a 
                                            href={`/dashboard/ResidentModule/ViewResident?id=${ResidentUserData.residentID}`} 
                                            className="linked-resident-link" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            {linkedResidentName}
                                        </a>
                                    ) : (
                                        <p>N/A</p>
                                    )
                                ) : (
                                    <p>{ResidentUserData[field.key] ?? "N/A"}</p>
                                )}
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

                {ResidentUserData.reupload && (
                    <div className="viewresident-details-section">
                        <div className="viewresident-title">
                            <p>Reupload Valid ID</p>
                        </div>
                        <div className="viewresident-description">
                            <div className="resident-id-container">
                                <img
                                    src={ResidentUserData.reupload}
                                    alt="Resident's Reuploaded ID"
                                    className="resident-id-image"
                                />
                                <a
                                    href={ResidentUserData.reupload}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-image-link"
                                >
                                    View Image
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Popup for No match Residents */}
            {showNoMatchResidentsPopup && (
  <div className="view-residentuser-confirmation-popup-overlay">
    <div className="resident-table-popup">
      <h2>Resident Database Verification</h2>

      {(() => {
        const selectedName = `${ResidentUserData.first_name} ${ResidentUserData.middle_name} ${ResidentUserData.last_name}`.toLowerCase().trim();

        const matchingResidents = residents.filter(resident => {
          const residentName = `${resident.firstName} ${resident.middleName} ${resident.lastName}`.toLowerCase().trim();
          return residentName === selectedName;
        });

        return (
          <>
            <h1>{matchingResidents.length === 0 ? "* 0 Matches *" : `* ${matchingResidents.length} Match(es) *`}</h1>
            
            {/* Table will always render, even with no matches */}
            <div className="matched-table-container">
              <table className="resident-table">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Last Name</th>
                  </tr>
                </thead>
                <tbody>
                  {matchingResidents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="no-matches">No matches found</td>
                    </tr>
                  ) : (
                    matchingResidents.map(resident => (
                      <tr
                        key={resident.id}
                        className="resident-table-row"
                        onClick={() =>
                          router.push(`/dashboard/ResidentModule/ViewResident?id=${resident.id}`)
                        }
                      >
                        <td>{resident.firstName}</td>
                        <td>{resident.middleName}</td>
                        <td>{resident.lastName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      <div className="verification-buttons-section">
        <div className="verification-action-buttons">
          <button
            onClick={() => setShowNoMatchResidentsPopup(false)}
            className="viewadmin-action-cancel"
          >
            Cancel
          </button>

          <button
            className="viewadmin-action-reject"
            onClick={() => handleRejectClick(residentUserId)}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
)}

            {/* Popup for With Resident Match */}
            {showResidentsPopup && (
                <div className="view-residentuser-confirmation-popup-overlay">
                    <div className="resident-table-popup">
    
                        <h2>
                            Resident Database Verification
                        </h2>

                        <h1>
                        {
                            residents.filter(resident =>
                            `${resident.firstName} ${resident.middleName} ${resident.lastName}`
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            ).length > 0
                            ? `* ${residents.filter(resident =>
                                `${resident.firstName} ${resident.middleName} ${resident.lastName}`
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                                ).map(resident => `Resident Number ${resident.residentNumber}`).join(", ")} *`
                            : ""
                        }
                        </h1>
               
                    
            
                        <div className="matched-table-container">
                            <table className="resident-table">
                            <thead>
                                <tr>
                                <th>First Name</th>
                                <th>Middle Name</th>
                                <th>Last Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {residents
                                .filter(resident =>
                                    `${resident.firstName} ${resident.middleName} ${resident.lastName}`
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                                )
                                .map(resident => (
                                    <tr
                                        key={resident.id}
                                        className="resident-table-row"
                                        onClick={() => router.push(`/dashboard/ResidentModule/ViewResident?id=${resident.id}`)}
                                    >
                                    <td>{resident.firstName}</td>
                                    <td>{resident.middleName}</td>
                                    <td>{resident.lastName}</td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>



                        <div className="verification-section">

                            {/* Resident Database */}
                            <div className="resident-table-container">
                            {residents
                                .filter(resident =>
                                `${resident.firstName} ${resident.middleName} ${resident.lastName}`
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                                )
                                .map(resident => (
                                <table
                                    key={resident.id}
                                    className="resident-table individual-resident-table"
                                >
                                    <thead>
                                    <tr>
                                        <th colSpan={2} className="verification-table-title sticky-table-title">
                                            Resident Database
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <th>Address</th>
                                        <td>{resident.address || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <th>Date of Birth</th>
                                        <td>{resident.dateOfBirth || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <th>Contact Number</th>
                                        <td>{resident.contactNumber || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <th>Sex</th>
                                        <td>{resident.sex || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <th>Valid ID</th>
                                        <td>
                                            {resident.fileURL ? (
                                                <div className="resident-id-container">
                                                    <img
                                                        src={resident.fileURL}
                                                        alt="Resident's Valid ID"
                                                        className="resident-id-image"
                                                    />
                                                    <a
                                                        href={resident.fileURL}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="view-image-link"
                                                    >
                                                        View Image
                                                    </a>
                                                </div>
                                            ) : (
                                                "No ID uploaded"
                                            )}
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                                ))}
                            </div>


                            {/* Resident Users */}
                            <div className="resident-table-container">
                            <table
                                key={ResidentUserData.residentID}
                                className="resident-table individual-resident-table"
                            >
                                <thead>
                                <tr>
                                    <th colSpan={2} className="verification-table-title">
                                    Pending Resident User
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <th>Address</th>
                                    <td>{ResidentUserData.address || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>Date of Birth</th>
                                    <td>{ResidentUserData.dateOfBirth || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>Contact Number</th>
                                    <td>{ResidentUserData.phone || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>Sex</th>
                                    <td>{ResidentUserData.sex || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>
                                        {ResidentUserData.status === "Resubmission" ? "Reupload Valid ID" : "Valid ID"}
                                    </th>
                                    <td>
                                        {ResidentUserData.status === "Resubmission"
                                        ? ResidentUserData.reupload
                                            ? (
                                            <div className="resident-id-container">
                                                <img
                                                src={ResidentUserData.reupload}
                                                alt="Reuploaded Valid ID"
                                                className="resident-id-image"
                                                />
                                                <a
                                                href={ResidentUserData.reupload}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="view-image-link"
                                                >
                                                View Image
                                                </a>
                                            </div>
                                            )
                                            : "No reuploaded ID"
                                        : ResidentUserData.upload
                                            ? (
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
                                            )
                                            : "No ID uploaded"
                                        }
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                            </div>
                        </div>
                    
                  
                        <div className="verification-buttons-section">
                            <div className="verification-action-buttons">
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

                            </div>

                            <button
                                onClick={() => setShowResidentsPopup(false)}
                                className="viewadmin-action-cancel"
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
                )}

  
            {showAcceptPopup && (
                        <div className="view-residentuser-confirmation-popup-overlay">
                            <div className="view-residentuser-confirmation-popup">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to accept this user?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowAcceptPopup(false)} className="no-button">No</button>
                                    <button onClick={() => {
                                        confirmAccept();
                                        setShowResidentsPopup(false);
                                        }} className="yes-button">Yes
                                    </button>
                                </div> 
                            </div>
                        </div>
            )}


            {showPopup && (
                <div className={`view-residentuser-popup-overlay show`}>
                    <div className="view-residentuser-popup">
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
            )}

            {showAlertPopup && (
                <div className="view-residentuser-confirmation-popup-overlay">
                    <div className="view-residentuser-confirmation-popup">
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
