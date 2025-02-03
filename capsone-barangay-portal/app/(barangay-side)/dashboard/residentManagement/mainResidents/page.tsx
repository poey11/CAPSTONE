"use client";
import React, { useState, useEffect } from "react";
import { db } from "../../../../db/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

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
  const [newResident, setNewResident] = useState<Partial<Resident>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // Fetch residents data from Firestore
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentCollection = collection(db, "Residents");
        const residentSnapshot = await getDocs(residentCollection);
        const residentData: Resident[] = residentSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Map Firestore fields to the structure of the Resident interface
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
            isVoter: data.isVoter
          };
        });
        console.log(residentData);  // Log the fetched data for debugging
        setResidents(residentData);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };
    fetchResidents();
  }, []);

  // Handle input change for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewResident({ ...newResident, [e.target.name]: e.target.value });
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setFile(file);
    }
  };

  // Add new resident to Firestore
  const addResident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const residentCollection = collection(db, "Residents");
        const newResidentData = { ...newResident };
  
      await addDoc(residentCollection, newResidentData);
      setResidents((prev) => [...prev, { ...newResidentData } as Resident]);
      setNewResident({});
    } catch (error) {
      console.error("Error adding resident:", error);
    }
  };
  

  // Filter residents based on search query
  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.precinctNumber.includes(searchQuery)
  );

  return (
    <div>
      <h1>Resident Management Module</h1>

      {/* Resident Registration Form */}
      <h2>Resident Registration</h2>
      <form className="flex flex-col gap-2" onSubmit={addResident}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={newResident.name || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={newResident.address || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="dateofBirth"
          placeholder="Date of Birth"
          value={newResident.dateofBirth || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="placeofBirth"
          placeholder="Place of Birth"
          value={newResident.placeofBirth || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={newResident.age || ""}
          onChange={handleInputChange}
          required
        />
        <select
          name="sex"
          value={newResident.sex || ""}
          onChange={handleInputChange}
          required
        >
          <option value="" disabled>
            Select Sex
          </option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <input
          type="text"
          name="civilStatus"
          placeholder="Civil Status"
          value={newResident.civilStatus || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="occupation"
          placeholder="Occupation"
          value={newResident.occupation || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="contactNumber"
          placeholder="Contact Number"
          value={newResident.contactNumber || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="emailAddress"
          placeholder="Email"
          value={newResident.emailAddress || ""}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="precinctNumber"
          placeholder="Precinct Number"
          value={newResident.precinctNumber || ""}
          onChange={handleInputChange}
          required
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isVoter"
            checked={newResident.isVoter || false}
            onChange={(e) =>
              setNewResident({ ...newResident, isVoter: e.target.checked })
            }
          />
          Is Voter?
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Resident
        </button>
      </form>

      <h2>Resident Information</h2>
      <input
        type="text"
        placeholder="Search by name, address, or precinct number"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 w-full"
      />
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
