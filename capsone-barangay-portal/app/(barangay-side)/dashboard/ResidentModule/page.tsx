"use client";
import "@/CSS/ResidentModule/module.css";
import { useEffect, useState } from "react";
import { db } from "../../../db/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function ResidentModule() {
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Residents List</h1>
        <Link href="/dashboard/ResidentModule/AddResident">
          <button className="add-announcement-btn">Add New Resident</button>
        </Link>
      </div>

      <div className="section-2">
        <input type="text" className="search-bar" placeholder="Enter Name" />
        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Location</option>
          <option value="East Fairview">East Fairview</option>
          <option value="West Fairview">West Fairview</option>
          <option value="South Fairview">South Fairview</option>
        </select>
        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Resident Type</option>
          <option value="senior-citizen">Senior Citizen</option>
          <option value="student">Student</option>
          <option value="pwd">PWD</option>
          <option value="single-mom">Single Mom</option>
        </select>
        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Show...</option>
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
              {residents.map((resident) => (
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
