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

  const handleDiscardClick = () => setShowDiscardPopup(true);

  const confirmDiscard = () => {
    setShowDiscardPopup(false);
    setFormData(originalData ?? formData);
    setPopupMessage("Changes discarded successfully!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
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
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (formData?.fileURL) {
        const oldFileRef = ref(storage, formData.fileURL);
        try {
          await deleteObject(oldFileRef);
        } catch (err) {
          console.error("Failed to delete old file:", err);
        }
      }

      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };

  const handleFileDelete = async () => {
    if (formData?.fileURL) {
      const fileRef = ref(storage, formData.fileURL);
      try {
        await deleteObject(fileRef);
        setFormData((prev: any) => ({ ...prev, fileURL: "" }));
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
    setFile(null);
    setPreview(null);
  };

  const handleSaveClick = async () => {
    const { lastName, firstName, dateApplied, dateOfBirth, age, sex } = formData;
  
    if (!lastName || !firstName || !dateApplied || !dateOfBirth || !age || !sex) {

      setPopupErrorMessage("Please fill up all required fields.");
      setShowErrorPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowErrorPopup(false);
      
    }, 3000);
    
      return;
    }

    setShowSavePopup(true);
  } 

  const confirmSave = async () => {
    setShowSavePopup(false);
    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      router.push("/dashboard/ResidentModule/FirstTimeJobSeeker");
    }, 3000);

    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
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
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker">First-Time Job Seeker List</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">Edit First-Time Jobseeker<span className="chevron"></span></h2>
      </div>

      <div className="addresident-page-title-section-1">
        <h1>First-Time Job Seeker List</h1>
      </div>

      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
          <div className="add-resident-main-section1-left">
            <button onClick={handleBack}>
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1>Edit First-Time Jobseeker</h1>
          </div>

          <div className="action-btn-section">
            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
            <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <hr />

        {error && <p className="error">{error}</p>}
        {formData ? (
          <form onSubmit={handleSubmit} className="add-resident-section-2">
            <div className="add-resident-section-2-left-side">
              <div className="fields-container">
                <div className="fields-section">
                  <p>Last Name<span className="required">*</span></p>
                  <input type="text" name="lastName" className="add-resident-input-field" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="fields-section">
                  <p>First Name<span className="required">*</span></p>
                  <input type="text" name="firstName" className="add-resident-input-field" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="fields-section">
                  <p>Middle Name</p>
                  <input type="text" name="middleName" className="add-resident-input-field" value={formData.middleName} onChange={handleChange} />
                </div>
                <div className="fields-section">
                  <p>Date Applied<span className="required">*</span></p>
                  <input type="date" name="dateApplied" className="add-resident-input-field" value={formData.dateApplied} onChange={handleChange} required />
                </div>
                <div className="fields-section">
                  <p>Date of Birth<span className="required">*</span></p>
                  <input type="date" name="dateOfBirth" className="add-resident-input-field" value={formData.dateOfBirth} onChange={handleChange} required />
                </div>
                <div className="fields-section">
                  <p>Age<span className="required">*</span></p>
                  <input type="number" name="age" className="add-resident-input-field" value={formData.age} onChange={handleChange} required />
                </div>
                <div className="fields-section">
                  <p>Sex<span className="required">*</span></p>
                  <select name="sex" value={formData.sex} className="add-resident-input-field" onChange={handleChange} required>
                    <option value="" disabled>Choose Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div className="fields-section">
                  <p>Remarks</p>
                  <input type="text" name="remarks" className="add-resident-input-field" value={formData.remarks} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="add-resident-section-2-right-side">
              <div className="file-upload-container">
                <label htmlFor="file-upload" className="upload-link">Click to Upload File</label>
                <input id="file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
                
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

                {file && (
                  <div className="file-name-image-display">
                    <span className="section-title">New Image</span>
                    <div className="file-name-image-display-indiv">
                      <img src={preview || ""} style={{ width: "100px", height: "100px" }} />
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
        ) : <p>Loading...</p>}
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
