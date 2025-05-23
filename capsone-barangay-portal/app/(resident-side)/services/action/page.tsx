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



export default function Action() {
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const user = useAuth().user; 
  const searchParam = useSearchParams();
  const docType = searchParam.get("doc");
  const router = useRouter();
  console.log(docType);
  const [clearanceInput, setClearanceInput] =  useState<any>({
    accountId: user?.uid || "Guest",
    purpose: "",
    dateRequested: new Date().toLocaleString(),
    firstName: "",
    appointmentDate: "",
    lastName: "",
    dateOfResidency: "",
    dateofdeath: "",
    address: "",//will be also the home address
    businessLocation: "",// will be project location
    businessNature: "",
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
      firstName: "",
      lastName: "",
      address: "",
      relationship: "",
      contactNumber: "",
    },
    requestorMrMs: "",
    requestorFname: "",
    requestorLname: "",
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
    const fetchUserData = async () => {
      /*if the user requesting has an accountt and is logined*/
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "ResidentUsers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClearanceInput((prev: any) => ({
            ...prev,
            firstName: `${data.first_name} ${data.middle_name}`  || "",
            lastName: data.last_name || "",
            contact: data.phone || "",
            address: data.address || "",
            gender: data.sex || "",
          }));
        }
      }
    };

    fetchUserData();
  }, []);
  
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
      if (file && storageRef) {
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
        if (clearanceInput[key]) {
          let timeStamp = Date.now().toString() + Math.floor(Math.random() * 1000); // Add random digits to prevent collisions
          const file = clearanceInput[key];
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
          requestDate: clearanceInput.dateRequested,
          status: "Pending",
          statusPriority: 1,
          requestor: `${clearanceInput.requestorMrMs} ${clearanceInput.requestorFname} ${clearanceInput.requestorLname}`,
          accID: clearanceInput.accountId,
          docType: docType,
          purpose: clearanceInput.purpose,
          firstName: clearanceInput.firstName,
          lastName: clearanceInput.lastName,
          dateOfResidency: clearanceInput.dateOfResidency,
          address: clearanceInput.address,
          birthday: clearanceInput.birthday,
          age: clearanceInput.age,
          gender: clearanceInput.gender,
          civilStatus: clearanceInput.civilStatus,
          contact: clearanceInput.contact,
          citizenship: clearanceInput.citizenship,
          signaturejpg: filenames.signaturejpg, // Store filename instead of file object
          ...((docType === "Barangay Certificate" && clearanceInput.purpose === "Death Residency")  && {
            dateofdeath: clearanceInput.dateofdeath,
            deathCertificate: filenames.deathCertificate,
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
          requestDate: clearanceInput.dateRequested,
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
          firstName: clearanceInput.firstName,
          lastName: clearanceInput.lastName,
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
          requestDate: clearanceInput.dateRequested,
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
          firstName: clearanceInput.firstName,
          lastName: clearanceInput.lastName,
          contact: clearanceInput.contact,
          homeAddress: clearanceInput.address,
          copyOfPropertyTitle: filenames.copyOfPropertyTitle,
          signaturejpg: filenames.signaturejpg,
          endorsementLetter: filenames.letterjpg,
          ...(clearanceInput.typeofbldg === "Others" && {othersTypeofbldg: clearanceInput.othersTypeofbldg}),
          //othersTypeofbldg: ""
        };

        // ✅ Add othersTypeofbldg if typeofbldg is "Others"
        // if (clearanceInput.typeofbldg === "Others") {
        //   clearanceVars.othersTypeofbldg = clearanceInput.othersTypeofbldg;
        // }
        console.log(clearanceVars, storageRefs);
        handleReportUpload(clearanceVars, storageRefs);
      }
     // alert("Document request submitted successfully!");
      router.push('/services/notification'); 
    //  router.push("/services");
    };
    
    


  return (

    <main className="main-form-container">
      <div className="headerpic-documentreq">
        <p>SERVICES</p>
      </div>

      <div className="form-content">
        <h1 className="form-title">
        {docType} Request Form
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
              <option value="No Income (Scholarship)">No Income (Scholarship)</option>
              <option value="No Income (ESC)">No Income (ESC)</option>
              <option value="No Income (For Discount)">No Income (For Discount)</option>
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
              {/* <option value="Character Reputation">Character Reputation</option> */}
              {/* <option value="Request for Referral">Request for Referral</option> */}
              {/* <option value="Issuance of Postal ID">Issuance of Postal ID</option> */}
              {/* <option value="MWSI connection">MWSI connection</option> */}
              {/* <option value="Business Clearance">Business Clearance</option> */}
              {/* <option value="Firearms License">Police Clearance</option> */}
              {/* <option value="Others">Others</option> */}
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
              <label htmlFor="firstName" className="form-label">First Name<span className="required">*</span></label>
              <input 
                type="text"  
                id="firstName"  
                name="firstName"  
                className="form-input"  
                required  
                placeholder="Enter First Name" 
                value={clearanceInput.firstName}
                onChange={handleChange}
              />
            </div>

         

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name<span className="required">*</span></label>
              <input 
                type="text"  
                id="lastName"  
                name="lastName"  
                className="form-input"  
                required 
                value={clearanceInput.lastName}
                onChange={handleChange}
                placeholder="Enter Last Name"  
              />
            </div>
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
            ):docType ==="Construction Permit"?(
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
              />
            </div>
            </>
            ):(
            
            <>
              <div className="form-group">
                <label htmlFor="dateOfResidency" className="form-label">Date of Residency in Barangay Fairview<span className="required">*</span></label>
                <input 
                  type="date" 
                  id="dateOfResidency" 
                  name="dateOfResidency" 
                  value={clearanceInput.dateOfResidency}
                  onChange={handleChange}
                  className="form-input" 
                  required 
                  max={getLocalDateString(new Date())}
                />
             </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">Address<span className="required">*</span></label>
              <input 
                type="text"  
                id="address"  
                name="address"  
                value={clearanceInput.address}
                onChange={handleChange}
                className="form-input"  
                required 
                placeholder="Enter Address"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthday" className="form-label">Birthday<span className="required">*</span></label>
              <input 
                type="date" 
                id="birthday" 
                name="birthday" 
                className="form-input" 
                value={clearanceInput.birthday}
                onChange={handleChange}
                required 
                max={getLocalDateString(new Date())}
              />
            </div>
            
            </>)}
            {(docType ==="Barangay Certificate" && clearanceInput.purpose === "Death Residency" ) && (
              <div className="form-group">
                <label htmlFor="dateofdeath" className="form-label">Date Of Death<span className="required">*</span></label>
                <input 
                  type="date" 
                  id="dateofdeath" 
                  name="dateofdeath" 
                  className="form-input" 
                  value={clearanceInput.dateofdeath}
                  onChange={handleChange}
                  required 
                  max={getLocalDateString(new Date())} // Set max date to today
                />
              </div>
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
                required 
                min="1"  
                max="150"  
                placeholder="Enter Age"  
                step="1" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender<span className="required">*</span></label>
              <select 
                id="gender" 
                name="gender" 
                className="form-input" 
                required
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
                  <input 
                    type="text" 
                    id="religion" 
                    name="religion" 
                    className="form-input" 
                    value={clearanceInput.religion}
                    onChange={handleChange}
                    required 
                    placeholder="Enter Religion" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nationality" className="form-label">Nationality<span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="nationality" 
                    name="nationality" 
                    className="form-input" 
                    required 
                    value={clearanceInput.nationality}
                    onChange={handleChange}
                    placeholder="Enter Nationality" 
                  />
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
  
              >
                <option value="" disabled>Select civil status</option>
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
                  <input 
                    type="text" 
                    id="bloodtype" 
                    name="bloodtype" 
                    className="form-input" 
                    value={clearanceInput.bloodtype}
                    onChange={handleChange}
                    required 
                    placeholder="Enter Blood Type" 
                  />
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
            ):(docType ==="Temporary Business Permit"||docType ==="Business Permit")?(<></>)
            :docType=="Construction Permit"?(<></>):(<div className="form-group">
              <label htmlFor="citizenship" className="form-label">Citizenship<span className="required">*</span></label>
              <input 
                type="text"  
                id="citizenship"  
                name="citizenship"  
                className="form-input"  
                value={clearanceInput.citizenship}
                onChange={handleChange}
                required 
                placeholder="Enter Citizenship"  
              />
            </div>  )}
          

        

          {docType ==="Barangay ID" ? (
            <>
              <h1 className="form-requirements-title">Emergency Details</h1>

              <div className="form-group">
                <label htmlFor="firstname" className="form-label">First Name<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="firstname"  
                  className="form-input"  
                  name="emergencyDetails.firstName"  
                  value={clearanceInput.emergencyDetails.firstName}
                  onChange={handleChange}
                  required  
                  placeholder="Enter First Name" 
                />
              </div>`

              <div className="form-group">
                <label htmlFor="middlename" className="form-label">Middle Name<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="middlename"  
                  name="emergencyDetails.middleName"  
                  className="form-input" 
                  value={clearanceInput.emergencyDetails.middleName}
                  onChange={handleChange}
                  required  
                  placeholder="Enter Middle Name"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastname" className="form-label">Last Name<span className="required">*</span></label>
                <input 
                  type="text"  
                  id="lastname"  
                  name="emergencyDetails.lastName"  
                  value={clearanceInput.emergencyDetails.lastName}
                  onChange={handleChange}
                  className="form-input"  
                  required 
                  placeholder="Enter Last Name"  
                />
              </div>

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
                <input 
                  type="text"  
                  id="relationship"  
                  name="emergencyDetails.relationship"  
                  className="form-input"  
                  value={clearanceInput.emergencyDetails.relationship}
                  onChange={handleChange}
                  required 
                  placeholder="Enter Relationship"  
                />
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
              value={clearanceInput.requestorMrMs}
              onChange={handleChange}
            >
              <option value="" disabled>Select Requestor's Title</option>
              <option value="Mr.">Mr.</option>
              <option value="Ms.">Ms.</option>
              <option value="Mrs.">Mrs.</option>
            </select>
          </div>


          <div className="form-group">
            <label htmlFor="requestorFname" className="form-label">Requestor First Name<span className="required">*</span></label>
            <input 
              type="text"  
              id="requestorFname"  
              name="requestorFname"  
              className="form-input" 
              value={clearanceInput.requestorFname}
              onChange={handleChange}
              required  
              placeholder="Enter Requestor First Name"  
            />
          </div>

          <div className="form-group">
            <label htmlFor="requestorLname" className="form-label">Requestor Last Name<span className="required">*</span></label>
            <input 
              type="text"  
              id="requestorLname"  
              name="requestorLname"  
              className="form-input" 
              value={clearanceInput.requestorLname}
              onChange={handleChange}
              required  
              placeholder="Enter Requestor Last Name"  
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
              <label htmlFor="file-upload3"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload3"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  required = {(docType === "Temporary Business Permit" || docType === "Business Permit")}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles3, 'validIDjpg');
                  }} // Handle file selection
                  style={{ display: "none" }}
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files3.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files3.map((file, index) => (
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