"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/SMSOnlineRequest.css";


const metadata: Metadata = {
    title: "SMS Appointment",
    description: "Appointment in Services Module",
};


export default function OnlineRequests() {
    const router = useRouter();

    const handleBackToOnlineRequests = () => {
        router.push("/dashboard/ServicesModule/Appointments");
    };

    const requestData = [
        {
            appointmentType: "Barangay Certificate",
            purpose: "Certificate of Residency",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            contact: "09171218101",
            status: "Pending",
            date: "2024-01-17",
            time: "10:00 AM",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    // Combine first, middle, and last names into one field
    const fullName = `${residentData.firstname} ${residentData.middlename} ${residentData.lastname}`.trim();

    const convertTo24HourFormat = (time: string | undefined): string => {
        if (!time) return "";
        const [timePart, modifier] = time.split(" ");
        let [hours, minutes] = timePart.split(":");
    
        if (modifier === "PM" && hours !== "12") {
            hours = String(parseInt(hours, 10) + 12);
        } else if (modifier === "AM" && hours === "12") {
            hours = "00";
        }
    
        return `${hours.padStart(2, "0")}:${minutes}`;
    };
    
    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
                <h1>Appointment Schedule</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBackToOnlineRequests}>
                            <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
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
                                        defaultValue={residentData.appointmentType}
                                        readOnly
                                    />
                            </div>
                            <div className="fields-section">
                                    <p>Date of Appointment</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From"
                                        defaultValue={residentData.date} 
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
                            <div className="fields-section">
                                    <p>Time of Appointment</p>
                                    <input 
                                        type="time" 
                                        className="input-field" 
                                        placeholder="Select Time"
                                        defaultValue={convertTo24HourFormat(residentData.time)} 
                                        readOnly
                                    />
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


                <div className="Actions-Section">
                    <button type="button" className="actions-button">Send Appointment Confirmation</button>
                </div>
                
            </div>
        </main>

);
}