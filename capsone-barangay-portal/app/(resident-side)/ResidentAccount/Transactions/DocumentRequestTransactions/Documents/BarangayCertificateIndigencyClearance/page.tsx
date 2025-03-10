"use client"
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IncidentTransactionsDetails() {

    const searchParams = useSearchParams();
    const detailsFromQuery = searchParams.get("details") || ""; 
    const purposeFromQuery = searchParams.get("purpose") || ""; 
  
 

  const [transactionData] = useState([
    {
      Date: "05-10-2024",
      ReferenceId: "2001",
      Type: "Document Request",
      Status: "Resolved",
      Details: detailsFromQuery,
      Purpose: purposeFromQuery,
      FirstName: "Jennie",
      MiddleName: "Ruby",
      LastName: "Kim",
      DateOfResidency: "07-24-2002",
      Address: "Sampaguita St.",
      Birthday: "08-24-2002",
      Age: "22",
      Gender: "Female",
      CivilStatus: "Single",
      ContactNumber: "09171231234",
      Citizenship: "Filipino",
      Requirements: "/Images/document.png"
    },
  ]);

  const incidentFields = [
    { label: "Date of Request", key: "Date" },
    { label: "ID", key: "ReferenceId" },
    { label: "Type", key: "Type" },
    { label: "Status", key: "Status" },
    { label: "Details", key: "Details" },
    { label: "Purpose", key: "Purpose" },
    { label: "First Name", key: "FirstName" },
    { label: "Middle Name", key: "MiddleName" },
    { label: "Last Name", key: "LastName" },
    { label: "Date of Residency", key: "DateOfResidency" },
    { label: "Address", key: "Address" },
    { label: "Birthday", key: "Birthday" },
    { label: "Age", key: "Age" },
    { label: "Gender", key: "Gender" },
    { label: "Civil Status", key: "CivilStatus" },
    { label: "Contact Number", key: "ContactNumber" },
    { label: "Citizenship", key: "Citizenship" },
  ];

  const router = useRouter();

  const handleBack = () => {
    router.push("/ResidentAccount/Transactions");
  };

  return (
    <main className="incident-transaction-container">

            <div className="Page">
                <p>TRANSACTIONS</p>
            </div>

      <div className="incident-content">
        <div className="incident-content-section-1">
          <button type="button" className="back-button" onClick={handleBack}></button>
          <p>Online Incident Report Details</p>
        </div>

            {incidentFields.map((field) => (
            <div className="details-section" key={field.key}>
              <div className="title">
                <p>{field.label}</p>
              </div>
              <div className="description">
                <p>{transactionData[0][field.key as keyof typeof transactionData[0]]}</p>
              </div>
            </div>
          ))}

          
          <div className="details-section">
            <div className="title">
              <p>Requirements</p>
            </div>
            <div className="description">
              <img
                src={transactionData[0].Requirements}
                alt="Requirements"
                className="Requirements"
              />
            </div>
          </div>

      </div>

    
    </main>
  );
}

