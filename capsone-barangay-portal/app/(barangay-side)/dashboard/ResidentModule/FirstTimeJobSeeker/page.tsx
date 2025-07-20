"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState, useRef} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { db } from "../../../../db/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

export default function JobSeekerListModule() {

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPosition = session?.user?.position;
  const isAuthorized = ["Secretary", "Assistant Secretary"].includes(userPosition || "");


  const [jobSeekers, setJobSeekers] = useState<any[]>([]);
  const [filteredJobSeekers, setFilteredJobSeekers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [showCount, setShowCount] = useState<number>(0);
  const router = useRouter();

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false); 
  const [showAlertPopup, setshowAlertPopup] = useState(false); 

  // Highlighting Logic based on the URL parameter
  const searchParams = useSearchParams();
  const highlightResidentId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);


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
  

  useEffect(() => {
    if (highlightResidentId && filteredJobSeekers.length > 0) {
      const targetIndex = filteredJobSeekers.findIndex(seeker => seeker.id === highlightResidentId);
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
  }, [highlightResidentId, filteredJobSeekers]);

  useEffect(() => {
    const fetchJobSeekers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "JobSeekerList"));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobSeekers(data);
      } catch (err) {
        setError("Failed to load job seekers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobSeekers();
  }, []);

  useEffect(() => {
    let filtered = [...jobSeekers];

    if (searchName) {
      filtered = filtered.filter((seeker) => {
        const firstName = seeker.firstName?.toLowerCase() || "";
        const middleName = seeker.middleName?.toLowerCase() || "";
        const lastName = seeker.lastName?.toLowerCase() || "";

        return (
          firstName.includes(searchName.toLowerCase()) ||
          middleName.includes(searchName.toLowerCase()) ||
          lastName.includes(searchName.toLowerCase())
        );
      });
    }

    // Sorting by Date Applied (Newest First by Default)
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateApplied).getTime() || 0;
      const dateB = new Date(b.dateApplied).getTime() || 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setCurrentPage(1);
    
    setFilteredJobSeekers(filtered);
  }, [searchName, jobSeekers, sortOrder,showCount]);

  const formatDateToMMDDYYYY = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
  };


  const handleAddResidentClick = () => {
  
    if (isAuthorized) {
      router.push("/dashboard/ResidentModule/FirstTimeJobSeeker/AddFirstTimeJobSeeker");
    } else {
      alert("You are not authorized to create a new kasambahay.");
      router.refresh(); // Refresh the page
    }
  };
  

  const handleEditClick = (id: string) => {
    if (isAuthorized) {
      router.push(`/dashboard/ResidentModule/FirstTimeJobSeeker/EditFirstTimeJobSeeker?id=${id}`);
    } else {
      alert("You are not authorized to edit a current voter.");
      router.refresh(); // Refresh the page
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (isAuthorized) {
      setDeleteUserId(id);
    setShowDeletePopup(true); 
  } else {
    alert("You are not authorized to delete this resident.");
    router.refresh(); // Refresh the page
  }  
}

  const confirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteDoc(doc(db, "JobSeekerList", deleteUserId));
        setJobSeekers((prev) => prev.filter(seeker => seeker.id !== deleteUserId));

        setShowDeletePopup(false);
        setDeleteUserId(null);

        setPopupMessage("Jobseeker Record deleted successfully!");
        setShowPopup(true);

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);

      } catch (error) {
        console.error("Error deleting jobseeker:", error);
        alert("Failed to delete jobseeker.");
      }
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10; // Can be changed 

  const indexOfLastResident = currentPage * residentsPerPage;
  const indexOfFirstResident = indexOfLastResident - residentsPerPage;
  const currentResidents = filteredJobSeekers.slice(indexOfFirstResident, indexOfLastResident);

  const totalPages = Math.ceil(filteredJobSeekers.length / residentsPerPage);

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

  

  return (
    <main className="resident-module-main-container">
   
   



      <div className={`resident-module-section-2 ${filtersLoaded ? "filters-animated" : ""}`} /* edited this class*/> 
        <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />


      <select
          className="resident-module-filter"
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
        >
          <option value="0">Show All</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

      <div className="resident-module-main-section">
  {loading ? (
    <p>Loading job seekers...</p>
  ) : error ? (
    <p className="error">{error}</p>
  ) : filteredJobSeekers.length === 0 ? (
    <div className="no-result-card">
      <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
      <p className="no-results-department">No Results Found</p>
    </div>
  ) : (
    <table>
  <thead>
    <tr>
      <th>
        Date Applied
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="sort-button"
        >
          {sortOrder === "asc" ? "▲" : "▼"}
        </button>
      </th>
      <th>Full Name</th>
      <th>Date of Birth</th>

      <th>Remarks</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {currentResidents.map((seeker) => {
      const fullName = `${seeker.lastName || ""}, ${seeker.firstName || ""} ${seeker.middleName || ""}`.trim();
      return (
        <tr
            key={seeker.id}
            data-id={seeker.id}
            className={highlightedId === seeker.id ? "highlighted-row" : ""}
          >
          <td>{formatDateToMMDDYYYY(seeker.dateApplied)}</td>
          <td>{fullName}</td>
          <td>{seeker.dateOfBirth}</td>
          <td>{seeker.remarks}</td>
          <td>
            <div className="residentmodule-actions">
              <button
                className="residentmodule-action-view"
                //onClick={() => router.push(`/dashboard/ResidentModule/FirstTimeJobSeeker/ViewFirstTimeJobSeeker?id=${seeker.id}`)}
                 onClick={() => openPopup(seeker)}
              >
                <img src="/Images/view.png" alt="View" />
              </button>
              {!isAuthorized ? (
              <>
                <button
                  className="residentmodule-action-edit hidden"
                  aria-hidden="true"
                >
                  <img src="/Images/edit.png" alt="Edit" />
                </button>
                <button
                  className="residentmodule-action-delete hidden"
                  aria-hidden="true"
                >
                   <img src="/Images/delete.png" alt="Delete" />
                </button>
              </>
            ) : (
              <>
                <button
                  className="residentmodule-action-edit"
                  onClick={() => handleEditClick(seeker.id)}
                >
                     <img src="/Images/edit.png" alt="Edit" />
                </button>
                <button
                  className="residentmodule-action-delete"
                  onClick={() => handleDeleteClick(seeker.id)}
                >
                  <img src="/Images/delete.png" alt="Delete" />
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
</div>

    <div className="redirection-section">
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
                        <div className="confirmation-popup-overlay-module-jobseeker">
                            <div className="confirmation-popup-module-jobseeker">
                              <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                              <p>Are you sure you want to delete this Jobseeker Record?</p>
                              {(() => {
                                const seeker = jobSeekers.find((s) => s.id === deleteUserId);
                                if (!seeker) return null;

                                const fullName = `${seeker.lastName || ""}, ${seeker.firstName || ""} ${seeker.middleName || ""}`.trim();

                                return (
                                  <h2>Jobseeker Name: {fullName}</h2>
                                );
                              })()}
                                <div className="yesno-container-module">
                                    <button onClick={() => setShowDeletePopup(false)} className="no-button-module">No</button>
                                    <button onClick={confirmDelete} className="yes-button-module">Yes</button>
                                </div> 
                            </div>
                        </div>
      )}


      {showPopup && (
                <div className={`popup-overlay-module-jobseeker show`}>
                    <div className="popup-module-jobseeker">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
      )}

      {showAlertPopup && (
                        <div className="confirmation-popup-overlay-module-jobseeker">
                            <div className="confirmation-popup-module-jobseeker">
                              <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>{popupMessage}</p>
                                <div className="yesno-container-module">
                                    <button onClick={() => setshowAlertPopup(false)} className="no-button-module">Continue</button>
                                </div> 
                            </div>
                        </div>
       )}  

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
                    {[ "basic", "others", "history"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`main-resident-info-toggle-btn ${viewActiveSection === section ? "active" : ""}`}
                        onClick={() => setViewActiveSection(section)}
                      >
                        {section === "basic" && "Basic"}
                        {section === "employment" && "Employment"}
                        {section === "others" && "Others"}
                        {section === "history" && "History"}
                      </button>
                    ))}
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
                          </div>
                          <div className="view-mainresident-content-right-side">
                            <div className="view-user-fields-section">
                              <p>Gender</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={
                                  selectedUser.sex === "F"
                                    ? "Female"
                                    : selectedUser.sex === "M"
                                    ? "Male"
                                    : "N/A"
                                }
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
                              <p>Date of Birth</p>
                              <input
                                type="text"
                                className="view-user-input-field"
                                value={selectedUser.dateOfBirth || "N/A"}
                                readOnly
                              /> 
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
                                  <p>Date Applied</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedUser.dateApplied || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                              <div className="view-main-user-content-right-side">
                                <div className="view-user-fields-section">
                                  <p>Remarks</p>
                                  <input
                                    type="text"
                                    className="view-user-input-field"
                                    value={selectedUser.remarks || "N/A"}
                                    readOnly
                                  /> 
                                </div>
                              </div>
                            </div>
                            <div className="others-bottom-section">
                              {selectedUser.verificationFilesURLs?.length > 0 ? (
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
                              <p>Last Updated By</p>
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