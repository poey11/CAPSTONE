"use client";
import "@/CSS/ResidentAccount/transactions.css";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
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
    firstName?: string; 
    middleName?: string; 
    lastName?: string; 
    gender?: string; 
    createdAt?: string; 
    signaturejpg?: string[];
    barangayIDjpg?: string[];
    validIDjpg?: string[];
    endorsementLetter?: string[];
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

}

export default function DocumentTransactionsDetails() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const referenceId = searchParams.get("id");

    const [transactionData, setTransactionData] = useState<BarangayDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [fileURLs, setFileURLs] = useState<{ field: string; url: string }[]>([]);

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
                const fileFields = ['signaturejpg', 'barangayIDjpg', 'validIDjpg', 'endorsementLetter', 'copyOfPropertyTitle', 'dtiRegistration', 'isCCTV', 'taxDeclaration', 'approvedBldgPlan'] as const;

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
    
      if (loading) return <p>Loading...</p>;
      if (!transactionData) return <p>Document request not found.</p>;

      const barangayDocumentFields = [
        /* General Fields*/
        { label: "Request Date", key: "createdAt" },
        { label: "Document Type", key: "docType" },
        { label: "Status", key: "status" },
        { label: "Full Name", key: "fullName" },
        { label: "Contact Number", key: "contact" },
        {label: "Requestor Name", key: "requestor" },
        ...(transactionData?.status === "Rejected"
           ? [{ label: "Rejection Reason", key: "rejectionReason" }]
           : []),

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
                { label: "Partner/Wife/Husband Full Name", key: "partnerWifeHusbandFullName" },
                { label: "Cohabitation Start Date", key: "cohabitationStartDate" },
                { label: "Cohabitation Relationship", key: "cohabitationRelationship" }
            ]:[]),
        ...(transactionData?.purpose === "Occupancy /  Moving Out" ?
            [{ label: "To Address", key: "toAddress" }]
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
            { label: "Son/Daughter For No Income", key: "noIncomeChildFName" }
            ]
            :[]
        ),  
        ...(transactionData?.purpose === "Estate Tax" ? 
            [
            { label: "Date of Death", key: "dateofdeath" },
            { label: "Estate Since", key: "estateSince" }
            ]
            :[]
        ),
        /*Barangay Certificate, Barangay Indigency, Barangay Clearance & Business Permits */
        ...(transactionData?.docType !== "Business Permit" && transactionData?.docType !== "Temporary Business Permit" && transactionData?.docType !== "Construction Permit"
                ? [
                    { label: "Address", key: "address" },
                    { label: "Date of Residency", key: "dateOfResidency" },
                    { label: "Birthday", key: "birthday" },
                    { label: "Age", key: "age" },
                    { label: "Gender", key: "gender" },
                    { label: "Civil Status", key: "civilStatus" },
                    { label: "Citizenship", key: "citizenship" },
                ]
                : []),

        /*Barangay Certificate, Barangay Indigency, Barangay Clearance & Business Permits */
        ...(transactionData?.docType === "Barangay Certificate" || transactionData?.docType === "Barangay Indigency" || 
            transactionData?.docType === "Barangay Clearance" || transactionData?.docType === "Business Permit" || transactionData?.docType === "Temporary Business Permit"
                ? [
                    { label: "Purpose", key: "purpose" }
                ]
                : []),

        /*Barangay Indigency & Barangay Certificate of Residency */
        ...(transactionData?.docType === "Barangay Indigency" ||
        (transactionData?.docType === "Barangay Certificate" && transactionData?.purpose === "Residency")
            ? [
                { label: "Appointment Date", key: "appointmentDate" }
            ]
            : []),

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
         ...(transactionData?.docType === "Construction Permit" 
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

    return (
        <main className="incident-transaction-container">
        <div className="headerpic-specific-transactions">
            <p>TRANSACTIONS</p>
        </div>

        <div className="incident-content">
            <div className="incident-content-section-1">
                <button type="button" className="back-button" onClick={handleBack}></button>
                <h1>Online Document Request</h1>
                <div className="status-container">
                    <p className={`status-dropdown-transactions ${transactionData.status?.toLowerCase() || ""}`}>
                    {transactionData.status || "N/A"}
                    </p> 
                    
                </div>

            </div>

            {barangayDocumentFields
                    .filter((field) => field.key !== "appointmentDate" && field.key !== "purpose" && !field.key.startsWith("emergencyDetails"))
                    .map((field) => (
                        <div key={field.key}>
                            <div className="details-section">
                                <div className="title">
                                    <p>{field.label}</p>
                                </div>
                                <div className="description">
                                    <p>
                                        {field.key === "educationalAttainment"
                                            ? getEducationalAttainmentLabel((transactionData as Record<string, any>)[field.key])
                                            : (transactionData as Record<string, any>)[field.key] || "N/A"}
                                    </p>
                                </div>
                            </div>

                            {/* Conditionally insert Purpose right after Document Type */}
                            {field.key === "docType" && (transactionData.purpose ? (
                                <div className="details-section" key="appointmentDate">
                                    <div className="title">
                                        <p>Purpose</p>
                                    </div>
                                    <div className="description">
                                        <p>{transactionData.purpose || "N/A"}</p>
                                    </div>
                                </div>
                            ) : null)}

                            {/* Conditionally insert Appointment Date right after Status */}
                            {field.key === "status" && (transactionData.appointmentDate ? (
                                <div className="details-section" key="appointmentDate">
                                    <div className="title">
                                        <p>Appointment Date</p>
                                    </div>
                                    <div className="description">
                                        <p>{transactionData.appointmentDate || "N/A"}</p>
                                    </div>
                                </div>
                            ) : null)}
                        </div>
                    ))}
        </div>

        {transactionData.docType === "Barangay ID" && (
        <div className="incident-content">
          <div className="incident-content-section-1">
            <p>Emergency Details</p>
          </div>

          {transactionData.emergencyDetails && (
            <>
                <div className="details-section">
                    <div className="title">
                        <p>First Name</p>
                    </div>
                    <div className="description">
                        <p>{transactionData.emergencyDetails.firstName || "N/A"}</p>
                    </div>
                </div>
        
               
                <div className="details-section">
                    <div className="title">
                        <p>Middle Name</p>
                    </div>
                    <div className="description">
                        <p>{transactionData.emergencyDetails.middleName || "N/A"}</p>
                    </div>
                </div>
        
                
                <div className="details-section">
                    <div className="title">
                        <p>Last Name</p>
                    </div>
                    <div className="description">
                        <p>{transactionData.emergencyDetails.lastName || "N/A"}</p>
                    </div>
                </div>
        
             
                <div className="details-section">
                    <div className="title">
                        <p>Address</p>
                    </div>
                    <div className="description">
                        <p>{transactionData.emergencyDetails.address || "N/A"}</p>
                    </div>
                </div>
        

                <div className="details-section">
                    <div className="title">
                        <p>Contact Number</p>
                    </div>
                    <div className="description">
                        <p>{transactionData.emergencyDetails.contactNumber || "N/A"}</p>
                    </div>
                </div>
        
                
                <div className="details-section">
                    <div className="title">
                        <p>Relationship</p>
                    </div>
                    <div className="description">
                        <p>{transactionData.emergencyDetails.relationship || "N/A"}</p>
                    </div>
                </div>
            </>
            
            
          )}
        </div>
      )}

        <div className="incident-content">
            <div className="incident-content-section-1">
              <h1>Requirements</h1>
            </div>


            {/* Additional fields for Business Permit and Temporary Business Permit */}
            {(transactionData.docType === "Business Permit" || transactionData.docType === "Temporary Business Permit" || transactionData.docType === "Construction Permit") && (
                <>
                <div className="details-section">
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
                        <p>N/A</p>
                    )}
                    </div>
                </div>

                </>
            )}
            {(transactionData.docType === "Business Permit" || transactionData.docType === "Temporary Business Permit") && (
                <>

                <div className="details-section">
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
                        <p>N/A</p>
                    )}
                    </div>
                </div>

                <div className="details-section">
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
                        <p>N/A</p>
                    )}
                    </div>
                </div>
                </>
            )}


            {/* Additional fields for Construction Permit */}
            {(transactionData.docType === "Construction Permit") && (
                <>
                <div className="details-section">
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
                        <p>N/A</p>
                    )}
                    </div>
                </div>

                <div className="details-section">
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
                        <p>N/A</p>
                    )}
                    </div>
                </div>
                </>
            )}

            <div className="details-section">
                <div className="title">
                    <p>Signature</p>
                </div>
                <div className="description">
                    {fileURLs.filter(({ field }) => field === "signaturejpg").length > 0 ? (
                            fileURLs.filter(({ field }) => field === "signaturejpg").map(({ url }, index) => (
                                <div key={index} className="document-requirements-container">
                                    <img src={url} alt="Signature - Uploaded File" className="requirements-image"/>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p>N/A</p>
                        )}
                </div>
            </div>

            {(transactionData.docType !== "Construction Permit" && transactionData.docType !== "Temporary Business Permit" && transactionData.docType !== "Business Permit") && (
                <>

                <div className="details-section">
                        <div className="title">
                            <p>Barangay ID</p>
                        </div>
                        <div className="description">
                            {fileURLs.filter(({ field }) => field === "barangayIDjpg").length > 0 ? (
                                    fileURLs.filter(({ field }) => field === "barangayIDjpg").map(({ url }, index) => (
                                        <div key={index} className="document-requirements-container">
                                            <img src={url} alt="Barangay ID - Uploaded File" className="requirements-image"/>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View File
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p>N/A</p>
                                )}
                        </div>
                    </div>

                    <div className="details-section">
                        <div className="title">
                            <p>Valid ID</p>
                        </div>
                        <div className="description">
                            {fileURLs.filter(({ field }) => field === "validIDjpg").length > 0 ? (
                                    fileURLs.filter(({ field }) => field === "validIDjpg").map(({ url }, index) => (
                                        <div key={index} className="document-requirements-container">
                                            <img src={url} alt="Valid ID - Uploaded File" className="requirements-image"/>
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                                View File
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p>N/A</p>
                                )}
                        </div>
                    </div>

                </>
            )}

            <div className="details-section">
                <div className="title">
                    <p>Endorsement Letter</p>
                </div>
                <div className="description">
                    {fileURLs.filter(({ field }) => field === "endorsementLetter").length > 0 ? (
                            fileURLs.filter(({ field }) => field === "endorsementLetter").map(({ url }, index) => (
                                <div key={index} className="document-requirements-container">
                                    <img src={url} alt="Endorsement Letter - Uploaded File" className="requirements-image"/>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="view-file-link">
                                        View File
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p>N/A</p>
                        )}
                </div>
            </div>
        </div>
    </main>

    )
}