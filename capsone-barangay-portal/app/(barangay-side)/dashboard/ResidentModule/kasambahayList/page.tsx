"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link";

export default function KasambahayListModule() {
  const [residents, setResidents] = useState<any[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState<string>("");
  const [searchAddress, setSearchAddress] = useState<string>("");
  const [showCount, setShowCount] = useState<number>(5);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const router = useRouter(); 

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

    setFilteredResidents(filtered);
  }, [searchName, searchAddress, showCount, residents, sortOrder]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this resident?")) {
      try {
        await deleteDoc(doc(db, "KasambahayList", id));
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
        <h1>Kasambay Masterlist</h1>
        <Link href="/dashboard/ResidentModule/kasambahayList/AddKasambahay">
          <button className="add-announcement-btn">Add New Kasambahay</button>
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
                <th>
                  Registration Control Number
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="sort-button"
                  >
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </button>
                </th>                
                <th>Last Name</th>                
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Home Address</th>
                <th>Date of Birth</th>
                <th>Place of Birth</th>
                <th>Sex</th>
                <th>Age</th>
                <th>Civil Status</th>
                <th>Educational Attainment</th>
                <th>Nature of Work</th>
                <th>Employment Arrangement</th>
                <th>Salary</th>
                <th>SSS Member</th>
                <th>PAG-IBIG Member</th>
                <th>PhilHealth Member</th>
                <th>Employer Name</th>
                <th>Employer Address</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident) => (
                <tr key={resident.id}>
                  <td>{resident.registrationControlNumber}</td>
                  <td>{resident.lastName}</td>
                  <td>{resident.firstName}</td>
                  <td>{resident.middleName}</td>
                  <td>{resident.homeAddress}</td>
                  <td>{resident.dateOfBirth}</td>
                  <td>{resident.placeOfBirth}</td>
                  <td>{resident.sex}</td>
                  <td>{resident.age}</td>
                  <td>{resident.civilStatus}</td>
                  <td>{resident.educationalAttainment}</td>
                  <td>{resident.natureOfWork}</td>
                  <td>{resident.employmentArrangement}</td>
                  <td>{resident.salary}</td>
                  <td>{resident.sssMember ? "Yes" : "No"}</td>
                  <td>{resident.pagibigMember ? "Yes" : "No"}</td>
                  <td>{resident.philhealthMember ? "Yes" : "No"}</td>
                  <td>{resident.employerName}</td>
                  <td>{resident.employerAddress}</td>
                  <td>{resident.createdAt}</td>
                  <td>
                    <div className="actions">
                      <button className="action-view" onClick={() => router.push(`/dashboard/ResidentModule/kasambahayList/ViewKasambahay?id=${resident.id}`)}>View</button>
                      <button className="action-edit" onClick={() => router.push(`/dashboard/ResidentModule/kasambahayList/EditKasambahay?id=${resident.id}`)}>Edit</button>
                      <button className="action-delete" onClick={() => handleDelete(resident.id)}>Delete</button>
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
