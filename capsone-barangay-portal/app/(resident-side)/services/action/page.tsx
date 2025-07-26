"use client"
import { ChangeEvent, useEffect, useState } from "react";
import {useAuth} from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsform/requestdocumentsform.css";
import {useSearchParams } from "next/navigation";
import { addDoc, collection, doc, getDoc, getDocs, DocumentData, onSnapshot, query, where} from "firebase/firestore";
import { db, storage, auth } from "@/app/db/firebase";
import { ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import {getLocalDateString,formatDateMMDDYYYY} from "@/app/helpers/helpers";
import {customAlphabet} from "nanoid";
import { getSpecificCountofCollection } from "@/app/helpers/firestorehelper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
;

interface EmergencyDetails {
  fullName: string;
  address: string;
  relationship: string;
  contactNumber: string;
}

interface ClearanceInput {
  [key: string]: string | number | File | boolean |null | EmergencyDetails | undefined;
  accountId: string;
  residentId: string;
  docType: string;
  typhoonSignal?: string;
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
  noOfVehicles: string;
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
  projectLocation: string;
  citizenship: string;
  educationalAttainment: string;
  course: string;
  isBeneficiary: boolean;
  birthplace: string;
  religion: string;
  nationality: string;
  height: string;
  weight: string;
  bloodtype: string;
  occupation: string;
  fromAddress: string;
  emergencyDetails: EmergencyDetails;
  requestorMrMs: string;
  requestorFname: string;
  partnerWifeHusbandFullName: string;
  cohabitationStartDate: string;
  cohabitationRelationship: string;
  wardFname: string;
  wardRelationship: string;
  guardianshipType: string;
  dateOfFireIncident: string;
  dateOfTyphoon: string;
  nameOfTyphoon: string;
  homeOrOfficeAddress: string;
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
  isCCTV: File | null;
  taxDeclaration: File | null;
  approvedBldgPlan: File | null;
  deathCertificate: File | null;
  twoByTwoPicture: File | null;

  isViewed: boolean;
}



export default function Action() {
  const user = useAuth().user;
  const isGuest = !user;
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const searchParam = useSearchParams();
  const docType = searchParam.get("doc") || "";
  const docPurpose = searchParam.get("purpose") || "";
  const router = useRouter();
  const [nos, setNos] = useState(0);

  const [userData, setUserData] = useState<any>(null); // moved UP here
  const [otherDocPurposes, setOtherDocPurposes] = useState<{ [key: string]: string[] }>({});
  const [otherDocFieldsByType, setOtherDocFieldsByType] = useState<{ [type: string]: string[] }>({});
  const [otherDocImageFields, setOtherDocImageFields] = useState<{ [title: string]: string[] }>({});
  const [forResidentOnlyMap, setForResidentOnlyMap] = useState<{ [title: string]: boolean }>({});
  const [otherDocuments, setOtherDocuments] = useState<DocumentData[]>([]);

  const [dynamicFileStates, setDynamicFileStates] = useState<{
    [key: string]: { name: string; preview: string | undefined }[];
  }>({});

  const [clearanceInput, setClearanceInput] =  useState<ClearanceInput>({
    accountId: user?.uid || "Guest",
    residentId: userData?.residentId || "Guest",
    docType: docType || "" ,
    isViewed: false,
    requestId: "",
    purpose: docPurpose || "",
    dateRequested: new Date().toLocaleString(),
    fullName: "",
    appointmentDate: "",
    dateOfResidency: "",
    dateofdeath: "",
    address: "",//will be also the home address
    toAddress: "",// will be also the home address
    businessLocation: "",// will be project location
    businessNature: "",
    noOfVehicles: "",
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
    dateOfFireIncident: "",
    typeofbldg:"",
    othersTypeofbldg:"",
    projectName:"",
    projectLocation: "",
    citizenship: "",
    homeOrOfficeAddress: "",
    educationalAttainment: "",
    course: "",
    isBeneficiary: false,
    birthplace: "",
    religion: "",
    nationality: "",
    height: "",
    weight: "",
    bloodtype: "",  
    occupation:"",
    emergencyDetails:{
      fullName: "",
      address: "",
      relationship: "",
      contactNumber: "",
    },
    requestorMrMs: "",
    requestorFname: "",
    fromAddress: "",
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
    nameOfTyphoon: "",
    dateOfTyphoon: "",
    noIncomePurpose: "",
    noIncomeChildFName: "",
    deceasedEstateName: "",
    estateSince: "",
    signaturejpg: null,
    barangayIDjpg:null,
    validIDjpg: null,
    letterjpg:null,
    copyOfPropertyTitle: null,
    dtiRegistration: null,
    isCCTV: null,
    taxDeclaration: null,
    approvedBldgPlan:null,
    deathCertificate: null,
    twoByTwoPicture: null,
  })

  useEffect(() => {
    if (userData === null) return; // still loading Firestore
    if (!docType) return; // no docType provided yet
  
    const restrictedDocs = ["Barangay Certificate", "Barangay Indigency", "Barangay Clearance"];
    const tryingToAccessRestrictedDoc = restrictedDocs.includes(docType);
    const isUnverifiedOrGuest = !user || userData?.status !== "Verified";
  
    if (tryingToAccessRestrictedDoc && isUnverifiedOrGuest) {
      alert("You must be a verified resident to request this document.");
      router.push("/services");
    }
  }, [user, userData, docType]);
  


  useEffect(() => {
    if(user){;
      const fetchCount = async () => {
        try {
          const count = await getSpecificCountofCollection("ServiceRequests", "accID", user.uid);
          setNos(count || 0);
        } catch (error) {
          console.error("Error fetching count:", error);
        }
      }
      fetchCount();
    }
    else{
      const fetchCount = async () => {
        try {
          const count = await getSpecificCountofCollection("ServiceRequests", "accID", "Guest");
          setNos(count || 0);
        } catch (error) {
          console.error("Error fetching count:", error);
        }
      }
      fetchCount();
    }

  },[user]);

  useEffect(() => {
    const getServiceRequestId =  () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomId = customAlphabet(alphabet, 6);
      const requestId = randomId();
      const number = String(nos+1).padStart(4, '0'); // Ensure 3 digits
      let format = `${user?.uid.substring(0,6).toUpperCase()|| "GUEST"} - ${requestId} - ${number}`;
      setClearanceInput((prev: any) => ({
        ...prev,
        requestId: format,
      }));
      console.log("format", format);
    }
    getServiceRequestId();

  }, [user,nos]);


 
  const isVerified = userData?.status === "Verified";
  const isReadOnly = isVerified;
  useEffect(() => {
    const fetchAndCloneFile = async (url: string, newFilename: string): Promise<File> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      return new File([blob], newFilename, { type: blob.type });
    };


    // for users that are verified and have an existing upload for verification
  
    const cloneUploadIfExists = async () => {
      if (
        userData?.upload &&
        typeof userData.upload === "string" &&
        userData.upload.includes("firebasestorage.googleapis.com") &&
        user?.uid
      ) {
        const timestamp = Date.now();
        const userUID = user.uid;
        const newFilename = `service_request_${userUID}.validIDjpg.${timestamp}.jpg`;
  
        try {
          const clonedFile = await fetchAndCloneFile(userData.upload, newFilename);
          const previewUrl = URL.createObjectURL(clonedFile);
  
          // Set preview for UI display
          setFiles3([
            {
              name: newFilename,
              preview: previewUrl,
            },
          ]);
  
          // Set file to clearanceInput
          setClearanceInput((prev: any) => ({
            ...prev,
            validIDjpg: clonedFile,
          }));
  
          // Cleanup object URL after some time
          setTimeout(() => URL.revokeObjectURL(previewUrl), 10000);
        } catch (error) {
          console.error("Error cloning uploaded file:", error);
        }
      }
    };
  
    cloneUploadIfExists();
  }, [userData, user]);
  

  function getAgeFromBirthday(birthday: string | Date): number {
  const birthDate = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  // Adjust if birthday hasn't occurred yet this year
  const hasBirthdayPassedThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassedThisYear) {
    age--;
  }

  return age;
}


  // will get user data if for myself, otherwise will set to null
  // user data will be based on info in their resident records
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
  
      const userDocRef = doc(db, "ResidentUsers", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;
  
      const userData = userDocSnap.data();
      setUserData(userData);
  
      const residentId = userData.residentId;
      const isVerified = userData.status === "Verified";
      const isEstateOrDeath = ["Estate Tax", "Death Residency"].includes(clearanceInput.purpose);
  
  
      //  For Verified ResidentUsers with a linked residentId
      if (isVerified && residentId) {
        const residentDocRef = doc(db, "Residents", residentId);
        const residentDocSnap = await getDoc(residentDocRef);
        if (!residentDocSnap.exists()) return;
  
        const residentData = residentDocSnap.data();
        const gender = residentData.sex;
        const mrms = gender === "Male" ? "Mr." : "Ms.";
        const fullName = `${residentData.firstName||""}${` ${residentData.middleName} `||" "}${residentData.lastName||""}`;
  
        //  Handle age calculation based on death date or today
        const birthDate = new Date(residentData.dateOfBirth);
        const referenceDate = isEstateOrDeath && clearanceInput.dateofdeath
          ? new Date(clearanceInput.dateofdeath)
          : new Date();
  
        let age = referenceDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
          age--;
        }
  
        if (isEstateOrDeath) {
          //  Only set requestor fields
          setClearanceInput((prev: any) => ({
            ...prev,
            birthplace: "",
          }));
        } else {
          //  Fill all fields for self
          setClearanceInput((prev: any) => ({
            ...prev,
            contact: residentData.contactNumber || "",
            address: residentData.address || "",
            gender: residentData.sex || "",
            civilStatus: residentData.civilStatus || "",
            birthplace: residentData.placeOfBirth || "",
            birthday: residentData.dateOfBirth || "",
            age: age.toString(),
            dateOfResidency: residentData.dateOfResidency || "",
            requestorFname: fullName,
            requestorMrMs: mrms,
            residentId: residentData.id,
            citizenship: residentData.citizenship || "",
            occupation: residentData.occupation || "",
          }));
        }
  
      } else {
        //  Fallback for Unverified accounts
        const gender = userData.sex;
        const mrms = gender === "male" ? "Mr." : "Ms.";
        const fullName = `${userData.first_name} ${userData.middle_name} ${userData.last_name||""}`;
  
        setClearanceInput((prev: any) => ({
          ...prev,
          fullName,
          contact: userData.phone || "",
          address: userData.address || "",
          gender: userData.sex || "",
          requestorFname: fullName,
          requestorMrMs: mrms,
          age: getAgeFromBirthday(userData.dateOfBirth) || "",
          birthday: userData.dateOfBirth || "",  
        }));
      }
    };
  
    fetchUserData();
  }, [user, clearanceInput.purpose, clearanceInput.dateofdeath]);
  

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
        setOtherDocFieldsByType(fieldMap);
        setOtherDocImageFields(imageFieldMap);
        setForResidentOnlyMap(residentOnlyMap);
      } catch (error) {
        console.error("Error fetching OtherDocuments:", error);
      }
    };
  
    fetchOtherDocumentPurposes();
  }, []);
  

  useEffect(() => {
    const fetchOtherDocuments = async () => {
      const snapshot = await getDocs(collection(db, "OtherDocuments"));
      const docs = snapshot.docs.map((doc) => doc.data());
      setOtherDocuments(docs);
    };
  
    fetchOtherDocuments();
  }, []);
  
  const handleDynamicImageUpload = (fieldName: string, file: File) => {
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validImageTypes.includes(file.type)) {
      alert("Only JPG, JPEG, and PNG files are allowed.");
      return;
    }
  
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
      [fieldName]: [],
    }));
  
    setClearanceInput((prev: any) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  
    const input = document.getElementById(`file-upload-${fieldName}`) as HTMLInputElement;
    if (input) input.value = "";
  };
  
  
// State for all file containers
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);
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

// const minDate = new Date().toISOString().split("T")[0]; 
const [lastSelectedDateOnly, setLastSelectedDateOnly] = useState<string | null>(null);
const [minDate, setMinDate] = useState<any>(null);
const [selectedDate, setSelectedDate] = useState<Date | null>(null);


const [appointmentsMap, setAppointmentsMap] = useState<any>({});
useEffect(() => {
  const collectionRef = query(
    collection(db, "ServiceRequests"),
    where("appointmentDate", "!=", null)
  );

  const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
    const map: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const time = toPHISOString(new Date(data.appointmentDate));
        map[time] = (map[time] || 0) + 1;
    });

    setAppointmentsMap(map);
  });

  return () => unsubscribe();
}, [clearanceInput.docType, clearanceInput.purpose]);


