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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resident?")) {
      try {
        await deleteDoc(doc(db, "Residents", id));
        setResidents((prev) => prev.filter(resident => resident.id !== id));
        alert("Resident deleted successfully!");
      } catch (error) {
        console.error("Error deleting resident:", error);
        alert("Failed to delete resident.");
      }
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


  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Residents List</h1>
        <Link href="/dashboard/ResidentModule/AddResident">
          <button className="add-announcement-btn">Add New Resident</button>
        </Link>
      </div>

      <div className="section-2">
        <input
          type="text"
          className="search-bar"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          type="text"
          className="search-bar"
          placeholder="Search by Address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />

        <input
          type="text"
          className="search-bar"
          placeholder="Search by Occupation"
          value={searchOccupation}
          onChange={(e) => setSearchOccupation(e.target.value)}
        />

        <select className="featuredStatus" value={residentType} onChange={handleResidentTypeChange}>
          <option value="">Resident Type</option>
          <option value="senior-citizen">Senior Citizen</option>
          <option value="student">Student</option>
          <option value="pwd">PWD</option>
          <option value="solo-parent">Solo Parent</option>
        </select>

        <select
          className="featuredStatus"
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
        >
          <option value="0">Show All</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

      <div className="main-section">
        {loading && <p>Loading residents...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
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
                  <td>{resident.name}</td>
                  <td>{resident.address}</td>
                  <td>{resident.generalLocation}</td>
                  <td>{resident.dateOfBirth}</td>
                  <td>{resident.placeOfBirth}</td>
                  <td>{resident.age}</td>
                  <td>{resident.sex}</td>
                  <td>{resident.civilStatus}</td>
                  <td>
                    <div className="actions">
                      <button 
                        className="action-view" 
                        onClick={() => router.push(`/dashboard/ResidentModule/ViewResident?id=${resident.id}`)}
                      >
                        View
                      </button>
                      <button 
                        className="action-edit" 
                        onClick={() => router.push(`/dashboard/ResidentModule/EditResident?id=${resident.id}`)}
                      >
                        Edit
                      </button>
                      <button 
                        className="action-delete" 
                        onClick={() => handleDelete(resident.id)}
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
      
    </main>
  );
}
