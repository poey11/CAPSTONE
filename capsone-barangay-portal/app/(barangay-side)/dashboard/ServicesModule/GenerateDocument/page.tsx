"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "@/CSS/barangaySide/ServicesModule/GenerateDocument.css";

const metadata: Metadata = {
    title: "In Barangay Request",
    description: "In Barangay Request in Services Module",
};

export default function GenerateDocument() {
    const router = useRouter();
    const [selectedDocument, setSelectedDocument] = useState("");
    const [showPermitType, setShowPermitType] = useState(false);
    const [selectedPermitType, setSelectedPermitType] = useState("");
    
    const handleBackToInBarangay = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests");
    };

    const handleDocumentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        setSelectedDocument(value);
        setShowPermitType(value === "BarangayPermit");
        setSelectedPermitType(""); // Reset permit type when changing document
    };

    const handlePermitTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPermitType(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;

        if (form.checkValidity() && selectedDocument && (!showPermitType || selectedPermitType)) {
            const documentPath = selectedDocument === "BarangayPermit" ? `${selectedDocument}/${selectedPermitType}` : selectedDocument;
            document.location.href = `/dashboard/ServicesModule/GenerateDocument/${documentPath}`;
        } else {
            form.reportValidity();
        }
    };

    const [isDropdownVisible, setDropdownVisible] = useState(false);


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
                    </div>

                </div>

                <hr />

            
                    <div className="generate-documents-main-select-container">

                        <div className="generate-documents-container">

                            <div className="generate-documents-container-column">
                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayCertificate">
                                    <div className="generate-documents-documents-card">
                                        <h1>Barangay Certificate</h1>
                                    </div>
                                </Link>

                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayIndigency">
                                    <div className="generate-documents-documents-card">
                                        <h1>Barangay Indigency</h1>
                                    </div>
                                </Link>

                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayID">
                                    <div className="generate-documents-documents-card">
                                        <h1>Barangay ID</h1>
                                    </div>
                                </Link>
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
                                    <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/BusinessPermit">
                                    <p className="dropdown-item">Business Permit</p>
                                    </Link>
                                    <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/TemporaryBusinessPermit">
                                    <p className="dropdown-item">Temporary Business Permit</p>
                                    </Link>
                                    <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/ConstructionPermit">
                                    <p className="dropdown-item">Construction Permit</p>
                                    </Link>
                                </div>
                                )}
                            </div>
                            

                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayClearance">
                                    <div className="generate-documents-documents-card">
                                        <h1>Barangay Clearance</h1>
                                    </div>
                                </Link>

                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/FirstTimeJobseeker">
                                    <div className="generate-documents-documents-card">
                                        <h1>First Time Jobseeker</h1>
                                    </div>
                                </Link>

                            </div>
                        </div>

                    </div>
            
            </div>
        </main>
    );
}