"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

export default function KasambahayListModule() {

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPosition = session?.user?.position;
  const isAuthorized = ["Secretary", "Assistant Secretary"].includes(userPosition || "");

  
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [showCount, setShowCount] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const router = useRouter(); 

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedRegistrationControlNumber, setSelectedRegistrationControlNumber] = useState<string | null>(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false); 
  const [showAlertPopup, setshowAlertPopup] = useState(false); 


  // Highlighting Logic based on the URL parameter
  const searchParams = useSearchParams();
  const highlightResidentId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

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
        const querySnapshot = await getDocs(collection(db, "KasambahayList"));
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
        const firstName = resident.firstName?.toLowerCase() || "";
        const middleName = resident.middleName?.toLowerCase() || "";
        const lastName = resident.lastName?.toLowerCase() || "";
    
        return (
          firstName.includes(searchName.toLowerCase()) ||
          middleName.includes(searchName.toLowerCase()) ||
          lastName.includes(searchName.toLowerCase())
        );
      });
    }

    if (searchAddress) {
      filtered = filtered.filter((resident) =>
        resident.homeAddress.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }

    // Sorting by Registration Control Number
    filtered.sort((a, b) => {
      const numA = parseInt(a.registrationControlNumber, 10) || 0;
      const numB = parseInt(b.registrationControlNumber, 10) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    });

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setCurrentPage(1);

    setFilteredResidents(filtered);
  }, [searchName, searchAddress, showCount, residents, sortOrder]);


  const handleAddResidentClick = () => {
  
    if (isAuthorized) {
      router.push("/dashboard/ResidentModule/kasambahayList/AddKasambahay");
    } else {
      alert("You are not authorized to create a new kasambahay.");
      router.refresh(); // Refresh the page
    }
  };
  

  const handleEditClick = (id: string) => {
    if (isAuthorized) {
      router.push(`/dashboard/ResidentModule/kasambahayList/EditKasambahay?id=${id}`);
    } else {
      alert("You are not authorized to edit a current voter.");
      router.refresh(); // Refresh the page
    }
  };


  const handleDeleteClick = async (id: string, registrationControlNumber: string) => {
    if (isAuthorized) {
    setDeleteUserId(id);
    setSelectedRegistrationControlNumber(registrationControlNumber);
    setShowDeletePopup(true); 
    } else {
      alert("You are not authorized to delete this resident.");
      router.refresh(); // Refresh the page
    }
  }

  const confirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteDoc(doc(db, "KasambahayList", deleteUserId));
        setResidents((prev) => prev.filter(resident => resident.id !== deleteUserId));

        setShowDeletePopup(false);
        setDeleteUserId(null);

        setPopupMessage("Kasambahay Record deleted successfully!");
        setShowPopup(true);

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);

      } catch (error) {
        console.error("Error deleting resident:", error);
        alert("Failed to delete resident.");

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      }
    }
  }
      

  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10; //pwede paltan 

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

  return (
    <main className="resident-module-main-container">
      {/*
      <div className="path-section">
          <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
          <h2 className="breadcrumb">Kasambahay Masterlist<span className="chevron"></span></h2>
      </div>*/}
      <div className="resident-module-section-1">



        {/*<h1>Kasambahay Masterlist</h1>*/}
        {isAuthorized ? (
        <Link href="/dashboard/ResidentModule/kasambahayList/AddKasambahay">
          <button className="add-announcement-btn">Add New Kasambahay</button>
        </Link>
        ) : (
          <button className="add-announcement-btn opacity-0 cursor-not-allowed" disabled>Add New Kasambahay</button>
        )}
      </div>

      <div className="resident-module-section-2">
        <input
          type="text"
          className="resident-module-filter"
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
    <p>Loading residents...</p>
  ) : error ? (
    <p className="error">{error}</p>
  ) : currentResidents.length === 0 ? (
    <div className="no-result-card">
      <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
      <p className="no-results-department">No Results Found</p>
    </div>
  ) : (
    <table>
    <thead>
      <tr>
        <th>
          Registration Control Number
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="sort-button"
          >
            {sortOrder === "asc" ? "▲" : "▼"}
          </button>
        </th>
        <th>Full Name</th>
        <th>Home Address</th>
        <th>Date of Birth</th>
        <th>Place of Birth</th>
        <th>Sex</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {currentResidents.map((resident) => {
        const fullName = `${resident.lastName || ""}, ${resident.firstName || ""} ${resident.middleName || ""}`.trim();
        return (
          <tr
            key={resident.id}
            data-id={resident.id}
            className={highlightedId === resident.id ? "highlighted-row" : ""}
          >
            <td>{resident.registrationControlNumber}</td>
            <td>{fullName}</td>
            <td>{resident.homeAddress}</td>
            <td>{resident.dateOfBirth}</td>
            <td>{resident.placeOfBirth}</td>
            <td>{resident.sex}</td>

            <td>
              <div className="residentmodule-actions">
                <button
                  className="residentmodule-action-view"
                  onClick={() =>
                    router.push(
                      `/dashboard/ResidentModule/kasambahayList/ViewKasambahay?id=${resident.id}`
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
                    <img src="/Images/edit.png" alt="View" />
                  </button>
                  <button
                    className="residentmodule-action-delete hidden"
                    aria-hidden="true"
                  >
                     <img src="/Images/delete.png" alt="View" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="residentmodule-action-edit"
                    onClick={() => handleEditClick(resident.id)}
                  >
                    <img src="/Images/edit.png" alt="View" />
                  </button>
                  <button
                    className="residentmodule-action-delete"
                    onClick={() =>
                      handleDeleteClick(
                        resident.id,
                        resident.registrationControlNumber
                      )
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
                        <div className="confirmation-popup-overlay-module-kasambahay">
                            <div className="confirmation-popup-module-kasambahay">
                              <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                              <p>Are you sure you want to delete this Kasambahay Record?</p>
                              <h2>Registration Control Number: {selectedRegistrationControlNumber}</h2>
                                <div className="yesno-container-module">
                                    <button onClick={() => setShowDeletePopup(false)} className="no-button-module">No</button>
                                    <button onClick={confirmDelete} className="yes-button-module">Yes</button>
                                </div> 
                            </div>
                        </div>
      )}


      {showPopup && (
                <div className={`popup-overlay-module-kasambahay show`}>
                    <div className="popup-module-kasambahay">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
      )}

      {showAlertPopup && (
                        <div className="confirmation-popup-overlay-module-kasambahay">
                            <div className="confirmation-popup-module-kasambahay">
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
