"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
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
      {/*}
      <div className="path-section">
          <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
          <h2 className="breadcrumb">First-Time Job Seeker List<span className="chevron"></span></h2>
      </div>*/}
      <div className="resident-module-section-1">

    


        {/*<h1>First-Time Job Seeker List</h1>*/}
        <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker/AddFirstTimeJobSeeker">
          <button className="add-announcement-btn">Add New Job Seeker</button>
        </Link>
      </div>

      <div className="resident-module-section-2">
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
      <th>Age</th>
      <th>Sex</th>
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
          <td>{seeker.age}</td>
          <td>{seeker.sex}</td>
          <td>{seeker.remarks}</td>
          <td>
            <div className="residentmodule-actions">
              <button
                className="residentmodule-action-view"
                onClick={() =>
                  router.push(
                    `/dashboard/ResidentModule/FirstTimeJobSeeker/ViewFirstTimeJobSeeker?id=${seeker.id}`
                  )
                }
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

    </main>
  );
}