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
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/kasambahayList";
  };

  return (
    <main className="main-container">
      <div className="main-content">
        <div className="section-1">
          <Link href="/dashboard/ResidentModule/kasambahayList">
            <button type="button" className="back-button" onClick={handleBack}></button>;
          </Link>
          <p>Kasambahay Details</p>
        </div>

        {kasambahayFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>
                {field.isBoolean !== undefined
                  ? kasambahayData[field.key] ? "Yes" : "No"
                  : kasambahayData[field.key] ?? "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
