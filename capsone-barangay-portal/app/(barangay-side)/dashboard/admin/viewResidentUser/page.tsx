"use client";
import "@/CSS/User&Roles/ViewUser.css";
import { useEffect, useState, useRef } from "react";
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
    const [linkedResidentId, setLinkedResidentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showResidentsPopup, setShowResidentsPopup] = useState(false);
    const [showNoMatchResidentsPopup, setShowNoMatchResidentsPopup] = useState(false);
    const [linkedResidentName, setLinkedResidentName] = useState<string>("N/A");
    const [activeSection, setActiveSection] = useState("basic");
    const residentPopupRef = useRef<HTMLDivElement>(null);

    const handleRejectClick = (userId: string ) => {
        router.push(`/dashboard/admin/reasonForReject?id=${userId}`);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                residentPopupRef.current &&
                !residentPopupRef.current.contains(event.target as Node)
            ) {
                setShowResidentsPopup(false);
            }
        };
    
        if (showResidentsPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }
    
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showResidentsPopup]);

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
        { label: "Linked Resident", key: "residentId" },
    ];

    const handleBack = () => {
        if (ResidentUserData?.status === "Verified") {
            window.location.href = "/dashboard/admin/ResidentUsers";
        } else {
            window.location.href = "/dashboard/admin/ResidentUsers";
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
                    dateOfBirth: string;
                };
    
                return {
                    id: doc.id,
                    ...data
                };
            });
    
            setResidents(residentsList);
    
            const matchingResident = residentsList.find(resident =>
                resident.firstName?.toLowerCase().trim() === ResidentUserData.first_name?.toLowerCase().trim() &&
                resident.lastName?.toLowerCase().trim() === ResidentUserData.last_name?.toLowerCase().trim() &&
                resident.dateOfBirth?.trim() === ResidentUserData.dateOfBirth?.trim()
              );
              
    
            if (matchingResident) {
                // Open popup and prefill search term with matched name
                // for the residentId
                setLinkedResidentId(matchingResident.id);
                setSearchTerm(`${matchingResident.firstName} ${matchingResident.middleName} ${matchingResident.lastName}`);
                setShowResidentsPopup(true);
            } else {
                setShowNoMatchResidentsPopup(true);
            }
    
        } catch (error) {
            console.error("Error verifying resident:", error);
        }
    };


    const confirmAccept = async () => {
        if (!selectedUserId) return;
    
        try {
            await updateDoc(doc(db, "ResidentUsers", selectedUserId), {
                status: "Verified",
                residentId: linkedResidentId,
                
            });
    
            setPopupMessage("User accepted and linked successfully!");
            setShowPopup(true);

            // Create a notification for the resident
            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
            residentId: selectedUserId, // == user id
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

    const handleAcceptClick = (userId: string) => {
        setShowAcceptPopup(true);
        setSelectedUserId(userId);
    };

    

    return (
        <main className="view-user-main-container">
            <div className="view-user-main-content">
                <div className="view-user-main-section1">
                    <div className="view-user-header-first-section">
                        <img src="/Images/QClogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
                    </div>

                    <div className="view-user-header-second-section">
                        <h2 className="gov-info">Republic of the Philippines</h2>
                        <h2 className="gov-info">Quezon City</h2>
                        <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
                        <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
                        <h2 className="contact">930-0040 / 428-9030</h2>
                    </div>

                    <div className="view-user-header-third-section">
                        <img src="/Images/logo.png" alt="Brgy Logo" className="user-logo2-image-side-bar-1" />
                    </div>
                </div>

                <div className="view-user-header-body">
                    <div className="view-user-header-body-top-section">
                        <div className="view-user-backbutton-container">
                            <button onClick={handleBack}>
                                <img src="/images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident"/> 
                            </button>
                        </div>

                        <div className="view-pendinguser-info-toggle-wrapper">
                            {[ "basic" , "account", "others"].map((section) => (
                            <button
                                key={section}
                                type="button"
                                className={`user-info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                            >
                    
                                {section === "basic" && "Basic Info"}
                                {section === "account" && "Account Info"}
                                {section === "others" && "Others"}
                            </button>
                            ))}
                        </div>
                        <div className="action-btn-section-verify-section">
                            {ResidentUserData?.status !== "Verified" && (
                                <div className="action-btn-section-verify">
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


                    </div>

                    <div className="view-pendinguser-header-body-bottom-section">
                        <div className="view-pendinguser-info-main-container">
                            <div className="view-pendinguser-info-container-scrollable">
                                <div className="view-user-info-main-content">
                                {activeSection === "basic" && (
                                    <>
                                        <div className="view-main-user-content-left-side">
                                            <div className="view-pendinguser-fields-section">
                                                <p>Last Name</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="first_name"
                                                    value={ResidentUserData?.last_name || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>First Name</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="first_name"
                                                    value={ResidentUserData?.first_name || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Middle Name</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="middle_name"
                                                    value={ResidentUserData?.middle_name || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Address</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="address"
                                                    value={ResidentUserData?.address || "N/A"}
                                                    readOnly
                                                />
                                            </div>


                                        </div>

                                        <div className="view-main-user-content-right-side">
                                            <div className="view-pendinguser-fields-section">
                                                <p>Sex</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="sex"
                                                    value={ResidentUserData?.sex || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Birthday</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="dateOfBirth"
                                                    value={ResidentUserData?.dateOfBirth || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Contact Number</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="phone"
                                                    value={ResidentUserData?.phone || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Email Address</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="email"
                                                    value={ResidentUserData?.email || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                        </div>
                                    </>
                                )}

                                {activeSection === "account" && (
                                    <>
                                        <div className="view-main-user-content-left-side">
                                            <div className="view-pendinguser-fields-section">
                                                <p>Status</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="status"
                                                    value={ResidentUserData?.status || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Created At</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="createdAt"
                                                    value={ResidentUserData?.createdAt || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Reason For Reject</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="reasonForReject"
                                                    value={ResidentUserData?.rejectionReason || "N/A"}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="view-main-user-content-right-side">
                                            <div className="view-pendinguser-fields-section">
                                                <p>Role</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="role"
                                                    value={ResidentUserData?.role || "N/A"}
                                                    readOnly
                                                />
                                            </div>

                                            <div className="view-pendinguser-fields-section">
                                                <p>Linked Resident</p>
                                                <input
                                                    type="text"
                                                    className="view-user-input-field"
                                                    name="residentId"
                                                    value={residentUserId || "N/A"}
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                          
                                    </>
                                )}

                                {activeSection === "others" && (
                                    <><div className="view-user-requirement-section">
                                            <label className="view-user-requirements-label">Uploaded ID</label>
                                            <div className="view-user-container">
                                                {ResidentUserData?.upload ? (
                                                <div className="file-name-image-display">
                                                    <a
                                                    href={ResidentUserData.upload}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    >
                                                    <img
                                                        alt="Verification Requirement"
                                                        className="view-reqs-pic view-uploaded-pic"
                                                        style={{ cursor: 'pointer' }}
                                                        src={ResidentUserData.upload}
                                                    />
                                                    </a>
                                                </div>
                                                ) : (

                                                
                                            
                                                <div className="no-verification-files-text">
                                                    <p>No verification requirements uploaded.</p>
                                                </div>
                                                )}
                                            </div>
                                            </div>

                                    </>
                                )}
                                </div>
                            </div>
                        </div>

                    </div>

                    
                        
                </div>

            </div>

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
                                    <th className="verification-table-firsttitle">First Name</th>
                                    <th className="verification-table-firsttitle">Middle Name</th>
                                    <th className="verification-table-firsttitle">Last Name</th>
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
                                        <td>{resident.dateOfBirth}</td>
                                    </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                            </div>
                        </>
                        );
                })
                ()}

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
                    <div className="resident-table-popup" ref={residentPopupRef}>
    
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
                                <th className="verification-table-firsttitle">First Name</th>
                                <th className="verification-table-firsttitle">Middle Name</th>
                                <th className="verification-table-firsttitle">Last Name</th>
                                <th className="verification-table-firsttitle">Date Of Birth</th>
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
                                    onClick={() => {
                                        setSelectedUserId(residentUserId);
                                        setLinkedResidentId(resident.id);     // ✅ this is the critical part
                                        setShowResidentsPopup(false);
                                        setShowAcceptPopup(true);
                                    }}
                                    >
                                    <td>{resident.firstName}</td>
                                    <td>{resident.middleName}</td> 
                                    <td>{resident.lastName}</td>
                                    <td>{resident.dateOfBirth}</td>
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
                                            {resident.verificationFilesURLs ? (
                                                <div className="resident-id-container">
                                                    <img
                                                        src={resident.verificationFilesURLs}
                                                        alt="Resident's Valid ID"
                                                        className="resident-id-image"
                                                    />
                                                    <a
                                                        href={resident.verificationFilesURLs}
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
                                key={ResidentUserData.residentId}
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

                        </div>
                    </div>
                </div>
                )}

  
            {showAcceptPopup && (
                        <div className="view-residentuser-confirmation-popup-overlay-yesno">
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
