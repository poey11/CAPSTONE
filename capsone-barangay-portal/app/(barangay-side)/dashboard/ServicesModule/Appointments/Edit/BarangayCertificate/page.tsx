"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";




const metadata:Metadata = { 
  title: "Edit Barangay Certificate of Residency Appointment",
  description: "Edit Barangay Certificate of Residency Appointment",
};

export default function EditAppointment() {

    const router = useRouter();

    const handleBack = () => {
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
                <h1>Barangay Certificate Appointment</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/>
                        </button>

                        <h1>Barangay Certificate of Residency</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn">Discard</button>
                        <button className="save-btn">Save</button>
                    </div>

                </div>
                
                <hr/>

                <div className="main-fields-container">
                    <div className="main-fields-container-section1">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Appointmnet Type</p>
                                    <input 
                                        type="text" 
                                        className="headline" 
                                        placeholder="Appointment Type" 
                                        defaultValue={residentData.appointmentType}
                                    />
                                </div>
                                <div className="fields-section">
                                    <p>Purpose</p>
                                    <input 
                                        type="text" 
                                        className="headline" 
                                        placeholder="Puro" 
                                        defaultValue={residentData.purpose}
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Date of Appointment</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From"
                                        defaultValue={residentData.date} 
                                    />
                                    
                                </div>


                            </div>

                            </div>

                            <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Status</p>
                                    <select
                                        id="status"
                                        name="status"
                                        className="input-field"
                                        required
                                        defaultValue={residentData.status}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Completed">Completed</option>
                                
                                    </select>
                                </div>

                                <div className="fields-section">
                                        <p>Contact Number</p>
                                        <input 
                                            type="tel"  
                                            id="contactnumber"  
                                            name="contactnumber"  
                                            className="input-field" 
                                            required 
                                            placeholder="Enter Contact Number"  
                                            maxLength={10}  // Restrict the input to 10 characters as a number
                                            pattern="^[0-9]{10}$"  // Regular expression to enforce a 10-digit number format
                                            title="Please enter a valid 10-digit contact number"  // Tooltip for invalid input
                                            defaultValue={residentData.contact}
                                        />
                                </div>
                                

                                <div className="fields-section">
                                    <p>Time of Appointment</p>
                                    <input 
                                        type="time" 
                                        className="input-field" 
                                        placeholder="Select Time"
                                        defaultValue={convertTo24HourFormat(residentData.time)} 
                                    />
                                </div>
                                
                            </div>
                        </div>
                            
                    </div>

                    <div className="main-fields-container-section2">
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>First Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="First Name" 
                                    defaultValue={residentData.firstname}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Middle Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Middle Name" 
                                    defaultValue={residentData.middlename}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Last Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Last Name" 
                                    defaultValue={residentData.lastname}
                                />
                            </div>

                        </div>
                    </div>
                </div>  
            </div>
            
        </main>
    );
}

