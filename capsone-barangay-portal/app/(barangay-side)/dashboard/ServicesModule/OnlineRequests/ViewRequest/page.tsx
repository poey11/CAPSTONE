"use client";

import { getSpecificDocument } from "@/app/helpers/firestorehelper";
import { useSearchParams } from "next/navigation";
import { use, useEffect,useState } from "react";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";

interface EmergencyDetails {
    firstName: string;
    middleName: string;
    lastName: string;
    address: string;
    relationship: string;
    contactNumber: string;
  }
  
  interface OnlineRequest {
    accountId: string;
    docType: string;
    status: string;
    purpose: string;
    dateRequested: string;
    firstName: string;
    middleName: string;
    appointmentDate: string;
    lastName: string;
    dateOfResidency: string;
    address: string; // Will also be the home address
    businessLocation: string; // Will be the project location
    businessNature: string;
    estimatedCapital: string;
    businessName: string;
    birthday: string;
    age: string;
    gender: string;
    civilStatus: string;
    contact: string;
    typeofconstruction: string;
    typeofbldg: string;
    projectName: string;
    citizenship: string;
    educationalAttainment: string;
    course: string;
    isBeneficiary: string;
    birthplace: string;
    religion: string;
    nationality: string;
    height: string;
    weight: string;
    bloodtype: string;
    occupation: string;
    precinctnumber: string;
    emergencyDetails: EmergencyDetails;
    signaturejpg: string;
    barangayIDjpg: string;
    validIDjpg:string ;
    letterjpg: string;
    copyOfPropertyTitle: string;
    dtiRegistration: string;
    isCCTV: string;
    taxDeclaration: string;
    approvedBldgPlan: string;
  }


