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
    { label: "Created At", key: "createdAt"}
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/registeredVoters";
  };

  return (
    <main className="viewresident-main-container">
      <div className="path-section">
          <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
          <h1 className="breadcrumb">
            <Link href="/dashboard/ResidentModule/registeredVoters">Registered Voters</Link>
            <span className="chevron">/</span>
          </h1>
          <h2 className="breadcrumb">View Voter Details<span className="chevron"></span></h2>
        </div>

      <div className="viewresident-page-title-section-1">
      <h1>Registered Voters</h1>
      </div>

      <div className="viewresident-main-content">
        <div className="viewresident-section-1-header">
          <button onClick={handleBack}>
            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
          </button>
          <p>View Voter</p>
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
