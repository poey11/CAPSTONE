"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useState, useEffect } from "react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";
import { getLocalDateString } from "@/app/helpers/helpers";
import {customAlphabet} from "nanoid";
import { addDoc, collection, doc, getDoc} from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getSpecificCountofCollection } from "@/app/helpers/firestorehelper";
import { useSession } from "next-auth/react";
import { getStorage } from "firebase/storage";


interface EmergencyDetails {
  fullName?: string;
  address?: string;
  relationship?: string;
  contactNumber?: string;
}
interface File {
    name?: string;
}

interface ClearanceInput {
    accID?: string;
    createdBy?: string;
    docType?: string;
    requestId?: string;
    purpose?: string;
    createdAt?: string;
    fullName?: string;
    dateOfResidency?: string;
    dateofdeath?: string;
    address?: string;
    toAddress?: string;
    businessLocation?: string;
    businessNature?: string;
    noOfVechicles?: string;
    vehicleMake?: string;
    vehicleType?: string;
    vehiclePlateNo?: string;
    vehicleSerialNo?: string;
    vehicleChassisNo?: string;
    vehicleEngineNo?: string;
    vehicleFileNo?: string;
    estimatedCapital?: string;
    businessName?: string;
    birthday?: string;
    age?: string;
    gender?: string;
    civilStatus?: string;
    contact?: string;
    typeofconstruction?: string;
    typeofbldg?: string;
    othersTypeofbldg?: string;
    projectName?: string;
    citizenship?: string;
    educationalAttainment?: string;
    course?: string;
    isBeneficiary?: string;
    birthplace?: string;
    religion?: string;
    nationality?: string;
    height?: string;
    weight?: string;
    bloodtype?: string;
    occupation?: string;
    precinctnumber?: string;
    emergencyDetails?: EmergencyDetails;
    requestorMrMs?: string;
    requestorFname?: string;
    partnerWifeHusbandFullName?: string;
    cohabitationStartDate?: string;
    cohabitationRelationship?: string;
    wardFname?: string;
    wardRelationship?: string;
    guardianshipType?: string;
    CYFrom?: string;
    CYTo?: string;
    attestedBy?: string;
    goodMoralPurpose?: string;
    goodMoralOtherPurpose?: string;
    noIncomePurpose?: string;
    noIncomeChildFName?: string;
    deceasedEstateName?: string;
    estateSince?: string;
    docsRequired: File[]; // Changed to File[] to match the file structure
    status?: string; // Optional, can be added if needed
    statusPriority?: number; // Optional, can be added if 
    reqType?: string; // Optional, can be added if needed
}



