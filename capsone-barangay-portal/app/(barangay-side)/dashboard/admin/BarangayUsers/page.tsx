"use client"
import React,{useState, useEffect} from "react";
import {db} from "../../../../db/firebase";
import {collection, onSnapshot, deleteDoc, doc, updateDoc, setDoc, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/User&Roles.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from 'next/navigation';

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



const BarangayUsers = () => {


        const { data: session } = useSession();
        const userPosition = session?.user?.position;
        const isAuthorized = ["Assistant Secretary"].includes(userPosition || "");

        const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    
       
        const [barangayUsers, setBarangayUsers] = useState<dbBarangayUser[]>([]);
        const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
        const [selectedBarangayUserId, setSelectedBarangayUserId] = useState<string | null>(null);
    
        const [showPopup, setShowPopup] = useState(false);
        const [popupMessage, setPopupMessage] = useState("");
        const [showDeletePopup, setShowDeletePopup] = useState(false);
        const [showAlertPopup, setshowAlertPopup] = useState(false); 
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
    
        const router = useRouter();

        const [showBarangayTableContent, setShowBarangayTableContent] = useState(false);
    
        const searchParams = useSearchParams();
        const highlightUserId = searchParams.get("highlight");
        const [highlightedId, setHighlightedId] = useState<string | null>(null);

        const handleAddBarangayUserClick = () => {
  
            if (isAuthorized) {
              router.push("/dashboard/admin/addBarangayUser");
            } else {
              alert("You are not authorized to create a new barangay user.");
              router.refresh(); // Refresh the page
            }
          };

          const handleEditBarangayUserClick = (id: string) => {
            if (isAuthorized) {
              router.push(`/dashboard/admin/modifyBarangayAcc?id=${id}`);
            } else {
              alert("You are not authorized to edit a resident.");
              router.refresh(); // Refresh the page
            }
          };

          const handleDeleteBarangayUserClick = async (docId: string,) => {
            if (isAuthorized) {
                setDeleteUserId(docId);

                // Find the actual user object to get the custom user ID
                const user = barangayUsers.find((user) => user.id === docId);
                setSelectedBarangayUserId(user?.userid || ""); // Use the custom userid field here
            
                setShowDeletePopup(true);
    
            } else {
              alert("You are not authorized to delete this resident.");
              router.refresh(); // Refresh the page
            }
          };

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
                     
                          
                           // Cleanup function to unsubscribe when component unmounts
                          return () => {
                              unsubscribeBarangay();
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


        useEffect(() => {
                if (highlightUserId) {
                    setHighlightedId(highlightUserId);
            
                    const scrollAndHighlight = () => {
                        const targetElement = document.querySelector(`tr.highlighted-row`);
                        if (targetElement) {
                            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                    };
        
                    const isInBarangay = barangayUsers.some(
                        (user) => user.userid === highlightUserId
                    );
            
                    if (isInBarangay && !showBarangayTableContent) {
                        setShowBarangayTableContent(true);
                        setTimeout(scrollAndHighlight, 200);
                    } else {
                        setTimeout(scrollAndHighlight, 200);
                    }
            
                    const timeoutId = setTimeout(() => {
                        setHighlightedId(null);
                    }, 5000);
            
                    return () => clearTimeout(timeoutId);
                }
            }, [highlightUserId, barangayUsers]);

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

    return (
        <main className="barangayusers-page-main-container">
            <div className="user-roles-module-section-1">
                <h1>Barangay Users</h1>
                {isAuthorized &&(
                    <Link href="/dashboard/admin/addBarangayUser">
                    <button className="add-announcement-btn" onClick={handleAddBarangayUserClick}>Add New Barangay User</button>
                    </Link>
                )}
            </div>

            {/* 
                Will Add Functionality of the Filters
            */}
            <div className="barangayusers-page-section-2">
                <input
                    type="text"
                    className="barangayusers-page-filter"
                    placeholder="Search by Name"
                />

                <input
                    type="text"
                    className="barangayusers-page-filter"
                    placeholder="Search by Position"
                />
                
                <select className="barangayusers-page-filter">
                    <option value="">Position</option>
                    <option value="Punong Barangay">Punong Barangay</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Assistant Secretary">Asst Secretary</option>
                    <option value="Admin Staff">Admin Staff</option>
                    <option value="LF Staff">LF Staff</option>
                </select> 

                <input
                    type="text"
                    className="barangayusers-page-filter"
                    placeholder="Search by Address"
                />

                <select
                    className="barangayusers-page-filter"
                >
                    <option value="0">Show All</option>
                    <option value="5">Show 5</option>
                    <option value="10">Show 10</option>
                </select>
            </div>

            <div className="barangayusers-page-main-section">

                <>

                {loading && <p>Loading residents...</p>}
                {error && <p className="error">{error}</p>}

                {!loading && !error && (
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    User ID
                                    {/*
                                        Also need to implement
                                     */}
                                    <button
                                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                        className="sort-button"
                                    >
                                        {sortOrder === "asc" ? "▲" : "▼"}
                                    </button>
                                </th>
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
                                <tr key={user.id}
                                    className={highlightedId === user.userid ? "highlighted-row" : ""}
                                >
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
                                    {isAuthorized ? (
                                        <>
                                        <button 
                                            className="admin-action-edit" 
                                            onClick={() => handleEditBarangayUserClick(user.id)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="admin-action-delete" 
                                            onClick={() => handleDeleteBarangayUserClick(user.id)}
                                        >
                                            Delete
                                        </button>
                                        </>
                                    ) : (
                                        <>
                                        <button className="residentmodule-action-edit opacity-0 cursor-not-allowed" disabled>
                                            Edit
                                        </button>
                                        <button className="residentmodule-action-delete opacity-0 cursor-not-allowed" disabled>
                                            Delete
                                        </button>
                                        </>
                                    )}
                                </div>
                                </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                </>
            </div>



            {showDeletePopup && (
                        <div className="user-roles-confirmation-popup-overlay">
                            <div className="barangayusers-confirmation-popup">
                            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to delete this Barangay User?</p>
                                <h2>User ID: {selectedBarangayUserId}</h2>
                                <div className="user-roles-yesno-container">
                                    <button onClick={() => setShowDeletePopup(false)} className="user-roles-no-button">No</button>
                                    <button onClick={confirmDelete} className="user-roles-yes-button">Yes</button>
                                </div> 
                            </div>
                        </div>
                    )}

            {showPopup && (
                <div className={`user-roles-popup-overlay show`}>
                    <div className="user-roles-popup">
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}
            
            {showAlertPopup && (
                        <div className="user-roles-confirmation-popup-overlay">
                            <div className="user-roles-confirmation-popup">
                                <p>{popupMessage}</p>
                                <div className="user-roles-yesno-container">
                                    <button onClick={() => setshowAlertPopup(false)} className="user-roles-no-button">Continue</button>
                                </div> 
                            </div>
                        </div>
                    )}
        </main>
    );
}

export default BarangayUsers;
