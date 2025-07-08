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
    const [barangayUsers, setBarangayUsers] = useState<dbBarangayUser[]>([]);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); 
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [selectedBarangayUserId, setSelectedBarangayUserId] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showAlertPopup, setshowAlertPopup] = useState(false); 
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightUserId = searchParams.get("highlight");
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  

    const handleAddBarangayUserClick = () => {
        if (isAuthorized) {
            router.push("/dashboard/admin/addBarangayUser");
        } else {
            alert("You are not authorized to create a new barangay user.");
            router.refresh(); // Refresh the page
        }
    };

    const handleViewBarangayUserClick = (id: string) => {  
        router.push(`/dashboard/admin/viewBarangayUser?id=${id}`);   
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


    const [filteredUser, setFilteredUser] = useState<any[]>([]); 
    const [currentPage, setCurrentPage] = useState(1);
    const UserPerPage = 10; 


    useEffect(() => {
        if (highlightUserId && barangayUsers.length > 0) {
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
    }, [highlightUserId, barangayUsers, filteredUser, currentPage]);
  

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


//FILTERS LOGIC
  
const [nameSearch, setNameSearch] = useState("");
const [positionSearch, setPositionSearch] = useState("");
const [positionDropdown, setPositionDropdown] = useState("");
const [showCount, setShowCount] = useState(0);
const [userIdSearch, setUserIdSearch] = useState("");



useEffect(() => {
    let filtered = [...barangayUsers];
  
    // Filter by name (partial match)
    if (nameSearch.trim()) {
      filtered = filtered.filter((user) =>
        user.firstName?.toLowerCase().includes(nameSearch.toLowerCase())
      );
    }
  
    // Filter by User ID (partial match)
    if (userIdSearch.trim()) {
      filtered = filtered.filter((user) =>
        user.userid?.toLowerCase().includes(userIdSearch.toLowerCase())
      );
    }
  
    // Filter by position dropdown
    if (positionDropdown) {
      filtered = filtered.filter(
        (user) => user.position === positionDropdown
      );
    }
  
    // Limit the number of results
    if (showCount > 0) {
      filtered = filtered.slice(0, showCount);
    }
  
    setFilteredUser(filtered);
  }, [nameSearch, userIdSearch, positionDropdown, showCount, barangayUsers]);
  

  /* NEW UPDATED ADDED */
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  /* NEW UPDATED ADDED */
  useEffect(() => {
    setFiltersLoaded(false); // reset animation
    const timeout = setTimeout(() => {
      setFiltersLoaded(true); // retrigger
    }, 50); // adjust delay as needed
    return () => clearTimeout(timeout);
  }, [searchParams.toString()]);
 
    return (
        <main className="barangayusers-page-main-container" /* edited this class*/>
            
            <div className="user-roles-module-section-1">
                
                {isAuthorized &&(
                    <Link href="/dashboard/admin/addBarangayUser">
                    <button className="add-announcement-btn add-incident-animated" /* edited this class*/ onClick={handleAddBarangayUserClick}>Add New Barangay User</button>
                    </Link>
                )}

            </div>

            
          <div className={`barangayusers-page-section-2 ${filtersLoaded ? "filters-animated" : ""}`} /* edited this class*/> 

          <input
            type="text"
            className="barangayusers-page-filter" /* edited this class*/
            placeholder="Search by User ID"
            value={userIdSearch}
            onChange={(e) => setUserIdSearch(e.target.value)}
            />



                <input
                    type="text"
                    className="barangayusers-page-filter"
                    placeholder="Search by Name"
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                />

           
                <select
                    className="barangayusers-page-filter"
                    value={positionDropdown}
                    onChange={(e) => setPositionDropdown(e.target.value)}
                >
                    <option value="">Position</option>
                    <option value="Punong Barangay">Punong Barangay</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Assistant Secretary">Asst Secretary</option>
                    <option value="Admin Staff">Admin Staff</option>
                    <option value="LF Staff">LF Staff</option>
                </select>

                <select
                    className="barangayusers-page-filter"
                    value={showCount}
                    onChange={(e) => setShowCount(Number(e.target.value))}
                >
                    <option value="0">Show All</option>
                    <option value="5">Show 5</option>
                    <option value="10">Show 10</option>
                </select>
                </div>


<div className="barangayusers-page-main-section" /* edited this class*/>
  <>
   
    {currentUser.length === 0 ? (
      <div className="no-result-card" /* edited this class */>
        <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" /* edited this class *//>
        <p className="no-results-department" /* edited this class */>No Results Found</p>
      </div>
    ) : (
      <table>
        <thead>
          <tr>
            <th>
              User ID
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="sort-button"
              >
                {sortOrder === "asc" ? "▲" : "▼"}
              </button>
            </th>
            <th>Official Name</th>
                 <th>Position</th>
            <th>Sex</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {currentUser.map((user) => (
            <tr
            key={user.id}
            className={highlightedId === user.id ? "highlighted-row" : ""}
            >
            <td>{user.userid}</td>
            <td>
                {user.lastName ? `${user.lastName}, ` : ""}
                {user.firstName} {user.middleName}
            </td>
            <td>{user.position}</td>
            <td>{user.sex}</td>
            <td>
                <div className="admin-actions">
                {/*<button className="admin-action-view" onClick={(e) => { e.stopPropagation(); }}>View</button>*/}

                <button className="admin-action-view" onClick={() => handleViewBarangayUserClick(user.id)}><img src="/Images/view.png" alt="View" /></button>

                {isAuthorized && (
                    <>
                    <button
                        className="admin-action-edit"
                        onClick={() => handleEditBarangayUserClick(user.id)}
                    >
                         <img src="/Images/edit.png" alt="Edit" />
                    </button>
                    <button
                        className="admin-action-delete"
                        onClick={() => handleDeleteBarangayUserClick(user.id)}
                    >
                         <img src="/Images/delete.png" alt="Delete" />
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
