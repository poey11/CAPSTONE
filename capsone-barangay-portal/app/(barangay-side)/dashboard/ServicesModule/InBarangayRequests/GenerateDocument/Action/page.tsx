"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useState, useEffect,useRef } from "react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";
import { getLocalDateString } from "@/app/helpers/helpers";
import {customAlphabet} from "nanoid";
import { addDoc, collection, getDocs} from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getSpecificCountofCollection } from "@/app/helpers/firestorehelper";
import { useSession } from "next-auth/react";


interface EmergencyDetails {
  fullName?: string;
  address?: string;
  relationship?: string;
  contactNumber?: string;
}
interface UploadedFile {
  name: string;
  file?: Blob | globalThis.File;
  preview?: string;
}



interface ClearanceInput {
    residentId?: string;
    accID?: string;
    createdBy?: string;
    docType?: string;
    requestType?: string;
    requestId?: string;
    purpose?: string;
    createdAt?: string;
    fullName?: string;
    dateOfResidency?: string;
    dateofdeath?: string;
    address?: string;
    homeOrOfficeAddress?: string;
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
    projectLocation?: string;
    citizenship?: string;
    educationalAttainment?: string;
    course?: string;
    isBeneficiary?: boolean;
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
    identificationPicture?: File[];
    isResident?: boolean;
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
    const [isResidentSelected, setIsResidentSelected] = useState(false);
    const [isRequestorSelected, setIsRequestorSelected] = useState(false);
    const [showResidentsPopup, setShowResidentsPopup] = useState(false);
    const [residents, setResidents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [otherDocPurposes, setOtherDocPurposes] = useState<{ [key: string]: string[] }>({});
    const [forResidentOnlyMap, setForResidentOnlyMap] = useState<{ [title: string]: boolean }>({});
    const [otherDocFields, setOtherDocFields] = useState<{ [title: string]: string[] }>({});
    const [idPicture, setIdPicture] = useState<UploadedFile[]>([]);

    
    const employerPopupRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const fetchResidents = async () => {
          try {
            const residentsCollection = collection(db, "Residents");
                const residentsSnapshot = await getDocs(residentsCollection);
                const residentsList = residentsSnapshot.docs.map(doc => {
                    const data = doc.data() as {
                        residentNumber: string;
                        firstName: string;
                        middleName: string;
                        lastName: string;
                        address: string;
                        sex: string;
                        dateOfBirth: string;
                        age: number;
                        identificationFileURL: string
                    };
        
                    return {
                        id: doc.id,
                        ...data
                    };
                });
        
                setResidents(residentsList);
          } catch (error) {
            console.error("Error fetching residents:", error);
          }
        };
      
        fetchResidents();
        
      }, []);

      useEffect(() => {
        const fetchOtherDocumentPurposes = async () => {
          try {
            const otherDocsRef = collection(db, "OtherDocuments");
            const snapshot = await getDocs(otherDocsRef);
      
            const groupedTitles: { [key: string]: string[] } = {};
            const fieldMap: { [key: string]: string[] } = {};
            const residentOnlyMap: { [key: string]: boolean } = {};
      
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              const { type, title, fields, forResidentOnly } = data;
      
              if (type && title) {
                if (!groupedTitles[type]) groupedTitles[type] = [];
                groupedTitles[type].push(title);
      
                if (Array.isArray(fields)) {
                  fieldMap[title] = fields.map((f: any) => f.name);
                }

                residentOnlyMap[title] = !!forResidentOnly;
              }
            });

            console.log("Mapped OtherDoc Fields:", fieldMap); // <-- Add it here
      
            setOtherDocPurposes(groupedTitles);
            setOtherDocFields(fieldMap);
            setForResidentOnlyMap(residentOnlyMap); 
          } catch (error) {
            console.error("Error fetching OtherDocuments:", error);
          }
        };
      
        fetchOtherDocumentPurposes();
      }, []);

      
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
    

    const filteredResidents = residents.filter((resident) =>
        `${resident.firstName} ${resident.middleName} ${resident.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    useEffect(() => {
        setMaxDate(getLocalDateString(new Date()));
    },[]);

    const [number,setNumber] = useState(0);
    useEffect(() => {
        const fetchNumber = async () => {
            try {
                const count = await getSpecificCountofCollection("ServiceRequests", "accID", "INBRGY-REQ");
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
            let format = `${requestId} - ${nos}`;
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

    const handleResidentClick = () => {
      setShowResidentsPopup(true);
    };

    const handleIDPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const preview = URL.createObjectURL(file);
    
      setIdPicture([
        {
          file,
          name: file.name,
          preview,
        },
      ]);
    };

    const handleIDPictureDelete = () => {
      setIdPicture([]);
    };

    // Close popup when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          employerPopupRef.current &&
          !employerPopupRef.current.contains(event.target as Node)
        ) {
          setShowResidentsPopup(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

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
      let idPictureUrls: { name: string }[] = [];
  
      try {
          let i = 0;
          for (const file of files.container1) {
              const fileExtension = file.name.split('.').pop();
              const fileName = `${clearanceInput.requestId}-file${i}.${fileExtension}`;
              const storageRef = ref(storage, `ServiceRequests/${fileName}`);
  
              const snapshot = await uploadBytes(storageRef, file.file as Blob);
              const url = await getDownloadURL(snapshot.ref);
              uploadedFiles.push({ name: url });
              i++;
          }
  
         
          if (idPicture.length > 0) {
              const file = idPicture[0]; // only one allowed
              const ext = file.name.split('.').pop();
              const fileName = `${clearanceInput.requestId}-idpicture.${ext}`;
              const storageRef = ref(storage, `ServiceRequests/${fileName}`);
              const snapshot = await uploadBytes(storageRef, file.file as Blob);
              const url = await getDownloadURL(snapshot.ref);
              idPictureUrls = [{ name: url }];
          }
  
          return {
              docsRequired: uploadedFiles,
              identificationPicture: idPictureUrls
          };
      } catch (error) {
          console.error("Error uploading images:", error);
          return {
              docsRequired: [],
              identificationPicture: []
          };
      }
  };
    let id: string | undefined;
    const handleUploadClick = async () => {
      try {
        const uploadedFiles = await handleUploadImage(); // returns an object with two arrays
        console.log("Uploaded Files:", uploadedFiles);
    
        const docRef = collection(db, "ServiceRequests");
    
        const docData = {
          ...clearanceInput,
          requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname}`,
          docsRequired: uploadedFiles.docsRequired,
          identificationPicture: uploadedFiles.identificationPicture, 
        };
    
        console.log("Document Data:", docData);
        const doc = await addDoc(docRef, docData);
        console.log("Document written with ID: ", docData.requestId, " - ", doc.id);
        id = doc.id;
      } catch (error) {
        console.error("Error:", error);
      }
    };

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

