"use client"

import Link from "next/link";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "View Barangay Indigency Appointment Details",
    description: "View Barangay Indigency Appointment Details in Services Module",
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
    const requestData = [
        {
            appointmentType: "Barangay Indigency",
            purpose: "No Income",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            contact: "09171218101",
            status: "Completed",
            date: "2024-01-17",
            time: "09:00 AM",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/Appointments";
    };

    const handleviewdocumentdetails = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests/View/BarangayIndigency";
    };

    return (
        <main className="main-container">
            <div className="main-content">
                <div className="section-1">
                  <div className="left-section">
                    <Link href="/dashboard/ServicesModule/Appointments">
                        <button type="button" className="back-button" onClick={handleBack}></button>
                    </Link>
                    <p>Barangay Indigency Appointment Details</p>
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
                <button type="button" className="actions-button" onClick={handleviewdocumentdetails}>View Document Request Details</button>
            </div>
        </main>
    );
}