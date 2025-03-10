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
    <main className="main-container">
      <div className="main-content">
        <div className="section-1">
          <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker">
            <button type="button" className="back-button" onClick={handleBack}></button>
          </Link>
          <p>First-Time Job Seeker Details</p>
        </div>

        {jobSeekerFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
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