const handleChange = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  const newValue =
    e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value;

  // Special case for birthday
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
      age: age.toString(),
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
          [keys[1]]: newValue,
        },
      };
    }
    return {
      ...prev,
      [name]: newValue,
    };
  });
};
      
    const [addOn, setAddOn] = useState<string>("");
    

    const allExistingPurpose = [
      /* Barangay Certificate */
      "Residency",
      "Occupancy /  Moving Out",
      "Estate Tax",
      "Death Residency",
      "No Income",
      "Cohabitation",
      "Guardianship",
      "Good Moral and Probation",
      "Garage/PUV",
      "Garage/TRU",  
      
      /* Other Documents */
      "Barangay ID",
      "First Time Jobseeker"
    ];

    const excludedPurposesFullName = [
      /* Barangay Certificate */
      "Residency",
      "Garage/PUV",
      "Garage/TRU",
      "No Income",
      "Good Moral and Probation",
      "Cohabitation",

      /* Other Documents */
      "Barangay ID",
      "First Time Jobseeker"
    ];



    const allExistingPermits = [
      "Business Permit",
      "Temporary Business Permit",
      "Construction"
    ];

    const fixedPredefinedFields = [
      "fullName",
      "requestorFname",
      "requestorMrMs",
      "address",
      "dateOfResidency",
      "birthday",
      "age",  
      "gender",   
      "civilStatus",
      "contact",
      "citizenship",
    ];

    /*
    const currentPurpose = clearanceInput.purpose || "";
    const customFields = (otherDocFields[currentPurpose] || []).filter(
      (fieldName) => !fixedPredefinedFields.includes(fieldName)
    );
    */




    const currentPurpose = clearanceInput.purpose || "";
    const currentDocType = docType || "";
    
    const isOtherDocumentPurpose = Object.keys(otherDocFields).includes(currentPurpose);
    const isBarangayPermitType = otherDocPurposes["Barangay Permit"]?.includes(currentDocType);
    
    const customFields = (
      isOtherDocumentPurpose
        ? otherDocFields[currentPurpose]
        : isBarangayPermitType
          ? otherDocFields[currentDocType]
          : []
    )?.filter((fieldName) => !fixedPredefinedFields.includes(fieldName)) || [];


    
    useEffect(() => {
      if ((clearanceInput.purpose === "Death Residency" || clearanceInput.purpose === "Estate Tax" ) && docType === "Barangay Certificate") setAddOn("Deceased's ");
      else if(clearanceInput.purpose === "Occupancy /  Moving Out" && docType === "Barangay Certificate")setAddOn("From ");
      else if(clearanceInput.purpose === "Guardianship" && docType === "Barangay Certificate") setAddOn("Guardian's ");
      else setAddOn(" ");
      
    }, [clearanceInput.purpose, docType]);


    const [activeSection, setActiveSection] = useState("basic");
    const isForMyself = clearanceInput.requestType === "forMyself";
    const [selectingFor, setSelectingFor] = useState<"fullName" | "requestor" | null>(null);
    


    return (
        <main className="createRequest-main-container">
          {/* NEW */}
          <form  onSubmit={handleSubmit}>
            <div className="createRequest-inbrgy-main-content">
              <div className="createRequest-inbrgy-main-section1">
                <div className="createRequest-inbrgy-main-section1-left">
                  <button onClick={handleBack}>
                    <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                  </button>

                  <h1> {docType} </h1>
                </div>

                <div className="action-btn-section">
                  <button type="button" className="discard-btn" onClick={handleDiscardClick}>
                    Discard
                  </button>
                  <button type="submit" className="save-btn">
                    Create
                  </button>
                </div>
              </div>

              <div className="createRequest-bottom-section">
                <nav className="createRequest-info-toggle-wrapper">
                  {["basic", "full", "others"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    > 
                      {section === "basic" && "Basic Info"}
                      {section === "full" && "Full Info"}
                      {section === "others" && "Others"}
                    </button>
                  ))}
                </nav>

                <div className="createRequest-bottom-section-scroll">
                  {activeSection === "basic" && (
                    <>

                    <div className="createRequest-section-2-full-top">
                      <div className="createRequest-section-2-left-side">
                        <div className="fields-section">
                          <h1>Request ID<span className="required">*</span></h1>
                          <input 
                            value ={clearanceInput.requestId || ""}
                            onChange={handleChange} // Handle change to update state
                            required
                            type="text"
                            id="requestId"
                            name="requestId"
                            className="createRequest-input-field" 
                            disabled
                          />
                        </div>

                        {docType !== "Construction" && !otherDocPurposes["Barangay Permit"]?.includes(docType || "") && (
                        <>
                        <div className="fields-section">
                          <h1>Purpose<span className="required">*</span></h1>
                          <select 
                            id="purpose" 
                            name="purpose" 
                            className="createRequest-input-field" 
                            required
                            value ={clearanceInput?.purpose || ""}
                            onChange={handleChange} // Handle change to update state
                          >
                          <option value="" disabled>Select purpose</option>
                            {docType === "Barangay Certificate" ? (
                              <>
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

                                {/* Dynamically fetched purposes from OtherDocuments */}

                                {otherDocPurposes["Barangay Certificate"]?.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}               
                              </>
                            ):docType === "Barangay Clearance" ? (
                              <>
                                <option value="Loan">Loan</option>
                                <option value="Bank Transaction">Bank Transaction</option>
                                <option value="Residency">Residency</option>
                                <option value="Local Employment">Local Employment</option>
                                <option value="Maynilad">Maynilad</option>
                                <option value="Meralco">Meralco</option>
                                <option value="Bail Bond">Bail Bond</option>

                                {/* Dynamically fetched purposes from OtherDocuments */}

                                {otherDocPurposes["Barangay Clearance"]?.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}
                              </>
                            ):docType === "Barangay Indigency" ? (
                              <>
                                <option value="No Income">No Income</option>
                                <option value="Public Attorneys Office">Public Attorneys Office</option>
                                <option value="AKAP">AKAP</option>
                                <option value="Financial Subsidy of Solo Parent">Financial Subsidy of Solo Parent</option>
                                <option value="Fire Emergency">Fire Emergency</option>
                                <option value="Flood Victims">Flood Victims</option>
                                <option value="Philhealth Sponsor">Philhealth Sponsor</option>
                                <option value="Medical Assistance">Medical Assistance</option>

                                {/* Dynamically fetched purposes from OtherDocuments */}
                                              
                                {otherDocPurposes["Barangay Indigency"]?.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}

                              </>
                            ) : docType === "Business Permit" || docType === "Temporary Business Permit" ? (
                              <>
                                <option value="New">New</option>
                                <option value="Renewal">Renewal</option>
                              </>
                            ) : docType === "Other Documents" ? (
                              <>
                                <option value="Barangay ID">Barangay ID</option>
                                <option value="First Time Jobseeker">First Time Jobseeker</option>

                                {otherDocPurposes["Other"]?.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}
                              </>
                            ) : null}
                          </select>
                        </div>
                      </>
                      )}

                      {(
                        allExistingPermits.includes(docType || "") ||
                        (
                          otherDocPurposes["Barangay Permit"]?.includes(docType || "") && 
                          forResidentOnlyMap[docType || ""] === true
                        )
                      ) && (
                          <>
                            <div className="beneficiary-checkbox-container">
                              <input 
                                type="checkbox" 
                                name="isResident"  
                                checked={clearanceInput?.isResident || false}
                                onChange={handleChange}
                              />   
                              <label className="beneficiary-checkbox-label" htmlFor="forResidentOnly" >
                                <p>Is requestor a resident?<span className="required">*</span></p> 
                              </label>
                                   
                            </div>
                          </>
                        )}
                        

                        {(
                          (
                            (!isOtherDocumentPurpose &&
                              !excludedPurposesFullName.includes(clearanceInput.purpose || "")) ||
                            (isOtherDocumentPurpose &&
                              otherDocFields[clearanceInput.purpose || ""]?.includes("fullName"))
                          ) &&
                          !allExistingPermits.includes(docType || "") &&
                          !otherDocPurposes["Barangay Permit"]?.includes(docType || "")
                        ) && (
                          <>
                            <div className="fields-section">
                              <h1>{addOn}Full Name<span className="required">*</span></h1>

                              <div className="createRequest-input-wrapper">
                                <div className="createRequest-input-with-clear">
                                  <input 
                                    type="text" 
                                    className="createRequest-select-resident-input-field" 
                                    placeholder={`Enter ${addOn}Full Name`}
                                    value={
                                      isResidentSelected
                                        ? clearanceInput.fullName
                                        : clearanceInput.fullName || ""
                                    }
                                    onClick={() => {
                                      setSelectingFor("fullName");
                                      setShowResidentsPopup(true);
                                    }}
                                    onChange={handleChange}
                                    required
                                    id="fullName"
                                    name="fullName"
                                    readOnly
                                    disabled={false} // Keep enabled to allow onClick even if readOnly
                                  />

                                  {isResidentSelected && (
                                    <span
                                      className="clear-icon"
                                      title="Click to clear selected resident"
                                      onClick={() => {
                                        const updatedInput = {
                                          ...clearanceInput,
                                          fullName: "",
                                        };
                                  
                                        if (["Estate Tax", "Death Residency"].includes(clearanceInput.purpose ?? "")) {
                                          updatedInput.address = "";
                                        }
                                  
                                        setClearanceInput(updatedInput);
                                        setIsResidentSelected(false);
                                      }}
                                    >
                                      ×
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {(
                          (!isOtherDocumentPurpose &&
                            allExistingPurpose.includes(clearanceInput.purpose || "")) ||
                          (isOtherDocumentPurpose &&
                            otherDocFields[clearanceInput.purpose || ""]?.includes("requestorFname")) ||
                          allExistingPermits.includes(docType || "") ||
                          otherDocPurposes["Barangay Permit"]?.includes(docType || "")
                        ) && (
                          <>
                            <div className="fields-section">
                              <h1>Requestor's Full Name<span className="required">*</span></h1>

                              <div className="createRequest-input-wrapper">
                                <div className="createRequest-input-with-clear">
                                  <input 
                                    type="text" 
                                    className="createRequest-select-resident-input-field" 
                                    placeholder="Enter Requestor's Name"
                                    value={clearanceInput.requestorFname ?? ""}
                                    onChange={handleChange}
                                    required
                                    id="requestorFname"
                                    name="requestorFname"
                                    readOnly={
                                      // 🔒 Only enable resident selection if docType is not a permit OR isResident is true
                                      !allExistingPermits.includes(docType || "") ||
                                      clearanceInput?.isResident
                                    }
                                    onClick={() => {
                                      // ✅ Trigger popup only if selecting is allowed
                                      if (
                                        !allExistingPermits.includes(docType || "") ||
                                        clearanceInput?.isResident
                                      ) {
                                        setSelectingFor("requestor");
                                        setShowResidentsPopup(true);
                                      }
                                    }}
                                  />

                                  {((
                                    !allExistingPermits.includes(docType || "") ||
                                    clearanceInput?.isResident
                                  ) && isRequestorSelected) && (
                                    <span
                                      className="clear-icon"
                                      title="Click to clear selected resident"
                                      onClick={() => {
                                        setClearanceInput({
                                          ...clearanceInput,
                                          requestorFname: "",
                                          requestorMrMs: "",
                                          address: "",
                                          gender: "",
                                          civilStatus: "",
                                          birthday: "",
                                          contact: "",
                                        });
                                        setIsRequestorSelected(false);
                                      }}
                                    >
                                      ×
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}


                        {clearanceInput.purpose === "Good Moral and Probation" && (
                          <>
                            <div className="fields-section">
                              <h1>Purpose of Good Moral and Probation:<span className="required">*</span></h1>
                              <select
                                id="goodMoralPurpose"
                                name="goodMoralPurpose"
                                className="createRequest-input-field"
                                value={clearanceInput.goodMoralPurpose}
                                onChange={handleChange}
                                required
                              >
                                <option value="" disabled>Select Purpose</option>
                                <option value = "Legal Purpose and Intent">Legal Purpose and Intent</option>
                                <option value = "Others">Others</option>
                              </select>
                            </div>
                          </>
                        )}

                        {clearanceInput.purpose === "Garage/PUV" && (
                          <>
                            <div className="fields-section">
                              <h1>Certificate Purpose<span className="required">*</span></h1>
                              <input 
                                type="text"
                                id="goodMoralOtherPurpose"  
                                name="goodMoralOtherPurpose"  
                                className="createRequest-input-field"  
                                required 
                                value={clearanceInput.goodMoralOtherPurpose || ""}
                                onChange={handleChange}
                                placeholder="Enter Certificate Purpose"
                              />    
                            </div>   
                          </>
                        )}

                        {clearanceInput.purpose === "No Income"  && (
                            <>
                              <div className="fields-section">
                                <h1>Purpose Of No Income:<span className="required">*</span></h1>
                                  <select 
                                    id="noIncomePurpose"  
                                    name="noIncomePurpose"  
                                    value={clearanceInput.noIncomePurpose}
                                    onChange={handleChange}
                                    className="createRequest-input-field"  
                                    required 
                                  >
                                    <option value="" disabled>Select Purpose</option>
                                    <option value="SPES Scholarship">SPES Scholarship</option>
                                    <option value="ESC Voucher">DEPED Educational Services Contracting (ESC) Voucher</option>
                                  </select>
                              </div>                    
                            </>
                        )}

                        {(clearanceInput.purpose === "Cohabitation") && (
                          <>
                            <div className="fields-section">
                              <h1>Partner's/Wife's/Husband's Full Name<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="partnerWifeHusbandFullName"  
                                  name="partnerWifeHusbandFullName"  
                                  className="createRequest-input-field"  
                                  required  
                                  placeholder="Enter Full Name" 
                                  value={clearanceInput.partnerWifeHusbandFullName}
                                  onChange={handleChange}
                                />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="createRequest-section-2-right-side">
                        {clearanceInput.purpose === "Guardianship" && (
                          <>
                            <div className="fields-section">
                              <h1>Type of Guardianship Certificate<span className="required">*</span></h1>
                              <select
                                id="guardianshipType"  
                                name="guardianshipType"  
                                className="createRequest-input-field"  
                                value={clearanceInput.guardianshipType}
                                onChange={handleChange}
                                required
                              >
                                <option value="" disabled>Select Type of Guardianship</option>
                                <option value="School Purpose">For School Purpose</option>
                                <option value="Legal Purpose">For Other Legal Purpose</option>
                              </select>
                            </div>
                          </>
                        )}

                        <div className="fields-section">
                          <h1>Requestor's Title<span className="required">*</span></h1>
                          <select 
                            id="requestorMrMs" 
                            name="requestorMrMs" 
                            className="createRequest-input-field" 
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
                          <h1>{addOn}Address<span className="required">*</span></h1>
                          <input 
                              type="text" 
                              value ={clearanceInput?.address || ""}
                              onChange={handleChange} // Handle change to update state
                              required
                              id="address"
                              name="address"
                              className="createRequest-input-field" 
                              placeholder={`Enter ${addOn}Address`} 
                              disabled={isResidentSelected} // Disable input if a resident is selected

                            />
                        </div>

                        <div className="fields-section">
                            <h1>Date of Residency<span className="required">*</span></h1>
                            <input 
                              value ={clearanceInput?.dateOfResidency || ""}
                              onChange={handleChange} // Handle change to update state
                              required
                              type="date"
                              id="dateOfResidency"
                              name="dateOfResidency" 
                              className="createRequest-input-field" 
                              max = {maxDate}
                              onKeyDown={(e) => e.preventDefault()}
                            />
                          </div>

                          {clearanceInput.purpose === "Good Moral and Probation" && (
                          <>

                            {clearanceInput.goodMoralPurpose === "Others" && (
                              <>
                                <div className="fields-section">
                                  <h1>Please Specify Other Purpose:<span className="required">*</span></h1>
                                  <input 
                                    type="text"  
                                    id="goodMoralOtherPurpose"  
                                    name="goodMoralOtherPurpose"  
                                    value={clearanceInput.goodMoralOtherPurpose}
                                    onChange={handleChange}
                                    className="createRequest-input-field"  
                                    required 
                                    placeholder="Enter Other Purpose"
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}


                        {clearanceInput.purpose === "No Income"  && (
                          <>               
                            <div className="fields-section">
                              <h1>Son/Daugther's Name<span className="required">*</span></h1>
                              <input 
                                type="text"  
                                id="noIncomeChildFName"  
                                name="noIncomeChildFName"  
                                value={clearanceInput.noIncomeChildFName}
                                onChange={handleChange}
                                className="createRequest-input-field"  
                                required 
                                placeholder={`Enter Child's Full Name`}
                              />
                            </div>                       
                          </>
                        )}
                      </div>
                      
                    </div>
                    
                    </>
                  )}

                  {activeSection === "full" && (
                    <>
                      <div className="createRequest-section-2-full-top">
                        <div className="createRequest-section-2-left-side">
                          <div className="fields-section">
                            <h1>Birthday<span className="required">*</span></h1>
                            <input 
                              type="date" 
                              className="createRequest-input-field" 
                              placeholder="Select Date From" 
                              id="birthday"
                              name="birthday"
                              value ={clearanceInput?.birthday || ""}
                              onChange={handleChange} // Handle change to update state
                              required
                              max={maxDate}  // Restrict the date to today or earlier
                              onKeyDown={(e) => e.preventDefault()}  // Prevent manual input
                              disabled={isResidentSelected} // Disable input if a resident is selected
                            />    
                          </div>

                          <div className="fields-section">
                            <h1>Age<span className="required">*</span></h1>
                            <input 
                              type="number"  // Ensures the input accepts only numbers
                              id="age"  
                              name="age" 
                              value ={clearanceInput?.age || ""}
                              onChange={handleChange} // Handle change to update state
                              className="createRequest-input-field" 
                              required 
                              min="1"  // Minimum age (you can adjust this as needed)
                              max="150"  // Maximum age (you can adjust this as needed)
                              placeholder="Enter Age"  
                              step="1"  // Ensures only whole numbers can be entered
                              disabled={true}  // Disable input to prevent manual changes
                            />
                          </div>

                          <div className="fields-section">
                            <h1>Gender<span className="required">*</span></h1>
                            <select 
                              id="gender" 
                              name="gender" 
                              className="createRequest-input-field" 
                              required
                              value ={clearanceInput?.gender}
                              onChange={handleChange} // Handle change to update state
                              disabled={isResidentSelected}
                            >
                              <option value="" disabled>Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          {clearanceInput.purpose === "Residency" && (
                            <>
                              <div className="fields-section">
                                <h1>Cohabitation Year From:<span className="required">*</span></h1>
                                <select
                                  id="CYFrom"
                                  name="CYFrom"
                                  value={clearanceInput.CYFrom}
                                  onChange={handleChange}
                                  className="createRequest-input-field"
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
                                <h1>Cohabitation Year To:<span className="required">*</span></h1>
                                <select
                                  id="CYTo"
                                  name="CYTo"
                                  value={clearanceInput.CYTo}
                                  onChange={handleChange}
                                  className="createRequest-input-field"
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
                                <h1>To Address<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="toAddress"  
                                  name="toAddress"  
                                  value={clearanceInput.toAddress}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter To Address"  
                                />
                              </div>
                            </>
                          )}

                          {(clearanceInput.purpose === "Death Residency"|| clearanceInput.purpose === "Estate Tax") && (
                            <div className="fields-section">
                              <h1>Date Of Death<span className="required">*</span></h1>
                              <input 
                                type="date" 
                                id="dateofdeath" 
                                name="dateofdeath" 
                                className="createRequest-input-field" 
                                value={clearanceInput.dateofdeath}
                                onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                                onChange={handleChange}
                                required 
                                max={getLocalDateString(new Date())} // Set max date to today
                              />
                            </div>
                          )}
                          {(clearanceInput.purpose === "Cohabitation") && (
                            <>
                              <div className="fields-section">
                                <h1> Type Of Relationship<span className="required">*</span></h1>
                                <select
                                  id="cohabitationRelationship"
                                  name="cohabitationRelationship"
                                  className="createRequest-input-field"
                                  value={clearanceInput.cohabitationRelationship}
                                  onChange={handleChange}
                                  required
                                >
                                  <option value="" disabled>Select Type of Relationship</option>
                                  <option value="Husband And Wife">Husband And Wife</option>
                                  <option value="Partners">Partners</option>
                                </select>
                              </div>     
                            </>
                          )}

                          {clearanceInput.purpose === "Guardianship" && (
                            <>           
                              <div className="fields-section">
                                <h1>Ward's Full Name<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="wardFname"  
                                  name="wardFname"  
                                  value={clearanceInput.wardFname}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder={`Enter Ward's Full Name`}
                                />
                              </div>
                            </>
                          )}

                          {clearanceInput.purpose === "Garage/PUV" && (
                            <>
                              <div className="fields-section">
                                <h1>Vehicle Description<span className="required">*</span></h1>
                                <input 
                                  type="text"
                                  id="vehicleType"  
                                  name="vehicleType"  
                                  className="createRequest-input-field"  
                                        required 
                                        value={clearanceInput.vehicleType || ""}
                                        onChange={handleChange}
                                        placeholder="Enter Vehicle Description"
                                />
                              </div>
                            </>
                          )}

                          {clearanceInput.purpose === "Garage/TRU" && (
                            <>  
                              <div className="fields-section">
                                <h1>Business Name<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="businessname"  
                                  name="businessName"  
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Business Name"  
                                  value={clearanceInput.businessName}
                                  onChange={handleChange}
                                />
                              </div>  

                              <div className="fields-section">
                                <h1>Nature of Business<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="businessnature"  
                                  name="businessNature"  
                                  value={clearanceInput.businessNature}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Business Nature"  
                                />
                              </div>   

                              <div className="fields-section">
                                <h1>Business Location<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="businessloc"  
                                  name="businessLocation"  
                                  className="createRequest-input-field"  
                                  value={clearanceInput.businessLocation}
                                  onChange={handleChange}
                                  required 
                                  placeholder="Enter Business Location"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Nos Of Tricycle<span className="required">*</span></h1>
                                <input 
                                  type="number"  
                                  id="noOfVechicles"  
                                  name="noOfVechicles"  
                                  className="createRequest-input-field"  
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
                                <h1>Tricycle Make<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="vehicleMake"  
                                  name="vehicleMake"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehicleMake}
                                  onChange={handleChange}
                                  placeholder="Enter Tricycle Make"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Tricycle Type<span className="required">*</span></h1>
                                <select
                                  id="vehicleType"  
                                  name="vehicleType"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehicleType}
                                  onChange={handleChange}

                                >
                                  <option value="" disabled>Select Tricycle Type</option>
                                  <option value="Motorcycle w/ Sidecar">Motorcycle w/ Sidecar</option>
                                  <option value="Motorcycle w/o Sidecar">Motorcycle w/o Sidecar</option>
                                </select>
                              </div>      
                            </>
                          )}

                          {clearanceInput.purpose === "Barangay ID" && (
                            <>
                              <div className="fields-section">
                                <h1>Birthplace<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="birthplace"  
                                  name="birthplace"  
                                  value={clearanceInput.birthplace || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Birthplace"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Religion<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="religion"  
                                  name="religion"  
                                  value={clearanceInput.religion || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Religion"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Nationality<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="nationality"  
                                  name="nationality"  
                                  value={clearanceInput.nationality || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Nationality"  
                                />
                              </div>
                              
                              <div className="fields-section">
                                <h1>Precinct Number<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="precinctnumber"  
                                  name="precinctnumber"  
                                  value={clearanceInput.precinctnumber || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Precinct Number"  
                                />
                              </div>
                              
                            </>
                          )}

                          {clearanceInput.purpose === "First Time Jobseeker" && (
                            <>
                              <div className="fields-section">
                                <h1>Educational Attainment<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="educationalAttainment"  
                                  name="educationalAttainment"  
                                  value={clearanceInput.educationalAttainment  || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Educational Attainment"  
                                />
                              </div>
                            </>
                          )}

                          {(docType === "Business Permit" || docType === "Temporary Business Permit") && (
                            <>
                              <div className="fields-section">
                                <h1>Business Name<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="businessName"  
                                  name="businessName"  
                                  value={clearanceInput.businessName || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Business Name"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Business Location<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="businessLocation"  
                                  name="businessLocation"  
                                  value={clearanceInput.businessLocation || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Business Location"  
                                />
                              </div>

                            </>
                          )}

                          {docType === "Construction"  && (
                            <>
                              <div className="fields-section">
                                <h1>Type of Construction Activity<span className="required">*</span></h1>
                                <select 
                                  id="typeofconstruction" 
                                  name="typeofconstruction" 
                                  className="createRequest-input-field" 
                                  required
                                  value ={clearanceInput?.typeofconstruction}
                                  onChange={handleChange} // Handle change to update state
                                >
                                  <option value="" disabled>Select Construction Activity</option>
                                  <option value="Structure">Structure</option>
                                  <option value="Renovation">Renovation</option>
                                  <option value="Excavation">Excavation</option>
                                  <option value="Demolition">Demolition</option>
                                </select>
                              </div>

                              <div className="fields-section">
                                <h1>Type of Building<span className="required">*</span></h1>
                                <select 
                                  id="typeofbldg" 
                                  name="typeofbldg" 
                                  className="createRequest-input-field" 
                                  required
                                  value ={clearanceInput?.typeofbldg}
                                  onChange={handleChange} // Handle change to update state
                                >
                                  <option value="" disabled>Select Type of Building</option>
                                  <option value="Residential">Residential</option>
                                  <option value="Commercial">Commercial</option>
                                  <option value="Institutional">Institutional</option>
                                  <option value="Industrial">Industrial</option>
                                  <option value="Mixed-Use">Mixed-Use</option>
                                  <option value="Others">Others</option>
                                </select>
                              </div>
                              
                                {clearanceInput.typeofbldg === "Others" && (
                                <div className="fields-section">
                                  <input
                                    type="text"
                                    id="othersTypeofbldg"
                                    name="othersTypeofbldg"
                                    className="createRequest-input-field" 
                                    value ={clearanceInput?.othersTypeofbldg}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter Other Type of Building"
                                  />
                                </div>
                                )}
                              

                              <div className="fields-section">
                                <h1>Home / Office Address<span className="required">*</span></h1>
                                <input 
                                  value ={clearanceInput?.homeOrOfficeAddress || ""}
                                  onChange={handleChange} 
                                  required
                                  type="text" 
                                  id="homeOrOfficeAddress"
                                  name="homeOrOfficeAddress"
                                  className="createRequest-input-field" 
                                  placeholder="Enter Home / Office Address" 
                                />
                              </div>

                            </>
                          )}
                        </div>

                        <div className="createRequest-section-2-right-side">
                          <div className="fields-section">     
                            <h1>Contact Number<span className="required">*</span></h1>
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
                              className="createRequest-input-field" 
                              required 
                              maxLength={11}  
                              pattern="^[0-9]{11}$" 
                              placeholder="Enter a valid 11-digit contact number" 
                              title="Enter a valid 11-digit contact number. Format: 09XXXXXXXXX"        
                              disabled={isResidentSelected}
                            />
                          </div>

                          <div className="fields-section">
                            <h1>Civil Status<span className="required">*</span></h1>  
                            <select 
                              value ={clearanceInput?.civilStatus}
                              onChange={handleChange}
                              id="civilStatus" 
                              name="civilStatus" 
                              className="createRequest-input-field" 
                              required
                              disabled={isResidentSelected} // Disable input if a resident is selected
                            >
                              <option value="" disabled>Select civil status</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Widow">Widow</option>
                              <option value="Separated">Separated</option>
                            </select>
                          </div>

                          <div className="fields-section">
                            <h1>Citizenship<span className="required">*</span></h1>
                            <input 
                              value ={clearanceInput?.citizenship || ""}
                              onChange={handleChange} 
                              required
                              type="text" 
                              id="citizenship"
                              name="citizenship"
                              className="createRequest-input-field" 
                              placeholder="Enter Citizenship" 
                            />
                          </div>
                          
                          {clearanceInput.purpose === "Residency" && (
                            <>
                              <div className="fields-section">
                                <h1>Attested By Hon Kagawad:<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="attestedBy"  
                                  name="attestedBy"  
                                  value={clearanceInput.attestedBy || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Hon Kagawad's Full Name"  
                                />
                              </div>             
                            </>
                          )}

                          {clearanceInput.purpose === "Estate Tax" && (
                            <>
                              <div className="fields-section">
                                <h1>Estate Since:<span className="required">*</span></h1>
                                <select
                                  id="estateSince"
                                  name="estateSince"
                                  value={clearanceInput.estateSince}
                                  onChange={handleChange}
                                  className="createRequest-input-field"
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

                          {(clearanceInput.purpose === "Cohabitation") && (
                            <>  
                              <div className="fields-section">
                                <h1>Start Of Cohabitation<span className="required">*</span></h1>
                                <input 
                                  type = "date" 
                                  id="cohabitationStartDate"
                                  name="cohabitationStartDate"
                                  className="createRequest-input-field"
                                  value={clearanceInput.cohabitationStartDate}
                                  onChange={handleChange}
                                  onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                                  required
                                  max = {getLocalDateString(new Date())} // Set max date to today
                                />
                              </div>
                            </>
                          )}

                          {clearanceInput.purpose === "Guardianship" && (
                            <>
                              <div className="fields-section">
                                <h1>Guardian's Relationship Towards the Ward<span className="required">*</span></h1>
                                <select
                                  id="wardRelationship"  
                                  name="wardRelationship"  
                                  className="createRequest-input-field"  
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
                            </>
                          )}

                          {clearanceInput.purpose === "Garage/PUV" && (
                            <>
                              <div className="fields-section">
                                <h1>Nos Of Vehicle/s<span className="required">*</span></h1>
                                <input 
                                  type="number"  
                                  id="noOfVechicles"  
                                  name="noOfVechicles"  
                                  className="createRequest-input-field"  
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

                          {clearanceInput.purpose === "Garage/TRU" && (
                            <>  
                              <div className="fields-section">
                                <h1>Tricycle Plate No.<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="vehiclePlateNo"  
                                  name="vehiclePlateNo"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehiclePlateNo}
                                  onChange={handleChange}
                                  placeholder="Enter Tricycle Plate No."  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Tricycle Serial No.<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="vehicleSerialNo"  
                                  name="vehicleSerialNo"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehicleSerialNo}
                                  onChange={handleChange}
                                  placeholder="Enter Tricycle Serial No."  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Tricycle Chassis No.<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="vehicleChassisNo"  
                                  name="vehicleChassisNo"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehicleChassisNo}
                                  onChange={handleChange}
                                  placeholder="Enter Tricycle Chassis No."  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Tricycle Engine No.<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="vehicleEngineNo"  
                                  name="vehicleEngineNo"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehicleEngineNo}
                                  onChange={handleChange}
                                  placeholder="Enter Tricycle Engine No."  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Tricycle File No.<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="vehicleFileNo"  
                                  name="vehicleFileNo"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.vehicleFileNo}
                                  onChange={handleChange}
                                  placeholder="Enter Tricycle File No."  
                                />
                              </div>     
                            </>
                          )}

                          {clearanceInput.purpose === "Barangay ID" && (
                            <>
                              <div className="fields-section">
                                <h1>Occupation<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="occupation"  
                                  name="occupation"  
                                  value={clearanceInput.occupation  || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Occupation"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Blood Type<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="bloodtype"  
                                  name="bloodtype"  
                                  value={clearanceInput.bloodtype || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Occupation"  
                                />
                              </div>
                              
                              <div className="fields-section">
                                <h1>Height<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="height"  
                                  name="height"  
                                  value={clearanceInput.height || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Height"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Weight<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="weight"  
                                  name="weight"  
                                  value={clearanceInput.weight || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Weight"  
                                />
                              </div>
                            </>
                          )}

                          {clearanceInput.purpose === "First Time Jobseeker" && (
                            <>
                              <div className="fields-section">
                                <h1>Course<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="course"  
                                  name="course"  
                                  value={clearanceInput.course  || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Course"  
                                />
                              </div>
                            </>
                          )}

                          {(docType === "Business Permit" || docType === "Temporary Business Permit") && (
                            <>
                              <div className="fields-section">
                                <h1>Business Nature<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="businessNature"  
                                  name="businessNature"  
                                  value={clearanceInput.businessNature || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Business Nature"  
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Estimated Capital<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="estimatedCapital"  
                                  name="estimatedCapital"  
                                  value={clearanceInput.estimatedCapital || ""}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder="Enter Estimated Capital"  
                                />
                              </div>

                            </>
                          )}

                          {docType === "Construction"  && (
                            <>

                              <div className="fields-section">
                                <h1>Project Name<span className="required">*</span></h1>
                                <input 
                                  value ={clearanceInput?.projectName || ""}
                                  onChange={handleChange} 
                                  required
                                  type="text" 
                                  id="projectName"
                                  name="projectName"
                                  className="createRequest-input-field" 
                                  placeholder="Enter Project Name" 
                                />
                              </div>

                              <div className="fields-section">
                                <h1>Project Location<span className="required">*</span></h1>
                                <input 
                                  value ={clearanceInput?.projectLocation || ""}
                                  onChange={handleChange} 
                                  required
                                  type="text" 
                                  id="projectLocation"
                                  name="projectLocation"
                                  className="createRequest-input-field" 
                                  placeholder="Enter Project Location" 
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      
                      <div className="createRequest-section-2-full-bottom">

                        <div className="createRequest-section-2-left-side">
                          {/* Fields for Added Barangay Certificate Document Purpose */}
                          {customFields.filter((_, i) => i % 2 === 0).map((fieldName) => (
                            <div key={fieldName} className="fields-section">
                              <h1>{fieldName}<span className="required">*</span></h1>
                              <input
                                type="text"
                                id={fieldName}
                                name={fieldName}
                                className="createRequest-input-field"
                                required
                                value={(clearanceInput as any)[fieldName] || ""}
                                onChange={handleChange}
                                placeholder={`Enter ${fieldName}`}
                              />
                            </div>
                          ))}

                          {/* Add Fields for Added Barangay Permit Document  */}
                        </div>

                        <div className="createRequest-section-2-right-side">
                          {/* Fields for Added Barangay Certificate Document Purpose */}
                          {customFields.filter((_, i) => i % 2 === 1).map((fieldName) => (
                            <div key={fieldName} className="fields-section">
                              <h1>{fieldName}<span className="required">*</span></h1>
                              <input
                                type="text"
                                id={fieldName}
                                name={fieldName}
                                className="createRequest-input-field"
                                required
                                value={(clearanceInput as any)[fieldName] || ""}
                                onChange={handleChange}
                                placeholder={`Enter ${fieldName}`}
                              />
                            </div>
                          ))}

                           {/* Add Fields for Added Barangay Permit Document  */}
                        </div>
                      </div>

                      <div className="createRequest-section-2-full-bottom-beneficiary">
                      {clearanceInput.purpose === "First Time Jobseeker" && (
                          <>
                            <div className="beneficiary-checkbox-container">
                            <input 
                                        type="checkbox" 
                                        name="isBeneficiary"  
                                        checked={clearanceInput?.isBeneficiary || false}
                                        onChange={handleChange}
                                    />   
                              <label className="beneficiary-checkbox-label" htmlFor="forResidentOnly" >
                                <p>Is beneficiary of a JobStart Program under RA No. 10869, otherwise known as “An Act Institutionalizing the Nationwide Implementation of the Jobstart Philippines Program and Providing Funds therefor”?<span className="required">*</span></p> 
                              </label>
                                   
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {activeSection === "others" && (
                    <>
                      <div className="others-main-container">
                        <div className="box-container-outer-verificationdocs">
                          <div className="title-verificationdocs">
                            Verification Documents
                          </div>

                          <div className="box-container-verificationdocs">
                            <span className="required-asterisk">*</span>

                            {/* File Upload Section */}
                            <div className="file-upload-container">
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

                                {/* Display the file names with image previews */}
                                {files.container1.length > 0 && (
                                  <div className="file-name-image-display">
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
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>

                        {clearanceInput.purpose === "Residency" && (
                          <>
                            <div className="box-container-outer-verificationdocs">
                            <div className="title-verificationdocs">
                              Identification Picture
                            </div>

                            <div className="box-container-verificationdocs">
                              <span className="required-asterisk">*</span>

                              {/* File Upload Section */}
                              <div className="file-upload-container">
                                <label htmlFor="id-picture-upload" className="upload-link">
                                  Click to Upload Picture
                                </label>

                                <input
                                  id="id-picture-upload"
                                  type="file"
                                  className="file-upload-input"
                                  accept=".jpg,.jpeg,.png"
                                  name="idPicture"
                                  onChange={(e) => handleIDPictureChange(e)}
                                />

                                {/* Display the image preview (only one) */}
                                { idPicture.length > 0 && (
                                  <div className="file-name-image-display">
                                    {idPicture.map((file, index) => (
                                      <div className="file-name-image-display-indiv" key={index}>
                                        <li className="file-item">
                                          {file.preview && (
                                            <div className="filename-image-container">
                                              <img src={file.preview} alt={file.name} className="file-preview" />
                                            </div>
                                          )}
                                          <span className="file-name">{file.name}</span>
                                          <div className="delete-container">
                                            <button type="button" onClick={handleIDPictureDelete} className="delete-button">
                                              <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                            </button>
                                          </div>
                                        </li>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          </>
                        )}

                        
                      </div>
                    </>
                  )}
                    
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
                            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
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
                            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                                <p>{popupMessage}</p>
                            </div>
                        </div>
                    )}


                    {showResidentsPopup && (
                      <div className="kasambahay-employer-popup-overlay">
                        <div className="kasambahay-employer-popup" ref={employerPopupRef}>
                          <h2>Residents List</h2>
                          <h1>* Please select Resident's Name *</h1>

                          <input
                            type="text"
                            placeholder="Search Resident's Name"
                            className="employer-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />

                          <div className="employers-list">
                            {residents.length === 0 ? (
                              <p>No residents found.</p>
                            ) : (
                              <table className="employers-table">
                                <thead>
                                  <tr>
                                    <th>Resident Number</th>
                                    <th>First Name</th>
                                    <th>Middle Name</th>
                                    <th>Last Name</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredResidents.map((resident) => (
                                    <tr
                                      key={resident.id}
                                      className="employers-table-row"
                                      onClick={async () => {
                                        try {
                                          const selectedFullName = `${resident.firstName} ${resident.middleName} ${resident.lastName}`;
                                          const purpose = clearanceInput.purpose ?? "";

                                          if (selectingFor === "fullName") {
                                            const update: any = {
                                              ...clearanceInput,
                                              fullName: selectedFullName,
                                              residentId: resident.id,
                                            };
                                      
                                            // If the purpose requires subject's address
                                            if (["Estate Tax", "Death Residency"].includes(purpose)) {
                                              update.address = resident.address || '';
                                            }
                                      
                                            setClearanceInput(update);
                                            setIsResidentSelected(true);

                                          } else if (selectingFor === "requestor") {
                                            // Set requestor's full details
                                            setClearanceInput({
                                              ...clearanceInput,
                                              requestorFname: selectedFullName,
                                              requestorMrMs: resident.sex === "Male" ? "Mr." : "Ms.",
                                              gender: resident.sex || '',
                                              birthday: resident.dateOfBirth || '',
                                              civilStatus: resident.civilStatus || '',
                                              address: resident.address || '',
                                              contact: resident.contactNumber || '',
                                              age: resident.age || '',
                                              occupation: resident.occupation || '',
                                              precinctnumber: resident.precinctNumber || '',
                                              residentId: resident.id,
                                            });
                                            setIsRequestorSelected(true);
                                          }
                                      
                                          setShowResidentsPopup(false);
                                        } catch (error) {
                                          setPopupMessage("An error occurred. Please try again.");
                                          setShowPopup(true);
                                          setTimeout(() => setShowPopup(false), 3000);
                                        }
                                      }}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      <td>{resident.residentNumber}</td>
                                      <td>{resident.firstName}</td>
                                      <td>{resident.middleName}</td>
                                      <td>{resident.lastName}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

            
        </main>
    );
}

