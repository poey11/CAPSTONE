"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../db/firebase";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from 'next/navigation';


export default function ResidentModule() {

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPosition = session?.user?.position;
  const isAuthorized = ["Secretary", "Assistant Secretary"].includes(userPosition || "");




  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");


  const [searchName, setSearchName] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [searchOccupation, setSearchOccupation] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

 
  const [showCount, setShowCount] = useState<number>(0);
  const router = useRouter(); 

  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10; // Can be changed 

  const [residentType, setResidentType] = useState<string>("");

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedResidentNumber, setSelectedResidentNumber] = useState<string | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false); 
  const [showAlertPopup, setshowAlertPopup] = useState(false);
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [viewActiveSection, setViewActiveSection] = useState("basic");

    const hasAnimatedOnce = useRef(false);
    const [filtersLoaded, setFiltersLoaded] = useState(false);





    const openPopup = (user: any) => {
    setSelectedUser(user);
    setViewActiveSection("basic");
    setIsPopupOpen(true);
    router.push(`?id=${user.id}`, { scroll: false });
  };

  const closePopup = () => {
    setSelectedUser(null);
    setIsPopupOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

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

  const handleResidentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResidentType(e.target.value);
  };

  // Highlighting Logic based on the URL parameter
  const searchParams = useSearchParams();
  const highlightResidentId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);



  const residentId = searchParams.get("id");

  useEffect(() => {
  if (highlightResidentId && filteredResidents.length > 0) {
    const targetIndex = filteredResidents.findIndex(resident => resident.id === highlightResidentId);
    if (targetIndex !== -1) {
      const targetPage = Math.floor(targetIndex / residentsPerPage) + 1;
      setHighlightedId(highlightResidentId);
      setCurrentPage(targetPage);

      setTimeout(() => {
        const targetElement = document.querySelector(`tr[data-id="${highlightResidentId}"]`);
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
}, [highlightResidentId, filteredResidents]);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Residents"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResidents(data);
      } catch (err) {
        setError("Failed to load residents");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  useEffect(() => {
    let filtered = [...residents];

    if (searchName) {
      filtered = filtered.filter((resident) => {
        const fullName = `${resident.lastName || ""} ${resident.firstName || ""} ${resident.middleName || ""}`.toLowerCase();
        return fullName.includes(searchName.toLowerCase());
      });
    }

    if (searchAddress) {
      filtered = filtered.filter((resident) =>
        resident.address?.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }

    if (searchOccupation) {
      filtered = filtered.filter((resident) =>
        resident.occupation?.toLowerCase().includes(searchOccupation.toLowerCase())
      );
    }

    if (residentType) {
      filtered = filtered.filter((resident) => {
        if (residentType === "senior-citizen") return resident.isSeniorCitizen;
        if (residentType === "student") return resident.isStudent;
        if (residentType === "pwd") return resident.isPWD;
        if (residentType === "solo-parent") return resident.isSoloParent;
        return false;
      });
    }

    if (selectedLocation) {
      filtered = filtered.filter((resident) =>
        resident.generalLocation?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }
    

    filtered.sort((a, b) => {
      const numA = parseInt(a.residentNumber, 10) || 0;
      const numB = parseInt(b.residentNumber, 10) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setCurrentPage(1);
  

    setFilteredResidents(filtered);
  }, [searchName, searchAddress, searchOccupation, residentType, showCount, residents, sortOrder, selectedLocation]);


  const handleDeleteClick = (id: string, residentNumber: string) => {
    if (!isAuthorized) {
      alert("You are not authorized to delete this resident.");
      router.refresh();
      return;
    }
  
    setDeleteUserId(id);
    setSelectedResidentNumber(residentNumber);
    setShowDeletePopup(true); // only show popup, no deletion yet
  };
  
  
  const handleAddResidentClick = () => {
  
    if (isAuthorized) {
      router.push("/dashboard/ResidentModule/AddResident");
    } else {
      alert("You are not authorized to create a new resident.");
      router.refresh(); // Refresh the page
    }
  };
  

  const handleEditClick = (id: string) => {
    if (isAuthorized) {
      router.push(`/dashboard/ResidentModule/EditResident?id=${id}`);
    } else {
      alert("You are not authorized to edit a resident.");
      router.refresh(); // Refresh the page
    }
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;
  
    try {
      const collectionsToClean = ["JobSeekerList", "KasambahayList", "VotersList"];
  
      for (const collectionName of collectionsToClean) {
        let allDocs = [];
  
        if (collectionName === "KasambahayList") {
          // Get docs where residentId matches
          const q1 = query(
            collection(db, collectionName),
            where("residentId", "==", deleteUserId)
          );
          const snapshot1 = await getDocs(q1);
          allDocs.push(...snapshot1.docs);
  
          // Get docs where employerId matches
          const q2 = query(
            collection(db, collectionName),
            where("employerId", "==", deleteUserId)
          );
          const snapshot2 = await getDocs(q2);
          allDocs.push(...snapshot2.docs);
  
        } else {
          // delete residentId from other tables
          const q = query(
            collection(db, collectionName),
            where("residentId", "==", deleteUserId)
          );
          const snapshot = await getDocs(q);
          allDocs.push(...snapshot.docs);
        }
  
        // Delete all matching docs
        const deletePromises = allDocs.map((docSnap) =>
          deleteDoc(doc(db, collectionName, docSnap.id))
        );
        await Promise.all(deletePromises);
      }
  

      // delee the main resident
      await deleteDoc(doc(db, "Residents", deleteUserId));
  
      setResidents((prev) => prev.filter(resident => resident.id !== deleteUserId));
      setDeleteUserId(null);
      setShowDeletePopup(false);
  
      setPopupMessage("Resident Record deleted successfully!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
  
    } catch (error) {
      console.error("Error deleting resident and related records:", error);
      setPopupMessage("Failed to delete resident.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    }
  };
  
  
  

  const indexOfLastResident = currentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidents = filteredResidents.slice(indexOfFirstResident, indexOfLastResident);

  const totalPages = Math.ceil(filteredResidents.length / residentsPerPage);


  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const totalPagesArray = [];
    const pageNumbersToShow = [];

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





/*
CODE FOR INCIDENT RECORDS OF FOR THE VIEW PAGE
*/



  const [incidentReports, setIncidentReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchIncidentReports = async () => {
      if (!residentId) return;
  
      const incidentRef = collection(db, "IncidentReports");
  
      // Query where the resident is the complainant
      const complainantQuery = query(
        incidentRef,
        where("complainant.residentId", "==", residentId)
      );
  
      // Query where the resident is the respondent
      const respondentQuery = query(
        incidentRef,
        where("respondent.residentId", "==", residentId)
      );
  
      // Query where the general residentId matches
      const generalQuery = query(
        incidentRef,
        where("residentId", "==", residentId)
      );
  
      const [complainantSnap, respondentSnap, generalSnap] = await Promise.all([
        getDocs(complainantQuery),
        getDocs(respondentQuery),
        getDocs(generalQuery),
      ]);
  
      const reports: any[] = [];
  
      complainantSnap.forEach((doc) => {
        reports.push({ id: doc.id, role: "Complainant", ...doc.data() });
      });
  
      respondentSnap.forEach((doc) => {
        if (!reports.find((r) => r.id === doc.id)) {
          reports.push({ id: doc.id, role: "Respondent", ...doc.data() });
        }
      });
  
      generalSnap.forEach((doc) => {
        if (!reports.find((r) => r.id === doc.id)) {
          reports.push({ id: doc.id, role: "Complainant", ...doc.data() });
        }
      });
  
      setIncidentReports(reports);
    };
  
    fetchIncidentReports();
  }, [residentId]);






  /*
    CODE FOR THE SERVICE RECORDS
  */


    
const [serviceRequests, setServiceRequests] = useState<any[]>([]);

useEffect(() => {
  const fetchServiceRequests = async () => {
    if (!residentId) return;

    try {
      const requestsRef = collection(db, "ServiceRequests");
      const q = query(requestsRef, where("residentId", "==", residentId));
      const snapshot = await getDocs(q);

      const requests: any[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setServiceRequests(requests);
    } catch (error) {
      console.error("Error fetching service requests:", error);
    }
  };

  fetchServiceRequests();
}, [residentId]);


  return (
    <main className="resident-module-main-container" /* edited this class*/>
    
        <div className="resident-module-section-1">
          {isAuthorized && (
            <Link href="/dashboard/ResidentModule/AddResident">
              <button
                className="add-announcement-btn add-incident-animated"
                onClick={handleAddResidentClick}
              >
                Add New Resident
              </button>
            </Link>
          )}
        </div>



  
    <div className={`resident-module-section-2 ${filtersLoaded ? "filters-animated" : ""}`} /* edited this class*/> 
      <input
        type="text"
        className="resident-module-filter" /* edited this class*/
        placeholder="Search by Name"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
      />
      <input
        type="text"
        className="resident-module-filter"
        placeholder="Search by Address"
        value={searchAddress}
        onChange={(e) => setSearchAddress(e.target.value)}
      />

      {/*}
      <input
        type="text"
        className="resident-module-filter"
        placeholder="Search by Occupation"
        value={searchOccupation}
        onChange={(e) => setSearchOccupation(e.target.value)}
      />
     */}

      <select className="resident-module-filter" value={residentType} onChange={handleResidentTypeChange}>
        <option value="">Resident Type</option>
        <option value="senior-citizen">Senior Citizen</option>
        <option value="student">Student</option>
        <option value="pwd">PWD</option>
        <option value="solo-parent">Solo Parent</option>
      </select>
  
      <select
        className="resident-module-filter"
        value={showCount}
        onChange={(e) => setShowCount(Number(e.target.value))}
      >
        <option value="0">Show All</option>
        <option value="5">Show 5</option>
        <option value="10">Show 10</option>
      </select>

      
      <select
      className="resident-module-filter"
      value={selectedLocation}
      onChange={(e) => setSelectedLocation(e.target.value)}
      >
      <option value="">Location</option>
      <option value="East Fairview">East Fairview</option>
      <option value="West Fairview">West Fairview</option>
      <option value="South Fairview">South Fairview</option>
    </select>


    </div>
  
            <div
              className={`resident-module-main-section ${
                !isAuthorized ? "expand-when-no-section1-resident-module" : ""
              }`}
            >
    
  
    {loading ? (
      <p>Loading residents...</p>
    ) : currentResidents.length === 0 ? (
      <div className="no-result-card">
        <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
        <p className="no-results-department">No Results Found</p>
      </div>
        
      ) : (
        <>
          {!loading && !error && (
            <table>
              <thead /* edited this class */>
                <tr>
                  <th /* edited this class */>
                    Resident Number
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="sort-button"
                    >
                      {sortOrder === "asc" ? "▲" : "▼"}
                    </button>
                  </th>
                  <th>Full Name</th>
                  <th>Address</th>
                  <th>General Location</th>
                  <th>Date of Birth</th>
                  <th>Occupation</th>
                 
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentResidents.map((resident) => {
                  const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || "N/A"}`.trim();
                  return (
                    <tr /* edited this class*/
                    key={resident.id}
                    data-id={resident.id}
                    className={highlightedId === resident.id ? "highlighted-row" : ""}
                  >
                      <td /* edited this class */>{resident.residentNumber}</td>
                      <td>{fullName}</td>
                      <td>{resident.address}</td>
                      <td>{resident.generalLocation}</td>
                      <td>{resident.dateOfBirth}</td>
                      <td>{resident.occupation || "N/A"}</td>
                
                     
                      <td>
                        <div className="residentmodule-actions">
                         <button
                          className="residentmodule-action-view" /* edited this class */
                          /*onClick={() => {
                            router.push(
                              `/dashboard/ResidentModule/ViewResident?id=${resident.id}`
                            )
                          }}*/
                          onClick={() => openPopup(resident)}
                        >
                          <img src="/Images/view.png" alt="View" />
                        </button>

                          {!isAuthorized ? (
                          <>
                            <button
                              className="residentmodule-action-edit hidden" /* edited this class */
                              aria-hidden="true"
                            >
                              <img src="/Images/edit.png" alt="View" />
                            </button>
                            <button
                              className="residentmodule-action-delete hidden" /* edited this class */
                              aria-hidden="true"
                            >
                                <img src="/Images/delete.png" alt="View" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="residentmodule-action-edit" /* edited this class */
                              onClick={() => handleEditClick(resident.id)}
                            >
                                <img src="/Images/edit.png" alt="View" />
                            </button>
                            <button
                              className="residentmodule-action-delete" /* edited this class */
                              onClick={() =>
                                handleDeleteClick(resident.id, resident.residentNumber)
                              }
                            >
                                <img src="/Images/delete.png" alt="View" />
                            </button>
                          </>
                        )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  
       <div className="redirection-section" /* edited this class */>
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


          {isPopupOpen && selectedUser && (
        <div className="user-roles-view-popup-overlay add-incident-animated">
          <div className="view-barangayuser-popup">
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
                    {["basic", "full", "others", "history", "incidents", "services"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`main-resident-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                        onClick={() => setViewActiveSection(section)}
                      >
                        {section === "basic" && "Basic"}
                        {section === "full" && "Full"}
                        {section === "others" && "Others"}
                        {section === "history" && "History"}
                        {section === "incidents" && "Incidents"}
                        {section === "services" && "Services"}
                      </button>
                    ))}
                  </div>
                </div>
            </div>
            <div className="view-user-header-body-bottom-section">
              <div className="mainresident-photo-section">
                <span className="user-details-label">Resident Details</span>
                <div className="user-profile-container">
                  <img
                    src={selectedUser.identificationFileURL || "/Images/default-identificationpic.jpg"}
                    alt="Identification"
                    className="resident-id-photo"
                  />
                </div>
              </div>
              <div className="view-main-resident-info-main-container">
                <div className="view-user-info-main-content">
                  {viewActiveSection  === "basic" && (
                        <>
                          <div className="view-mainresident-content-left-side">
                            <div className="view-user-fields-section">
                              <p>Resident Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.residentNumber || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Date of Residency</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.dateOfResidency || "N/A"}
                                readOnly
                              /> 
                            </div>
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
                              <p>Location</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.generalLocation || "N/A"}
                                readOnly
                              /> 
                            </div>
                          </div>
                          <div className="view-mainresident-content-right-side">
                            <div className="view-user-fields-section">
                              <p>Last Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.lastName || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>First Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.firstName || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Middle Name</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.middleName || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Cluster</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.cluster || "N/A"}
                                readOnly
                              /> 
                            </div>
                          </div>
                        </>
                  )}
                  {viewActiveSection  === "full" && (
                        <>
                        <div className="mainresident-scroll">
                          <div className="view-main-user-content-left-side">
                            <div className="view-user-fields-section">
                              <p>Contact Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.contactNumber || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Email Address</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.emailAddress || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Civil Status</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.civilStatus || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Occupation</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.occupation || "N/A"}
                                readOnly
                              /> 
                            </div>
                            <div className="view-user-fields-section">
                              <p>Precinct Number</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.precinctNumber || "N/A"}
                                readOnly
                              /> 
                            </div>
                          </div>
                          <div className="view-main-user-content-right-side">
                              <div className="view-user-fields-section">
                                <p>Date of Birth</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.dateOfBirth || "N/A"}
                                  readOnly
                                /> 
                              </div>
                              <div className="view-user-fields-section">
                                <p>Place of Birth</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.placeOfBirth || "N/A"}
                                  readOnly
                                /> 
                              </div>
                              <div className="view-user-fields-section">
                                <p>Age</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.age || "N/A"}
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
                              <div className="view-user-fields-section">
                                <p>Citizenship</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.citizenship || "N/A"}
                                  readOnly
                                /> 
                              </div>
                            </div>
                          </div>
                        </>
                  )}
                  {viewActiveSection  === "others" && (
                    <>
                        <div className="others-main-section">
                          <div className="others-top-section">
                            <div className="view-main-user-content-left-side">
                              <div className="view-user-fields-section">
                                <p>Student</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.isStudent ? 'Yes' : 'No'}
                                  readOnly
                                /> 
                              </div>
                              <div className="view-user-fields-section">
                                <p>Senior Citizen</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.isSeniorCitizen ? 'Yes' : 'No'}
                                  readOnly
                                /> 
                              </div>
                            </div>
                            <div className="view-main-user-content-right-side">
                              <div className="view-user-fields-section">
                                <p>PWD</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.isPWD ? 'Yes' : 'No'}
                                  readOnly
                                /> 
                              </div>
                              <div className="view-user-fields-section">
                                <p>Solo Parent</p>
                                <input
                                  type="text"
                                  className="view-user-input-field"
                                  value={selectedUser.isSoloParent ? 'Yes' : 'No'}
                                  readOnly
                                /> 
                              </div>
                            </div>
                          </div>
                          <div className="others-bottom-section">
                            {(selectedUser.verificationFilesURLs as string[]).length > 0 ? (
                              (selectedUser.verificationFilesURLs as string[]).map((url: string, index: number) => (
                              <div key={index} className="services-onlinereq-verification-requirements-section">
                                <span className="verification-requirements-label">
                                  {selectedUser.verificationFilesURLs.length === 1
                                    ? 'Verification Requirement'
                                    : `Verification Requirement ${index + 1}`}
                                </span>

                                <div className="services-onlinereq-verification-requirements-container">
                                  <div className="file-name-image-display">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={url}
                                        alt={`Verification Requirement ${index + 1}`}
                                        className="verification-reqs-pic uploaded-pic"
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="services-onlinereq-verification-requirements-section">
                              <span className="verification-requirements-label">Verification Requirements</span>
                              <div className="services-onlinereq-verification-requirements-container">
                                <div className="no-verification-files-text">
                                  <p>No verification requirements uploaded.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          </div>
                            {/* PWD Identification (matches Verification card styles) */}
                            {selectedUser.isPWD && (
                              <div className="services-onlinereq-verification-requirements-section">
                                <span className="verification-requirements-label">PWD Identification</span>

                                <div className="services-onlinereq-verification-requirements-container">
                                  {selectedUser.pwdIdFileURL ? (
                                    <div className="file-name-image-display">
                                      <a
                                        href={selectedUser.pwdIdFileURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={selectedUser.pwdIdFileURL}
                                          alt="PWD ID"
                                          className="verification-reqs-pic uploaded-pic"
                                          style={{ cursor: 'pointer' }}
                                        />
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="no-verification-files-text">
                                      <p>No PWD ID uploaded.</p>
                                    </div>
                                  )}
                                </div>

                                {/* Extra PWD details below the image, still inside the same card */}
                                <div style={{ marginTop: 10, textAlign: "center" }}>
                                  <div><strong>Type:</strong> {selectedUser.pwdType || "N/A"}</div>
                                  {selectedUser.pwdType === "Temporary" && (
                                    <div><strong>Valid Until:</strong> {selectedUser.pwdTemporaryUntil || "N/A"}</div>
                                  )}
                                </div>
                              </div>
                            )}                          
                        </div>
                    </>
                  )}
                  {viewActiveSection  === "history" && (
                    <>
                      <div className="view-mainresident-content-left-side">
                        <div className="view-user-fields-section">
                          <p>Created By</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={selectedUser.createdBy || "N/A"}
                            readOnly
                          /> 
                        </div>
                        <div className="view-user-fields-section">
                          <p>Created At</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={selectedUser.createdAt || "N/A"}
                            readOnly
                          /> 
                        </div>
                      </div>
                      <div className="view-mainresident-content-left-side">
                        <div className="view-user-fields-section">
                          <p>Updated By</p>
                          <input
                            type="text"
                            className="view-user-input-field"
                            value={selectedUser.updatedBy || "N/A"}
                            readOnly
                          /> 
                        </div>
                      </div>
                    </>
                  )}



                {viewActiveSection  === "incidents" && (
                    <>

                    <div className="records-table-wrapper ">
                    {incidentReports.length === 0 ? (
                      <div className="records-message">
                        <p>No incident reports found for this resident.</p>
                      </div>
                    ) : (
                      <table className="records-table">
                        <thead>
                          <tr>
                            <th className="add-new-col-case">Case No.</th>
                            <th className="add-new-col-date">
                              {incidentReports.some((i) => i.department === "Online") ? "Date Filed" : "Date & Time Filed"}
                            </th>
                            <th className="add-new-col-concern">
                              {incidentReports.some((i) => i.department === "Online") ? "Concerns" : "Nature"}
                            </th>
                            <th className="add-new-col-role">Role</th>
                              <th className="add-new-col-status">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incidentReports.map((incident) => {
                            const isOnline = incident.department === "Online";
                            const targetUrl = isOnline
                              ? `/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${incident.id}`
                              : `/dashboard/IncidentModule/ViewIncident?id=${incident.id}`;

                            return (
                              <tr key={incident.id} className="add-new-clickable-row">
                                <td>
                                  <Link href={targetUrl}>{incident.caseNumber}</Link>
                                </td>
                                <td>
                                  <Link href={targetUrl}>
                                    {isOnline ? incident.dateFiled : `${incident.dateFiled} ${incident.timeFiled}`}
                                  </Link>
                                </td>
                                <td>
                                  <Link href={targetUrl}>
                                    {isOnline
                                      ? (incident.concerns || "N/A")
                                      : (incident.nature === "Others" ? incident.specifyNature : incident.nature)}
                                  </Link>
                                </td>
                                <td>
                                  <Link href={targetUrl}>{incident.role}</Link>
                                </td>
                                                                <td>
                                  <Link href={targetUrl}>
                                    <span className={`add-new-status-badge ${incident.status.toLowerCase().replace(/[\s\-]+/g, "-")}`}>
                                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1).toLowerCase()}
                                    </span>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>


                    </>
                  )}



                 {viewActiveSection  === "services" && (
                    <>
                          <div className="records-table-wrapper ">
                  {serviceRequests.length === 0 ? (
                    <div className="records-message">
                      <p>No service requests found for this resident.</p>
                    </div>
                  ) : (
                    <table className="records-table">
                      <thead>
                        <tr>
                          <th className="add-new-col-case">Account ID</th>
                          <th className="add-new-col-concern">Purpose</th>
                          <th className="add-new-col-date">Document Type</th>
                          <th className="add-new-col-status">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceRequests.map((req) => (
                          <tr key={req.id} className="add-new-clickable-row">
                            <td>
                              <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                                {req.requestId}
                              </Link>
                            </td>
                            <td>
                              <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                                {req.purpose}
                              </Link>
                            </td>
                            <td>
                              <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                                {req.docType}
                              </Link>
                            </td>
                            <td>
                              <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                                <span
                                  className={`add-new-status-badge ${req.status
                                    ?.toLowerCase().replace(/[\s\-]+/g, "-")}`}>

                                  {req.status?.charAt(0).toUpperCase() + req.status?.slice(1).toLowerCase()}
                                </span>
                              </Link>
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
              </div>
            </div>
          </div>
        </div>
      )}

  
    {showDeletePopup && (
      <div className="confirmation-popup-overlay-module-main-res">
        <div className="confirmation-popup-module-main-res">
          <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
          <p>Are you sure you want to delete this Resident Record?</p>
          <h2>Resident Number: {selectedResidentNumber}</h2>
          <div className="yesno-container-module">
            <button onClick={() => setShowDeletePopup(false)} className="no-button-module">No</button>
            <button onClick={confirmDelete} className="yes-button-module">Yes</button>
          </div> 
        </div>
      </div>
    )}
  
    {showPopup && (
      <div className={`popup-overlay-module-main-res show`}>
        <div className="popup-module-main-res">
          <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
          <p>{popupMessage}</p>
        </div>
      </div>
    )}
  
    {showAlertPopup && (
      <div className="confirmation-popup-overlay-module-main-res">
        <div className="confirmation-popup-module-main-res">
          <p>{popupMessage}</p>
          <div className="yesno-container-module">
            <button onClick={() => setshowAlertPopup(false)} className="no-button-module">Continue</button>
          </div> 
        </div>
      </div>
    )}


  </main>
  
  );
}
