"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../db/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, where} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useSession } from "next-auth/react";



export default function AddResident() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    occupation: "",
    contactNumber: "",
    emailAddress: "",
    precinctNumber: "",
    generalLocation: "",
    cluster: "",
    isStudent: false,
    isPWD: false,
    isSeniorCitizen: false,
    isSoloParent: false,
  });

  const clusterOptions: Record<string, string[]> = {
    "East Fairview": [
      "Rina",
      "SAMAFA",
      "SAMAPLI",
      "SITIO KISLAP",
      "EFHAI",
    ],
    "West Fairview": [
      "AUSTIN",
      "BASILIO 1",
      "DARISNAI",
      "MUSTANG BENZ",
      "ULNA",
      "UNITED FAIRLANE",
      "URLINA",
      "VERBENA 1",
      "WEST FAIRVEW HOA",
      "TULIP RESIDENCES HOA",

    ],
    "South Fairview": [
      "AKAP",
      "ARNAI",
      "F.L.N.A",
      "FEWRANO",
      "UPPER CORVETTE HOA",
    ]
  };

  const fieldSectionMap: { [key: string]: "basic" | "full" | "others" } = {
    lastName: "basic",
    firstName: "basic",
    middleName: "basic",
    sex: "basic",
    address: "basic",
    dateOfBirth: "basic",
    age: "full",
    placeOfBirth: "full",
    civilStatus: "full",
    generalLocation: "full",
    cluster: "full",
    occupation: "full",
    contactNumber: "full",
    emailAddress: "full",
    precinctNumber: "full",
    verificationFiles: "others",
  };

  const { data: session } = useSession();
  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
  
    if (name === "age") {
      const ageValue = parseInt(value, 10) || 0;
      setFormData((prevData) => ({
        ...prevData,
        age: ageValue,
        isSeniorCitizen: ageValue >= 60,
      }));
    } else if (name === "dateOfBirth") {
      const birthDate = new Date(value);
      const today = new Date();

      if (birthDate > today) {
        setPopupErrorMessage("Date of birth cannot be in the future.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
  
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--; // adjust if birthday hasn't happened yet this year
      }
      
      if (age < 0) {
        setPopupErrorMessage("Invalid age calculated. Please check the birth date.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
      setFormData((prevData) => ({
        ...prevData,
        dateOfBirth: value,
        age: age,
        isSeniorCitizen: age >= 60,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: newValue,
      }));
    }
  };
  
  

  
  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
  
      // Ensure only one file is processed
      setIdentificationFile(selectedFile);
      setIdentificationPreview(URL.createObjectURL(selectedFile));
  
      // Reset the file input to prevent multiple selections
      e.target.value = "";
    }
  };

  const handleVerificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const selectedFiles = Array.from(e.target.files);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setVerificationFiles((prev) => [...prev, ...selectedFiles]);
    setVerificationPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }
};
  

  const handleIdentificationFileDelete = () => {
    setIdentificationFile(null);
    setIdentificationPreview(null);
  };

  const handleVerificationFileDelete = (index: number) => {
    setVerificationFiles((prev) => prev.filter((_, i) => i !== index));
    setVerificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };
  

  const handleSubmitClick = () => {
    const { firstName, lastName, address, generalLocation, cluster, dateOfBirth, age, sex, civilStatus, contactNumber } = formData;
  
    const invalidFields: string[] = [];
  
    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!address) invalidFields.push("address");
    if (!generalLocation) invalidFields.push("generalLocation");
    if (!cluster) invalidFields.push("cluster");
    if (!dateOfBirth) invalidFields.push("dateOfBirth");
    if (!age) invalidFields.push("age");
    if (!sex) invalidFields.push("sex");
    if (!civilStatus) invalidFields.push("civilStatus");
    if (!contactNumber) invalidFields.push("contactNumber");
  
    if (verificationFiles.length === 0) {
      invalidFields.push("verificationFiles");
    }
  
    if (invalidFields.length > 0) {
      const firstInvalidField = invalidFields[0];
      const section = fieldSectionMap[firstInvalidField];
      setActiveSection(section);
  
      setInvalidFields(invalidFields);
      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
  
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return;
    }
  
    // Phone number validation
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(contactNumber)) {
      setActiveSection("full");
      setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }
  
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.emailAddress && !emailRegex.test(formData.emailAddress)) {
      setActiveSection("full");
      setPopupErrorMessage("Invalid email address. Format: example@domain.com");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }
  
    // All validation passed — show confirmation popup
    setInvalidFields([]);
    setShowSubmitPopup(true);
  };


  const confirmSubmit = async () => {
    setShowSubmitPopup(false);
    setLoading(true);
  
    try {
      // Check if resident already exists by matching firstName, lastName, and middleName
      const residentsRef = collection(db, "Residents");
      const q = query(
        residentsRef,
        where("firstName", "==", formData.firstName.trim()),
        where("lastName", "==", formData.lastName.trim()),
        where("middleName", "==", formData.middleName?.trim() || "")
      );
  
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        setLoading(false);
        setPopupErrorMessage("Resident is already in the Residents Table");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
  
      // No duplicate found — proceed with actual submit
      const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
      const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  
      setLoading(false);
  
      if (!docId) {
        setPopupErrorMessage("Failed to create resident record.");
        setShowErrorPopup(true);
        return;
      }
  
      setPopupMessage("Resident Record added successfully!");
      setShowPopup(true);
  
      setTimeout(() => {
        setShowPopup(false);
        router.push(`/dashboard/ResidentModule?highlight=${docId}`);
      }, 3000);
  
    } catch (error) {
      setLoading(false);
      console.error(error);
      setPopupErrorMessage("An error occurred. Please try again.");
      setShowErrorPopup(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      let verificationFilesURLs: string[] = [];
      if (verificationFiles.length > 0) {
        for (const file of verificationFiles) {
          const storageRef = ref(storage, `ResidentsFiles/VerificationFile/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          verificationFilesURLs.push(url);
        }
      }

      let identificationFileURL = "";
      if (identificationFile) {
        const storageRef = ref(storage, `ResidentsFiles/IndentificationFile/${identificationFile.name}`);
        await uploadBytes(storageRef, identificationFile);
        identificationFileURL = await getDownloadURL(storageRef);
      }
  
      // Fetch the highest residentNumber
      const residentsRef = collection(db, "Residents");
      const q = query(residentsRef, orderBy("residentNumber", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
  
      let newResidentNumber = 1; // Default to 1 if no residents exist
  
      if (!querySnapshot.empty) {
        const lastResident = querySnapshot.docs[0].data();
        newResidentNumber = lastResident.residentNumber + 1;
      }

      const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format


      const docRef = await addDoc(residentsRef, {
        ...formData,
        residentNumber: newResidentNumber,
        createdAt: currentDate,
        verificationFilesURLs,
        identificationFileURL,
        createdBy: session?.user?.position || "Unknown",
      });
      return docRef.id; // return ID
  
    
    } catch (err) {
      setError("Failed to add resident");
      console.error(err);
    } 
  
    setLoading(false);
  };
  
  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule";
  };

const [activeSection, setActiveSection] = useState("basic");
// options: "basic", "full", "others"






  return (
      <main className="add-resident-main-container">

          <div className="add-resident-main-content">

            <div className="add-resident-main-section1">
              <div className="add-resident-main-section1-left">
                <button onClick={handleBack}>
                  <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                </button>

                <h1> Add New Resident </h1>
              </div>

              <div className="action-btn-section">
                {/*<button className="action-view" type="submit" form="addResidentForm" disabled={loading}>*/}
                <button className="action-view"  onClick={handleSubmitClick} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
              
            </div>
          

            <div className="add-resident-bottom-section">
                <nav className="info-toggle-wrapper">
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



                <div className="add-resident-bottom-section-scroll">

                  <form id="addResidentForm" onSubmit={handleSubmit} className="add-resident-section-2">
                    {/* Left Side - Resident Form */}

                    {activeSection === "basic" && (
                        <>
                        <div className="add-main-resident-section-2-full-top">  
                          <div className="add-main-resident-section-2-left-side">
                              <div className="fields-section">
                                <p>Last Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className={`add-resident-input-field ${invalidFields.includes("lastName") ? "input-error" : ""}`}
                                  placeholder="Enter Last Name"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleChange}
                                  required
                                />
                              </div>

                              <div className="fields-section">
                                <p>First Name<span className="required">*</span></p>
                                <input
                                  type="text"
                                  className={`add-resident-input-field ${invalidFields.includes("firstName") ? "input-error" : ""}`}
                                  placeholder="Enter First Name"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleChange}
                                  required
                                />
                              </div>

                              <div className="fields-section">
                                <p>Middle Name</p>
                                <input
                                  type="text"
                                  className="add-resident-input-field"
                                  placeholder="Enter Middle Name"
                                  name="middleName"
                                  value={formData.middleName}
                                  onChange={handleChange}
                                />
                              </div>
                       
                          </div>

                          <div className="add-main-resident-section-2-right-side">
                            
                              <div className="fields-section">
                                <p>Sex<span className="required">*</span></p>
                                <select
                                  name="sex"
                                  className={`add-resident-input-field ${invalidFields.includes("sex") ? "input-error" : ""}`}
                                  value={formData.sex}
                                  onChange={handleChange}
                                  required>
                                  <option value="" disabled>Choose Gender</option>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                </select>
                              </div>

                              <div className="fields-section">
                                    <p>Address<span className="required">*</span></p>
                                    <input 
                                      type="text"
                                      className={`add-resident-input-field ${invalidFields.includes("address") ? "input-error" : ""}`}
                                      placeholder="Enter Address"
                                      name="address"
                                      value={formData.address}
                                      onChange={handleChange}
                                      required />
                              </div>

                              <div className="fields-section">
                                    <p>Date of Birth<span className="required">*</span></p>
                                    <input 
                                      type="date"
                                      className={`add-resident-input-field ${invalidFields.includes("dateOfBirth") ? "input-error" : ""}`}
                                      name="dateOfBirth"
                                      value={formData.dateOfBirth}
                                      onChange={handleChange}
                                      max={new Date().toISOString().split("T")[0]}
                                      required />
                                  </div>

                              
                          </div>
                        </div>
                        </>
                      )}

                      {activeSection === "full" && (
                        <>
                        <div className="add-main-resident-section-2-full-top">

                          <div className="add-main-resident-section-2-left-side">
                                <div className="fields-section">
                                  <p>Age<span className="required">*</span></p>
                                  <input 
                                    type="number"
                                    className={`add-resident-input-field ${invalidFields.includes("age") ? "input-error" : ""}`}
                                    placeholder="Enter Age"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    readOnly />
                                </div>

                                    <div className="fields-section">
                                      <p>Place of Birth</p>
                                      <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />
                                    </div>
                                  

                                    <div className="fields-section">
                                      <p>Civil Status<span className="required">*</span></p>
                                      <select 
                                        name="civilStatus"
                                        className={`add-resident-input-field ${invalidFields.includes("civilStatus") ? "input-error" : ""}`}
                                        value={formData.civilStatus}
                                        onChange={handleChange}
                                        required>
                                        <option value="" disabled>Choose Civil Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Separated">Separated</option>
                                      </select>
                                    </div>

                                    <div className="fields-section">
                                      <p>Location<span className="required">*</span></p>
                                      <select
                                        name="generalLocation"
                                        className={`add-resident-input-field ${invalidFields.includes("generalLocation") ? "input-error" : ""}`}
                                        value={formData.generalLocation}
                                        onChange={handleChange}
                                        required
                                      >
                                        <option value="" disabled>Choose Part of Fairview</option>
                                        <option value="East Fairview">East Fairview</option>
                                        <option value="West Fairview">West Fairview</option>
                                        <option value="South Fairview">South Fairview</option>
                                      </select>
                                  </div>
                                  
                            </div>


                              <div className="add-main-resident-section-2-right-side">
                                    <div className="fields-section">
                                      <p>Occupation</p>
                                      <input type="text" className="add-resident-input-field" placeholder="Enter Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
                                    </div>
                                    
                                    <div className="fields-section">
                                      <p>Contact Number<span className="required">*</span></p>
                                      <input 
                                        type="tel" 
                                        className={`add-resident-input-field ${invalidFields.includes("contactNumber") ? "input-error" : ""}`}
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={(e) => {
                                          const input = e.target.value;
                                          if (/^\d{0,11}$/.test(input)) {
                                            setFormData({ ...formData, contactNumber: input });
                                          }
                                        }}
                                        pattern="^[0-9]{11}$" 
                                        placeholder="Enter 11-digit phone number" 
                                      />
                                    </div>

                                    <div className="fields-section">
                                      <p>Email Address</p>
                                      <input type="email" className="add-resident-input-field" placeholder="Enter Email Address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />
                                    </div>

                                    <div className="fields-section">
                                      <p>Precinct Number</p>
                                      <input type="text" className="add-resident-input-field" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
                                    </div> 
                                    
                            </div>

                          </div>

                          <div className="add-main-resident-section-2-full-bottom">  
                          
                          <div className="add-main-resident-section-2-cluster">
                            <div className="fields-section">
                              <p>Cluster/Section<span className="required">*</span></p>
                              <select
                                name="cluster"
                                className={`add-resident-input-field ${invalidFields.includes("cluster") ? "input-error" : ""}`}
                                value={formData.cluster || ""}
                                onChange={handleChange}
                                required
                                disabled={!formData.generalLocation} // Optional: disables until a location is picked
                              >
                                <option value="" disabled>
                                  {formData.generalLocation ? "Choose HOA/Sitio" : "Select Location First"}
                                </option>
                                {formData.generalLocation &&
                                  clusterOptions[formData.generalLocation].map((option, index) => (
                                    <option key={index} value={option}>
                                      {option}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                          </div>
                        </>
                      )}

                      {activeSection === "others" && (
                        <>
                          
                          <div className="add-main-resident-others-mainsection">

                            <div className="add-main-resident-section-2-top-side">
                              <div className="box-container-outer-resclassification">
                                <div className="title-resclassification">
                                  Resident Classification
                                </div>

                                <div className="box-container-resclassification">
                                  <div className="checkbox-container">
                                    <label className="checkbox-label">
                                      <input type="checkbox" name="isStudent" checked={formData.isStudent} onChange={handleChange} />
                                      Student
                                    </label>
                                  </div>

                                  <div className="checkbox-container">
                                    <label className="checkbox-label">
                                      <input type="checkbox" name="isPWD" checked={formData.isPWD} onChange={handleChange} />
                                      PWD
                                    </label>
                                  </div>

                                  <div className="checkbox-container">
                                    <label className="checkbox-label">
                                      <input type="checkbox" name="isSoloParent" checked={formData.isSoloParent} onChange={handleChange} />
                                      Solo Parent
                                    </label>
                                  </div>  
                                </div>
                              </div> 
                            </div>


                            <div className="add-main-resident-section-2-bottom-side">

                            <div className="box-container-outer-resindentificationpic">
                                <div className="title-resindentificationpic">
                                  Identification Picture
                                </div>

                                <div className="box-container-resindentificationpic">

                                  {/* File Upload Section */}
                                  <div className="file-upload-container">
                                      <label htmlFor="identification-file-upload" className="upload-link">Click to Upload File</label>
                                      <input id="identification-file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleIdentificationFileChange} />


                                      {identificationFile && (
                                        <div className="file-name-image-display">
                                          <div className="file-name-image-display-indiv">
                                            {identificationPreview && <img src={identificationPreview} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />}
                                            <span>{identificationFile.name}</span>
                                            <div className="delete-container">
                                              <button type="button" onClick={handleIdentificationFileDelete} className="delete-button">
                                                <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                   
                                </div>
                              </div> 
                              

                              <div className="box-container-outer-verificationdocs">
                                <div className="title-verificationdocs">
                                  Verification Documents
                                </div>

                                <div className={`box-container-verificationdocs ${invalidFields.includes("verificationFiles") ? "input-error" : ""}`}>
                                <span className="required-asterisk">*</span>

                                  {/* File Upload Section */}
                                  <div className="file-upload-container">
                                      <label htmlFor="verification-file-upload" className="upload-link">Click to Upload File</label>
                                      <input id="verification-file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleVerificationFileChange} required/>


                                      {verificationFiles.length > 0 && (
                                        <div className="file-name-image-display">
                                          {verificationFiles.map((file, index) => (
                                            <div key={index} className="file-name-image-display-indiv">
                                              {verificationPreviews[index] && (
                                                <img src={verificationPreviews[index]} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />
                                              )}
                                              <span>{file.name}</span>
                                              <div className="delete-container">
                                                <button type="button" onClick={() => handleVerificationFileDelete(index)} className="delete-button">
                                                  <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  
                                </div>
                              </div> 



                              
                            </div>



                          </div>    
                        </>
                      )}
                  </form>
                </div>
                

            </div>
              



          

          {error && <p className="error">{error}</p>}
        </div>


        {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add-resident">
                            <div className="confirmation-popup-add-resident">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add-resident show`}>
                    <div className="popup-add-resident">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add-resident show`}>
                    <div className="popup-add-resident">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
      </main>
  );
}