"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function EditResident() {

  const { data: session } = useSession();

  const router = useRouter();
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");

  const [formData, setFormData] = useState({
    residentNumber: 0,
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
    fileURL: "",
    updatedBy: "",
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


  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [originalData, setOriginalData] = useState({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  
  const handleDiscardClick = async () => {
    setShowDiscardPopup(true);
  }

  const confirmDiscard = async () => {
      setShowDiscardPopup(false);

      setFormData(originalData); // Reset to original data
      setPreview(originalData.fileURL || null);
      setFile(null); // Reset file selection

      setPopupMessage("Changes discarded successfully!");
      setShowPopup(true);
      

      // Hide the popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);

  };



  useEffect(() => {
    if (residentId) {
      const fetchResidentData = async () => {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = {
            residentNumber: docSnap.data().residentNumber || 0,
            firstName: docSnap.data().firstName || "",
            lastName: docSnap.data().lastName || "",
            middleName: docSnap.data().middleName || "",
            address: docSnap.data().address || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            placeOfBirth: docSnap.data().placeOfBirth || "",
            age: docSnap.data().age || 0,
            sex: docSnap.data().sex || "",
            civilStatus: docSnap.data().civilStatus || "",
            occupation: docSnap.data().occupation || "",
            contactNumber: docSnap.data().contactNumber || "",
            emailAddress: docSnap.data().emailAddress || "",
            precinctNumber: docSnap.data().precinctNumber || "",
            generalLocation: docSnap.data().generalLocation || "",
            cluster: docSnap.data().cluster || "",
            isStudent: docSnap.data().isStudent || false,
            isPWD: docSnap.data().isPWD || false,
            isSeniorCitizen: docSnap.data().isSeniorCitizen || false,
            isSoloParent: docSnap.data().isSoloParent || false,
            fileURL: docSnap.data().fileURL || "",
            updatedBy: docSnap.data().updatedBy || "",
          };

          setFormData(data);
          setOriginalData(data); // Store original data
          setPreview(docSnap.data().fileURL || null);
        }
      };
      fetchResidentData();
    }
  }, [residentId]);

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
  
    if (name === "dateOfBirth" && typeof newValue === 'string') {
      const birthDate = new Date(newValue);
      const today = new Date();
  
      if (birthDate > today) {
        setPopupErrorMessage("Date of birth cannot be in the future.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
  
      const age = calculateAge(newValue);
      if (age < 0) {
        setPopupErrorMessage("Invalid age calculated. Please check the birth date.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
      }
  
      setFormData((prevData) => ({
        ...prevData,
        [name]: newValue,
        age: age,
        isSeniorCitizen: age >= 60,
      }));
      return;
    }
  
    setFormData((prevData) => {
      let updatedData = {
        ...prevData,
        [name]: newValue,
      };
  
      if (name === "generalLocation") {
        updatedData.cluster = ""; // Reset cluster if location changes
      }
  
      return updatedData;
    });
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };

  const handleFileDelete = async () => {
    if (formData.fileURL) {
      try {
        const storageRef = ref(storage, formData.fileURL); // Get the reference of the file in Firebase Storage
        await deleteObject(storageRef); // Delete the file from Firebase Storage
        console.log("File deleted successfully from storage");
      } catch (err) {
        console.error("Error deleting file from storage:", err);
      }
    }
  
    setFile(null); // Reset the file input
    setPreview(null); // Reset the preview
    setFormData((prev) => ({ ...prev, fileURL: "" })); // Reset the file URL in the form data
  };


  const handleSaveClick = async () => {
    setShowSavePopup(true);
  } 

  const confirmSave = async () => {
    setShowSavePopup(false);

    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);

      router.push("/dashboard/ResidentModule");
    }, 3000);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let fileURL = formData.fileURL;
      if (file) {
        const storageRef = ref(storage, `ResidentsFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, "Residents", residentId!);
      await updateDoc(docRef, {
        ...formData,
        fileURL,
        updatedBy: session?.user?.position,
      });

    } catch (err) {
      setError("Failed to update resident");
      console.error(err);
    }

    setLoading(false);
  };
  
    const handleBack = () => {
      window.location.href = "/dashboard/ResidentModule";
    };
  

    return (
        <main className="add-resident-main-container">
          <div className="addresident-page-title-section-1">
            <h1>Main Residents</h1>
          </div>
          <div className="add-resident-main-content">
            <div className="add-resident-main-section1">
              <div className="add-resident-main-section1-left">
                <button onClick={handleBack}>
                  <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                </button>

                <h1> Edit Resident </h1>
              </div>

              <div className="action-btn-section">
                <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
                <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
              
            </div>

          <hr/>

  
            <form id="editResidentForm" onSubmit={handleSubmit} className="add-resident-section-2">
              {/* Left Side - Resident Form */}
              <div className="add-resident-section-2-left-side">

                <div className="fields-container">
                  <div className="fields-section">
                    <p>Resident Number</p>
                    <input type="text" className="add-resident-input-field-disabled" name="residentNumber" value={formData.residentNumber} onChange={handleChange} disabled />
                  </div>

                  <div className="fields-section">
                    <p>First Name<span className="required">*</span></p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                  </div>

                  <div className="fields-section">
                    <p>Last Name<span className="required">*</span></p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                  </div>

                  <div className="fields-section">
                    <p>Middle Name</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} required />
                  </div>

                  <div className="fields-section">
                    <p>Address<span className="required">*</span></p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  
                  <div className="fields-section">
                    <p>Location<span className="required">*</span></p>
                    <select name="generalLocation" className="add-resident-input-field" value={formData.generalLocation} onChange={handleChange} required>
                      <option value="" disabled>Choose Part of Fairview</option>
                      <option value="East Fairview">East Fairview</option>
                      <option value="West Fairview">West Fairview</option>
                      <option value="South Fairview">South Fairview</option>
                    </select>
                  </div>

                    {formData.generalLocation && (
                      <div className="fields-section">
                        <p>Cluster<span className="required">*</span></p>
                        <select
                          name="cluster"
                          className="add-resident-input-field"
                          value={formData.cluster}
                          onChange={handleChange}
                          required
                        >
                          <option value="" disabled>Choose HOA/Sitio</option>
                          {clusterOptions[formData.generalLocation].map((cluster) => (
                            <option key={cluster} value={cluster}>
                              {cluster}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

    
                  <div className="fields-section">
                    <p>Place of Birth</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required />
                  </div>
                  
                  <div className="fields-section">
                    <p>Date of Birth<span className="required">*</span></p>
                    <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split("T")[0]} required />
                  </div>

                  <div className="fields-section">
                    <p>Age</p>
                    <input type="number" className="add-resident-input-field" placeholder="Enter Age" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" readOnly/>
                  </div>
                
    
                  <div className="fields-section">
                    <p>Sex<span className="required">*</span></p>
                    <select name="sex" className="add-resident-input-field" value={formData.sex} onChange={handleChange} required>
                      <option value="" disabled>Choose Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div className="fields-section">
                    <p>Civil Status<span className="required">*</span></p>
                    <select name="civilStatus" className="add-resident-input-field" value={formData.civilStatus} onChange={handleChange} required>
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
                    <input type="tel" className="add-resident-input-field" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required pattern="[0-9]{11}" placeholder="Enter 11-digit phone number" />
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
  
                {/* File Upload Section Paayos na lang dito mapapasok yung new image*/}
                <div className="file-upload-container">  
                  <label htmlFor="file-upload" className="upload-link">Click to Upload File</label>
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="file-upload-input" 
                    accept=".jpg,.jpeg,.png" 
                    onChange={handleFileChange} 
                  />

                  {/* Current Image Section */}
                  {formData.fileURL && (
                    <div className="file-name-image-display">
                      <span className="section-title">Current Image</span>
                      <div className="file-name-image-display-indiv">
                        <img src={formData.fileURL} alt="Current Resident Image" style={{ width: "100px", height: "100px" }} />
                        <div className="delete-container">
                          <button type="button" onClick={handleFileDelete} className="delete-button">
                            <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Image Section (Only if a file is uploaded) */}
                  {file && (
                    <div className="file-name-image-display">
                      <span className="section-title">New Image</span>
                      <div className="file-name-image-display-indiv">
                        <img src={preview || ""} alt="New Resident Image" style={{ width: "100px", height: "100px" }} />
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

          {showDiscardPopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to discard the changes?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmDiscard} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

          {showSavePopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to save the changes?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSavePopup(false)} className="no-button-add">No</button> 
                                    <button onClick={confirmSave} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
            )}
                    

          {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}
        {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
        </main>
    );
  }