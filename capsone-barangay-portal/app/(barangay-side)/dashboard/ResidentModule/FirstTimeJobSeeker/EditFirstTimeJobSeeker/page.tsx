"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface JobSeeker {
  dateApplied: string;
  lastName: string;
  firstName: string;
  middleName: string;
  age: number;
  dateOfBirth: string;
  sex: string;
  remarks: string;
}

export default function EditFirstTimeJobSeeker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

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
      const docRef = doc(db, "JobSeekerList", id);
      await updateDoc(docRef, { ...formData } as Partial<JobSeeker>);
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
                  <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
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