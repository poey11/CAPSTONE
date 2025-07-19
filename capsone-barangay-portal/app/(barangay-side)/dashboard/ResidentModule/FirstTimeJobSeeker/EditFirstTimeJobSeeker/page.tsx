"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export default function EditFirstTimeJobSeeker() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [originalData, setOriginalData] = useState<any>(null);

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);

  const [invalidFields, setInvalidFields] = useState<string[]>([]);

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

  const handleDiscardClick = () => setShowDiscardPopup(true);

  const confirmDiscard = () => {
    setShowDiscardPopup(false);

      setFormData(originalData); // Reset to original data
      setIdentificationPreview(originalData.identificationFileURL || null);
      setIdentificationFile(null); // Reset file selection
      setVerificationPreviews(originalData.verificationFilesURLs || []);
      setVerificationFiles([]); // Reset file selection

      setPopupMessage("Changes discarded successfully!");
      setShowPopup(true);
      

      // Hide the popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
  };

  useEffect(() => {
    if (!id) return;

    const fetchJobSeeker = async () => {
      try {
        const docRef = doc(db, "JobSeekerList", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);
          setOriginalData(data);
          setVerificationPreviews(docSnap.data().verificationFilesURLs || []);
          setIdentificationPreview(docSnap.data().identificationFileURL || null);
        } else {
          setError("Job seeker not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch job seeker data");
      }
    };

    fetchJobSeeker();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };


  const [activeSection, setActiveSection] = useState("full");
  // options: "basic", "full", "others"
  

  const handleSaveClick = async () => {
    const { lastName, firstName, dateApplied, dateOfBirth, age, sex } = formData;

    const invalidFields: string[] = [];
  
    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!dateApplied) invalidFields.push("dateApplied");
    if (!dateOfBirth) invalidFields.push("dateOfBirth");
    if (!age) invalidFields.push("age");
    if (!sex) invalidFields.push("sex");
     

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
    setShowSavePopup(true);
  } 

  const confirmSave = async () => {
    setShowSavePopup(false);
    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);

    setTimeout(() => {
      setShowPopup(false);
      router.push(`/dashboard/ResidentModule/FirstTimeJobSeeker?highlight=${docId}`);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !formData) return;
  
    const { lastName, firstName, dateApplied, dateOfBirth, age, sex } = formData;
  
    if (!lastName || !firstName || !dateApplied || !dateOfBirth || !age || !sex) {
      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
      setTimeout(() => {
        setShowErrorPopup(false);
      }, 3000);
      return;
    }
  
    setLoading(true);
  
    try {
      const updatedData = { ...formData };
  
      if (session?.user?.position) {
        updatedData.updatedBy = session.user.position;
      }
  
      // Upload verification documents
      let uploadedVerificationURLs: string[] = [];
      for (const file of verificationFiles) {
        const fileRef = ref(storage, `JobSeekerFiles/VerificationFile/${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedVerificationURLs.push(url);
      }
      if (uploadedVerificationURLs.length > 0) {
        updatedData.verificationFilesURLs = [
          ...(formData.verificationFilesURLs || []),
          ...uploadedVerificationURLs,
        ];
      }
  
      // Handle identification file
      if (identificationFile) {
        const idRef = ref(storage, `JobSeekerFiles/IdentificationFile/${identificationFile.name}`);
        await uploadBytes(idRef, identificationFile);
        const uploadedIdentificationURL = await getDownloadURL(idRef);
        updatedData.identificationFileURL = uploadedIdentificationURL;
      } else if (identificationPreview === null) {
        // This means the user deleted the image and didn't add a new one
        updatedData.identificationFileURL = ""; // Remove from Firestore
      }
  
      const docRef = doc(db, "JobSeekerList", id);
      await updateDoc(docRef, updatedData);
      return docRef.id;
    } catch (err) {
      console.error(err);
      setError("Failed to update job seeker");
    }
  
    setLoading(false);
  };
  
  

  const handleBack = () => {
    router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
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




  return (
    <main className="add-resident-main-container">
      {/*
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker">First-Time Job Seeker List</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">Edit First-Time Job Seeker<span className="chevron"></span></h2>
      </div>

      <div className="addresident-page-title-section-1">
        <h1>First-Time Job Seeker List</h1>
      </div>*/}

      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
          <div className="add-resident-main-section1-left">
            <button onClick={handleBack}>
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1>Edit First-Time Job Seeker</h1>
          </div>

          <div className="action-btn-section">
            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
            <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}


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

        
          <div className="add-resident-bottom-section-scroll">

          {formData ? (
            <form onSubmit={handleSubmit} className="add-resident-section-2">

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
                          />
                      </div>

                      <div className="fields-section">
                        <p>First Name<span className="required">*</span></p>
                        <input type="text"
                        className={`add-resident-input-field ${invalidFields.includes("firstName") ? "input-error" : ""}`}
                        placeholder="Enter First Name" 
                        name="firstName"
                        value={formData.firstName} 
                        onChange={handleChange} required />
                      </div>

                      <div className="fields-section">
                        <p>Middle Name</p>
                        <input type="text"
                          className={`add-resident-input-field ${invalidFields.includes("middleName") ? "input-error" : ""}`}
                          placeholder="Enter Middle Name"
                          name="middleName" 
                          value={formData.middleName} 
                          onChange={handleChange}
                          required
                          />
                      </div>
                    </div>

                    <div className="add-main-resident-section-2-right-side">
                      <div className="fields-section">
                        <p>Gender<span className="required">*</span></p>
                        <select 
                          name="sex" 
                          className={`add-resident-input-field ${invalidFields.includes("sex") ? "input-error" : ""}`}
                          value={formData.sex} 
                          onChange={handleChange} 
                          required>
                          <option value="" disabled>Choose a Gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
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
                            required />
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
                          required />
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
                                     
                                      {(verificationFiles.length > 0 || verificationPreviews.length > 0) && (
                                        <div className="file-name-image-display">
                                          {verificationPreviews.map((preview, index) => (
                                            <a
                                            key={index}
                                            href={preview}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ textDecoration: "none", color: "inherit" }}
                                          >
                                            <div key={index} className="identificationpic-file-name-image-display-indiv">
                                              {preview && (
                                                <img src={preview} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />
                                              )}
                                              <span>
                                                {verificationFiles[index]?.name || `Document ${index + 1}`}
                                              </span>
                                            </div>
                                          </a>
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
        
          
       
        
          ) : <p>Loading...</p>}
          </div>
        </div>
      </div>

      {showDiscardPopup && (
                        <div className="confirmation-popup-overlay-add-jobseeker">
                            <div className="confirmation-popup-add-jobseeker">
                            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to discard the changes?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmDiscard} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

      {showSavePopup && (
                        <div className="confirmation-popup-overlay-add-jobseeker">
                            <div className="confirmation-popup-add-jobseeker">
                            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to save the changes?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSavePopup(false)} className="no-button-add">No</button> 
                                    <button onClick={confirmSave} className="yes-button-add">Yes</button> 
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
    </main>
  );
}
