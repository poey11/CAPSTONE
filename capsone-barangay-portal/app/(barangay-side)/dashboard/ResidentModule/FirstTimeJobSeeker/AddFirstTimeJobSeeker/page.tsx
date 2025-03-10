"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function AddFirstTimeJobSeeker() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dateApplied: "", // YYYY-MM-DD format
    lastName: "",
    firstName: "",
    middleName: "",
    age: 0,
    dateOfBirth: "", // YYYY-MM-DD format from input
    monthOfBirth: "",
    dayOfBirth: "",
    yearOfBirth: "",
    sex: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Format Date of Birth into Separate Parts
  const formatDateParts = (dateString: string) => {
    if (!dateString) return { monthOfBirth: "", dayOfBirth: "", yearOfBirth: "" };

    const [year, month, day] = dateString.split("-");
    return { monthOfBirth: month, dayOfBirth: day, yearOfBirth: year };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Extract Month, Day, and Year from Date of Birth
      const { monthOfBirth, dayOfBirth, yearOfBirth } = formatDateParts(formData.dateOfBirth);

      // Ensure dateApplied is stored as YYYY-MM-DD in Firestore
      const formattedDateApplied = formData.dateApplied ? new Date(formData.dateApplied).toISOString().split("T")[0] : "";

      // Save to Firestore
      await addDoc(collection(db, "JobSeekerList"), {
        ...formData,
        monthOfBirth,
        dayOfBirth,
        yearOfBirth,
        dateApplied: formattedDateApplied, // Stored as YYYY-MM-DD
        createdAt: serverTimestamp(),
      });

      alert("Job Seeker added successfully!");
      router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
    } catch (err) {
      setError("Failed to add job seeker");
      console.error(err);
    }
    setLoading(false);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker">
          <button type="button" className="back-button" onClick={handleBack}></button>
        </Link>
        <div className="section-1">
          <p className="NewResident">New First-Time Job Seeker</p>
          <div className="actions">
            <button className="action-view" type="submit" form="addJobSeekerForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <form id="addJobSeekerForm" onSubmit={handleSubmit} className="section-2">
          <div className="section-2-left-side">
            <p>Last Name</p>
            <input type="text" className="search-bar" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />

            <p>First Name</p>
            <input type="text" className="search-bar" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />

            <p>Middle Name</p>
            <input type="text" className="search-bar" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} required />

            <p>Date Applied</p>
            <input type="date" className="search-bar" name="dateApplied" value={formData.dateApplied} onChange={handleChange} required />

            <p>Date of Birth</p>
            <input type="date" className="search-bar" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />

            <p>Age</p>
            <input type="number" className="search-bar" placeholder="Enter Age" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" />

            <p>Sex</p>
            <select name="sex" className="featuredStatus" value={formData.sex} onChange={handleChange} required>
              <option value="" disabled>Choose Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>

            <p>Remarks</p>
            <input type="text" className="search-bar" placeholder="Enter Remarks" name="remarks" value={formData.remarks} onChange={handleChange} />
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
