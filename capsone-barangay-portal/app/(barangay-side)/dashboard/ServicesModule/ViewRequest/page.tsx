"use client";

import { getSpecificDocument } from "@/app/helpers/firestorehelper";
import { useSearchParams,useRouter } from "next/navigation";
import { use, useEffect,useState } from "react";
import { useSession } from "next-auth/react";
import { getDownloadURL, ref } from "firebase/storage";
import {storage,db} from "@/app/db/firebase";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";
import { collection, doc, setDoc, updateDoc, getDocs, query, onSnapshot } from "firebase/firestore";
import { handlePrint } from "@/app/helpers/pdfhelper";
import { useMemo } from "react";

interface EmergencyDetails {
    fullName: string;
    address: string;
    relationship: string;
    contactNumber: string;
  }
  
  interface OnlineRequest {
    sendTo: string;
    accID: string;
    requestId: string;
    docPrinted?: boolean; // Optional field to track if document is printed
    reqType?: string; // "Online" or "InBarangay"
    requestor: string;
    partnerWifeHusbandFullName: string;
    cohabitationStartDate: string;
    cohabitationRelationship:string;
    docType: string;
    status: string;
    purpose: string;
    createdAt: string;
    requestorFname: string;
    nosOfPUV: string;
    puvPurpose: string;
    appointmentDate: string;
    dateOfResidency: string;
    address: string; // Will also be the home address
    toAddress: string; // Will be the home address
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
    deathCertificate: string;
    identificationPic: string;
    dateofdeath: string;
    wardFname: string;
    wardRelationship: string;
    guardianshipType: string;
    CYFrom: string;
    CYTo: string;
    attestedBy: string;
    goodMoralPurpose: string;
    noIncomeChildFName: string;
    noIncomePurpose: string;
    deceasedEstateName: string;
    estateSince: string;
    noOfTRU: string;
    vehicleMake: string;
    vehicleType: string;
    vehiclePlateNo: string;
    vehicleSerialNo: string;
    vehicleChassisNo: string;
    vehicleEngineNo: string;
    vehicleFileNo: string;
    docsRequired: File[]; // Changed to File[] to match the file structure
    fromAddress: string;
    goodMoralOtherPurpose: string;
    noOfVechicles: string;
    dateOfFireIncident: string;
    nameOfTyphoon: string;
    dateOfTyphoon: string;
    projectLocation: string;
    homeOrOfficeAddress: string;
}

interface File {
    name?: string;
}


