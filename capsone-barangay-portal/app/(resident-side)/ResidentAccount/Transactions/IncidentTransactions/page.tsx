"use client"
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentRequestTransactionsDetails() {
 

  const [transactionData] = useState([
    {
      Date: "05-10-2024",
      ReferenceId: "2001",
      Type: "Online Incident",
      Details: "Broken Lamp Post",
      AddressOfIncident: "Pipestone Street South Fairview",
      Status: "Resolved",
      FirstName: "Malcolm",
      LastName: "Payao",
      ProofOfIncident: "/Images/document.png"
    },
  ]);

  const incidentFields = [
    { label: "Date of Incident", key: "Date" },
    { label: "ID", key: "ReferenceId" },
    { label: "First Name", key: "FirstName" },
    { label: "Last Name", key: "LastName" },
    { label: "Type", key: "Type" },
    { label: "Concern", key: "Details" },
    { label: "Location", key: "AddressOfIncident" },
    { label: "Status", key: "Status" },
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
              <p>Proof of Incident</p>
            </div>
            <div className="description">
              <img
                src={transactionData[0].ProofOfIncident}
                alt="Proof of Incident"
                className="proofOfIncident-image"
              />
            </div>
          </div>

      </div>

    
    </main>
  );
}
