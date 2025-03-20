"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ViewFirstTimeJobSeeker() {
  const searchParams = useSearchParams();
  const jobSeekerId = searchParams.get("id");

  const [jobSeekerData, setJobSeekerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobSeekerId) return;

    const fetchJobSeeker = async () => {
      try {
        const docRef = doc(db, "JobSeekerList", jobSeekerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setJobSeekerData(docSnap.data());
        } else {
          console.error("Job seeker not found");
        }
      } catch (error) {
        console.error("Error fetching job seeker:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobSeeker();
  }, [jobSeekerId]);

  if (loading) return <p>Loading...</p>;
  if (!jobSeekerData) return <p>Job seeker not found</p>;

  const jobSeekerFields = [
    { label: "Date Applied", key: "dateApplied" },
    { label: "First Name", key: "firstName" },
    { label: "Middle Name", key: "middleName" },
    { label: "Last Name", key: "lastName" },
    { label: "Date of Birth", key: "dateOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Remarks", key: "remarks" },
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/FirstTimeJobSeeker";
  };

  return (
    <main className="viewresident-main-container">

      <div className="viewresident-page-title-section-1">
      <h1>First-Time Job Seeker List</h1>
      </div>
      <div className="viewresident-main-content">
        <div className="viewresident-section-1">
          <button onClick={handleBack}>
            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
          </button>
          <p>View First-Time Jobseeker</p>
        </div>

        {jobSeekerFields.map((field) => (
          <div className="viewresident-details-section" key={field.key}>
            <div className="viewresident-title">
              <p>{field.label}</p>
            </div>
            <div className="viewresident-description">
              <p>
                {typeof jobSeekerData[field.key] === "boolean"
                  ? jobSeekerData[field.key] ? "Yes" : "No"
                  : jobSeekerData[field.key] ?? "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
