"use client"
import React, { useState, useEffect, useRef } from "react";
import { db } from "../../../../db/firebase";
import { collection, onSnapshot, query ,updateDoc, doc, orderBy, getDocs, setDoc} from "firebase/firestore";
import "@/CSS/User&Roles/User&Roles.css";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface ResidentUser {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  address: string;
  phone: string;
  sex: string;
  dateOfBirth: string;
  validIdDoc: string;
  role: string;
  email: string;
  residentId: string;
  status: string;
  isNew?: boolean;
   createdAt?: string;
   upload?: string;
  reupload?: string;
}

const ResidentUsers = () => {
  const { data: session } = useSession();
  const userPosition = session?.user?.position;
  const isAuthorized = ["Assistant Secretary", "Secretary"].includes(userPosition || "");
  const [residentUsers, setResidentUsers] = useState<ResidentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightUserId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Existing filters for main
  const [filteredUser, setFilteredUser] = useState<ResidentUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const UserPerPage = 10;

  // Main filters
  const [searchTerm, setSearchTerm] = useState<string>('');
//   const [sexFilter, setSexFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCount, setShowCount] = useState(0);

  // Section toggle
  const [activeSection, setActiveSection] = useState("main");

  // Added: pending filters
  const [pendingSearchTerm, setPendingSearchTerm] = useState<string>('');
//   const [pendingSexFilter, setPendingSexFilter] = useState<string>('');
  const [pendingStatusFilter, setPendingStatusFilter] = useState<string>('');
  const [pendingShowCount, setPendingShowCount] = useState(0);


const [selectedUser, setSelectedUser] = useState<ResidentUser | null>(null);
const [isPopupOpen, setIsPopupOpen] = useState(false);
const [viewActiveSection, setViewActiveSection] = useState("basic");
const popupRef = useRef<HTMLDivElement | null>(null);
const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
const [linkedResidentId, setLinkedResidentId] = useState<string | null>(null);
const [showResidentsPopup, setShowResidentsPopup] = useState(false);
const [residents, setResidents] = useState<any[]>([]);
const [showNoMatchResidentsPopup, setShowNoMatchResidentsPopup] = useState(false);
const residentPopupRef = useRef<HTMLDivElement>(null);
const [showAcceptPopup, setShowAcceptPopup] = useState(false); 
const [showPopup, setShowPopup] = useState(false);
const [popupMessage, setPopupMessage] = useState("");


const [filtersLoaded, setFiltersLoaded] = useState(false);
const hasAnimatedOnce = useRef(false);

useEffect(() => {
  // Animate filters only once on initial page load
  if (!hasAnimatedOnce.current) {
    hasAnimatedOnce.current = true;
    setFiltersLoaded(false);
    const timeout = setTimeout(() => {
      setFiltersLoaded(true);
    }, 50);
    return () => clearTimeout(timeout);
  } else {
    // Never retrigger animation again
    setFiltersLoaded(true);
  }
}, []);

const openPopup = (user: ResidentUser) => {
  setSelectedUser(user);
  setViewActiveSection("basic");
  setIsPopupOpen(true);
  const params = new URLSearchParams(window.location.search);
  params.set("id", user.id);
  
  router.push(`?${params.toString()}`, { scroll: false });
};

const closePopup = () => {
  setSelectedUser(null);
  setIsPopupOpen(false);
  setShowResidentsPopup(false);
  setSearchTerm("");
  const params = new URLSearchParams(window.location.search);
  params.delete("id");
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  router.replace(newUrl, { scroll: false });
};


useEffect(() => {
  const section = searchParams.get("section");
  if (!section) {
    router.replace("/dashboard/admin/ResidentUsers?section=verified");
  }
}, [searchParams, router]);

// Mark as viewed
  const markAsViewed = async (id: string) => {
    try {
      const docRef = doc(db, "ResidentUsers", id);
      await updateDoc(docRef, { isViewed: true });
    } catch (error) {
      console.error("Error updating isViewed:", error);
    }
  };

// Fetch users
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const residentCollection = collection(db, "ResidentUsers");
      const q = query(residentCollection, orderBy("createdAt", "desc")); // Firestore ordering

        const unsubscribeResidents = onSnapshot(residentCollection, (snapshot) => {
          const residentData: ResidentUser[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew: doc.data().isViewed === false,
          })) as ResidentUser[];

          const sortedData = residentData.sort((a, b) => {
            if (a.isNew === b.isNew) {
              // Convert string dates to Date objects and compare
              return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
            }
            return a.isNew ? -1 : 1; // New users on top
          });

          setResidentUsers(sortedData);
        });


      return () => unsubscribeResidents();
    } catch (err: any) {
      console.log(err.message);
      setError("Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  fetchUsers();
}, []);


