"use client"
import { ChangeEvent, useEffect, useState } from "react";
import {useAuth} from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsform/requestdocumentsform.css";
import {useSearchParams } from "next/navigation";
import { addDoc, collection, doc, getDoc} from "firebase/firestore";
import { db, storage, auth } from "@/app/db/firebase";
import { ref, uploadBytes } from "firebase/storage";
import { useRouter } from "next/navigation";
import {getLocalDateString} from "@/app/helpers/helpers";
import {customAlphabet} from "nanoid";
import { getSpecificCountofCollection } from "@/app/helpers/firestorehelper";

interface EmergencyDetails {
  fullName: string;
  address: string;
  relationship: string;
  contactNumber: string;
}

interface ClearanceInput {
  [key: string]: string | number | File | boolean |null | EmergencyDetails | undefined;
  accountId: string;
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
  isCCTV: File | null;
  taxDeclaration: File | null;
  approvedBldgPlan: File | null;
  deathCertificate: File | null;
}



export default function Action() {
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const user = useAuth().user; 
  const searchParam = useSearchParams();
  const docType = searchParam.get("doc");
  const router = useRouter();
  const [nos, setNos] = useState(0);
  const [clearanceInput, setClearanceInput] =  useState<ClearanceInput>({
    accountId: user?.uid || "Guest",
    docType: docType || "" ,
    requestId: "",
    purpose: "",
    dateRequested: new Date().toLocaleString(),
    fullName: "",
    appointmentDate: "",
    dateOfResidency: "",
    dateofdeath: "",
    address: "",//will be also the home address
    toAddress: "",// will be also the home address
    businessLocation: "",// will be project location
    businessNature: "",
    noOfVechicles: "1",
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
    typeofbldg:"",
    othersTypeofbldg:"",
    projectName:"",
    citizenship: "",
    educationalAttainment: "",
    course: "",
    isBeneficiary: "",
    birthplace: "",
    religion: "",
    nationality: "",
    height: "",
    weight: "",
    bloodtype: "",  
    occupation:"",
    precinctnumber:"",
    emergencyDetails:{
      fullName: "",
      address: "",
      relationship: "",
      contactNumber: "",
    },
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
    attestedBy: "",
    goodMoralPurpose: "",
    goodMoralOtherPurpose: "",
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
  })



  useEffect(() => {
    if(user){;
      const fetchCount = async () => {
        try {
          const count = await getSpecificCountofCollection("ServiceRequests", "accID", user.uid);
          setNos(count || 1);
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
          setNos(count || 1);
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


 

  const [requestMode, setRequestMode] = useState("For Myself");
  const [userData, setUserData] = useState<any>(null);

  const isVerified = userData?.status === "Verified";
  const isReadOnly = requestMode === "For Myself" && isVerified;
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
  
      //  Force set requestMode to "For Someone Else" for Estate/Death
      if (isEstateOrDeath && requestMode !== "For Someone Else") {
        setRequestMode("For Someone Else");
        return; // Wait for re-run
      }
  
      //  For Verified ResidentUsers with a linked residentId
      if (isVerified && residentId) {
        const residentDocRef = doc(db, "Residents", residentId);
        const residentDocSnap = await getDoc(residentDocRef);
        if (!residentDocSnap.exists()) return;
  
        const residentData = residentDocSnap.data();
        const gender = residentData.sex;
        const mrms = gender === "Male" ? "Mr." : "Ms.";
        const fullName = `${residentData.firstName} ${residentData.middleName} ${residentData.lastName}`;
  
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
  
        if (requestMode === "For Someone Else") {
          //  Only set requestor fields
          setClearanceInput((prev: any) => ({
            ...prev,
            fullName: "",
            contact: "",
            address: "",
            gender: "",
            civilStatus: "",
            birthplace: "",
            birthday: "",
            age: "",
            precinctnumber: "",
            requestorFname: fullName,
            requestorMrMs: mrms,
          }));
        } else {
          //  Fill all fields for self
          setClearanceInput((prev: any) => ({
            ...prev,
            fullName,
            contact: residentData.contactNumber || "",
            address: residentData.address || "",
            gender: residentData.sex || "",
            civilStatus: residentData.civilStatus || "",
            birthplace: residentData.placeOfBirth || "",
            birthday: residentData.dateOfBirth || "",
            age: age.toString(),
            precinctnumber: residentData.precinctNumber || "",
            requestorFname: fullName,
            requestorMrMs: mrms,
          }));
        }
  
      } else {
        //  Fallback for Unverified accounts
        const gender = userData.sex;
        const mrms = gender === "male" ? "Mr." : "Ms.";
        const fullName = `${userData.first_name} ${userData.middle_name} ${userData.last_name}`;
  
        setClearanceInput((prev: any) => ({
          ...prev,
          fullName,
          contact: userData.phone || "",
          address: userData.address || "",
          gender: userData.sex || "",
          requestorFname: fullName,
          requestorMrMs: mrms,
        }));
      }
    };
  
    fetchUserData();
  }, [user, clearanceInput.purpose, requestMode, clearanceInput.dateofdeath]);
  
  

  
  
  
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
// const minDate = new Date().toISOString().split("T")[0]; 

const [minDate, setMinDate] = useState<string>("");
useEffect(() => {
  if (user) {
    setClearanceInput((prev: any) => ({
      ...prev,
      accountId: user.uid, // Ensure the latest value is set
    }));
  }
}, [user]); // Runs when `user` changes

useEffect(() => {
 
  const tomorrow = getLocalDateString(new Date());
  const tomorrowDate = new Date(tomorrow);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1); // Add one day to the current date
  setMinDate(getLocalDateString(tomorrowDate)); // Set the minimum date to tomorrow
},[])


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
  const handleFileDelete = (fileName: string, setFile: React.Dispatch<React.SetStateAction<{ name: string, preview: string | undefined }[]>>) => {
    setFile([]); // Reset the file list state
  
    const fileInput = document.getElementById(fileName) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Clear the file input field
    }
  };
  
 const handleReportUpload = async (key: any, storageRefs: Record<string, any>) => {
  try {
    const docRef = collection(db, "ServiceRequests"); // Reference to the collection
    const updates = { ...key };  // No filtering, just spread the object

    // Upload files to Firebase Storage if there are any
     for (const [key, storageRef] of Object.entries(storageRefs)) {
          const file = clearanceInput[key];
          if (file instanceof File && storageRef) {
            // Upload each file to storage
            await uploadBytes(storageRef, file);
            console.log(`${key} uploaded successfully`);
          }
        }

    // Upload the report to Firestore
    const newDoc = await addDoc(docRef, updates);
    console.log("Report uploaded with ID:", newDoc.id);
  } catch (e: any) {
    console.error("Error uploading report:", e);
  }
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
  
    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission

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
    

      console.log(clearanceInput);
    
      // List all file-related keys in an array for easier maintenance
      const fileKeys = [
        "barangayIDjpg",
        "validIDjpg",
        "letterjpg",
        "signaturejpg",
        "copyOfPropertyTitle",
        "dtiRegistration",
        "isCCTV",
        "taxDeclaration",
        "approvedBldgPlan",
        "deathCertificate"
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
        docType === "Barangay ID" ||
        docType === "First Time Jobseeker"
      ) {
        if (
          !clearanceInput.barangayIDjpg &&
          !clearanceInput.validIDjpg &&
          !clearanceInput.letterjpg
        ) {
         
          setErrorMessage("Please upload one of the following documents: Barangay ID, Valid ID, or Endorsement Letter");
          setShowErrorPopup(true);
          return;
        }
    
        const clearanceVars = {
          createdAt: clearanceInput.dateRequested,
          requestId: clearanceInput.requestId,
          reqType: "Online",
          status: "Pending",
          statusPriority: 1,
          requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname}`,
          accID: clearanceInput.accountId,
          docType: docType,
          purpose: clearanceInput.purpose,
          fullName: clearanceInput.fullName,
          dateOfResidency: clearanceInput.dateOfResidency,
          address: clearanceInput.address,
          ...(clearanceInput.purpose === "Residency" && {
            CYFrom: clearanceInput.CYFrom,
            CYTo: clearanceInput.CYTo,
            attestedBy: clearanceInput.attestedBy,
          }),
          ...(clearanceInput.purpose === "Guardianship" && {
            wardFname: clearanceInput.wardFname,
            wardRelationship: clearanceInput.wardRelationship,
            guardianshipType: clearanceInput.guardianshipType,
          }),
          ...(clearanceInput.purpose === "Occupancy /  Moving Out" && {
            toAddress: clearanceInput.toAddress, // Include toAddress only for this specific purpose
          }),
          ...(clearanceInput.purpose === "Garage/TRU" && {
            businessName: clearanceInput.businessName,
            businessLocation: clearanceInput.businessLocation,
            noOfTRU: clearanceInput.noOfVechicles,
            businessNature: clearanceInput.businessNature,
            tricycleMake: clearanceInput.vehicleMake,
            tricycleType: clearanceInput.vehicleType,
            tricyclePlateNo: clearanceInput.vehiclePlateNo,
            tricycleSerialNo: clearanceInput.vehicleSerialNo,
            tricycleChassisNo: clearanceInput.vehicleChassisNo,
            tricycleEngineNo: clearanceInput.vehicleEngineNo,
            tricycleFileNo: clearanceInput.vehicleFileNo,
          }),
          ...(clearanceInput.purpose === "Garage/PUV" && {
            vehicleType: clearanceInput.vehicleType,
            nosOfPUV: clearanceInput.noOfVechicles,
            puvPurpose: clearanceInput.goodMoralOtherPurpose,
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
            dateofdeath: clearanceInput.dateofdeath,
            estateSince: clearanceInput.estateSince,
          }),
          ...( clearanceInput.purpose === "Death Residency"  && {
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
          ...(clearanceInput.letterjpg && { endorsementLetter: filenames.letterjpg }),
          ...(((clearanceInput.purpose === "Residency" && docType === "Barangay Certificate") || docType === "Barangay Indigency") && {
            appointmentDate: clearanceInput.appointmentDate,
            purpose: clearanceInput.purpose,
          }),

          ...(docType === "Barangay ID" && {
            birthplace: clearanceInput.birthplace,
            religion: clearanceInput.religion,
            nationality: clearanceInput.nationality,
            height: clearanceInput.height,
            weight: clearanceInput.weight,
            bloodtype: clearanceInput.bloodtype,
            occupation: clearanceInput.occupation,
            precinctnumber: clearanceInput.precinctnumber,
            emergencyDetails: clearanceInput.emergencyDetails
          }),
          ...(docType === "First Time Jobseeker" && {
            educationalAttainment: clearanceInput.educationalAttainment,
            course: clearanceInput.course,
            isBeneficiary: clearanceInput.isBeneficiary,
          })
        };
        console.log(clearanceVars, storageRefs);
        handleReportUpload(clearanceVars, storageRefs);
   
      }
    
      // 📌 Handling for Temporary Business Permit & Business Permit
      if (docType === "Temporary Business Permit" || docType === "Business Permit") {
        const clearanceVars = {
          createdAt: clearanceInput.dateRequested,
          requestId: clearanceInput.requestId,
          status: "Pending",
          statusPriority: 1,
          requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname} ${clearanceInput.requestorLname}`,
          accID: clearanceInput.accountId,
          docType: docType,
          purpose: clearanceInput.purpose,
          businessName: clearanceInput.businessName,
          businessLocation: clearanceInput.businessLocation,
          businessNature: clearanceInput.businessNature,
          estimatedCapital: clearanceInput.estimatedCapital,
          fullName: clearanceInput.fullName,
          contact: clearanceInput.contact,
          homeAddress: clearanceInput.address,
          copyOfPropertyTitle: filenames.copyOfPropertyTitle,
          dtiRegistration: filenames.dtiRegistration,
          isCCTV: filenames.isCCTV,
          signaturejpg: filenames.signaturejpg,
          endorsementLetter: filenames.letterjpg,
        };
        console.log(clearanceVars, storageRefs);
        handleReportUpload(clearanceVars, storageRefs);
        
      }
    
      // 📌 Handling for Construction Permit
      if (docType === "Construction Permit") {
        const clearanceVars = {
          createdAt: clearanceInput.dateRequested,
          requestId: clearanceInput.requestId,
          status: "Pending",
          statusPriority: 1,
          requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname} ${clearanceInput.requestorLname}`,
          accID: clearanceInput.accountId,
          docType: docType,
          purpose: clearanceInput.typeofconstruction,
          typeofbldg: clearanceInput.typeofbldg,
          projectName: clearanceInput.projectName,
          projectLocation: clearanceInput.businessLocation,
          taxDeclaration: filenames.taxDeclaration,
          approvedBldgPlan: filenames.approvedBldgPlan,
          fullName: clearanceInput.fullName,
          contact: clearanceInput.contact,
          homeAddress: clearanceInput.address,
          copyOfPropertyTitle: filenames.copyOfPropertyTitle,
          signaturejpg: filenames.signaturejpg,
          endorsementLetter: filenames.letterjpg,
          ...(clearanceInput.typeofbldg === "Others" && {othersTypeofbldg: clearanceInput.othersTypeofbldg}),
        };
        console.log(clearanceVars, storageRefs);
        handleReportUpload(clearanceVars, storageRefs);
      }
     // alert("Document request submitted successfully!");
      router.push('/services/notification'); 
    //  router.push("/services");
    };


    const [addOn, setAddOn] = useState<string>("");
    
    
    useEffect(() => {
      if ((clearanceInput.purpose === "Death Residency" || clearanceInput.purpose === "Estate Tax" ) && docType === "Barangay Certificate") setAddOn("Deceased ");
      else if(clearanceInput.purpose === "Occupancy /  Moving Out" && docType === "Barangay Certificate")setAddOn("From ");
      else if(clearanceInput.purpose === "Guardianship" && docType === "Barangay Certificate") setAddOn("Guardian's ");
      else setAddOn("");
      
    }, [clearanceInput.purpose, docType]);


  return (

    <main className="main-form-container">
      <div className="headerpic-documentreq">
        <p>SERVICES</p>
      </div>

      <div className="form-content">
        <h1 className="form-title">
        {docType} Request Form

        {userData?.status === "Verified" &&
          userData?.residentId &&
          !["Estate Tax", "Death Residency"].includes(clearanceInput.purpose) && (
            <div className="form-group">
              <label className="form-label">Who is this request for?<span className="required">*</span></label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="For Myself"
                    checked={requestMode === "For Myself"}
                    onChange={(e) => setRequestMode(e.target.value)}
                  />
                  For Myself
                </label>
                <label>
                  <input
                    type="radio"
                    value="For Someone Else"
                    checked={requestMode === "For Someone Else"}
                    onChange={(e) => setRequestMode(e.target.value)}
                  />
                  For Someone Else
                </label>
              </div>
            </div>
          )}


        </h1>

        <hr/>

        
        <form className="doc-req-form" onSubmit={handleSubmit}>
        {(docType === "Barangay Certificate" || docType === "Barangay Clearance" 
        ||  docType === "Barangay Indigency" || docType === "Business Permit" || docType === "Temporary Business Permit" ) 
        && (
          <>
          <div className="form-group">
            
          <label htmlFor="purpose" className="form-label">{docType} Purpose<span className="required">*</span></label>
          <select 
            id="purpose" 
            name="purpose" 
            className="form-input" 
            required
            value={clearanceInput.purpose}
            onChange={handleChange}
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
        </>
        )}

        {(docType === "Barangay Indigency" || (clearanceInput.purpose === "Residency" && docType === "Barangay Certificate")) && (
          <>
            <div className="form-group">
              <label htmlFor="dateOfResidency" className="form-label">Set An Appointment<span className="required">*</span></label>
              <input 
                type="date" 
                id="dateOfResidency" 
                min={minDate} // Set minimum date to tomorrow
                onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                name="appointmentDate" 
                value={clearanceInput.appointmentDate||""}
                onChange={handleChange}
                
                className="form-input" 
                required
              />
            </div>
          </>
        )}
        
         
          {docType === "Construction Permit" && (
            <>
              <div className="form-group">
                <label className="form-label">Type of Construction Activity<span className="required">*</span></label>
                <div className="main-form-radio-group">
                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="Structure" name="typeofconstruction"  value="Structure"  checked={clearanceInput.typeofconstruction === 'Structure'}  onChange={handleChange} required />
                            Structure
                        </label>
                        <label className="form-radio">
                        <input type="radio" id="Renovation" name="typeofconstruction" value="Renovation"  checked={clearanceInput.typeofconstruction === 'Renovation'}  onChange={handleChange} required />
                            Renovation
                        </label>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="Fencing" name="typeofconstruction" value="Fencing" checked={clearanceInput.typeofconstruction === 'Fencing'}  onChange={handleChange}   required />
                            Fencing
                        </label>
                        <label className="form-radio">
                        <input type="radio" id="Excavation" name="typeofconstruction" value="Excavation" checked={clearanceInput.typeofconstruction === 'Excavation'}  onChange={handleChange} required />
                            Excavation
                        </label>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="Demolition" name="typeofconstruction" value="Demolition" checked={clearanceInput.typeofconstruction === 'Demolition'}  onChange={handleChange}  required />
                            Demolition
                        </label>
                    </div>
                </div>   
            </div>
            </>
          )}
          
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">{addOn}Full Name<span className="required">*</span></label>
              <input 
                type="text"  
                id="fullName"  
                name="fullName"  
                className="form-input"  
                required  
                placeholder="Enter Full Name" 
                value={clearanceInput.fullName}
                onChange={handleChange}
                readOnly={isReadOnly}
              />
            </div>

            {(docType === "Barangay Certificate" && clearanceInput.purpose === "Cohabitation") && (<>
              <div className="form-group">
                <label htmlFor="partnerWifeHusbandFullName" className="form-label">Partner's/Wife's/Husband's Full Name<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="partnerWifeHusbandFullName"  
                  name="partnerWifeHusbandFullName"  
                  className="form-input"  
                  required  
                  placeholder="Enter Full Name" 
                  value={clearanceInput.partnerWifeHusbandFullName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cohabitationRelationship" className="form-label">
                  Type Of Relationship<span className="required">*</span>
                </label>
                <select
                  id="cohabitationRelationship"
                  name="cohabitationRelationship"
                  className="form-input"
                  value={clearanceInput.cohabitationRelationship}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select Type of Relationship</option>
                  <option value="Husband And Wife">Husband And Wife</option>
                  <option value="Partners">Partners</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="cohabitationStartDate" className="form-label">
                  Start Of Cohabitation<span className="required">*</span>
                </label>
                <input 
                type = "date" 
                id="cohabitationStartDate"
                name="cohabitationStartDate"
                className="form-input"
                value={clearanceInput.cohabitationStartDate}
                onChange={handleChange}
                onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                required
                max = {getLocalDateString(new Date())} // Set max date to today
                />
              </div>
            </>)}
            { clearanceInput.purpose === "Garage/TRU" && (
              <>  
                <div className="form-group">
                  <label htmlFor="businessname" className="form-label">Business Name<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="businessname"  
                    name="businessName"  
                    className="form-input"  
                    required 
                    placeholder="Enter Business Name"  
                    value={clearanceInput.businessName}
                    onChange={handleChange}
                  />
                </div>            
                <div className="form-group">
                  <label htmlFor="businessloc" className="form-label">Business Location<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="businessloc"  
                    name="businessLocation"  
                    className="form-input"  
                    value={clearanceInput.businessLocation}
                    onChange={handleChange}
                    required 
                    placeholder="Enter Business Location"  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="noOfVechicles" className="form-label">Nos Of Tricycle<span className="required">*</span></label>
                  <input 
                    type="number"  
                    id="noOfVechicles"  
                    name="noOfVechicles"  
                    className="form-input"  
                    required 
                    value={clearanceInput.noOfVechicles}
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
                <div className="form-group">
                  <label htmlFor="businessnature" className="form-label">Nature of Business<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="businessnature"  
                    name="businessNature"  
                    value={clearanceInput.businessNature}
                    onChange={handleChange}
                    className="form-input"  
                    required 
                    placeholder="Enter Business Nature"  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleMake" className="form-label">Tricycle Make<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="vehicleMake"  
                    name="vehicleMake"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehicleMake}
                    onChange={handleChange}
                    placeholder="Enter Tricycle Make"  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleType" className="form-label">Tricycle Type<span className="required">*</span></label>
                  <select
                    id="vehicleType"  
                    name="vehicleType"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehicleType}
                    onChange={handleChange}
                    
                  >
                    <option value="" disabled>Select Tricycle Type</option>
                    <option value="Motorcycle w/ Sidecar">Motorcycle w/ Sidecar</option>
                    <option value="Motorcycle w/o Sidecar">Motorcycle w/o Sidecar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="vehiclePlateNo" className="form-label">Tricycle Plate No.<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="vehiclePlateNo"  
                    name="vehiclePlateNo"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehiclePlateNo}
                    onChange={handleChange}
                    placeholder="Enter Tricycle Plate No."  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleSerialNo" className="form-label">Tricycle Serial No.<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="vehicleSerialNo"  
                    name="vehicleSerialNo"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehicleSerialNo}
                    onChange={handleChange}
                    placeholder="Enter Tricycle Serial No."  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleChassisNo" className="form-label">Tricycle Chassis No.<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="vehicleChassisNo"  
                    name="vehicleChassisNo"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehicleChassisNo}
                    onChange={handleChange}
                    placeholder="Enter Tricycle Chassis No."  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleEngineNo" className="form-label">Tricycle Engine No.<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="vehicleEngineNo"  
                    name="vehicleEngineNo"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehicleEngineNo}
                    onChange={handleChange}
                    placeholder="Enter Tricycle Engine No."  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleFileNo" className="form-label">Tricycle File No.<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="vehicleFileNo"  
                    name="vehicleFileNo"  
                    className="form-input"  
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
                <div className="form-group">
                  <label htmlFor="goodMoralOtherPurpose" className="form-label">Certificate Purpose<span className="required">*</span></label>
                  <input 
                    type="text"
                    id="goodMoralOtherPurpose"  
                    name="goodMoralOtherPurpose"  
                    className="form-input"  
                    required 
                    value={clearanceInput.goodMoralOtherPurpose}
                    onChange={handleChange}
                    
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicleType" className="form-label">Vehicle Description<span className="required">*</span></label>
                  <input 
                    type="text"
                    id="vehicleType"  
                    name="vehicleType"  
                    className="form-input"  
                    required 
                    value={clearanceInput.vehicleType}
                    onChange={handleChange}   
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="noOfVechicles" className="form-label">Nos Of Vehicle/s<span className="required">*</span></label>
                  <input 
                    type="number"  
                    id="noOfVechicles"  
                    name="noOfVechicles"  
                    className="form-input"  
                    required 
                    value={clearanceInput.noOfVechicles}
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
            {(docType ==="Temporary Business Permit"||docType ==="Business Permit") ? (
              <>  
                <div className="form-group">
                  <label htmlFor="businessname" className="form-label">Business Name<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="businessname"  
                    name="businessName"  
                    className="form-input"  
                    required 
                    placeholder="Enter Business Name"  
                    value={clearanceInput.businessName}
                    onChange={handleChange}
                  />
              </div>            
              <div className="form-group">
                <label htmlFor="address" className="form-label">Home Address<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="address"  
                  name="address"  
                  className="form-input"  
                  required 
                  placeholder="Enter Home Address"  
                  value={clearanceInput.address}
                  onChange={handleChange}
                />
              </div>

                <div className="form-group">
                  <label htmlFor="businessloc" className="form-label">Business Location<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="businessloc"  
                    name="businessLocation"  
                    className="form-input"  
                    value={clearanceInput.businessLocation}
                    onChange={handleChange}
                    required 
                    placeholder="Enter Business Location"  
                  />
                </div>
              </>
            ):docType ==="Construction Permit"&&(
            <>
              <div className="form-group">
              <label htmlFor="address" className="form-label">Home/Office Address<span className="required">*</span></label>
              <input 
                type="text"  
                id="address"  
                name="address"  
                className="form-input"  
                required 
                value={clearanceInput.address}
                onChange={handleChange}
                placeholder="Enter Home/Office Address" 
                readOnly={isReadOnly}
 
              />
            </div>
            </>
            )}
            
              <div className="form-group">
                <label htmlFor="dateOfResidency" className="form-label">Date of Residency in Barangay Fairview<span className="required">*</span></label>
                <input 
                  type="date" 
                  id="dateOfResidency" 
                  name="dateOfResidency" 
                  value={clearanceInput.dateOfResidency}
                  onChange={handleChange}
                  className="form-input" 
                  onKeyDown={(e) => e.preventDefault()} // Prevent manual input

                  required 
                  max={getLocalDateString(new Date())}
                />
             </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">{addOn}Address<span className="required">*</span></label>
              <input 
                type="text"  
                id="address"  
                name="address"  
                value={clearanceInput.address}
                onChange={handleChange}
                className="form-input"  
                required 
                placeholder={`Enter ${addOn}Address`}
                readOnly={isReadOnly}

              />
            </div>
            {clearanceInput.purpose === "No Income" && (
              <>
                <div className="form-group">
                  <label htmlFor="noIncomePurpose" className="form-label">Purpose Of No Income:<span className="required">*</span></label>
                    <select 
                      id="noIncomePurpose"  
                      name="noIncomePurpose"  
                      value={clearanceInput.noIncomePurpose}
                      onChange={handleChange}
                      className="form-input"  
                      required 
                    >
                      <option value="" disabled>Select Purpose</option>
                      <option value="SPES Scholarship">SPES Scholarship</option>
                      <option value="ESC Voucher">DEPED Educational Services Contracting (ESC) Voucher</option>
                    </select>
                </div>

                <div className="form-group">
                  <label htmlFor="noIncomeChildFName" className="form-label">Son/Daughter's Name<span className="required">*</span></label>
                    <input 
                      type="text"  
                      id="noIncomeChildFName"  
                      name="noIncomeChildFName"  
                      value={clearanceInput.noIncomeChildFName}
                      onChange={handleChange}
                      className="form-input"  
                      required 
                      placeholder={`Enter Child's Full Name`}
                    />
                </div>

              </>
            )}
            {clearanceInput.purpose === "Good Moral and Probation" && (
              <>
                <div className="form-group">
                  <label htmlFor="goodMoralPurpose" className="form-label">Purpose of Good Moral and Probation:<span className="required">*</span></label>
                  <select
                    id="goodMoralPurpose"
                    name="goodMoralPurpose"
                    className="form-input"
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
                    <div className="form-group">
                      <label htmlFor="goodMoralOtherPurpose" className="form-label">Please Specify Other Purpose:<span className="required">*</span></label>
                      <input 
                        type="text"  
                        id="goodMoralOtherPurpose"  
                        name="goodMoralOtherPurpose"  
                        value={clearanceInput.goodMoralOtherPurpose}
                        onChange={handleChange}
                        className="form-input"  
                        required 
                        placeholder="Enter Other Purpose"
                      />
                    </div>
                  </>
                )}

              </>
            )}
            {}
            {clearanceInput.purpose === "Guardianship" && (
              <>
                <div className="form-group">
                <label htmlFor="guardianshipType" className="form-label">Type of Guardianship Certificate<span className="required">*</span></label>
                    <select
                      id="guardianshipType"  
                      name="guardianshipType"  
                      className="form-input"  
                      value={clearanceInput.guardianshipType}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Type of Guardianship</option>
                      <option value="School Purpose">For School Purpose</option>
                      <option value="Legal Purpose">For Other Legal Purpose</option>
                    </select>
                </div>
              
                <div className="form-group">
                <label htmlFor="wardRelationship" className="form-label">Guardian's Relationship Towards the Ward<span className="required">*</span></label>
                    <select
                      id="wardRelationship"  
                      name="wardRelationship"  
                      className="form-input"  
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

                <div className="form-group">
                <label htmlFor="wardFname" className="form-label">Ward's Full Name<span className="required">*</span></label>
                    <input 
                      type="text"  
                      id="wardFname"  
                      name="wardFname"  
                      value={clearanceInput.wardFname}
                      onChange={handleChange}
                      className="form-input"  
                      required 
                      placeholder={`Enter Ward's Full Name`}
                    />
                </div>

              </>
            )}
            {clearanceInput.purpose === "Residency" && (
              <>
                <div className="form-group">
                  <label htmlFor="attestedBy" className="form-label">Attested By Hon Kagawad: <span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="attestedBy"  
                    name="attestedBy"  
                    value={clearanceInput.attestedBy}
                    onChange={handleChange}
                    className="form-input"  
                    required 
                    placeholder="Enter Hon Kagawad's Full Name"  
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="CYFrom" className="form-label">Cohabitation Year From:<span className="required">*</span></label>
                  <select
                    id="CYFrom"
                    name="CYFrom"
                    value={clearanceInput.CYFrom}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="" disabled>Select Year</option>
                    {[...Array(100)].map((_, i) => {
                      const year = new Date().getFullYear() - i;
                      const cyTo = parseInt(clearanceInput.CYTo);
                      const isDisabled = !isNaN(cyTo) && year >= cyTo;
                      return (
                        <option key={year} value={year} disabled={isDisabled}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="CYTo" className="form-label">Cohabitation Year To:<span className="required">*</span></label>
                  <select
                    id="CYTo"
                    name="CYTo"
                    value={clearanceInput.CYTo}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="" disabled>Select Year</option>
                    {[...Array(100)].map((_, i) => {
                      const year = new Date().getFullYear() - i;
                      const cyFrom = parseInt(clearanceInput.CYFrom);
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
                <div className="form-group">
                  <label htmlFor="toAddress" className="form-label">To Address<span className="required">*</span></label>
                  <input 
                    type="text"  
                    id="toAddress"  
                    name="toAddress"  
                    value={clearanceInput.toAddress}
                    onChange={handleChange}
                    className="form-input"  
                    required 
                    placeholder="Enter To Address"  
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="birthday" className="form-label">Birthday<span className="required">*</span></label>
              <input 
                type="date" 
                id="birthday" 
                name="birthday" 
                className="form-input" 
                value={clearanceInput.birthday}
                onKeyDown={(e) => e.preventDefault()} // Prevent manual input
                onChange={handleChange}
                required 
                max={getLocalDateString(new Date())}
                readOnly={isReadOnly}

              />
            </div>
            
          
            {(clearanceInput.purpose === "Death Residency"|| clearanceInput.purpose === "Estate Tax") && (
              <div className="form-group">
                <label htmlFor="dateofdeath" className="form-label">Date Of Death<span className="required">*</span></label>
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

            {clearanceInput.purpose === "Estate Tax" && (
              <>
                <div className="form-group">
                  <label htmlFor="estateSince" className="form-label">Estate Since:<span className="required">*</span></label>
                  <select
                    id="estateSince"
                    name="estateSince"
                    value={clearanceInput.estateSince}
                    onChange={handleChange}
                    className="form-input"
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

            {docType ==="Barangay ID" && (
              <div className="form-group">
                <label htmlFor="birthdayplace" className="form-label">Birthplace<span className="required">*</span></label>
                <input 
                  type="text" 
                  id="birthdayplace" 
                  name="birthplace" 
                  className="form-input" 
                  value={clearanceInput.birthplace}
                  onChange={handleChange}
                  required 
                  placeholder="Enter Birthplace" 
                  readOnly={isReadOnly}

                />
              </div>
            )}
  

            {(docType ==="Temporary Business Permit"||docType ==="Business Permit")?(<>
              <div className="form-group">
              <label htmlFor="businessnature" className="form-label">Nature of Business<span className="required">*</span></label>
              <input 
                type="text"  
                id="businessnature"  
                name="businessNature"  
                value={clearanceInput.businessNature}
                onChange={handleChange}
                className="form-input"  
                required 
                placeholder="Enter Business Nature"  
              />
            </div>

            

            <div className="form-group">
              <label htmlFor="capital" className="form-label">Estimated Capital<span className="required">*</span></label>
              <input 
                type="number"  // Ensures the input accepts only numbers
                id="capital"  
                name="estimatedCapital"  
                className="form-input"
                value={clearanceInput.estimatedCapital}
                onChange={handleChange} 
                required 
                min="1"  // Minimum age (you can adjust this as needed)
                placeholder="Enter Estimated Capital"  
                step="1"  // Ensures only whole numbers can be entered
              />
            </div>
              
            </>):docType=="Construction Permit"?(
              <>
                <div className="form-group">
              <label htmlFor="projectloc" className="form-label">Project Location<span className="required">*</span></label>
              <input 
                type="text"  
                id="projectloc"  
                name="businessLocation"  
                className="form-input"  
                value={clearanceInput.businessLocation}
                onChange={handleChange}
                required 
                placeholder="Enter Project Location"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="buildingtype" className="form-label">
                Type of Building<span className="required">*</span>
              </label>
              <select
                id="buildingtype"
                name="typeofbldg"
                className="form-input"
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
                className="form-input-others"
                placeholder="Enter Type of Building"
                value={clearanceInput.othersTypeofbldg}
                onChange={handleChange}
                required
              />
            )}
            </div>
            
              </>)
            :(<>
              <div className="form-group">
              <label htmlFor="age" className="form-label">Age<span className="required">*</span></label>
              <input 
                type="number"  // Ensures the input accepts only numbers
                id="age"  
                name="age"  
                className="form-input" 
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

            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender<span className="required">*</span></label>
              <select 
                id="gender" 
                name="gender" 
                className="form-input" 
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
            </>)}
           

            {docType ==="Barangay ID" && (
              <>
              <div className="form-group">
                <label htmlFor="religion" className="form-label">Religion<span className="required">*</span></label>
                <select
                  id="religion"
                  name="religion"
                  className="form-input"
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
                    className="form-input-others"
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

                <div className="form-group">
                  <label htmlFor="nationality" className="form-label">Nationality<span className="required">*</span></label>
                  <select
                    id="nationality"
                    name="nationality"
                    className="form-input"
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
                      className="form-input-others"
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
            
            {(docType ==="Temporary Business Permit"||docType ==="Business Permit") ? (<>
            </>) : docType==="Construction Permit" ?(
              <>
                 <div className="form-group">
              <label htmlFor="projecttitle" className="form-label">Project Title<span className="required">*</span></label>
              <input 
                type="text"  
                id="projecttitle"  
                name="projectName"  
                className="form-input"  
                value={clearanceInput.projectName}
                onChange={handleChange}
                required 
                placeholder="Enter Project Title"  
              />
            </div>
              </>
            ):(<> 
              <div className="form-group">
              <label htmlFor="civilStatus" className="form-label">Civil Status<span className="required">*</span></label>
              <select 
                id="civilStatus" 
                name="civilStatus" 
                className="form-input" 
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
            </div></>)}
           

            {docType ==="Barangay ID" && (
              <>
                <div className="form-group">
                  <label htmlFor="height" className="form-label">Height<span className="required">*</span></label>
                  <input 
                    type="number" 
                    id="height" 
                    name="height" 
                    className="form-input" 
                    value={clearanceInput.height}
                    onChange={handleChange}
                    required 
                    placeholder="Enter Height" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight" className="form-label">Weight<span className="required">*</span></label>
                  <input 
                    type="number" 
                    id="weight" 
                    name="weight" 
                    value={clearanceInput.weight}
                    onChange={handleChange}
                    className="form-input" 
                    required 
                    placeholder="Enter Weight" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bloodtype" className="form-label">Blood Type<span className="required">*</span></label>
                  <select
                    id="bloodtype"
                    name="bloodtype"
                    className="form-input"
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
                      className="form-input-others"
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


                <div className="form-group">
                  <label htmlFor="occupation" className="form-label">Occupation<span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="occupation" 
                    name="occupation" 
                    className="form-input" 
                    value={clearanceInput.occupation}
                    onChange={handleChange}
                    required 
                    placeholder="Enter Occupation" 
                  />
                </div>

            </>)}

            <div className="form-group">
              <label htmlFor="contact" className="form-label">Contact Number<span className="required">*</span></label>
              <input 
                type="tel"  
                id="contact"  
                name="contact"  
                className="form-input" 
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

            

            {docType ==="Barangay ID" ? (
              <div className="form-group">
              <label htmlFor="precinctno" className="form-label">Precinct Number<span className="required">*</span></label>
              <input 
                type="number" 
                id="precinctno" 
                name="precinctnumber" 
                className="form-input" 
                value={clearanceInput.precinctnumber}
                onChange={handleChange}
                required 
                placeholder="Enter Precinct Number" 
              />
              </div>
            ):(docType === "Temporary Business Permit" || docType === "Business Permit") ? (<></>)
            : docType === "Construction Permit" ? (<></>) : (
              <div className="form-group">
                <label htmlFor="citizenship" className="form-label">
                  Citizenship<span className="required">*</span>
                </label>
                <select
                  id="citizenship"
                  name="citizenship"
                  className="form-input"
                  value={
                    ["Filipino", "Dual Citizen", "Naturalized", "Others"].includes(clearanceInput.citizenship.split("(")[0])
                      ? clearanceInput.citizenship.split("(")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === "Dual Citizen" || selected === "Others") {
                      setClearanceInput((prev: any) => ({
                        ...prev,
                        citizenship: selected,
                      }));
                    } else {
                      setClearanceInput((prev: any) => ({
                        ...prev,
                        citizenship: selected,
                      }));
                    }
                  }}
                  required
                >
                  <option value="" disabled>Select Citizenship</option>
                  <option value="Filipino">Filipino</option>
                  <option value="Dual Citizen">Dual Citizen</option>
                  <option value="Naturalized">Naturalized</option>
                  <option value="Others">Others</option>
                </select>

                {/* Input field for Dual Citizen */}
                {clearanceInput.citizenship === "Dual Citizen" && (
                  <input
                    type="text"
                    className="form-input-others"
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

                {/* Input field for Others */}
                {clearanceInput.citizenship === "Others" && (
                  <input
                    type="text"
                    className="form-input-others"
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

            )}
          

        

          {docType ==="Barangay ID" ? (
            <>
              <h1 className="form-requirements-title">Emergency Details</h1>

              <div className="form-group">
                <label htmlFor="fullName" className="form-label">First Name<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="fullName"  
                  className="form-input"  
                  name="emergencyDetails.fullName"  
                  value={clearanceInput.emergencyDetails.fullName}
                  onChange={handleChange}
                  required  
                  placeholder="Enter First Name" 
                />
              </div>`

             

              <div className="form-group">
                <label htmlFor="address" className="form-label">Address<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="address"  
                  name="emergencyDetails.address"  
                  className="form-input"  
                  value={clearanceInput.emergencyDetails.address}
                  onChange={handleChange}
                  required 
                  placeholder="Enter Address"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="relationship" className="form-label">Relationship<span className="required">*</span></label>
                <select
                  id="relationship"
                  name="emergencyDetails.relationship"
                  className="form-input"
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
                    className="form-input-others"
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



              <div className="form-group">
                <label htmlFor="contactnumber" className="form-label">Contact Number<span className="required">*</span></label>
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
                  className="form-input" 
                  required
                  maxLength={11}  
                  pattern="^[0-9]{11}$" 
                  placeholder="Please enter a valid 11-digit contact number"
                  title="Please enter a valid 11-digit contact number. Format: 0917XXXXXXX"
                />
              </div>
            </>
          ):docType==="First Time Jobseeker" &&(
            <>

              <div className="form-group">
                <label htmlFor="educationalAttainment" className="form-label">Educational Attainment<span className="required">*</span></label>
                <select 
                  name="educationalAttainment" 
                  id="educationalAttainment"  
                  className="form-input" 
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

            <div className="form-group">
              <label htmlFor="course" className="form-label">Course<span className="required">*</span></label>
              <input 
                type="text"  
                id="course"  
                name="course"  
                className="form-input"  
                value={clearanceInput.course}
                onChange={handleChange}
                required 
                placeholder="Enter Course"  
              />
            </div>
              <br/>
            <div className="form-group">
                <label className="form-label">
                    Are you a beneficiary of a JobStart Program under RA No. 10869, otherwise known as “An Act Institutionalizing the Nationwide Implementation of the Jobstart Philippines Program and Providing Funds therefor”?<span className="required">*</span>
                </label>
                <div className="form-radio-group">
                    <label className="form-radio">
                    <input type="radio" id="radioYes" name="isBeneficiary" value="yes"  checked={clearanceInput.isBeneficiary === "yes"}  onChange={handleChange} required />
                        Yes
                    </label>
                    <label className="form-radio">
                    <input type="radio" id="radioNo" name="isBeneficiary" value="no" checked={clearanceInput.isBeneficiary === "no"}  onChange={handleChange}required />
                        No
                    </label>
                </div>
            </div>

            </>
        )}

          <div className="form-group">
            <label htmlFor="requestorMrMs" className="form-label">Requestor's Title<span className="required">*</span></label>
            <select
              id="requestorMrMs" 
              name="requestorMrMs" 
              className="form-input" 
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



          <div className="form-group">
            <label htmlFor="requestorFname" className="form-label">Requestor Full Name<span className="required">*</span></label>
            <input 
              type="text"  
              id="requestorFname"  
              name="requestorFname"  
              className="form-input" 
              value={clearanceInput.requestorFname}
              onChange={handleChange}
              required  
              placeholder="Enter Requestor Full Name"  
            />
          </div>

          <hr/>

          
          <h1 className="form-requirements-title">Requirements</h1>


          {(docType ==="Temporary Business Permit" || docType ==="Business Permit" || docType === "Construction Permit") &&(
        
        <>

        <div className="signature-printedname-container">
            <h1 className="form-label">Certified True Copy of Title of the Property/Contract of Lease<span className="required">*</span></h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload5"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload5"
                  type="file"
                  required
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
                                  onClick={() => handleFileDelete('file-upload5', setFiles5)}
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

          
          <br/>
        </>
          )}

        
            {(docType==="Barangay Certificate" && clearanceInput.purpose === "Death Residency") && (
            <>
              <div className="barangayID-container">
                  <h1 className="form-label">Death Certification<span className="required">*</span></h1>
              <div className="file-upload-container">
                <label htmlFor="file-upload8"  className="upload-link">Click to Upload File</label>
                  <input
                    id="file-upload8"
                    type="file"
                    required
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
                                    onClick={() => handleFileDelete('file-upload10',setFiles10)}
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
            

        
          <div className="barangayID-container">
            <h1 className="form-label">Certified True Copy of DTI Registration<span className="required">*</span></h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload6"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload6"
                  type="file"
                  required={(docType === "Temporary Business Permit" || docType === "Business Permit")}
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
                                  onClick={() => handleFileDelete('file-upload6', setFiles6)}
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




          <div className="endorsementletter-container">
            <h1 className="form-label">Picture of CCTV installed in the establishment<span className="required">*</span></h1>
            <h1 className="form-label-description">(for verification by Barangay Inspector)</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload7"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload7"
                  type="file"
                  required={(docType === "Temporary Business Permit" || docType === "Business Permit" || docType === "Construction Permit")}
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
                                  onClick={() => handleFileDelete('file-upload7', setFiles7)}
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
            
          </>)}

          <div className="signature-printedname-container">
            <h1 className="form-label"> Upload Signature Over Printed Name<span className="required">*</span></h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  required
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
                                  onClick={() => handleFileDelete('file-upload1', setFiles)}
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

          
          {(docType !=="Temporary Business Permit" && docType !=="Business Permit" && docType !=="Construction Permit" ) && (
            <>
              <br/>
              <h1 className="form-label-reqs"> Upload any of the following requirements</h1>
              <br/>
            </>
          )}
       
       
          {docType === "Construction Permit" ? (<>
          <div className="barangayID-container">
            <h1 className="form-label">Certified True Copy of Tax Declaration<span className="required">*</span></h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload8"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload8"
                  type="file"
                  required
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
                                  onClick={() => handleFileDelete('file-upload8',setFiles8)}
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



          <div className="barangayID-container">
            <h1 className="form-label">Approved Building/Construction Plan<span className="required">*</span></h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload10"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload10"
                  type="file"
                  required
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
                                  onClick={() => handleFileDelete('file-upload9',setFiles9)}
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

          
          </>):(<>
          

            {(docType !=="Temporary Business Permit" && docType !=="Business Permit" && docType !== "Construction Permit") &&(
        
          <>
            <div className="barangayID-container">
            <h1 className="form-label"> Barangay ID</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload2"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  required={docType === "Temporary Business Permit" || docType === "Business Permit"}
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
                                  onClick={() => handleFileDelete('file-upload2', setFiles2)}
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


          <div className="validID-container">
            <h1 className="form-label"> Valid ID with an  address in Barangay Fairvirew</h1>
            <h1 className="form-label-description">(for residents with no Barangay ID)</h1>

            <div className="file-upload-container">
              {/* Only show upload button if no uploaded file exists */}
              {!userData?.upload && (
                <>
                  <label htmlFor="file-upload3" className="upload-link">Click to Upload File</label>
                  <input
                    id="file-upload3"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    required={(docType === "Temporary Business Permit" || docType === "Business Permit")}
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
                          <div className="filename&image-container">
                            <img
                              src={file.preview}
                              alt={file.name}
                              style={{ width: '50px', height: '50px', marginRight: '5px' }}
                            />
                          </div>
                          {file.name}

                          {!userData?.upload && (
                            <div className="delete-container">
                              <button
                                type="button"
                                onClick={() => handleFileDelete('file-upload3', setFiles3)}
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
        </>
        )}
          
          
          </>)}
          <div className="endorsementletter-container">
            <h1 className="form-label"> Endorsement Letter from Homeowner/Sitio President</h1>
            <h1 className="form-label-description">(for residents of Barangay Fairview for less than 6 months) </h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload4"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  required={(docType === "Temporary Business Permit" || docType === "Business Permit"|| docType === "Construction Permit")}
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
                                  onClick={() => handleFileDelete('file-upload4', setFiles4)}
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
          <div className="form-group button-container">
            
            <button type="submit" className="submit-button">Submit</button>
      
        </div>  
          

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