const ViewOnlineRequest = () => {
    const user = useSession().data?.user;
    const [userPosition, setUserPosition] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const  [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<OnlineRequest>();
    const [activeSection, setActiveSection] = useState("basic");
    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [matchedOtherDocFields, setMatchedOtherDocFields] = useState<string[]>([]);
    const [otherDocuments, setOtherDocuments] = useState<
      { type: string; title: string; fields: { name: string }[] }[]
    >([]);
    const [resolvedImageUrls, setResolvedImageUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setUserPosition(user.position || null);
        }

    },[user])


    useEffect(() => {
        if(!id) return
        const serviceRef = doc(db, "ServiceRequests", id);
        const unsubscribe = onSnapshot(serviceRef, (doc) => {
          if(doc.exists()) {
            const data = doc.data() as OnlineRequest;
            setRequestData(data);
            setLoading(false);
          }
        })
        return () => {
          unsubscribe(); // Clean up the listener
        };
        }, [id]);
    const [status, setStatus] = useState("");    
    
   
    useEffect(() => {
        if (!requestData) return;
        // Set status based on requestData
        setStatus(requestData?.status);
   }, [requestData]);
  
    const handleDownloadUrl = async (data: OnlineRequest): Promise<OnlineRequest> => {
      const fileJpgFields = [
        "signaturejpg",
        "barangayIDjpg",
        "validIDjpg",
        "letterjpg",
        "copyOfPropertyTitle",
        "dtiRegistration",
        "isCCTV",
        "taxDeclaration",
        "approvedBldgPlan",
        "deathCertificate",
        "identificationPic",
      ] as const;

      const updatedData = { ...data };

      for (const field of fileJpgFields) {
        const filename = data[field];

        // Skip if already a full URL
        if (
          filename &&
          typeof filename === "string" &&
          !filename.startsWith("https://")
        ) {
          try {
            const fileRef = ref(storage, `/ServiceRequests/${filename}`);
            const downloadUrl = await getDownloadURL(fileRef);
            updatedData[field] = downloadUrl;
          } catch (error) {
            console.warn(`Could not get URL for ${field}:`, error);
          }
        }
      }

      return updatedData;
    };

    
    useEffect(() => {
      const fetchMatchedOtherDocFields = async () => {
        try {
          if (!requestData?.docType || !requestData?.purpose) return;
    
          const snapshot = await getDocs(collection(db, "OtherDocuments"));
    
          const matchedDoc = snapshot.docs.find(
            (doc) =>
              doc.data().type === requestData.docType &&
              doc.data().title === requestData.purpose
          );
    
          if (matchedDoc) {
            const fields = matchedDoc.data().fields || [];
            const fieldNames = fields.map((f: any) => f.name);
            setMatchedOtherDocFields(fieldNames);
          } else {
            setMatchedOtherDocFields([]); // no match
          }
        } catch (error) {
          console.error("Error fetching matched OtherDocuments fields:", error);
        }
      };
    
      fetchMatchedOtherDocFields();
    }, [requestData?.docType, requestData?.purpose]);


  
  
  useEffect(() => {
    const fetchOtherDocs = async () => {
      const q = query(collection(db, "OtherDocuments"));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          type: data.type,
          title: data.title,
          fields: data.fields || [],
        };
      });
      setOtherDocuments(docs);
    };
  
    fetchOtherDocs();
  }, []);


   useEffect(() => {
      if (!requestData) return;
      if(!(requestData?.reqType === "In Barangay")) {
        const fetchUrls = async () => {
          const updated = await handleDownloadUrl(requestData);

          // Avoid state update if no real changes
          if (JSON.stringify(updated) !== JSON.stringify(requestData)) {
            setRequestData(updated);
          }
        };
        fetchUrls();
      }
    }, [requestData]);


    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedStatus = e.target.value;
        setPendingStatus(selectedStatus);     // store temporary selection
        setShowSubmitPopup(true);            // trigger confirmation popup
    };

    const confirmStatusChange = async () => {
        if (!pendingStatus) return;
    
        setShowSubmitPopup(false);
    
        // Show success popup immediately
        setPopupMessage("Status updated successfully!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    
        await handleSave(pendingStatus); // still perform DB updates in the background
        setPendingStatus(null);
    };

    useEffect(() => {
        if (requestData?.status) {
          setStatus(requestData.status);
        }
      }, [requestData?.status]);
    
    const cancelStatusChange = () => {
        setShowSubmitPopup(false);
        setPendingStatus(null);
    };


    const requestField = [
        { key: "createdAt", label: "Date Requested" },
        { key: "docType", label: "Document Type" },
        { key: "purpose", label: "Purpose" },
        { key: "appointmentDate", label: "Appointment Date" },
        { key: "fullName", label: "Full Name" },
        { key: "partnerWifeHusbandFullName", label: "Partner's/Wife's/Husband's Full Name" },
        { key: "businessName", label: "Business Name" },
        { key: "businessNature", label: "Business Nature" },
        { key: "businessLocation", label: "Business Location" },
        { key: "puvPurpose", label: "Purpose of Certificate" },
        { key: "vehicleType", label: "Vehicle Description"  },            
        { key: "nosOfPUV", label: "No of Vehicles"  },
        { key: "noOfTRU", label: "No Of Tricycle" },
        { key: "vehicleMake", label: "Tricycle Make" },
        { key: "vehicleType", label: "Tricycle Type"  },
        { key: "vehiclePlateNo", label: "Tricycle Plate No"  },
        { key: "vehicleSerialNo", label: "Tricycle Serial No"  },
        { key: "vehicleChassisNo", label: "Tricycle Chassis No" },
        { key: "vehicleEngineNo", label: "Tricycle Engine No" },
        { key: "vehicleFileNo", label: "Tricycle File No"  },
        { key: "cohabitationStartDate", label: "Start of Cohabitation" },
        { key: "cohabitationRelationship", label: "Cohabitation Relationship"},
        { key: "noIncomePurpose", label: "No Income Purpose" },
        { key: "noIncomeChildFName", label: "Son/Daughther's Name" },
        { key: "address", label: "Requestor's Address" },
        { key: "estateSince", label: "Estate Since" },
        { key: "guardianshipType", label: "Guardianship Type" },
        { key: "wardRelationship", label: "Ward's Relationship" },
        { key: "wardFname", label: "Ward's Full Name" },
        { key: "toAddress", label: "To Address" },
        { key: "attestedBy", label: "Attested By" },
        { key: "CYFrom", label: "Cohabitation Year From" },
        { key: "CYTo", label: "Cohabitation Year To" },
        { key: "goodMoralPurpose", label: "Purpose Of Good Moral" },
        { key: "age", label: "Requestor's Age" },
        { key: "dateOfResidency", label: "Requestor's Date of Residency" },
        { key: "occupation", label: "Occupation" },
        { key: "civilStatus", label: "Requestor's Civil Status" },
        { key: "citizenship", label: "Requestor's Citizenship" },
        { key: "gender", label: "Requestor's Gender" },
        { key: "contact", label: "Requestor's Contact" },
        { key: "birthday", label: "Requestor's Birthday" },
        { key: "dateofdeath", label: "Date Of Death" },
        { key: "estimatedCapital", label: "Estimated Capital" },
        { key: "typeofconstruction", label: "Type of Construction" },
        { key: "typeofbldg", label: "Type of Building" },
        { key: "projectName", label: "Project Name" },
        { key: "educationalAttainment", label: "Educational Attainment" },
        { key: "course", label: "Course" },
        { key: "isBeneficiary", label: "Is Beneficiary" },
        { key: "birthplace", label: "Birthplace" },
        { key: "religion", label: "Religion" },
        { key: "fromAddress", label: "From Address"},
        { key: "goodMoralOtherPurpose", label: "Certificate Purpose"}, // for Garage/PUV purpose iba lang kasi yung field name sa db
        { key: "noOfVechicles", label: "No of Vehicles"},
        
        // Emergency Details Fields
        { key: "emergencyDetails.firstName", label: "Emergency Contact First Name" },
        { key: "emergencyDetails.middleName", label: "Emergency Contact Middle Name" },
        { key: "emergencyDetails.lastName", label: "Emergency Contact Last Name" },
        { key: "emergencyDetails.address", label: "Emergency Contact Address" },
        { key: "emergencyDetails.relationship", label: "Emergency Contact Relationship" },
        { key: "emergencyDetails.contactNumber", label: "Emergency Contact Number" },

        { key: "requestor", label: "Requestor's Full Name"},
        { key: "rejectionReason", label: "Reason for Rejection"},
        { key: "dateOfFireIncident", label: "Date of Fire Incident"},
        { key: "nameOfTyphoon", label: "Name of Typhoon"},
        { key: "dateOfTyphoon", label: "Date of Typhoon"},
        { key: "projectLocation", label: "Project Location"},
        { key: "homeOrOfficeAddress", label: "Home / Office Address"},
        { key: "precinctnumber", label: "Precinct Number"},
        { key: "bloodtype", label: "Blood Type"},

        // File Fields
        { key: "signaturejpg", label: "Signature" },
        { key: "barangayIDjpg", label: "Barangay ID" },
        { key: "validIDjpg", label: "Valid ID" },
        { key: "letterjpg", label: "Endorsement Letter" },
        { key: "copyOfPropertyTitle", label: "Copy of Property Title" },
        { key: "dtiRegistration", label: "DTI Registration" },
        { key: "isCCTV", label: "CCTV Requirement" },
        { key: "taxDeclaration", label: "Tax Declaration" },
        { key: "approvedBldgPlan", label: "Approved Building Plan" },
        { key: "deathCertificate", label: "Death Certificate" },
        { key: "identificationPic", label: "Identification Picture" },
        ];


        
        const predefinedFieldSections: Record<string, {
            basic?: string[];
            full?: string[];
            others?: string[];
          }> = {
            "Death Residency": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "fullName",
                "dateofdeath",
                "estateSince",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
                "deathCertificate",
              ],
            },
            "Cohabitation": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "partnerWifeHusbandFullName",
                "cohabitationStartDate",
                "cohabitationRelationship",

              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],  
          },
         "Occupancy /  Moving Out": {
              basic: [
                "createdAt",
                "requestor",
                "docType",
                "dateOfResidency",
                "purpose",
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age",
                "civilStatus",
                "gender",
                "citizenship",
                "fullName",
                "fromAddress",
                "toAddress",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Guardianship": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "guardianshipType",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age",
                "civilStatus",
                "gender",
                "citizenship",
                "fullName",
                "wardRelationship",
                "wardFname",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Residency": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "appointmentDate",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "CYFrom", 
                "attestedBy", 
                "CYTo", 
              ],
              others: [
                "identificationPic",
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Good Moral and Probation": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency",               
                "purpose", 
                "address", 
                "goodMoralPurpose",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "No Income": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "noIncomePurpose",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "noIncomeChildFName",    
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Estate Tax": {
              basic: [
                "createdAt", 
                "requestor", 
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address", 
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "fullName",
                "dateofdeath",
                "estateSince",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
                "deathCertificate",
            ],
          },
          "Garage/TRU": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "businessName", 
                "vehiclePlateNo",
                "businessNature",
                "vehicleSerialNo",
                "businessLocation",
                "vehicleChassisNo",
                "noOfVechicles",
                "vehicleEngineNo",
                "vehicleMake",
                "vehicleFileNo",   
                "vehicleType",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Garage/PUV": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "goodMoralOtherPurpose",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "vehicleType",
                "noOfVechicles",
   
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Financial Subsidy of Solo Parent": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "goodMoralOtherPurpose",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "noIncomeChildFName"
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Fire Victims": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "dateOfFireIncident"
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Flood Victims": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "nameOfTyphoon",
                "dateOfTyphoon",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Barangay ID": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "birthplace",
                "occupation",
                "religion",
                "bloodtype",
                "nationality",
                "height",
                "precinctnumber",
                "weight"

              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "First Time Jobseeker": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "educationalAttainment",
                "course",
                "isBeneficiary",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          /* for business permit/temporary business permit */
          "New": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "businessName",
                "businessNature",
                "businessLocation",
                "estimatedCapital",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
          "Renewal": {
              basic: [
               "createdAt", 
               "requestor",
                "docType", 
                "dateOfResidency", 
                "purpose", 
                "address",
                "rejectionReason",
              ],
              full: [
                "birthday",
                "contact",
                "age", 
                "civilStatus", 
                "gender", 
                "citizenship", 
                "businessName",
                "businessNature",
                "businessLocation",
                "estimatedCapital",
              ],
              others: [
                "signaturejpg",
                "barangayIDjpg",
                "validIDjpg",
                "letterjpg",
            ],
          },
        }

        const constructionPermitFields = {
          /* For Construction Permit */
            basic: [
             "createdAt", 
             "requestor",
              "docType", 
              "dateOfResidency", 
              "purpose", 
              "address",
              "rejectionReason",
            ],
            full: [
              "birthday",
              "contact",
              "age", 
              "civilStatus", 
              "gender", 
              "citizenship", 
              "typeofconstruction",
              "projectName",
              "typeofbldg",
              "projectLocation",
              "homeOrOfficeAddress",
            ],
            others: [
              "signaturejpg",
              "barangayIDjpg",
              "validIDjpg",
              "letterjpg",
          ],
        }

        
        const otherDocPredefinedFields = {
          basic: [
            "createdAt", 
            "requestor", 
            "docType", 
            "dateOfResidency", 
            "purpose", 
            "address", 
            "rejectionReason",
          ],
          full: [
            "birthday",
            "contact",
            "age", 
            "civilStatus", 
            "gender", 
            "citizenship", 
          ],
          others: [
            "signaturejpg",
            "barangayIDjpg",
            "validIDjpg",
            "letterjpg",
          ],
        };
        

        const defaultFieldSections = {
          basic: ["createdAt", "requestor", "docType", "dateOfResidency", "purpose", "address", "rejectionReason",],
          full: ["birthday", "contact", "age", "civilStatus", "gender", "citizenship"],
          others: ["signaturejpg", "barangayIDjpg", "validIDjpg", "letterjpg"],
        };
        
        const excludedImageFields = [
          "signaturejpg",
          "barangayIDjpg",
          "validIDjpg",
          "letterjpg",
        ];


        
        
        const fieldSections = useMemo(() => {
          if (requestData?.docType === "Construction") {
            return {
              basic: [...constructionPermitFields.basic],
              full: [...constructionPermitFields.full],
              others: [...constructionPermitFields.others],
            };
          }
        
          if (!requestData?.purpose && !requestData?.docType) return defaultFieldSections;
        
          // Match by (1) purpose + type
          const matchedByPurpose = otherDocuments.find(
            (doc) =>
              doc.title === requestData?.purpose &&
              doc.type === requestData?.docType
          );
        
          // Match by (2) docType === title
          const matchedByDocType = otherDocuments.find(
            (doc) => doc.title === requestData?.docType
          );
        
          // ✅ Match by (3) title === purpose (regardless of type)
          const matchedByTitleOnly = otherDocuments.find(
            (doc) => doc.title === requestData?.purpose
          );
        
          // ✅ Combine all matched fields
          const combinedFields = Array.from(
            new Map(
              [
                ...(matchedByPurpose?.fields || []),
                ...(matchedByDocType?.fields || []),
                ...(matchedByTitleOnly?.fields || []),
              ].map((field) => [field.name, field]) // key by field name
            ).values()
          );
        
          const excludedDynamicFields = [
            "requestorFname",
            "requestorMrMs",
            "dateOfResidency",
            "address",
          ];
        
          const dynamicFields = combinedFields
            .map((f) => f.name)
            .filter((name) => !excludedDynamicFields.includes(name));
        
          const dynamicToFull = dynamicFields.filter(
            (field) => !excludedImageFields.includes(field)
          );
          const dynamicToOthers = dynamicFields.filter((field) =>
            excludedImageFields.includes(field)
          );
        
          const predefined = predefinedFieldSections[requestData?.purpose || ""];
        
          if (predefined) {
            return {
              basic: [...(predefined.basic || [])],
              full: [...(predefined.full || []), ...dynamicToFull],
              others: [...(predefined.others || []), ...dynamicToOthers],
            };
          } else if (matchedByPurpose || matchedByDocType || matchedByTitleOnly) {
            return {
              basic: [...otherDocPredefinedFields.basic],
              full: [...otherDocPredefinedFields.full, ...dynamicToFull],
              others: [...otherDocPredefinedFields.others, ...dynamicToOthers],
            };
          } else {
            return defaultFieldSections;
          }
        }, [requestData?.purpose, requestData?.docType, otherDocuments]);
        

        
        const formatFieldName = (name: string) =>
          name
            .replace(/_/g, " ") // Replace underscores with spaces
            .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word

        const getLabel = (key: string): string => {
          const baseLabel = requestField.find((field) => field.key === key)?.label || formatFieldName(key);
        
          if (key === "fullName") {
            // Customize label for fullName depending on docType or purpose
            if (requestData?.purpose === "Occupancy /  Moving Out") {
              return `From ${baseLabel}`;
            }

            if (requestData?.purpose === "Estate Tax" || requestData?.purpose === "Death Residency") {
              return `Deceased's ${baseLabel}`;
            }
        
            if (requestData?.purpose === "Guardianship") {
              return `Guardian's ${baseLabel}`;
            }
        
            // Default fallback
            return baseLabel;
          }
        
          return baseLabel;
        };
      
    const currentPurpose = requestData?.purpose as keyof typeof predefinedFieldSections;
    const currentSections = predefinedFieldSections[currentPurpose] || {};

    useEffect(() => {
      const resolveFilenamesToUrls = async () => {
        if (!requestData) return;
    
        const allFieldKeys = [
          ...fieldSections.basic,
          ...fieldSections.full,
          ...fieldSections.others,
        ];
    
        const keys = Object.keys(requestData).filter((key) => {
          const value = String(requestData[key as keyof typeof requestData]);
          return (
            !allFieldKeys.includes(key) &&
            typeof value === "string" &&
            value.startsWith("service_request_")
          );
        });
    
        const resolved: Record<string, string> = {};
        for (const key of keys) {
          try {
            const filename = requestData[key as keyof typeof requestData];
            const fileRef = ref(storage, `ServiceRequests/${filename}`);
            const url = await getDownloadURL(fileRef);
            resolved[key] = url;
          } catch (error) {
            console.error("Failed to get download URL for", key, error);
          }
        }
    
        setResolvedImageUrls(resolved);
      };
    
      resolveFilenamesToUrls();
    }, [requestData, fieldSections]);
      
    const renderSection = (sectionName: "basic" | "full" | "others") => {
      let fieldKeys = fieldSections[sectionName] || [];

      if (sectionName === "others") {
        return (
          <div className="others-image-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {requestData?.reqType === "InBarangay" ? (
              <>
                {requestData?.docsRequired?.map((file, index) => (
                  <div key={index} className="services-onlinereq-verification-requirements-section">
                    <span className="verification-requirements-label">Image {index + 1}</span>
                    <div className="services-onlinereq-verification-requirements-container">
                      <a href={file.name} target="_blank" rel="noopener noreferrer">
                        <img
                          src={file.name}
                          alt={`Image ${index}`}
                          className="verification-reqs-pic uploaded-picture"
                          style={{ cursor: 'pointer' }}
                        />
                      </a>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
               {requestData &&
                [
                  ...fieldKeys,
                  ...Object.keys(requestData).filter((key) => {
                    const value = String(requestData[key as keyof typeof requestData]);
                    return (
                      !fieldKeys.includes(key) &&
                      typeof value === "string" &&
                      (value.startsWith("https://firebasestorage") || value.startsWith("service_request_"))
                    );
                  }),
                ].map((key) => {
                  const value = requestData[key as keyof typeof requestData];
                  if (!value) return null;

                  let fileUrl: string | undefined;
                    if (typeof value === "string") {
                      fileUrl = value.startsWith("service_request_") ? resolvedImageUrls[key] : value;
                    }

                  if (!fileUrl) return null; // still loading or failed to resolve

                  return (
                    <div key={key} className="services-onlinereq-verification-requirements-section">
                      <span className="verification-requirements-label">{getLabel(key)}</span>
                      <div className="services-onlinereq-verification-requirements-container">
                      {fileUrl && (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={fileUrl}
                            alt={getLabel(key)}
                            className="verification-reqs-pic uploaded-picture"
                            style={{ cursor: 'pointer' }}
                          />
                        </a>
                      )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      }
    
      

      //  Layout for basic/full with dynamic fields included
      const leftFields = fieldKeys.filter((_, i) => i % 2 === 0);
      const rightFields = fieldKeys.filter((_, i) => i % 2 !== 0);
    
      const renderField = (key: string) => {
        let value;
      
        if (key.includes(".")) {
          value = key.split(".").reduce((obj, k) => (obj as any)?.[k], requestData);
        } else {
          value = (requestData as any)?.[key];
        }
      
        if (key === "isBeneficiary") {
          value = value === true ? "Yes" : value === false ? "No" : "";
        }
      
        if (!value) return null;
      
        return (
          <div key={key} className="services-onlinereq-fields-section">
            <p>{getLabel(key)}</p>
            <input
              type="text"
              className="services-onlinereq-input-field"
              value={value}
              readOnly
            />
          </div>
        );
      };
    
      return (
        <div className="services-onlinereq-content" style={{ display: 'flex', gap: '2rem' }}>
          <div className="services-onlinereq-content-left-side" style={{ flex: 1 }}>
            {leftFields.map(renderField)}
          </div>
          <div className="services-onlinereq-content-right-side" style={{ flex: 1 }}>
            {rightFields.map(renderField)}
          </div>
        </div>
      );
    };
     
    const handleBack = () => {
        router.back();
    };

    const handleviewappointmentdetails = () => {
        router.push("/dashboard/ServicesModule/Appointments")
    };

    const handlerejection = () => {
        router.push("/dashboard/ServicesModule/OnlineRequests/ReasonForReject/?id=" + id);
    };

    const handleSave = async (newStatus: string) => {
        try {
            if (!id) return;
        
            const docRef = doc(db, "ServiceRequests", id);
        
            const updatedData = {
                status: newStatus,
                ...(newStatus === "Pending" && { statusPriority: 1 }),
                ...(newStatus === "Pick-up" && { statusPriority: 2 }),
                ...(newStatus === "Completed" && { statusPriority: 3 }),
            };
        
            // Create notification
            const notificationRef = doc(collection(db, "Notifications"));
            await setDoc(notificationRef, {
                residentID: requestData?.accID,
                requestID: requestData?.requestId,
                message: `Your Document Request (${requestData?.requestId}) has been updated to "${newStatus}".`,
                timestamp: new Date(),
                transactionType: "Online Request",
                isRead: false,
            });
        
            // Update Firestore document
            await updateDoc(docRef, updatedData);
        
            //  Manually update local requestData state so UI changes immediately
            setRequestData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    ...updatedData
                } as OnlineRequest;
            });
        
            setStatus(newStatus); // update local state after DB update

            
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSMS = async() => {
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  to: requestData?.contact,
                  message: `Hello Mr/Ms. ${requestData?.requestorFname}, your 
                  document request with ID ${requestData?.requestId} 
                  is now ready for pick-up. Please visit the barangay hall 
                  to collect your document. Thank you!`,
              })
          });
          if (!response.ok) throw new Error("Failed to send SMS");

          const data = await response.json();
          console.log(data);
        }
        catch(err) {
          console.log(err);
        }  
    };
  
    const [showReceivalForm, setShowReceivalForm] = useState(false);
    const [receival, setReceival] = useState({
      receivalName: "",
      receivalWhen: new Date(),
      receivalNotes: "",
      recievalOther: "",
    })

    const handleReceivalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!id) return;

      const docRef = doc(db, "ServiceRequests", id);
      const updatedData = {
        ...(receival.receivalName === "Others" ? {
           receivalName: receival.recievalOther 
        }:{

          receivalName: receival.receivalName,
        }),
        receivalWhen: receival.receivalWhen,
        receivalNotes: receival.receivalNotes,
        status: "Completed",
        statusPriority: 3,
      };

      await updateDoc(docRef, updatedData);
      setShowReceivalForm(false);
      handleRequestIsDone();

    }

    const docPrinted = requestData?.docPrinted;

    
    const print = async() => {
      /* This part will handle ung pag generate ng pdf and also updates the request's status to In - Progress */
      handlePrint(requestData);
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      let updatedData: any = {
          status: "In - Progress",
          statusPriority: 2,
          docPrinted: true,
      };

      await updateDoc(docRef, updatedData);
    }

    const handleNextStep = async() => {
      if(!id) return;
      let updatedData = {}
      const docRef = doc(db, "ServiceRequests", id);

      if(requestData?.sendTo === "SAS"){
          /* This part will handle ung pag notify kay admin staff regarding the doc  */
         updatedData = {
          sendTo: "Admin Staff",
        }
      }else{
        /* This part will handle ung pag notify kay resident na to pickup na ung  doc */
        //handleSMS(); Admin Staff will handle the sending of SMS to the resident
        updatedData = {
          status: "Pick-up",
          statusPriority: 3,
        }
      }
      router.push("/dashboard/ServicesModule/InBarangayRequests");
      
      await updateDoc(docRef, updatedData);
    }

    const handleRequestIsDone = async() => {
      /* This part will handle ung pag update ng status to Completed and nareceive n ni resident yung document */
      if(!id) return;
      const docRef = doc(db, "ServiceRequests", id);
      const updatedData = {
          status: "Completed",
          statusPriority: 4,
      };
      await updateDoc(docRef, updatedData);
    }

    return (  
        <main className="main-container-services-onlinereq">

        
            {
              (
                (userPosition === "Admin Staff" && requestData?.sendTo === "Admin Staff") ||
                (["Assistant Secretary", "Secretary"].includes(userPosition || "") && requestData?.sendTo === "SAS")
              )
              && (
                <>
                  {(status !== "Completed" && status !== "Rejected") && (
                    <>
                      <div className="services-onlinereq-redirectionpage-section">
                        
                        {!docPrinted && (
                          <>
                            <button className="services-onlinereq-redirection-buttons" onClick={handlerejection}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/rejected.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Reject Request</h1>
                            </button>
                            <button className="services-onlinereq-redirection-buttons" onClick={print}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Generate Document</h1>
                            </button>
                          </>
                        )}
                        {docPrinted && (userPosition !== "Admin Staff") ? (
                          <>
                            <button className="services-onlinereq-redirection-buttons" onClick={handleNextStep}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Notify Admin Staff</h1>
                            </button>
                          </>
                        ) : (docPrinted && !["Assistant Secretary", "Secretary"].includes(userPosition as string) && status !== "Pick-up") &&(
                          <>
                            <button className="services-onlinereq-redirection-buttons" onClick={handleNextStep}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Notify Resident</h1>
                            </button>
                          </>
                        )}
                         {docPrinted && status === "Pick-up" && (
                          <>
                            <button className="services-onlinereq-redirection-buttons" onClick={() => setShowReceivalForm(true)}>
                              <div className="services-onlinereq-redirection-icons-section">
                                  <img src="/images/generatedoc.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Document Received</h1>
                            </button>
                          </>
                        )}

                        {/* {status === "Pick-up" && docPrinted && (
                          <button  onClick={handleSMS} className="services-onlinereq-redirection-buttons">
                              <div className="services-onlinereq-redirection-icons-section">
                              <img src="/images/sendSMS.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Send SMS</h1>
                          </button>
                        )} */}
                        {requestData?.appointmentDate && (
                          <button className="services-onlinereq-redirection-buttons" onClick={handleviewappointmentdetails}>
                              <div className="services-onlinereq-redirection-icons-section">
                              <img src="/images/appointment.png" alt="user info" className="redirection-icons-info" />
                              </div>
                              <h1>Appointment Details</h1>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
            )}

            <div className="services-onlinereq-main-content">
                <div className="services-onlinereq-main-section1">
                    <div className="services-onlinereq-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> {requestData?.reqType || "Online"} Document Request Details </h1>
                    </div>
                </div>

                <div className="services-onlinereq-header-body">

                    <div className="services-onlinereq-header-body-top-section">
                        <div className="services-onlinereq-info-toggle-wrapper">
                            {["basic", "full", ...(requestData?.purpose === "Barangay ID" ? ["emergency"] : []), "others"].map((section) => (
                                <button
                                key={section}
                                type="button"
                                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                                {section === "basic" && "Basic Info"}
                                {section === "full" && "Full Info"}
                                {section === "emergency" && "Emergency Info"}
                                {section === "others" && "Others"}
                                </button>
                            ))}
                        </div> 
                    </div>

                    <div className="services-onlinereq-header-body-bottom-section">
                        <div className="services-onlinereq-main-details-container">
                            <div className="services-onlinereq-main-details-section">
                                <div className="services-onlinereq-main-details-topsection">
                                    <h1>{requestData?.requestId}</h1>
                                </div>
                                <div className="services-onlinereq-main-details-statussection">
                                    <h1> Status</h1>

                                    <div className="services-onlinereq-status-section-view">
                                        <select
                                            id="status"
                                            className={`services-onlinereq-status-dropdown ${status ? status[0].toLowerCase() + status.slice(1):""}`}
                                            name="status"
                                            value={status}
                                            onChange={handleStatusChange}
                                            disabled
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In - Progress">In - Progress</option>
                                            <option value="Pick-up">Pick-up</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Rejected" disabled>Rejected</option>
                                        </select>
                                    </div> 
                                </div>

                                <div className="services-onlinereq-main-details-description">
                                    <div className="onlinereq-purpose-section">
                                        <div className="onlinereq-purpose-topsection">
                                            <div className="onlinereq-main-details-icons-section">
                                                <img src="/Images/purpose.png" alt="description icon" className="onlinereq-type-section-icon" />
                                            </div>
                                            <div className="onlinereq-main-details-title-section">
                                                <h1>Document Type</h1>
                                            </div>
                                        </div>
                                        <p>{requestData?.docType || "N/A"}</p>
                                    </div>
                                    <div className="onlinereq-purpose-section">
                                        <div className="onlinereq-purpose-topsection">
                                            <div className="onlinereq-main-details-icons-section">
                                                <img src="/Images/description.png" alt="description icon" className="onlinereq-purpose-section-icon" />
                                            </div>
                                            <div className="onlinereq-main-details-title-section">
                                                <h1>Purpose</h1>
                                            </div>
                                        </div>
                                        <p>{requestData?.purpose || "N/A"}</p>
                                    </div>

                                  
                                  
                                            <div className="onlinereq-date-section">
                                                <div className="onlinereq-date-topsection">
                                            <div className="onlinereq-main-details-icons-section">
                                           <img src="/Images/calendar.png" alt="calendar icon" className="onlinereq-calendar-section-icon" />
                                              </div>
                                              <div className="onlinereq-main-details-title-section">
                                                <h1>Date Requested</h1>
                                             </div>
                                           </div>
                                         <p>{requestData?.createdAt || "N/A"}</p>
                                      </div>
                                      
                                   

                                    {requestData?.appointmentDate && (
                                        <>
                                            <div className="onlinereq-date-section">
                                                <div className="onlinereq-date-topsection">
                                                    <div className="onlinereq-main-details-icons-section">
                                                        <img src="/Images/calendar.png" alt="calendar icon" className="onlinereq-calendar-section-icon" />
                                                    </div>
                                                    <div className="onlinereq-main-details-title-section">
                                                        <h1>Appointment Date</h1>
                                                    </div>
                                                </div>
                                                <p>{requestData?.appointmentDate || "N/A"}</p>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>
                        </div>

                        <div className="services-onlinereq-info-main-container">
                            <div className="services-onlinereq-info-container-scrollable">
                                <div className="services-onlinereq-info-main-content">

                                    
                                {activeSection === "basic" && <> {renderSection("basic")} </>}
                                
                                {activeSection === "full" && <> {renderSection("full")} </>}


                                {activeSection === "emergency" && (
                                <div className="services-onlinereq-content" style={{ display: 'flex', gap: '2rem' }}>
                                  <div className="services-onlinereq-content-left-side" style={{ flex: 1 }}>
                                    <div className="services-onlinereq-fields-section">
                                      <p>Emergency Contact Full Name</p>
                                      <input
                                        type="text"
                                        className="services-onlinereq-input-field"
                                        value={requestData?.emergencyDetails?.fullName || ""}
                                        readOnly
                                      />
                                    </div>
                                    <div className="services-onlinereq-fields-section">
                                      <p>Emergency Contact Address</p>
                                      <input
                                        type="text"
                                        className="services-onlinereq-input-field"
                                        value={requestData?.emergencyDetails?.address || ""}
                                        readOnly
                                      />
                                    </div>
                                    
                                  </div>

                                  <div className="services-onlinereq-content-right-side" style={{ flex: 1 }}>
                                    <div className="services-onlinereq-fields-section">
                                      <p>Emergency Contact Number</p>
                                      <input
                                        type="text"
                                        className="services-onlinereq-input-field"
                                        value={requestData?.emergencyDetails?.contactNumber || ""}
                                        readOnly
                                      />
                                    </div>

                                    <div className="services-onlinereq-fields-section">
                                      <p>Relationship</p>
                                      <input
                                        type="text"
                                        className="services-onlinereq-input-field"
                                        value={requestData?.emergencyDetails?.relationship || ""}
                                        readOnly
                                      />
                                    </div>
                                    
                                  </div>
                                </div>
                              )}
                                

                                {activeSection === "others" && <> {renderSection("others")} </>}

                                        

                                </div>
                            </div>
                        </div>

                    </div>

                </div>


            </div>

            {showSubmitPopup && (
                <div className="confirmation-popup-overlay-services-onlinereq-status">
                    <div className="confirmation-popup-services-onlinereq-status">
                        <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                        <p>Are you sure you want to change the status to <strong className="pending-status-word">{pendingStatus}</strong>?</p>
                        <div className="yesno-container-add">
                            <button onClick={cancelStatusChange} className="no-button-add">No</button>
                            <button onClick={confirmStatusChange} className="yes-button-add">Yes</button>
                        </div>
                    </div>
                </div>
            )}


            {showReceivalForm && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md relative">
                    <h2 className="text-xl font-semibold mb-4">Document Receival Form</h2>
                    <form onSubmit={handleReceivalSubmit} className="space-y-4">
                        <label className="block">
                          <span className="block mb-1">Name of Person Receiving:</span>
                            <select
                                value={receival.receivalName}
                                onChange={(e) => setReceival({ ...receival, receivalName: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                                required
                            >
                              <option value="" disabled>Select Name</option>
                              <option value={requestData?.requestorFname}>{requestData?.requestorFname}</option>
                              <option value="Others">Others</option>
                            </select>

                            {receival.receivalName === "Others" && (
                              <>
                                <span className="block mb-1">Please specify:</span>
                                <input
                                    type="text"
                                    value={receival.recievalOther}
                                    onChange={(e) => setReceival({ ...receival, recievalOther: e.target.value })}
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                              </>
                            )}                        
                          
                        </label>
                        <label className="block">
                            <span className="block mb-1">Notes (if any):</span>
                            <textarea
                                value={receival.receivalNotes}
                                onChange={(e) => setReceival({ ...receival, receivalNotes: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                rows={3}
                            />
                        </label>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowReceivalForm(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">
                            Close
                          </button>
                          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                            Submit
                          </button>
                        </div>
                    </form>
                  </div>
              </div>
            )}

            {showPopup && (
                <div className={`popup-overlay-services-onlinereq show`}>
                    <div className="popup-services-onlinereq">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}
        </main>
    );

    
}
 
export default ViewOnlineRequest;