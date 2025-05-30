"use client"

import Link from "next/link";
import type { Metadata } from "next";
import React,{useState} from "react";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View In Barangay COOP Permit Request",
    description: "View In Barangay COOP Permit Request in Services Module",
  };


  
  const residentFields = [
    { key: "documentType", label: "Document Type" },
    { key: "purpose", label: "Purpose" },
    { key: "daterequested", label: "Date Requested" },
    { key: "firstname", label: "First Name" },
    { key: "middlename", label: "Middle Name" },
    { key: "lastname", label: "Last Name" },
    { key: "address", label: "Home Address" },
    { key: "businessactivity", label: "Business Activity" },
    { key: "businessname", label: "Business Name" },
    { key: "businesslocation", label: "Business Location" },
    { key: "businessnature", label: "Nature of Business" },
    { key: "estimatedcapital", label: "Estimated Capital" },
    { key: "contact", label: "Contact" },
    { key: "status", label: "Status" },
    { key: "requirements", label: "Requirements" },
];

export default function ViewInBarangayRequest() {
    const requestData = [
        {
            documentType: "Barangay Permit",
            purpose: "COOP",
            daterequested: "2024-01-17",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            address: "Calamba, Laguna",
            businessactivity: "Renewal",
            businessname: "Jennie's Salon",
            businesslocation: "Calamba, Laguna",
            businessnature: "Salon",
            estimatedcapital: "1000000",
            contact: "09171218101",
            status: "In Progress",
            requirements: "/Images/document.png",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/InBarangayRequests";
    };

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    
    const handlePrintClick = async () => {
        const documentType = residentData.documentType || "Document";
        setPopupMessage(`${documentType} printed successfully!`);
        setShowPopup(true);
        
        // Hide the popup after 3 seconds
        setTimeout(() => {
            setShowPopup(false);
        }, 3000);
    };

    return (
        <main className="main-container">
            <div className="main-content">
                <div className="section-1">
                  <div className="left-section">
                    <Link href="/dashboard/ServicesModule/InBarangayRequests">
                        <button type="button" className="back-button" onClick={handleBack}></button>
                    </Link>
                    <p>In Barangay Request Details</p>
                  </div>
                  <div className="right-section">
                      <span className={`status-badge ${residentData.status.toLowerCase().replace(" ", "-")}`}>
                          {residentData.status ?? "N/A"}
                      </span>
                  </div>
                    
                </div>

                {residentFields.map((field) => (
                    <div className="details-section" key={field.key}>
                        <div className="title">
                            <p>{field.label}</p>
                        </div>
                        <div className="description">
                            {/* For 'requirements' field, check if it's an image path */}
                            {field.key === "requirements" ? (
                                <img src={residentData[field.key] ?? ""} alt="Requirement" className="requirement-image" />
                            ) : (
                                <p>{residentData[field.key] ?? "N/A"}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="Actions-Section">
                    <button type="button" className="actions-button" onClick={handlePrintClick}>Print</button>
            </div>

            {showPopup && (
                <div className={`popup-overlay show`}>
                    <div className="popup">
                        <p>{popupMessage}</p>
                    </div>
                </div>
            )}
        </main>
    );
}