function toPHISOString(date: Date): string {
  // Shift time to UTC+8
  const utc = date.getTime() + (8 * 60 * 60 * 1000);
  const phDate = new Date(utc);

  // Zero out seconds and milliseconds
  phDate.setUTCSeconds(0, 0);

  // Format manually: yyyy-MM-ddTHH:mm:ss+08:00
  const yyyy = phDate.getUTCFullYear();
  const mm = String(phDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(phDate.getUTCDate()).padStart(2, '0');
  const hh = String(phDate.getUTCHours()).padStart(2, '0');
  const min = String(phDate.getUTCMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+08:00`;
}





// Disable if the date has all time slots full
const filterDate = (date: Date) => {
  const day = date.getDay(); 
  if (day === 0 || day === 6) return false;

  let fullCount = 0;
  for (let hour = 8; hour <= 16; hour++) {
    for (let min of [0, 30]) {
      const slot = new Date(date);
      slot.setHours(hour, min, 0, 0);
      const key = toPHISOString(slot);
      if ((appointmentsMap[key] || 0) >= 3) {
        fullCount++;
      }
    }
  }
  return fullCount < 18;
};



//Disable if that specific time slot already has 3 appointments
const filterTime = (time: Date) => {
  if(!selectedDate) return true; // If no date is selected, allow all times
  
  const slot = new Date(selectedDate);
  slot.setHours(time.getHours(), time.getMinutes(), 0, 0);

  const key = toPHISOString(slot);

  return (appointmentsMap[key] || 0) < 3;
};



useEffect(() => {
  if (user) {
    setClearanceInput((prev: any) => ({
      ...prev,
      accountId: user.uid, // Ensure the latest value is set
    }));
  }
}, [user]); // Runs when `user` changes


useEffect(() => {
  const findFirstAvailableWeekdaySlot = (): Date | null => {
    const date = new Date(); // start from now
    date.setHours(0, 0, 0, 0);

    // Try up to 30 days ahead to avoid infinite loop
    for (let d = 0; d < 30; d++) {
      date.setDate(date.getDate() + (d === 0 ? 1 : 1)); // start with tomorrow

      // Skip if weekend (0 = Sunday, 6 = Saturday)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Try all 30-min slots from 8:00 to 16:30
      for (let hour = 8; hour <= 16; hour++) {
        for (let min of [0, 30]) {
          const slot = new Date(date);
          slot.setHours(hour, min, 0, 0);
          const key = toPHISOString(slot);
          if ((appointmentsMap[key] || 0) < 3) {
            return slot;
          }
        }
      }
    }

    return null; // No available slot found in the next 30 days
  };

  const firstAvailable = findFirstAvailableWeekdaySlot();

  if (firstAvailable) {
    setSelectedDate(firstAvailable);
    setLastSelectedDateOnly(firstAvailable.toDateString());
    setClearanceInput((prev: any) => ({
      ...prev,
      appointmentDate: toPHISOString(firstAvailable),
    }));
    setMinDate(firstAvailable); // optional: restrict date picker to this or later
  }
}, [appointmentsMap]);


const [userAppointmentsMap, setUserAppointmentsMap] = useState<any>([]);
useEffect(() => {
  if (!user?.uid ) return; // replace with actual logged-in user ID

  const q = query(
    collection(db, "ServiceRequests"),
    where("accID", "==", user?.uid ),
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const map: any = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.appointmentDate) {
        if (!map[data.docType]) map[data.docType] = [];
        map[data.docType].push({
          docId: doc.id,
          purpose: data.purpose,
          appointmentDate: data.appointmentDate,
        });
      }
    });;
    setUserAppointmentsMap(map);

  });

  return () => unsubscribe();
}, [user?.uid]);




const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>, 
  setFile: React.Dispatch<React.SetStateAction<{ name: string, preview: string | undefined }[]>>,
  fileKey: keyof typeof clearanceInput // Key for clearanceInput (signaturejpg, barangayIDjpg, etc.)
) => {
  const selectedFile = event.target.files?.[0];

  if (selectedFile) {
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validImageTypes.includes(selectedFile.type)) {
      alert("Only JPG, JPEG, and PNG files are allowed.");
      return;
    }

    // Create a preview and store the file details
    const preview = URL.createObjectURL(selectedFile);
    setFile([{ name: selectedFile.name, preview }]);

    // Update clearanceInput state with the selected file
    setClearanceInput((prev: any) => ({
      ...prev,
      [fileKey]: selectedFile, // Assign file directly
    }));

    // Revoke object URL after some time to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(preview), 10000);
  }
};



  // Handle file deletion for any container
  const handleFileDelete = (
  fieldName: string, // this should be "signaturejpg"
  inputId: string,   // this should be "file-upload1"
  setFile: React.Dispatch<React.SetStateAction<{ name: string, preview: string | undefined }[]>>,
  setClearanceInput: React.Dispatch<React.SetStateAction<any>>
) => {
  // Clear preview files
  setFile([]);

  // Clear file from clearanceInput state
  setClearanceInput((prev: any) => {
    const updated = { ...prev };
    delete updated[fieldName];
    return updated;
  });

  // Clear actual <input type="file"> field
  const fileInput = document.getElementById(inputId) as HTMLInputElement;
  if (fileInput) {
    fileInput.value = "";
  }
};

  
 const handleReportUpload = async (key: any, storageRefs: Record<string, any>) => {
  try {
  
    const docRef = collection(db, "ServiceRequests"); // Reference to the collection
    let updates = { ...key };  // No filtering, just spread the object

    // Upload files to Firebase Storage if there are any
     for (const [key, storageRef] of Object.entries(storageRefs)) {
      console
          const file = clearanceInput[key];
          if (file instanceof File && storageRef) {
            // Upload each file to storage
            await uploadBytes(storageRef, file);
            console.log(`${key} uploaded successfully`);
          }
        }

    // Upload the report to Firestore
    let sendTo ="";
      if(clearanceInput.docType === "Barangay Certificate" || clearanceInput.docType === "Barangay Clearance" 
        || clearanceInput.docType === "Barangay Indigency" || clearanceInput.docType === "Temporary Business Permit"
        || clearanceInput.docType === "Construction" || (docType === "Barangay Permit" && docPurpose)||
        (clearanceInput.docType === "Other Documents" && clearanceInput.purpose !== "Barangay ID")

      ) {
        sendTo = "SAS";
      } 
      else if(clearanceInput.docType === "Business Permit" || clearanceInput.purpose === "Barangay ID"){
        sendTo = "Admin Staff";
      }
      let documentTypeIs = "";
        if(otherDocPurposes[clearanceInput.docType || '']?.includes(clearanceInput.purpose || "")) {
          documentTypeIs = "OtherDocuments";
      }
    updates = {
      ...updates,
      sendTo: sendTo,
      ...(clearanceInput.appointmentDate && { 
      approvedBySAS: false,
      }),
      ...(documentTypeIs !== "" && {
      documentTypeIs: documentTypeIs,
      }),
      requestorMrMs: clearanceInput.requestorMrMs,
      requestorFname: clearanceInput.requestorFname,
      ...(clearanceInput.purpose === "Flood Victims"&&{
        typhoonSignal: clearanceInput.typhoonSignal,
      }),

    };
    
    // Only go to notification if addDoc is 
    let newDoc = "";
    try {
      const doc = await addDoc(docRef, updates);
      console.log("Request uploaded with ID:", doc.id);
      newDoc = doc.id;
      router.push("/services/notification");
    } catch (error) {
      console.error("Failed to upload request:", error);
      setErrorMessage("Failed to submit your request. Please try again.");
      setShowErrorPopup(true);
      return;
    }
    console.log("Request data to upload:", updates);
    
    const notificationRef = collection(db, "BarangayNotifications");
    
    const useDocTypeAsMessage = 
      clearanceInput.docType === "Business Permit" || 
      clearanceInput.docType === "Temporary Business Permit";

      const rawDate = new Date(clearanceInput.appointmentDate);
      const formattedAppointmentDate = rawDate.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      
    await addDoc(notificationRef, {
    message: 
      clearanceInput.purpose === "First Time Jobseeker"
        ? `New Jobseeker Certificate requested by ${clearanceInput.requestorFname} (Online).`
        : clearanceInput.docType === "Barangay Certificate" && clearanceInput.purpose === "Residency"
          ? `New Residency requested by ${clearanceInput.requestorFname} with proposed appointment on ${formattedAppointmentDate} (Online).`
          : clearanceInput.docType === "Barangay Indigency"
            ? `New Barangay Indigency ${clearanceInput.purpose} requested by ${clearanceInput.requestorFname} with proposed appointment on ${formattedAppointmentDate} (Online).`
            : clearanceInput.docType === "Construction"
              ? `New Construction Permit requested by ${clearanceInput.requestorFname}. (Online)`
              : `New ${useDocTypeAsMessage ? clearanceInput.docType : clearanceInput.purpose} requested by ${clearanceInput.requestorFname} (Online).`,

      timestamp: new Date(),
      requestorId: userData?.residentId,
      isRead: false,
      transactionType: "Online Service Request",
      recipientRole: (
        clearanceInput.purpose === "First Time Jobseeker" ||
        clearanceInput.docType === "Barangay Certificate" ||
        clearanceInput.docType === "Barangay Clearance" ||
        clearanceInput.docType === "Barangay Indigency" ||
        clearanceInput.docType === "Temporary Business Permit" ||
        clearanceInput.docType === "Construction" ||
        clearanceInput.docType === "Barangay Permit" ||        
        (clearanceInput.docType === "Other Documents" && clearanceInput.purpose !== "Barangay ID")
      )
        ? "Assistant Secretary"
        : "Admin Staff",
      requestID: newDoc,
    });
    
  
  await addDoc(collection(db, "Notifications"), {
    residentID: userData?.residentId,
    requestID: newDoc,
    message: `Your document request (${clearanceInput?.requestId}) is now (Pending). We will notify you once it progresses.`,
    timestamp: new Date(),
    transactionType: "Online Service Request",
    isRead: false,
  });

  
  } catch (e: any) {
    console.error("Error uploading request:", e);
  }
};


  
  const handleChange = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  // Safely get checked value only for checkboxes
  const fieldValue =
    type === "checkbox" && e.target instanceof HTMLInputElement
      ? e.target.checked
      : value;

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
          ...(prev[keys[0]] || {}),
          [keys[1]]: fieldValue,
        },
      };
    }

    return {
      ...prev,
      [name]: fieldValue,
    };
  });
};
    
  const getRequiredFields = (): string[] => {
    const requiredFields: string[] = [];

    requiredFields.push("requestorFname",
          "requestorMrMs", "address","dateOfResidency",
          "birthday","age", "gender", "contact", "civilStatus",
          "citizenship"
        );

      if(clearanceInput.docType === "Barangay Certificate" ){
        requiredFields.push("purpose")
        if(clearanceInput.purpose === "Residency"){
          requiredFields.push("CYFrom", "CYTo");
        }
        
        if(clearanceInput.purpose === "Occupancy /  Moving Out") {
          requiredFields.push("fromAddress", "toAddress","fullName");
        }
        if(clearanceInput.purpose === "Estate Tax" || clearanceInput.purpose === "Death Residency") {
          requiredFields.push("fullName","dateofdeath" );
          if(clearanceInput.purpose === "Estate Tax") {
            requiredFields.push("estateSince");
          }
        }
        
        if(clearanceInput.purpose === "No Income") {
          requiredFields.push("noIncomePurpose","noIncomeChildFName");

        }
        if(clearanceInput.purpose === "Cohabitation") {
          requiredFields.push("partnerWifeHusbandFullName","cohabitationRelationship", "cohabitationStartDate");
        }
        if(clearanceInput.purpose === "Guardianship") {
          requiredFields.push("guardianshipType","wardRelationship", "fullName" ,"wardFname");
        }
        if(clearanceInput.purpose === "Good Moral and Probation") {
          requiredFields.push("goodMoralPurpose",);
          if(clearanceInput.goodMoralPurpose === "Others") {
            requiredFields.push("goodMoralOtherPurpose");
          }
        }
        if(clearanceInput.purpose === "Garage/PUV") {
          requiredFields.push("goodMoralOtherPurpose",
            "vehicleType","noOfVehicles"
          );
        }
        if(clearanceInput.purpose === "Garage/TRU") {
          requiredFields.push(
            "businessName","businessNature", "businessLocation",
            "noOfVehicles", "vehicleMake","vehicleType",
            "vehiclePlateNo", "vehicleSerialNo", "vehicleChassisNo",
            "vehicleEngineNo", "vehicleFileNo", 
          );
        }
      }
      
      if (clearanceInput.docType === "Barangay Indigency") {
        requiredFields.push("purpose");
        if(clearanceInput.purpose === "No Income") {
          requiredFields.push("noIncomePurpose","noIncomeChildFName");

        }
        if(clearanceInput.purpose === "Financial Subsidy of Solo Parent") {
          requiredFields.push("noIncomeChildFName",)
        }
        if(clearanceInput.purpose === "Fire Victims") {
          requiredFields.push("dateOfFireIncident")
        }
        if(clearanceInput.purpose === "Flood Victims") {
          requiredFields.push("nameOfTyphoon", "dateOfTyphoon", "typhoonSignal");
        }
      }

      if(clearanceInput.docType === "Barangay Clearance") {
        if(clearanceInput.purpose === "Residency"){
          requiredFields.push("CYFrom", "CYTo");
        }
      }

      if(clearanceInput.docType === "Other Documents") {
        requiredFields.push("purpose");
        if(clearanceInput.purpose === "Barangay ID") {
          requiredFields.push("birthplace","religion","nationality"
            ,"occupation","height","weight","bloodtype"
          );
        }
        if(clearanceInput.purpose === "First Time Jobseeker") {
          requiredFields.push("course","isBeneficiary"
            ,"educationalAttainment")
        }
      }
      // Barangay Permits
      if(clearanceInput.docType === "Business Permit" || clearanceInput.docType === "Temporary Business Permit") {
        requiredFields.push("purpose", "businessName", 
          "businessNature", "businessLocation","estimatedCapital")
      }
      if(clearanceInput.docType === "Construction") {
        requiredFields.push("typeofconstruction", "typeofbldg",
          "homeOrOfficeAddress", "projectName", "projectLocation"
        );
      }

  return requiredFields;
};



    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission
      if((clearanceInput.docType === "Barangay Certificate" && clearanceInput.purpose === "Residency" ) || clearanceInput.docType === "Barangay Indigency") {
        
        const selectedDateWTime = toPHISOString(new Date(clearanceInput.appointmentDate));

      
        // check if the user has an existing appointment for this docType and purpose on the selected date
        const selectedDateOnly = new Date(clearanceInput.appointmentDate).toDateString();
        const userAppointment = userAppointmentsMap[clearanceInput.docType]?.find((app: any) => {
          const appDateOnly = new Date(app.appointmentDate).toDateString();
          console.log("appDateOnly:", appDateOnly, "selectedDateOnly:", selectedDateOnly);
          return appDateOnly === selectedDateOnly && app.purpose === clearanceInput.purpose;
        });

        if (userAppointment) {
          setErrorMessage("You already have an appointment for this document type on the selected date.");
          setShowErrorPopup(true);
          return;
        }

        // Check if the selected date is already booked for this user in any doctype and purpose
        const getAllUserAppointments = Object.values(userAppointmentsMap).flat();
        const appointments = getAllUserAppointments?.find((app:any) => app.appointmentDate === selectedDateWTime);

        if(appointments ){
          setErrorMessage("You already have an appointment in this time slot. Please choose another date or time.");
          setShowErrorPopup(true);
          return
        }  
      }
                      


      const contactPattern = /^09\d{9}$/; // Regex for Philippine mobile numbers
      if (!contactPattern.test(clearanceInput.contact)) {
      setErrorMessage("Invalid contact number. Format should be: 0917XXXXXXX");
      setShowErrorPopup(true);
      return;
      }

      if (Number(clearanceInput.age) < 18) {
      setErrorMessage("Age must be 18 or above to proceed with this document request.");
      setShowErrorPopup(true);
      return;
      }

      // Gather required fields for this docType/purpose
      const requiredFields = getRequiredFields();

      requiredFields.push(...filteredDynamicFields);
      console.log("Required Fields:", requiredFields);
      
      if(!isAllRequiredFieldsFilledUp(requiredFields)){
        return;
      }
      // Add dynamic image fields
      const requiredImageFields = [
      ...Object.keys(dynamicFileStates),
      "signaturejpg"
      ];
      // Add static image fields if they are visible in the UI for this docType/purpose
      if (
      docType === "Barangay Certificate" ||
      docType === "Barangay Clearance" ||
      docType === "Barangay Indigency" ||
      clearanceInput.purpose === "First Time Jobseeker"
      ) {
        requiredImageFields.push("barangayIDjpg", "validIDjpg", "letterjpg");
      }
      if(clearanceInput.purpose === "Barangay ID"){
        requiredImageFields.push("signaturejpg", "validIDjpg");
      }
      if (docType === "Temporary Business Permit" || docType === "Business Permit") {
        requiredImageFields.push("copyOfPropertyTitle", "dtiRegistration", "isCCTV", "validIDjpg");
      }
      if (docType === "Construction") {
        requiredImageFields.push("copyOfPropertyTitle", "taxDeclaration", "approvedBldgPlan", "validIDjpg");
      }
      if (clearanceInput.purpose === "Death Residency" || clearanceInput.purpose === "Estate Tax") {
        requiredImageFields.push("deathCertificate");
      }


      

      const atLeastOneIDRequired =
        (docType === "Barangay Certificate" ||
          docType === "Barangay Clearance" ||
          docType === "Barangay Indigency" ||
          clearanceInput.purpose === "Barangay ID" ||
          clearanceInput.purpose === "First Time Jobseeker"
        );
      
      // Step 1: Handle special case: Require at least one of the three
      if (
        atLeastOneIDRequired &&
        !clearanceInput.barangayIDjpg &&
        !clearanceInput.validIDjpg &&
        !clearanceInput.letterjpg
      ) {
        setErrorMessage(
          "Please upload at least one of the following documents: Barangay ID, Valid ID, or Endorsement Letter."
        );
        setShowErrorPopup(true);
        return;
      }

      // Mapping image field keys to human-readable labels
      const imageFieldLabels: { [key: string]: string } = {
        isCCTV: "CCTV Picture",
        copyOfPropertyTitle: "Copy of Property Title",
        dtiRegistration: "DTI Registration",
        approvedBldgPlan: "Approved Building Plan",
        deathCertificate: "Death Certificate",
        twoByTwoPicture: "2x2 Picture",
        signaturejpg: "Signature",
        letterjpg: "Endorsement Letter",
        barangayIDjpg: "Barangay ID",
        validIDjpg: "Valid ID",
        taxDeclaration: "Tax Declaration",
      };


      requiredImageFields.push(...dynamicImageFields); // Ensure signature is always required

      // Step 2: Check other required image fields
      for (const imgField of requiredImageFields) {
        const value = clearanceInput[imgField];
      
        if (
          (!value || !(value instanceof File)) &&
          !(atLeastOneIDRequired &&
            (imgField === "barangayIDjpg" ||
              imgField === "validIDjpg" ||
              imgField === "letterjpg"))
        ) {
            const label =
            imageFieldLabels[imgField] ||
            imgField
              .replace(/_/g, " ") // Replace underscores with spaces
              .replace(/(?!^)([A-Z])/g, " $1")
              .replace(/\.[^/.]+$/, "")
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase())
              .replace(/\b(Id|ID|id)\b/g, "ID")
              .replace(/\b(Ph|PH|ph)\b/g, "PH");
        
          setErrorMessage(`Please upload the required image: ${label}.`);
          setShowErrorPopup(true);
          return;
        }
      }

      // List all file-related keys in an array for easier maintenance
      const fileKeys = [
      ...Object.keys(dynamicFileStates), // Add dynamic image fields
      "barangayIDjpg", "validIDjpg", "letterjpg", "signaturejpg",
      "copyOfPropertyTitle", "dtiRegistration", "isCCTV",
      "taxDeclaration", "approvedBldgPlan", "deathCertificate", 
      "twoByTwoPicture"
      ];  

      const filenames: Record<string, string> = {};
      const storageRefs: Record<string, any> = {};

      // Generate unique filenames for each uploaded file
      fileKeys.forEach((key) => {
      const file = clearanceInput[key];
      if (file && file instanceof File) {
        let timeStamp = Date.now().toString() + Math.floor(Math.random() * 1000); // Add random digits to prevent collisions
        const fileExtension = file.name.split('.').pop();
        const filename = `service_request_${clearanceInput.accountId}.${key}.${timeStamp}.${fileExtension}`;
        filenames[key] = filename;
        storageRefs[key] = ref(storage, `ServiceRequests/${filename}`);
      }
      });

      // 📌 Handling for Barangay Certificate, Clearance, Indigency, Business ID, First Time Jobseeker
      if (
      docType === "Barangay Certificate" ||
      docType === "Barangay Clearance" ||
      docType === "Barangay Indigency" ||
      clearanceInput.purpose === "Barangay ID" ||
      clearanceInput.purpose === "First Time Jobseeker"
      ) {
      const clearanceVars: Record<string, any> = {
        createdAt: clearanceInput.dateRequested,
        requestId: clearanceInput.requestId,
        reqType: "Online",
        status: "Pending",
        statusPriority: 1,
        requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname}`,
        accID: clearanceInput.accountId,
        docType: docType,
        purpose: clearanceInput.purpose,
        dateOfResidency: clearanceInput.dateOfResidency,
        address: clearanceInput.address,
        residentId: userData?.status === "Verified" ? userData.residentId : "Guest",
        ...(clearanceInput.purpose === "Residency" && {
        CYFrom: clearanceInput.CYFrom,
        CYTo: clearanceInput.CYTo,
        attestedBy: clearanceInput.attestedBy,
        }),
        ...(clearanceInput.purpose === "Guardianship" && {
        fullName: clearanceInput.fullName,
        wardFname: clearanceInput.wardFname,
        wardRelationship: clearanceInput.wardRelationship,
        guardianshipType: clearanceInput.guardianshipType,
        }),
        ...(clearanceInput.purpose === "Occupancy /  Moving Out" && {
        fullName: clearanceInput.fullName,
        toAddress: clearanceInput.toAddress, 
        fromAddress: clearanceInput.fromAddress,
        }),
        ...(clearanceInput.purpose === "Garage/TRU" && {
        businessName: clearanceInput.businessName,
        businessLocation: clearanceInput.businessLocation,
        noOfVehicles: clearanceInput.noOfVehicles,
        businessNature: clearanceInput.businessNature,
        vehicleMake: clearanceInput.vehicleMake,
        vehicleType: clearanceInput.vehicleType,
        vehiclePlateNo: clearanceInput.vehiclePlateNo,
        vehicleSerialNo: clearanceInput.vehicleSerialNo,
        vehicleChassisNo: clearanceInput.vehicleChassisNo,
        vehicleEngineNo: clearanceInput.vehicleEngineNo,
        vehicleFileNo: clearanceInput.vehicleFileNo,
        }),
        ...(clearanceInput.purpose === "Garage/PUV" && {
        vehicleType: clearanceInput.vehicleType,
        vehicleMake: clearanceInput.vehicleMake,
        noOfVehicles: clearanceInput.noOfVehicles,
        goodMoralOtherPurpose: clearanceInput.goodMoralOtherPurpose,
        }),
        birthday: clearanceInput.birthday,
        age: clearanceInput.age,
        gender: clearanceInput.gender,
        civilStatus: clearanceInput.civilStatus,
        contact: clearanceInput.contact,
        citizenship: clearanceInput.citizenship,
        signaturejpg: filenames.signaturejpg, // Store filename instead of file object
        ...(clearanceInput.purpose === "Cohabitation" && {
        partnerWifeHusbandFullName: clearanceInput.partnerWifeHusbandFullName,
        cohabitationStartDate: clearanceInput.cohabitationStartDate,
        cohabitationRelationship: clearanceInput.cohabitationRelationship,
        }),
        ...(clearanceInput.purpose === "Estate Tax" && {
        fullName: clearanceInput.fullName,
        dateofdeath: clearanceInput.dateofdeath,
        estateSince: clearanceInput.estateSince,
        deathCertificate: filenames.deathCertificate,
        }),
        ...( clearanceInput.purpose === "Death Residency"  && {
        fullName: clearanceInput.fullName,
        dateofdeath: clearanceInput.dateofdeath,
        deathCertificate: filenames.deathCertificate,
        }),
        ...(clearanceInput.purpose === "Good Moral and Probation" && {
         ...(clearanceInput.goodMoralPurpose ==="Others" ? 
          { goodMoralPurpose: clearanceInput.goodMoralOtherPurpose }:
          { goodMoralPurpose: clearanceInput.goodMoralPurpose }),
        }),
        ...(clearanceInput.purpose === "No Income" && {
        noIncomePurpose: clearanceInput.noIncomePurpose,
        noIncomeChildFName: clearanceInput.noIncomeChildFName,
        }),
        ...(clearanceInput.barangayIDjpg && { barangayIDjpg: filenames.barangayIDjpg }),
        ...(clearanceInput.validIDjpg && { validIDjpg: filenames.validIDjpg }),
        ...(clearanceInput.letterjpg && { letterjpg: filenames.letterjpg }),
        ...(((clearanceInput.purpose === "Residency" && docType === "Barangay Certificate") || docType === "Barangay Indigency") && {
          appointmentDate: clearanceInput.appointmentDate,
          purpose: clearanceInput.purpose,
        }),
        ...(clearanceInput.purpose === "Financial Subsidy of Solo Parent" && {
        noIncomeChildFName: clearanceInput.noIncomeChildFName,
        }),
        ...(clearanceInput.purpose === "Fire Victims" && {
        dateOfFireIncident: clearanceInput.dateOfFireIncident,
        }),
        ...(clearanceInput.purpose === "Flood Victims" && {
        nameOfTyphoon: clearanceInput.nameOfTyphoon,
        dateOfTyphoon: clearanceInput.dateOfTyphoon,
        }),
        ...(clearanceInput.purpose === "Barangay ID" && {
        birthplace: clearanceInput.birthplace,
        religion: clearanceInput.religion,
        nationality: clearanceInput.nationality,
        height: clearanceInput.height,
        weight: clearanceInput.weight,
        bloodtype: clearanceInput.bloodtype,
        occupation: clearanceInput.occupation,
        emergencyDetails: {
          fullName: clearanceInput.emergencyDetails?.fullName || "",
          address: clearanceInput.emergencyDetails?.address || "",
          contactNumber: clearanceInput.emergencyDetails?.contactNumber || "",
          relationship: clearanceInput.emergencyDetails?.relationship || "",
        },
        ...(clearanceInput.twoByTwoPicture && { twoByTwoPicture: filenames.twoByTwoPicture }),
        }),
        ...(clearanceInput.purpose === "First Time Jobseeker" && {
        educationalAttainment: clearanceInput.educationalAttainment,
        course: clearanceInput.course,
        isBeneficiary: clearanceInput.isBeneficiary,
        })
      };

      filteredDynamicFields.forEach((fieldName) => {
        if (
        !["signaturejpg", "barangayIDjpg", "validIDjpg", "letterjpg", "twoByTwoPicture"].includes(fieldName) &&
        clearanceInput[fieldName] !== undefined
        ) {
        clearanceVars[fieldName] = clearanceInput[fieldName];
        }
      });

      Object.keys(dynamicFileStates).forEach((key) => {
        if (clearanceInput[key] instanceof File && filenames[key]) {
        clearanceVars[key] = filenames[key];
        }
      });

      handleReportUpload(clearanceVars, storageRefs);
      }

      // 📌 Handling for Temporary Business Permit & Business Permit
      if (docType === "Temporary Business Permit" || docType === "Business Permit") {
      const clearanceVars = {
        createdAt: clearanceInput.dateRequested,
        requestId: clearanceInput.requestId,
        status: "Pending",
        reqType: "Online",
        statusPriority: 1,
        requestor: `${clearanceInput.requestorMrMs||""} ${clearanceInput.requestorFname||""} ${clearanceInput.requestorLname||""}`,
        accID: clearanceInput.accountId,
        dateOfResidency: clearanceInput.dateOfResidency,
        address: clearanceInput.address,
        birthday: clearanceInput.birthday,
        age: clearanceInput.age,
        gender: clearanceInput.gender,
        civilStatus: clearanceInput.civilStatus,
        contact: clearanceInput.contact,
        citizenship: clearanceInput.citizenship,
        docType: docType,
        purpose: clearanceInput.purpose,
        businessName: clearanceInput.businessName,
        businessLocation: clearanceInput.businessLocation,
        businessNature: clearanceInput.businessNature,
        estimatedCapital: clearanceInput.estimatedCapital,

        copyOfPropertyTitle: filenames.copyOfPropertyTitle,
        dtiRegistration: filenames.dtiRegistration,
        isCCTV: filenames.isCCTV,
        signaturejpg: filenames.signaturejpg,
      };
      handleReportUpload(clearanceVars, storageRefs);
      }

      // 📌 Handling for Construction Permit
      if (docType === "Construction") {
      const clearanceVars = {
        createdAt: clearanceInput.dateRequested,
        requestId: clearanceInput.requestId,
        status: "Pending",
        statusPriority: 1,
        reqType: "Online",
        requestor: `${clearanceInput.requestorMrMs||""} ${clearanceInput.requestorFname||""} ${clearanceInput.requestorLname||""}`,
        accID: clearanceInput.accountId,
        docType: docType,
        typeofconstruction: clearanceInput.typeofconstruction,
        homeOrOfficeAddress: clearanceInput.homeOrOfficeAddress,
        dateOfResidency: clearanceInput.dateOfResidency,
        address: clearanceInput.address,
        birthday: clearanceInput.birthday,
        age: clearanceInput.age,
        gender: clearanceInput.gender,
        civilStatus: clearanceInput.civilStatus,
        contact: clearanceInput.contact,
        citizenship: clearanceInput.citizenship,
        typeofbldg: clearanceInput.typeofbldg,
        projectName: clearanceInput.projectName,
        projectLocation: clearanceInput.projectLocation,
        taxDeclaration: filenames.taxDeclaration,
        approvedBldgPlan: filenames.approvedBldgPlan,
        copyOfPropertyTitle: filenames.copyOfPropertyTitle,
        signaturejpg: filenames.signaturejpg,
        ...(clearanceInput.typeofbldg === "Others" && {othersTypeofbldg: clearanceInput.othersTypeofbldg}),
      };
      handleReportUpload(clearanceVars, storageRefs);
      }

      if (
      docType &&
        ![
        "Barangay Certificate",
        "Barangay Clearance",
        "Barangay Indigency",
        "Temporary Business Permit",
        "Business Permit",
        "Construction"
        ].includes(docType) &&
        !["Barangay ID", "First Time Jobseeker"].includes(clearanceInput.purpose)
      ) {
      const clearanceVars: Record<string, any> = {
        createdAt: clearanceInput.dateRequested,
        requestId: clearanceInput.requestId,
        reqType: "Online",
        status: "Pending",
        statusPriority: 1,
        requestor: `${clearanceInput.requestorMrMs||""} ${clearanceInput.requestorFname||""} ${clearanceInput.requestorLname||""}`,
        accID: clearanceInput.accountId,
        docType: docType,
        purpose: clearanceInput.purpose,
        dateOfResidency: clearanceInput.dateOfResidency,
        address: clearanceInput.address,
        birthday: clearanceInput.birthday,
        age: clearanceInput.age,
        gender: clearanceInput.gender,
        civilStatus: clearanceInput.civilStatus,
        contact: clearanceInput.contact,
        citizenship: clearanceInput.citizenship,
        signaturejpg: filenames.signaturejpg,
        ...(clearanceInput.barangayIDjpg && { barangayIDjpg: filenames.barangayIDjpg }),
        ...(clearanceInput.validIDjpg && { validIDjpg: filenames.validIDjpg }),
        ...(clearanceInput.letterjpg && { letterjpg: filenames.letterjpg }),
      };

      // Add dynamic text fields (non-image fields)
      filteredDynamicFields.forEach((fieldName) => {
        if (
        !["signaturejpg", "barangayIDjpg", "validIDjpg", "letterjpg"].includes(fieldName) &&
        clearanceInput[fieldName] !== undefined
        ) {
        clearanceVars[fieldName] = clearanceInput[fieldName];
        }
      });

      // Add dynamic image fields
      Object.keys(dynamicFileStates).forEach((key) => {
        if (clearanceInput[key] instanceof File && filenames[key]) {
        clearanceVars[key] = filenames[key];
        }
      });

      handleReportUpload(clearanceVars, storageRefs);
      }
     // alert("Document request submitted successfully!");
      router.push('/services/notification'); 
    //  router.push("/services");
    };

    const isAllRequiredFieldsFilledUp = (requiredFields:string []) => {
      for (const key of requiredFields) {
        const fieldValue = clearanceInput[key as keyof ClearanceInput];
        if (
          fieldValue === undefined ||
          fieldValue === null ||
          (typeof fieldValue === "string" && fieldValue.trim() === "") ||
          (typeof fieldValue === "object" && Object.keys(fieldValue).length === 0)
        ) {
          let message = "";
          if(key ==="CYFrom") message = "Cohabitation Year From";
          else if(key ==="CYTo") message = "Cohabitation Year To";
          else if(key ==="noIncomePurpose") message = "No Income Purpose";
          else if(key ==="noIncomeChildFName") message = "No Income Child's First Name";
          else if(key ==="goodMoralOtherPurpose" && (clearanceInput.purpose === "Garage/PUV" || clearanceInput.purpose === "Garage/TRU")) message = "Certificate Purpose";          
          else if(key ==="goodMoralOtherPurpose") message = "Good Moral Other Purpose"; 
          else if(key ==="attestedBy") message = "Attested By";
          else if(key ==="partnerWifeHusbandFullName") message = "Partner/Wife/Husband Full Name";
          else if(key ==="cohabitationRelationship") message = "Cohabitation Relationship";
          else if(key ==="cohabitationStartDate") message = "Cohabitation Start Date";
          else if(key ==="guardianshipType" ) message = "Type of Guardianship Certificate";
          else if(key ==="wardFname") message = "Ward's First Name";
          else if(key ==="wardRelationship") message = "Ward's Relationship";
          else if(key ==="fromAddress") message = "From Address";
          else if(key ==="toAddress") message = "To Address";
          else if(key ==="dateofdeath") message = "Date of Death";
          else if(key ==="estateSince") message = "Estate Since";
          else if(key ==="goodMoralPurpose") message = "Good Moral Purpose";
          else if(key ==="vehicleType" && clearanceInput.purpose === "Garage/PUV") message = "Vehicle Description";
          else if(key ==="vehicleType") message = "Vehicle Type";
          else if(key ==="vehicleMake") message = "Vehicle Make";
          else if(key ==="noOfVehicles" && clearanceInput.purpose === "Garage/TRU") message = "Nos Of Tricycle/s";
          else if(key ==="noOfVehicles") message = "Nos Of Vehicle/s";
          else if(key ==="vehiclePlateNo") message = "Vehicle Plate Number";
          else if(key ==="vehicleSerialNo") message = "Vehicle Serial Number";
          else if(key ==="vehicleChassisNo") message = "Vehicle Chassis Number";
          else if(key ==="vehicleEngineNo") message = "Vehicle Engine Number";
          else if(key ==="vehicleFileNo") message = "Vehicle File Number";
          else if(key ==="businessName") message = "Business Name";
          else if(key ==="businessNature") message = "Business Nature";
          else if(key ==="businessLocation") message = "Business Location";
          else if(key ==="estimatedCapital") message = "Estimated Capital";
          else if(key ==="typeofconstruction") message = "Type of Construction";
          else if(key ==="typeofbldg") message = "Type of Building";
          else if(key ==="homeOrOfficeAddress") message = "Home or Office Address";
          else if(key ==="projectName") message = "Project Name";
          else if(key ==="projectLocation") message = "Project Location";
          else if(key ==="dateOfFireIncident") message = "Date of Fire Incident";
          else if(key ==="nameOfTyphoon") message = "Name of Typhoon";
          else if(key ==="typhoonSignal") message = "Typhoon Signal";
          else if(key ==="dateOfTyphoon") message = "Date of Typhoon";
          else if(key ==="fullName") message = `${addOn}Full Name`;
          else if (key === "emergencyDetails.fullName") message = "Emergency Contact Full Name";
          else if (key === "emergencyDetails.address") message = "Emergency Contact Address";
          else if (key === "emergencyDetails.contactNumber") message = "Emergency Contact Number";
          else if (key === "emergencyDetails.relationship") message = "Emergency Contact Relationship";
          else if (key === "requestorFname") message = "Requestor's First Name";
          else if (key === "requestorMrMs") message = "Requestor's Mr/Ms";
          else if (key === "address") message = "Address";
          else if (key === "dateOfResidency") message = "Date of Residency";
          else if (key=== "birthday") message = "Birthday";
          else if (key === "age") message = "Age";
          else if(key === "birthplace") message = "Place of Birth";
          else if(key === "religion") message = "Religion";
          else if(key === "nationality") message  = "Nationality";
          else if(key === "occupation") message = "Occupation";
          else if(key === "height") message = "Height";
          else if(key === "weight") message = "Weight";
          else if(key === "bloodtype") message = "Blood Type";
          else if (key === "contact") message = "Contact Number";
          else if (key === "civilStatus") message = "Civil Status";
          else if (key === "citizenship") message = "Citizenship";
          else if (key === "purpose") message = "Purpose";
          else if (key === "educationalAttainment") message = "Educational Attainment";
          else if (key === "course") message = "Course";
          else message = key
          .replace(/([A-Z])/g, ' $1')   // Add space before capital letters
          .replace(/[\.\-_]/g, ' ')     // Replace dot (.), dash (-), and underscore (_) with space
          
          setErrorMessage(`Please fill up ${message}.`);
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return false;
        }
      }
      return true;
    }    

    const [addOn, setAddOn] = useState<string>("");
    
    
    useEffect(() => {
      if ((clearanceInput.purpose === "Death Residency" || clearanceInput.purpose === "Estate Tax" ) && docType === "Barangay Certificate") setAddOn("Deceased ");
      else if(clearanceInput.purpose === "Occupancy /  Moving Out" && docType === "Barangay Certificate")setAddOn("From ");
      else if(clearanceInput.purpose === "Guardianship" && docType === "Barangay Certificate") setAddOn("Guardian's ");
      else setAddOn("");
      
    }, [clearanceInput.purpose, docType]);


    

    const [activeSection, setActiveSection] = useState("details");

    const formatFieldName = (name: string) =>
      name
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word

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
    
    const customFieldsFromDocType =
      otherDocFieldsByType[clearanceInput.docType] || [];
    
    const filteredCustomFields = customFieldsFromDocType.filter(
      (fieldName) => !fixedPredefinedFields.includes(fieldName)
    );

    const matchedPermitFields = otherDocFieldsByType[clearanceInput.docType] || [];
    const matchedPermitImageFields = otherDocImageFields[clearanceInput.docType] || [];
    const purposeFields = otherDocFieldsByType[clearanceInput.purpose] || [];
    const purposeImageFields = otherDocImageFields[clearanceInput.purpose] || [];
    
    const excludedDynamicFields = ["requestorFname", "requestorMrMs", "dateOfResidency", "address"];


    const filteredDynamicFields = [...new Set([
      ...purposeFields,
      ...(clearanceInput.docType && matchedPermitFields)
    ])].filter((fieldName) => !excludedDynamicFields.includes(fieldName));
    console.log("Filtered Dynamic Fields:", filteredDynamicFields);
    const matchedImageFieldsRaw = [
      ...(otherDocImageFields[clearanceInput.purpose] || []),
      ...(otherDocPurposes["Barangay Permit"]?.includes(docType || "")
        ? otherDocImageFields[docType || ""] || []
        : []),
    ];
    

    // Normalize: support both [{ name: "..." }] and ["..."]
    const matchedImageFields: string[] = matchedImageFieldsRaw.map((field: any) =>
      typeof field === "string" ? field : field?.name
    );

    const dynamicImageFields = [...new Set([
      ...matchedImageFields,
      ...purposeImageFields,
    ])].filter(
      (field): field is string =>
        typeof field === "string" &&
        !!field &&
        !existingImageFields.includes(field)
    );
    console.log("Dynamic Image Fields:", dynamicImageFields);

   

  const half = Math.ceil(filteredDynamicFields.length / 2);
  const leftFields = filteredDynamicFields.slice(0, half);
  const rightFields = filteredDynamicFields.slice(half);

  return (

    <main className="main-form-container">
        <div className="headerpic-report">
          <p>Document Request</p>
        </div>


      <div className="document-req-section">
        <h1>{docType} Request Form</h1>
      

        <div className="document-req-section-upper">
          <nav className="document-req-section-toggle-wrapper">
            {["details", ...(clearanceInput.purpose === "Barangay ID" ? ["emergency"] : []), "others"].map((section) => (
              <button
                key={section}
                type="button"
                        className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                        onClick={() => setActiveSection(section)}
              >
                        {section === "details" && "Details"}
                        {section === "emergency" && "Emergency Info"}
                        {section === "others" && "Others"}
              </button>
            ))}
          </nav> 
        </div>

        <form className="document-req-form" onSubmit={handleSubmit}>
          {activeSection === "details" && (
            <>
              <div className="document-req-form-container">
                <div className="document-req-form-container-left-side">
                  {(docType === "Barangay Certificate" || docType === "Barangay Clearance" 
                  ||  docType === "Barangay Indigency" || docType === "Business Permit" || docType === "Temporary Business Permit" ||
                    docType === "Other Documents") 
                  && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="purpose" className="form-label-document-req">
                          {docType} Purpose<span className="required">*</span>
                        </label>
                        <select
                          id="purpose"
                          name="purpose"
                          className="form-input-document-req"
                          required
                          value={clearanceInput.purpose}
                          onChange={handleChange}
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

                              {/* Dynamically added */}
                              {otherDocPurposes["Barangay Certificate"]?.map((title, index) => (
                                <option key={index} value={title}>{title}</option>
                              ))}
                            </>
                          ) : docType === "Barangay Clearance" ? (
                            <>
                              <option value="Loan">Loan</option>
                              <option value="Bank Transaction">Bank Transaction</option>
                              <option value="Residency">Residency</option>
                              <option value="Local Employment">Local Employment</option>
                              <option value="Maynilad">Maynilad</option>
                              <option value="Meralco">Meralco</option>
                              <option value="Bail Bond">Bail Bond</option>

                              {/* Dynamically added */}
                              {otherDocPurposes["Barangay Clearance"]?.map((title, index) => (
                                <option key={index} value={title}>{title}</option>
                              ))}
                            </>
                          ) : docType === "Barangay Indigency" ? (
                            <>
                              <option value="No Income">No Income</option>
                              <option value="Public Attorneys Office">Public Attorneys Office</option>
                              <option value="Financial Subsidy of Solo Parent">Financial Subsidy of Solo Parent</option>
                              <option value="Fire Victims">Fire Victims</option>
                              <option value="Flood Victims">Flood Victims</option>
                              <option value="Philhealth Sponsor">Philhealth Sponsor</option>
                              <option value="Medical Assistance">Medical Assistance</option>

                              {/* Dynamically added */}
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
                              {!isGuest && (
                                <>
                                  <option value="Barangay ID">Barangay ID</option>
                                  <option value="First Time Jobseeker">Jobseeker Certificate</option>
                                </>
                              )}

                              {/* Dynamically added */}
                              {otherDocPurposes["Other Documents"]
                                ?.filter(title => !isGuest || (isGuest && forResidentOnlyMap[title] === false) || (userData?.status === "Unverified" && forResidentOnlyMap[title] === false))
                                .map((title, index) => (
                                  <option key={index} value={title}>{title}</option>
                              ))}
                            </>
                          ) : null}
                        </select>
                      </div>
                  </>
                  )}

                  {(clearanceInput.purpose === "No Income" && clearanceInput.docType === "Barangay Indigency")&& (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="noIncomePurpose" className="form-label-document-req">Purpose Of No Income:<span className="required">*</span></label>
                          <select 
                            id="noIncomePurpose"  
                            name="noIncomePurpose"  
                            value={clearanceInput.noIncomePurpose}
                            onChange={handleChange}
                            className="form-input-document-req"  
                            required 
                          >
                            <option value="" disabled>Select Purpose</option>
                            <option value="SPES Scholarship">SPES Scholarship</option>
                            <option value="ESC Voucher">DEPED Educational Services Contracting (ESC) Voucher</option>
                          </select>
                      </div>
                    </>
                  )}
                
                  <div className="form-group-document-req">
                    <label htmlFor="requestorFname" className="form-label-document-req">Requestor Full Name<span className="required">*</span></label>
                    <input 
                      type="text"  
                      id="requestorFname"  
                      name="requestorFname"  
                      className="form-input-document-req" 
                      value={clearanceInput.requestorFname}
                      onChange={handleChange}
                      required  
                      disabled={isReadOnly}
                      placeholder="Enter Requestor's Full Name"  
                    />
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="requestorMrMs" className="form-label-document-req">Requestor's Title<span className="required">*</span></label>
                    <select
                      id="requestorMrMs" 
                      name="requestorMrMs" 
                      className="form-input-document-req" 
                      required
                      value={
                        ["Mr.", "Ms."].includes(clearanceInput.requestorMrMs)
                          ? clearanceInput.requestorMrMs
                          : ""
                      }
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select Requestor's Title</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                    </select>
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="gender" className="form-label-document-req">Requestor's Gender<span className="required">*</span></label>
                    <select 
                      id="gender" 
                      name="gender" 
                      className="form-input-document-req" 
                      required
                      disabled = {isReadOnly}
                      value={clearanceInput.gender}
                      onChange={handleChange}
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="dateOfResidency" className="form-label-document-req">Requestor's Date of Residency<span className="required">*</span></label>
                    <input 
                      type="date" 
                      id="dateOfResidency" 
                      name="dateOfResidency" 
                      value={clearanceInput.dateOfResidency}
                      onChange={handleChange}
                      className="form-input-document-req" 
                      onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                      disabled={isReadOnly}
                      required 
                      max={getLocalDateString(new Date())}
                    />
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="address" className="form-label-document-req">Requestor's Address<span className="required">*</span></label>
                    <input 
                      type="text"  
                      id="address"  
                      name="address"  
                      value={clearanceInput.address}
                      onChange={handleChange}
                      className="form-input-document-req"  
                      required 
                      placeholder={`Enter Requestor's Address`}
                      disabled={isReadOnly}

                    />
                  </div>

                  {(clearanceInput.purpose === "Residency" && clearanceInput.docType === "Barangay Certificate") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="CYFrom" className="form-label-document-req">Cohabitation Year From:<span className="required">*</span></label>
                        <select
                          id="CYFrom"
                          name="CYFrom"
                          value={clearanceInput.CYFrom}
                          onChange={handleChange}
                          className="form-input-document-req"
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

                    </>
                  )}

                  {(clearanceInput.purpose === "Residency" && clearanceInput.docType === "Barangay Clearance") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="CYFrom" className="form-label-document-req">Cohabitation Year From:<span className="required">*</span></label>
                        <select
                          id="CYFrom"
                          name="CYFrom"
                          value={clearanceInput.CYFrom}
                          onChange={handleChange}
                          className="form-input-document-req"
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

                    </>
                  )}


                  {(clearanceInput.purpose === "Occupancy /  Moving Out" || clearanceInput.purpose === "Estate Tax" || clearanceInput.purpose === "Death Residency" 
                    || clearanceInput.purpose === "Guardianship"
                  ) && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="fullName" className="form-label-document-req">{addOn}Full Name<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="fullName"  
                          name="fullName"  
                          className="form-input-document-req"  
                          required  
                          placeholder="Enter Full Name" 
                          value={clearanceInput.fullName}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}

                  {((clearanceInput.purpose === "No Income" && clearanceInput.docType === "Barangay Certificate") || (clearanceInput.purpose === "Financial Subsidy of Solo Parent" && clearanceInput.docType === "Barangay Indigency")) && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="noIncomeChildFName" className="form-label-document-req">Son/Daughter's Name<span className="required">*</span></label>
                          <input 
                            type="text"  
                            id="noIncomeChildFName"  
                            name="noIncomeChildFName"  
                            value={clearanceInput.noIncomeChildFName}
                            onChange={handleChange}
                            className="form-input-document-req"  
                            required 
                            placeholder={`Enter Child's Full Name`}
                          />
                      </div>
                    </>
                  )}

                  {(docType === "Barangay Certificate" && clearanceInput.purpose === "Cohabitation") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="partnerWifeHusbandFullName" className="form-label-document-req">Partner's/Wife's/Husband's Full Name<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="partnerWifeHusbandFullName"  
                          name="partnerWifeHusbandFullName"  
                          className="form-input-document-req"  
                          required  
                          placeholder="Enter Full Name" 
                          value={clearanceInput.partnerWifeHusbandFullName}
                          onChange={handleChange}
                        />
                      </div>      
                    </>
                  )}

                  {clearanceInput.purpose === "Guardianship" && (
                    <>
                      <div className="form-group-document-req">
                      <label htmlFor="wardFname" className="form-label-document-req">Ward's Full Name<span className="required">*</span></label>
                          <input 
                            type="text"  
                            id="wardFname"  
                            name="wardFname"  
                            value={clearanceInput.wardFname}
                            onChange={handleChange}
                            className="form-input-document-req"  
                            required 
                            placeholder={`Enter Ward's Full Name`}
                          />
                      </div>

                    </>
                  )}

                  {clearanceInput.purpose === "Garage/PUV" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleType" className="form-label-document-req">Vehicle Description<span className="required">*</span></label>
                        <input 
                          type="text"
                          id="vehicleType"  
                          name="vehicleType"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleType}
                          onChange={handleChange}   
                          placeholder="Enter Vehicle Description (e.g. Toyota Corolla 2020, Silver)"
                        />
                      </div>
                    </>
                  )}

                  {clearanceInput.purpose === "Garage/TRU" && (
                    <>  
                      <div className="form-group-document-req">
                        <label htmlFor="businessname" className="form-label-document-req">Business Name<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="businessname"  
                          name="businessName"  
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter Business Name"  
                          value={clearanceInput.businessName}
                          onChange={handleChange}
                        />
                      </div>   

                      <div className="form-group-document-req">
                        <label htmlFor="businessnature" className="form-label-document-req">Nature of Business<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="businessnature"  
                          name="businessNature"  
                          value={clearanceInput.businessNature}
                          onChange={handleChange}
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter Business Nature"  
                        />
                      </div>      

                      <div className="form-group-document-req">
                        <label htmlFor="businessloc" className="form-label-document-req">Business Location<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="businessloc"  
                          name="businessLocation"  
                          className="form-input-document-req"  
                          value={clearanceInput.businessLocation}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Business Location"  
                        />
                      </div>
                      <div className="form-group-document-req">
                        <label htmlFor="noOfVehicles" className="form-label-document-req">Nos of Tricycle<span className="required">*</span></label>
                        <input 
                          type="number"  
                          id="noOfVehicles"  
                          name="noOfVehicles"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.noOfVehicles}
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
                      
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleMake" className="form-label-document-req">Tricycle Make<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="vehicleMake"  
                          name="vehicleMake"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleMake}
                          onChange={handleChange}
                          placeholder="Enter Tricycle Make (e.g. Honda, Yamaha)"  
                        />
                      </div>
                    </>
                  )}

                  {clearanceInput.purpose === "Fire Victims" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="dateOfFireIncident" className="form-label-document-req">Date of Fire Incident<span className="required">*</span></label>
                        <input 
                          type="date" 
                          className="form-input-document-req" 
                          id="dateOfFireIncident"
                          name="dateOfFireIncident"
                          value={clearanceInput?.dateOfFireIncident || ""}
                          onChange={handleChange}
                          required
                          min={toPHISOString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).split("T")[0]} // 30 days before today
                          max={toPHISOString(new Date()).split("T")[0]} // today
                          onKeyDown={(e) => e.preventDefault()}  
                        />    
                      </div>            
                    </>
                  )}

                  {clearanceInput.purpose === "Flood Victims" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="nameOfTyphoon" className="form-label-document-req">Name of Typhoon<span className="required">*</span></label>
                        <input 
                          type="text" 
                          className="form-input-document-req" 
                          id="nameOfTyphoon"
                          name="nameOfTyphoon"
                          value={clearanceInput?.nameOfTyphoon || ""}
                          onChange={handleChange}
                          required
                          placeholder="Enter Typhoon Name"
                        />    
                      </div> 
                      <div className="form-group-document-req">
                        <label htmlFor="typhoonSignal" className="form-label-document-req">Typhoon Signal<span className="required">*</span></label>
                        <select 
                          className="form-input-document-req" 
                          id="typhoonSignal"
                          name="typhoonSignal"
                          value={clearanceInput?.typhoonSignal || ""}
                          onChange={handleChange}
                          required
                        >    
                          <option value="" disabled>Select Typhoon Signal</option>
                          <option value="1">Signal 1</option>
                          <option value="2">Signal 2</option>
                          <option value="3">Signal 3</option>
                          <option value="4">Signal 4</option>
                          <option value="5">Signal 5</option>
                        </select>
                      </div>           
                    </>
                  )}

                  {/* Display Added Fields from New Docs*/}
                  {leftFields.map((fieldName) => (
                    <div className="form-group-document-req" key={fieldName}>
                      <label htmlFor={fieldName} className="form-label-document-req">
                        {formatFieldName(fieldName)}<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id={fieldName}
                        name={fieldName}
                        value={
                          typeof clearanceInput[fieldName] === "string" ||
                          typeof clearanceInput[fieldName] === "number"
                            ? clearanceInput[fieldName]
                            : ""
                        }
                        onChange={handleChange}
                        className="form-input-document-req"
                        required
                        placeholder={`Enter ${formatFieldName(fieldName)}`}
                      />
                    </div>
                  ))}

                  { (clearanceInput.docType === "Business Permit" || clearanceInput.docType === "Temporary Business Permit") && (
                    <>  
                      <div className="form-group-document-req">
                        <label htmlFor="businessname" className="form-label-document-req">Business Name<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="businessname"  
                          name="businessName"  
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter Business Name"  
                          value={clearanceInput.businessName}
                          onChange={handleChange}
                        />
                      </div>            
                      <div className="form-group-document-req">
                        <label htmlFor="businessloc" className="form-label-document-req">Business Location<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="businessloc"  
                          name="businessLocation"  
                          className="form-input-document-req"  
                          value={clearanceInput.businessLocation}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Business Location"  
                        />
                      </div>
                    </>
                  )}

                  {docType === "Construction" && (
                    <>
                      <div className="form-group-document-req">
                        <label className="form-label-document-req">Type of Construction Activity<span className="required">*</span></label>
                          <select 
                            id="typeofconstruction" 
                            name="typeofconstruction" 
                            className="form-input-document-req" 
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

                      <div className="form-group-document-req">
                        <label htmlFor="buildingtype" className="form-label-document-req">
                          Type of Building<span className="required">*</span>
                        </label>
                        <select
                          id="buildingtype"
                          name="typeofbldg"
                          className="form-input-document-req"
                          value={clearanceInput.typeofbldg}
                          onChange={handleChange}
                          required
                        >
                          <option value="" disabled>Select Type of Building</option>
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Institutional">Institutional</option>
                          <option value="Industrial">Industrial</option>
                          <option value="Mixed-Use">Mixed-Use</option>
                          <option value="Others">Others</option>
                        </select>

                        {clearanceInput.typeofbldg === "Others" && (
                          <input
                            type="text"
                            id="othersTypeofbldg"
                            name="othersTypeofbldg"
                            className="fform-input-document-req"
                            placeholder="Enter Type of Building"
                            value={clearanceInput.othersTypeofbldg}
                            onChange={handleChange}
                            required
                          />
                        )}
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="homeOrOfficeAddress" className="form-label-document-req">Home / Office Address<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="homeOrOfficeAddress"  
                          name="homeOrOfficeAddress"  
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter Business Name"  
                          value={clearanceInput.homeOrOfficeAddress}
                          onChange={handleChange}
                        />
                      </div>       
                    </>
                  )}

                  {/*goherepls*/}
                  {clearanceInput.purpose ==="Barangay ID" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="birthplace" className="form-label-document-req">Birthplace<span className="required">*</span></label>
                        <input 
                          type="text" 
                          id="birthplace" 
                          name="birthplace" 
                          className="form-input-document-req" 
                          value={clearanceInput.birthplace}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Birthplace" 
                          readOnly={isReadOnly}
                        />
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="religion" className="form-label-document-req">Religion<span className="required">*</span></label>
                        <select
                          id="religion"
                          name="religion"
                          className="form-input-document-req"
                          value={
                            ["Roman Catholic", "Iglesia ni Cristo", "Muslim", "Christian", "Others"].includes(clearanceInput.religion)
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

                        {clearanceInput.religion === "Others" && (
                          <input
                            type="text"
                            name="religion"
                            placeholder="Please specify your religion"
                            className="form-input-document-reqs"
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

                      <div className="form-group-document-req">
                        <label htmlFor="nationality" className="form-label-document-req">Nationality<span className="required">*</span></label>
                        <select
                          id="nationality"
                          name="nationality"
                          className="form-input-document-req"
                          value={
                            ["Filipino", "Others"].includes(clearanceInput.nationality)
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
                            className="form-input-document-req"
                            value={
                              ["Filipino", "Others"].includes(clearanceInput.nationality)
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

                    
                    </>    
                  )}

                  {clearanceInput.purpose === "First Time Jobseeker" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="educationalAttainment" className="form-label-document-req">Educational Attainment<span className="required">*</span></label>
                        <select 
                          name="educationalAttainment" 
                          id="educationalAttainment"  
                          className="form-input-document-req" 
                          value={clearanceInput.educationalAttainment}
                          onChange={handleChange} 
                          required
                        >
                          <option value="" disabled>Choose educational attainment</option>
                          <option value="1">Elem Under Grad</option>
                          <option value="2">Elem Grad</option>
                          <option value="3">HS Grad</option>
                          <option value="4">HS Under Grad</option>
                          <option value="5">COL Grad</option>
                          <option value="6">COL Under Grad</option>
                          <option value="7">Educational</option>
                          <option value="8">Vocational</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                


                
                <div className="document-req-form-container-right-side">
                  {(clearanceInput.purpose === "No Income" && clearanceInput.docType === "Barangay Certificate")&& (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="noIncomePurpose" className="form-label-document-req">Purpose Of No Income:<span className="required">*</span></label>
                          <select 
                            id="noIncomePurpose"  
                            name="noIncomePurpose"  
                            value={clearanceInput.noIncomePurpose}
                            onChange={handleChange}
                            className="form-input-document-req"  
                            required 
                          >
                            <option value="" disabled>Select Purpose</option>
                            <option value="SPES Scholarship">SPES Scholarship</option>
                            <option value="ESC Voucher">DEPED Educational Services Contracting (ESC) Voucher</option>
                          </select>
                      </div>
                    </>
                  )}
                  {clearanceInput.purpose === "Guardianship" && (
                    <>
                      <div className="form-group-document-req">
                      <label htmlFor="guardianshipType" className="form-label-document-req">Type of Guardianship Certificate<span className="required">*</span></label>
                          <select
                            id="guardianshipType"  
                            name="guardianshipType"  
                            className="form-input-document-req"  
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
                      <div className="form-group-document-req">
                        <label htmlFor="goodMoralPurpose" className="form-label-document-req">Purpose of Good Moral and Probation:<span className="required">*</span></label>
                        <select
                          id="goodMoralPurpose"
                          name="goodMoralPurpose"
                          className="form-input-document-req"
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
                          <div className="form-group-document-req">
                            <label htmlFor="goodMoralOtherPurpose" className="form-label-document-req">Please Specify Other Purpose:<span className="required">*</span></label>
                            <input 
                              type="text"  
                              id="goodMoralOtherPurpose"  
                              name="goodMoralOtherPurpose"  
                              value={clearanceInput.goodMoralOtherPurpose}
                              onChange={handleChange}
                              className="form-input-document-req"  
                              required 
                              placeholder="Enter Other Purpose"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {clearanceInput.purpose === "Garage/PUV" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="goodMoralOtherPurpose" className="form-label-document-req">Certificate Purpose<span className="required">*</span></label>
                        <input 
                          type="text"
                          id="goodMoralOtherPurpose"  
                          name="goodMoralOtherPurpose"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.goodMoralOtherPurpose}
                          onChange={handleChange}
                          placeholder="Enter the purpose of the certificate (e.g., registration, inspection, insurance)"
                        />
                      </div>
                    </>
                  )}

                  {(docType === "Barangay Indigency" || (clearanceInput.purpose === "Residency" && docType === "Barangay Certificate")) && (
                    <>
                      <div className="form-group-document-req">
                        
                        <label htmlFor="appointmentDate" className="form-label-document-req">Set Interview Appointment<span className="required">*</span></label>
                        <DatePicker
                          selected={selectedDate}
                          name="appointmentDate"
                          id="appointmentDate"
                          onChange={(date: Date | null) => {
                            if (!date) return;

                            const selectedDateOnly = date.toDateString();

                            // If the user picked a new date (not just changing time)
                            if (selectedDateOnly !== lastSelectedDateOnly) {
                              setLastSelectedDateOnly(selectedDateOnly);
                            
                              // Check if day is fully booked
                              if (!filterDate(date)) {
                                alert("This day is fully booked. Please choose another date.");
                                return;
                              }
                            
                              // Auto-pick first available time on that date
                              for (let hour = 8; hour <= 16; hour++) {
                                for (let min of [0, 30]) {
                                  const slot = new Date(date);
                                  slot.setHours(hour, min, 0, 0);
                                  const key = toPHISOString(slot);
                                
                                  if ((appointmentsMap[key] || 0) < 3) {
                                    setSelectedDate(slot);
                                    setClearanceInput((prev: any) => ({
                                      ...prev,
                                      appointmentDate: toPHISOString(slot),
                                    }));
                                    return;
                                  }
                                }
                              }
                            
                              // Shouldn't reach here if filterDate worked correctly
                              alert("This day is unexpectedly full. Try a different date.");
                            } else {
                              // If just changing time, respect the selected time
                              const key = toPHISOString(date);
                              if ((appointmentsMap[key] || 0) >= 3) {
                                return;
                              }
                            
                              setSelectedDate(date);
                              setClearanceInput((prev: any) => ({
                                ...prev,
                                appointmentDate: toPHISOString(date),
                              }));
                            }
                          }}




                          showTimeSelect // 👈 this enables time selection
                          timeIntervals={30}
                          minDate={minDate} // Set minimum date to today
                          minTime={new Date(new Date().setHours(8, 0, 0, 0))}
                          maxTime={new Date(new Date().setHours(17, 0, 0, 0))}
                          placeholderText="Pick date and time"
                          dateFormat="MMMM d, yyyy h:mm aa"
                          className="form-input-document-req"
                          popperClassName="z-50"
                          filterDate={filterDate}
                          filterTime={filterTime}
                          onKeyDown={(e) => e.preventDefault()} 
                          disabled= {!selectedDate} // Disable if selectedDate is null or if form is read-only
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group-document-req">
                    <label htmlFor="contact" className="form-label-document-req">Requestor's Contact Number<span className="required">*</span></label>
                    <input 
                      type="tel"  
                      id="contact"  
                      name="contact"  
                      className="form-input-document-req" 
                      required 
                      value={clearanceInput.contact}
                      onChange={(e) => {
                        const input = e.target.value;
                        // Only allow digits and limit to 11 characters
                        if (/^\d{0,11}$/.test(input)) {
                          handleChange(e);
                        }
                      }}
                      maxLength={11}  
                      pattern="^[0-9]{11}$" 
                      placeholder="Please enter a valid 11-digit contact number" 
                      title="Please enter a valid 11-digit contact number. Format: 09XXXXXXXXX"
                    />
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="birthday" className="form-label-document-req">Requestor's Birthday<span className="required">*</span></label>
                    <input 
                      type="date" 
                      id="birthday" 
                      name="birthday" 
                      className="form-input-document-req" 
                      value={clearanceInput.birthday}
                      onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                      onChange={handleChange}
                      required 
                      max={getLocalDateString(new Date())}
                      readOnly={isReadOnly}

                    />
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="age" className="form-label-document-req">Requestor's Age<span className="required">*</span></label>
                    <input 
                      type="number"  // Ensures the input accepts only numbers
                      id="age"  
                      name="age"  
                      className="form-input-document-req" 
                      value={clearanceInput.age}
                      onChange={handleChange}
                      readOnly 
                      min="1"  
                      max="150"  
                      placeholder="Enter Age"  
                      step="1" 
                      disabled={true}
                    />
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="civilStatus" className="form-label-document-req">Requestor's Civil Status<span className="required">*</span></label>
                    <select 
                      id="civilStatus" 
                      name="civilStatus" 
                      className="form-input-document-req" 
                      required
                      value={clearanceInput.civilStatus}
                      onChange={handleChange}
                      disabled={isReadOnly}
                    >
                      <option value="" disabled>Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widow">Widow</option>
                      <option value="Separated">Separated</option>                
                    </select>
                  </div>

                  <div className="form-group-document-req">
                    <label htmlFor="citizenship" className="form-label-document-req">
                      Requestor's Citizenship<span className="required">*</span>
                    </label>
                    <select
                      id="citizenship"
                      name="citizenship"
                      className="form-input-document-req"
                      value={
                        ["Filipino", "Dual Citizen", "Naturalized", "Others"].includes(clearanceInput.citizenship.split("(")[0])
                          ? clearanceInput.citizenship.split("(")[0]
                          : ""
                      }
                      onChange={(e) => {
                        const selected = e.target.value;
                        setClearanceInput((prev: any) => ({
                          ...prev,
                          citizenship: selected
                        }));
                      }}
                      disabled = {isReadOnly}
                    >
                      <option value="" disabled>Select Citizenship</option>
                      <option value="Filipino">Filipino</option>
                      <option value="Dual Citizen">Dual Citizen</option>
                      <option value="Naturalized">Naturalized</option>
                      <option value="Others">Others</option>
                    </select>

                    {/* Input field for Dual Citizen */}
                    {clearanceInput.citizenship.startsWith("Dual Citizen") && (
                      <input
                        type="text"
                        className="form-input-document-req"
                        placeholder="Specify other citizenship (e.g. American)"
                        value={
                          clearanceInput.citizenship.includes("(")
                            ? clearanceInput.citizenship.slice(
                                clearanceInput.citizenship.indexOf("(") + 1,
                                clearanceInput.citizenship.indexOf(")")
                              )
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setClearanceInput((prev: any) => ({
                            ...prev,
                            citizenship: val ? `Dual Citizen(${val})` : "Dual Citizen"
                          }));
                        }}
                        required
                      />
                    )}

                    {/* Input field for Others */}
                    {clearanceInput.citizenship.startsWith("Others") && (
                      <input
                        type="text"
                        className="form-input-document-req"
                        placeholder="Please specify your citizenship"
                        value={
                          clearanceInput.citizenship.includes("(")
                            ? clearanceInput.citizenship.slice(
                                clearanceInput.citizenship.indexOf("(") + 1,
                                clearanceInput.citizenship.indexOf(")")
                              )
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setClearanceInput((prev: any) => ({
                            ...prev,
                            citizenship: val ? `Others(${val})` : "Others"
                          }));
                        }}
                        required
                      />
                    )}
                  </div>

                {/* 
                  {clearanceInput.purpose === "Residency" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="attestedBy" className="form-label-document-req">Attested By Hon Kagawad: <span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="attestedBy"  
                          name="attestedBy"  
                          value={clearanceInput.attestedBy}
                          onChange={handleChange}
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter Hon Kagawad's Full Name"  
                        />
                      </div>
                    </>
                  )} */}

                  {(clearanceInput.purpose === "No Income" && clearanceInput.docType === "Barangay Indigency") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="noIncomeChildFName" className="form-label-document-req">Son/Daughter's Name<span className="required">*</span></label>
                          <input 
                            type="text"  
                            id="noIncomeChildFName"  
                            name="noIncomeChildFName"  
                            value={clearanceInput.noIncomeChildFName}
                            onChange={handleChange}
                            className="form-input-document-req"  
                            required 
                            placeholder={`Enter Child's Full Name`}
                          />
                      </div>
                    </>
                  )}
                  

                  {clearanceInput.purpose === "Occupancy /  Moving Out" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="toAddress" className="form-label-document-req">To Address<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="toAddress"  
                          name="toAddress"  
                          value={clearanceInput.toAddress}
                          onChange={handleChange}
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter To Address"  
                        />
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="fromAddress" className="form-label-document-req">From Address<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="fromAddress"  
                          name="fromAddress"  
                          value={clearanceInput.fromAddress}
                          onChange={handleChange}
                          className="form-input-document-req"  
                          required 
                          placeholder="Enter From Address"  
                        />
                      </div>
                    </>
                  )}

                  {clearanceInput.purpose === "Estate Tax" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="estateSince" className="form-label-document-req">Estate Since:<span className="required">*</span></label>
                        <select
                          id="estateSince"
                          name="estateSince"
                          value={clearanceInput.estateSince}
                          onChange={handleChange}
                          className="form-input-document-req"
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

                  {(clearanceInput.purpose === "Death Residency"|| clearanceInput.purpose === "Estate Tax") && (
                    <div className="form-group-document-req">
                      <label htmlFor="dateofdeath" className="form-label-document-req">Date of Death<span className="required">*</span></label>
                      <input 
                        type="date" 
                        id="dateofdeath" 
                        name="dateofdeath" 
                        className="form-input" 
                        value={clearanceInput.dateofdeath}
                        onKeyDown={(e) => e.preventDefault()} // Prevent manual input

                        onChange={handleChange}
                        required 
                        max={getLocalDateString(new Date())} // Set max date to today
                      />
                    </div>
                  )}

                  {(clearanceInput.purpose === "Residency" && clearanceInput.docType === "Barangay Certificate") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="CYTo" className="form-label-document-req">Cohabitation Year To:<span className="required">*</span></label>
                        <select
                          id="CYTo"
                          name="CYTo"
                          value={clearanceInput.CYTo}
                          onChange={handleChange}
                          className="form-input-document-req"
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

                  {(clearanceInput.purpose === "Residency" && clearanceInput.docType === "Barangay Clearance") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="CYTo" className="form-label-document-req">Cohabitation Year To:<span className="required">*</span></label>
                        <select
                          id="CYTo"
                          name="CYTo"
                          value={clearanceInput.CYTo}
                          onChange={handleChange}
                          className="form-input-document-req"
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

                  {(docType === "Barangay Certificate" && clearanceInput.purpose === "Cohabitation") && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="cohabitationStartDate" className="form-label-document-req">
                          Start Of Cohabitation<span className="required">*</span>
                        </label>
                        <input 
                          type = "date" 
                          id="cohabitationStartDate"
                          name="cohabitationStartDate"
                          className="form-input-document-req"
                          value={clearanceInput.cohabitationStartDate}
                          onChange={handleChange}
                          onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                          required
                          max = {getLocalDateString(new Date())} // Set max date to today
                          />
                      </div>
                      <div className="form-group-document-req">
                        <label htmlFor="cohabitationRelationship" className="form-label-document-req">
                          Type Of Relationship<span className="required">*</span>
                        </label>
                        <select
                          id="cohabitationRelationship"
                          name="cohabitationRelationship"
                          className="form-input-document-req"
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
                      <div className="form-group-document-req">
                      <label htmlFor="wardRelationship" className="form-label-document-req">Guardian's Relationship Towards the Ward<span className="required">*</span></label>
                          <select
                            id="wardRelationship"  
                            name="wardRelationship"  
                            className="form-input-document-req"  
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
                      <div className="form-group-document-req">
                        <label htmlFor="noOfVechicles" className="form-label-document-req">No. of Vehicle/s<span className="required">*</span></label>
                        <input 
                          type="number"  
                          id="noOfVehicles"  
                          name="noOfVehicles"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.noOfVehicles}
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

                  {clearanceInput.purpose === "Flood Victims" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="dateOfTyphoon" className="form-label-document-req">Date of Typhoon<span className="required">*</span></label>
                        <input 
                          type="date" 
                          className="form-input-document-req" 
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

                  {clearanceInput.purpose === "Garage/TRU" && (
                    <>  
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleType" className="form-label-document-req">Tricycle Type<span className="required">*</span></label>
                        <select
                          id="vehicleType"  
                          name="vehicleType"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleType}
                          onChange={handleChange}
                          
                        >
                          <option value="" disabled>Select Tricycle Type</option>
                          <option value="Motorcycle w/ Sidecar">Motorcycle w/ Sidecar</option>
                          <option value="Motorcycle w/o Sidecar">Motorcycle w/o Sidecar</option>
                        </select>
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="vehiclePlateNo" className="form-label-document-req">Tricycle Plate No.<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="vehiclePlateNo"  
                          name="vehiclePlateNo"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehiclePlateNo}
                          onChange={handleChange}
                          placeholder="Enter Tricycle Plate No. (e.g. 1234 AB)"  
                        />
                      </div>
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleSerialNo" className="form-label-document-req">Tricycle Serial No.<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="vehicleSerialNo"  
                          name="vehicleSerialNo"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleSerialNo}
                          onChange={handleChange}
                          placeholder="Enter Tricycle Serial No. (e.g. TSN123456789)"  
                        />
                      </div>
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleChassisNo" className="form-label-document-req">Tricycle Chassis No.<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="vehicleChassisNo"  
                          name="vehicleChassisNo"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleChassisNo}
                          onChange={handleChange}
                          placeholder="Enter Tricycle Chassis No. (e.g. CHS98765432)"  
                        />
                      </div>
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleEngineNo" className="form-label-document-req">Tricycle Engine No.<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="vehicleEngineNo"  
                          name="vehicleEngineNo"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleEngineNo}
                          onChange={handleChange}
                          placeholder="Enter Tricycle Engine No. (e.g. ENG654321789)"  
                        />
                      </div>
                      <div className="form-group-document-req">
                        <label htmlFor="vehicleFileNo" className="form-label-document-req">Tricycle File No.<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="vehicleFileNo"  
                          name="vehicleFileNo"  
                          className="form-input-document-req"  
                          required 
                          value={clearanceInput.vehicleFileNo}
                          onChange={handleChange}
                          placeholder="Enter Tricycle File No. (e.g. 2023-TRU-001234)"  
                        />
                      </div>
                      
                    </>
                  )}

                  {/* Display Added Fields from New Docs*/}
                  {rightFields.map((fieldName) => (
                    <div className="form-group-document-req" key={fieldName}>
                      <label htmlFor={fieldName} className="form-label-document-req">
                        {formatFieldName(fieldName)}<span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id={fieldName}
                        name={fieldName}
                        value={
                          typeof clearanceInput[fieldName] === "string" ||
                          typeof clearanceInput[fieldName] === "number"
                            ? clearanceInput[fieldName]
                            : ""
                        }
                        onChange={handleChange}
                        className="form-input-document-req"
                        required
                        placeholder={`Enter ${formatFieldName(fieldName)}`}
                      />
                    </div>
                  ))}

                  {(clearanceInput.docType === "Business Permit" || clearanceInput.docType === "Temporary Business Permit") && (
                    <>  
                      <div className="form-group-document-req">
                        <label htmlFor="businessNature" className="form-label-document-req">Business Nature<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="businessNature"  
                          name="businessNature"  
                          className="form-input-document-req"  
                          required 
                          placeholder= "Describe the nature of your business (e.g., retail, manufacturing, services)"
                          value={clearanceInput.businessNature}
                          onChange={handleChange}
                        />
                      </div>            
                      <div className="form-group-document-req">
                        <label htmlFor="estimatedCapital" className="form-label-document-req">Estimated Capital<span className="required">*</span></label>
                        <input 
                          type="number"  
                          id="estimatedCapital"  
                          name="estimatedCapital"  
                          className="form-input-document-req"  
                          value={clearanceInput.estimatedCapital}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Estimated Capital"  
                        />
                      </div>
                    </>
                  )}

                  {docType === "Construction"  && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="projectName" className="form-label-document-req">Project Name<span className="required">*</span></label>
                        <input 
                          value ={clearanceInput?.projectName || ""}
                          onChange={handleChange} 
                          required
                          type="text" 
                          id="projectName"
                          name="projectName"
                          className="form-input-document-req" 
                          placeholder="Enter Project Name" 
                        />
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="projectLocation" className="form-label-document-req">Project Location<span className="required">*</span></label>
                        <input 
                          value ={clearanceInput?.projectLocation || ""}
                          onChange={handleChange} 
                          required
                          type="text" 
                          id="projectLocation"
                          name="projectLocation"
                          className="form-input-document-req" 
                          placeholder="Enter Project Location" 
                        />
                      </div>
                    </>
                  )}

                  {clearanceInput.purpose ==="Barangay ID" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="occupation" className="form-label-document-req">Occupation<span className="required">*</span></label>
                        <input 
                          type="text" 
                          id="occupation" 
                          name="occupation" 
                          className="form-input-document-req" 
                          value={clearanceInput.occupation}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Occupation"
                          disabled={isReadOnly}
                           
                        />
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="bloodtype" className="form-label-document-req">Blood Type<span className="required">*</span></label>
                        <select
                          id="bloodtype"
                          name="bloodtype"
                          className="form-input-document-req"
                          value={
                            ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Others"].includes(clearanceInput.bloodtype)
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
                            className="form-input-document-req"
                            value={
                              ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Others"].includes(clearanceInput.bloodtype)
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

                      <div className="form-group-document-req">
                        <label htmlFor="height" className="form-label-document-req">Height<span className="required">*</span></label>
                        <input 
                          type="text" 
                          id="height" 
                          name="height" 
                          className="form-input-document-req" 
                          value={clearanceInput.height}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Height (e.g. 170 cm)" 
                        />
                      </div>

                      <div className="form-group-document-req">
                        <label htmlFor="weight" className="form-label-document-req">Weight<span className="required">*</span></label>
                        <input 
                          type="text" 
                          id="weight" 
                          name="weight" 
                          value={clearanceInput.weight}
                          onChange={handleChange}
                          className="form-input-document-req" 
                          required 
                          placeholder="Enter Weight (e.g. 65 kg)" 
                        />
                      </div>
                    </>
                  )}

                  {clearanceInput.purpose === "First Time Jobseeker" && (
                    <>
                      <div className="form-group-document-req">
                        <label htmlFor="course" className="form-label-document-req">Course<span className="required">*</span></label>
                        <input 
                          type="text"  
                          id="course"  
                          name="course"  
                          className="form-input-document-req"  
                          value={clearanceInput.course}
                          onChange={handleChange}
                          required 
                          placeholder="Enter Course"  
                        />
                      </div>

                      <div className="form-group-document-req-checkbox">
                        <input 
                          type="checkbox"  
                          id="isBeneficiary"  
                          name="isBeneficiary"  
                          checked={clearanceInput.isBeneficiary || false}
                          onChange={handleChange}
                          required 
                        />
                        <label htmlFor="isBeneficiary" className="form-label-document-req">Is beneficiary of a JobStart Program under RA No. 10869?<span className="required">*</span></label>
                      </div>

                    </>
                  )}
                </div>

              </div>
            </>
          )}

          {activeSection === "emergency" && (
            <>
              <div className="document-req-form-container">
                <div className="document-req-form-container-left-side">
                  <div className="form-group-document-req">
                    <label htmlFor="fullName" className="form-label-document-req">Emergency Contact Full Name<span className="required">*</span></label>
                    <input 
                      type="text"  
                      id="fullName"  
                      name="emergencyDetails.fullName"  
                      className="form-input-document-req"  
                      required  
                      placeholder="Enter Full Name" 
                      value={clearanceInput.emergencyDetails.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group-document-req">
                    <label htmlFor="address" className="form-label-document-req">Emergency Contact Address<span className="required">*</span></label>
                    <input 
                      type="text"  
                      id="address"  
                      name="emergencyDetails.address"  
                      className="form-input-document-req"  
                      required  
                      placeholder="Enter Full Name" 
                      value={clearanceInput.emergencyDetails.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="document-req-form-container-right-side">
                  <div className="form-group-document-req">
                    <label htmlFor="contactnumber" className="form-label-document-req">Contact Number<span className="required">*</span></label>
                    <input 
                      type="tel"  
                      id="emergencyDetails.contactNumber"  
                      value={clearanceInput.emergencyDetails.contactNumber}
                      onChange={(e) => {
                        const input = e.target.value;
                        // Only allow digits and limit to 11 characters
                        if (/^\d{0,11}$/.test(input)) {
                          handleChange(e);
                        }
                      }}
                      name="emergencyDetails.contactNumber"  
                      className="form-input-document-req" 
                      required
                      maxLength={11}  
                      pattern="^[0-9]{11}$" 
                      placeholder="Please enter a valid 11-digit contact number"
                      title="Please enter a valid 11-digit contact number. Format: 0917XXXXXXX"
                    />
                  </div>
                  <div className="form-group-document-req">
                    <label htmlFor="relationship" className="form-label-document-req">Relationship<span className="required">*</span></label>
                    <select
                      id="relationship"
                      name="emergencyDetails.relationship"
                      className="form-input-document-req"
                      value={
                        ["Father", "Mother", "Brother", "Sister", "Legal Guardian"].includes(clearanceInput.emergencyDetails.relationship)
                          ? clearanceInput.emergencyDetails.relationship
                          : clearanceInput.emergencyDetails.relationship === "Others"
                            ? "Others"
                            : ""
                      }
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Relationship</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="Others">Others</option>
                    </select>

                    {clearanceInput.emergencyDetails.relationship === "Others" && (
                      <input
                        type="text"
                        name="emergencyDetails.relationship"
                        placeholder="Please specify the relationship"
                        className="form-input-document-req"
                        value={
                          ["Father", "Mother", "Brother", "Sister", "Legal Guardian", "Others"].includes(clearanceInput.emergencyDetails.relationship)
                            ? ""
                            : clearanceInput.emergencyDetails.relationship
                        }
                        onChange={handleChange}
                        required
                      />
                    )}
                  </div>
                </div>
              </div> 
            </>
          )}

          {activeSection === "others" && (
            <>
              <div className="document-req-form-container-requirements">

                <div className="required-documents-container">
                  <label className="form-label-required-documents"> Upload Signature Over Printed Name<span className="required">*</span></label>

                  <div className="file-upload-container-required-documents">
                    <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                      <input
                        id="file-upload1"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        name="signaturejpg"
                        //required = {docType === "Temporary Business Permit" || docType === "Business Permit" || docType === "Construction"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleFileChange(e, setFiles, 'signaturejpg');
                        }} 
                        
                        style={{ display: "none" }}
                      />
                      
                    <div className="uploadedFiles-container">
                      {/* Display the file names with image previews */}
                      {files.length > 0 && (
                        <div className="file-name-image-display">
                          <ul>
                            {files.map((file, index) => (
                              <div className="file-name-image-display-indiv" key={index}>
                                <li> 
                                    {/* Display the image preview */}
                                    {file.preview && (
                                      <div className="filename&image-container">
                                        <img
                                          src={file.preview}
                                          alt={file.name}
                                          style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                        />
                                      </div>
                                      )}
                                    {file.name}  
                                  <div className="delete-container">
                                    {/* Delete button with image */}
                                    <button
                                        type="button"
                                        onClick={() => handleFileDelete('signaturejpg','file-upload1', setFiles, setClearanceInput)}
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

                {(clearanceInput.purpose === "Death Residency" || clearanceInput.purpose === "Estate Tax")&& (
                  <>
                    <div className="required-documents-container">
                    <label className="form-label-required-documents"> Death Certificate<span className="required">*</span></label>
                      <div className="file-upload-container-required-documents">
                        <label htmlFor="file-upload8"  className="upload-link">Click to Upload File</label>
                          <input
                            id="file-upload8"
                            type="file"
                            //required
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileChange(e, setFiles10, 'deathCertificate');
                            }}
                            accept=".jpg,.jpeg,.png"
                            style={{ display: "none" }}
                          />
                        <div className="uploadedFiles-container">
                          {/* Display the file names with image previews */}
                          {files10.length > 0 && (
                            <div className="file-name-image-display">
                              <ul>
                                {files10.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li> 
                                        {/* Display the image preview */}
                                        {file.preview && (
                                          <div className="filename&image-container">
                                            <img
                                              src={file.preview}
                                              alt={file.name}
                                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                          </div>
                                          )}
                                        {file.name}  
                                      <div className="delete-container">
                                        {/* Delete button with image */}
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete('deathCertificate','file-upload10',setFiles10,setClearanceInput)}
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
                  </>
                )}

                {/* Dynamically Render Extra Image Upload Fields */}
                {dynamicImageFields.map((fieldName) => (
                  <div className="required-documents-container" key={fieldName}>
                    <label className="form-label-required-documents">
                      {typeof fieldName === "string"
                        ? formatFieldName(fieldName.replace(/jpg$/, "").trim())
                        : ""}
                      <span className="required">*</span>
                    </label>

                    <div className="file-upload-container-required-documents">
                      <label htmlFor={`file-upload-${fieldName}`} className="upload-link">Click to Upload File</label>

                      <input
                        id={`file-upload-${fieldName}`}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        name={fieldName}
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDynamicImageUpload(fieldName, file);
                          e.target.value = ""; // reset input
                        }}
                      />

                      {/* Show Preview if Files Exist */}
                      {dynamicFileStates[fieldName] && dynamicFileStates[fieldName].length > 0 && (
                        <div className="file-name-image-display">
                          <ul>
                            {dynamicFileStates[fieldName].map((file, index) => (
                              <div className="file-name-image-display-indiv" key={index}>
                                <li className="file-item">
                                  {file.preview && (
                                    <div className="filename-image-container">
                                      <img
                                        src={file.preview}
                                        alt={file.name}
                                        className="file-preview"
                                        style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                      />
                                    </div>
                                  )}
                                  <div className="file-name-truncated">{file.name}</div>

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
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}




                {(//docType !=="Temporary Business Permit" && docType !=="Business Permit" && docType !=="Construction" && clearanceInput.purpose !=="Barangay ID"
                  docType ==="Barangay Certificate" || docType ==="Barangay Indigency" || docType ==="Barangay Clearance" || clearanceInput.purpose ==="First Time Jobseeker"
                ) && (
                  <>
                    <label className="form-label-required-documents-uploadany"> Upload any of the following requirements<span className="required">*</span></label>
                  </>
                )}

                {(//docType !=="Temporary Business Permit" && docType !=="Business Permit" && docType !== "Construction" && clearanceInput.purpose !=="Barangay ID"
                  docType ==="Barangay Certificate" || docType ==="Barangay Indigency" || docType ==="Barangay Clearance" || clearanceInput.purpose ==="First Time Jobseeker"
                ) &&(
                  <>
                    <div className="required-documents-container">
                      <label className="form-label-required-documents"> Barangay ID</label>

                      <div className="file-upload-container-required-documents">
                        <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                        <input
                            id="file-upload2"
                            name="barangayIDjpg"
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            //required={docType === "Temporary Business Permit" || docType === "Business Permit"}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileChange(e, setFiles2, 'barangayIDjpg');
                            }}
                            style={{ display: "none" }}
                        />

                        <div className="uploadedFiles-container">
                          {/* Display the file names with image previews */}
                          {files2.length > 0 && (
                            <div className="file-name-image-display">
                              <ul>
                                {files2.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li> 
                                        {/* Display the image preview */}
                                        {file.preview && (
                                          <div className="filename&image-container">
                                            <img
                                              src={file.preview}
                                              alt={file.name}
                                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                          </div>
                                          )}
                                        {file.name}  
                                      <div className="delete-container">
                                        {/* Delete button with image */}
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete('barangayIDjpg','file-upload2', setFiles2,setClearanceInput)}
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
                  </>
                )}

                
                    <div className="required-documents-container">
                      {(//docType ==="Temporary Business Permit" || docType ==="Business Permit" || docType === "Construction"
                        docType !=="Barangay Certificate" && docType !=="Barangay Clearance" && docType !== "Barangay Indigency" && clearanceInput.purpose !=="Barangay ID" && clearanceInput.purpose !=="First Time Jobseeker"
                      ) &&(
                        <>
                          <label className="form-label-required-documents"> Valid ID<span className="required">*</span></label>
                        </>
                      )}

                      
                      {(clearanceInput.purpose ==="Barangay ID") &&(
                        <>
                          <label className="form-label-required-documents"> Valid ID with an  address in Barangay Fairvirew<span className="required">*</span></label>
                          <label className="form-sub-label-required-documents"> (for residents with no Barangay ID)</label>
                        </>
                      )}
                      {(docType ==="Barangay Certificate" || docType ==="Barangay Clearance" || docType === "Barangay Indigency" || clearanceInput.purpose ==="First Time Jobseeker"
                        
                      )
                      
                      &&(
                        <>
                          <label className="form-label-required-documents"> Valid ID with an  address in Barangay Fairvirew</label>
                          <label className="form-sub-label-required-documents"> (for residents with no Barangay ID)</label>
                        </>
                      )}
                    
                      <div className="file-upload-container-required-documents">
                        {/* Only show upload button if no uploaded file exists */}
                        {!userData?.upload && (
                          <>
                            <label htmlFor="file-upload3" className="upload-link">Click to Upload File</label>
                            <input
                              id="file-upload3"
                              name="validIDjpg"
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              //required={(docType === "Temporary Business Permit" || docType === "Business Permit")}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                handleFileChange(e, setFiles3, 'validIDjpg');
                              }}
                              style={{ display: "none" }}
                            />
                          </>
                        )}

                        {/* Always show file preview if exists */}
                        {files3.length > 0 && (
                          <div className="file-name-image-display">
                            <ul>
                              {files3.map((file, index) => (
                                <div className="file-name-image-display-indiv" key={index}>
                                  <li>
                                    <div className="filename-image-container">
                                      <img
                                        src={file.preview}
                                        alt={file.name}
                                        style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                      />
                                    </div>
                                    <div className="file-name-truncated">{file.name}</div>
                                    {!userData?.upload && (
                                      <div className="delete-container">
                                        <button
                                          type="button"
                                          onClick={() => handleFileDelete('validIDjpg','file-upload3', setFiles3,setClearanceInput)}
                                          className="delete-button"
                                        >
                                          <img
                                            src="/images/trash.png"
                                            alt="Delete"
                                            className="delete-icon"
                                          />
                                        </button>
                                      </div>
                                    )}
                                  </li>
                                </div>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                   

                {(//docType !== "Construction" && docType !== "Temporary Business Permit" && docType !== "Business Permit" && clearanceInput.purpose !== "Barangay ID"
                  docType ==="Barangay Certificate" || docType ==="Barangay Indigency" || docType ==="Barangay Clearance" || clearanceInput.purpose ==="First Time Jobseeker"
                ) && (
                  <>
                    <div className="required-documents-container">
                    <label className="form-label-required-documents"> Endorsement Letter from Homeowner/Sitio President</label>
                    <label className="form-sub-label-required-documents"> (for residents of Barangay Fairview for less than 6 months)</label>

                    <div className="file-upload-container-required-documents">
                      <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                        <input
                          id="file-upload4"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          name="letterjpg"
                          //required={(docType === "Temporary Business Permit" || docType === "Business Permit"|| docType === "Construction")}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            handleFileChange(e,setFiles4, 'letterjpg');
                          
                          }} // Handle file selection

                          style={{ display: "none" }}
                        />

                      <div className="uploadedFiles-container">
                        {/* Display the file names with image previews */}
                        {files4.length > 0 && (
                          <div className="file-name-image-display">
                            <ul>
                              {files4.map((file, index) => (
                                <div className="file-name-image-display-indiv" key={index}>
                                  <li> 
                                      {/* Display the image preview */}
                                      {file.preview && (
                                        <div className="filename&image-container">
                                          <img
                                            src={file.preview}
                                            alt={file.name}
                                            style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                          />
                                        </div>
                                        )}
                                      {file.name}  
                                    <div className="delete-container">
                                      {/* Delete button with image */}
                                      <button
                                          type="button"
                                          onClick={() => handleFileDelete('letterjpg','file-upload4', setFiles4,setClearanceInput)}
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
                  </>
                  )}
                
                {(docType ==="Temporary Business Permit" || docType ==="Business Permit" || docType === "Construction") &&(
                  <>
                    <div className="required-documents-container">
                        <label className="form-label-required-documents">Certified True Copy of Title of the Property/Contract of Lease<span className="required">*</span></label>

                        <div className="file-upload-container-required-documents">
                          <label htmlFor="file-upload5"  className="upload-link">Click to Upload File</label>
                            <input
                              id="file-upload5"
                              type="file"
                              
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                handleFileChange(e, setFiles5, 'copyOfPropertyTitle');
                              }} 
                              accept=".jpg,.jpeg,.png"
                              style={{ display: "none" }}
                            />

                          <div className="uploadedFiles-container">
                            {/* Display the file names with image previews */}
                            {files5.length > 0 && (
                              <div className="file-name-image-display">
                                <ul>
                                  {files5.map((file, index) => (
                                    <div className="file-name-image-display-indiv" key={index}>
                                      <li> 
                                          {/* Display the image preview */}
                                          {file.preview && (
                                            <div className="filename&image-container">
                                              <img
                                                src={file.preview}
                                                alt={file.name}
                                                style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                              />
                                            </div>
                                            )}
                                          {file.name}  
                                        <div className="delete-container">
                                          {/* Delete button with image */}
                                          <button
                                              type="button"
                                              onClick={() => handleFileDelete('copyOfPropertyTitle','file-upload5', setFiles5, setClearanceInput)}
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
                  </>
                )}

                {(docType ==="Temporary Business Permit"||docType ==="Business Permit") &&(
                  <>
                    <div className="required-documents-container">
                      <label className="form-label-required-documents">Certified True Copy of DTI Registration<span className="required">*</span></label>

                      <div className="file-upload-container-required-documents">
                        <label htmlFor="file-upload6"  className="upload-link">Click to Upload File</label>
                          <input
                            id="file-upload6"
                            type="file"
                            //required={(docType === "Temporary Business Permit" || docType === "Business Permit")}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileChange(e, setFiles6, 'dtiRegistration');
                            }} 
                            accept=".jpg,.jpeg,.png"
                            style={{ display: "none" }}
                          />

                        <div className="uploadedFiles-container">
                          {/* Display the file names with image previews */}
                          {files6.length > 0 && (
                            <div className="file-name-image-display">
                              <ul>
                                {files6.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li> 
                                        {/* Display the image preview */}
                                        {file.preview && (
                                          <div className="filename&image-container">
                                            <img
                                              src={file.preview}
                                              alt={file.name}
                                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                          </div>
                                          )}
                                        {file.name}  
                                      <div className="delete-container">
                                        {/* Delete button with image */}
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete('dtiRegistration','file-upload6', setFiles6,setClearanceInput)}
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

                    <div className="required-documents-container">
                      <label className="form-label-required-documents">Picture of CCTV installed in the establishment<span className="required">*</span></label>
                      <label className="form-sub-label-required-documents">(for verification by Barangay Inspector)</label>

                      <div className="file-upload-container-required-documents">
                        <label htmlFor="file-upload7"  className="upload-link">Click to Upload File</label>
                          <input
                            id="file-upload7"
                            type="file"
                            //required={(docType === "Temporary Business Permit" || docType === "Business Permit" || docType === "Construction")}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileChange(e, setFiles7, 'isCCTV');
                            }} 
                            accept=".jpg,.jpeg,.png"
                            style={{ display: "none" }}
                          />

                        <div className="uploadedFiles-container">
                          {/* Display the file names with image previews */}
                          {files7.length > 0 && (
                            <div className="file-name-image-display">
                              <ul>
                                {files7.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li> 
                                        {/* Display the image preview */}
                                        {file.preview && (
                                          <div className="filename&image-container">
                                            <img
                                              src={file.preview}
                                              alt={file.name}
                                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                          </div>
                                          )}
                                        {file.name}  
                                      <div className="delete-container">
                                        {/* Delete button with image */}
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete('isCCTV','file-upload7', setFiles7,setClearanceInput)}
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
                  </>
                )}

                {docType === "Construction" && (
                  <>
                    <div className="required-documents-container">
                      <label className="form-label-required-documents"> Certified True Copy of Tax Declaration<span className="required">*</span></label>

                      <div className="file-upload-container-required-documents">
                        <label htmlFor="file-upload8"  className="upload-link">Click to Upload File</label>
                          <input
                            id="file-upload8"
                            type="file"
                            //required
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileChange(e, setFiles8, 'taxDeclaration');
                            }}
                            accept=".jpg,.jpeg,.png"
                            style={{ display: "none" }}
                          />

                        <div className="uploadedFiles-container">
                          {/* Display the file names with image previews */}
                          {files8.length > 0 && (
                            <div className="file-name-image-display">
                              <ul>
                                {files8.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li> 
                                        {/* Display the image preview */}
                                        {file.preview && (
                                          <div className="filename&image-container">
                                            <img
                                              src={file.preview}
                                              alt={file.name}
                                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                          </div>
                                          )}
                                        {file.name}  
                                      <div className="delete-container">
                                        {/* Delete button with image */}
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete('taxDeclaration','file-upload8',setFiles8, setClearanceInput)}
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

                    <div className="required-documents-container">
                      <label className="form-label-required-documents"> Approved Building/Construction Plan<span className="required">*</span></label>
              
                      <div className="file-upload-container-required-documents">
                        <label htmlFor="file-upload9"  className="upload-link">Click to Upload File</label>
                          <input
                            id="file-upload9"
                            type="file"
                           // required
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleFileChange(e, setFiles9, 'approvedBldgPlan');
                            }}
                            accept=".jpg,.jpeg,.png"
                            style={{ display: "none" }}
                          />

                        <div className="uploadedFiles-container">
                          {/* Display the file names with image previews */}
                          {files9.length > 0 && (
                            <div className="file-name-image-display">
                              <ul>
                                {files9.map((file, index) => (
                                  <div className="file-name-image-display-indiv" key={index}>
                                    <li> 
                                        {/* Display the image preview */}
                                        {file.preview && (
                                          <div className="filename&image-container">
                                            <img
                                              src={file.preview}
                                              alt={file.name}
                                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                          </div>
                                          )}
                                        {file.name}  
                                      <div className="delete-container">
                                        {/* Delete button with image */}
                                        <button
                                            type="button"
                                            onClick={() => handleFileDelete('approvedBldgPlan','file-upload9',setFiles9, setClearanceInput)}
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
                  </>
                )}

                

                {(docType === "Other Documents" && clearanceInput.purpose === "Barangay ID") && (
                  <div className="required-documents-container">
                    <label className="form-label-required-documents"> 2x2 ID picture</label>

                    <div className="file-upload-container-required-documents">
                      <label htmlFor="file-upload11"  className="upload-link">Click to Upload File</label>
                        <input
                          id="file-upload11"
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          name="twoByTwoPicture"
                          //required={(docType === "Temporary Business Permit" || docType === "Business Permit"|| docType === "Construction")}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            handleFileChange(e,setFiles11, 'twoByTwoPicture');
                          
                          }} // Handle file selection

                          style={{ display: "none" }}
                        />

                      <div className="uploadedFiles-container">
                        {/* Display the file names with image previews */}
                        {files11.length > 0 && (
                          <div className="file-name-image-display">
                            <ul>
                              {files11.map((file, index) => (
                                <div className="file-name-image-display-indiv" key={index}>
                                  <li> 
                                      {/* Display the image preview */}
                                      {file.preview && (
                                        <div className="filename&image-container">
                                          <img
                                            src={file.preview}
                                            alt={file.name}
                                            style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                          />
                                        </div>
                                        )}
                                      {file.name}  
                                    <div className="delete-container">
                                      {/* Delete button with image */}
                                      <button
                                          type="button"
                                          onClick={() => handleFileDelete('twoByTwoPicture','file-upload11', setFiles11,setClearanceInput)}
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
                )}


              </div>
            </>
          )}
          

          <button type="submit" className="submit-button-document-req">Submit</button>

        </form>
      </div>


      {showErrorPopup && (
                <div className="popup-overlay-services">
                    <div className="popup-services">
                        <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                        <p>{errorMessage}</p>
                        <button onClick={() => setShowErrorPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}

    </main>

    );
}      