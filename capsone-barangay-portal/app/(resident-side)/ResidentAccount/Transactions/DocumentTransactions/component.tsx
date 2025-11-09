"use client";
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { doc, getDoc,addDoc, collection, getDocs, DocumentData, onSnapshot, query, where,updateDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL,uploadBytes } from "firebase/storage";

import { db } from "@/app/db/firebase";

interface EmergencyDetails {
    address?: string;
    contactNumber?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    relationship?: string;
  }

interface BarangayDocument {
    accID: string;
    id: string;
    address?: string; 
    age?: string; 
    birthday?: string; 
    citizenship?: string; 
    civilStatus?: string; 
    contact?: string; 
    dateOfResidency?: string;
    docType?: string; 
    purpose?: string;
    requestorFname?: string; 
    firstName?: string; 
    middleName?: string; 
    lastName?: string; 
    gender?: string; 
    createdAt?: string; 
    signaturejpg?: string[];
    barangayIDjpg?: string[];
    validIDjpg?: string[];
    letterjpg?: string[];
    status?: string; 
    partnerWifeHusbandFullName?: string;
    cohabitationStartDate?: string;
    cohabitationRelationship?:string;
    appointmentDate?: string;
    toAddress?: string;
    birthpalce?: string;
    religion?: string;
    nationality?: string;
    height?: string;
    weight?: string;
    bloodType?: string;
    occupation?: string;
    precinctNumber?: string;
    emergencyDetails?: EmergencyDetails;
    educationalAttainment?: string;
    typeofbldg?: string;
    copyOfPropertyTitle?: string[];
    estimatedCapital?: string;
    homeAddress?: string;
    dtiRegistration?: string[];
    isCCTV?: string[];
    taxDeclaration?: string[];
    approvedBldgPlan?: string[];
    deathCertificate?: string[];

}

