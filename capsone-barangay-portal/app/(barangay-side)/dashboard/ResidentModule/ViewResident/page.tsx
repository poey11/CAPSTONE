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
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Middle Name", key: "middleName" },
    { label: "Address", key: "address" },
    { label: "Date of Birth", key: "dateOfBirth" },
    { label: "Place of Birth", key: "placeOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Occupation", key: "occupation" },
    { label: "Employer", key: "employer" },
    { label: "Employer Address", key: "employerAddress" },
    { label: "Contact Number", key: "contactNumber" },
    { label: "Email Address", key: "emailAddress" },
    { label: "Precinct Number", key: "precinctNumber" },
    { label: "Voter", key: "isVoter" }
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule";
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <div className="section-1">
          <Link href="/dashboard/ResidentModule">
          <button type="button" className="back-button" onClick={handleBack}></button>;
          </Link>
          <p>Resident Details</p>
        </div>

        {residentFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{residentData[field.key] ?? "N/A"}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
