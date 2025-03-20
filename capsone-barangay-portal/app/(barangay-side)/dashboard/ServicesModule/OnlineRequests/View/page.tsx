"use client"

import Link from "next/link";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View Online Barangay Certificate Request",
    description: "View Online Barangay Certificate Request in Services Module",
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
    const requestData = {
        documentType: "Barangay Certificate",
        purpose: "Certificate of Residency",
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
        status: "Pending",
        requirements: "/Images/document.png",
    };

    const residentData = requestData as Record<string, string>;
    const [status, setStatus] = useState(requestData.status.toLowerCase().replace(" ", "-"));

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value.toLowerCase().replace(" ", "-"));
    };

    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests";
    };

    const handleviewappointmentdetails = () => {
        window.location.href = "/dashboard/ServicesModule/Appointments/View";
    };

    const handlerejection = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests/ReasonForReject";
    };

    const handleSMS = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
    };

    return (
        <main className="viewonlinereq-main-container">

            <div className="viewonlinereq-page-title-section-1">
                <h1>Online Document Requests</h1>
            </div>

            <div className="viewonlinereq-actions-content">
                <div className="viewonlinereq-actions-content-section1">
                    <button type="button" className="actions-button-reject" onClick ={handlerejection}>Reject</button>
                    <button type="button" className="actions-button">Print</button>
                    <button type="button" className="actions-button" onClick ={handleviewappointmentdetails}>View Appointment Details</button>

                    {/* Dropdown with dynamic class */}
                    <select
                        id="status"
                        className={`status-dropdown-viewonlinereq ${status}`}
                        name="status"
                        value={status}
                        onChange={handleStatusChange}
                    >
                        <option value="pick-up">Pick-up</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                    </select>

                </div>
                
                <div className="viewonlinereq-actions-content-section2">
                    {status === "pick-up" && (
                        <button type="button" className="actions-button" onClick={handleSMS}>SMS</button>
                    )}
                </div>
            </div>

            <div className="viewonlinereq-main-content">
                <div className="viewonlinereq-section-1">
                  <div className="viewonlinereq-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1>Online Request Details</h1>
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
        </main>
    );
}