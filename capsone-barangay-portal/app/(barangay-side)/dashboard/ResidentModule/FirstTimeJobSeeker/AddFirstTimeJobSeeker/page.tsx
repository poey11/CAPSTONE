"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSession } from "next-auth/react";
import { useRef } from "react";

export default function AddFirstTimeJobSeeker() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dateApplied: new Date().toISOString().split("T")[0],
    lastName: "", //-
    firstName: "", //-
    middleName: "", //-
    age: 0,
    dateOfBirth: "", // YYYY-MM-DD format from input
    monthOfBirth: "",
    dayOfBirth: "",
    yearOfBirth: "",
    sex: "",
    remarks: "",
    residentId: "",
    identificationFileURL: "",
  });

  const fieldSectionMap: { [key: string]: "full" | "others" } = {
    dateApplied: "full",
    lastName: "full",
    firstName: "full",
    middleName: "full",
    age: "full",
    dateOfBirth: "full",
    sex: "full",
    remarks: "others",
    verificationFiles: "others",
    identificationFile: "others"
  };

  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);


  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);

  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const employerPopupRef = useRef<HTMLDivElement>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue: any = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
  
    if (name === "dateOfBirth") {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
  
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--; // Birthday hasn't happened yet this year
      }
  
      setFormData((prevData) => ({
        ...prevData,
        dateOfBirth: value,
        age: age,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: newValue,
      }));
    }
  };
  

  // Format Date of Birth into Separate Parts
  const formatDateParts = (dateString: string) => {
    if (!dateString) return { monthOfBirth: "", dayOfBirth: "", yearOfBirth: "" };

    const [year, month, day] = dateString.split("-");
    return { monthOfBirth: month, dayOfBirth: day, yearOfBirth: year };
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
    const { lastName, middleName, firstName, dateApplied, dateOfBirth, age, sex } = formData;
  
    const invalidFields: string[] = [];
  
    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!dateApplied) invalidFields.push("dateApplied");
    if (!dateOfBirth) invalidFields.push("dateOfBirth");
    if (!age) invalidFields.push("age");
    if (!sex) invalidFields.push("sex");
  
    if (verificationFiles.length === 0) {
      invalidFields.push("verificationFiles");
    }

      if (invalidFields.length > 0) {
        // Set the section based on the first invalid field
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
    
      setInvalidFields([]);
      setShowSubmitPopup(true);
  };
  


  const confirmSubmit = async () => {
    setShowSubmitPopup(false);
  
    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);

    if (!docId) {
      setPopupErrorMessage("Failed to create First-Time Jobseeker Record.");
      setShowErrorPopup(true);
      return;
    }

    setPopupMessage("First-Time Jobseeker Record added successfully!");
    setShowPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
      router.push(`/dashboard/ResidentModule/FirstTimeJobSeeker?highlight=${docId}`);
    }, 3000);

  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      let verificationFilesURLs: string[] = [];
      if (verificationFiles.length > 0) {
        for (const file of verificationFiles) {
          const storageRef = ref(storage, `ResidentsFiles/VerificationFiles/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          verificationFilesURLs.push(url);
        }
      }
  
      // Extract Month, Day, and Year from Date of Birth
      const { monthOfBirth, dayOfBirth, yearOfBirth } = formatDateParts(formData.dateOfBirth);
  
      // Ensure dateApplied is stored as YYYY-MM-DD in Firestore
      const formattedDateApplied = formData.dateApplied
        ? new Date(formData.dateApplied).toISOString().split("T")[0]
        : "";

      const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
  
      // Save to Firestore
      const docRef = await addDoc(collection(db, "JobSeekerList"), {
        ...formData,
        monthOfBirth,
        dayOfBirth,
        yearOfBirth,
        dateApplied: formattedDateApplied,
        verificationFilesURLs,
        identificationFileURL: formData.identificationFileURL,
        createdAt: currentDate,
        createdBy: session?.user?.position || "Unknown",
      });

      return docRef.id; // return ID
  
    } catch (err) {
      setError("Failed to add job seeker");
      console.error(err);
    }
  
    setLoading(false);
  };
  

  // Handle back navigation
  const handleBack = () => {
    router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
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



  const handleVerificationFileDelete = (index: number) => {
    setVerificationFiles((prev) => prev.filter((_, i) => i !== index));
    setVerificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

  // Show popup on input focus
    const handleJobseekerClick = () => {
      setShowResidentsPopup(true);
    };
  
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
  
    const filteredResidents = residents.filter((resident) =>
      `${resident.firstName} ${resident.middleName} ${resident.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const [activeSection, setActiveSection] = useState("full");
  const [isResidentSelected, setIsResidentSelected] = useState(false);

  return (
    <main className="add-resident-main-container">

      {/*}
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker">First-Time Job Seeker List</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">Add First-Time Job Seeker<span className="chevron"></span></h2>
      </div>

      <div className="addresident-page-title-section-1">
      <h1>First-Time Job Seeker List</h1>
      </div>*/}

      <div className="add-resident-main-content">
          <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/I  mages/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> Add New First-Time Job Seeker </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view"  onClick={handleSubmitClick} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="add-resident-bottom-section">
            <nav className="jobseeker-info-toggle-wrapper">
              {["full", "others"].map((section) => (
                <button
                  key={section}
                  type="button"
                  className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                >
                  {section === "full" && "Full Info"}
                  {section === "others" && "Others"}
                </button>
              ))}
            </nav>

            <div className="add-jobseeker-bottom-section-scroll">

            <div className="input-wrapper">
                  <div className="input-with-clear">
                    <input
                      type="text"
                      className="select-resident-input-field"
                      placeholder="Select Resident"
                      onClick={handleJobseekerClick}
                      value={
                        isResidentSelected
                          ? `${formData.firstName} ${formData.middleName} ${formData.lastName}`
                          : ''
                      }
                      readOnly
                    />
                    {isResidentSelected && (
                      <span
                        className="clear-icon"
                        title="Click to clear selected complainant"
                        onClick={() => {
                          setFormData({
                            dateApplied: "",
                            lastName: "",
                            firstName: "", 
                            middleName: "",
                            age: 0,
                            dateOfBirth: "",
                            monthOfBirth: "",
                            dayOfBirth: "",
                            yearOfBirth: "",
                            sex: "",
                            remarks: "",
                            residentId: "",
                            identificationFileURL: "",
                          });
                          setIsResidentSelected(false);
                        }}
                      >
                        ×
                      </span>
                    )}
                  </div>
                  {isResidentSelected && (
                    <p className="help-text">Click the <strong>×</strong> to clear the selected complainant.</p>
                  )}
                </div>

            <form id="addJobSeekerForm" onSubmit={handleSubmit} className="add-resident-section-2">

              {activeSection === "full" && (
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
                            readOnly
                            required
                          />
                      </div>

                      <div className="fields-section">
                        <p>First Name<span className="required">*</span></p>
                        <input type="text"
                        className={`add-resident-input-field ${invalidFields.includes("firstName") ? "input-error" : ""}`}
                        placeholder="Enter First Name" 
                        name="firstName"
                        value={formData.firstName} 
                        onChange={handleChange} 
                        required 
                        readOnly
                        />
                      </div>

                      <div className="fields-section">
                        <p>Middle Name</p>
                        <input type="text"
                          className={`add-resident-input-field ${invalidFields.includes("middleName") ? "input-error" : ""}`}
                          placeholder="Enter Middle Name"
                          name="middleName" 
                          value={formData.middleName} 
                          onChange={handleChange}
                          readOnly
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
                          required
                          disabled
                          >
                          <option value="" disabled>Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div className="fields-section">
                        <p>Date of Birth<span className="required">*</span></p>
                        <input type="date"
                        className={`add-resident-input-field ${invalidFields.includes("dateOfBirth") ? "input-error" : ""}`}
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          max={new Date().toISOString().split("T")[0]} 
                          required 
                          readOnly
                          />
                      </div>

                      <div className="fields-section">
                        <p>Age<span className="required">*</span></p>
                        <input 
                          type="number"
                          className={`add-resident-input-field ${invalidFields.includes("sex") ? "input-error" : ""}`}
                          placeholder="Enter Age"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="add-main-resident-section-2-full-bottom">
                    <div className="add-main-resident-section-2-cluster">
                      <div className="fields-section">
                        <p>Date Applied<span className="required">*</span></p>
                        <input 
                          type="date"
                          className={`add-resident-input-field ${invalidFields.includes("dateApplied") ? "input-error" : ""}`}
                          name="dateApplied" 
                          value={formData.dateApplied} 
                          onChange={handleChange}
                          required 
                          readOnly
                          />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "others" && (
                <>
                  <div className="add-main-resident-others-mainsection">
                    <div className="add-main-resident-section-2-top-side">

                    <div className="jobseeker-photo-section-voter">
                        <span className="resident-details-label-voter">Identification Picture</span>

                        <div className="resident-profile-container-voter">
                          <img
                              src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                              alt="Resident"
                              className={
                                formData.identificationFileURL
                                  ? "resident-picture uploaded-picture"
                                  : "resident-picture default-picture"
                              }
                          /> 
                        </div>
                      </div>

                      
                    </div>
                    <div className="add-main-resident-section-2-bottom-side">
                      <div className="box-container-outer-resclassification">
                        <div className="title-remarks">
                          Remarks
                        </div>
                        <div className="box-container-remarks">
                          <textarea className="remarks-input-field" placeholder="Enter Remarks" name="remarks" value={formData.remarks} onChange={handleChange} />

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
                                        <img src="/Images/trash.png" alt="Delete" className="delete-icon" />
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

        

        <form id="addJobSeekerForm" onSubmit={handleSubmit} className="add-resident-section-2">
          <div className="add-resident-section-2-left-side">
            <div className="fields-container">
        
                
                
              
              
              <div className="fields-section">
                <p>Remarks</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Remarks" name="remarks" value={formData.remarks} onChange={handleChange} />
              </div>
           </div>
          </div>
            {/* Right Side - Checkboxes & File Upload */}
            <div className="add-resident-section-2-right-side">
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
                          <img src="/Images/trash.png" alt="Delete" className="delete-icon" />
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
                        <div className="confirmation-popup-overlay-add-jobseeker">
                            <div className="confirmation-popup-add-jobseeker">
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
                <div className={`popup-overlay-add-jobseeker show`}>
                    <div className="popup-add-jobseeker">
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add-jobseeker show`}>
                    <div className="popup-add-jobseeker">
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
                  const votersSnapshot = await getDocs(collection(db, "JobSeekerList"));
                  const isDuplicate = votersSnapshot.docs.some((doc) => {
                    const data = doc.data();
                    return (
                      data.lastName?.toLowerCase() === resident.lastName?.toLowerCase() &&
                      data.firstName?.toLowerCase() === resident.firstName?.toLowerCase() &&
                      data.middleName?.toLowerCase() === resident.middleName?.toLowerCase() &&
                      data.dateOfBirth === resident.dateOfBirth
                    );
                  });

                  if (isDuplicate) {
                    setPopupErrorMessage("Resident is already in the Jobseeker Database.");
                    setShowErrorPopup(true);
                    setTimeout(() => {
                      setShowErrorPopup(false);
                    }, 3000);
                    return;
                  }

                  // Not a duplicate, proceed to set the form
                  setFormData({
                    ...formData,
                    residentId: resident.id,
                    lastName: resident.lastName || '',
                    firstName: resident.firstName || '',
                    middleName: resident.middleName || '',
                    sex: resident.sex || '',
                    dateOfBirth: resident.dateOfBirth || '',
                    age: resident.age || '',
                    identificationFileURL: resident.identificationFileURL || '',
                  });
                  setIsResidentSelected(true);
                  setShowResidentsPopup(false);
                } catch (error) {
                  console.error("Error checking for duplicates:", error);
                  setPopupErrorMessage("An error occurred. Please try again.");
                  setShowErrorPopup(true);
                  setTimeout(() => {
                    setShowErrorPopup(false);
                  }, 3000);
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
