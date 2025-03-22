"use client"

import Link from "next/link";
import type { Metadata } from "next";
import React,{useState} from "react";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View Appointment Details",
    description: "View  Appointment Details in Services Module",
  };


  
  const residentFields = [
    { key: "appointmentType", label: "Appointment Type" },
    { key: "purpose", label: "Purpose" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "firstname", label: "First Name" },
    { key: "middlename", label: "Middle Name" },
    { key: "lastname", label: "Last Name" },
    { key: "contact", label: "Contact" },
    { key: "status", label: "Status" },
];

export default function EditAppointment() {
    const requestData = {
            appointmentType: "Barangay Indigency",
            purpose: "No Income",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            contact: "09171218101",
            status: "Completed",
            date: "2024-01-17",
            time: "09:00 AM",
};

    const residentData = requestData as Record<string, string>;
    const [status, setStatus] = useState(requestData.status.toLowerCase().replace(" ", "-"));

    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/Appointments";
    };

    const handleviewdocumentdetails = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests/ViewRequest";
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setStatus(e.target.value.toLowerCase().replace(" ", "-"));
        };

    return (
        <main className="viewonlinereq-main-container">

            <div className="viewonlinereq-page-title-section-1">
                <h1>Appointments</h1>
            </div>

            <div className="viewonlinereq-actions-content">
                <div className="viewonlinereq-actions-content-section1">

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

                                <h1>Appointment Details</h1>
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
                                <img src={residentData[field.key] ?? ""} alt="Requirement" className="requirement-image" />
                            ) : (
                                <p>{residentData[field.key] ?? "N/A"}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

{/*
            <div className="Actions-Section">
                <button type="button" className="actions-button" onClick={handleviewdocumentdetails}>View Document Request Details</button>
            </div>
*/}
        </main>
    );
}