"use client"

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot} from "firebase/firestore";
import { db } from "@/app/db/firebase";
import "@/CSS/barangaySide/ServicesModule/GenerateDocument.css";
import { title } from "process";


export default function GenerateDocument() {
    const router = useRouter();
    const [permitOptions, setPermitOptions] = useState<any[]>([]);


    const handleSubmit = (e: any) => {
        const action = e.currentTarget.id;
        router.push(`/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/Action?docType=${action}`);
    }

    const handleSubmitOther = (e: any) => {
        console.log("Selected Document:", e);
        router.push(`/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/Action?docType=${e.type}&purpose=${e.title}`);
    }

    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const handleAddNewDocument = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/addNewDoc");
    }
    

    const handleBack = () => {
        router.push("/dashboard/ServicesModule/InBarangayRequests");
    };

    // function replacePlaceholders(body: string, values: Record<string, string>) {
    //     return body.replace(/\{(\w+)\}/g, (_, key) => values[key] || `{${key}}`);
    // }
    
    // const getMonthName = (monthNumber:number) => {
    //   const monthNames = [
    //     "January", "February", "March", "April", "May", "June",
    //     "July", "August", "September", "October", "November", "December"
    //   ];
    
    //   if (monthNumber >= 1 && monthNumber <= 12) {
    //     return monthNames[monthNumber - 1];
    //   } else {
    //     return "Invalid month number";
    //   }
    // }

    // const  handleTestNewDocument = async() => {
    //     let data ={
    //         requestorFname: "John",
    //         address: "123 Main St",
    //         cohabitationStartDate: "2020-01-01",
    //         requestor: "Jane Doe",
    //         dayToday: "15",
    //         monthToday: "October",
    //         yearToday: "2023",
    //     }
    //     data.cohabitationStartDate = `${getMonthName(parseInt(data.cohabitationStartDate.split("-")[1]))} ${data.cohabitationStartDate.split("-")[2]}, ${data.cohabitationStartDate.split("-")[0]}`;
    //     const tab = '     '; // simulate a tab (5 spaces)

    //     const body = `This is to certify that {requestorFname}, of legal ages are bonafide residents of this Barangay with residence and postal address at {address} are living together as husband and wife without any interruption and without the benefit of marriage since {cohabitationStartDate}. 

    //     This certification is issued upon the request of the {requestor} to attest to the truth of the foregoing facts and for whatever legal intents and purposes this may serve best. 

    //     Issued this {dayToday} day of {monthToday} {yearToday} at the Barangay Hall, Dahlia Avenue, Barangay Fairview, District 5, Quezon City.`;

    //     console.log("Original Body:", body);
    //     const newBody = replacePlaceholders(body, data);
        
    //     console.log("Replaced Body:", newBody);
        
        
    //     const response = await fetch('/api/swapTextPDF', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //             body: newBody,
    //         }),
    //     });
    //     if (!response.ok) {
    //         console.error("Failed to generate PDF");
    //         return;
    //     }
    //     const blob = await response.blob();
    //     const url = URL.createObjectURL(blob);
    //     const link = document.createElement("a");
    //     link.href = url;
    //     link.download=`$test.pdf`;
    //     link.click();
    //     URL.revokeObjectURL(url);
    //     link.remove();        
    // }

    useEffect(() => {
        const collectionRef = collection(db, "OtherDocuments");
        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const permits = snapshot.docs
                .filter(doc => doc.data().type === "Barangay Permit")
                .map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    type: doc.data().type,
                }));
            setPermitOptions(permits);
        });

        return () => unsubscribe(); // Cleanup the listener on unmount

      }, []);
      console.log("Permit Options:", permitOptions);
    return (
        <main className="generatedocument-main-container">
            {/* NEW */}

            <div className="generatedocument-inbrgy-main-content">
                <div className="generatedocument-inbrgy-main-section1">
                    <div className="generatedocument-inbrgy-main-section1-left">
                        <button onClick={handleBack} >
                            <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>

                        <h1> New Document Request </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-add-new-doc"  onClick={handleAddNewDocument}>
                            Add New Document
                        </button>
                        
                        {/* <button className="action-edit-new-doc"  onClick={handleTestNewDocument}>
                            Edit New Document
                        </button>
                         */}
                        
                        {/* <button className="action-edit-new-doc"  onClick={handleTestNewDocument}>
                            Test Document
                        </button> */}
                    </div>
                </div>

                

                <div className="generatedocument-inbrgy-info-main-container">
                    <div className="generatedocument-inbrgy-top-section">
                        <div className="generate-documents-container">
                            <div className="generate-documents-container-column">
                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay Certificate">
                                    <h1>Barangay Certificate</h1>
                                </div>

                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay Indigency">
                                    <h1>Barangay Indigency</h1>
                                </div>

                                {/*
                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay ID">
                                    <h1>Barangay ID</h1>
                                </div>
                                */}
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
                                        <p className="dropdown-item" onClick={handleSubmit} id="Construction">Construction Permit</p>
                                        
                                        {/* Add dynamic permit titles */}
                                        
                                        {permitOptions.map((permit, index) => (
                                            <p key={permit.id||index} className="dropdown-item" onClick={() => handleSubmitOther(permit)}>
                                                {permit.title}
                                            </p>
                                        ))}
                                    </div>
                                    )}
                                </div>
                            

                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="Barangay Clearance">
                                    <h1>Barangay Clearance</h1>
                                </div>


                            {/*
                                <div className="generate-documents-documents-card" onClick={handleSubmit} id="First Time Jobseeker">
                                    <h1>First Time Jobseeker</h1>
                                </div>

                            */}

                            </div>
                        </div>
                    </div>
                    <div className="generatedocument-inbrgy-bottom-section">
                        <div className="generate-documents-othernewdocs-container">
                            <div className="generate-documents-documents-card-othernewdocs" onClick={handleSubmit} id="Other Documents">
                                <h1>Other Documents</h1>
                            </div>
                         </div>           
                    </div>
                </div>

            </div>
        </main>
    );
}