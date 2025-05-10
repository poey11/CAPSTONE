"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../db/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
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

  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [newDocId, setNewDocId] = useState<string | null>(null);
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
  
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
  
      // Ensure only one file is processed
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
  
      // Reset the file input to prevent multiple selections
      e.target.value = "";
    }
  };
  
  const handleFileDelete = () => {
    setFile(null);
    setPreview(null);
  };
  

  const handleSubmitClick = async () => {
    const { 
      firstName, lastName, address, generalLocation, dateOfBirth, 
      age, sex, civilStatus, contactNumber,  emailAddress
  } = formData;
  
    const invalidFields: string[] = [];

    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!address) invalidFields.push("address");
    if (!generalLocation) invalidFields.push("generalLocation");
    if (!dateOfBirth) invalidFields.push("dateOfBirth");
    if (!age) invalidFields.push("age"); 
    if (!sex) invalidFields.push("sex");
    if (!civilStatus) invalidFields.push("civilStatus");
    if (!contactNumber) invalidFields.push("contactNumber");
    if (!emailAddress) invalidFields.push("emailAddress");


    if (invalidFields.length > 0) {
      setInvalidFields(invalidFields);
      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
  
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return;
    }
    
    // Phone number validation logic
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(contactNumber)) {
      setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(emailAddress)) {
      setPopupErrorMessage( "Invalid email address. Format: example@domain.com" );
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return;
    }

    setInvalidFields([]);
    setShowSubmitPopup(true);
};

/*
const confirmSubmit = async () => {
  setShowSubmitPopup(false);

  setPopupMessage("Resident Record added successfully!");
  setShowPopup(true);

  // Hide the popup after 3 seconds
  setTimeout(() => {
    setShowPopup(false);
    //router.push("/dashboard/ResidentModule");
    router.push(`/dashboard/ResidentModule?highlight=${newDocId}`);
  }, 3000);

  // Create a fake event and call handleSubmit
  const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
  await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
};*/

const confirmSubmit = async () => {
  setShowSubmitPopup(false);

  // Wait for handleSubmit to finish and set newDocId
  const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
  const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);

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
};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      let fileURL = "";
      if (file) {
        const storageRef = ref(storage, `ResidentsFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
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
  
      // Add the new resident with an incremented residentNumber
      /*await addDoc(residentsRef, {
        ...formData,
        residentNumber: newResidentNumber,
        createdAt: currentDate,
        fileURL,
        createdBy: session?.user?.position || "Unknown",
      });*/

      const docRef = await addDoc(residentsRef, {
        ...formData,
        residentNumber: newResidentNumber,
        createdAt: currentDate,
        fileURL,
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

  return (
      <main className="add-resident-main-container">
        <div className="path-section">
          <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
          <h1 className="breadcrumb">
            <Link href="/dashboard/ResidentModule">Main Residents</Link>
            <span className="chevron">/</span>
          </h1>
          <h2 className="breadcrumb">Add Resident<span className="chevron"></span></h2>
        </div>

        <div className="addresident-page-title-section-1">
          <h1>Main Residents</h1>
        </div>
        
        <div className="add-resident-main-content">
          <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> New Resident </h1>
            </div>

            <div className="action-btn-section">
              {/*<button className="action-view" type="submit" form="addResidentForm" disabled={loading}>*/}
              <button className="action-view"  onClick={handleSubmitClick} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            
          </div>
          
          <hr/>


          <form id="addResidentForm" onSubmit={handleSubmit} className="add-resident-section-2">
            {/* Left Side - Resident Form */}
            <div className="add-resident-section-2-left-side">
              <div className="fields-container">
              <div className="fields-section">
                  <p>Last Name<span className="required">*</span></p>
                  <input type="text"
                  className={`add-resident-input-field ${invalidFields.includes("lastName") ? "input-error" : ""}`}
                    placeholder="Enter Last Name"
                     name="lastName"
                      value={formData.lastName}
                       onChange={handleChange}
                        required />
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
                   required />
                </div>

                <div className="fields-section">
                  <p>Middle Name</p>
                  <input type="text" className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
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

                {formData.generalLocation && (
                  <div className="fields-section">
                    <p>Cluster/Section<span className="required">*</span></p>
                    <select
                      name="cluster"
                      className={`add-resident-input-field ${invalidFields.includes("cluster") ? "input-error" : ""}`}
                      value={formData.cluster || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Choose HOA/Sitio</option>
                      {clusterOptions[formData.generalLocation].map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}



                <div className="fields-section">
                  <p>Place of Birth</p>
                  <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />
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

            {/* Right Side - Checkboxes & File Upload */}
            <div className="add-resident-section-2-right-side">
              <div className="checkboxes-container">
                <p>Student</p>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" name="isStudent" checked={formData.isStudent} onChange={handleChange} />
                    Is this resident a student?
                  </label>
                </div>

                <p>PWD</p>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" name="isPWD" checked={formData.isPWD} onChange={handleChange} />
                    Is this resident a person with disability?
                  </label>
                </div>

                <p>Solo Parent</p>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" name="isSoloParent" checked={formData.isSoloParent} onChange={handleChange} />
                    Is this resident a solo parent?
                  </label>
                </div>
              </div>



              {/* File Upload Section */}
              <div className="file-upload-container">
                <label htmlFor="file-upload" className="upload-link">Click to Upload File</label>
                <input id="file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />

                {file && (
                  <div className="file-name-image-display">
                    <div className="file-name-image-display-indiv">
                      {preview && <img src={preview} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />}
                      <span>{file.name}</span>
                      <div className="delete-container">
                        <button type="button" onClick={handleFileDelete} className="delete-button">
                          <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              
              </div>
            </div>
          </form>

          {error && <p className="error">{error}</p>}
        </div>


        {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add-resident">
                            <div className="confirmation-popup-add-resident">
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