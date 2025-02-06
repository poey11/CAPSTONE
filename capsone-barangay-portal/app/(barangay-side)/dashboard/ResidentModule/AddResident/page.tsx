"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function AddResident() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    dateofBirth: "",
    age: "",
    sex: "",
    civilStatus: "",
    occupation: "",
    contactNumber: "",
    emailAddress: "",
    precinctNumber: "",
    placeofBirth: "",
    isVoter: false, // New boolean field
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
  
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "Residents"), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      alert("Resident added successfully!");
      router.push("/dashboard/ResidentModule");
    } catch (err) {
      setError("Failed to add resident");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <Link href="/dashboard/ResidentModule">
          <button type="button" className="back-button"></button>
        </Link>
        <div className="section-1">
          <p className="NewResident">New Resident</p>
          <div className="actions">
            <button className="action-view" type="submit" form="addResidentForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <form id="addResidentForm" onSubmit={handleSubmit} className="section-2">
          <div className="section-2-left-side">
            <p>Name</p>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />

            <p>Address</p>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required />

            <p>Place of Birth</p>
            <input type="text" name="placeofBirth" value={formData.placeofBirth} onChange={handleChange} required />

            <p>Date of Birth</p>
            <input type="date" name="dateofBirth" value={formData.dateofBirth} onChange={handleChange} required />

            <p>Age</p>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="1"
              max="120"
            />

            <p>Sex</p>
            <select name="sex" value={formData.sex} onChange={handleChange} required>
              <option value="" disabled>Choose Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <p>Civil Status</p>
            <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} required>
              <option value="" disabled>Choose Civil Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
              <option value="Separated">Separated</option>
            </select>

            <p>Occupation</p>
            <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} required />

            <p>Contact Number</p>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              pattern="[0-9]{11}"
              placeholder="Enter 11-digit phone number"
            />

            <p>Email Address</p>
            <input type="email" name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />

            <p>Precinct Number</p>
            <input type="text" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} required />

            <p>Voter</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="isVoter" checked={formData.isVoter} onChange={handleChange} />
                Is this resident a registered voter?
              </label>
            </div>

          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
