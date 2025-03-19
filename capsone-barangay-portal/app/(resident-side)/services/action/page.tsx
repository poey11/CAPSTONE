"use client"
import { ChangeEvent, useEffect, useState } from "react";
import {useAuth} from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsform/requestdocumentsform.css";
import {useSearchParams } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/db/firebase";



export default function Action() {
  const user = useAuth().user; // Get the current user from the context
  const searchParam = useSearchParams();
  const docType = searchParam.get("doc");

  const [clearanceInput, setClearanceInput] = useState({
    accountId: user?.uid || "Guest",
    purpose: "",
    dateRequested: new Date().toISOString().split('T')[0],
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfResidency: "",
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
      middleName: "",
      lastName: "",
      address: "",
      relationship: "",
      contactNumber: "",
    },
    signaturejpg: null,
    barangayIDjpg:null,
    validIDjpg: null,
    letterjpg:null,
    copyOfPropertyTitle: null,
    dtiRegistration: null,
    isCCTV: null,
    taxDeclaration: null,
    approvedBldgPlan:null 
  })
// State for all file containers
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files2, setFiles2] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files3, setFiles3] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files4, setFiles4] = useState<{ name: string, preview: string | undefined }[]>([]);

useEffect(() => {
  if (user) {
    setClearanceInput((prev) => ({
      ...prev,
      accountId: user.uid, // Ensure the latest value is set
    }));
  }
}, [user]); // Runs when `user` changes


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
    setClearanceInput((prev) => ({
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
  
  const handleReportUpload = async (key: any, storageRef: any) => {
    try {
      const docRef = collection(db, "IncidentReports");
  
      // Assuming key is an array with a single object containing all fields:
      const updates = { ...key[0] };  // No filtering, just spread the object
  
      // Upload the report to Firestore
      const newDoc = await addDoc(docRef, updates);
  
    } catch (e: any) {
      console.log("Error uploading report:", e);
    }
  };
    
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
  
    setClearanceInput((prev) => ({
      ...prev,
      [name]: value, // Handle other input types (text, textarea, select)
    }));
  };

    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission
      
      console.log(clearanceInput); // Log the form data
    };


  return (

    <main className="main-form-container">
      <div className="headerpic">
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
          <div className="form-group">
            
          <label htmlFor="purpose" className="form-label">{docType} Purpose</label>
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
              <option value="Loan">Occupancy /  Moving Out</option>
              <option value="Bank Transaction">Estate Tax</option>
              <option value="Local Employment">Death Residency</option>
              <option value="Maynilad">No Income (Scholarship)</option>
              <option value="Meralco">No Income (ESC)</option>
              <option value="Bail Bond">No Income (For Discount)</option>
              <option value="Character Reputation">Cohabitation</option>
              <option value="Request for Referral">Guardianship</option>
              <option value="Issuance of Postal ID">Good Moral and Probation</option>
              <option value="MWSI connection">Garage/PUV</option>
              <option value="Business Clearance">Garage/TRU</option>
            
            </>):docType === "Barangay Clearance" ? (<>
              <option value="Loan">Loan</option>
              <option value="Bank Transaction">Bank Transaction</option>
              <option value="Bank Transaction">Residency</option>
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
              <option value="Loan">No Income</option>
              <option value="Bank Transaction">Public Attorneys Office</option>
              <option value="Bank Transaction">AKAP</option>
              <option value="Local Employment">Financial Subsidy of Solo Parent</option>
              <option value="Maynilad">Fire Emergency</option>
              <option value="Meralco">Flood Victims</option>
              <option value="Bail Bond">Philhealth Sponsor</option>
              <option value="Character Reputation">Medical Assistance</option>
            </>): (docType === "Business Permit" ||docType === "Temporary Business Permit") && (
              <>
              <option value="New">New</option>
              <option value="Renewal">Renewal</option>
            </>)}
            
          </select>
        </div>
        )}
          
          {docType === "Construction Permit" && (
            <>
              <div className="form-group">
                <label className="form-label">Type of Construction Activity</label>
                <div className="main-form-radio-group">
                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="structure" name="structure" value="structure" required />
                            Structure
                        </label>
                        <label className="form-radio">
                        <input type="radio" id="renovation" name="renovation" value="renovation" required />
                            Renovation
                        </label>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="fencing" name="fencing" value="fencing" required />
                            Fencing
                        </label>
                        <label className="form-radio">
                        <input type="radio" id="excavation" name="excavation" value="excavation" required />
                            Excavation
                        </label>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="demolition" name="demolition" value="demolition" required />
                            Demolition
                        </label>
                    </div>
                </div>   
            </div>
            </>
          )}

            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name</label>
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
              <label htmlFor="middleName" className="form-label">Middle Name</label>
              <input 
                type="text"  
                id="middleName"  
                name="middleName"  
                className="form-input" 
                required  
                value={clearanceInput.middleName}
                onChange={handleChange}
                placeholder="Enter Middle Name"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name</label>
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
                  <label htmlFor="businessname" className="form-label">Business Name</label>
                  <input 
                    type="text"  
                    id="businessname"  
                    name="businessname"  
                    className="form-input"  
                    required 
                    placeholder="Enter Business Name"  
                  />
              </div>            
              <div className="form-group">
                <label htmlFor="address" className="form-label">Home Address</label>
                <input 
                  type="text"  
                  id="address"  
                  name="address"  
                  className="form-input"  
                  required 
                  placeholder="Enter Home Address"  
                />
              </div>

                <div className="form-group">
                  <label htmlFor="businessloc" className="form-label">Business Location</label>
                  <input 
                    type="text"  
                    id="businessloc"  
                    name="businessloc"  
                    className="form-input"  
                    required 
                    placeholder="Enter Home Address"  
                  />
                </div>
              </>
            ):docType ==="Construction Permit"?(
            <>
              <div className="form-group">
              <label htmlFor="address" className="form-label">Home/Office Address</label>
              <input 
                type="text"  
                id="address"  
                name="address"  
                className="form-input"  
                required 
                placeholder="Enter Home/Office Address"  
              />
            </div>
            </>
            ):(
            
            <>
              <div className="form-group">
                <label htmlFor="dateOfResidency" className="form-label">Date of Residency in Barangay Fairview</label>
                <input 
                  type="date" 
                  id="dateOfResidency" 
                  name="dateOfResidency" 
                  value={clearanceInput.dateOfResidency}
                  onChange={handleChange}
                  className="form-input" 
                  required 
                />
             </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">Address</label>
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
              <label htmlFor="birthday" className="form-label">Birthday</label>
              <input 
                type="date" 
                id="birthday" 
                name="birthday" 
                className="form-input" 
                value={clearanceInput.birthday}
                onChange={handleChange}
                required 
              />
            </div>
            
            </>)}
            

            {docType ==="Barangay ID" && (
              <div className="form-group">
                <label htmlFor="birthdayplace" className="form-label">Birthplace</label>
                <input 
                  type="text" 
                  id="birthdayplace" 
                  name="birthdayplace" 
                  className="form-input" 
                  required 
                  placeholder="Enter Birthplace" 
                />
              </div>
            )}
  

            {(docType ==="Temporary Business Permit"||docType ==="Business Permit")?(<>
              <div className="form-group">
              <label htmlFor="businessnature" className="form-label">Nature of Business</label>
              <input 
                type="text"  
                id="businessnature"  
                name="businessnature"  
                className="form-input"  
                required 
                placeholder="Enter Business Nature"  
              />
            </div>

            

            <div className="form-group">
              <label htmlFor="capital" className="form-label">Estimated Capital</label>
              <input 
                type="number"  // Ensures the input accepts only numbers
                id="capital"  
                name="capital"  
                className="form-input" 
                required 
                min="1"  // Minimum age (you can adjust this as needed)
                placeholder="Enter Estimated Capital"  
                step="1"  // Ensures only whole numbers can be entered
              />
            </div>
              
            </>):docType=="Construction Permit"?(
              <>
                <div className="form-group">
              <label htmlFor="projectloc" className="form-label">Project Location</label>
              <input 
                type="text"  
                id="projectloc"  
                name="projectloc"  
                className="form-input"  
                required 
                placeholder="Enter Project Location"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="buildingtype" className="form-label">Type of Building</label>
              <input 
                type="text"  
                id="buildingtype"  
                name="buildingtype"  
                className="form-input"  
                required 
                placeholder="Enter Business Nature"  
              />
            </div>
            
              </>)
            :(<>
              <div className="form-group">
              <label htmlFor="age" className="form-label">Age</label>
              <input 
                type="number"  // Ensures the input accepts only numbers
                id="age"  
                name="age"  
                className="form-input" 
                value={clearanceInput.age}
                onChange={handleChange}
                required 
                min="1"  // Minimum age (you can adjust this as needed)
                max="150"  // Maximum age (you can adjust this as needed)
                placeholder="Enter Age"  
                step="1"  // Ensures only whole numbers can be entered
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select 
                id="gender" 
                name="gender" 
                className="form-input" 
                required
                value={clearanceInput.gender}
                onChange={handleChange}
               >
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            </>)}
           

            {docType ==="Barangay ID" && (
              <>
                <div className="form-group">
                  <label htmlFor="religion" className="form-label">Religion</label>
                  <input 
                    type="text" 
                    id="religion" 
                    name="religion" 
                    className="form-input" 
                    required 
                    placeholder="Enter Religion" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nationality" className="form-label">Nationality</label>
                  <input 
                    type="text" 
                    id="nationality" 
                    name="nationality" 
                    className="form-input" 
                    required 
                    placeholder="Enter Nationality" 
                  />
                </div>
              </>
            )}
            
            {(docType ==="Temporary Business Permit"||docType ==="Business Permit") ? (<>
            </>) : docType==="Construction Permit" ?(
              <>
                 <div className="form-group">
              <label htmlFor="projecttitle" className="form-label">Project Title</label>
              <input 
                type="text"  
                id="projecttitle"  
                name="projecttitle"  
                className="form-input"  
                required 
                placeholder="Enter Business Nature"  
              />
            </div>
              </>
            ):(<> 
              <div className="form-group">
              <label htmlFor="civilStatus" className="form-label">Civil Status</label>
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
                  <label htmlFor="height" className="form-label">Height</label>
                  <input 
                    type="number" 
                    id="height" 
                    name="height" 
                    className="form-input" 
                    required 
                    placeholder="Enter Height" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight" className="form-label">Weight</label>
                  <input 
                    type="number" 
                    id="weight" 
                    name="weight" 
                    className="form-input" 
                    required 
                    placeholder="Enter Weight" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bloodtype" className="form-label">Blood Type</label>
                  <input 
                    type="text" 
                    id="bloodtype" 
                    name="bloodtype" 
                    className="form-input" 
                    required 
                    placeholder="Enter Blood Type" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="occupation" className="form-label">Occupation</label>
                  <input 
                    type="text" 
                    id="occupation" 
                    name="occupation" 
                    className="form-input" 
                    required 
                    placeholder="Enter Occupation" 
                  />
                </div>

            </>)}

            <div className="form-group">
              <label htmlFor="contact" className="form-label">Contact Number</label>
              <input 
                type="tel"  
                id="contact"  
                name="contact"  
                className="form-input" 
                required 
                value={clearanceInput.contact}
                onChange={handleChange}
                placeholder="Enter Contact Number"  
                maxLength={10}  // Restrict the input to 10 characters as a number
                pattern="^[0-9]{10}$"  // Regular expression to enforce a 10-digit number format
                title="Please enter a valid 10-digit contact number"  // Tooltip for invalid input
              />
            </div>

            

            {docType ==="Barangay ID" ? (
              <div className="form-group">
              <label htmlFor="precinctno" className="form-label">Precinct Number</label>
              <input 
                type="number" 
                id="precinctno" 
                name="precinctno" 
                className="form-input" 
                required 
                placeholder="Enter Precinct Number" 
              />
              </div>
            ):(docType ==="Temporary Business Permit"||docType ==="Business Permit")?(<></>)
            :docType=="Construction Permit"?(<></>):(<div className="form-group">
              <label htmlFor="citizenship" className="form-label">Citizenship</label>
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
                <label htmlFor="firstname" className="form-label">First Name</label>
                <input 
                  type="text"  
                  id="firstname"  
                  name="firstname"  
                  className="form-input"  
                  required  
                  placeholder="Enter First Name" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="middlename" className="form-label">Middle Name</label>
                <input 
                  type="text"  
                  id="middlename"  
                  name="middlename"  
                  className="form-input" 
                  required  
                  placeholder="Enter Middle Name"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastname" className="form-label">Last Name</label>
                <input 
                  type="text"  
                  id="lastname"  
                  name="lastname"  
                  className="form-input"  
                  required 
                  placeholder="Enter Last Name"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Address</label>
                <input 
                  type="text"  
                  id="address"  
                  name="address"  
                  className="form-input"  
                  required 
                  placeholder="Enter Address"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="relationship" className="form-label">Relationship</label>
                <input 
                  type="text"  
                  id="relationship"  
                  name="relationship"  
                  className="form-input"  
                  required 
                  placeholder="Enter Relationship"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactnumber" className="form-label">Contact Number</label>
                <input 
                  type="tel"  
                  id="contactnumber"  
                  name="contactnumber"  
                  className="form-input" 
                  required 
                  placeholder="Enter Contact Number"  
                  maxLength={10}  // Restrict the input to 10 characters as a number
                  pattern="^[0-9]{10}$"  // Regular expression to enforce a 10-digit number format
                  title="Please enter a valid 10-digit contact number"  // Tooltip for invalid input
                />
              </div>
            </>
          ):docType==="First Time Jobseeker" &&(
            <>
              <div className="form-group">
                <label htmlFor="educattainment" className="form-label">Educational Attainment</label>
                <input 
                  type="text"  
                  id="educattainment"  
                  name="educattainment"  
                  className="form-input"  
                  required 
                  placeholder="Enter Educational Attainment"  
                />
              </div>

            <div className="form-group">
              <label htmlFor="course" className="form-label">Course</label>
              <input 
                type="text"  
                id="course"  
                name="course"  
                className="form-input"  
                required 
                placeholder="Enter Course"  
              />
            </div>
              <br/>
            <div className="form-group">
                <label className="form-label">
                    Are you a beneficiary of a JobStart Program under RA No. 10869, otherwise known as “An Act Institutionalizing the Nationwide Implementation of the Jobstart Philippines Program and Providing Funds therefor”?
                </label>
                <div className="form-radio-group">
                    <label className="form-radio">
                    <input type="radio" id="radioYes" name="resident" value="yes" required />
                        Yes
                    </label>
                    <label className="form-radio">
                    <input type="radio" id="radioNo" name="resident" value="no" required />
                        No
                    </label>
                </div>
            </div>

            </>
        )}
          <hr/>
          <h1 className="form-requirements-title">Requirements</h1>
          

          {(docType ==="Temporary Business Permit"||docType ==="Business Permit") && (
          // WILL Have to fix this part
          <>
            <div className="signature/printedname-container">
            <h1 className="form-label">Certified True Copy of Title of the Property/Contract of Lease</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
                   // Handle file selection
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
                                  onClick={() => handleFileDelete('container1', setFiles)}
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

          <div className="barangayID-container">
            <h1 className="form-label">Certified True Copy of DTI Registration</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload2"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
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
                                  onClick={() => handleFileDelete('container2', setFiles)}
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
            <h1 className="form-label">Picture of CCTV installed in the establishment </h1>
            <h1 className="form-label-description">(for verification by Barangay Inspector)</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload4"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
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
                                  onClick={() => handleFileDelete('container4', setFiles)}
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

          <div className="signature/printedname-container">
            <h1 className="form-label"> Upload Signature Over Printed Name</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e, setFiles, 'signaturejpg');
                  }} 
                  
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
                                  onClick={() => handleFileDelete('container1', setFiles)}
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
          {docType ==="Barangay Clearance" && (
            <>
              <h1 className="form-label-reqs"> Upload either of the following requirements</h1>
              <br/>
            </>
          )}
       
          {docType === "Construction Permit" ? (<>
          
            <div className="signature/printedname-container">
            <h1 className="form-label">Certified True Copy of Title of the Property/Contract of Lease</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
               
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
                                  onClick={() => handleFileDelete('container1', setFiles)}
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

          <div className="barangayID-container">
            <h1 className="form-label">Certified True Copy of Tax Declaration</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload2"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
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
                                  onClick={() => handleFileDelete('container2',setFiles)}
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
            <h1 className="form-label">Approved Building/Construction Plan</h1>
            <div className="file-upload-container">
              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload4"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
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
                                  onClick={() => handleFileDelete('container4', setFiles)}
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
          
            <div className="barangayID-container">
            <h1 className="form-label"> Barangay ID</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload2"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles2, 'barangayIDjpg');
                  }} // Handle file selection
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
                                  onClick={() => handleFileDelete('container2', setFiles2)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles3, 'validIDjpg');
                  }} // Handle file selection
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
                                  onClick={() => handleFileDelete('container3', setFiles3)}
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
          <div className="endorsementletter-container">
            <h1 className="form-label"> Endorsement Letter from Homeowner/Sitio President</h1>
            <h1 className="form-label-description">(for residents of Barangay Fairview for less than 6 months)</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload4"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles4, 'letterjpg');
                   
                  }} // Handle file selection
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
                                  onClick={() => handleFileDelete('container4', setFiles4)}
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

    </main>

    );
}      