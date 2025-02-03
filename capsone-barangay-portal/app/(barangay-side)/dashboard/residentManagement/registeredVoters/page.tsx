"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../../db/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Resident {
  id?: string;
  name: string;
  address: string;
  dateofBirth: string;
  placeofBirth: string;
  age: number;
  sex: string;
  civilStatus: string;
  occupation: string;
  contactNumber: string;
  emailAddress: string;
  precinctNumber: string;
  isVoter: boolean;
}

const ResidentManagement = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch only residents who are voters
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentCollection = collection(db, "Residents");
        const residentSnapshot = await getDocs(residentCollection);
        const residentData: Resident[] = residentSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              address: data.address,
              dateofBirth: data.dateofBirth,
              placeofBirth: data.placeofBirth,
              age: data.age,
              sex: data.sex,
              civilStatus: data.civilStatus,
              occupation: data.occupation,
              contactNumber: data.contactNumber,
              emailAddress: data.emailAddress,
              precinctNumber: data.precinctNumber,
              isVoter: data.isVoter || false, // Default to false if missing
            };
          })
          .filter((resident) => resident.isVoter); // Filter only voters

        setResidents(residentData);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };

    fetchResidents();
  }, []);

  // Filter residents based on search query
  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.precinctNumber.includes(searchQuery)
  );

  return (
    <div>
      <h1>Resident Management Module</h1>
      <h2>Registered Voter Residents</h2>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search by name, address, or precinct number"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 w-full"
      />

      {/* Residents Table */}
      <div className="border border-black p-4 h-80 overflow-y-scroll">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Name</th>
              <th className="border border-gray-300 p-2">Address</th>
              <th className="border border-gray-300 p-2">Date of Birth</th>
              <th className="border border-gray-300 p-2">Place of Birth</th>
              <th className="border border-gray-300 p-2">Age</th>
              <th className="border border-gray-300 p-2">Sex</th>
              <th className="border border-gray-300 p-2">Civil Status</th>
              <th className="border border-gray-300 p-2">Occupation</th>
              <th className="border border-gray-300 p-2">Contact Number</th>
              <th className="border border-gray-300 p-2">Email</th>
              <th className="border border-gray-300 p-2">Precinct Number</th>
            </tr>
          </thead>
          <tbody>
            {filteredResidents.map((resident) => (
              <tr key={resident.id}>
                <td className="border border-gray-300 p-2">{resident.name}</td>
                <td className="border border-gray-300 p-2">{resident.address}</td>
                <td className="border border-gray-300 p-2">{resident.dateofBirth}</td>
                <td className="border border-gray-300 p-2">{resident.placeofBirth}</td>
                <td className="border border-gray-300 p-2">{resident.age}</td>
                <td className="border border-gray-300 p-2">{resident.sex}</td>
                <td className="border border-gray-300 p-2">{resident.civilStatus}</td>
                <td className="border border-gray-300 p-2">{resident.occupation}</td>
                <td className="border border-gray-300 p-2">{resident.contactNumber}</td>
                <td className="border border-gray-300 p-2">{resident.emailAddress}</td>
                <td className="border border-gray-300 p-2">{resident.precinctNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResidentManagement;
