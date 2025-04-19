"use client"
import React,{useState, useEffect} from "react";
import {db} from "../../../../db/firebase";
import {collection, onSnapshot, deleteDoc, doc, updateDoc, setDoc, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/User&Roles.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from 'next/navigation';


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

const ResidentUsers = () => {

    const { data: session } = useSession();
    const userPosition = session?.user?.position;
    const isAuthorized = ["Assistant Secretary"].includes(userPosition || "");
    const [residentUsers, setResidentUsers] = useState<ResidentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();     
    const [showResidentTableContent, setShowResidentTableContent] = useState(false); 
    const searchParams = useSearchParams();
    const highlightUserId = searchParams.get("highlight");
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightUserId) {
            setHighlightedId(highlightUserId);
            
            const scrollAndHighlight = () => {
                const targetElement = document.querySelector(`tr.highlighted-row`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            };
            
            const isInPending = residentUsers.some(
                (user) => user.id === highlightUserId && user.status !== "Verified" && user.status !== "Rejected"
            );
            const isInVerified = residentUsers.some(
                (user) => user.id === highlightUserId && user.status === "Verified"
            );
                    
            
            // Expand the correct section
            if (isInVerified && !showResidentTableContent) {
                setShowResidentTableContent(true);
                setTimeout(scrollAndHighlight, 200); // wait for DOM update
            } else {
                setTimeout(scrollAndHighlight, 200);
            }
            
            const timeoutId = setTimeout(() => {
                setHighlightedId(null);
            }, 5000);
            
            return () => clearTimeout(timeoutId);
        }
    }, [highlightUserId, residentUsers]);


    useEffect(()=>{               
        const fetchUsers = async() => {
            try{
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

    return(
        <main className="residentusers-page-main-container">
            <div className="user-roles-module-section-1">
                <h1>Resident Users</h1>
            </div>

            {/* 
                Will Add Functionality of the Filters
            */}
            <div className="residentusers-page-section-2">
                <input
                    type="text"
                    className="residentusers-page-filter"
                    placeholder="Search by Name"
                />

                <select className="residentusers-page-filter">
                    <option value="">Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select> 

                <input
                    type="text"
                    className="residentusers-page-filter"
                    placeholder="Search by Address"
                />


                <select
                    className="residentusers-page-filter"
                >
                    <option value="0">Show All</option>
                    <option value="5">Show 5</option>
                    <option value="10">Show 10</option>
                </select>
            </div>

            <div className="residentusers-page-main-section">
                <>
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
                                    <tr
                                        key={user.id}
                                        className={highlightedId === user.id ? "highlighted-row" : ""}
                                    >
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
                </>
            </div>
        </main>
    );

}

export default ResidentUsers;