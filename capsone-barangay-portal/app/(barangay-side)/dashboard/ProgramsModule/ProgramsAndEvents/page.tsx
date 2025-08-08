"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";

export default function ResidentModule() {
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [residentType, setResidentType] = useState<string>("");
  const [showCount, setShowCount] = useState<number>(5);

  const router = useRouter(); 

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
        resident.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchAddress) {
      filtered = filtered.filter((resident) =>
        resident.address.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }

    if (residentType) {
      filtered = filtered.filter((resident) => resident.residentType === residentType);
    }

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setFilteredPrograms(filtered);
  }, [searchName, searchAddress, residentType, showCount, residents]);

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


    // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 10; // same as your showCount default



    // Pagination logic
  const indexOfLastPrograms = currentPage *  programsPerPage;
  const indexOfFirstPrograms = indexOfLastPrograms -  programsPerPage;
  const currentPrograms = filteredPrograms.slice(indexOfFirstPrograms, indexOfLastPrograms);
  const totalPages = Math.ceil(filteredPrograms.length /  programsPerPage);

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


  return (
    <main className="programs-module-main-container">
      <div className="programs-module-section-1">
        
          <button className="add-programs-btn">Add New Programs</button>
        
      </div>

      <div className="programs-module-section-2">
        <input
          type="text"
          className="programs-module-filter"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          type="text"
          className="programs-module-filter"
          placeholder="Search by Address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />


      </div>

     <div className="programs-module-main-section">
  {loading ? (
    <p>Loading residents...</p>
  ) : currentPrograms.length === 0 ? (
    <div className="no-result-card">
      <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
      <p className="no-results-department">No Results Found</p>
    </div>
  ) : (
    <>
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Date of Birth</th>
              <th>Place of Birth</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Civil Status</th>
              <th>Occupation</th>
              <th>Contact</th>
              <th>Email Address</th>
              <th>Precinct Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrograms.map((resident) => (
              <tr key={resident.id}>
                <td>{resident.name}</td>
                <td>{resident.address}</td>
                <td>{resident.dateofBirth}</td>
                <td>{resident.placeofBirth}</td>
                <td>{resident.age}</td>
                <td>{resident.sex}</td>
                <td>{resident.civilStatus}</td>
                <td>{resident.occupation}</td>
                <td>{resident.contactNumber}</td>
                <td>{resident.emailAddress}</td>
                <td>{resident.precinctNumber}</td>
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
    </>
  )}
</div>


        <div className="redirection-section">
          <button onClick={prevPage} disabled={currentPage === 1}>&laquo;</button>
          {getPageNumbers().map((number, index) => (
            <button
              key={index}
              onClick={() => typeof number === "number" && paginate(number)}
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
