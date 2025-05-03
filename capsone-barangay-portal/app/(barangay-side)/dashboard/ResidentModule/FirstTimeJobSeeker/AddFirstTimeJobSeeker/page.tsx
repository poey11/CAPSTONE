"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSession } from "next-auth/react";

export default function AddFirstTimeJobSeeker() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dateApplied: "", // YYYY-MM-DD format
    lastName: "",
    firstName: "",
    middleName: "",
    age: 0,
    dateOfBirth: "", // YYYY-MM-DD format from input
    monthOfBirth: "",
    dayOfBirth: "",
    yearOfBirth: "",
    sex: "",
    remarks: "",
  });

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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  
    setShowSubmitPopup(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitPopup(false);
  
    setPopupMessage("First-Time Jobseeker Record added successfully!");
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      let fileURL = "";
      if (file) {
        const storageRef = ref(storage, `JobSeekerFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }
  
      // Extract Month, Day, and Year from Date of Birth
      const { monthOfBirth, dayOfBirth, yearOfBirth } = formatDateParts(formData.dateOfBirth);
  
      // Ensure dateApplied is stored as YYYY-MM-DD in Firestore
      const formattedDateApplied = formData.dateApplied
        ? new Date(formData.dateApplied).toISOString().split("T")[0]
        : "";

      const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
  
      // Save to Firestore
      await addDoc(collection(db, "JobSeekerList"), {
        ...formData,
        monthOfBirth,
        dayOfBirth,
        yearOfBirth,
        dateApplied: formattedDateApplied,
        fileURL,
        createdAt: currentDate,
        createdBy: session?.user?.position || "Unknown",
      });
  
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

              <h1> Add New First-Time Jobseeker </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view"  onClick={handleSubmitClick} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            
          </div>

          <hr/>

        <form id="addJobSeekerForm" onSubmit={handleSubmit} className="add-resident-section-2">
          <div className="add-resident-section-2-left-side">
            <div className="fields-container">
              <div className="fields-section">
                <p>Last Name<span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>First Name<span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Middle Name</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>

              <div className="fields-section">
                <p>Date Applied<span className="required">*</span></p>
                <input type="date" className="add-resident-input-field" name="dateApplied" value={formData.dateApplied} onChange={handleChange} required />
              </div>
                

              <div className="fields-section">
                <p>Date of Birth<span className="required">*</span></p>
                <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split("T")[0]} required />
              </div>


              <div className="fields-section">
                <p>Age<span className="required">*</span></p>
                <input type="number" className="add-resident-input-field" placeholder="Enter Age" name="age" value={formData.age} onChange={handleChange} readOnly />
              </div>
                
              <div className="fields-section">
                <p>Sex<span className="required">*</span></p>
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
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
      
    </main>
  );
}
