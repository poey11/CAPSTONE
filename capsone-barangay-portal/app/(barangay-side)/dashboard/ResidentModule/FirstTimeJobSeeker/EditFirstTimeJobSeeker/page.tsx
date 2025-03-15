"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface JobSeeker {
  dateApplied: string;
  lastName: string;
  firstName: string;
  middleName: string;
  age: number;
  dateOfBirth: string;
  sex: string;
  remarks: string;
}

export default function EditFirstTimeJobSeeker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [formData, setFormData] = useState<JobSeeker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchJobSeeker = async () => {
      try {
        const docRef = doc(db, "JobSeekerList", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data() as JobSeeker);
        } else {
          setError("Job seeker not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch job seeker data");
      }
    };

    fetchJobSeeker();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => prevData ? { ...prevData, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !formData) return;

    setLoading(true);
    try {
      const docRef = doc(db, "JobSeekerList", id);
      await updateDoc(docRef, { ...formData } as Partial<JobSeeker>);
      alert("Job Seeker updated successfully!");
      router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
    } catch (err) {
      console.error(err);
      setError("Failed to update job seeker");
    }
    setLoading(false);
  };

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
          <p className="NewResident">Edit First-Time Job Seeker</p>
          <div className="actions">
            <button className="action-view" type="submit" form="editJobSeekerForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {formData ? (
          <form id="editJobSeekerForm" onSubmit={handleSubmit} className="section-2">
            <div className="section-2-left-side">
              <p>Last Name</p>
              <input type="text" className="search-bar" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />

              <p>First Name</p>
              <input type="text" className="search-bar" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />

              <p>Middle Name</p>
              <input type="text" className="search-bar" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} required />

              <p>Date Applied(Cannot be changed)</p>
              <input type="date" className="search-bar" name="dateApplied" value={formData.dateApplied} onChange={handleChange} disabled  />

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
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </main>
  );
}