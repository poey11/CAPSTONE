"use client"

import Link from "next/link";
import type { Metadata } from "next";
import React,{useState} from "react";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View In Barangay  Request",
    description: "View In Barangay  Request in Services Module",
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

export default function ViewInBarangayRequest() {
    const requestData = {
            documentType: "Barangay Certificate",
            purpose: "Death Residency",
            date: "January 17, 2024",
            residentsince: "January 14, 2002",
            firstname: "Rose",
            middlename: "Yap",
            lastname: "Fernandez",
            address: "Calamba, Laguna",
            age: "23",
            civilstatus: "Single",
            citizenship: "Filipino",
            birthday: "September 6, 2002",
            gender: "Female",
            contact: "09171218101",
            status: "In Progress",
            requirements: "/Images/document.png",
};

    const residentData = requestData as Record<string, string>;
    const [status, setStatus] = useState(requestData.status.toLowerCase().replace(" ", "-"));

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value.toLowerCase().replace(" ", "-"));
    };

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
        <main className="viewonlinereq-main-container">

            <div className="viewonlinereq-page-title-section-1">
                <h1>In Barangay Document Requests</h1>
            </div>

            <div className="viewonlinereq-actions-content">
                <div className="viewonlinereq-actions-content-section1">
                    
                    <button type="button" className="actions-button">Print</button>

                    {/* Dropdown with dynamic class */}
                    <select
                        id="status"
                        className={`status-dropdown-viewonlinereq ${status}`}
                        name="status"
                        value={status}
                        onChange={handleStatusChange}
                    >
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                </div>
            </div>

            <div className="viewonlinereq-main-content">

                <div className="viewonlinereq-section-1">
                  <div className="viewonlinereq-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1>In Barangay Request Details</h1>
                  </div>
                    
                </div>

                {residentFields.map((field) => (
                    <div className="viewonlinereq-details-section" key={field.key}>
                        <div className="viewonlinereq-title">
                            <p>{field.label}</p>
                        </div>
                        <div className="viewonlinereq-description">
                            {/* For 'requirements' field, check if it's an image path */}
                            {field.key === "requirements" ? (
                                <div className="resident-id-container">
                                <img 
                                    src={residentData[field.key] ?? ""} 
                                    alt="Requirement" 
                                    className="resident-id-image" 
                                />
                                <a
                                href={residentData[field.key]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-image-link"
                                >
                                    View Image
                                </a>
                            </div>
                            ) : (
                                <p>{residentData[field.key] ?? "N/A"}</p>
                            )}
                        </div>
                    </div>
                ))}
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