"use client"

import Link from "next/link";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View Online Temporary Business Permit Request",
    description: "View Online Temporary Business Permit Request in Services Module",
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

export default function ViewOnlineRequest() {
    const requestData = [
        {
            documentType: "Barangay Permit",
            purpose: "Temporary Business Permit",
            daterequested: "January 17, 2024",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            address: "Calamba, Laguna",
            businessactivity: "Renewal",
            businessname: "Jennie's Salon",
            businesslocation: "Calamba, Laguna",
            businessnature: "Salon",
            estimatedcapital: "1,000,000.00",
            contact: "09171218101",
            status: "Pending",
            requirements: "/Images/document.png",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests";
    };

    return (
        <main className="main-container">
            <div className="main-content">
                <div className="section-1">
                  <div className="left-section">
                    <Link href="/dashboard/ServicesModule/OnlineRequests">
                        <button type="button" className="back-button" onClick={handleBack}></button>
                    </Link>
                    <p>Online Request Details</p>
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
        </main>
    );
}