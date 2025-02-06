"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
import { db } from "../../../db/firebase";
import { collection, getDocs } from "firebase/firestore";
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

    // Filter by search term for name
    if (searchName) {
      filtered = filtered.filter((resident) =>
        resident.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by search term for address
    if (searchAddress) {
      filtered = filtered.filter((resident) =>
        resident.address.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }

    // Filter by resident type
    if (residentType) {
      filtered = filtered.filter((resident) => resident.residentType === residentType);
    }

    // Limit number of items to show
    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setFilteredResidents(filtered);
  }, [searchName, searchAddress, location, residentType, showCount, residents]);

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
          <option value="" disabled>Resident Type</option>
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
                <th>Birthday</th>
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
                      <button className="action-view">View</button>
                      <button className="action-edit">Edit</button>
                      <button className="action-delete">Delete</button>
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
