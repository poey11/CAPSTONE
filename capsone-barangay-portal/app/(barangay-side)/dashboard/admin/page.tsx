"use client"
import React,{useState, useEffect, ChangeEvent} from "react";
import {db} from "../../../db/firebase";
import {collection, getDocs, onSnapshot, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/User&Roles.css";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface ResidentUser {
    id: string;
    first_name: string;
    last_name: string;
    address: string;
    phone: string;
    sex:string;
    validIdDoc:string;
    role: string;
    email: string;
    status:string;
  }
  
interface BarangayUser{
    id?: string;
    userId: string;
    position:string,
    password:string;
    role: string;
}

interface dbBarangayUser{
    id: string;
    userid: string;
    position:string,
    password:string;
    role: string;
    createdBy: string;
    createdAt: string;
    address: string;
    phone: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    sex: string;
}

const admin = () => {
    /*Kulang pa search and filter, downloadable/viewable ID pic column, and table actions are not yet working */
    const [users, setUsers] = useState<BarangayUser>({
        userId:"",
        position:"",
        password:"",
        role:"Barangay Official"
    });
    const [barangayUsers, setBarangayUsers] = useState<dbBarangayUser[]>([]);
    const [residentUsers, setResidentUsers] = useState<ResidentUser[]>([]);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedBarangayUserId, setSelectedBarangayUserId] = useState<string | null>(null);

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showAcceptPopup, setShowAcceptPopup] = useState(false); 
    const [showAlertPopup, setshowAlertPopup] = useState(false); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
       
            const fetchUsers = async() => {
                try{
                const barangayCollection = collection(db, "BarangayUsers");
                const unsubscribeBarangay = onSnapshot(barangayCollection, (snapshot) => {
                    const barangayData: dbBarangayUser[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as dbBarangayUser[];
                    setBarangayUsers(barangayData);
                });
            


                const residentCollection = collection(db, "ResidentUsers");
                const unsubscribeResidents = onSnapshot(residentCollection, (snapshot) => {
                    const residentData: ResidentUser[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as ResidentUser[];
                    setResidentUsers(residentData);
                });
           
                
                 // Cleanup function to unsubscribe when component unmounts
                return () => {
                    unsubscribeBarangay();
                    unsubscribeResidents();
                };
                
            }
            catch(error:String|any){
                console.log(error.message);
                setError("Failed to load residents");
            } finally {
                setLoading(false);
              }

        }
        fetchUsers();           
    },[])

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
            }, 3000);
        } catch (error) {
            console.error("Error updating user status:", error);
        } finally {
            setShowAcceptPopup(false);
            setSelectedUserId(null);
        }
    };


    const handleDeleteClick = (userId: string, userid: string) => {
        setDeleteUserId(userId);
        setSelectedBarangayUserId(userid);
        setShowDeletePopup(true); 
    };
    

    const confirmDelete = async () => {
        if (deleteUserId) {
            try {
                await deleteDoc(doc(db, "BarangayUsers", deleteUserId));
                setShowDeletePopup(false);
                setDeleteUserId(null);

                setPopupMessage("Barangay User deleted successfully!");
                setShowPopup(true);

                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                }, 3000);

            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };


    const router = useRouter();
   

    const [showPendingResidentTableContent, setShowPendingResidentTableContent] = useState(true); 
    const [showResidentTableContent, setShowResidentTableContent] = useState(false); 
    const [showBarangayTableContent, setShowBarangayTableContent] = useState(false);

    const handleToggleClickPendingResidentTable = () => {
        setShowPendingResidentTableContent(prevState => !prevState);
    };

    const handleToggleClickResidentTable = () => {
        setShowResidentTableContent(prevState => !prevState);
    };

    const handleToggleClickBarangayTable = () => {
        setShowBarangayTableContent(prevState => !prevState);
    };
    




    return (  
        <main className="user-roles-module-main-container">
            <div className="user-roles-module-section-1">
                <h1>Admin Module</h1>
                <Link href="/dashboard/admin/addBarangayUser">
                    <button className="add-announcement-btn">Add New Barangay User</button>
                </Link>
            </div>

            <div className="user-roles-main-section">

                <div className="resident-users">

                    <div className="resident-users-topsection">
                        <button type="button" 
                                className={showResidentTableContent ? "user-role-minus-button" : "user-role-plus-button"} 
                                onClick={handleToggleClickPendingResidentTable}>
                        </button>
                        <h1>Pending Resident Users Table</h1>
                    </div>

                    {showPendingResidentTableContent && (
                        <>

                            <div className="resident-users-main-section">

                                {loading && <p>Loading residents...</p>}
                                {error && <p className="error">{error}</p>}

                                {!loading && !error && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Phone</th>
                                            <th>Sex</th>
                                            <th>Role</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {residentUsers.filter(user => user.status !== "Verified").map((user) => (
                                            <tr key={user.id}>
                                            <td>{user.first_name} {user.last_name}</td>
                                            <td>{user.address}</td>
                                            <td>{user.phone}</td>
                                            <td>{user.sex}</td>
                                            <td>{user.role}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`status-badge ${user.status.toLowerCase().replace(" ", "-")}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button 
                                                        className="admin-action-view"
                                                        onClick={() => router.push(`/dashboard/admin/viewResidentUser?id=${user.id}`)}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            </div>
                        </>
                    )}

                    {showAcceptPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to accept this user?</p>
                                <h2>Resident ID: {selectedUserId}</h2>
                                <div className="yesno-container">
                                    <button onClick={() => setShowAcceptPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmAccept} className="yes-button">Yes</button>
                                </div> 
                            </div>
                        </div>
                    )}
                </div>

                <div className="resident-users">

                    <div className="resident-users-topsection">
                        <button type="button" 
                                className={showResidentTableContent ? "user-role-minus-button" : "user-role-plus-button"} 
                                onClick={handleToggleClickResidentTable}>
                        </button>
                        <h1>Resident Users Table</h1>
                    </div>

                    {showResidentTableContent && (
                        <>

                            <div className="resident-users-main-section">

                                {loading && <p>Loading residents...</p>}
                                {error && <p className="error">{error}</p>}

                                {!loading && !error && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Phone</th>
                                            <th>Sex</th>
                                            <th>Role</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {residentUsers.filter(user => user.status === "Verified").map((user) => (
                                            <tr key={user.id}>
                                            <td>{user.first_name} {user.last_name}</td>
                                            <td>{user.address}</td>
                                            <td>{user.phone}</td>
                                            <td>{user.sex}</td>
                                            <td>{user.role}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`status-badge ${user.status.toLowerCase().replace(" ", "-")}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button 
                                                        className="admin-action-view"
                                                        onClick={() => router.push(`/dashboard/admin/viewResidentUser?id=${user.id}`)}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            </div>
                        </>
                    )}
                </div>

                <div className="barangay-users">

                    <div className="resident-users-topsection">

                        <button type="button" 
                                className={showBarangayTableContent ? "user-role-minus-button" : "user-role-plus-button"} 
                                onClick={handleToggleClickBarangayTable}>
                        </button>
                        <h1>Barangay Users Table</h1>
                    </div>


                    {showBarangayTableContent && (
                        <>
                            <div className="barangay-users-main-section">

                            {loading && <p>Loading residents...</p>}
                            {error && <p className="error">{error}</p>}

                            {!loading && !error && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User ID</th>
                                            <th>Official Name</th>
                                            <th>Sex</th>
                                            <th>Birth Date</th>
                                            <th>Address</th>
                                            <th>Phone</th>
                                            <th>Position</th>
                                            <th>Created By</th>
                                            <th>Created At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {barangayUsers.map((user) => (
                                            <tr key={user.id}>
                                            <td>{user.userid}</td>
                                            <td>{user.firstName} {user.lastName}</td>
                                            <td>{user.sex}</td>
                                            <td>{user.birthDate}</td>
                                            <td>{user.address}</td>
                                            <td>{user.phone}</td>
                                            <td>{user.position}</td>
                                            <td>{user.createdBy}</td>
                                            <td>{user.createdAt}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button 
                                                        className="admin-action-view"
                                                        onClick={() => router.push(`/dashboard/admin/viewBarangayUser?id=${user.id}`)}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="admin-action-edit" 
                                                        onClick={() => router.push(`/dashboard/admin/modifyBarangayAcc?id=${user.id}`)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="admin-action-delete" 
                                                        onClick={() => handleDeleteClick(user.id, user.userid)}>
                                                            Delete
                                                    </button>
                                                </div>
                                            </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            </div>
                            
                        </>
                    )}
                    {showDeletePopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to delete this Barangay User?</p>
                                <h2>User ID: {selectedBarangayUserId}</h2>
                                <div className="yesno-container">
                                    <button onClick={() => setShowDeletePopup(false)} className="no-button">No</button>
                                    <button onClick={confirmDelete} className="yes-button">Yes</button>
                                </div> 
                            </div>
                        </div>
                    )}
                </div>

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
            </div>

            
        </main>

    );
}
 
export default admin;