export default function action() {
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const searchParam = useSearchParams();
    const docType = searchParam.get("docType");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [showCreatePopup, setShowCreatePopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [clearanceInput, setClearanceInput] = useState<ClearanceInput>({
        accID:"INBRGY-REQ",
        reqType: "InBarangay",
        docType: docType || "",
        status: "Pending",
        createdAt: new Date().toLocaleString(),
        createdBy: user?.id || "",
        statusPriority: 1, // Default priority for pending requests
        docsRequired: [],
    });
    const [maxDate, setMaxDate] = useState<any>()

    useEffect(() => {
        setMaxDate(getLocalDateString(new Date()));
    },[]);

    const [number,setNumber] = useState(0);
    useEffect(() => {
        const fetchNumber = async () => {
            try {
                const count = await getSpecificCountofCollection("ServiceRequests", "reqType", "InBarangay");
                setNumber(count || 0);
            } catch (error) {
                console.error("Error fetching number:", error);
            }
        }
        fetchNumber();

    },[])

    useEffect(() => {
        const getRequestId = () => {
            const alphabet =  `ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
            const randomId = customAlphabet(alphabet, 6);
            const requestId = randomId();
            const nos = String(number+1).padStart(4, '0'); // Ensure the number is 4 digits
            let format = `${requestId}-${nos}`;
            setClearanceInput((prev) => ({
                ...prev,
                docType: docType || "",
                requestId: format,
            }));
            setPopupMessage(`Request ID: ${format}`);
        }
        getRequestId();

    }, [number]);

    const [files, setFiles] = useState<{ [key: string]: { file: File; name: string; preview: string | undefined }[] }>({
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
            return { file, name: file.name, preview };
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
                }, 3000);
    };

    const handleUploadImage = async () => {
        const uploadedFiles: { name: string }[] = [];

        try {
            let i = 0;
            for (const file of files.container1) {
                console.log("File:", file);
                const fileExtension = file.name.split('.').pop();
                const fileName = `${clearanceInput.requestId}-file${i}.${fileExtension}`;
                const storageRef = ref(storage, `ServiceRequests/${fileName}`);
                console.log("Storage Reference:", storageRef);

                const snapshot = await uploadBytes(storageRef, file.file as Blob);
                const url = await getDownloadURL(snapshot.ref);
                uploadedFiles.push({ name: url });
                i++;
            }
            console.log("Uploaded Files:", uploadedFiles);
            return uploadedFiles; // Return the array of uploaded file names
        }
        catch (error) {
            console.error("Error uploading images:", error);
          
        }    
    }
    let id: string | undefined;
    const handleUploadClick = async() => {
        try {
            const uplodedFile = await handleUploadImage(); // Upload images after succesfully adding the document
            console.log("Uploaded Files:", uplodedFile);
            const docRef = collection(db, "ServiceRequests");
            const docData ={
                ...clearanceInput,
                requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname}`,
                docsRequired: uplodedFile, // Use the uploaded file names
            }
            console.log("Document Data:", docData);
            const doc = await addDoc(docRef, docData);
            console.log("Document written with ID: ", docData.requestId, " - ", doc.id);
            id = doc.id; // Store the document ID for redirection
        } catch (error) {
            console.error("Error:", error);
        }       

    }

    const handleConfirmClick = async() => {
        setShowCreatePopup(true);
    }

    const handleSubmit = (e:React.FormEvent) => {
        e.preventDefault();
        if(!files["container1"]||files.container1.length === 0) {
            setPopupMessage("Please upload at least one file.");
            setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
            }, 3000);
            return;
        }
        
        handleConfirmClick();
    }


    const confirmCreate = async () => {
        setShowCreatePopup(false);
        setPopupMessage(`${docType} created successfully!`);
        setShowPopup(true);
        console.log("Files:", files);
        console.log("Clearance Input:", clearanceInput);
        handleUploadClick().then(() => {
            router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest?id=${id}`);
        });
        // Hide the popup after 3 seconds
        setTimeout(() => {
            setShowPopup(false);
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

                        <h1>{docType} {clearanceInput.requestId}</h1>
                    </div>
                </div>
                
                <hr/>
                <form  onSubmit={handleSubmit}>
                    <div className="action-btn-section">
                        <button type="button" className="discard-btn" onClick={handleDiscardClick}>Discard</button>
                        <button type="submit" className="save-btn" >Create</button>
                    </div>
                
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
                                            value ={clearanceInput?.dateOfResidency || ""}
                                            onChange={handleChange} // Handle change to update state
                                            required
                                            type="date"
                                            id="dateOfResidency"
                                            name="dateOfResidency"
                                            className="input-field" 
                                            max = {maxDate}
                                            onKeyDown={(e) => e.preventDefault()}
                                        />
                                    </div>
                                            
                                </div>
                            </div>
                                            
                        </div>

                        <div className="main-fields-container-section2">
                            <div className="fields-container">
                                {/* <div className="fields-section">
                                    <p>Other Purpose</p>
                                        <input 
                                            type="text" 
                                            className="headline" 
                                            placeholder="Other Purpose" 
                                        />
                                </div> */}

                                <div className="fields-section">
                                    <p>Full Name</p>
                                    <input 
                                        value ={clearanceInput?.fullName || ""}
                                        onChange={handleChange} // Handle change to update state
                                        required
                                        id="fullName"
                                        name="fullName"
                                        type="text" 
                                        className="headline" 
                                        placeholder="Full Name" 
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Address</p>
                                    <input 
                                        type="text" 
                                        value ={clearanceInput?.address || ""}
                                        onChange={handleChange} // Handle change to update state
                                        required
                                        id="address"
                                        name="address"
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
                                            value ={clearanceInput?.age || ""}
                                            onChange={handleChange} // Handle change to update state
                                            className="input-field" 
                                            required 
                                            min="1"  // Minimum age (you can adjust this as needed)
                                            max="150"  // Maximum age (you can adjust this as needed)
                                            placeholder="Enter Age"  
                                            step="1"  // Ensures only whole numbers can be entered
                                            disabled={true}  // Disable input to prevent manual changes
                                        />
                                    </div>

                                    <div className="fields-section">
                                        <p>Civil Status</p>  
                                        <select 
                                            value ={clearanceInput?.civilStatus}
                                            onChange={handleChange}
                                            id="civilStatus" 
                                            name="civilStatus" 
                                            className="input-field" 
                                            required
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
                                            value ={clearanceInput?.citizenship || ""}
                                            onChange={handleChange} 
                                            required
                                            type="text" 
                                            id="citizenship"
                                            name="citizenship"
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
                                            id="birthday"
                                            name="birthday"
                                            value ={clearanceInput?.birthday || ""}
                                            onChange={handleChange} // Handle change to update state
                                            required
                                            max={maxDate}  // Restrict the date to today or earlier
                                            onKeyDown={(e) => e.preventDefault()}  // Prevent manual input

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
                                            value ={clearanceInput?.gender}
                                            onChange={handleChange} // Handle change to update state
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
                                            id="contact"  
                                            name="contact"
                                            value ={clearanceInput?.contact || ""}
                                            onChange={(e) => {
                                              const input = e.target.value;
                                              // Only allow digits and limit to 11 characters
                                              if (/^\d{0,11}$/.test(input)) {
                                                handleChange(e);
                                              }
                                            }}
                                            className="input-field" 
                                            required 
                                            maxLength={11}  
                                            pattern="^[0-9]{11}$" 
                                            placeholder="Please enter a valid 11-digit contact number" 
                                            title="Please enter a valid 11-digit contact number. Format: 09XXXXXXXXX"        
                                            />
                                    </div>
                                    

                                </div>
                            </div>

                        </div>

                        <div className="main-fields-container-section2">
                            <div className="fields-container">
                                {clearanceInput.purpose === "Residency" && (
                                      <>
                                        <div className="fields-section">
                                          <label htmlFor="attestedBy" className="form-label">Attested By Hon Kagawad: <span className="required">*</span></label>
                                          <input 
                                            type="text"  
                                            id="attestedBy"  
                                            name="attestedBy"  
                                            value={clearanceInput.attestedBy}
                                            onChange={handleChange}
                                            className="headline"  
                                            required 
                                            placeholder="Enter Hon Kagawad's Full Name"  
                                          />
                                        </div>
                                        <div className="fields-section">
                                          <label htmlFor="CYFrom" className="form-label">Cohabitation Year From:<span className="required">*</span></label>
                                          <select
                                            id="CYFrom"
                                            name="CYFrom"
                                            value={clearanceInput.CYFrom}
                                            onChange={handleChange}
                                            className="headline"
                                            required
                                          >
                                            <option value="" disabled>Select Year</option>
                                            {[...Array(100)].map((_, i) => {
                                              const year = new Date().getFullYear() - i;
                                              const cyTo = parseInt(clearanceInput.CYTo || "");
                                              const isDisabled = !isNaN(cyTo) && year >= cyTo;
                                              return (
                                                <option key={year} value={year} disabled={isDisabled}>
                                                  {year}
                                                </option>
                                              );
                                            })}
                                          </select>
                                        </div>
                                        
                                        <div className="fields-section">
                                          <label htmlFor="CYTo" className="form-label">Cohabitation Year To:<span className="required">*</span></label>
                                          <select
                                            id="CYTo"
                                            name="CYTo"
                                            value={clearanceInput.CYTo}
                                            onChange={handleChange}
                                            className="headline"
                                            required
                                          >
                                            <option value="" disabled>Select Year</option>
                                            {[...Array(100)].map((_, i) => {
                                              const year = new Date().getFullYear() - i;
                                              const cyFrom = parseInt(clearanceInput.CYFrom || "1");
                                              const isDisabled = !isNaN(cyFrom) && year <= cyFrom;
                                              return (
                                                <option key={year} value={year} disabled={isDisabled}>
                                                  {year}
                                                </option>
                                              );
                                            })}
                                          </select>
                                      </div>
                                      </>
                                )}
                                {clearanceInput.purpose === "Occupancy /  Moving Out" && (
                                  <>
                                    <div className="fields-section">
                                      <label htmlFor="toAddress" className="form-label">To Address<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="toAddress"  
                                        name="toAddress"  
                                        value={clearanceInput.toAddress}
                                        onChange={handleChange}
                                        className="headline"  
                                        required 
                                        placeholder="Enter To Address"  
                                      />
                                    </div>
                                  </>
                                )}
                                {(clearanceInput.purpose === "Death Residency"|| clearanceInput.purpose === "Estate Tax") && (
                                  <div className="fields-section">
                                    <label htmlFor="dateofdeath" className="form-label">Date Of Death<span className="required">*</span></label>
                                    <input 
                                      type="date" 
                                      id="dateofdeath" 
                                      name="dateofdeath" 
                                      className="headline" 
                                      value={clearanceInput.dateofdeath}
                                      onKeyDown={(e) => e.preventDefault()} // Prevent manual input

                                      onChange={handleChange}
                                      required 
                                      max={getLocalDateString(new Date())} // Set max date to today
                                    />
                                  </div>
                                )}

                                {clearanceInput.purpose === "Estate Tax" && (
                                  <>
                                    <div className="fields-section">
                                      <label htmlFor="estateSince" className="form-label">Estate Since:<span className="required">*</span></label>
                                      <select
                                        id="estateSince"
                                        name="estateSince"
                                        value={clearanceInput.estateSince}
                                        onChange={handleChange}
                                        className="headline"
                                        required
                                      >
                                        <option value="" disabled>Select Year</option>
                                        {[...Array(150)].map((_, i) => {
                                          const year = new Date().getFullYear() - i;
                                          return (
                                            <option key={year} value={year}>
                                              {year}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                  </>
                                )}

                                {clearanceInput.purpose === "Good Moral and Probation" && (
                                  <>
                                    <div className="fields-section">
                                      <label htmlFor="goodMoralPurpose" className="form-label">Purpose of Good Moral and Probation:<span className="required">*</span></label>
                                      <select
                                        id="goodMoralPurpose"
                                        name="goodMoralPurpose"
                                        className="headline"
                                        value={clearanceInput.goodMoralPurpose}
                                        onChange={handleChange}
                                        required
                                        >
                                        <option value="" disabled>Select Purpose</option>
                                        <option value = "Legal Purpose and Intent">Legal Purpose and Intent</option>
                                        <option value = "Others">Others</option>
                                      </select>
                                    </div>
                                    {clearanceInput.goodMoralPurpose === "Others" && (
                                      <>
                                        <div className="fields-section">
                                          <label htmlFor="goodMoralOtherPurpose" className="form-label">Please Specify Other Purpose:<span className="required">*</span></label>
                                          <input 
                                            type="text"  
                                            id="goodMoralOtherPurpose"  
                                            name="goodMoralOtherPurpose"  
                                            value={clearanceInput.goodMoralOtherPurpose}
                                            onChange={handleChange}
                                            className="headline"  
                                            required 
                                            placeholder="Enter Other Purpose"
                                          />
                                        </div>
                                      </>
                                    )}

                                  </>
                                )}
                                {clearanceInput.purpose === "Guardianship" && (
                                  <>
                                    <div className="fields-section">
                                    <label htmlFor="guardianshipType" className="form-label">Type of Guardianship Certificate<span className="required">*</span></label>
                                        <select
                                          id="guardianshipType"  
                                          name="guardianshipType"  
                                          className="headline"  
                                          value={clearanceInput.guardianshipType}
                                          onChange={handleChange}
                                          required
                                        >
                                          <option value="" disabled>Select Type of Guardianship</option>
                                          <option value="School Purpose">For School Purpose</option>
                                          <option value="Legal Purpose">For Other Legal Purpose</option>
                                        </select>
                                    </div>
                                
                                    <div className="fields-section">
                                    <label htmlFor="wardRelationship" className="form-label">Guardian's Relationship Towards the Ward<span className="required">*</span></label>
                                        <select
                                          id="wardRelationship"  
                                          name="wardRelationship"  
                                          className="headline"  
                                          value={clearanceInput.wardRelationship}
                                          onChange={handleChange}
                                          required
                                        >
                                          <option value="" disabled>Select Type of Relationship</option>
                                          <option value="Grandmother">Grandmother</option>
                                          <option value="Grandfather">Grandfather</option>
                                          <option value="Father">Father</option>
                                          <option value="Mother">Mother</option>
                                          <option value="Aunt">Aunt</option>
                                          <option value="Uncle">Uncle</option>
                                          <option value="Sister">Sister</option>
                                          <option value="Brother">Brother</option>
                                        </select>
                                    </div>
                                
                                    <div className="fields-section">
                                    <label htmlFor="wardFname" className="form-label">Ward's Full Name<span className="required">*</span></label>
                                        <input 
                                          type="text"  
                                          id="wardFname"  
                                          name="wardFname"  
                                          value={clearanceInput.wardFname}
                                          onChange={handleChange}
                                          className="headline"  
                                          required 
                                          placeholder={`Enter Ward's Full Name`}
                                        />
                                    </div>
                                
                                  </>
                                )}

                                { clearanceInput.purpose === "Garage/TRU" && (
                                  <>  
                                    <div className="fields-section">
                                      <label htmlFor="businessname" className="form-label">Business Name<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="businessname"  
                                        name="businessName"  
                                        className="headline"  
                                        required 
                                        placeholder="Enter Business Name"  
                                        value={clearanceInput.businessName}
                                        onChange={handleChange}
                                      />
                                    </div>            
                                    <div className="fields-section">
                                      <label htmlFor="businessloc" className="form-label">Business Location<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="businessloc"  
                                        name="businessLocation"  
                                        className="headline"  
                                        value={clearanceInput.businessLocation}
                                        onChange={handleChange}
                                        required 
                                        placeholder="Enter Business Location"  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="noOfVechicles" className="form-label">Nos Of Tricycle<span className="required">*</span></label>
                                      <input 
                                        type="number"  
                                        id="noOfVechicles"  
                                        name="noOfVechicles"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.noOfVechicles||1}
                                        onChange={handleChange}
                                        min={1}
                                        onKeyDown={(e)=> {
                                          if (e.key === 'e' || e.key === '-' || e.key === '+') {
                                            e.preventDefault(); // Prevent scientific notation and negative/positive signs
                                          }
                                        }
                                        } // Prevent manual input
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="businessnature" className="form-label">Nature of Business<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="businessnature"  
                                        name="businessNature"  
                                        value={clearanceInput.businessNature}
                                        onChange={handleChange}
                                        className="headline"  
                                        required 
                                        placeholder="Enter Business Nature"  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleMake" className="form-label">Tricycle Make<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="vehicleMake"  
                                        name="vehicleMake"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleMake}
                                        onChange={handleChange}
                                        placeholder="Enter Tricycle Make"  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleType" className="form-label">Tricycle Type<span className="required">*</span></label>
                                      <select
                                        id="vehicleType"  
                                        name="vehicleType"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleType}
                                        onChange={handleChange}

                                      >
                                        <option value="" disabled>Select Tricycle Type</option>
                                        <option value="Motorcycle w/ Sidecar">Motorcycle w/ Sidecar</option>
                                        <option value="Motorcycle w/o Sidecar">Motorcycle w/o Sidecar</option>
                                      </select>
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehiclePlateNo" className="form-label">Tricycle Plate No.<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="vehiclePlateNo"  
                                        name="vehiclePlateNo"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehiclePlateNo}
                                        onChange={handleChange}
                                        placeholder="Enter Tricycle Plate No."  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleSerialNo" className="form-label">Tricycle Serial No.<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="vehicleSerialNo"  
                                        name="vehicleSerialNo"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleSerialNo}
                                        onChange={handleChange}
                                        placeholder="Enter Tricycle Serial No."  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleChassisNo" className="form-label">Tricycle Chassis No.<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="vehicleChassisNo"  
                                        name="vehicleChassisNo"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleChassisNo}
                                        onChange={handleChange}
                                        placeholder="Enter Tricycle Chassis No."  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleEngineNo" className="form-label">Tricycle Engine No.<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="vehicleEngineNo"  
                                        name="vehicleEngineNo"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleEngineNo}
                                        onChange={handleChange}
                                        placeholder="Enter Tricycle Engine No."  
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleFileNo" className="form-label">Tricycle File No.<span className="required">*</span></label>
                                      <input 
                                        type="text"  
                                        id="vehicleFileNo"  
                                        name="vehicleFileNo"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleFileNo}
                                        onChange={handleChange}
                                        placeholder="Enter Tricycle File No."  
                                      />
                                    </div>
                                    
                                  </>
                                )}

                                {clearanceInput.purpose === "Garage/PUV" && (
                                  <>
                                    <div className="fields-section">
                                      <label htmlFor="goodMoralOtherPurpose" className="form-label">Certificate Purpose<span className="required">*</span></label>
                                      <input 
                                        type="text"
                                        id="goodMoralOtherPurpose"  
                                        name="goodMoralOtherPurpose"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.goodMoralOtherPurpose || ""}
                                        onChange={handleChange}
                                        placeholder="Enter Certificate Purpose"
                                      />    
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="vehicleType" className="form-label">Vehicle Description<span className="required">*</span></label>
                                      <input 
                                        type="text"
                                        id="vehicleType"  
                                        name="vehicleType"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.vehicleType || ""}
                                        onChange={handleChange}
                                        placeholder="Enter Vehicle Description"
                                      />
                                    </div>
                                    <div className="fields-section">
                                      <label htmlFor="noOfVechicles" className="form-label">Nos Of Vehicle/s<span className="required">*</span></label>
                                      <input 
                                        type="number"  
                                        id="noOfVechicles"  
                                        name="noOfVechicles"  
                                        className="headline"  
                                        required 
                                        value={clearanceInput.noOfVechicles || 1}
                                        onChange={handleChange}
                                        min={1}
                                        onKeyDown={(e)=> {
                                          if (e.key === 'e' || e.key === '-' || e.key === '+') {
                                            e.preventDefault(); // Prevent scientific notation and negative/positive signs
                                          }
                                        }
                                        } // Prevent manual input
                                      />
                                    </div>
                                  </>
                                )}
                                {clearanceInput.purpose === "No Income"  && (
                                  <>
                                    <div className="fields-section">
                                      <label htmlFor="noIncomePurpose" className="form-label">Purpose Of No Income:<span className="required">*</span></label>
                                        <select 
                                          id="noIncomePurpose"  
                                          name="noIncomePurpose"  
                                          value={clearanceInput.noIncomePurpose}
                                          onChange={handleChange}
                                          className="headline"  
                                          required 
                                        >
                                          <option value="" disabled>Select Purpose</option>
                                          <option value="SPES Scholarship">SPES Scholarship</option>
                                          <option value="ESC Voucher">DEPED Educational Services Contracting (ESC) Voucher</option>
                                        </select>
                                    </div>
                                                    
                                    <div className="fields-section">
                                      <label htmlFor="noIncomeChildFName" className="form-label">Son/Daugther's Name<span className="required">*</span></label>
                                        <input 
                                          type="text"  
                                          id="noIncomeChildFName"  
                                          name="noIncomeChildFName"  
                                          value={clearanceInput.noIncomeChildFName}
                                          onChange={handleChange}
                                          className="headline"  
                                          required 
                                          placeholder={`Enter Child's Full Name`}
                                        />
                                    </div>
                                                    
                                  </>
                                )}
                                {(clearanceInput.purpose === "Cohabitation") && (<>
                                  <div className="fields-section">
                                    <label htmlFor="partnerWifeHusbandFullName" className="form-label">Partner's/Wife's/Husband's Full Name<span className="required">*</span></label>
                                    <input 
                                      type="text"  
                                      id="partnerWifeHusbandFullName"  
                                      name="partnerWifeHusbandFullName"  
                                      className="headline"  
                                      required  
                                      placeholder="Enter Full Name" 
                                      value={clearanceInput.partnerWifeHusbandFullName}
                                      onChange={handleChange}
                                    />
                                  </div>
                                  <div className="fields-section">
                                    <label htmlFor="cohabitationRelationship" className="form-label">
                                      Type Of Relationship<span className="required">*</span>
                                    </label>
                                    <select
                                      id="cohabitationRelationship"
                                      name="cohabitationRelationship"
                                      className="headline"
                                      value={clearanceInput.cohabitationRelationship}
                                      onChange={handleChange}
                                      required
                                    >
                                      <option value="" disabled>Select Type of Relationship</option>
                                      <option value="Husband And Wife">Husband And Wife</option>
                                      <option value="Partners">Partners</option>
                                    </select>
                                  </div>

                                  <div className="fields-section">
                                    <label htmlFor="cohabitationStartDate" className="form-label">
                                      Start Of Cohabitation<span className="required">*</span>
                                    </label>
                                    <input 
                                    type = "date" 
                                    id="cohabitationStartDate"
                                    name="cohabitationStartDate"
                                    className="headline"
                                    value={clearanceInput.cohabitationStartDate}
                                    onChange={handleChange}
                                    onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                                    required
                                    max = {getLocalDateString(new Date())} // Set max date to today
                                    />
                                  </div>
                                </>)}

                                <div className="fields-section">
                                    <p>Requestor's Title</p>
                                    <select 
                                        id="requestorMrMs" 
                                        name="requestorMrMs" 
                                        className="headline" 
                                        required
                                        value ={clearanceInput?.requestorMrMs || ""}
                                        onChange={handleChange} // Handle change to update state
                                    >
                                        <option value="" disabled>Select title</option>
                                        <option value="Mr.">Mr.</option>
                                        <option value="Ms.">Ms.</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Requestor's Name</p>
                                    <input 
                                        type="text" 
                                        value ={clearanceInput?.requestorFname || ""}
                                        onChange={handleChange} // Handle change to update state
                                        required
                                        id="requestorFname"
                                        name="requestorFname"
                                        className="headline" 
                                        placeholder="Enter Requestor's Name" 
                                    />
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
                                    name="file-upload1" // Use the same name as in the clearanceInput state
                                                                            
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
                
                </form>
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

