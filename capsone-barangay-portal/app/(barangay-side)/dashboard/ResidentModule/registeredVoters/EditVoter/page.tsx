"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc, writeBatch} from "firebase/firestore";
import Link from "next/link";

interface VoterFormData {
  voterNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  homeAddress: string;
  precinctNumber: string;
  residentId: string
  identificationFileURL: string

}

export default function EditVoter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voterId = searchParams.get("id"); 

  const [formData, setFormData] = useState<VoterFormData>({
    voterNumber: "",
    lastName: "",
    firstName: "",
    middleName: "",
    homeAddress: "",
    precinctNumber: "",
    residentId: "",
    identificationFileURL: "",
  });

  const fieldSectionMap: { [key: string]: "details"} = {
    lastName: "details",
    firstName: "details",
    middleName: "details",
    
    homeAddress: "details",
    precinctNumber: "details",
  
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [originalData, setOriginalData] = useState({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const [invalidFields, setInvalidFields] = useState<string[]>([]);


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
            lastName: docSnap.data().lastName || "",
            firstName: docSnap.data().firstName || "",
            middleName: docSnap.data().middleName || "",
            homeAddress: docSnap.data().homeAddress || "",
            precinctNumber: docSnap.data().precinctNumber || "",
            residentId: docSnap.data().residentId || "",
            identificationFileURL: docSnap.data().identificationFileURL || "",
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

 // Check if there are any changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (!hasChanges) {
    setPopupErrorMessage("No changes were made.");
    setShowErrorPopup(true);
    setShowSavePopup(false); // prevent confirmation popup
    setTimeout(() => setShowErrorPopup(false), 3000);
    return;
  }


    const { 
    lastName, firstName, homeAddress, precinctNumber
  } = formData;

  const invalidFields: string[] = [];

  if (!lastName) invalidFields.push("lastName");
  if (!firstName) invalidFields.push("firstName");
  if (!homeAddress) invalidFields.push("homeAddress");
  if (!precinctNumber) invalidFields.push("precinctNumber");
  
  
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

    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);

      router.push(`/dashboard/ResidentModule/registeredVoters?highlight=${docId}`);
    }, 3000);

  };

  // Handle form submission
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!voterId) return;

  setLoading(true);
  setError("");

  try {
    const batch = writeBatch(db);

    // 1) Update the VotersList/{voterId} document
    const voterRef = doc(db, "VotersList", voterId);
    batch.update(voterRef, {
      voterNumber: formData.voterNumber,
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      homeAddress: formData.homeAddress,
      precinctNumber: formData.precinctNumber,
    });

    // 2) If residentId is present AND the resident doc exists, update its address/precinct too
    if (formData.residentId) {
      const residentRef = doc(db, "Residents", formData.residentId);
      const residentSnap = await getDoc(residentRef);

      if (residentSnap.exists()) {
        batch.update(residentRef, {
          address: formData.homeAddress,
          precinctNumber: formData.precinctNumber,
        });
      } else {
        console.warn(
          `Residents/${formData.residentId} not found; skipping resident update.`
        );
      }
    }

    await batch.commit();
    return voterRef.id; // return ID for redirect

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

  const [activeSection, setActiveSection] = useState("details");

  return (
    <main className="add-resident-main-container">
      {/*
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/registeredVoters">Registered Voters</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">Edit Voter<span className="chevron"></span></h2>
      </div>

      <div className="addresident-page-title-section-1">
      <h1>Registered Voters</h1>
      </div>*/}

      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
              <div className="add-resident-main-section1-left">
                <button onClick={handleBack}>
                  <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
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

          <div className="add-voter-bottom-section">
          <nav className="voters-info-toggle-wrapper">
              {["details"].map((section) => (
                <button
                  key={section}
                  type="button"
                  className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                >
                  {section === "details" && "Details"}
                </button>
              ))}
            </nav>  
            <form id="editVoterForm" onSubmit={handleSubmit} className="add-resident-section-2">
            {activeSection === "details" && (
              <>
                <div className="addvoter-outer-container">
                  <div className="addvoter-outer-container-left">
                    <div className="resident-photo-section-voter">
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

                  <div className="addvoter-outer-container-right">
                        <div className="addvoter-top-details-section">
                          <div className="add-main-resident-section-2-left-side">
                            <div className="fields-section">
                              <p>Last Name<span className="required">*</span></p>
                              <input 
                              type="text"  
                              className={`add-resident-input-field ${invalidFields.includes("lastName") ? "input-error" : ""}`} 
                              placeholder="Enter Last Name" 
                              name="lastName" 
                              value={formData.lastName} onChange={handleChange} 
                              required 
                              disabled />
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
                              required
                              disabled
                              />
                            </div>
                          </div>
                          <div className="add-main-resident-section-2-right-side">
                            <div className="fields-section">
                              <p>Middle Name</p>
                              <input 
                              type="text"  
                              className="add-resident-input-field" 
                              placeholder="Enter Middle Name" 
                              name="middleName" 
                              value={formData.middleName} 
                              onChange={handleChange} 
                              disabled
                              />
                            </div>
                            <div className="fields-section">
                              <p>Home Address<span className="required">*</span></p>
                              <input 
                              type="text"  
                              className={`add-resident-input-field ${invalidFields.includes("homeAddress") ? "input-error" : ""}`} 
                              placeholder="Enter Address" 
                              name="homeAddress" 
                              value={formData.homeAddress} 
                              onChange={handleChange} 
                              required 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="add-voter-section-2-full-bottom">
                          
                            <div className="fields-section-precinct">
                              <p>Precinct Number<span className="required">*</span></p>
                              <input 
                              type="text" 
                              className={`add-voterprecinct-input-field ${invalidFields.includes("precinctNumber") ? "input-error" : ""}`} 
                              placeholder="Enter Precinct Number" 
                              name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} 
                              required
                              />
                            </div>
                         
                        </div>  
                      </div>
                </div>
              </>
            )}
            </form>
          </div>

         
        
        {error && <p className="error">{error}</p>}
      </div>


      {showDiscardPopup && (
                        <div className="confirmation-popup-overlay-add-voter">
                            <div className="confirmation-popup-add-voter">
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
                        <div className="confirmation-popup-overlay-add-voter">
                            <div className="confirmation-popup-add-voter">
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
                <div className={`popup-overlay-add-voter show`}>
                    <div className="popup-add-voter">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}
             {showErrorPopup && (
                <div className={`error-popup-overlay-add-voter show`}>
                    <div className="popup-add-voter">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
    </main>
  );
}
