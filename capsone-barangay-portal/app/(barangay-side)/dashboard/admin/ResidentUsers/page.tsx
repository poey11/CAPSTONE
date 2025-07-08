"use client"
import React, { useState, useEffect } from "react";
import { db } from "../../../../db/firebase";
import { collection, onSnapshot, query ,updateDoc, doc, orderBy} from "firebase/firestore";
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
  validIdDoc: string;
  role: string;
  email: string;
  status: string;
  isNew?: boolean;
   createdAt?: string;
}

const ResidentUsers = () => {
  const { data: session } = useSession();
  const userPosition = session?.user?.position;
  const isAuthorized = ["Assistant Secretary"].includes(userPosition || "");
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





// Mark as viewed
  const markAsViewed = async (id: string) => {
    try {
      const docRef = doc(db, "ResidentUsers", id);
      await updateDoc(docRef, { isViewed: true });
    } catch (error) {
      console.error("Error updating isViewed:", error);
    }
  };


/*
OLD
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const residentCollection = collection(db, "ResidentUsers");
        const unsubscribeResidents = onSnapshot(residentCollection, (snapshot) => {
          const residentData: ResidentUser[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew: doc.data().isViewed === false,
          })) as ResidentUser[];
          setResidentUsers(residentData);
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
*/

  /*

  // Highlight scroll and reset
  useEffect(() => {
    if (highlightUserId && residentUsers.length > 0) {
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
*/





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






  // Scroll + temporary highlight
  useEffect(() => {
    if (highlightUserId && residentUsers.length > 0) {
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



  
  // Main table filtering
  useEffect(() => {
    const filterUsers = () => {
      let filtered = residentUsers.filter(user => user.status === "Verified");
      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <main className="residentusers-page-main-container">
    {["Assistant Secretary", "Secretary"].includes(userPosition || "") && (
      <div className="user-roles-module-section-1-resident-users">
        <div className={`assigned-tasks-info-toggle-wrapper ${filtersLoaded ? "filters-animated" : ""}`}>
          {["main", "pending"].map(section => (
            <button
              key={section}
              className={`info-toggle-btn-assigned-resident verified-pending-users ${activeSection === section ? "active" : ""}`}
              onClick={() => { setActiveSection(section); setCurrentPage(1); }}
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
        <div className="residentusers-page-main-section">
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
                {currentUser.map(user => (
                  <tr key={user.id} className={highlightedId === user.id ? "highlighted-row" : ""}>
                    <td>{user.last_name}, {user.first_name} {user.middle_name}</td>
                    <td>{user.address}</td><td>{user.phone}</td><td>{user.sex}</td><td>{user.role}</td><td>{user.email}</td>
                    <td><span className={`status-badge ${user.status.toLowerCase().replace(" ", "-")}`}>
                      <p>{user.status}</p>
                      </span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-view" onClick={() => router.push(`/dashboard/admin/viewResidentUser?id=${user.id}`)}>
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
                        <td><span className={`status-badge ${user.status.toLowerCase().replace(" ", "-")}`}>{user.status}</span></td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-action-view"
                              onClick={() => {
                                markAsViewed(user.id);
                                router.push(`/dashboard/admin/viewResidentUser?id=${user.id}&highlight=${user.id}`);
                              }}
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

    </main>
  );
};

export default ResidentUsers;
