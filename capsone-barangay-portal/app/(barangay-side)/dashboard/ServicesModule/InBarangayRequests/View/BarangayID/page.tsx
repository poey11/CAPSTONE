"use client"

import Link from "next/link";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";

const metadata: Metadata = {
    title: "View In Barangay ID Request",
    description: "View In Barangay ID Request in Services Module",
};

const residentFields = [
    { key: "documentType", label: "Document Type" },
    { key: "daterequested", label: "Date Requested" },
    { key: "residentsince", label: "Resident Since" },
    { key: "precinctnumber", label: "Precinct Number" },
    { key: "firstname", label: "First Name" },
    { key: "middlename", label: "Middle Name" },
    { key: "lastname", label: "Last Name" },
    { key: "address", label: "Address" },
    { key: "age", label: "Age" },
    { key: "occupation", label: "Occupation" },
    { key: "civilstatus", label: "Civil Status" },
    { key: "citizenship", label: "Citizenship" },
    { key: "nationality", label: "Nationality" },
    { key: "religion", label: "Religion" },
    { key: "birthday", label: "Birthday" },
    { key: "birthplace", label: "Birthplace" },
    { key: "gender", label: "Gender" },
    { key: "contact", label: "Contact" },
    { key: "height", label: "Height" },
    { key: "weight", label: "Weight" },
    { key: "bloodtype", label: "Blood Type" },
    { key: "status", label: "Status" },
    { key: "requirements", label: "Requirements" },
];

const emergencyFields = [
    { key: "emergencyfirstname", label: "First Name" },
    { key: "emergencymiddlename", label: "Middle Name" },
    { key: "emergencylastname", label: "Last Name" },
    { key: "emergencyaddress", label: "Address" },
    { key: "emergencycontact", label: "Contact" },
    { key: "emergencyrelationship", label: "Relationship" },
];

export default function ViewInBarangayRequest() {
    const requestData = [
        {
            documentType: "Barangay ID",
            daterequested: "January 17, 2024",
            residentsince: "January 14, 2002",
            precinctnumber: "1234567",
            firstname: "Jisoo",
            middlename: "Yap",
            lastname: "Martinez",
            address: "Calamba, Laguna",
            age: "23",
            occupation: "Accountant",
            civilstatus: "Single",
            citizenship: "Filipino",
            nationality: "Filipino",
            religion: "Catholic",
            birthday: "September 6, 2002",
            birthplace: "Calamba, Laguna",
            gender: "Female",
            contact: "09171218101",
            height: "151",
            weight: "45",
            bloodtype: "A+",
            emergencyfirstname: "Mia",
            emergencymiddlename: "Yap",
            emergencylastname: "Martinez",
            emergencyaddress: "Calamba, Laguna",
            emergencycontact: "09175674321",
            emergencyrelationship: "Sibling",
            status: "In Progress",
            requirements: "/Images/document.png",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/InBarangayRequests";
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
                            {field.key === "requirements" ? (
                                <img src={residentData[field.key] ?? ""} alt="Requirement" className="requirement-image" />
                            ) : (
                                <p>{residentData[field.key] ?? "N/A"}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="emergency-details-content">
                <div className="section-1">
                    <p>Emergency Contact Details</p> 
                </div>

                {emergencyFields.map((field) => (
                    <div className="details-section" key={field.key}>
                        <div className="title">
                            <p>{field.label}</p>
                        </div>
                        <div className="description">
                            <p>{residentData[field.key] ?? "N/A"}</p>
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
