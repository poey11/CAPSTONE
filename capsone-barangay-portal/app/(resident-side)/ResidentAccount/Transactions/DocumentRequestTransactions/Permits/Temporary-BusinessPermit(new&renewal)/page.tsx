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
      BusinessName: "Jennie's Bakeshop",
      HomeAddress: "Sampaguita St.",
      BusinessActivity: "New",
      BusinessLocation: "Timesquare",
      NatureOfBusiness: "Bakery",
      EstimatedCapital: "500000",
      ContactNumber: "09171231234",
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
    { label: "Business Name", key: "BusinessName" },
    { label: "Home Address", key: "HomeAddress" },
    { label: "Business Activity", key: "BusinessActivity" },
    { label: "Business Location", key: "BusinessLocation" },
    { label: "Nature of Business", key: "NatureOfBusiness" },
    { label: "Estimated Capital", key: "EstimatedCapital" },
    { label: "Contact Number", key: "ContactNumber" },
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

