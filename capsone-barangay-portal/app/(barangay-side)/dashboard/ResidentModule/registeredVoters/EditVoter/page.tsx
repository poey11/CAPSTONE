"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface VoterFormData {
  voterNumber: string;
  fullName: string;
  homeAddress: string;
  precinctNumber: string;

}

export default function EditVoter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voterId = searchParams.get("id"); 

  const [formData, setFormData] = useState<VoterFormData>({
    voterNumber: "",
    fullName: "",
    homeAddress: "",
    precinctNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!voterId) return;

    const fetchVoter = async () => {
      try {
        const docRef = doc(db, "VotersList", voterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            voterNumber: data.voterNumber || "",
            fullName: data.fullName || "",
            homeAddress: data.homeAddress || "",
            precinctNumber: data.precinctNumber || "",
          });
        } else {
          setError("Voter record not found.");
        }
      } catch (error) {
        console.error("Error fetching Voter:", error);
        setError("Failed to load data.");
      }
    };

    fetchVoter();
  }, [voterId]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!voterId) return;

    setLoading(true);
    setError("");

    try {
      const docRef = doc(db, "VotersList", voterId);
      await updateDoc(docRef, {
        voterNumber: formData.voterNumber,
        fullName: formData.fullName,
        homeAddress: formData.homeAddress,
        precinctNumber: formData.precinctNumber,
      });
      

      alert("Voter record updated successfully!");
      router.push("/dashboard/ResidentModule/registeredVoters");
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/registeredVoters";
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <Link href="/dashboard/ResidentModule/registeredVoters">
        <button type="button" className="back-button" onClick={handleBack}></button>
        </Link>
        <div className="section-1">
          <p className="NewResident">Edit Voter</p>
          <div className="actions">
            <button className="action-view" type="submit" form="editVoterForm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <form id="editVoterForm" onSubmit={handleSubmit} className="section-2">
          <div className="section-2-left-side">
            <p>Voter Number</p>
            <input type="text" name="voterNumber" value={formData.voterNumber} onChange={handleChange} disabled className="disabled-input" 
  />

            <p>Full Name</p>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />

            <p>Home Address</p>
            <input type="text" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />

            <p>Precinct Number</p>
            <input type="text" className="search-bar" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