const ViewOnlineRequest = () => {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const  [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<OnlineRequest>();
    useEffect(() => {
        if(!id) return
        getSpecificDocument("ServiceRequests", id, setRequestData).then(() => setLoading(false));   
        console.log(id);    
    }, [id]);
    const [status, setStatus] = useState("");    
    console.log(requestData);
   useEffect(() => {
     setStatus(requestData?.status?.toLowerCase().replace(" ", "-") || "");
   }, [requestData]);
  
    if(loading) return <p>......</p>
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value.toLowerCase().replace(" ", "-"));
    };
    const requestField = [
        { key: "docType", label: "Document Type" },
        { key: "purpose", label: "Purpose" },
        { key: "requestDate", label: "Date Requested" },
        { key: "firstName", label: "First Name" },
        { key: "middleName", label: "Middle Name" },
        { key: "lastName", label: "Last Name" },
        { key: "address", label: "Address" },
        { key: "age", label: "Age" },
        { key: "civilStatus", label: "Civil Status" },
        { key: "citizenship", label: "Citizenship" },
        { key: "gender", label: "Gender" },
        { key: "contact", label: "Contact" },
        { key: "birthday", label: "Birthday" },
        { key: "businessNature", label: "Business Nature" },
        { key: "estimatedCapital", label: "Estimated Capital" },
        { key: "businessName", label: "Business Name" },
        { key: "typeofconstruction", label: "Type of Construction" },
        { key: "typeofbldg", label: "Type of Building" },
        { key: "projectName", label: "Project Name" },
        { key: "educationalAttainment", label: "Educational Attainment" },
        { key: "course", label: "Course" },
        { key: "isBeneficiary", label: "Is Beneficiary" },
        { key: "birthplace", label: "Birthplace" },
        { key: "religion", label: "Religion" },
        
        // Emergency Details Fields
        { key: "emergencyDetails.firstName", label: "Emergency Contact First Name" },
        { key: "emergencyDetails.middleName", label: "Emergency Contact Middle Name" },
        { key: "emergencyDetails.lastName", label: "Emergency Contact Last Name" },
        { key: "emergencyDetails.address", label: "Emergency Contact Address" },
        { key: "emergencyDetails.relationship", label: "Emergency Contact Relationship" },
        { key: "emergencyDetails.contactNumber", label: "Emergency Contact Number" },

        // File Fields
        { key: "signaturejpg", label: "Signature" },
        { key: "barangayIDjpg", label: "Barangay ID" },
        { key: "validIDjpg", label: "Valid ID" },
        { key: "letterjpg", label: "Letter" },
        { key: "copyOfPropertyTitle", label: "Copy of Property Title" },
        { key: "dtiRegistration", label: "DTI Registration" },
        { key: "isCCTV", label: "CCTV Requirement" },
        { key: "taxDeclaration", label: "Tax Declaration" },
        { key: "approvedBldgPlan", label: "Approved Building Plan" },
        ];
     
    const handleBack = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests";
    };

    const handleviewappointmentdetails = () => {
        window.location.href = "/dashboard/ServicesModule/Appointments/View";
    };

    const handlerejection = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests/ReasonForReject";
    };

    const handleSMS = () => {
        window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
    };
    return (
        <main className="viewonlinereq-main-container">

            <div className="viewonlinereq-page-title-section-1">
                <h1>Online Document Requests</h1>
            </div>

            <div className="viewonlinereq-actions-content">
                <div className="viewonlinereq-actions-content-section1">
                    <button type="button" className="actions-button-reject" onClick ={handlerejection}>Reject</button>
                    <button type="button" className="actions-button">Print</button>
                    <button type="button" className="actions-button" onClick ={handleviewappointmentdetails}>View Appointment Details</button>

                    {/* Dropdown with dynamic class */}
                    <select
                        id="status"
                        className={`status-dropdown-viewonlinereq ${status}`}
                        name="status"
                        value={status}
                        onChange={handleStatusChange}
                    >
                        <option value="pick-up">Pick-up</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                    </select>

                </div>
                
                <div className="viewonlinereq-actions-content-section2">
                    {status === "pick-up" && (
                        <button type="button" className="actions-button" onClick={handleSMS}>SMS</button>
                    )}
                </div>

                
            
            </div>

            <div className="viewonlinereq-main-content">
                <div className="viewonlinereq-section-1">
                  <div className="viewonlinereq-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1>Online Request Details</h1>
                  </div>
                    
                </div>

              {requestField
              
                .filter((field) => {
                    if (!requestData) return false; // Ensure requestData is defined
                
                    // Check if it's a nested emergency detail
                    if (field.key.startsWith("emergencyDetails.")) {
                        const [, subKey] = field.key.split("."); // Extract the sub-key
                        return subKey in (requestData.emergencyDetails ?? {}); // Only include if it exists
                    }
                
                    return field.key in requestData; // Check if the field exists in requestData
                })
                .map( (field) => {
                   // Extract field value safely
                   let fieldValue: string | File | null | undefined;
                   if (field.key.startsWith("emergencyDetails.")) {
                       const [_, subKey] = field.key.split(".");
                       fieldValue = requestData?.emergencyDetails?.[subKey as keyof EmergencyDetails] ?? "N/A";
                   } else {
                       fieldValue = requestData ? requestData[field.key as keyof OnlineRequest] as string | File | null | undefined : "N/A";
                   }

                   // Handle nested emergencyDetails fields
                   if (field.key.startsWith("emergencyDetails.")) {
                       const [_, subKey] = field.key.split("."); // Extract the sub-key
                       fieldValue = requestData?.emergencyDetails?.[subKey as keyof EmergencyDetails] ?? "N/A";
                   }
                  
                
                
                    return (
                        <div className="viewonlinereq-details-section" key={field.key}>
                            <div className="viewonlinereq-title">
                                <p>{field.label}</p>
                            </div>
                         <div className="viewonlinereq-description">
                            {/* Handle File/Image Fields */}
                            {["signaturejpg", "barangayIDjpg", "validIDjpg", "letterjpg", "copyOfPropertyTitle", "dtiRegistration", "isCCTV", "taxDeclaration", "approvedBldgPlan"].includes(field.key) ? (
                                fieldValue && typeof fieldValue === "string" ? (
                                    <div className="resident-id-container">
                                        <img src={fieldValue} alt={field.label} className="resident-id-image" />
                                        <a href={fieldValue} target="_blank" rel="noopener noreferrer" className="view-image-link">
                                            {fieldValue}
                                        </a>
                                    </div>
                                ) : (
                                    <p>No File Uploaded</p>
                                )
                            ) : (
                                <p>{typeof fieldValue === "string" ? fieldValue : "N/A"}</p>
                            )}
                        </div>
                        
                        </div>
                    );
            })}

            </div>
        </main>
    );
}
 
export default ViewOnlineRequest;