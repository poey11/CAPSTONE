"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useState } from "react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";

interface EmergencyDetails {
  fullName: string;
  address: string;
  relationship: string;
  contactNumber: string;
}

interface ClearanceInput {
  docType: string;
  requestId: string;
  purpose: string;
  dateRequested: string;
  fullName: string;
  appointmentDate: string;
  dateOfResidency: string;
  dateofdeath: string;
  address: string;
  toAddress: string;
  businessLocation: string;
  businessNature: string;
  noOfVechicles: string;
  vehicleMake: string;
  vehicleType: string;
  vehiclePlateNo: string;
  vehicleSerialNo: string;
  vehicleChassisNo: string;
  vehicleEngineNo: string;
  vehicleFileNo: string;
  estimatedCapital: string;
  businessName: string;
  birthday: string;
  age: string;
  gender: string;
  civilStatus: string;
  contact: string;
  typeofconstruction: string;
  typeofbldg: string;
  othersTypeofbldg: string;
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
  requestorMrMs: string;
  requestorFname: string;
  partnerWifeHusbandFullName: string;
  cohabitationStartDate: string;
  cohabitationRelationship: string;
  wardFname: string;
  wardRelationship: string;
  guardianshipType: string;
  CYFrom: string;
  CYTo: string;
  attestedBy: string;
  goodMoralPurpose: string;
  goodMoralOtherPurpose: string;
  noIncomePurpose: string;
  noIncomeChildFName: string;
  deceasedEstateName: string;
  estateSince: string;
  signaturejpg: File | null;
  barangayIDjpg: File | null;
  validIDjpg: File | null;
  letterjpg: File | null;
  copyOfPropertyTitle: File | null;
  dtiRegistration: File | null;
  isCCTV: boolean | null;
  taxDeclaration: File | null;
  approvedBldgPlan: File | null;
  deathCertificate: File | null;
}




