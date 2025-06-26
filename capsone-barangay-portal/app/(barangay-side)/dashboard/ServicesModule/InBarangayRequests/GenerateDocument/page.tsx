"use client"

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, getDocs} from "firebase/firestore";
import { db } from "@/app/db/firebase";
import "@/CSS/barangaySide/ServicesModule/GenerateDocument.css";


export default function GenerateDocument() {
    const router = useRouter();
    const [permitOptions, setPermitOptions] = useState<string[]>([]);


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
      const handleEditNewDocument = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/EditDoc");
    }

    const handleBack = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests");
    };

    useEffect(() => {
        const fetchPermitOptions = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "OtherDocuments"));
            const permits = querySnapshot.docs
              .filter(doc => doc.data().type === "Barangay Permit")
              .map(doc => doc.data().title);
      
            setPermitOptions(permits);
          } catch (error) {
            console.error("Error fetching Barangay Permit documents:", error);
          }
        };
      
        fetchPermitOptions();
      }, []);

    return (
        <main className="generatedocument-main-container">
            {/* NEW */}

            <div className="generatedocument-inbrgy-main-content">
                <div className="generatedocument-inbrgy-main-section1">
                    <div className="generatedocument-inbrgy-main-section1-left">
                        <button onClick={handleBack} >
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>

                        <h1> New Document Request </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-add-new-doc"  onClick={handleAddNewDocument}>
                            Add New Document
                        </button>
                        {/*
                        <button className="action-edit-new-doc"  onClick={handleEditNewDocument}>
                            Edit New Document
                        </button>
                        */}
                    </div>
                </div>

                

                <div className="generatedocument-inbrgy-info-main-container">
                    <div className="generatedocument-inbrgy-top-section">
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
                                        
                                        {/* Add dynamic permit titles */}
                                        {permitOptions.map((title, index) => (
                                            <p key={index} className="dropdown-item" onClick={handleSubmit} id={title}>
                                            {title}
                                            </p>
                                        ))}
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
                        </div>
                    </div>
                    <div className="generatedocument-inbrgy-bottom-section">
                        <div className="generate-documents-othernewdocs-container">
                            <div className="generate-documents-documents-card-othernewdocs" onClick={handleOtherNewDocument}>
                                <h1>Other Documents</h1>
                            </div>
                         </div>           
                    </div>
                </div>

            </div>
        </main>
    );
}