"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ViewKasambahay() {
  const searchParams = useSearchParams();
  const kasambahayId = searchParams.get("id");

  const [kasambahayData, setKasambahayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kasambahayId) return;

    const fetchKasambahay = async () => {
      try {
        const docRef = doc(db, "KasambahayList", kasambahayId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setKasambahayData(docSnap.data());
        } else {
          console.error("Kasambahay not found");
        }
      } catch (error) {
        console.error("Error fetching kasambahay:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKasambahay();
  }, [kasambahayId]);

  if (loading) return <p>Loading...</p>;
  if (!kasambahayData) return <p>Kasambahay not found</p>;

  const kasambahayFields = [
    { label: "Registration Control Number", key: "registrationControlNumber" },
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Middle Name", key: "middleName" },
    { label: "Home Address", key: "homeAddress" },
    { label: "Date of Birth", key: "dateOfBirth" },
    { label: "Place of Birth", key: "placeOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Educational Attainment", key: "educationalAttainment" },
    { label: "Nature of Work", key: "natureOfWork" },
    { label: "Employment Arrangement", key: "employmentArrangement" },
    { label: "Salary Range", key: "salary" },
    { label: "SSS Member", key: "sssMember", isBoolean: true },
    { label: "PhilHealth Member", key: "philhealthMember", isBoolean: true },
    { label: "Pag-IBIG Member", key: "pagibigMember", isBoolean: true },
    { label: "Employer Name", key: "employerName" },
    { label: "Employer Address", key: "employerAddress" },
    { label: "Created By", key: "createdBy" },
    { label: "Updated By", key: "updatedBy" },
    { label: "Created At", key: "createdAt"},
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/kasambahayList";
  };

  return (
    <main className="viewresident-main-container">
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/kasambahayList">Kasambahay Masterlist</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">View Kasambahay Details<span className="chevron"></span></h2>
      </div>

      <div className="viewresident-page-title-section-1">
        <h1>Kasambahay Masterlist</h1>
      </div>

      <div className="viewresident-main-content">
        <div className="viewresident-section-1-header">
          <button onClick={handleBack}>
            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
          </button>
          <p>View Kasambahay </p>
        </div>

        {kasambahayFields.map((field) => (
          <div className="viewresident-details-section" key={field.key}>
            <div className="viewresident-title">
              <p>{field.label}</p>
            </div>
            <div className="viewresident-description">
              <p>
                {field.isBoolean !== undefined
                  ? kasambahayData[field.key] ? "Yes" : "No"
                  : kasambahayData[field.key] ?? "N/A"}
              </p>
            </div>
          </div>
        ))}
        {/* Display Valid ID */}
        <div className="viewresident-details-section">
          <div className="viewresident-title">
            <p>Valid ID</p>
          </div>
          <div className="viewresident-description">
            {kasambahayData.fileURL ? (
              <div className="resident-id-container">
                <img
                  src={kasambahayData.fileURL}
                  alt="Resident's Valid ID"
                  className="resident-id-image"
                />
                <a
                  href={kasambahayData.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-image-link"
                >
                  View Image
                </a>
              </div>
            ) : (
              <p>No ID uploaded</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
