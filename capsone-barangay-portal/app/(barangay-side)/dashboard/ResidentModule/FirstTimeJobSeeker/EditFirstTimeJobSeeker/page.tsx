"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

interface JobSeeker {
  dateApplied: string;
  lastName: string;
  firstName: string;
  middleName: string;
  age: number;
  dateOfBirth: string;
  sex: string;
  remarks: string;
  fileURL: string;
  updatedBy: string;
}

export default function EditFirstTimeJobSeeker() {

  const { data: session } = useSession();

  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobSeeker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [originalData, setOriginalData] = useState<JobSeeker | null>(null);

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const handleDiscardClick = async () => {
    setShowDiscardPopup(true);
  }

  const confirmDiscard = async () => {
    setShowDiscardPopup(false);

    setFormData(originalData ?? formData); // Reset to original data

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
          const data = docSnap.data() as JobSeeker; // Define data properly
          setFormData(data);
          setOriginalData(data); // Store original data
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => prevData ? { ...prevData, [name]: value } : null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
  
      // If there is an old file, delete it before uploading the new one
      if (formData?.fileURL) {
        const oldFileRef = ref(storage, formData.fileURL); // Get the reference of the old file
        try {
          await deleteObject(oldFileRef); // Delete the old file from Firebase Storage
          console.log("Old file deleted successfully");
        } catch (err) {
          console.error("Failed to delete the old file:", err);
        }
      }
  
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };
  

  const handleFileDelete = async () => {
    if (formData?.fileURL) {
      // Delete the file from Firebase Storage
      const fileRef = ref(storage, formData.fileURL); // Get the reference to the file using its URL
      try {
        await deleteObject(fileRef); // Delete the file from Firebase Storage
        console.log("File deleted successfully");
  
        // Update Firestore to remove the fileURL field
        setFormData((prev) => {
          if (!prev) return prev;
          return { ...prev, fileURL: "" } as JobSeeker;
        });
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
    setFile(null);
    setPreview(null);
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

      router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
    }, 3000);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !formData) return;
  
    setLoading(true);
    try {
      let updatedData: Partial<JobSeeker> = { ...formData };
  
      if (session?.user?.position) {
        updatedData.updatedBy = session.user.position;
      }

      // Upload the file if there's a new one selected
      if (file) {
        const fileRef = ref(storage, `JobSeekerFiles/${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
  
        updatedData.fileURL = downloadURL;
      }
  
      const docRef = doc(db, "JobSeekerList", id);
      await updateDoc(docRef, updatedData);
    } catch (err) {
      console.error(err);
      setError("Failed to update job seeker");
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
  };

  return (
    <main className="add-resident-main-container">

      <div className="addresident-page-title-section-1">
          <h1>First-Time Job Seeker List</h1>
      </div>

      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
          <div className="add-resident-main-section1-left">
            <button onClick={handleBack}>
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
            </button>

            <h1> Edit First-Time Jobseeker </h1>
          </div>

          <div className="action-btn-section">
            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
            <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <hr/>
      
    
        {error && <p className="error">{error}</p>}
        {formData ? (
          <form id="editJobSeekerForm" onSubmit={handleSubmit} className="add-resident-section-2">
            <div className="add-resident-section-2-left-side">
              <div className="fields-container">
                <div className="fields-section">
                  <p>Last Name</p>
                  <input type="text" className="add-resident-input-field" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>

                <div className="fields-section">
                  <p>First Name</p>
                  <input type="text" className="add-resident-input-field" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                  
                <div className="fields-section">
                  <p>Middle Name</p>
                  <input type="text" className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} required />
                </div>

                <div className="fields-section">
                  <p>Date Applied</p>
                  <input type="date" className="add-resident-input-field" name="dateApplied" value={formData.dateApplied} onChange={handleChange} required />
                </div>
                  
                <div className="fields-section">
                  <p>Date of Birth</p>
                  <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split("T")[0]} required />
                </div>

                <div className="fields-section">
                  <p>Age</p>
                  <input type="number" className="add-resident-input-field" placeholder="Enter Age" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" />
                </div>

                <div className="fields-section">
                  <p>Sex</p>
                  <select name="sex" className="add-resident-input-field" value={formData.sex} onChange={handleChange} required>
                    <option value="" disabled>Choose Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>

                <div className="fields-section">
                  <p>Remarks</p>
                  <input type="text" className="add-resident-input-field" placeholder="Enter Remarks" name="remarks" value={formData.remarks} onChange={handleChange} />
                </div>
              </div>
            </div>
              {/* Right Side - File Upload */}
              <div className="add-resident-section-2-right-side">  
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
        ) : (
          <p>Loading...</p>
        )}
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
    </main>
  );
}