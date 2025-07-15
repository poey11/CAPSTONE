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
import { clear } from "console";


interface EmergencyDetails {
  fullName?: string;
  address?: string;
  relationship?: string;
  contactNumber?: string;
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
    noOfVehicles?: string;
    noOfTricycles?: string;
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
    status?: string; // Optional, can be added if needed
    statusPriority?: number; // Optional, can be added if 
    reqType?: string; // Optional, can be added if needed
    isResident?: boolean;
    nameOfTyphoon?: string;
    dateOfTyphoon?: string;
    dateOfFireIncident?: string;
    fromAddress?: string;


    signaturejpg: File | null;
    barangayIDjpg: File | null;
    validIDjpg: File | null;
    letterjpg: File | null;
    copyOfPropertyTitle: File | null;
    dtiRegistration: File | null;
    isCCTV: File | null;
    taxDeclaration: File | null;
    approvedBldgPlan: File | null;
    deathCertificate: File | null;
    identificationPic: File | null;
    twoByTwoPicture: File | null;
}



export default function action() {
    const { data: session } = useSession();
    const user = session?.user;
    const router = useRouter();
    const searchParam = useSearchParams();
    const docType = searchParam.get("docType");
    const docPurpose = searchParam.get("purpose");
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [showCreatePopup, setShowCreatePopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [isResidentSelected, setIsResidentSelected] = useState(false);
    const [isRequestorSelected, setIsRequestorSelected] = useState(false);
    const [showResidentsPopup, setShowResidentsPopup] = useState(false);
    const [residents, setResidents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [otherDocPurposes, setOtherDocPurposes] = useState<{ [key: string]: string[] }>({});
    const [forResidentOnlyMap, setForResidentOnlyMap] = useState<{ [title: string]: boolean }>({});
    const [otherDocFields, setOtherDocFields] = useState<{ [title: string]: string[] }>({});
    const [otherDocImageFields, setOtherDocImageFields] = useState<{ [title: string]: string[] }>({});

    // State for all file containers
    const [files1, setFiles1] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files2, setFiles2] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files3, setFiles3] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files4, setFiles4] = useState<{ name: string, preview: string | undefined }[]>([]);

    const [files5, setFiles5] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files6, setFiles6] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files7, setFiles7] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files8, setFiles8] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files9, setFiles9] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files10, setFiles10] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files11, setFiles11] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [files12, setFiles12] = useState<{ name: string, preview: string | undefined }[]>([]);

    
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
            const imageFieldMap: { [key: string]: string[] } = {};
            const residentOnlyMap: { [key: string]: boolean } = {};
      
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              const { type, title, fields, imageFields, forResidentOnly } = data;
      
              if (type && title) {
                if (!groupedTitles[type]) groupedTitles[type] = [];
                groupedTitles[type].push(title);
      
                if (Array.isArray(fields)) {
                  fieldMap[title] = fields.map((f: any) => f.name);
                }
      
                if (Array.isArray(imageFields)) {
                  imageFieldMap[title] = imageFields;
                }
      
                residentOnlyMap[title] = !!forResidentOnly;
              }
            });
      
            setOtherDocPurposes(groupedTitles);
            setOtherDocFields(fieldMap);
            setOtherDocImageFields(imageFieldMap);
            setForResidentOnlyMap(residentOnlyMap);
          } catch (error) {
            console.error("Error fetching OtherDocuments:", error);
          }
        };
      
        fetchOtherDocumentPurposes();
      }, []);


      const removeNullFields = (obj: Record<string, any>): Record<string, any> => {
        const cleaned: Record<string, any> = {};
        for (const key in obj) {
          const value = obj[key];
      
          if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !(typeof value === "object" && !Array.isArray(value) && Object.values(value).every(v => v === ""))
          ) {
            cleaned[key] = value;
          }
        }
        return cleaned;
      };

      const [clearanceInput, setClearanceInput] = useState<ClearanceInput>({
      accID: "INBRGY-REQ",
      reqType: "In Barangay",
      docType: docType || "",
      status: "Pending",
      createdAt: new Date().toLocaleString(),
      createdBy: user?.id || "",
      statusPriority: 1,
      signaturejpg: null,
      barangayIDjpg: null,
      validIDjpg: null,
      letterjpg: null,
      copyOfPropertyTitle: null,
      dtiRegistration: null,
      isCCTV: null,
      taxDeclaration: null,
      approvedBldgPlan: null,
      deathCertificate: null,
      identificationPic: null,
      twoByTwoPicture: null,  
      isResident: false,
    
      // ADD THESE TO AVOID WARNINGS
      residentId: "",
      requestType: "",
      requestId: "",
      purpose: docPurpose|| "",
      fullName: "",
      dateOfResidency: "",
      dateofdeath: "",
      address: "",
      homeOrOfficeAddress: "",
      toAddress: "",
      businessLocation: "",
      businessNature: "",
      noOfVehicles: "",
      noOfTricycles: "",
      vehicleMake: "",
      vehicleType: "",
      vehiclePlateNo: "",
      vehicleSerialNo: "",
      vehicleChassisNo: "",
      vehicleEngineNo: "",
      vehicleFileNo: "",
      estimatedCapital: "",
      businessName: "",
      birthday: "",
      age: "",
      gender: "",
      civilStatus: "",
      contact: "",
      typeofconstruction: "",
      typeofbldg: "",
      othersTypeofbldg: "",
      projectName: "",
      projectLocation: "",
      citizenship: "",
      educationalAttainment: "",
      course: "",
      birthplace: "",
      religion: "",
      nationality: "",
      height: "",
      weight: "",
      bloodtype: "",
      occupation: "",
      precinctnumber: "",
      requestorMrMs: "",
      requestorFname: "",
      partnerWifeHusbandFullName: "",
      cohabitationStartDate: "",
      cohabitationRelationship: "",
      wardFname: "",
      wardRelationship: "",
      guardianshipType: "",
      CYFrom: "",
      CYTo: "",
      attestedBy: "Jose Arnel L. Quebal",
      goodMoralPurpose: "",
      goodMoralOtherPurpose: "",
      noIncomePurpose: "",
      noIncomeChildFName: "",
      deceasedEstateName: "",
      estateSince: "",
      nameOfTyphoon: "",
      dateOfTyphoon: "",
      dateOfFireIncident: "",  
      fromAddress: "",
      emergencyDetails: {
        fullName: "",
        address: "",
        relationship: "",
        contactNumber: "",
      },
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

    
  
      // Handle file deletion for documents container
      const handleSignatureDelete = (fileName: string) => {
        setFiles1((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleBarangayIDDelete = (fileName: string) => {
        setFiles2((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleValidIDDelete = (fileName: string) => {
        setFiles3((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleEndorsementDelete = (fileName: string) => {
        setFiles4((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handlePropertyContractDelete = (fileName: string) => {
        setFiles5((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handle2x2IDDelete = (fileName: string) => {
        setFiles12((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      }
      const handleDTIDelete = (fileName: string) => {
        setFiles6((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleCCTVDelete = (fileName: string) => {
        setFiles7((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleTaxDeclarationDelete = (fileName: string) => {
        setFiles8((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleBldgConstructionPlanDelete = (fileName: string) => {
        setFiles9((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleDeathCertificateDelete = (fileName: string) => {
        setFiles10((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };

      const handleIdentificationPicDelete = (fileName: string) => {
        setFiles11((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      };


      const handleDynamicImageUpload = (fieldName: string, file: File) => {
        const preview = URL.createObjectURL(file);
        setDynamicFileStates((prev) => ({
          ...prev,
          [fieldName]: [{ name: file.name, preview }],
        }));
      
        setClearanceInput((prev: any) => ({
          ...prev,
          [fieldName]: file,
        }));
      
        setTimeout(() => URL.revokeObjectURL(preview), 10000);
      };
      
      const handleDynamicImageDelete = (fieldName: string, fileName: string) => {
        setDynamicFileStates((prev) => ({
          ...prev,
          [fieldName]: prev[fieldName]?.filter((file) => file.name !== fileName) || [],
        }));
      
        setClearanceInput((prev: any) => ({
          ...prev,
          [fieldName]: null,
        }));
      };

  


    const handleSignatureUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles1([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        signaturejpg: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleBarangayIDUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles2([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        barangayIDjpg: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handle2x2IDUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles12([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        twoByTwoPicture: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    }

    const handleValidIDUpload = (
      e: React.ChangeEvent<HTMLInputElement> |string
    ) => {
      // If a string is passed (URL from resident DB)
      if (typeof e === "string") {
        setFiles3([{ name: "Uploaded ID from Resident List", preview: e }]);

        setClearanceInput((prev: any) => ({
          ...prev,
          validIDjpg: e, // URL string
        }));

        return;
      }
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles3([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        validIDjpg: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleEndorsementUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles4([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        letterjpg: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handlePropertyContractUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles5([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        copyOfPropertyTitle: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleDTIUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles6([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        dtiRegistration: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleCCTVUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles7([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        isCCTV: file,
      }));

      e.target.value = "";

      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleTaxDeclarationUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles8([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        taxDeclaration: file,
      }));

      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleBldgConstructionPlanUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles9([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        approvedBldgPlan: file,
      }));

      
      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleDeathCertificateUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles10([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        deathCertificate: file,
      }));

      
      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
    };

    const handleIdentificationPicUpload = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
    
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validImageTypes.includes(file.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }
    
      const preview = URL.createObjectURL(file);
      setFiles11([{ name: file.name, preview }]);
    
      setClearanceInput((prev: any) => ({
        ...prev,
        identificationPic: file,
      }));

      
      e.target.value = "";
    
      // Optional: revoke URL after timeout
      setTimeout(() => URL.revokeObjectURL(preview), 10000);
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


    let id: string | undefined;
    const handleUploadClick = async () => {
      try {
        const docRef = collection(db, "ServiceRequests");
    
        const uploadedFileUrls: Record<string, string> = {};
    
        // Upload predefined files
        const fileKeys = [
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
          "twoByTwoPicture"
        ];
    
        for (const key of fileKeys) {
          const file = clearanceInput[key as keyof ClearanceInput];
          if (file instanceof File) {
            const ext = file.name.split('.').pop();
            const filename = `${clearanceInput.requestId}-${key}.${ext}`;
            const storageRef = ref(storage, `ServiceRequests/${filename}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            uploadedFileUrls[key] = url;
          }
        }
    
        // 🆕 Upload dynamic image fields
        for (const fieldName in dynamicFileStates) {
          const fileList = dynamicFileStates[fieldName];
          if (fileList && fileList.length > 0) {
            const file = fileList[0]; // Assuming 1 file per field
            const ext = file.name.split(".").pop();
            const filename = `${clearanceInput.requestId}-${fieldName}.${ext}`;
            const storageRef = ref(storage, `ServiceRequests/${filename}`);
            const fileBlob = clearanceInput[fieldName as keyof typeof clearanceInput] as File | undefined;
            if (fileBlob instanceof File) {
              const snapshot = await uploadBytes(storageRef, fileBlob);
              const url = await getDownloadURL(snapshot.ref);
              uploadedFileUrls[fieldName] = url;
            }
          }
        }
        let sendTo ="";
        if (
          (clearanceInput.docType === "Barangay Certificate" && clearanceInput.purpose !=="Residency" )||
          clearanceInput.docType === "Barangay Clearance" ||
          clearanceInput.docType === "Temporary Business Permit" ||
          clearanceInput.docType === "Construction" ||
          (docType === "Barangay Permit" && docPurpose) ||
          (clearanceInput.docType === "Other Documents" && clearanceInput.purpose !== "Barangay ID")
        ) {
          sendTo = "SAS";
        } else if (
          clearanceInput.docType === "Business Permit" ||
          (clearanceInput.docType === "Other Documents" && clearanceInput.purpose === "Barangay ID")||
          clearanceInput.docType === "Barangay Indigency" ||
          clearanceInput.purpose === "Residency"
        ) {
          sendTo = "Admin Staff";
        }

        let documentTypeIs = "";
        if(otherDocPurposes[clearanceInput.docType || '']?.includes(clearanceInput.purpose || "")) {
          documentTypeIs = "OtherDocuments";
        }

        const docData = {
          ...removeNullFields(clearanceInput),
          requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname}`,
          sendTo: sendTo,
          docPrinted: false,
          ...(clearanceInput.purpose ==="Garage/PUV" && {
            noOfVehicles: clearanceInput.noOfVehicles,
          }),
          ...(documentTypeIs !== "" && {
            documentTypeIs: documentTypeIs,
          }),

          ...(clearanceInput.docType === "Barangay Indigency" && {
            interviewRemarks:""
          }),
          ...(clearanceInput.purpose === "Residency" && {
            photoUploaded: "",
          }),
          ...uploadedFileUrls,
        };
        console.log("Uploaded", docData);

        const doc = await addDoc(docRef, docData);
        console.log("Document written with ID: ", doc.id);

        router.push(`/dashboard/ServicesModule/InBarangayRequests?highlight=${doc.id}`); // changed by dirick note para if may maging bug haha

        id = doc.id;
      } catch (error) {
        console.error("Error:", error);
      }
    };

    const handleConfirmClick = async() => {
        setShowCreatePopup(true);
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Check if any required dynamic image field is missing
      for (const fieldName of dynamicImageFields) {
        if (!dynamicFileStates[fieldName] || dynamicFileStates[fieldName].length === 0) {
          setPopupErrorMessage(`Please upload ${formatFieldName(fieldName.replace(/jpg$/, "").trim())}.`);
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }


    if (
      clearanceInput.docType === "Barangay Certificate" &&
      ["Residency"].includes(clearanceInput.purpose || "")
    ) {
      if (!files11 || files11.length === 0) {
        setPopupErrorMessage("Please upload Identification Picture.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
    }
    
      // Signature
      if (!files1 || files1.length === 0) {
        setPopupErrorMessage("Please upload Signature Over Printed Name.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
    
      const isBarangayDocumentAndNewPermit =
        isBarangayDocument || otherDocPurposes["Barangay Permit"]?.includes(docType || "") || clearanceInput.purpose === "First Time Jobseeker";
    
      //  If it's a Barangay Permit type, require at least one of the three
      if (
        isBarangayDocumentAndNewPermit &&
        clearanceInput.purpose !== "Barangay ID"
      ) {
        const hasBarangayID = files2 && files2.length > 0;
        const hasValidID = files3 && files3.length > 0;
        const hasLetter = files4 && files4.length > 0;

        if (!hasValidID && !hasLetter) {
          setPopupErrorMessage("Please upload at least one of: Barangay ID, Valid ID, or Endorsement Letter.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      } else if (clearanceInput.purpose !== "Barangay ID") {
        // Only check Endorsement Letter if not in the Barangay Permit category and not Barangay ID
        if (!files4 || files4.length === 0) {
          setPopupErrorMessage("Please upload Endorsement Letter.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }

      if (["Barangay ID", "First Time Jobseeker"].includes(clearanceInput.purpose || "")) {
        if (!files3 || files3.length === 0) {
          setPopupErrorMessage("Please upload Valid ID.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }

      if(clearanceInput.docType === "Other Documents" && clearanceInput.purpose === "Barangay ID") {
        if(!files12 || files12.length === 0) {
          setPopupErrorMessage("Please upload 2x2 ID Picture.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }

      
    
      if (isBusinessPermit) {
        if (!files5 || files5.length === 0) {
          setPopupErrorMessage("Please upload Title of the Property/Contract of Lease.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
    
        if (!files6 || files6.length === 0) {
          setPopupErrorMessage("Please upload DTI Registration.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
    
        if (!files7 || files7.length === 0) {
          setPopupErrorMessage("Please upload Picture of CCTV Installed.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }
    
      if (isConstruction) {
        if (!files5 || files5.length === 0) {
          setPopupErrorMessage("Please upload Title of the Property/Contract of Lease.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
    
        if (!files8 || files8.length === 0) {
          setPopupErrorMessage("Please upload Tax Declaration.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
    
        if (!files9 || files9.length === 0) {
          setPopupErrorMessage("Please upload Building/Construction Plan.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }
    
      if (["Estate Tax", "Death Residency"].includes(clearanceInput.purpose ?? "")) {
        if (!files10 || files10.length === 0) {
          setPopupErrorMessage("Please upload Death Certificate.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
      }
    
      // If all validations pass
      handleConfirmClick();
    };

    

    const confirmCreate = async () => {
        setShowCreatePopup(false);
        setPopupMessage(`${docType} created successfully!`);
        setShowPopup(true);
        console.log("Files:", files);
        console.log("Clearance Input:", clearanceInput);

        const wait = await handleUploadClick(); // changed by dirick note para if may maging bug haha
        console.log("Wait:", wait);

        setTimeout(() => {
            setShowPopup(false);
        }, 3000);

        
        const notificationRef = collection(db, "BarangayNotifications");

        const useDocTypeAsMessage = 
        clearanceInput.docType === "Business Permit" || 
        clearanceInput.docType === "Temporary Business Permit";
      
        await addDoc(notificationRef, {
          message: `New ${useDocTypeAsMessage ? clearanceInput.docType : clearanceInput.purpose} requested by ${clearanceInput.requestorFname}.`,
          timestamp: new Date(),
          requestorId: clearanceInput?.residentId,
          isRead: false,
          transactionType: "Online Service Request",
          recipientRole: (
            clearanceInput.purpose === "First Time Jobseeker" ||
            clearanceInput.docType === "Barangay Certificate" ||
            clearanceInput.docType === "Barangay Clearance" ||
            clearanceInput.docType === "Barangay Indigency" ||
            clearanceInput.docType === "Temporary Business Permit" ||
            clearanceInput.docType === "Construction" ||
            (clearanceInput.docType === "Other Documents" && clearanceInput.purpose !== "Barangay ID")
          )
            ? "Assistant Secretary"
            : "Admin Staff",
          requestID: clearanceInput?.requestId,
        });
        
        
                
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

      /* Barangay Indigency */
      "Public Attorneys Office",
      "Financial Subsidy of Solo Parent",
      "Fire Victims",
      "Flood Victims",
      "Philhealth Sponsor",
      "Medical Assistance",

      /* Barangay Clearance */
      "Loan",
      "Bank Transaction",
      "Residency",
      "Local Employment",
      "Maynilad",
      "Meralco",
      "Bail Bond",
      
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

      /* Barangay Indigency */
      "Public Attorneys Office",
      "Financial Subsidy of Solo Parent",
      "Fire Victims",
      "Flood Victims",
      "Philhealth Sponsor",
      "Medical Assistance",

      /* Barangay Clearance */
      "Loan",
      "Bank Transaction",
      "Residency",
      "Local Employment",
      "Maynilad",
      "Meralco",
      "Bail Bond",

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

    const existingImageFields = [
      "signaturejpg",
      "barangayIDjpg",
      "validIDjpg",
      "letterjpg",
    ];
    
    


    const isBarangayDocument = [
      "Barangay Certificate",
       "Barangay Indigency", 
       "Barangay Clearance"
    ].includes(clearanceInput.docType || "");

    const isBusinessPermit = [
      "Business Permit", 
      "Temporary Business Permit"]
      .includes(clearanceInput.docType || "");
      
    const isConstruction = clearanceInput.docType === "Construction";

    const isPermitLike =
    allExistingPermits.includes(docType || "") ||
    otherDocPurposes["Barangay Permit"]?.includes(docType || "");




    const currentPurpose = clearanceInput.purpose || "";
    const currentDocType = docType || "";
    
    const isOtherDocumentPurpose = Object.keys(otherDocFields).includes(currentPurpose);
    const isBarangayPermitType = otherDocPurposes["Barangay Permit"]?.includes(currentDocType);


    const [dynamicFileStates, setDynamicFileStates] = useState<{
      [fieldName: string]: { name: string; preview: string | undefined }[];
    }>({});
    
    const customFields = (
      isOtherDocumentPurpose
        ? otherDocFields[currentPurpose]
        : isBarangayPermitType
          ? otherDocFields[currentDocType]
          : []
    )?.filter((fieldName) => !fixedPredefinedFields.includes(fieldName)) || [];


    const matchedImageFieldsRaw = [
      ...(otherDocImageFields[currentPurpose] || []),
      ...(otherDocPurposes["Barangay Permit"]?.includes(docType || "")
        ? otherDocImageFields[docType || ""] || []
        : []),
    ];

    // Normalize: support both [{ name: "..." }] and ["..."]
    const matchedImageFields: string[] = matchedImageFieldsRaw.map((field: any) =>
      typeof field === "string" ? field : field?.name
    );

    const dynamicImageFields = matchedImageFields.filter(
      (name) => !existingImageFields.includes(name)
    );

    const formatFieldName = (name: string) =>
      name
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word


    useEffect(() => {
      if ((clearanceInput.purpose === "Death Residency" || clearanceInput.purpose === "Estate Tax" ) && docType === "Barangay Certificate") setAddOn("Deceased's ");
      else if(clearanceInput.purpose === "Occupancy /  Moving Out" && docType === "Barangay Certificate")setAddOn("From ");
      else if(clearanceInput.purpose === "Guardianship" && docType === "Barangay Certificate") setAddOn("Guardian's ");
      else setAddOn(" ");
      
    }, [clearanceInput.purpose, docType]);


    const [activeSection, setActiveSection] = useState("basic");
    const isForMyself = clearanceInput.requestType === "forMyself";
    const [selectingFor, setSelectingFor] = useState<"fullName" | "requestor" | null>(null);
    

    const today = new Date();
    const minDateTyphoon = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]; // 1st of this month
    const maxDateTyphoon = today.toISOString().split("T")[0];
    return (
        <main className="createRequest-main-container">
          {/* NEW */}
          <form  onSubmit={handleSubmit}>
            <div className="createRequest-inbrgy-main-content">
              <div className="createRequest-inbrgy-main-section1">
                <div className="createRequest-inbrgy-main-section1-left">
                  <button type="button"onClick={handleBack}>
                    <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                  </button>

                  <h1> {docType} </h1>
                </div>

                <div className="action-btn-section">
                  <button type="reset" className="discard-btn" onClick={handleDiscardClick}>
                    Discard
                  </button>
                  <button type="submit" className="save-btn">
                    Create
                  </button>
                </div>
              </div>

              <div className="createRequest-bottom-section">
                <nav className="createRequest-info-toggle-wrapper">
                  {["basic", "full", ...(clearanceInput.purpose === "Barangay ID" ? ["emergency"] : []), "others"].map((section) => (
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

                        {docType !== "Construction" && !docPurpose && !otherDocPurposes["Barangay Permit"]?.includes(docType || "") && (
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
                                {/*<option value="AKAP">AKAP</option>*/}
                                <option value="Financial Subsidy of Solo Parent">Financial Subsidy of Solo Parent</option>
                                <option value="Fire Victims">Fire Victims</option>
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

                                {otherDocPurposes["Other Documents"]?.map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                                ))}
                              </>
                            ) : null}
                          </select>
                        </div>
                      </>
                      )}

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

                      {clearanceInput.purpose === "No Income"  && (
                            <>
                              <div className="fields-section">
                                <h1>Purpose of No Income:<span className="required">*</span></h1>
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

                        {(
                          allExistingPermits.includes(docType || "") ||
                          (
                            (
                              otherDocPurposes["Barangay Permit"]?.includes(docType || "") &&
                              forResidentOnlyMap[docType || ""] === false
                            ) || 
                            (
                              docType === "Other Documents" &&
                              clearanceInput.purpose !== "Barangay ID" &&
                              clearanceInput.purpose !== "First Time Jobseeker" &&
                              forResidentOnlyMap[clearanceInput.purpose || ""] === false
                            )
                          )
                        ) ? (
                          <div className="isresident-section">

                            <div className="beneficiary-checkbox-container">
                              <label className="beneficiary-checkbox-label" htmlFor="forResidentOnly">
                                <p>Is requestor a resident?<span className="required">*</span></p> 
                              </label>
                              <div className="checkbox-container-isresident">
                                <input 
                                  type="checkbox" 
                                  name="isResident"  
                                  checked={clearanceInput?.isResident || false}
                                  onChange={handleChange}
                                />    
                              </div>
                            </div>

                          
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
                                      forResidentOnlyMap[docType || ""] === true ||
                                      (docType === "Other Documents" && clearanceInput?.isResident) ||
                                      clearanceInput?.isResident
                                    }
                                    onClick={() => {
                                      const isExplicitResidentOnly = forResidentOnlyMap[docType || ""] === true;
                                      const isOtherDocs = docType === "Other Documents";

                                      const allowPopup =
                                        isExplicitResidentOnly ||
                                        (!isPermitLike && !isOtherDocs) ||
                                        (isOtherDocs && clearanceInput?.isResident) ||
                                        clearanceInput?.isResident ||
                                        (clearanceInput.purpose === "Barangay ID" || clearanceInput.purpose === "First Time Jobseeker");

                                      if (allowPopup) {
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
                                        const purpose = clearanceInput.purpose ?? "";

                                        const updatedInput: any = {
                                          ...clearanceInput,
                                          requestorFname: "",
                                          requestorMrMs: "",
                                          gender: "",
                                          civilStatus: "",
                                          birthday: "",
                                          contact: "",
                                          dateOfResidency: "",
                                          address: ""
                                        };

                                        setClearanceInput(updatedInput);
                                        setIsRequestorSelected(false);
                                      }}
                                    >
                                      ×
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // condition not met, show Requestor Full Name outside isresident-section
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
                                    forResidentOnlyMap[docType || ""] === true ||
                                    (docType === "Other Documents" && clearanceInput?.isResident) ||
                                    clearanceInput?.isResident
                                  }
                                  onClick={() => {
                                    const isExplicitResidentOnly = forResidentOnlyMap[docType || ""] === true;
                                    const isOtherDocs = docType === "Other Documents";

                                    const allowPopup =
                                      isExplicitResidentOnly ||
                                      (!isPermitLike && !isOtherDocs) ||
                                      (isOtherDocs && clearanceInput?.isResident) ||
                                      clearanceInput?.isResident ||
                                      (clearanceInput.purpose === "Barangay ID" || clearanceInput.purpose === "First Time Jobseeker");

                                    if (allowPopup) {
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
                                      const purpose = clearanceInput.purpose ?? "";

                                      const updatedInput: any = {
                                        ...clearanceInput,
                                        requestorFname: "",
                                        requestorMrMs: "",
                                        gender: "",
                                        civilStatus: "",
                                        birthday: "",
                                        contact: "",
                                        dateOfResidency: "",
                                        address: ""
                                      };

                                      setClearanceInput(updatedInput);
                                      setIsRequestorSelected(false);
                                    }}
                                  >
                                    ×
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                     
                        
                        
                      </div>

                      <div className="createRequest-section-2-right-side">

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
                          <h1>Requestor's Address<span className="required">*</span></h1>
                          <input 
                              type="text" 
                              value ={clearanceInput?.address || ""}
                              onChange={handleChange} // Handle change to update state
                              required
                              id="address"
                              name="address"
                              className="createRequest-input-field" 
                              placeholder={`Enter Address`} 
                              disabled={isResidentSelected} // Disable input if a resident is selected

                            />
                        </div>
                      
                        <div className="fields-section">
                            <h1>Requestor's Date of Residency<span className="required">*</span></h1>
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
                      </div>
                      
                    </div>
                    
                    </>
                  )}

                  {activeSection === "full" && (
                    <>
                      <div className="createRequest-section-2-full-top">
                        <div className="createRequest-section-2-left-side">
                          <div className="fields-section">
                            <h1>Requestor's Birthday<span className="required">*</span></h1>
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
                            <h1>Requestor's Age<span className="required">*</span></h1>
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
                            <h1>Requestor's Gender<span className="required">*</span></h1>
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
                                  {(() => {
                                    const currentYear = new Date().getFullYear();
                                    const cyFrom = parseInt(clearanceInput.CYFrom || "");

                                    if (cyFrom === currentYear) {
                                      // Only show current year
                                      return (
                                        <option key={currentYear} value={currentYear}>
                                          {currentYear}
                                        </option>
                                      );
                                    }

                                    // Default behavior if Year From is not current year
                                    return [...Array(100)].map((_, i) => {
                                      const year = currentYear - i;
                                      const isDisabled = !isNaN(cyFrom) && year <= cyFrom;
                                      return (
                                        <option key={year} value={year} disabled={isDisabled}>
                                          {year}
                                        </option>
                                      );
                                    });
                                  })()}
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
                                <h1>Nos of Tricycle<span className="required">*</span></h1>
                                <input 
                                  type="number"  
                                  id="noOfVehicles"  
                                  name="noOfVehicles"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.noOfVehicles||1}
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

                                <select
                                  id="religion"
                                  name="religion"
                                  className="createRequest-input-field"
                                  value={
                                    ["Roman Catholic", "Iglesia ni Cristo", "Muslim", "Christian", "Others"].includes(clearanceInput.religion || "")
                                      ? clearanceInput.religion
                                      : ""
                                  }
                                  onChange={handleChange}
                                  required
                                >
                                  <option value="" disabled>Select Religion</option>
                                  <option value="Roman Catholic">Roman Catholic</option>
                                  <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                                  <option value="Muslim">Muslim</option>
                                  <option value="Christian">Christian</option>
                                  <option value="Others">Others</option>
                                </select>

                                {/* Show custom input if "Others" is selected */}
                                {clearanceInput.religion === "Others" && (
                                  <input
                                    type="text"
                                    className="createRequest-input-field"
                                    placeholder="Please specify your religion"
                                    value={
                                      ["Roman Catholic", "Iglesia ni Cristo", "Muslim", "Christian", "Others"].includes(clearanceInput.religion)
                                        ? ""
                                        : clearanceInput.religion
                                    }
                                    onChange={(e) =>
                                      setClearanceInput((prev: any) => ({
                                        ...prev,
                                        religion: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                )}
                              </div>

                              <div className="fields-section">
                                <h1>Nationality<span className="required">*</span></h1>
                                <select
                                  id="nationality"
                                  name="nationality"
                                  className="createRequest-input-field"
                                  value={
                                    ["Filipino", "Others"].includes(clearanceInput.nationality || "")
                                      ? clearanceInput.nationality
                                      : ""
                                  }
                                  onChange={handleChange}
                                  required
                                >
                                  <option value="" disabled>Select Nationality</option>
                                  <option value="Filipino">Filipino</option>
                                  <option value="Others">Others</option>
                                </select>

                                {clearanceInput.nationality === "Others" && (
                                  <input
                                    type="text"
                                    name="nationality"
                                    placeholder="Please specify your nationality"
                                    className="createRequest-input-field"
                                    value={
                                      ["Filipino", "Others"].includes(clearanceInput.nationality || "")
                                        ? ""
                                        : clearanceInput.nationality
                                    }
                                    onChange={(e) =>
                                      setClearanceInput((prev: any) => ({
                                        ...prev,
                                        nationality: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                )}
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

                        
                          {clearanceInput.purpose === "Financial Subsidy of Solo Parent"  && (
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

                          {clearanceInput.purpose === "Flood Victims"  && (
                            <>               
                              <div className="fields-section">
                                <h1>Name of Typhoon<span className="required">*</span></h1>
                                <input 
                                  type="text"  
                                  id="nameOfTyphoon"  
                                  name="nameOfTyphoon"  
                                  value={clearanceInput.nameOfTyphoon}
                                  onChange={handleChange}
                                  className="createRequest-input-field"  
                                  required 
                                  placeholder={`Enter Typhoon Name`}
                                />
                              </div>           
                            </>
                          )}

                          {clearanceInput.purpose === "Fire Victims" && (
                            <>
                              <div className="fields-section">
                                <h1>Date of Fire Incident <span className="required">*</span></h1>
                                <input 
                                  type="date" 
                                  className="createRequest-input-field" 
                                  id="dateOfFireIncident"
                                  name="dateOfFireIncident"
                                  value={clearanceInput?.dateOfFireIncident || ""}
                                  onChange={handleChange}
                                  required
                                  min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // 30 days before today
                                  max={new Date().toISOString().split("T")[0]} // today
                                  onKeyDown={(e) => e.preventDefault()}  
                                />    
                              </div>            
                            </>
                          )}


                          {(
                            (
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
                                        value={clearanceInput.fullName || ""}
                                        onChange={handleChange}
                                        required
                                        id="fullName"
                                        name="fullName"
                                        readOnly={
                                          !(
                                            docType === "Barangay Certificate" &&
                                            ["Death Residency", "Estate Tax", "Guardianship", "Occupancy /  Moving Out"].includes(clearanceInput.purpose || "")
                                          )
                                        }
                                        onClick={() => {
                                          if (
                                            !(
                                              docType === "Barangay Certificate" &&
                                              ["Death Residency", "Estate Tax", "Guardianship", "Occupancy /  Moving Out"].includes(clearanceInput.purpose || "")
                                            )
                                          ) {
                                            setSelectingFor("fullName");
                                            setShowResidentsPopup(true);
                                          }
                                        }}
                                      />

                                      {isResidentSelected &&
                                        !(
                                          docType === "Barangay Certificate" &&
                                          ["Death Residency", "Estate Tax", "Guardianship", "Occupancy /  Moving Out"].includes(clearanceInput.purpose || "")
                                        ) && (
                                          <span
                                            className="clear-icon"
                                            title="Click to clear selected resident"
                                            onClick={() => {
                                              const updatedInput = {
                                                ...clearanceInput,
                                                fullName: "",
                                                fromAddress: "",
                                              };
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
                            )
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

                        <div className="createRequest-section-2-right-side">
                          <div className="fields-section">     
                            <h1>Requestor's Contact Number<span className="required">*</span></h1>
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
                            <h1>Requestor's Civil Status<span className="required">*</span></h1>  
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
                            <h1>Requestor's Citizenship<span className="required">*</span></h1>

                            <select
                              id="citizenship"
                              name="citizenship"
                              className="createRequest-input-field"
                              value={
                                clearanceInput.citizenship &&
                                ["Filipino", "Dual Citizen", "Naturalized", "Others"].includes(clearanceInput.citizenship.split("(")[0])
                                  ? clearanceInput.citizenship.split("(")[0]
                                  : ""
                              }
                              onChange={(e) => {
                                const selected = e.target.value;
                                setClearanceInput((prev: any) => ({
                                  ...prev,
                                  citizenship: selected,
                                }));
                              }}
                              required
                            >
                              <option value="" disabled>Select Citizenship</option>
                              <option value="Filipino">Filipino</option>
                              <option value="Dual Citizen">Dual Citizen</option>
                              <option value="Naturalized">Naturalized</option>
                              <option value="Others">Others</option>
                            </select>

                            {/* Additional input for Dual Citizen */}
                            {clearanceInput.citizenship?.startsWith("Dual Citizen") && (
                              <input
                                type="text"
                                className="createRequest-input-field"
                                placeholder="Specify other citizenship (e.g., American)"
                                value={
                                  clearanceInput.citizenship.includes("(")
                                    ? clearanceInput.citizenship.split("(")[1].replace(")", "")
                                    : ""
                                }
                                onChange={(e) => {
                                  const second = e.target.value.trim();
                                  setClearanceInput((prev: any) => ({
                                    ...prev,
                                    citizenship: second ? `Dual Citizen(${second})` : "Dual Citizen",
                                  }));
                                }}
                                required
                              />
                            )}

                            {/* Additional input for Others */}
                            {clearanceInput.citizenship === "Others" && (
                              <input
                                type="text"
                                className="createRequest-input-field"
                                placeholder="Please specify your citizenship"
                                value={
                                  ["Filipino", "Dual Citizen", "Naturalized", "Others"].includes(clearanceInput.citizenship)
                                    ? ""
                                    : clearanceInput.citizenship
                                }
                                onChange={(e) =>
                                  setClearanceInput((prev: any) => ({
                                    ...prev,
                                    citizenship: e.target.value,
                                  }))
                                }
                                required
                              />
                            )}
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
                                  disabled
                                />
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
                                {/* <h1>Nos of Vehicle/s<span className="required">*</span></h1>
                                <input 
                                  type="number"  
                                  id="noOfVehicles"  
                                  name="noOfVehicles"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.noOfVehicles || 1}
                                  onChange={handleChange}
                                  min={1}
                                  onKeyDown={(e)=> {
                                  if (e.key === 'e' || e.key === '-' || e.key === '+') {
                                    e.preventDefault(); // Prevent scientific notation and negative/positive signs
                                  }
                                  }
                                  } // Prevent manual input
                                  /> */}
                                  <h1>Nos of Vehicle/s<span className="required">*</span></h1>
                                  <input 
                                  type="number"  
                                  id="noOfVehicles"  
                                  name="noOfVehicles"  
                                  className="createRequest-input-field"  
                                  required 
                                  value={clearanceInput.noOfVehicles || 1}
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
                                <select
                                  id="bloodtype"
                                  name="bloodtype"
                                  className="createRequest-input-field"
                                  value={
                                    ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Others"].includes(clearanceInput.bloodtype || "")
                                      ? clearanceInput.bloodtype
                                      : ""
                                  }
                                  onChange={handleChange}
                                  required
                                >
                                  <option value="" disabled>Select Blood Type</option>
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                  <option value="Others">Others</option>
                                </select>

                                {clearanceInput.bloodtype === "Others" && (
                                  <input
                                    type="text"
                                    name="bloodtype"
                                    placeholder="Please specify your blood type"
                                    className="createRequest-input-field"
                                    value={
                                      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Others"].includes(clearanceInput.bloodtype || "")
                                        ? ""
                                        : clearanceInput.bloodtype
                                    }
                                    onChange={(e) =>
                                      setClearanceInput((prev: any) => ({
                                        ...prev,
                                        bloodtype: e.target.value,
                                      }))
                                    }
                                    required
                                  />
                                )}
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
                                  type="number"  
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

                          {clearanceInput.purpose === "Flood Victims"  && (
                            <>               
                             <div className="fields-section">
                              <h1>Date of Typhoon <span className="required">*</span></h1>
                              <input 
                                type="date" 
                                className="createRequest-input-field" 
                                id="dateOfTyphoon"
                                name="dateOfTyphoon"
                                value={clearanceInput?.dateOfTyphoon || ""}
                                onChange={handleChange}
                                required
                                min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // 30 days before today
                                max={new Date().toISOString().split("T")[0]} // today
                                onKeyDown={(e) => e.preventDefault()}  
                              />    
                            </div>            
                            </>
                          )}

                          {clearanceInput.purpose === "Occupancy /  Moving Out" && (
                            <>
                              <div className="fields-section">
                                <h1>From Address<span className="required">*</span></h1>
                                <input 
                                    type="text" 
                                    value ={clearanceInput?.fromAddress || ""}
                                    onChange={handleChange} // Handle change to update state
                                    required
                                    id="fromAddress"
                                    name="fromAddress"
                                    className="createRequest-input-field" 
                                    placeholder={`Enter From Address`} 
                                    disabled={isResidentSelected} // Disable input if a resident is selected

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
                        </div>
                      </div>

                      
                      <div className="createRequest-section-2-full-bottom">

                        <div className="createRequest-section-2-left-side">
                          {/* Fields for Added Barangay Certificate Document Purpose */}
                          {customFields.filter((_, i) => i % 2 === 0).map((fieldName) => (
                            <div key={fieldName} className="fields-section">
                              <h1>{formatFieldName(fieldName)}<span className="required">*</span></h1>
                              <input
                                type="text"
                                id={fieldName}
                                name={fieldName}
                                className="createRequest-input-field"
                                required
                                value={(clearanceInput as any)[fieldName] || ""}
                                onChange={handleChange}
                                placeholder={`Enter ${formatFieldName(fieldName)}`}
                              />
                            </div>
                          ))}

                        </div>

                        <div className="createRequest-section-2-right-side">
                          {/* Fields for Added Barangay Certificate Document Purpose */}
                          {customFields.filter((_, i) => i % 2 === 1).map((fieldName) => (
                            <div key={fieldName} className="fields-section">
                              <h1>{formatFieldName(fieldName)}<span className="required">*</span></h1>
                              <input
                                type="text"
                                id={fieldName}
                                name={fieldName}
                                className="createRequest-input-field"
                                required
                                value={(clearanceInput as any)[fieldName] || ""}
                                onChange={handleChange}
                                placeholder={`Enter ${formatFieldName(fieldName)}`}
                              />
                            </div>
                          ))}

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

                  {activeSection === "emergency" && (
                      <>
                        <div className="createRequest-section-2-full-top">
                          <div className="createRequest-section-2-left-side">
                            <div className="fields-section">
                                <h1>Emergency Contact Full Name<span className="required">*</span></h1>
                                <input 
                                  type="text" 
                                  id="emergencyDetails.fullName"
                                  name="emergencyDetails.fullName"
                                  value={clearanceInput?.emergencyDetails?.fullName || ""}
                                  onChange={handleChange}
                                  required
                                  className="createRequest-input-field" 
                                  placeholder="Enter Full Name"
                                />
                            </div>

                            <div className="fields-section">
                                <h1>Emergency Contact Address<span className="required">*</span></h1>
                                <input 
                                  type="text" 
                                  id="emergencyDetails.address"
                                  name="emergencyDetails.address"
                                  value={clearanceInput?.emergencyDetails?.address || ""}
                                  onChange={handleChange}
                                  required
                                  className="createRequest-input-field" 
                                  placeholder="Enter Address"
                                />
                            </div>
                          </div>
                        
                          <div className="createRequest-section-2-right-side">
                            <div className="fields-section">     
                              <h1>Emergency Contact Number<span className="required">*</span></h1>
                              <input 
                                type="tel"  
                                id="emergencyDetails.contactNumber"  
                                name="emergencyDetails.contactNumber"
                                value={clearanceInput?.emergencyDetails?.contactNumber || ""}
                                onChange={(e) => {
                                  const input = e.target.value;
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
                              />
                            </div>

                            <div className="fields-section">
                              <h1>Relationship<span className="required">*</span></h1>
                              <input 
                                type="text" 
                                id="emergencyDetails.relationship"
                                name="emergencyDetails.relationship"
                                value={clearanceInput?.emergencyDetails?.relationship || ""}
                                onChange={handleChange}
                                required
                                className="createRequest-input-field" 
                                placeholder="Enter Relationship"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                  )}


                  {activeSection === "others" && (
                    <>
                      <div className="others-main-container">
                        {(clearanceInput.purpose === "Residency" && clearanceInput.docType === "Barangay Certificate") && (
                          <>
                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-signature">
                                Identification Picture
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload11"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload11"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleIdentificationPicUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files11.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files11.map((file, index) => (
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
                                                  onClick={() => handleIdentificationPicDelete(file.name)}
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
                          </>
                        )}
                          

                        <div className="box-container-outer-inbrgy">
                          <div className="title-verificationdocs-signature">
                            Signature Over Printed Name
                          </div>

                          <div className="box-container-inbrgy">
                            <span className="required-asterisk">*</span>

                            {/* File Upload Section */}
                            <div className="file-upload-container-inbrgy">
                              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                                <input
                                  id="file-upload1"
                                  type="file"
                                  className="file-upload-input" 
                                  multiple
                                  accept=".jpg,.jpeg,.png"
                                  onChange={handleSignatureUpload}
                                />

                                {/* Display the file names with image previews */}
                                {files1.length > 0 && (
                                  <div className="file-name-image-display">
                                    {files1.map((file, index) => (
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
                                              onClick={() => handleSignatureDelete(file.name)}
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
                          {(docType === "Other Documents" && clearanceInput.purpose === "Barangay ID") && (
                              <>
                              <div className="box-container-outer-inbrgy">
                                <div className="title-verificationdocs-barangayID">
                                  2x2 Barangay ID Picture
                                </div>

                                <div className="box-container-inbrgy">
                                  <span className="required-asterisk">*</span>

                                  {/* File Upload Section */}
                                  <div className="file-upload-container-inbrgy">
                                    <label htmlFor="file-upload12"  className="upload-link">Click to Upload File</label>
                                      <input
                                        id="file-upload12"
                                        type="file"
                                        className="file-upload-input" 
                                        multiple
                                        accept=".jpg,.jpeg,.png"
                                        onChange={handle2x2IDUpload}
                                      />

                                      {/* Display the file names with image previews */}
                                      {files12.length > 0 && (
                                        <div className="file-name-image-display">
                                          {files12.map((file, index) => (
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
                                                    onClick={() => handle2x2IDDelete(file.name)}
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
                            </>
                          )}
                        

                        {(isBarangayDocument || otherDocPurposes["Barangay Permit"]?.includes(docType || "") || clearanceInput.purpose === "First Time Jobseeker") && (
                          <>
                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-barangayID">
                                Barangay ID
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload2"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleBarangayIDUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files2.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files2.map((file, index) => (
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
                                                  onClick={() => handleBarangayIDDelete(file.name)}
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
                          </>
                        )}

                        {(isBarangayDocument || otherDocPurposes["Barangay Permit"]?.includes(docType || "") || clearanceInput.purpose === "Barangay ID" || clearanceInput.purpose === "First Time Jobseeker" || docType === "Construction") && (
                              <>
                                <div className="box-container-outer-inbrgy">
                                  <div className="title-verificationdocs-validID">
                                    Valid ID
                                  </div>

                                  <div className="box-container-inbrgy">
                                    <span className="required-asterisk">*</span>

                                    {/* File Upload Section */}
                                    <div className="file-upload-container-inbrgy">
                                      <label htmlFor="file-upload3"  className="upload-link">Click to Upload File</label>
                                        <input
                                          id="file-upload3"
                                          type="file"
                                          className="file-upload-input" 
                                          multiple
                                          accept=".jpg,.jpeg,.png"
                                          onChange={handleValidIDUpload}
                                        />

                                        {/* Display the file names with image previews */}
                                        {files3.length > 0 && (
                                          <div className="file-name-image-display">
                                            {files3.map((file, index) => (
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
                                                      onClick={() => handleValidIDDelete(file.name)}
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
                              </>
                            )}
                        {(docType !== "Construction" &&  clearanceInput.purpose !== "Barangay ID") && (

                        <div className="box-container-outer-inbrgy">
                          <div className="title-verificationdocs-endorsement">
                            Endorsement Letter
                          </div>

                          <div className="box-container-inbrgy">
                            <span className="required-asterisk">*</span>

                            {/* File Upload Section */}
                            <div className="file-upload-container-inbrgy">
                              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                                <input
                                  id="file-upload4"
                                  type="file"
                                  className="file-upload-input" 
                                  multiple
                                  accept=".jpg,.jpeg,.png"
                                  onChange={handleEndorsementUpload}
                                />

                                {/* Display the file names with image previews */}
                                {files4.length > 0 && (
                                  <div className="file-name-image-display">
                                    {files4.map((file, index) => (
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
                                              onClick={() => handleEndorsementDelete(file.name)}
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
                        )}
                        {isBusinessPermit && (
                          <>
                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-propertyContract">
                                Title of the Property/Contract of Lease
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload5"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload5"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handlePropertyContractUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files5.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files5.map((file, index) => (
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
                                                  onClick={() => handlePropertyContractDelete(file.name)}
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

                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-dti">
                                DTI Registration
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload6"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload6"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleDTIUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files6.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files6.map((file, index) => (
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
                                                  onClick={() => handleDTIDelete(file.name)}
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

                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-cctv">
                                Picture of CCTV Installed
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload7"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload7"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleCCTVUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files7.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files7.map((file, index) => (
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
                                                  onClick={() => handleCCTVDelete(file.name)}
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
                          </>
                        )}

                        {isConstruction && (
                          <>
                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-propertyContract">
                                Title of the Property/Contract of Lease
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload5"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload5"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handlePropertyContractUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files5.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files5.map((file, index) => (
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
                                                  onClick={() => handlePropertyContractDelete(file.name)}
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

                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-taxDeclaration">
                                Tax Declaration
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload8"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload8"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleTaxDeclarationUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files8.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files8.map((file, index) => (
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
                                                  onClick={() => handleTaxDeclarationDelete(file.name)}
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

                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-bldgconstruction">
                                Building/Construction Plan
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload9"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload9"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleBldgConstructionPlanUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files9.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files9.map((file, index) => (
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
                                                  onClick={() => handleBldgConstructionPlanDelete(file.name)}
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
                          </>
                        )}

                        {["Estate Tax", "Death Residency"].includes(clearanceInput.purpose ?? "") && (
                          <>
                            <div className="box-container-outer-inbrgy">
                              <div className="title-verificationdocs-deathCertificate">
                                Death Certificate
                              </div>

                              <div className="box-container-inbrgy">
                                <span className="required-asterisk">*</span>

                                {/* File Upload Section */}
                                <div className="file-upload-container-inbrgy">
                                  <label htmlFor="file-upload10"  className="upload-link">Click to Upload File</label>
                                    <input
                                      id="file-upload10"
                                      type="file"
                                      className="file-upload-input" 
                                      multiple
                                      accept=".jpg,.jpeg,.png"
                                      onChange={handleDeathCertificateUpload}
                                    />

                                    {/* Display the file names with image previews */}
                                    {files10.length > 0 && (
                                      <div className="file-name-image-display">
                                        {files10.map((file, index) => (
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
                                                  onClick={() => handleDeathCertificateDelete(file.name)}
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
                          </>
                        )}

                        {dynamicImageFields.map((fieldName) => (
                          <div className="box-container-outer-inbrgy" key={fieldName}>
                            <div className="title-verificationdocs-added-imagefield">
                              {formatFieldName(fieldName.replace(/jpg$/, "").trim())}
                            </div>

                            <div className="box-container-inbrgy">
                              <span className="required-asterisk">*</span>

                              <div className="file-upload-container-inbrgy">
                                <label htmlFor={`file-upload-${fieldName}`} className="upload-link">
                                  Click to Upload File
                                </label>

                                <input
                                  id={`file-upload-${fieldName}`}
                                  type="file"
                                  className="file-upload-input"
                                  accept=".jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleDynamicImageUpload(fieldName, file);
                                    e.target.value = "";
                                  }}
                                />


                                {/* Image Preview */}
                                {dynamicFileStates[fieldName] && dynamicFileStates[fieldName].length > 0 && (
                                  <div className="file-name-image-display">
                                    {dynamicFileStates[fieldName].map((file, index) => (
                                      <div className="file-name-image-display-indiv" key={index}>
                                        <li className="file-item">
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
                                            <button
                                              type="button"
                                              className="delete-button"
                                              onClick={() => handleDynamicImageDelete(fieldName, file.name)}
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
                        ))}

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
                                <p>Are you sure you want to submit the request?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowCreatePopup(false)} className="no-button">No</button> 
                                    <button onClick={confirmCreate} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

                    {showPopup && (
                        <div className={`popup-overlay-inbarangay-docreq show`}>
                            <div className="popup">
                            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                                <p>{popupMessage}</p>
                            </div>
                        </div>
                    )}

              {showErrorPopup && (
                <div className={`error-popup-overlay-inbarangay-docreq show`}>
                    <div className="popup-add-kasambahay">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
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
                                      
                                          let update: any = {
                                            ...clearanceInput,
                                            residentId: resident.id,
                                          };
                                      
                                          if (selectingFor === "fullName") {
                                            update.fullName = selectedFullName;
                                      
                                            // ✅ Only update fromAddress for Occupancy / Moving Out
                                            if (purpose === "Occupancy /  Moving Out") {
                                              update.fromAddress = resident.address || "";
                                            }
                                      
                                            // ✅ Do NOT update 'address' here — only update fromAddress
                                            setIsResidentSelected(true);
                                          }
                                      
                                          if (selectingFor === "requestor") {
                                            update = {
                                              ...update,
                                              requestorFname: selectedFullName,
                                              requestorMrMs: resident.sex === "Male" ? "Mr." : "Ms.",
                                              gender: resident.sex || '',
                                              address: resident.address || '',
                                              birthday: resident.dateOfBirth || '',
                                              civilStatus: resident.civilStatus || '',
                                              contact: resident.contactNumber || '',
                                              age: resident.age || '',
                                              occupation: resident.occupation || '',
                                              precinctnumber: resident.precinctNumber || '',
                                              dateOfResidency: resident.dateOfResidency || '',
                                              citizenship: resident.citizenship || '',
                                            };
                                            
                                            handleValidIDUpload(resident.verificationFilesURLs[0] || '');
                                            
                                            // Only clear fromAddress if purpose is NOT Occupancy
                                            if (purpose !== "Occupancy /  Moving Out") {
                                              update.fromAddress = "";
                                            }
                                      
                                            setIsRequestorSelected(true);
                                          }
                                      
                                          setClearanceInput(update);
                                          setShowResidentsPopup(false);
                                        } catch (error) {
                                          setPopupErrorMessage("An error occurred. Please try again.");
                                          setShowErrorPopup(true);
                                          setTimeout(() => setShowErrorPopup(false), 3000);
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