export default function DocumentTransactionsDetails({referenceId}:any) {
   // const searchParams = useSearchParams();
    const router = useRouter();

    // const referenceId = searchParams.get("id");

    const [transactionData, setTransactionData] = useState<BarangayDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [fileURLs, setFileURLs] = useState<{ field: string; url: string }[]>([]);


    
    const [filesToUpload, setFilesToUpload] = useState<{ field: string; files: File[] | null, imageName:string }[]>([
        { field: 'signaturejpg', files: null, imageName: 'Signature' },
        { field: 'barangayIDjpg', files: null, imageName: 'Barangay ID'  },
        { field: 'validIDjpg', files: null, imageName: 'Valid ID'  },
        { field: 'letterjpg', files: null, imageName: 'Endorsement Letter'  },
        { field: 'copyOfPropertyTitle', files: null, imageName: 'Copy of Property Title'  },
        { field: 'dtiRegistration', files: null, imageName: 'Certified True Copy of DTI Registration'  },
        { field: 'isCCTV', files: null, imageName: 'Picture of CCTV installed in the establishment'  },
        { field: 'taxDeclaration', files: null, imageName: 'Certified True Copy of Tax Declaration' },
        { field: 'approvedBldgPlan', files: null, imageName: 'Approved Building/Construction Plan'  },
        { field: 'deathCertificate', files: null, imageName: 'Death Certificate'  },

    ]);



    const [activeSection, setActiveSection] = useState("info");

    const getEducationalAttainmentLabel = (value: string | undefined) => {
        switch (value) {
            case "1":
                return "Elem Under Grad";
            case "2":
                return "Elem Grad";
            case "3":
                return "HS Grad";
            case "4":
                return "HS Under Grad";
            case "5":
                return "COL Grad";
            case "6":
                return "COL Under Grad";
            case "7":
                return "Educational";
            case "8":
                return "Vocational";
            default:
                return "N/A"; // Default value if no match
        }
    };

    useEffect(() => {
        if (!referenceId) return;
    
        const fetchTransactionDetails = async () => {
          setLoading(true);
          try {
            const docRef = doc(db, "ServiceRequests", referenceId);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
                const data = docSnap.data() as BarangayDocument;
                setTransactionData({ ...data, id: docSnap.id });

                const storage = getStorage();
                const fileFields = ['signaturejpg', 'barangayIDjpg', 'validIDjpg', 'letterjpg', 'copyOfPropertyTitle', 'dtiRegistration', 'isCCTV', 'taxDeclaration', 'approvedBldgPlan', 'deathCertificate'] as const;

                const urls: { field: string; url: string }[] = [];

                for (const field of fileFields) {
                    const fileData = data[field as keyof BarangayDocument];

                    // Handle string (single file)
                    if (typeof fileData === "string" && fileData.trim() !== "") {
                        const fileRef = ref(storage, `ServiceRequests/${fileData}`);
                        const url = await getDownloadURL(fileRef);
                        urls.push({ field, url });
                    }

                    // Handle array of files
                    if (Array.isArray(fileData)) {
                        for (const file of fileData as string[]) {
                            if (typeof file === "string" && file.trim() !== "") {
                                const fileRef = ref(storage, `ServiceRequests/${file}`);
                                const url = await getDownloadURL(fileRef);
                                urls.push({ field, url });
                            }
                        }
                    }
                }

                // Update the fileURLs state after fetching all URLs
                setFileURLs(urls);
            } else {
              console.error("No such document!");
              setTransactionData(null);
            }
          } catch (error) {
            console.error("Error fetching incident details:", error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchTransactionDetails();
      }, [referenceId]);

      const handleBack = () => {
        router.push("/ResidentAccount/Transactions");
      };
    
    const [documentMissing, setdocumentMissing] = useState<boolean>(false);

    const imageFields = [
        'signaturejpg',
        'barangayIDjpg',
        'validIDjpg',
        'letterjpg',
        'copyOfPropertyTitle',
        'dtiRegistration',
        'isCCTV',
        'taxDeclaration',
        'approvedBldgPlan',
        'deathCertificate',
        ] as const;

        const [nullImageFields, setNullImageFields] = useState<string[]>([]);

        useEffect(() => {
        if (!transactionData) return;

        const missingFields: string[] = [];

        for (const field of imageFields) {
            const fileData = transactionData[field as keyof BarangayDocument];

            // 🔍 Check if the field value is null
            if (fileData === null) {
            missingFields.push(field);
            }
        }

        // ✅ Update both states once after the loop
        setNullImageFields(missingFields);
        setdocumentMissing(missingFields.length > 0);

        }, [transactionData]);

        console.log("Document Missing:", documentMissing);
        console.log("Transaction Data:", transactionData);
        console.log("Null Image Fields:", nullImageFields);

        const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

      const handleSubmitDocuments = async (e:any) => {
        e.preventDefault();

    for (const field of nullImageFields) {
        const fileEntry = filesToUpload.find(f => f.field === field);
        if (!fileEntry?.files || fileEntry.files.length === 0) {
            // Use popup instead of alert
            setErrorPopup({
                show: true,
                message: `Please upload files for ${fileEntry?.imageName} before submitting.`
            });
            return;
        }
    }
        const storage = getStorage();
        const storageRefs: Record<string, any> = {}; // refs for upload
        const storageFilePaths: Record<string, string> = {}; // file path strings to save to Firestore

        // Prepare storage refs and file paths
        for (const field of nullImageFields) {
            const files = filesToUpload.find(f => f.field === field)?.files;
            if (files && files.length > 0) {
                let timeStamp = Date.now().toString() + Math.floor(Math.random() * 1000); // prevent collisions
                const fileExtension = files[0].name.split('.').pop(); // Get file extension from the first file
                const filename = `service_request_${transactionData?.accID}.${field}.${timeStamp}.${fileExtension}`;
                const fullPath = `ServiceRequests/${filename}`;
                storageFilePaths[field] = filename;
                storageRefs[field] = ref(storage, fullPath);
            }
        }

        // Upload files
        for (const [key, storageRef] of Object.entries(storageRefs)) {
          const file = filesToUpload.find(f => f.field === key)?.files?.[0];
          if (file instanceof File && storageRef) {
            try {
              await uploadBytes(storageRef, file);
              console.log(`${key} uploaded successfully`);
            } catch (uploadError) {
              console.error(`Error uploading ${key}:`, uploadError);
              // optionally handle partial failures here
            }
          }
        }

        try {
          // Update Firestore document with new file references
          const docRef = doc(db, "ServiceRequests", referenceId);


          const updatePayload: Record<string, any> = {};
          for (const [field, path] of Object.entries(storageFilePaths)) {
                updatePayload[field] = path; // ✅ set as string directly
        }
        
          // Use updateDoc to only update the provided fields (does not overwrite other fields)
          await updateDoc(docRef, updatePayload);


// notification of success to brgy side regarding incomplete files

   const notificationRef = collection(db, "BarangayNotifications");

    const fullName = `${transactionData?.firstName || ""} ${transactionData?.middleName || ""} ${transactionData?.lastName || ""}`.trim();

    await addDoc(notificationRef, {
      message: `Requirements have been submitted for ${transactionData?.docType || transactionData?.purpose || "a document"} by ${transactionData?.requestorFname}. You may now check if the request can progress to the next step.`,
      timestamp: new Date(),
      requestorId: transactionData?.accID || "Unknown",
      requestID: referenceId,
      isRead: false,
      transactionType: "Online Service Request",
      recipientRole:
        transactionData?.purpose === "First Time Jobseeker" ||
        transactionData?.docType === "Barangay Certificate" ||
        transactionData?.docType === "Barangay Clearance" ||
        transactionData?.docType === "Barangay Indigency" ||
        transactionData?.docType === "Temporary Business Permit" ||
        transactionData?.docType === "Construction" ||
        transactionData?.docType === "Barangay Permit" ||
        (transactionData?.docType === "Other Documents" && transactionData?.purpose !== "Barangay ID")
          ? "Assistant Secretary"
          : "Admin Staff",
    });





            location.reload();
          // Optionally refetch or update local state here
          console.log("Firestore document updated with file references:", updatePayload);
        } catch (error) {
          console.error("Error updating document:", error);
        }

       console.log("Storage References:", storageFilePaths);

      }  
      const barangayDocumentFields = [
        /* General Fields*/
        { label: "Request Date", key: "createdAt" },
        { label: "Document Type", key: "docType" },
        { label: "Purpose", key: "purpose" },     
        { label: "Status", key: "status" },
        { label: "Contact Number", key: "contact" },
        {label: "Requestor's Name", key: "requestor" },       
        { label: "Appointment Date", key: "appointmentDate" }, 
        ...(transactionData?.status === "Rejected"
           ? [{ label: "Rejection Reason", key: "rejectionReason" }]
           : []),


        /*Barangay Certificate, Barangay Indigency, Barangay Clearance & Business Permits */
        ...(transactionData?.docType !== "Business Permit" && transactionData?.docType !== "Temporary Business Permit" && transactionData?.docType !== "Construction"
                ? [
                    { label: "Requestor's Address", key: "address" },
                    { label: "Requestor's Date of Residency", key: "dateOfResidency" },
                    { label: "Requestor's Birthday", key: "birthday" },
                    { label: "Requestor's Age", key: "age" },
                    { label: "Requestor's Gender", key: "gender" },
                    { label: "Requestor's Civil Status", key: "civilStatus" },
                    { label: "Requestor's Citizenship", key: "citizenship" },
                ]
                : []),


            /* ADD address of deceased*/
         ...(transactionData?.purpose === "Death Residency" ? 
            [
                { label: "Deceased's Full Name", key: "fullName" },
                { label: "Deceased's Date of Death", key: "dateofdeath" },
                
            ]
            :[]
        ),

        
          /* TO ADD*/
         ...(transactionData?.purpose === "Guardanship" ? 
            [
                { label: "Guardian's Full Name", key: "fullName" },
                
            ]
            :[]
        ),


        ...(transactionData?.purpose === "Garage/TRU" ? 
            [
                { label: "Business Name", key: "businessName" },
                { label: "Business Nature", key: "businessNature" },
                { label: "Business Location", key: "businessLocation" },
                { label: "No Of Tricycle", key: "noOfTRU" },
                { label: "Tricycle Make", key: "tricycleMake" },
                { label: "Tricycle Type", key: "tricycleType" },
                { label: "Tricycle Plate No", key: "tricyclePlateNo" },
                { label: "Tricycle Serial No", key: "tricycleSerialNo" },
                { label: "Tricycle Chassis No", key: "tricycleChassisNo" },
                { label: "Tricycle Engine No", key: "tricycleEngineNo" },
                { label: "Tricycle File No", key: "tricycleFileNo" },
            ]
            :[]
        ),
        ...(transactionData?.purpose === "Garage/PUV" ? 
            [
                { label: "Purpose of Certificate", key: "puvPurpose" },
                { label: "Vehicle Description", key: "vehicleType" },
                { label: "No of Vehicles", key: "nosOfPUV" },
                
            ]
            :[]
        ),
        ...(transactionData?.purpose === "Cohabitation"
            ? [
                { label: "Partner/Wife/Husband's Full Name", key: "partnerWifeHusbandFullName" },
                { label: "Cohabitation Start Date", key: "cohabitationStartDate" },
                { label: "Cohabitation Relationship", key: "cohabitationRelationship" }
            ]:[]),
        ...(transactionData?.purpose === "Occupancy /  Moving Out" ?
            [
            { label: "To Address", key: "toAddress" },
            { label: "From Full Name", key: "fullName" }
            ]
            : []
        ),
        ...(transactionData?.purpose === "Residency" ?
            [{ label: "Attested By Hon Kagawad:", key: "attestedBy" },
            { label: "Cohabitation Year From", key: "CYFrom" },
            { label: "Cohabitation Year To", key: "CYTo" },
            ]:
            []

        ),
        ...(transactionData?.purpose === "Good Moral and Probation" ? 
            [{label: "Purpose of Good Moral and Probation",key:"goodMoralPurpose"}]
            :[]
        ),
        ...(transactionData?.purpose === "No Income" ? 
            [{label: "Purpose Of No Income", key: "noIncomePurpose"},
            { label: "Son/Daughter's Name", key: "noIncomeChildFName" }
            ]
            :[]
        ),  


        /*ADD DECEASED ADDRESS*/
        ...(transactionData?.purpose === "Estate Tax" ? 
            [
            { label: "Date of Death", key: "dateofdeath" },
            { label: "Estate Since", key: "estateSince" },
            { label: "Deceased's Full Name", key: "fullName" }
            ]
            :[]
        ),


        /*Barangay ID */
        ...(transactionData?.docType === "Barangay ID"
            ? [
                { label: "Birthplace", key: "birthplace" },
                { label: "Religion", key: "religion" },
                { label: "Nationality", key: "nationality" },
                { label: "Height", key: "height" },
                { label: "Weight", key: "weight" },
                { label: "Blood Type", key: "bloodtype" },
                { label: "Occupation", key: "occupation" },
                { label: "Precinct Number", key: "precinctnumber" },
                { label: "First Name", key: "emergencyDetails.firstName" },
                { label: "Middle Name", key: "emergencyDetails.middleName" },
                { label: "Last Name", key: "emergencyDetails.lastName" },
                { label: "Address", key: "emergencyDetails.address" },
                { label: "Contact Number", key: "emergencyDetails.contactNumber" },
                { label: "Relationship", key: "emergencyDetails.relationship" },
              ]
            : []),

        /*First Time Jobseekr */
        ...(transactionData?.docType === "First Time Jobseeker"
            ? [
                { label: "Educational Attainment", key: "educationalAttainment" },
                { label: "Course", key: "course" },
               
              ]
            : []),

        /*Business Permit & Temporary Business Permit*/
        ...(transactionData?.docType === "Business Permit" || transactionData?.docType === "Temporary Business Permit"
            ? [
                { label: "Business Location", key: "businessLocation" },
                { label: "Business Name", key: "businessName" },
                { label: "Business Nature", key: "businessNature" },
                { label: "Estimated Capital", key: "estimatedCapital" },
                { label: "Home Address", key: "homeAddress" },
              ]
            : []),

         /*Construction Permit*/
         ...(transactionData?.docType === "Construction" 
            ? [
                { label: "Home Address", key: "homeAddress" },
                { label: "Construction Activity", key: "typeofconstruction" },
                { label: "Project Location", key: "projectLocation" },
                { label: "Project Title", key: "projectName" },
                {
                    label: "Type of Building",
                    key:
                      transactionData.typeofbldg === "Others"
                        ? "othersTypeofbldg"
                        : "typeofbldg",
                  },
              ]
            : []),

      ];

{/*}

      if (loading) return <p>Loading...</p>;
      if (!transactionData) return <p>Document request not found.</p>;

*/}

if (loading || !transactionData) {
  return (
    <main className="incident-transaction-container">
      <div className="headerpic-specific-transactions">
        <p>TRANSACTIONS</p>
      </div>
      <div className="incident-content">
        <div className="loading-or-error-container">
          {loading ? <p className="loading-text">Loading document details...</p> : <p className="error-text">Document request not found.</p>}
        </div>
      </div>
    </main>
  );
}

const displayStatus =
  transactionData.status === "Pending" && documentMissing
    ? "Pending (On Hold)"
    : transactionData.status || "N/A";

console.log("file url", fileURLs);
    return (
        <main className="incident-transaction-container">
            <div className="headerpic-specific-transactions">
                <p>TRANSACTIONS</p>
            </div>


            <div className="incident-content">

                <div className="incident-content-section-1">
                    <div className="section-1-left">
                        <button type="button" className="back-button" onClick={handleBack}></button>
                        <h1>Online Document Request</h1>
                    </div>
                    
                    <div className="status-container">
                        <p className={`status-dropdown-transactions ${transactionData.status?.toLowerCase().replace(/[\s\-]+/g, "-")}`}>
                            {displayStatus}
                        </p> 
                        
                    </div>
                    {documentMissing && (
                        <>
                            <div >
                                <button type="button"
                                className="bg:white p-1 rounded-md shadow-md bg-green-500 size-fit text-center text-base font-semibold w-36"  
                                onClick={(e) => {
                                    handleSubmitDocuments(e)
                                }}>
                                    Submit 
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="incident-main-content">

                    <div className="incident-main-content-upper">
                    <nav className="incidents-transactions-info-toggle-wrapper">
                        {["info", "reqs", ...(transactionData?.docType === "Barangay ID" ? ["emergency"] : [])].map((section) => (
                        <button
                            key={section}
                            type="button"
                            className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                            onClick={() => setActiveSection(section)}
                        >
                            {section === "info" && "Document Info"}
                            {section === "reqs" && "Requirements"}
                            {section === "emergency" && "Emergency Details"}
                        </button>
                        ))}
                    </nav>
                    </div>



                    <div className="incident-main-content-lower">

                        {activeSection === "info" && (
                        <>
                        <div className="incident-main-container">
                            <div className="incident-container-upper">
             
                                <div className="incident-main-left">

                                    {barangayDocumentFields
                                        .filter(
                                        (field) =>
                                            !field.key.startsWith("emergencyDetails")
                                        )
                                        .filter((_, index) => index % 2 === 0)
                                        .map((field) => (
                                        <div key={field.key}>
                                        <div className="details-section-document">
                                            <div className="title">
                                                <p>{field.label}</p>
                                            </div>
                                            <div className="description">
                                                <p>
                                                {field.key === "educationalAttainment"
                                                    ? getEducationalAttainmentLabel(
                                                        (transactionData as Record<string, any>)[field.key]
                                                    )
                                                    : field.key === "status"
                                                    ? displayStatus
                                                    : (transactionData as Record<string, any>)[field.key] ||
                                                        "N/A"}
                                                </p>
                                            </div>
                                        </div>
                             
                                        </div>
                                        ))}
                                    </div>

                                    <div className="incident-main-right">
                                    {barangayDocumentFields
                                        .filter(
                                        (field) =>
                                            !field.key.startsWith("emergencyDetails")
                                        )
                                        .filter((_, index) => index % 2 !== 0)
                                        .map((field) => (
                                        <div key={field.key}>
                                            <div className="details-section-document">
                                                <div className="title">
                                                    <p>{field.label}</p>
                                                </div>
                                                <div className="description">
                                                    <p>
                                                    {field.key === "educationalAttainment"
                                                        ? getEducationalAttainmentLabel(
                                                            (transactionData as Record<string, any>)[field.key]
                                                        )
                                                        : field.key === "status"
                                                        ? displayStatus
                                                        : (transactionData as Record<string, any>)[field.key] ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                              
                        </>
                         )}

                     {activeSection === "reqs" && (
                        <>
                        <div className="incident-main-container-upload">
                            {fileURLs.some(({ field }) => field === "signaturejpg") ? (
                            <div className="details-section-response-upload">
                                <div className="title">
                                <p>Signature</p>
                                </div>

                                <div className="description">
                                {fileURLs
                                    .filter(({ field }) => field === "signaturejpg")
                                    .map(({ url }, index) => (
                                    <div key={index} className="document-requirements-container">
                                        <img src={url} alt="Signature - Uploaded File" className="requirements-image" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                        </a>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            ):(
                                <>

                <div className="details-section-response-upload">
                    <div className="title">
                    <p>Signature</p>
                    </div>

                    <div className="description">
                    {(filesToUpload.find(f => f.field === "signaturejpg")?.files === null ||
                        filesToUpload.find(f => f.field === "signaturejpg")?.files?.length === 0) ? (
                        <div className="document-requirements-container">
                        <div className="no-signature-placeholder">
                            <p style={{ color: "red", fontWeight: "bold", marginBottom:"1rem" }}>No signature uploaded.</p>

                            {documentMissing && (
                            <>
                                <label htmlFor="file-upload1" className="upload-btn">
                                Click to Upload File
                                </label>
                                <input
                                id="file-upload1"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={(e) => {
                                    setFilesToUpload((prevFiles) =>
                                    prevFiles.map((file) =>
                                        file.field === "signaturejpg"
                                        ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                        : file
                                    )
                                    );
                                }}
                                />
                            </>
                            )}
                        </div>
                        </div>
                    ) : (
                        <>
                        <div className="document-requirements-container">
                            {filesToUpload
                            .find(f => f.field === "signaturejpg")
                            ?.files?.map((file, idx) => {
                                const previewURL = URL.createObjectURL(file);
                                return (
                                <div key={idx} className="preview-container">
                                    <img src={previewURL} alt="Preview" className="requirements-image" />
                                    <p className="file-name">{file.name}</p>
                                    <a
                                    href={previewURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-file-link"
                                    >
                                    View Image
                                    </a>
                                </div>
                                );
                            })}
                        </div>
                        </>
                    )}
                    </div>
                 </div>
                                </>
                            )}

                            {fileURLs.some(({ field }) => field === "barangayIDjpg") ? (
                            <div className="details-section-response-upload">
                                <div className="title">
                                <p>Barangay ID</p>
                                </div>

                                <div className="description">
                                {fileURLs
                                    .filter(({ field }) => field === "barangayIDjpg")
                                    .map(({ url }, index) => (
                                    <div key={index} className="document-requirements-container">
                                        <img src={url} alt="Barangay ID - Uploaded File" className="requirements-image" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                        </a>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                            transactionData && "barangayIDjpg" in transactionData && (
                                <div className="details-section-response-upload">
                                <div className="title">
                                    <p>Barangay ID</p>
                                </div>

                                <div className="description">
                                    {(filesToUpload.find(f => f.field === "barangayIDjpg")?.files === null ||
                                    filesToUpload.find(f => f.field === "barangayIDjpg")?.files?.length === 0) ? (
                                    <div className="document-requirements-container">
                                        <div className="no-signature-placeholder">
                                        <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                            No files uploaded.
                                        </p>
                                        {documentMissing && (
                                            <>
                                            <label htmlFor="file-upload2" className="upload-btn">
                                                Click to Upload File
                                            </label>
                                            <input
                                                id="file-upload2"
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                setFilesToUpload((prevFiles) =>
                                                    prevFiles.map((file) =>
                                                    file.field === "barangayIDjpg"
                                                        ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                        : file
                                                    )
                                                );
                                                }}
                                            />
                                            </>
                                        )}
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="document-requirements-container">
                                        {filesToUpload
                                        .find(f => f.field === "barangayIDjpg")
                                        ?.files?.map((file, idx) => {
                                            const previewURL = URL.createObjectURL(file);
                                            return (
                                            <div key={idx} className="preview-container">
                                                <img src={previewURL} alt="Preview" className="requirements-image" />
                                                <p className="file-name">{file.name}</p>
                                                <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View Image
                                                </a>
                                            </div>
                                            );
                                        })}
                                    </div>
                                    )}
                                </div>
                                </div>
                            )
                            )}


                            {fileURLs.some(({ field }) => field === "validIDjpg") ? (
                            <div className="details-section-response-upload">
                                <div className="title">
                                <p>Valid ID</p>
                                </div>

                                <div className="description">
                                {fileURLs
                                    .filter(({ field }) => field === "validIDjpg")
                                    .map(({ url }, index) => (
                                    <div key={index} className="document-requirements-container">
                                        <img src={url} alt="Valid ID - Uploaded File" className="requirements-image" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                        </a>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                            <div className="details-section-response-upload">
                                <div className="title">
                                <p>Valid ID</p>
                                </div>

                                <div className="description">
                                {(filesToUpload.find(f => f.field === "validIDjpg")?.files === null ||
                                    filesToUpload.find(f => f.field === "validIDjpg")?.files?.length === 0) ? (
                                    <div className="document-requirements-container">
                                    <div className="no-signature-placeholder">
                                        <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                        No files uploaded.
                                        </p>
                                        {documentMissing && (
                                        <>
                                            <label htmlFor="file-upload3" className="upload-btn">
                                            Click to Upload File
                                            </label>
                                            <input
                                            id="file-upload3"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                setFilesToUpload((prevFiles) =>
                                                prevFiles.map((file) =>
                                                    file.field === "validIDjpg"
                                                    ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                    : file
                                                )
                                                );
                                            }}
                                            />
                                        </>
                                        )}
                                    </div>
                                    </div>
                                ) : (
                                    <div className="document-requirements-container">
                                    {filesToUpload
                                        .find(f => f.field === "validIDjpg")
                                        ?.files?.map((file, idx) => {
                                        const previewURL = URL.createObjectURL(file);
                                        return (
                                            <div key={idx} className="preview-container">
                                            <img src={previewURL} alt="Preview" className="requirements-image" />
                                            <p className="file-name">{file.name}</p>
                                            <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View Image
                                            </a>
                                            </div>
                                        );
                                        })}
                                    </div>
                                )}
                                </div>
                            </div>
                            )}

                            
                            {fileURLs.some(({ field }) => field === "letterjpg") ? (
                            <div className="details-section-response-upload">
                                <div className="title">
                                <p>Endorsement Letter</p>
                                </div>

                                <div className="description">
                                {fileURLs
                                    .filter(({ field }) => field === "letterjpg")
                                    .map(({ url }, index) => (
                                    <div key={index} className="document-requirements-container">
                                        <img src={url} alt="Endorsement Letter - Uploaded File" className="requirements-image" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                        </a>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                            transactionData && "letterjpg" in transactionData && (
                                <div className="details-section-response-upload">
                                <div className="title">
                                    <p>Endorsement Letter</p>
                                </div>

                                <div className="description">
                                    {(filesToUpload.find(f => f.field === "letterjpg")?.files === null ||
                                    filesToUpload.find(f => f.field === "letterjpg")?.files?.length === 0) ? (
                                    <div className="document-requirements-container">
                                        <div className="no-signature-placeholder">
                                        <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                            No files uploaded.
                                        </p>
                                        {documentMissing && (
                                            <>
                                            <label htmlFor="file-upload4" className="upload-btn">
                                                Click to Upload File
                                            </label>
                                            <input
                                                id="file-upload4"
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                setFilesToUpload((prevFiles) =>
                                                    prevFiles.map((file) =>
                                                    file.field === "letterjpg"
                                                        ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                        : file
                                                    )
                                                );
                                                }}
                                            />
                                            </>
                                        )}
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="document-requirements-container">
                                        {filesToUpload
                                        .find(f => f.field === "letterjpg")
                                        ?.files?.map((file, idx) => {
                                            const previewURL = URL.createObjectURL(file);
                                            return (
                                            <div key={idx} className="preview-container">
                                                <img src={previewURL} alt="Preview" className="requirements-image" />
                                                <p className="file-name">{file.name}</p>
                                                <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View Image
                                                </a>
                                            </div>
                                            );
                                        })}
                                    </div>
                                    )}
                                </div>
                                </div>
                            )
                            )}





                            {/* Additional fields for Business Permit and Temporary Business Permit */}
                        {transactionData.purpose ==="Death Residency" && (
                            <>
                                {fileURLs.some(({ field }) => field === "deathCertificate") ? (
                            <div className="details-section-response-upload">
                                <div className="title">
                                <p>Death Certificate</p>
                                </div>

                                <div className="description">
                                {fileURLs
                                    .filter(({ field }) => field === "deathCertificate")
                                    .map(({ url }, index) => (
                                    <div key={index} className="document-requirements-container">
                                        <img src={url} alt="Endorsement Letter - Uploaded File" className="requirements-image" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                        </a>
                                    </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                            transactionData && "deathCertificate" in transactionData && (
                                <div className="details-section-response-upload">
                                <div className="title">
                                    <p>Death Certificate</p>
                                </div>

                                <div className="description">
                                    {(filesToUpload.find(f => f.field === "deathCertificate")?.files === null ||
                                    filesToUpload.find(f => f.field === "deathCertificate")?.files?.length === 0) ? (
                                    <div className="document-requirements-container">
                                        <div className="no-signature-placeholder">
                                        <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                            No files uploaded.
                                        </p>
                                        {documentMissing && (
                                            <>
                                            <label htmlFor="file-upload10" className="upload-btn">
                                                Click to Upload File
                                            </label>
                                            <input
                                                id="file-upload10"
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                setFilesToUpload((prevFiles) =>
                                                    prevFiles.map((file) =>
                                                    file.field === "deathCertificate"
                                                        ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                        : file
                                                    )
                                                );
                                                }}
                                            />
                                            </>
                                        )}
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="document-requirements-container">
                                        {filesToUpload
                                        .find(f => f.field === "deathCertificate")
                                        ?.files?.map((file, idx) => {
                                            const previewURL = URL.createObjectURL(file);
                                            return (
                                            <div key={idx} className="preview-container">
                                                <img src={previewURL} alt="Preview" className="requirements-image" />
                                                <p className="file-name">{file.name}</p>
                                                <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View Image
                                                </a>
                                            </div>
                                            );
                                        })}
                                    </div>
                                    )}
                                </div>
                                </div>
                            )
                            )}
                            </>
                        )}
                            
                         {(transactionData.docType === "Business Permit" || transactionData.docType === "Temporary Business Permit" || transactionData.docType === "Construction") && (
                          <>
                            <div className="details-section-response-upload">
                                <div className="title">
                                    <p>Copy of Property Title / Contract of Lease</p>
                                </div>

                                <div className="description">
                                    {fileURLs.filter(({ field }) => field === "copyOfPropertyTitle").length > 0 ? (
                                    fileURLs
                                        .filter(({ field }) => field === "copyOfPropertyTitle")
                                        .map(({ url }, index) => (
                                        <div key={index} className="document-requirements-container">
                                            <img src={url} alt="Copy of Property Title" className="requirements-image" />
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                            View File
                                            </a>
                                        </div>
                                        ))
                                    ) : (
                                    <>
                                        {(filesToUpload.find(f => f.field === "copyOfPropertyTitle")?.files === null ||
                                        filesToUpload.find(f => f.field === "copyOfPropertyTitle")?.files?.length === 0) ? (
                                        <div className="document-requirements-container">
                                            <div className="no-signature-placeholder">
                                            <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                                No files uploaded.
                                            </p>
                                            {documentMissing && (
                                                <>
                                                <label htmlFor="file-upload5" className="upload-btn">
                                                    Click to Upload File
                                                </label>
                                                <input
                                                    id="file-upload5"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                    setFilesToUpload((prevFiles) =>
                                                        prevFiles.map((file) =>
                                                        file.field === "copyOfPropertyTitle"
                                                            ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                            : file
                                                        )
                                                    );
                                                    }}
                                                />
                                                </>
                                            )}
                                            </div>
                                        </div>
                                        ) : (
                                        <div className="document-requirements-container">
                                            {filesToUpload
                                            .find(f => f.field === "copyOfPropertyTitle")
                                            ?.files?.map((file, idx) => {
                                                const previewURL = URL.createObjectURL(file);
                                                return (
                                                <div key={idx} className="preview-container">
                                                    <img src={previewURL} alt="Preview" className="requirements-image" />
                                                    <p className="file-name">{file.name}</p>
                                                    <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                    View Image
                                                    </a>
                                                </div>
                                                );
                                            })}
                                        </div>
                                        )}
                                    </>
                                    )}
                                </div>
                                </div>


                        


                            </>
                              )}

                         {(transactionData.docType === "Business Permit" || transactionData.docType === "Temporary Business Permit") && (
                            <>
<div className="details-section-response-upload">
  <div className="title">
    <p>DTI Registration</p>
  </div>

  <div className="description">
    {fileURLs.filter(({ field }) => field === "dtiRegistration").length > 0 ? (
      fileURLs
        .filter(({ field }) => field === "dtiRegistration")
        .map(({ url }, index) => (
          <div key={index} className="document-requirements-container">
            <img src={url} alt="DTI Registration" className="requirements-image" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
              View File
            </a>
          </div>
        ))
    ) : (
      <>
        {(filesToUpload.find(f => f.field === "dtiRegistration")?.files === null ||
          filesToUpload.find(f => f.field === "dtiRegistration")?.files?.length === 0) ? (
          <div className="document-requirements-container">
            <div className="no-signature-placeholder">
              <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                No files uploaded.
              </p>
              {documentMissing && (
                <>
                  <label htmlFor="file-upload6" className="upload-btn">
                    Click to Upload File
                  </label>
                  <input
                    id="file-upload6"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      setFilesToUpload((prevFiles) =>
                        prevFiles.map((file) =>
                          file.field === "dtiRegistration"
                            ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                            : file
                        )
                      );
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="document-requirements-container">
            {filesToUpload
              .find(f => f.field === "dtiRegistration")
              ?.files?.map((file, idx) => {
                const previewURL = URL.createObjectURL(file);
                return (
                  <div key={idx} className="preview-container">
                    <img src={previewURL} alt="Preview" className="requirements-image" />
                    <p className="file-name">{file.name}</p>
                    <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                      View Image
                    </a>
                  </div>
                );
              })}
          </div>
        )}
      </>
    )}
  </div>
</div>


  <div className="details-section-response-upload">
  <div className="title">
    <p>CCTV Picture</p>
  </div>

  <div className="description">
    {fileURLs.filter(({ field }) => field === "isCCTV").length > 0 ? (
      fileURLs
        .filter(({ field }) => field === "isCCTV")
        .map(({ url }, index) => (
          <div key={index} className="document-requirements-container">
            <img src={url} alt="CCTV Picture" className="requirements-image" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
              View File
            </a>
          </div>
        ))
    ) : (
      <>
        {(filesToUpload.find(f => f.field === "isCCTV")?.files === null ||
          filesToUpload.find(f => f.field === "isCCTV")?.files?.length === 0) ? (
          <div className="document-requirements-container">
            <div className="no-signature-placeholder">
              <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                No files uploaded.
              </p>
              {documentMissing && (
                <>
                  <label htmlFor="file-upload7" className="upload-btn">
                    Click to Upload File
                  </label>
                  <input
                    id="file-upload7"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      setFilesToUpload((prevFiles) =>
                        prevFiles.map((file) =>
                          file.field === "isCCTV"
                            ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                            : file
                        )
                      );
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="document-requirements-container">
            {filesToUpload
              .find(f => f.field === "isCCTV")
              ?.files?.map((file, idx) => {
                const previewURL = URL.createObjectURL(file);
                return (
                  <div key={idx} className="preview-container">
                    <img src={previewURL} alt="Preview" className="requirements-image" />
                    <p className="file-name">{file.name}</p>
                    <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                      View Image
                    </a>
                  </div>
                );
              })}
          </div>
        )}
      </>
    )}
  </div>
</div>


                           </>
                           )}


                         {(transactionData.docType === "Construction") && (
                            <>

                            <div className="details-section-response-upload">
                            <div className="title">
                                <p>Approved Building / Construction Plan</p>
                            </div>

                            <div className="description">
                                {fileURLs.filter(({ field }) => field === "approvedBldgPlan").length > 0 ? (
                                fileURLs
                                    .filter(({ field }) => field === "approvedBldgPlan")
                                    .map(({ url }, index) => (
                                    <div key={index} className="document-requirements-container">
                                        <img src={url} alt="Approved Building / Construction Plan" className="requirements-image" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                        </a>
                                    </div>
                                    ))
                                ) : (
                                <>
                                    {(filesToUpload.find(f => f.field === "approvedBldgPlan")?.files === null ||
                                    filesToUpload.find(f => f.field === "approvedBldgPlan")?.files?.length === 0) ? (
                                    <div className="document-requirements-container">
                                        <div className="no-signature-placeholder">
                                        <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                            No files uploaded.
                                        </p>
                                        {documentMissing && (
                                            <>
                                            <label htmlFor="file-upload8" className="upload-btn">
                                                Click to Upload File
                                            </label>
                                            <input
                                                id="file-upload8"
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                setFilesToUpload((prevFiles) =>
                                                    prevFiles.map((file) =>
                                                    file.field === "approvedBldgPlan"
                                                        ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                        : file
                                                    )
                                                );
                                                }}
                                            />
                                            </>
                                        )}
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="document-requirements-container">
                                        {filesToUpload
                                        .find(f => f.field === "approvedBldgPlan")
                                        ?.files?.map((file, idx) => {
                                            const previewURL = URL.createObjectURL(file);
                                            return (
                                            <div key={idx} className="preview-container">
                                                <img src={previewURL} alt="Preview" className="requirements-image" />
                                                <p className="file-name">{file.name}</p>
                                                <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View Image
                                                </a>
                                            </div>
                                            );
                                        })}
                                    </div>
                                    )}
                                </>
                                )}
                            </div>
                            </div>

                        <div className="details-section-response-upload">
                        <div className="title">
                            <p>Certified True Copy of Tax Declaration</p>
                        </div>

                        <div className="description">
                            {fileURLs.filter(({ field }) => field === "taxDeclaration").length > 0 ? (
                            fileURLs
                                .filter(({ field }) => field === "taxDeclaration")
                                .map(({ url }, index) => (
                                <div key={index} className="document-requirements-container">
                                    <img src={url} alt="Tax Declaration" className="requirements-image" />
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                    View File
                                    </a>
                                </div>
                                ))
                            ) : (
                            <>
                                {(filesToUpload.find(f => f.field === "taxDeclaration")?.files === null ||
                                filesToUpload.find(f => f.field === "taxDeclaration")?.files?.length === 0) ? (
                                <div className="document-requirements-container">
                                    <div className="no-signature-placeholder">
                                    <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>
                                        No files uploaded.
                                    </p>
                                    {documentMissing && (
                                        <>
                                        <label htmlFor="file-upload9" className="upload-btn">
                                            Click to Upload File
                                        </label>
                                        <input
                                            id="file-upload9"
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={(e) => {
                                            setFilesToUpload((prevFiles) =>
                                                prevFiles.map((file) =>
                                                file.field === "taxDeclaration"
                                                    ? { ...file, files: e.target.files ? Array.from(e.target.files) : null }
                                                    : file
                                                )
                                            );
                                            }}
                                        />
                                        </>
                                    )}
                                    </div>
                                </div>
                                ) : (
                                <div className="document-requirements-container">
                                    {filesToUpload
                                    .find(f => f.field === "taxDeclaration")
                                    ?.files?.map((file, idx) => {
                                        const previewURL = URL.createObjectURL(file);
                                        return (
                                        <div key={idx} className="preview-container">
                                            <img src={previewURL} alt="Preview" className="requirements-image" />
                                            <p className="file-name">{file.name}</p>
                                            <a href={previewURL} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                            View Image
                                            </a>
                                        </div>
                                        );
                                    })}
                                </div>
                                )}
                            </>
                            )}
                        </div>
                        </div>




                           </>
                           )}



                        </div>
                          
                        </>
                         )}


                          {/*FOR BARANGAY ID*/}
                    {activeSection === "emergency" && (
                        <>
                        {transactionData.docType === "Barangay ID" && (

                     <div className="incident-main-container">
                            {transactionData.emergencyDetails && (
                                <>

                            <div className="incident-container-upper">

                                <div className="incident-main-left">
                                    <div className="details-section-document">
                                        <div className="title">
                                            <p>First Name</p>
                                        </div>
                                        <div className="description">
                                            <p>{transactionData.emergencyDetails.firstName || "N/A"}</p>
                                        </div>
                                    </div>


                                    <div className="details-section-document">
                                        <div className="title">
                                            <p>Last Name</p>
                                        </div>
                                        <div className="description">
                                            <p>{transactionData.emergencyDetails.lastName || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="details-section-document">
                                        <div className="title">
                                            <p>Contact Number</p>
                                        </div>
                                        <div className="description">
                                            <p>{transactionData.emergencyDetails.contactNumber || "N/A"}</p>
                                        </div>
                                    </div>

                                </div>

                                
                                <div className="incident-main-right">

                                      <div className="details-section-document">
                                        <div className="title">
                                            <p>Middle Name</p>
                                        </div>
                                        <div className="description">
                                            <p>{transactionData.emergencyDetails.middleName || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="details-section-document">
                                        <div className="title">
                                            <p>Address</p>
                                        </div>
                                        <div className="description">
                                            <p>{transactionData.emergencyDetails.address || "N/A"}</p>
                                        </div>
                                    </div>

                                        <div className="details-section-document">
                                            <div className="title">
                                                <p>Relationship</p>
                                            </div>
                                            <div className="description">
                                            <p>{transactionData.emergencyDetails.relationship || "N/A"}</p>
                                        </div>
                                    </div>

                                </div>

                            </div>
                                </>
                                
                                
                            )}
                            </div>


                        )}

                        </>
                     )}
                    </div>

                 

                </div>
                

            </div>

               {errorPopup.show && ( <div className="popup-overlay-submit error"> <div className="popup-submit"> <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" /> <p>{errorPopup.message}</p> <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button">Close</button> </div> </div> )}

    
    </main>

    )
}