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

    setFilteredResidents(filtered);
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

        <select
          className="featuredStatus"
          value={residentType}
          onChange={(e) => setResidentType(e.target.value)}
        >
          <option value="">Resident Type</option>
          <option value="senior-citizen">Senior Citizen</option>
          <option value="student">Student</option>
          <option value="pwd">PWD</option>
          <option value="single-mom">Single Mom</option>
        </select>
        <select
          className="featuredStatus"
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
        >
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
              {filteredResidents.map((resident) => (
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
      </div>
    </main>
  );
}
