"use client"

import Link from "next/link";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View Online Barangay Indigency Request",
    description: "View Online Barangay Indigency Request in Services Module",
  };


  
  const residentFields = [
    { key: "documentType", label: "Document Type" },
    { key: "purpose", label: "Purpose" },
    { key: "daterequested", label: "Date Requested" },
    { key: "residentsince", label: "Resident Since" },
    { key: "firstname", label: "First Name" },
    { key: "middlename", label: "Middle Name" },
    { key: "lastname", label: "Last Name" },
    { key: "address", label: "Address" },
    { key: "age", label: "Age" },
    { key: "civilstatus", label: "Civil Status" },
    { key: "citizenship", label: "Citizenship" },
    { key: "birthday", label: "Birthday" },
    { key: "gender", label: "Gender" },
    { key: "contact", label: "Contact" },
    { key: "status", label: "Status" },
    { key: "requirements", label: "Requirements" },
];

export default function ViewOnlineRequest() {
    const requestData = [
        {
            documentType: "Barangay Indigency",
            purpose: "No Income",
            daterequested: "January 17, 2024",
            residentsince: "January 14, 2002",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            address: "Calamba, Laguna",
            age: "23",
            civilstatus: "Single",
            citizenship: "Filipino",
            birthday: "September 6, 2002",
            gender: "Female",
            contact: "09171218101",
            status: "Pick Up",
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

            <div className="Actions-Section">
                    <button type="button" className="actions-button">Print</button>
            </div>
        </main>
    );
}