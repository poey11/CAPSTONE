"use client"
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IncidentTransactionsDetails() {
  const searchParams = useSearchParams();
  const Date = searchParams.get("Date");
  const ReferenceId = searchParams.get("ReferenceId");
  const Type = searchParams.get("Type");
  const Details = searchParams.get("Details");
  const Status = searchParams.get("Status");

  const [transactionData] = useState([
    {
      Date: "05-10-2024",
      ReferenceId: "2001",
      Type: "Incident",
      Details: "Broken Lamp Post",
      AddressOfIncident: "Pipestone Street South Fairview",
      Status: "Resolved",
      FirstName: "Malcolm",
      LastName: "Payao",
    },
  ]);

  const incidentFields = [
    { label: "Date Of Incident", key: "Date" },
    { label: "ID", key: "ReferenceId" },
    { label: "FirstName", key: "FirstName" },
    { label: "LastName", key: "LastName" },
    { label: "Type", key: "Type" },
    { label: "Details", key: "Details" },
    { label: "Location", key: "AddressOfIncident" },
    { label: "Status", key: "Status" },
  ];

  const router = useRouter();

  const handleBack = () => {
    router.back();
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
      </div>

    
    </main>
  );
}
