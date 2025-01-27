"use client"
import React, { useState, useEffect } from "react";
import {db} from "../../../db/firebase";
import {collection, addDoc, getDocs} from "firebase/firestore";



interface Resident {
  id?: string;
  name: string;
  address: string;
  dateOfBirth: string;
  placeOfBirth: string;
  age: number;
  sex: string;
  civilStatus: string;
  occupation: string;
  contactNumber: string;
  email: string;
  precinctNumber: string;
}

const residentManagement = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [newResident, setNewResident] = useState<Partial<Resident>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  // fetch from firestore db
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentCollection = collection(db, "Residents");
        const residentSnapshot = await getDocs(residentCollection);
        const residentData: Resident[] = residentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Resident[];
        setResidents(residentData);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };
    fetchResidents();
  }, []);

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewResident({ ...newResident, [e.target.name]: e.target.value });
  };

  // add new resident
  const addResident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const residentCollection = collection(db, "Residents");
      await addDoc(residentCollection, newResident);
      setResidents((prev) => [...prev, { ...newResident } as Resident]);
      setNewResident({});
    } catch (error) {
      console.error("Error adding resident:", error);
    }
  };

  // to filter residents based on search
  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resident.precinctNumber.includes(searchQuery)
  );

  return (
    <div>
      <h1>Resident Management Module</h1>
      <h2>Resident Registration</h2>
      <form className="flex flex-col gap-2" onSubmit={addResident}>
        <input type="text" name="name" placeholder="Name" value={newResident.name || ""} onChange={handleInputChange} required />
        <input type="text" name="address" placeholder="Address" value={newResident.address || ""} onChange={handleInputChange} required />
        <input type="date" name="dateOfBirth" value={newResident.dateOfBirth || ""} onChange={handleInputChange} required />
        <input type="text" name="placeOfBirth" placeholder="Place of Birth" value={newResident.placeOfBirth || ""} onChange={handleInputChange} required />
        <input type="number" name="age" placeholder="Age" value={newResident.age || ""} onChange={handleInputChange} required />
        <select name="sex" value={newResident.sex || ""} onChange={handleInputChange} required>
          <option value="" disabled>Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <input type="text" name="civilStatus" placeholder="Civil Status" value={newResident.civilStatus || ""} onChange={handleInputChange} required />
        <input type="text" name="occupation" placeholder="Occupation" value={newResident.occupation || ""} onChange={handleInputChange} required />
        <input type="text" name="contactNumber" placeholder="Contact Number" value={newResident.contactNumber || ""} onChange={handleInputChange} required />
        <input type="email" name="email" placeholder="Email" value={newResident.email || ""} onChange={handleInputChange} required />
        <input type="text" name="precinctNumber" placeholder="Precinct Number" value={newResident.precinctNumber || ""} onChange={handleInputChange} required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Resident</button>
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
                <td className="border border-gray-300 p-2">{resident.dateOfBirth}</td>
                <td className="border border-gray-300 p-2">{resident.placeOfBirth}</td>
                <td className="border border-gray-300 p-2">{resident.age}</td>
                <td className="border border-gray-300 p-2">{resident.sex}</td>
                <td className="border border-gray-300 p-2">{resident.civilStatus}</td>
                <td className="border border-gray-300 p-2">{resident.occupation}</td>
                <td className="border border-gray-300 p-2">{resident.contactNumber}</td>
                <td className="border border-gray-300 p-2">{resident.email}</td>
                <td className="border border-gray-300 p-2">{resident.precinctNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default residentManagement;
