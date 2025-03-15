"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ViewResident() {
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");

  const [residentData, setResidentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!residentId) return;

    const fetchResident = async () => {
      try {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setResidentData(docSnap.data());
        } else {
          console.error("Resident not found");
        }
      } catch (error) {
        console.error("Error fetching resident:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResident();
  }, [residentId]);

  if (loading) return <p>Loading...</p>;
  if (!residentData) return <p>Resident not found</p>;

  const residentFields = [
    { label: "Resident Number", key: "residentNumber" },
    { label: "Full Name", key: "name" },
    { label: "Home Address", key: "address" },
    { label: "Date of Birth", key: "dateOfBirth" },
    { label: "Place of Birth", key: "placeOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Occupation", key: "occupation" },
    { label: "Contact Number", key: "contactNumber" },
    { label: "Email Address", key: "emailAddress" },
    { label: "Precinct Number", key: "precinctNumber" },
    { label: "General Location", key: "generalLocation" },
    { label: "Student", key: "isStudent", isBoolean: true },
    { label: "PWD", key: "isPWD", isBoolean: true },
    { label: "Senior Citizen", key: "isSeniorCitizen", isBoolean: true },
    { label: "Solo Parent", key: "isSoloParent", isBoolean: true },
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule";
  };

  return (
    <main className="viewresident-main-container">

        <div className="viewresident-page-title-section-1">
          <h1>View Resident Details</h1>
        </div>

      <div className="viewresident-main-content">
        <div className="viewresident-section-1">
          <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>
          <p>Resident Details</p>
        </div>

        {residentFields.map((field) => (
          <div className="viewresident-details-section" key={field.key}>
            <div className="viewresident-title">
              <p>{field.label}</p>
            </div>
            <div className={`viewresident-description ${field.key === "residentNumber" ? "disabled-field" : ""}`}>
              <p>
                {field.isBoolean !== undefined
                  ? residentData[field.key] ? "Yes" : "No"
                  : residentData[field.key] ?? "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
