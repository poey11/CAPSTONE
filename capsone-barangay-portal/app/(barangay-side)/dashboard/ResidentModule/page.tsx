"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../db/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";


export default function ResidentModule() {
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [searchOccupation, setSearchOccupation] = useState<string>("");
 
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

  const handleResidentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResidentType(e.target.value);
  };


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
      filtered = filtered.filter((resident) =>
        resident.name?.toLowerCase().includes(searchName.toLowerCase())
      );
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

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setFilteredResidents(filtered);
  }, [searchName, searchAddress, searchOccupation, residentType, showCount, residents]);


  const handleDeleteClick = async (id: string, residentNumber: string) => {
    setDeleteUserId(id);
    setSelectedResidentNumber(residentNumber);
    setShowDeletePopup(true); 

  }

  const confirmDelete = async () => {
    if (deleteUserId) {
      try {
        await deleteDoc(doc(db, "Residents", deleteUserId));
        setResidents((prev) => prev.filter(resident => resident.id !== deleteUserId));
        
        setShowDeletePopup(false);
        setDeleteUserId(null);

        setPopupMessage("Resident Record deleted successfully!");
        setShowPopup(true);

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);

      } catch (error) {
        console.error("Error deleting resident:", error);
        setPopupMessage("Failed to delete resident.");
      
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      }
    }

  }

 

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
      <div className="resident-module-section-1">
        <h1>Residents List</h1>
        <Link href="/dashboard/ResidentModule/AddResident">
          <button className="add-announcement-btn">Add New Resident</button>
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
        <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />

        <input
          type="text"
          className="resident-module-filter"
          placeholder="Search by Occupation"
          value={searchOccupation}
          onChange={(e) => setSearchOccupation(e.target.value)}
        />

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
      </div>

      <div className="resident-module-main-section">
        {loading && <p>Loading residents...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>Resident Number</th>
                <th>Full Name</th>
                <th>Address</th>
                <th>General Location</th>
                <th>Date of Birth</th>
                <th>Place of Birth</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Civil Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentResidents.map((resident) => (
                <tr key={resident.id}>
                  <td>{resident.residentNumber}</td>
                  <td>{resident.name}</td>
                  <td>{resident.address}</td>
                  <td>{resident.generalLocation}</td>
                  <td>{resident.dateOfBirth}</td>
                  <td>{resident.placeOfBirth}</td>
                  <td>{resident.age}</td>
                  <td>{resident.sex}</td>
                  <td>{resident.civilStatus}</td>
                  <td>
                    <div className="residentmodule-actions">
                      <button 
                        className="residentmodule-action-view" 
                        onClick={() => router.push(`/dashboard/ResidentModule/ViewResident?id=${resident.id}`)}
                      >
                        View
                      </button>
                      <button 
                        className="residentmodule-action-edit" 
                        onClick={() => router.push(`/dashboard/ResidentModule/EditResident?id=${resident.id}`)}
                      >
                        Edit
                      </button>
                      <button 
                        className="residentmodule-action-delete" 
                        onClick={() => handleDeleteClick(resident.id, resident.residentNumber)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                            <p>Are you sure you want to delete this Resident Record?</p>
                            <h2>Resident Number: {selectedResidentNumber}</h2>
                                <div className="yesno-container">
                                    <button onClick={() => setShowDeletePopup(false)} className="no-button">No</button>
                                    <button onClick={confirmDelete} className="yes-button">Yes</button>
                                </div> 
                            </div>
                        </div>
      )}


      {showPopup && (
                <div className={`popup-overlay show`}>
                    <div className="popup">
                        <p>{popupMessage}</p>
                    </div>
                </div>
      )}

      {showAlertPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>{popupMessage}</p>
                                <div className="yesno-container">
                                    <button onClick={() => setshowAlertPopup(false)} className="no-button">Continue</button>
                                </div> 
                            </div>
                        </div>
       )}  
      
    </main>
  );
}