const handleVerifyClick = async (user: ResidentUser) => {
  setSelectedUserId(user.id);
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
      resident.firstName?.toLowerCase().trim() === user.first_name?.toLowerCase().trim() &&
      resident.lastName?.toLowerCase().trim() === user.last_name?.toLowerCase().trim() &&
      resident.dateOfBirth?.trim() === user.dateOfBirth?.trim()
    );

    if (matchingResident) {
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

  // Scroll + temporary highlight
  useEffect(() => {
    if (highlightUserId && residentUsers.length > 0) {
      setActiveSection("main");
      setHighlightedId(highlightUserId);
      const userIndex = filteredUser.findIndex(user => user.id === highlightUserId);
      if (userIndex !== -1) {
        const newPage = Math.floor(userIndex / UserPerPage) + 1;
        if (currentPage !== newPage) setCurrentPage(newPage);
        setTimeout(() => {
          const targetElement = document.querySelector(`tr.highlighted-row`);
          if (targetElement) targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
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


  const handleRejectClick = (userId: string ) => {
    router.push(`/dashboard/admin/reasonForReject?id=${userId}`);
};


const confirmAccept = async () => {
        if (!selectedUserId) return;
    
        try {
            await updateDoc(doc(db, "ResidentUsers", selectedUserId), {
                status: "Verified",
                residentId: linkedResidentId,
                
            });
    
            const params = new URLSearchParams(window.location.search);
            params.delete("id"); // Remove the ?id
            params.set("highlight", selectedUserId); // Add ?highlight
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            router.replace(newUrl, { scroll: false });
        
            // Close popup after URL cleanup
            setSearchTerm("");
            setIsPopupOpen(false);
            setShowPopup(true);
            setPopupMessage("User accepted and linked successfully!");

            // Create a notification for the resident
            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
            residentID: selectedUserId, // == user id
            message: `Your account is now VERIFIED and linked to your resident record.`,
            transactionType: "Verification",
            timestamp: new Date(),
            isRead: false,
            });
            
            // Hide the green popup after 3 seconds
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

  
  // Main table filtering
  useEffect(() => {
    const filterUsers = () => {
      let filtered = residentUsers.filter(user => user.status === "Verified");
      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.middle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    //   if (sexFilter) filtered = filtered.filter(user => user.sex.toLowerCase() === sexFilter.toLowerCase());
      if (statusFilter) filtered = filtered.filter(user => user.status === statusFilter);
      if (showCount > 0) filtered = filtered.slice(0, showCount);
      setFilteredUser(filtered);
    };
    filterUsers();
  }, [residentUsers, searchTerm, statusFilter, showCount]);

  // Prepare pending section data
  const pendingUsers = residentUsers.filter(user =>
    ["Unverified", "Resubmission"].includes(user.status)
  );

  // Pending section filtering
  const filteredPendingUsers = pendingUsers.filter(user => {
    let match = true;
    if (pendingSearchTerm) {
      match = user.first_name.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
              user.last_name.toLowerCase().includes(pendingSearchTerm.toLowerCase());
    }
    // if (match && pendingSexFilter) match = user.sex.toLowerCase() === pendingSexFilter.toLowerCase();
    if (match && pendingStatusFilter) match = user.status === pendingStatusFilter;
    return match;
  });

  const limitedPendingUsers = pendingShowCount > 0 ? filteredPendingUsers.slice(0, pendingShowCount) : filteredPendingUsers;

  // Pagination slice calculation
  const indexOfLastUser = currentPage * UserPerPage;
  const indexOfFirstUser = indexOfLastUser - UserPerPage;
  const currentUser = filteredUser.slice(indexOfFirstUser, indexOfLastUser);

  const indexOfLastPendingUser = currentPage * UserPerPage;
  const indexOfFirstPendingUser = indexOfLastPendingUser - UserPerPage;
  const currentPendingUsers = limitedPendingUsers.slice(indexOfFirstPendingUser, indexOfLastPendingUser);

  const totalPages = Math.ceil(filteredUser.length / UserPerPage);
  const totalPagesPending = Math.ceil(limitedPendingUsers.length / UserPerPage);
  const effectiveTotalPages = activeSection === "pending" ? totalPagesPending : totalPages;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < effectiveTotalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= effectiveTotalPages; i++) {
      if (i === 1 || i === effectiveTotalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
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



  const handleAcceptClick = (userId: string) => {
    setShowAcceptPopup(true);
    setSelectedUserId(userId);
};


    
  return (
    <main className="residentusers-page-main-container">

  {isAuthorized &&(
      <div className="user-roles-module-section-1-resident-users">
             
                <div className={`assigned-tasks-info-toggle-wrapper ${filtersLoaded ? "filters-animated" : ""}`}>
                  {["main", "pending"].map(section => (
                    <button
                      key={section}
                      className={`info-toggle-btn-assigned-resident verified-pending-users ${activeSection === section ? "active" : ""}`}
                      onClick={() => {
                        setActiveSection(section);
                        setCurrentPage(1);
                        if (section === "main") {
                          router.push("/dashboard/admin/ResidentUsers?section=verified");
                        } else if (section === "pending") {
                          router.push("/dashboard/admin/ResidentUsers?section=pending");
                        }
                      }}
                    >
                      {section === "main" && "Verified Users"}
                      {section === "pending" && "Pending Users"}
                    </button>
                  ))}
                </div>
                
      </div>
         )}


      {/* Filters for main */}

    
      {activeSection === "main" && (
        <div className={`residentusers-page-section-2 ${filtersLoaded ? "filters-animated" : ""}`} /* edited this class*/> 
          <input type="text" className="residentusers-page-filter" placeholder="Search by Name"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {/* <select className="residentusers-page-filter" value={sexFilter}
            onChange={(e) => setSexFilter(e.target.value)}>
            <option value="">Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select> */}
          {/* <select className="residentusers-page-filter" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Status</option>
            <option value="Unverified">Unverified</option>
            <option value="Resubmission">Resubmission</option>
          </select> */}
          <select className="residentusers-page-filter" value={showCount}
            onChange={(e) => setShowCount(Number(e.target.value))}>
            <option value="0">Show All</option>
            <option value="5">Show 5</option>
            <option value="10">Show 10</option>
          </select>
        </div>
      )}

      {/* Filters for pending */}
      {activeSection === "pending" && (
        <div className={`residentusers-page-section-2 ${filtersLoaded ? "filters-animated" : ""}`} /* edited this class*/> 
          <input type="text" className="residentusers-page-filter" placeholder="Search by Name"
            value={pendingSearchTerm} onChange={(e) => setPendingSearchTerm(e.target.value)} />
          {/* <select className="residentusers-page-filter" value={pendingSexFilter}
            onChange={(e) => setPendingSexFilter(e.target.value)}>
            <option value="">Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select> */}
          <select className="residentusers-page-filter" value={pendingStatusFilter}
            onChange={(e) => setPendingStatusFilter(e.target.value)}>
            <option value="">Status</option>
            <option value="Unverified">Unverified</option>
            <option value="Resubmission">Resubmission</option>
          </select>
          <select className="residentusers-page-filter" value={pendingShowCount}
            onChange={(e) => setPendingShowCount(Number(e.target.value))}>
            <option value="0">Show All</option>
            <option value="5">Show 5</option>
            <option value="10">Show 10</option>
          </select>
        </div>
      )}

      {/* Main verified users */}
      {activeSection === "main" && (
        <>
      
    <div
     className={`residentusers-page-main-section ${
    !isAuthorized ? "expand-when-no-section1-resident-users" : ""
      }`}
    >
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
                  <th>Gender</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUser.map(user => (
                  <tr key={user.id} className={highlightedId === user.id ? "highlighted-row" : ""}>
                    <td>{user.last_name}, {user.first_name} {user.middle_name}</td>
                    <td>{user.address}</td><td>{user.phone}</td><td>{user.sex}</td><td>{user.role}</td><td>{user.email}</td>
                    <td><span className={`status-badge-residentuser ${user.status.toLowerCase().replace(" ", "-")}`}>
                      <p>{user.status}</p>
                      </span></td>
                    <td>
                      <div className="admin-actions">
                      <button className="admin-action-view" onClick={() => openPopup(user)}>
                          <img src="/Images/view.png" alt="View" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
        </>
      )}

    {/* Pending users */}
        {activeSection === "pending" && (
          <>
            <div className="residentusers-page-main-section">
              {currentPendingUsers.length === 0 ? (
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
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPendingUsers.map(user => (
                      <tr key={user.id} className={` ${user.isNew ? "highlight-new-request" : ""}`}>
                        <td>{user.last_name}, {user.first_name}</td>
                        <td>{user.address}</td>
                        <td>{user.phone}</td>
                        <td>{user.email}</td>
                        <td><span className={`status-badge-residentuser ${user.status.toLowerCase().replace(" ", "-")}`}>{user.status}</span></td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-action-view"
                              onClick={() => {
                                markAsViewed(user.id);
                                //router.push(`/dashboard/admin/viewResidentUser?id=${user.id}&highlight=${user.id}`);
                                openPopup(user);
                              }}
                            >
                               <img src="/Images/edit.png" alt="Edit" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              <button onClick={nextPage} disabled={currentPage === totalPagesPending}>&raquo;</button>
            </div>
          </>
        )}

        {isPopupOpen && selectedUser && (
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
                    <button onClick={closePopup}>
                      <img src="/images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident" />
                    </button>
                  </div>
                  <div className="view-resident-user-info-toggle-wrapper">
                    {["basic", "account", "others"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`residentuser-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                        onClick={() => setViewActiveSection(section)}
                      >
                        {section === "basic" && "Basic Info"}
                        {section === "account" && "Account Info"}
                        {section === "others" && "Other Info"}
                      </button>
                    ))}
                  </div>
                  {isAuthorized && selectedUser?.status !== "Verified" && (
                    <div className="action-btn-section-verify-section">
                      <div className="action-btn-section-verify">
                      
                        <button 
                          className="viewadmin-action-accept" 
                          onClick={() => handleVerifyClick(selectedUser)}
                        >
                          Verify
                        </button>
                      
                      </div>
                    </div>
                  )}
                  
                </div>

                <div className="view-user-header-body-bottom-section">
                
                  <div className="view-resident-user-info-main-container">
                    <div className="view-user-info-main-content">
                      {viewActiveSection  === "basic" && (
                        <>
                          <div className="view-resident-user-content-left-side">
                            <div className="view-user-fields-section">
                              <p>Last Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.last_name || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>First Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.first_name || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Middle Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.middle_name || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Gender</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.sex || "N/A"}
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="view-resident-user-content-right-side">
                            <div className="view-user-fields-section">
                              <p>Address</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.address || "N/A"}
                                readOnly
                              />
                            </div>
                            <div className="view-user-fields-section">
                              <p>Contact Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.phone || "N/A"}
                                readOnly
                              />
                            </div>
                            <div className="view-user-fields-section">
                              <p>Email Address</p>
                              <input
                                type="email"
                                className="view-user-input-field"
                                value={selectedUser.email || "N/A"}
                                readOnly
                              />
                            </div>
                            <div className="view-user-fields-section">
                              <p>Date of Birth</p>
                              <input
                                type="email"
                                className="view-user-input-field"
                                value={selectedUser.dateOfBirth || "N/A"}
                                readOnly
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {viewActiveSection === "account" && (
                        <>
                          <div className="view-main-user-content-left-side">
                            <div className="view-user-fields-section">
                              <p>Created At</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={
  selectedUser.createdAt
    ? typeof selectedUser.createdAt === "string"
      ? /^\d{4}-\d{2}-\d{2}$/.test(selectedUser.createdAt)
        ? selectedUser.createdAt
        : new Date(
            selectedUser.createdAt
              .replace(" at", "")
              .replace("UTC+8", "GMT+0800")
          )
            .toISOString()
            .split("T")[0]
      : (selectedUser.createdAt as any).toDate
        ? (selectedUser.createdAt as any).toDate().toISOString().split("T")[0]
        : "N/A"
    : "N/A"
}
                                readOnly
                              />
                            </div>
                            <div className="view-user-fields-section">
                              <p>Role</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.role || "N/A"}
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="view-main-user-content-right-side">
                            <div className="view-user-fields-section">
                              <p>Status</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.status || "N/A"}
                                readOnly
                              />
                            </div>
                            {selectedUser?.status === "Verified" && (
                            <div className="view-user-fields-section">
                              <p>Linked Resident</p>
                              {selectedUser?.residentId ? (
                                <a
                                  href={`/dashboard/ResidentModule/ViewResident?id=${selectedUser.residentId}`}
                                  className="view-user-input-field"
                                  style={{
                                    display: 'inline-block',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5',
                                    textDecoration: 'none',
                                    color: '#007bff',
                                  }}
                                >
                                  Show Resident Info
                                </a>
                              ) : (
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value="N/A"
                                  readOnly
                                />
                              )}
                            </div>
                          )}
                          </div>
                        </>
                      )}

                      {viewActiveSection === "others" && (
                        <>
                      
                          <div className="user-uploaded-photo-section">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Uploaded Valid ID
                              </div>
                              <div className="box-container-incidentimage-2">
                                {selectedUser?.upload ? (
                                  <a
                                    href={selectedUser.upload}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      alt="Verification Requirement"
                                      className="incident-img-view uploaded-pic"
                                      style={{ cursor: 'pointer' }}
                                      src={selectedUser.upload}
                                    />
                                  </a>
                                ) : (
                                  <p className="no-image-text-view">No image available</p>
                                )}
                              </div>
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


        {/* Popup for With Resident Match */}
        {showResidentsPopup && (
                <div className="view-residentuser-confirmation-popup-overlay">
                    <div className="resident-table-popup" ref={residentPopupRef}>

                  <div className="view-user-backbutton-container">
                    <button onClick={closePopup}>
                      <img src="/images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident" />
                    </button>
                  </div>
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
                                ).map(resident => `Resident Number ${resident.residentNumber || "N/A"}`).join(", ")} *`
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
                                        setSelectedUserId(selectedUser?.id || "");
                                        setLinkedResidentId(resident.id);     // ✅ this is the critical part
                                        setShowResidentsPopup(false);
                                        setShowAcceptPopup(true);
                                    }}
                                    >
                                    <td>{resident.firstName}</td>
                                    <td>{resident.middleName || "N/A"}</td> 
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
                                        <th>Gender</th>
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
                                key={selectedUser?.residentId}
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
                                    <td>{selectedUser?.address || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>Date of Birth</th>
                                    <td>{selectedUser?.dateOfBirth || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>Contact Number</th>
                                    <td>{selectedUser?.phone || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>Gender</th>
                                    <td>{selectedUser?.sex || "N/A"}</td>
                                </tr>
                                <tr>
                                    <th>
                                        {selectedUser?.status === "Resubmission" ? "Reupload Valid ID" : "Valid ID"}
                                    </th>
                                    <td>
                                        {selectedUser?.status === "Resubmission"
                                        ? selectedUser?.reupload
                                            ? (
                                            <div className="resident-id-container">
                                                <img
                                                src={selectedUser?.reupload}
                                                alt="Reuploaded Valid ID"
                                                className="resident-id-image"
                                                />
                                                <a
                                                href={selectedUser?.reupload}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="view-image-link"
                                                >
                                                View Image
                                                </a>
                                            </div>
                                            )
                                            : "No reuploaded ID"
                                        : selectedUser?.upload
                                            ? (
                                            <div className="resident-id-container">
                                                <img
                                                src={selectedUser?.upload}
                                                alt="Resident's Valid ID"
                                                className="resident-id-image"
                                                />
                                                <a
                                                href={selectedUser?.upload}
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
                                            onClick={() => handleAcceptClick(selectedUser?.id || "")}
                                        >
                                            Accept
                                </button>
                        
                                <button 
                                            className="viewadmin-action-reject" 
                                            onClick={() => handleRejectClick(selectedUser?.id || "")}
                                        >
                                            Reject
                                </button>

                            </div>

                        </div>
                    </div>
                </div>
                )}

        {/* Popup for No match Residents */}
        {showNoMatchResidentsPopup && (
                    <div className="view-residentuser-confirmation-popup-overlay">
                        <div className="resident-table-popup">
                          
                        <h2>Resident Database Verification</h2>

                    {(() => {
                        const selectedName = `${selectedUser?.first_name || ""} ${selectedUser?.middle_name || ""} ${selectedUser?.last_name || ""}`.toLowerCase().trim();

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
                      onClick={() => handleRejectClick(selectedUser?.id || "")}
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
                                <div className="yesno-container-residentuser">
                                    <button onClick={() => setShowAcceptPopup(false)} className="no-button-residentuser">No</button>
                                    <button onClick={() => {
                                        confirmAccept();
                                        setShowResidentsPopup(false);
                                        }} className="yes-button-residentuser">Yes
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

    </main>
    
  );
};

export default ResidentUsers;
