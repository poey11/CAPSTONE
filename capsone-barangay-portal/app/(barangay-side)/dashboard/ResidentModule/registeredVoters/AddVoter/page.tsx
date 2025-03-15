"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function addVoter() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    voterNumber: "",
    fullName: "",
    homeAddress: "",
    precinctNumber: "",
    createdAt:"",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLatestNumber = async () => {
      try {
        const voterCollection = collection(db, "VotersList");
        const q = query(voterCollection, orderBy("voterNumber", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        let newNumber = 1;
        if (!querySnapshot.empty) {
          const latestEntry = querySnapshot.docs[0].data();
          newNumber = latestEntry.voterNumber + 1;
        }

        setFormData((prevData) => ({
          ...prevData,
          voterNumber: newNumber.toString(),
        }));
      } catch (error) {
        console.error("Error fetching latest voter number:", error);
      }
    };

    fetchLatestNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ensure the latest voter number is assigned
      const voterCollection = collection(db, "VotersList");
      const q = query(voterCollection, orderBy("voterNumber", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let latestNumber = 1;
      if (!querySnapshot.empty) {
        const latestEntry = querySnapshot.docs[0].data();
        latestNumber = latestEntry.voterNumber + 1;
      }

      const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format


      await addDoc(voterCollection, {
        ...formData,
        voterNumber: latestNumber,
        createdAt: currentDate,
      });

      alert("Voter added successfully!");
      router.push("/dashboard/ResidentModule/registeredVoters");
    } catch (err) {
      setError("Failed to add voter");
      console.error(err);
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.push("/dashboard/ResidentModule/registeredVoters");
  };

  return (
    <main className="add-resident-main-container">

        <div className="addresident-page-title-section-1">
          <h1>Add New Voter</h1>
        </div>
      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> New Voter </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view" type="submit" form="addVoterForm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            
          </div>

          <hr/>


        <form id="addVoterForm" onSubmit={handleSubmit} className="add-resident-section-2">
          <div className="add-resident-section-2-left-side">

            <div className="fields-container">
              <div className="fields-section">
                <p>Full Name</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Home Address</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Address" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />
              </div>
              
              <div className="fields-section">
                <p>Precinct Number</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
              </div>
            </div>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
