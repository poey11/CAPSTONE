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


    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
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

                <form onSubmit={handleSubmit}>

                    {/* 
                    <div className="main-select-container">
                        <div className="select-document-container">
                            <div className="Title-container">
                                <h1>Document Type</h1>
                            </div>
                            <div className="Option-container">
                                <select 
                                    id="featuredStatus" 
                                    name="featuredStatus" 
                                    className="featuredStatus" 
                                    required
                                    value={selectedDocument}
                                    onChange={handleDocumentChange}
                                >
                                    <option value="" disabled>Select Document Type</option>
                                    <option value="BarangayClearance">Barangay Clearance</option>
                                    <option value="BarangayIndigency">Barangay Indigency</option>
                                    <option value="BarangayID">Barangay ID</option>
                                    <option value="BarangayPermit">Barangay Permit</option>
                                    <option value="BarangayCertificate">Barangay Certificate</option>
                                    <option value="FirstTimeJobseeker">First Time Jobseeker</option>
                                </select>

                            </div>
                            
                            
                        </div>

                        {showPermitType && (
                            <div className="select-permit-type-container">
                                <div className="Title-container">
                                    <h1>Permit Type</h1>
                                 </div>
                                 <div className="Option-container">
                                    <select 
                                        id="permitType" 
                                        name="permitType" 
                                        className="featuredStatus" 
                                        required
                                        value={selectedPermitType}
                                        onChange={handlePermitTypeChange}
                                    >
                                        <option value="" disabled>Select Permit Type</option>
                                        <option value="BusinessPermit">Business Permit</option>
                                        <option value="TemporaryBusinessPermit">Temporary Business Permit</option>
                                        <option value="ConstructionPermit">Construction Permit</option>
                                        <option value="LiquorPermit">Liquor Permit</option>
                                        <option value="COOP">COOP</option>
                                    </select>
                                 </div>
                                
                            </div>
                        )}

                    </div>
                    

                    <div className="button-container">
                        <button type="submit" className="submit-button">Generate Document</button>
                    </div>

                    */}

<div className="documents-container">
                            <div className="documents-container-column">
                                <div className="documents-card dropdown-container">
                                <img
                                    src="/images/document.png"
                                    alt="Document Icon"
                                    className="document-icon"
                                    />
                                    <h1>Barangay Certificate</h1>
                                    <div className="dropdown">
                                    <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayCertificate">
                                        <p>Residency</p>
                                    </Link>
                                    <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayCertificate">
                                        <p>Others</p>
                                    </Link>
                                    </div>
                                </div>

                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayIndigency">
                                <div className="documents-card">
                                    <img
                                    src="/images/document.png"
                                    alt="Document Icon"
                                    className="document-icon"
                                    />
                                    <h1>Barangay Indigency</h1>
                                </div>
                                </Link>

                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayID">
                                <div className="documents-card">
                                    <img
                                    src="/images/document.png"
                                    alt="Document Icon"
                                    className="document-icon"
                                    />
                                    <h1>Barangay ID</h1>
                                </div>
                                </Link>
                        
                            </div>


                            <div className="documents-container-column">
                            <div className="documents-card dropdown-container">
                                <img
                                    src="/images/document.png"
                                    alt="Document Icon"
                                    className="document-icon"
                                />
                                <h1>Barangay Permits</h1>
                                <div className="dropdown">

                                <div
                                    className="nested-dropdown-container"
                                    onMouseEnter={(e) => {
                                        const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                                        if (dropdown) {
                                        dropdown.style.display = 'block';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                                        if (dropdown) {
                                        dropdown.style.display = 'none';
                                        }
                                    }}
                                    >
                                    <p className="nested-trigger">Business Permit</p>
                                    <div className="nested-dropdown">
                                        <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/BusinessPermit">
                                        <p>New</p>
                                        </Link>
                                        <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/BusinessPermit">
                                        <p>Renewal</p>
                                        </Link>
                                    </div>
                                </div>
                                    
                                <div
                                    className="nested-dropdown-container"
                                    onMouseEnter={(e) => {
                                        const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                                        if (dropdown) {
                                        dropdown.style.display = 'block';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                                        if (dropdown) {
                                        dropdown.style.display = 'none';
                                        }
                                    }}
                                    >
                                    <p className="nested-trigger">Temporary Business Permit</p>
                                    <div className="nested-dropdown">
                                        <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/TemporaryBusinessPermit">
                                        <p>New</p>
                                        </Link>
                                        <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/TemporaryBusinessPermit">
                                        <p>Renewal</p>
                                        </Link>
                                    </div>
                                </div>
                                    <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/ConstructionPermit">
                                    <p>Construction Permit</p>
                                    </Link>
                                </div>
                                </div>
                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayClearance">
                                <div className="documents-card">
                                    <img
                                    src="/images/document.png"
                                    alt="Document Icon"
                                    className="document-icon"
                                    />
                                    <h1>Barangay Clearance</h1>
                                </div>
                                </Link>
                                <Link href="/dashboard/ServicesModule/GenerateDocument/BarangayPermit/FirstTimeJobseeker">
                                <div className="documents-card">
                                    <img
                                    src="/images/document.png"
                                    alt="Document Icon"
                                    className="document-icon"
                                    />
                                    <h1>First Time Jobseeker</h1>
                                </div>
                                </Link>

                            </div>

                        </div>
                </form>
            </div>
        </main>
    );
}