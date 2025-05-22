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

  const educationalAttainmentMap: Record<number, string> = {
    1: "Elem Under Grad",
    2: "Elem Grad",
    3: "HS Grad",
    4: "HS Under Grad",
    5: "COL Grad",
    6: "COL Under Grad",
    7: "Educational",
    8: "Vocational",
  };

  const natureOfWorkMap: Record<number, string> = {
    1: "Gen. House Help (All Around)",
    2: "YAYA",
    3: "COOK",
    4: "Gardener",
    5: "Laundry Person",
    6: "Others",
  };

  const employeeArrangementMap: Record<number, string> = {
    1: "Live - IN",
    2: "Live - OUT",
  };

  const rangeOfSalaryMap: Record<number, string> = {
    1: "₱1,500 - ₱1,999",
    2: "₱2,000 - ₱2,499",
    3: "₱2,500 - ₱4,999",
    4: "₱5,000 and Above",
  };

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
      

      <div className="view-resident-main-content">
        

      </div>
    </main>
  );
}
