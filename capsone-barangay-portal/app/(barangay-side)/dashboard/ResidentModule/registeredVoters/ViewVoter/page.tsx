"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ViewVoter() {
  const searchParams = useSearchParams();
  const voterId = searchParams.get("id");

  const [voterData, setVoterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!voterId) return;

    const fetchVoter = async () => {
      try {
        const docRef = doc(db, "VotersList", voterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVoterData(docSnap.data());
        } else {
          console.error("Voter not found");
        }
      } catch (error) {
        console.error("Error fetching voter:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoter();
  }, [voterId]);

  if (loading) return <p>Loading...</p>;
  if (!voterData) return <p>Voter not found</p>;

  const voterFields = [
    { label: "Voter Number", key: "voterNumber" },
    { label: "Full Name", key: "fullName" },
    { label: "Home Address", key: "homeAddress" },
    { label: "Precinct Number", key: "precinctNumber" },
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/registeredVoters";
  };

  return (
    <main className="viewresident-main-container">

      <div className="viewresident-page-title-section-1">
        <h1>View Voter Details</h1>
      </div>

      <div className="viewresident-main-content">
        <div className="viewresident-section-1">
          <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>
          <p>Voter Details</p>
        </div>

        {voterFields.map((field) => (
          <div className="viewresident-details-section" key={field.key}>
            <div className="viewresident-title">
              <p>{field.label}</p>
            </div>
            <div className="viewresident-description">
            <p>{voterData[field.key] || "N/A"}</p>  
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