export default function action() {

    const router = useRouter();
    const searchParam = useSearchParams();
    const docType = searchParam.get("docType");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [showCreatePopup, setShowCreatePopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [clearanceInput, setClearanceInput] = useState<ClearanceInput>();




    const [files, setFiles] = useState<{ [key: string]: { name: string, preview: string | undefined }[] }>({
        container1: [],
    });


    const handleBack = () => {
      router.back();
    };

    // Handle file selection for any container
    const handleFileChange = (container: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles) {
          const fileArray = Array.from(selectedFiles).map((file) => {
            const preview = URL.createObjectURL(file);
            return { name: file.name, preview };
          });
          setFiles((prevFiles) => ({
            ...prevFiles,
            [container]: [...prevFiles[container], ...fileArray], // Append new files to the specified container
          }));
        }
    };
  
      // Handle file deletion for any container
    const handleFileDelete = (container: string, fileName: string) => {
        setFiles((prevFiles) => ({
          ...prevFiles,
          [container]: prevFiles[container].filter((file) => file.name !== fileName),
        }));
    };

    
    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }

    const confirmDiscard = async () => {
        setShowDiscardPopup(false);

        setPopupMessage("Document discarded successfully!");
                setShowPopup(true);

                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                    router.push("/dashboard/ServicesModule/InBarangayRequests");
                }, 3000);
    };

    const handleCreateClick = async () => {
        setShowCreatePopup(true);
    }

    const confirmCreate = async () => {
        setShowCreatePopup(false);

                setPopupMessage("Barangay Certificate created successfully!");
                setShowPopup(true);

                // Hide the popup after 3 seconds
                setTimeout(() => {
                    setShowPopup(false);
                    router.push("/dashboard/ServicesModule/InBarangayRequests/View/BarangayCertificate");
                }, 3000);

                
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
    
        // Handle birthday and compute age
        if (name === "birthday") {
          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        
          setClearanceInput((prev: any) => ({
            ...prev,
            birthday: value,
            age: age.toString(), // Ensure it's string if your input expects string
          }));
          return;
        }
      
        setClearanceInput((prev: any) => {
          const keys = name.split(".");
          if (keys.length === 2) {
            return {
              ...prev,
              [keys[0]]: {
                ...prev[keys[0]],
                [keys[1]]: value,
              },
            };
          }
          return {
            ...prev,
            [name]: value,
          };
        });
      };

    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
                <h1>Generate Document</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/>
                        </button>

                        <h1>{docType}</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn" onClick={handleDiscardClick}>Discard</button>
                        <button className="save-btn" onClick={handleCreateClick}>Create</button>
                    </div>
                </div>
                
                <hr/>

                <div className="main-fields-container">
                    <div className="main-fields-container-section1">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Purpose</p>
                                    <select 
                                        id="purpose" 
                                        name="purpose" 
                                        className="input-field" 
                                        required
                                        value ={clearanceInput?.purpose || ""}
                                        onChange={handleChange} // Handle change to update state
                                        
                                    >
                                        <option value="" disabled>Select purpose</option>
                                            {docType === "Barangay Certificate" ? (<>
                                              <option value="Residency">Residency</option>
                                              <option value="Occupancy /  Moving Out">Occupancy /  Moving Out</option>
                                              <option value="Estate Tax">Estate Tax</option>
                                              <option value="Death Residency">Death Residency</option>
                                              <option value="No Income">No Income</option>
                                              <option value="Cohabitation">Cohabitation</option>
                                              <option value="Guardianship">Guardianship</option>
                                              <option value="Good Moral and Probation">Good Moral and Probation</option>
                                              <option value="Garage/PUV">Garage/PUV</option>
                                              <option value="Garage/TRU">Garage/TRU</option>
                                            
                                            </>):docType === "Barangay Clearance" ? (<>
                                              <option value="Loan">Loan</option>
                                              <option value="Bank Transaction">Bank Transaction</option>
                                              <option value="Residency">Residency</option>
                                              <option value="Local Employment">Local Employment</option>
                                              <option value="Maynilad">Maynilad</option>
                                              <option value="Meralco">Meralco</option>
                                              <option value="Bail Bond">Bail Bond</option>
                                            </>):docType === "Barangay Indigency" ? ( <>
                                              <option value="No Income">No Income</option>
                                              <option value="Public Attorneys Office">Public Attorneys Office</option>
                                              <option value="AKAP">AKAP</option>
                                              <option value="Financial Subsidy of Solo Parent">Financial Subsidy of Solo Parent</option>
                                              <option value="Fire Emergency">Fire Emergency</option>
                                              <option value="Flood Victims">Flood Victims</option>
                                              <option value="Philhealth Sponsor">Philhealth Sponsor</option>
                                              <option value="Medical Assistance">Medical Assistance</option>
                                            </>): (docType === "Business Permit" ||docType === "Temporary Business Permit") && (
                                              <>
                                              <option value="New">New</option>
                                              <option value="Renewal">Renewal</option>
                                            </>)}
                                    </select>
                                </div>

                            </div>

                            </div>

                            <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Resident Since</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From" 
                                    />
                                </div>
                                
                            </div>
                        </div>
                            
                    </div>

                    <div className="main-fields-container-section2">
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Other Purpose</p>
                                    <input 
                                        type="text" 
                                        className="headline" 
                                        placeholder="Other Purpose" 
                                    />
                            </div>

                            <div className="fields-section">
                                <p>Full Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Full Name" 
                                />
                            </div>

                            <div className="fields-section">
                                <p>Address</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Address" 
                                />
                            </div>

                        </div>
                    </div>

                    <div className="main-fields-container-section3">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Age</p>
                                    <input 
                                        type="number"  // Ensures the input accepts only numbers
                                        id="age"  
                                        name="age"  
                                        className="input-field" 
                                        required 
                                        min="1"  // Minimum age (you can adjust this as needed)
                                        max="150"  // Maximum age (you can adjust this as needed)
                                        placeholder="Enter Age"  
                                        step="1"  // Ensures only whole numbers can be entered
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Civil Status</p>  
                                    <select 
                                        id="civilstatus" 
                                        name="civilstatus" 
                                        className="input-field" 
                                        required
                                        defaultValue=""  
                                    >
                                        <option value="" disabled>Select civil status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widow">Widow</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Citizenship</p>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Address" 
                                    />
                                </div>

                            </div>

                            </div>

                        <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Birthday</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From" 
                                    />    
                                </div>
                                <div className="fields-section">
                                    <p>Gender</p>
                                    <select 
                                        id="gender" 
                                        name="gender" 
                                        className="input-field" 
                                        required
                                        defaultValue=""  
                                    >
                                        <option value="" disabled>Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
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
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="main-fields-container-section4">
                        <p>Requirements</p>
                        <div className="requirements-file-upload-container">
                            <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                                <input
                                id="file-upload1"
                                type="file"
                                className="file-upload-input" 
                                multiple
                                accept=".jpg,.jpeg,.png"
                                required
                                onChange={handleFileChange('container1')} // Handle file selection
                                />

                            <div className="uploadedFiles-container">
                                {/* Display the file names with image previews */}
                                {files.container1.length > 0 && (
                                    <div className="file-name-image-display">
                                        <ul>
                                            {files.container1.map((file, index) => (
                                                <div className="file-name-image-display-indiv" key={index}>
                                                    <li className="file-item"> 
                                                        {/* Display the image preview */}
                                                        {file.preview && (
                                                            <div className="filename-image-container">
                                                                <img
                                                                    src={file.preview}
                                                                    alt={file.name}
                                                                    className="file-preview"
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="file-name">{file.name}</span>  
                                                        <div className="delete-container">
                                                            {/* Delete button with image */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileDelete('container1', file.name)}
                                                                className="delete-button"
                                                            >
                                                                <img
                                                                    src="/images/trash.png"  
                                                                    alt="Delete"
                                                                    className="delete-icon"
                                                                />
                                                            </button>
                                                        </div>
                                                    </li>
                                                </div>
                                            ))}  
                                        </ul>
                                    </div>
                                )}
                            </div>

                        </div>

                    </div>



                </div>
                {showDiscardPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to discard the document?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmDiscard} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

                    {showCreatePopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to create the document?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowCreatePopup(false)} className="no-button">No</button> 
                                    <button onClick={confirmCreate} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

                    {showPopup && (
                        <div className={`popup-overlay show`}>
                            <div className="popup">
                                <p>{popupMessage}</p>
                            </div>
                        </div>
                    )}

            </div>
            
        </main>
    );
}

