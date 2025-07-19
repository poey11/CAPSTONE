"use client"
import React,{useState, useEffect, ChangeEvent, useRef} from "react";
import {db} from "../../../../db/firebase";
import {collection, onSnapshot, getDocs, deleteDoc, addDoc, doc, updateDoc, setDoc, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/User&Roles.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from 'next/navigation';
import { hash } from "bcryptjs";

interface dbBarangayUser{
    id: string;
    userid: string;
    position:string,
    password:string;
    role: string;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    address: string;
    phone: string;
    firstName: string;
    middleName: string;
    lastName: string;
    birthDate: string;
    sex: string;
}


interface BarangayUser{
    id?: string;
    userId: string;
    position:string;
    password:string;
    role: string;
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
    const [showAddUserPopup, setShowAddUserPopup] = useState(false);
    const [viewUser, setViewUser] = useState<dbBarangayUser | null>(null);
    const [showViewPopup, setShowViewPopup] = useState(false);
    const [activeSection, setActiveSection] = useState("full");
    const popupRef = useRef<HTMLDivElement | null>(null);


    
    const handleAddBarangayUserClick = () => {
        if (isAuthorized) {
            router.push("/dashboard/admin/addBarangayUser");
        } else {
            alert("You are not authorized to create a new barangay user.");
            router.refresh(); // Refresh the page
        }
    };

    /*
    const handleViewBarangayUserClick = (id: string) => {  
        router.push(`/dashboard/admin/viewBarangayUser?id=${id}`);   
    };*/

      const handleViewBarangayUserClick = (id: string) => {
        const selected = barangayUsers.find((user) => user.id === id);
        if (selected) {
          setViewUser(selected);
          setShowViewPopup(true);
          
          
          const params = new URLSearchParams(window.location.search);
          params.set("id", id);
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          router.replace(newUrl, { scroll: false });
        }
      };

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
              setShowViewPopup(false);
              setViewUser(null);
        
           
              const params = new URLSearchParams(window.location.search);
              params.delete("id");
              const newUrl = `${window.location.pathname}?${params.toString()}`;
              router.replace(newUrl, { scroll: false });
            }
          };
      
        if (showViewPopup) {
          document.addEventListener("mousedown", handleClickOutside);
        } else {
          document.removeEventListener("mousedown", handleClickOutside);
        }
      
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [showViewPopup]);

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
    if (showAddUserPopup) {
      const generateOnOpen = async () => {
        const year = new Date().getFullYear().toString();
        const generateNewID = async (): Promise<string> => {
          const randomNum = Math.floor(100 + Math.random() * 900).toString();
          const randomId = year + randomNum;
          const barangayUsersCollection = collection(db, "BarangayUsers");
          const querySnapshot = await getDocs(
            query(barangayUsersCollection, where("userId", "==", randomId))
          );
          if (!querySnapshot.empty) {
            return generateNewID();
          }
          return randomId;
        };
  
        const uniqueId = await generateNewID();
  
        setUsers((prevUsers) => ({
          ...prevUsers,
          userId: uniqueId,
        }));
      };
  
      generateOnOpen();
    }
  }, [showAddUserPopup]);

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
  const hasAnimatedOnce = useRef(false);

  /* NEW UPDATED ADDED */
  useEffect(() => {
    if (!hasAnimatedOnce.current) {
      hasAnimatedOnce.current = true;
      setFiltersLoaded(false);
      const timeout = setTimeout(() => {
        setFiltersLoaded(true);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setFiltersLoaded(true); // Always on after initial load
    }
  }, []);

  /* ADDED for add brgy user */

  const user = useSession().data?.user;
      const userRole = user?.position;
      const [users, setUsers] = useState<BarangayUser>({
          userId:"",
          position:"",
          password:"",
          role:"Barangay Official",
      });
     
  
      const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
      const [showErrorPopup, setShowErrorPopup] = useState(false);
      const [popupErrorMessage, setPopupErrorMessage] = useState("");
      const [invalidFields, setInvalidFields] = useState<string[]>([]);



    

    useEffect(() => {
        if(userRole !== "Admin" && userRole !== "Assistant Secretary") {
            router.push("/dashboard/admin/BarangayUsers");
            return;
        }
        setLoading(false);
    }, []);

    if (loading) return <p>Loading...</p>;
   



    const handleBack = () => {
        setShowViewPopup(false);
        setViewUser(null);
    
        const params = new URLSearchParams(window.location.search);
        params.delete("id");
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        router.replace(newUrl, { scroll: false });
    };
    const GenerateID = async (e: any) => {
        e.preventDefault();
        
        const generateNewID = async (): Promise<string> => {
            const year = new Date().getFullYear().toString(); // First 4 digits
            const randomNum = Math.floor(100 + Math.random() * 900).toString(); // Ensures 3-digit number (100-999)
            const randomId = year + randomNum; // Concatenates to make 7 digits
    
            // ✅ Check Firestore if the ID already exists
            const barangayUsersCollection = collection(db, "BarangayUsers");
            const querySnapshot = await getDocs(query(barangayUsersCollection, where("userId", "==", randomId)));
    
            if (!querySnapshot.empty) {
                console.log(`ID ${randomId} already exists, regenerating...`);
                return generateNewID(); // 🔄 Recursively call the function if ID exists
            }
    
            return randomId; // ✅ Unique ID found
        };
    
        const uniqueId = await generateNewID(); // Wait for a unique ID to be generated
    
        setUsers((prevUsers) => ({
            ...prevUsers,
            userId: uniqueId,
        }));
    
    };

    const handleChange = (  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>)=>{
            e.preventDefault();
          
            const {name, value} = e.target;
            setUsers((prevUsers) => ({
                ...prevUsers,
                [name]: value
            }));
    }

    

    const handleSubmitClick = async () => {
        const { position, password, userId } = users;

        const invalidFields : string[] = [];

        if (!position) invalidFields.push("position");
        if (!password) invalidFields.push("password");
        if (!userId) invalidFields.push("userId");
        
        if (invalidFields.length > 0) {
            
         setInvalidFields(invalidFields);
        setPopupErrorMessage("Please fill up all required fields.");
        setShowErrorPopup(true);
    
        setTimeout(() => {
          setShowErrorPopup(false);
        }, 3000);
        return;

        }


        if (password.length < 6) {
            setInvalidFields(invalidFields);
            setPopupErrorMessage("Password must be at least 6 characters.");
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 3000);
            return;
        }
        
        setInvalidFields([]);
        setShowSubmitPopup(true);
    };


      const confirmSubmit = async () => {
        setShowSubmitPopup(false);
        setShowAddUserPopup(false);
        
        const passwordHash = await hash(users.password, 12);
        const docRef = await addDoc(collection(db, "BarangayUsers"), {
          userid: users.userId,
          password: passwordHash,
          role: users.role,
          position: users.position,
          createdAt: new Date().toISOString().split("T")[0],
          firstTimelogin: true,
          firstName: "User",
          lastName: "",
          createdBy: user?.fullName || user?.name || "Unknown",

        });
    
        setPopupMessage("Barangay User created successfully!");
        setShowPopup(true);
    
        setTimeout(() => {
          setShowPopup(false);
          
          router.push(`/dashboard/admin/BarangayUsers?highlight=${docRef.id}`);
        }, 3000);
    
        
        setUsers({ userId: "", position: "", password: "", role: "Barangay Official" });
      };


      const handleSubmit = () => {
        if (!users.userId || !users.password) {
          setPopupErrorMessage("Please fill up all required fields.");
          setShowErrorPopup(true);
          return setTimeout(() => setShowErrorPopup(false), 3000);
        }
        setShowSubmitPopup(true);
      };

      
      
    
 
    return (
        <main className="barangayusers-page-main-container" /* edited this class*/>
            
            <div className="user-roles-module-section-1">
                
                {isAuthorized &&(
                    
              //  <Link href="/dashboard/admin/addBarangayUser">
            //    <button className="add-announcement-btn add-incident-animated" onClick={handleAddBarangayUserClick}>
           //        Add New Barangay User
         //        </button>
         //       </Link>
                
                
                <button 
                    className="add-announcement-btn add-incident-animated" 
                    onClick={() => setShowAddUserPopup(true)}
               >
                    Add New Barangay User
                    </button>

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


    <div
     className={`barangayusers-page-main-section ${
    !isAuthorized ? "expand-when-no-section1-barangay-users" : ""
      }`}
    >
  <>
   
    {currentUser.length === 0 ? (
      <div className="no-result-card" /* edited this class */>
        <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" /* edited this class *//>
        <p className="no-results-department" /* edited this class */>No Results Found</p>
      </div>
    ) : (
      <table>
        <thead /* edited this class */>
          <tr >
            <th /* edited this class */>
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
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {currentUser.map((user) => (
            <tr /* edited this class*/
            key={user.id}
            className={highlightedId === user.id ? "highlighted-row" : ""}
            >
            <td /* edited this class */>{user.userid}</td >
            <td>
                {user.lastName ? `${user.lastName}, ` : ""}
                {user.firstName} {user.middleName}
            </td>
            <td>{user.position}</td>
            <td>{user.sex}</td>
            <td>
                <div className="admin-actions">
                {/*<button className="admin-action-view" onClick={(e) => { e.stopPropagation(); }}>View</button>*/}

                <button className="admin-action-view" /* edited this class */ onClick={() => handleViewBarangayUserClick(user.id)}><img src="/Images/view.png" alt="View" /></button>

                {isAuthorized && (
                    <>
                    <button
                        className="admin-action-edit" /* edited this class */
                        onClick={() => handleEditBarangayUserClick(user.id)}
                    >
                         <img src="/Images/edit.png" alt="Edit" />
                    </button>
                    <button
                        className="admin-action-delete" /* edited this class */
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

   <div className="redirection-section-users" /* edited this class */>
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

        {showSubmitPopup && (
                        <div className="addbrgyuser-confirmation-popup-overlay">
                            <div className="addbrgyuser-confirmation-popup">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to submit?</p>
                                <div className="user-roles-yesno-container">
                                    <button onClick={() => setShowSubmitPopup(false)} className="addbrgyuser-no-button">No</button>
                                    <button onClick={confirmSubmit} className="addbrgyuser-yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}


        {showErrorPopup && (
                <div className={`addbrgyuser-error-popup-overlay show`}>
                    <div className="addbrgyuser-popup">
                    <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
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

            {showAddUserPopup && (
            <div className="user-roles-add-brgy-user-popup-overlay">
                <div className="add-barangayusers-confirmation-popup" onSubmit={handleSubmit}>
                    <h2>Add New Barangay User</h2>

                    <div className="add-barangay-user-top">
                        <div className="fields-section-add-brgy-user">
                            <p>Position <span className="required">*</span> </p>
                            <select  value={users.position}  onChange={handleChange} id="roles" name="position" className={`barangay-user-input-fields ${invalidFields.includes("position") ? "input-error" : ""}`} >
                                <option value="" disabled>Select a Position</option>
                                <option value="Punong Barangay">Punong Barangay</option>
                                <option value="Secretary">Secretary</option>
                                <option value="Assistant Secretary">Asst Secretary</option>
                                <option value="Admin Staff">Admin Staff</option>
                                <option value="LF Staff">LF Staff</option>
                            </select>
                        </div>
                        <div className="fields-section-add-brgy-user">

                            <p>User ID <span className="required">*</span> </p>
                            <input 
                                    type="text" 
                                    id="username"
                                    name="userId"
                                    className={`barangay-user-input-fields ${invalidFields.includes("userId") ? "input-error" : ""}`}
                                    value={users.userId} 
                                    placeholder="User ID"
                                    disabled  
                                    required
                                />
                            
                        </div>
                        
                    </div>

                    <div className="add-barangay-user-bottom">
                        <div className="fields-section-add-brgy-user">
                        <p>Password <span className="required">*</span> </p>
                            <input 
                                value={users.password} 
                                onChange={handleChange} 
                                id="password" 
                                type="password" 
                                name="password" 
                                className={`barangay-user-input-fields ${invalidFields.includes("password") ? "input-error" : ""}`}
                                placeholder="Enter Password"
                                required
                            />
                        </div>
                                
                    </div>
                
                    {/* Buttons */}
                    <div className="user-roles-yesno-container">
                        <button onClick={() => setShowAddUserPopup(false)} className="user-roles-no-button">Cancel</button>
                        <button className="user-roles-yes-button" onClick={handleSubmitClick} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {showViewPopup && viewUser && (
            <div className="user-roles-view-popup-overlay">
                <div className="view-barangayuser-popup" ref={popupRef}>
                    <div className="view-user-main-section1">
                        <div className="view-user-header-first-section">
                            <img src="/Images/QClogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
                        </div>
                        <div className="view-user-header-second-section">
                            <h2 className="gov-info">Republic of the Philippines</h2>
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
                            <div className="view-resident-user-info-toggle-wrapper">
                                {[ "full" , "history"].map((section) => (
                                <button
                                    key={section}
                                    type="button"
                                    className={`barangayuser-info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                    onClick={() => setActiveSection(section)}
                                >
                        
                                    {section === "full" && "Full Info"}
                                    {section === "history" && "History"}
                                </button>
                                ))}
                            </div>
                        </div>
                        <div className="view-user-header-body-bottom-section">
                            <div className="user-photo-section">
                                <span className="user-details-label">Barangay User Details</span>
                                <div className="user-profile-container">
                                    {/*
                                    <img
                                        src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                                        alt="Resident"
                                        className={
                                            formData.identificationFileURL
                                            ? "resident-picture uploaded-picture"
                                            : "resident-picture default-picture"
                                        }
                                    />
                                    <div className="user-name-section">
                                        <h2>
                                            {formData.firstName || "N/A"} {formData.lastName || "N/A"}
                                        </h2>
                                        </div>
                                        */}

                                        
                                        <img
                                            src={"/Images/default-identificationpic.jpg"}
                                            alt="Identification"
                                            className="resident-id-photo"
                                        />

                                </div>
                            </div>
                            <div className="view-user-info-main-container">
                                <div className="view-user-info-main-content">
                                {activeSection === "full" && (
                                    <>
                                        <div className="view-main-user-content-left-side">
                                            <div className="view-user-fields-section">
                                                <p>User Id</p>
                                                <input type="text" className="view-user-input-field" name="residentNumber" value={viewUser.userid} readOnly/>
                                            </div>
                                            <div className="view-user-fields-section">
                                                <p>Official Full Name</p>
                                                <input type="text" className="view-user-input-field" name="firstName"value={`${viewUser.firstName || ""} ${viewUser.middleName || ""} ${viewUser.lastName || ""}`} readOnly/>
                                            </div>
                                            <div className="view-user-fields-section">
                                                <p>Gender</p>
                                                <input type="input" className="view-user-input-field" name="gender" value={viewUser.sex  || "N/A"} readOnly/>
                                            </div>
                                            <div className="view-user-fields-section">
                                                <p>Birthday</p>
                                                <input type="date" className="view-user-input-field" name="birthDate" value={viewUser.birthDate} readOnly/>
                                            </div>
                                        </div>
                                        <div className="view-main-user-content-right-side">
                                            <div className="view-user-fields-section">
                                                <p>Position</p>
                                                <input type="text" className="view-user-input-field" name="position" value={viewUser.position} readOnly/>
                                            </div>
                                            <div className="view-user-fields-section">
                                                <p>Contact Number</p>
                                                <input type="input" className="view-user-input-field" name="phone" value={viewUser.phone || "N/A"} readOnly/>
                                            </div>
                                            <div className="view-user-fields-section">
                                                <p>Address</p>
                                                <input type="input" className="view-user-input-field" name="address" value={viewUser.address || "N/A"} readOnly/>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {activeSection === "history" && (
                                    <>
                                        <div className="view-main-user-content-left-side">
                                            <div className="view-user-fields-section">
                                                <p>Created By</p>
                                                <input type="text" className="view-user-input-field" name="residentNumber" value={viewUser.createdBy} readOnly/>
                                            </div>
                                            <div className="view-user-fields-section">
                                                <p>Created At</p>
                                                <input type="text" className="view-user-input-field" name="residentNumber" value={viewUser.createdAt} readOnly/>
                                            </div>
                                        </div>
                                        <div className="view-main-user-content-right-side">
                                            <div className="view-user-fields-section">
                                                <p>Updated By</p>
                                                <input type="text" className="view-user-input-field" name="residentNumber" value={viewUser.updatedBy} readOnly/>
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
            )}
        


        </main>
    );
}

export default BarangayUsers;
