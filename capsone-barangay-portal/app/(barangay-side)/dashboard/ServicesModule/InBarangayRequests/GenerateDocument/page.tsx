"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import "@/CSS/barangaySide/ServicesModule/GenerateDocument.css";


export default function GenerateDocument() {
    const router = useRouter();
    console.log(router);
    const handleBackToInBarangay = () => {
        router.back();
    };


    const handleSubmit = (e: any) => {
        const action = e.currentTarget.id;
        router.push(`/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/Action?docType=${action}`);
    }

    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const handleAddNewDocument = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/addNewDoc");
    }
    const handleOtherNewDocument = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/OtherNewDocument");
    }
    return (
        <main className="generatedocument-main-container">
            <div className="generatedocument-section-1">
                <h1>In Barangay Document Request</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBackToInBarangay}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>
                        <h1>Generate Document</h1>
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-300"
                          onClick={handleAddNewDocument}
                        >
                          Add New Document
                        </button>
                    </div>

                </div>

                <hr />

            
                    <div className="generate-documents-main-select-container">

                        <div className="generate-documents-container">

                            <div className="generate-documents-container-column"  >
                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay Certificate">
                                    <h1>Barangay Certificate</h1>
                                </div>

                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay Indigency">
                                    <h1>Barangay Indigency</h1>
                                </div>

                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay ID">
                                    <h1>Barangay ID</h1>
                                </div>
                            </div>

                            <div className="generate-documents-container-column">
                            <div 
                                className="generate-documents-documents-card generate-documents-dropdown-container"
                                onMouseEnter={() => setDropdownVisible(true)}
                                onMouseLeave={() => setDropdownVisible(false)}
                            >
                                <h1>Barangay Permits</h1>
                                {isDropdownVisible && (
                                <div className="generate-documents-dropdown">
                                    <p className="dropdown-item" onClick={handleSubmit} id="Business Permit">Business Permit</p>
                                    <p className="dropdown-item" onClick={handleSubmit} id="Temporary Business Permit">Temporary Business Permit</p>
                                    <p className="dropdown-item" onClick={handleSubmit} id="Construction ">Construction Permit</p>
                                </div>
                                )}
                            </div>
                            

                            <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay Clearance">
                                <h1>Barangay Clearance</h1>
                            </div>

                            <div className="generate-documents-documents-card" onClick={handleSubmit} id="First Time Jobseeker">
                                <h1>First Time Jobseeker</h1>
                            </div>

                            </div>
                            
                            <div className="generate-documents-container-column">
                                <div className="generate-documents-documents-card" onClick={handleOtherNewDocument}>
                                    <h1>Other New Documents</h1>
                                </div>

                            </div>
                        </div>

                    </div>
            
            </div>
        </main>
    );
}