"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface VoterFormData {
  voterNumber: string;
  fullName: string;
  homeAddress: string;
  precinctNumber: string;

}

export default function EditVoter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voterId = searchParams.get("id"); 

  const [formData, setFormData] = useState<VoterFormData>({
    voterNumber: "",
    fullName: "",
    homeAddress: "",
    precinctNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [originalData, setOriginalData] = useState({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [popupMessage, setPopupMessage] = useState("");


  const handleDiscardClick = async () => {
    setShowDiscardPopup(true);
  }

  const confirmDiscard = async () => {
      setShowDiscardPopup(false);

      setFormData(originalData); // Reset to original data

      setPopupMessage("Changes discarded successfully!");
      setShowPopup(true);
      

      // Hide the popup after 3 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);

  };

  useEffect(() => {
    if (!voterId) return;

    const fetchVoter = async () => {
      try {
        const docRef = doc(db, "VotersList", voterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = {
            voterNumber: docSnap.data().voterNumber || "",
            fullName: docSnap.data().fullName || "",
            homeAddress: docSnap.data().homeAddress || "",
            precinctNumber: docSnap.data().precinctNumber || "",
          };

          setFormData(data);
          setOriginalData(data); // Store original data
        } else {
          setError("Voter record not found.");
        }
      } catch (error) {
        console.error("Error fetching Voter:", error);
        setError("Failed to load data.");
      }
    };

    fetchVoter();
  }, [voterId]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  
  const handleSaveClick = async () => {


    const { 
    fullName, homeAddress, precinctNumber
  } = formData;

  if (!fullName || !homeAddress || !precinctNumber) {
    setPopupErrorMessage("Please fill up all required fields.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }
  

    setShowSavePopup(true);
  } 

  const confirmSave = async () => {
    setShowSavePopup(false);

    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);

      router.push("/dashboard/ResidentModule/registeredVoters");
    }, 3000);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!voterId) return;

    setLoading(true);
    setError("");

    try {
      const docRef = doc(db, "VotersList", voterId);
      await updateDoc(docRef, {
        voterNumber: formData.voterNumber,
        fullName: formData.fullName,
        homeAddress: formData.homeAddress,
        precinctNumber: formData.precinctNumber,
      });
      
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/registeredVoters";
  };

  return (
    <main className="add-resident-main-container">

      <div className="addresident-page-title-section-1">
      <h1>Registered Voters</h1>
      </div>

      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
              <div className="add-resident-main-section1-left">
                <button onClick={handleBack}>
                  <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                </button>

                <h1> Edit Voter </h1>
              </div>

              <div className="action-btn-section">
                <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
                <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
              
          </div>

          <hr/>
        <form id="editVoterForm" onSubmit={handleSubmit} className="add-resident-section-2">
          <div className="add-resident-section-2-left-side">

            <div className="fields-container">
              <div className="fields-section">
                <p>Voter Number</p>
                <input type="text" name="voterNumber" value={formData.voterNumber} onChange={handleChange} disabled className="add-resident-input-field-disabled" />
              </div>

              <div className="fields-section">
                <p>Full Name</p>
                <input type="text" className="add-resident-input-field" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>
              
              <div className="fields-section">
                <p>Home Address</p>
                <input type="text" className="add-resident-input-field" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Precinct Number</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
              </div>
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
