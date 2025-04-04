"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Format Date of Birth into Separate Parts
  const formatDateParts = (dateString: string) => {
    if (!dateString) return { monthOfBirth: "", dayOfBirth: "", yearOfBirth: "" };

    const [year, month, day] = dateString.split("-");
    return { monthOfBirth: month, dayOfBirth: day, yearOfBirth: year };
  };


  const handleSubmitClick = async () => {
    const { lastName, firstName, middleName, dateApplied, dateOfBirth, age, sex } = formData;
  
    if (!lastName || !firstName || !middleName || !dateApplied || !dateOfBirth || !age || !sex) {

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
      // Extract Month, Day, and Year from Date of Birth
      const { monthOfBirth, dayOfBirth, yearOfBirth } = formatDateParts(formData.dateOfBirth);

      // Ensure dateApplied is stored as YYYY-MM-DD in Firestore
      const formattedDateApplied = formData.dateApplied ? new Date(formData.dateApplied).toISOString().split("T")[0] : "";

      // Save to Firestore
      await addDoc(collection(db, "JobSeekerList"), {
        ...formData,
        monthOfBirth,
        dayOfBirth,
        yearOfBirth,
        dateApplied: formattedDateApplied, // Stored as YYYY-MM-DD
        createdAt: serverTimestamp(),
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
                <p>Last Name <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>First Name <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Middle Name <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Date Applied <span className="required">*</span></p>
                <input type="date" className="add-resident-input-field" name="dateApplied" value={formData.dateApplied} onChange={handleChange} required />
              </div>
                

              <div className="fields-section">
                <p>Date of Birth <span className="required">*</span></p>
                <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>


              <div className="fields-section">
                <p>Age <span className="required">*</span></p>
                <input type="number" className="add-resident-input-field" placeholder="Enter Age" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" />
              </div>
                
              <div className="fields-section">
                <p>Sex <span className="required">*</span></p>
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
