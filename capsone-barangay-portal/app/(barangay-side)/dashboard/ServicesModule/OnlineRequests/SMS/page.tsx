"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/SMSOnlineRequest.css";


const metadata: Metadata = {
    title: "SMS Online Request",
    description: "In Barangay Request in Services Module",
};


export default function OnlineRequests() {
    const router = useRouter();

    const handleBackToOnlineRequests = () => {
        router.push("/dashboard/ServicesModule/OnlineRequests");
    };

    const requestData = [
        {
            documentType: "Barangay Certificate",
            purpose: "Death Residency",
            daterequested: "2024-01-17",
            residentsince: "2002-01-14",
            firstname: "Rose",
            middlename: "Yap",
            lastname: "Fernandez",
            address: "Calamba, Laguna",
            age: "23",
            civilstatus: "Single",
            citizenship: "Filipino",
            birthday: "2002-09-06",
            gender: "Female",
            contact: "09171218101",
            status: "Pick Up",
            requirements: "/Images/document.png",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    // Combine first, middle, and last names into one field
    const fullName = `${residentData.firstname} ${residentData.middlename} ${residentData.lastname}`.trim();

    
    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
                <h1>Online Document Requests</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBackToOnlineRequests}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>
                        <h1>Send SMS</h1>
                    </div>

                </div>

                <hr />

                <div className="main-fields-container">
                    <div className="section-left-container">

                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Document Requested</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        defaultValue={residentData.documentType}
                                        readOnly
                                    />
                            </div>
                        </div>

                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Name</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        defaultValue={fullName}
                                        readOnly
                                    />
                            </div>
                        </div>

                    </div>

                    <div className="section-right-container">
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Purpose</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        defaultValue={residentData.purpose}
                                        readOnly
                                    />
                            </div>
                        </div>

                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Contact Number</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        defaultValue={residentData.contact}
                                        readOnly
                                    />
                            </div>
                        </div>


                    </div>

                    

                    


                </div>

                <div className="status-container">   
                        <p>Status</p>
                        <span className={`status-badge ${residentData.status.toLowerCase().replace(" ", "-")}`}>
                          {residentData.status ?? "N/A"}
                        </span>   
                </div>

                <div className="Actions-Section">
                    <button type="button" className="actions-button">Send SMS</button>
                </div>
                
            </div>
        </main>

);
}