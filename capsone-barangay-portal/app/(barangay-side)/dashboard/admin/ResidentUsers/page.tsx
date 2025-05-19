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


    const [filteredUser, setFilteredUser] = useState<any[]>([]); // Ensure this is populated
    const [currentPage, setCurrentPage] = useState(1);
    const UserPerPage = 10; // Can be changed

    useEffect(() => {
                if (highlightUserId && residentUsers.length > 0) {
                    setHighlightedId(highlightUserId);
                
                
                    const userIndex = filteredUser.findIndex(user => user.id === highlightUserId);
                
                    if (userIndex !== -1) {
                        const newPage = Math.floor(userIndex / UserPerPage) + 1;
                
                        if (currentPage !== newPage) {
                            setCurrentPage(newPage);
                        }
                
                        
                        setTimeout(() => {
                            const targetElement = document.querySelector(`tr.highlighted-row`);
                            if (targetElement) {
                                targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }, 500);
        
            
                        const timeoutId = setTimeout(() => {
                            setHighlightedId(null);
        
                            const params = new URLSearchParams(window.location.search);
                            params.delete("highlight");
                            const newUrl = `${window.location.pathname}?${params.toString()}`;
                            router.replace(newUrl, { scroll: false });
                        }, 3000);
        
                        return () => clearTimeout(timeoutId);
                    }
                }
            }, [highlightUserId, residentUsers, filteredUser, currentPage]);


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

    useEffect(() => {
            const residentOnly = residentUsers.filter(user => user.status !== "Verified");
            setFilteredUser(residentOnly);
        }, [residentUsers]);



          const [searchTerm, setSearchTerm] = useState<string>('');
              const [sexFilter, setSexFilter] = useState<string>('');
              const [statusFilter, setStatusFilter] = useState<string>('');
              const [showCount, setShowCount] = useState(0);
        

         useEffect(() => {
                const filterUsers = () => {
                    let filtered = residentUsers.filter(user => user.status === "Verified");
        
                    if (searchTerm) {
                        filtered = filtered.filter(user => 
                            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }
        
                    if (sexFilter) {
                        filtered = filtered.filter(user => user.sex === sexFilter);
                    }
        
                    if (statusFilter) {
                        filtered = filtered.filter(user => user.status === statusFilter);
                    }
        
                     // Limit the number of results
                    if (showCount > 0) {
                        filtered = filtered.slice(0, showCount);
                    }
        
                    setFilteredUser(filtered);
                };
        
                filterUsers();
            }, [residentUsers, searchTerm, sexFilter, statusFilter, showCount]);
        
    
            
        
            // Pagination logic
            const indexOfLastUser = currentPage * UserPerPage;
            const indexOfFirstUser = indexOfLastUser - UserPerPage;
            const currentUser = filteredUser.slice(indexOfFirstUser, indexOfLastUser);
            const totalPages = Math.ceil(filteredUser.length / UserPerPage);
            
          const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
          const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
          const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
        
          const getPageNumbers = () => {
            const pageNumbersToShow: (number | string)[] = [];
            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pageNumbersToShow.push(i);
              } else if (
                (i === currentPage - 2 || i === currentPage + 2) &&
                pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
              ) {
                pageNumbersToShow.push("...");
              }
            }
            return pageNumbersToShow;
          };

    return(
        <main className="residentusers-page-main-container">
            <div className="path-section">
                <h1 className="breadcrumb">User and Roles<span className="chevron">/</span></h1>
                <h2 className="breadcrumb">Resident Users<span className="chevron"></span></h2>
            </div>
            <div className="user-roles-module-section-1">
                <h1>Resident Users</h1>
            </div>

            
            <div className="residentusers-page-section-2">
                <input
                    type="text"
                    className="residentusers-page-filter"
                    placeholder="Search by Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="residentusers-page-filter"
                    value={sexFilter}
                    onChange={(e) => setSexFilter(e.target.value)}
                >
                    <option value="">Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>

                <select
                    className="residentusers-page-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Status</option>
                    <option value="Unverified">Unverified</option>
                    <option value="Resubmission">Resubmission</option>
                </select>

                <select
                    className="residentusers-page-filter"
                    value={showCount}
                    onChange={(e) => setShowCount(Number(e.target.value))}
                >
               <option value="0">Show All</option>
                    <option value="5">Show 5</option>
                    <option value="10">Show 10</option>
                </select>
            </div>

            <div className="residentusers-page-main-section">
                <>
                {currentUser.length === 0 ? (

                    <div className="no-result-card">
                    <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
                    <p className="no-results-department">No Results Found</p>
                    </div>
                    ) : (

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
                                 {currentUser.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={highlightedId === user.id ? "highlighted-row" : ""}
                                    >
                                    <td>{user.last_name}, {user.first_name} {user.middle_name}</td>
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
                                              <img src="/Images/view.png" alt="View" />
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


        <div className="redirection-section-users">
            <button onClick={prevPage} disabled={currentPage === 1}>&laquo;</button>
            {getPageNumbers().map((number, index) => (
            <button
                key={index}
                onClick={() => typeof number === 'number' && paginate(number)}
                className={currentPage === number ? "active" : ""}
            >
                {number}
            </button>
            ))}
            <button onClick={nextPage} disabled={currentPage === totalPages}>&raquo;</button>
        </div>


        </main>
    );

}

export default ResidentUsers;