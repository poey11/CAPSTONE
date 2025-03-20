"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface KasambahayFormData {
  registrationControlNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
  homeAddress: string;
  dateOfBirth: string;
  placeOfBirth: string;
  age: number;
  sex: string;
  civilStatus: string;
  educationalAttainment: string;
  natureOfWork: string;
  employmentArrangement: string;
  salary: string;
  employerName: string;
  employerAddress: string;
  sssMember: boolean;
  philhealthMember: boolean;
  pagibigMember: boolean;
}

export default function EditKasambahay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kasambahayId = searchParams.get("id"); 

  const [formData, setFormData] = useState<KasambahayFormData>({
    registrationControlNumber: "",
    firstName: "",
    lastName: "",
    middleName: "",
    homeAddress: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    educationalAttainment: "",
    natureOfWork: "",
    employmentArrangement: "",
    salary: "",
    employerName: "",
    employerAddress: "",
    sssMember: false,
    philhealthMember: false,
    pagibigMember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [originalData, setOriginalData] = useState({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
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
    if (!kasambahayId) return;

    const fetchKasambahay = async () => {
      try {
        const docRef = doc(db, "KasambahayList", kasambahayId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = {
            registrationControlNumber: docSnap.data().registrationControlNumber || "",
            firstName: docSnap.data().firstName || "",
            lastName: docSnap.data().lastName || "",
            middleName: docSnap.data().middleName || "",
            homeAddress: docSnap.data().homeAddress || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            placeOfBirth: docSnap.data().placeOfBirth || "",
            age: docSnap.data().age || "",
            sex: docSnap.data().sex || "",
            civilStatus: docSnap.data().civilStatus || "",
            educationalAttainment: docSnap.data().educationalAttainment || "",
            natureOfWork: docSnap.data().natureOfWork || "",
            employmentArrangement: docSnap.data().employmentArrangement || "",
            salary: docSnap.data().salary || "",
            employerName: docSnap.data().employerName || "",
            employerAddress: docSnap.data().employerAddress || "",
            sssMember: docSnap.data().sssMember ?? false,
            philhealthMember: docSnap.data().philhealthMember ?? false,
            pagibigMember: docSnap.data().pagibigMember ?? false,
          };

          setFormData(data);
          setOriginalData(data); // Store original data

        } else {
          setError("Kasambahay record not found.");
        }
      } catch (error) {
        console.error("Error fetching Kasambahay:", error);
        setError("Failed to load data.");
      }
    };

    fetchKasambahay();
  }, [kasambahayId]);

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
    setShowSavePopup(true);
  } 

  const confirmSave = async () => {
    setShowSavePopup(false);

    setPopupMessage("Changes saved successfully!");
    setShowPopup(true);

    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);

      router.push("/dashboard/ResidentModule/kasambahayList");
    }, 3000);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!kasambahayId) return;

    setLoading(true);
    setError("");

    try {
      const docRef = doc(db, "KasambahayList", kasambahayId);
      await updateDoc(docRef, {
        registrationControlNumber: formData.registrationControlNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        homeAddress: formData.homeAddress,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        age: formData.age,
        sex: formData.sex,
        civilStatus: formData.civilStatus,
        educationalAttainment: formData.educationalAttainment,
        natureOfWork: formData.natureOfWork,
        employmentArrangement: formData.employmentArrangement,
        salary: formData.salary,
        employerName: formData.employerName,
        employerAddress: formData.employerAddress,
        sssMember: formData.sssMember,
        philhealthMember: formData.philhealthMember,
        pagibigMember: formData.pagibigMember,
      });
      
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/kasambahayList";
  };

  return (
    <main className="add-resident-main-container">

      <div className="addresident-page-title-section-1">
        <h1>Edit Kasambahay Details</h1>
      </div>

      <div className="add-resident-main-content">
        <div className="add-resident-main-section1">
          <div className="add-resident-main-section1-left">
            <button onClick={handleBack}>
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
            </button>

            <h1> Edit Kasambahay </h1>
          </div>

          <div className="action-btn-section">
            <button className="action-discard" onClick={handleDiscardClick}>Discard</button>
            <button className="action-view" onClick={handleSaveClick} disabled={loading}>
              
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <hr/>
      
        <form id="editKasambahayForm" onSubmit={handleSubmit} className="add-resident-section-2">
          <div className="add-resident-section-2-left-side">

            <div className="fields-container">
              <div className="fields-section">
                <p>Registration Control Number</p>
                <input type="text" name="registrationControlNumber" value={formData.registrationControlNumber} onChange={handleChange} disabled className="add-resident-input-field-disabled" />
              </div>

              <div className="fields-section">
                <p>First Name</p>
                <input type="text" name="firstName" className="add-resident-input-field" value={formData.firstName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Last Name</p>
                <input type="text" name="lastName" className="add-resident-input-field" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Middle Name</p>
                <input type="text" name="middleName" className="add-resident-input-field" value={formData.middleName} onChange={handleChange} />
              </div>

              <div className="fields-section">
                <p>Home Address</p>
                <input type="text" name="homeAddress" className="add-resident-input-field" value={formData.homeAddress} onChange={handleChange} required />
              </div>
           
              <div className="fields-section">
                <p>Place of Birth</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required/>
              </div>

              <div className="fields-section">
                <p>Date of Birth</p>
                <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>
            
              <div className="fields-section">
                <p>Sex</p>
                <select name="sex" className="add-resident-input-field" value={formData.sex} onChange={handleChange} required>
                  <option value="" disabled>Choose Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Civil Status</p>
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
                <p>Educational Attainment</p>
                <select name="educationalAttainment" className="add-resident-input-field" value={formData.educationalAttainment} onChange={handleChange} required>
                  <option value="" disabled>Choose Educational Attainment</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Nature of Work</p>
                <select name="natureOfWork" className="add-resident-input-field" value={formData.natureOfWork} onChange={handleChange} required>
                  <option value="" disabled>Choose Nature of Work</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Employment Arrangement</p>
                <select name="employmentArrangement" className="add-resident-input-field" value={formData.employmentArrangement} onChange={handleChange} required>
                  <option value="" disabled>Choose Employment Arrangement</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
            
              <div className="fields-section">
                <p>Range of Salary</p>
                <select name="salary" className="add-resident-input-field" value={formData.salary} onChange={handleChange} required>
                <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Employer Name</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Employer" name="employerName" value={formData.employerName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Employer Address</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Employer Address" name="employerAddress" value={formData.employerAddress} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="add-resident-section-2-right-side">
            <div className="checkboxes-container">
              <p>SSS Member</p>
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input type="checkbox" name="sssMember" checked={formData.sssMember} onChange={handleChange} />
                  Is this resident an SSS member?
                </label>
              </div>

              <p>PhilHealth Member</p>
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input type="checkbox" name="philhealthMember" checked={formData.philhealthMember} onChange={handleChange} />
                  Is this resident a PhilHealth member?
                </label>
              </div>

              <p>Pag-IBIG Member</p>
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input type="checkbox" name="pagibigMember" checked={formData.pagibigMember} onChange={handleChange} />
                  Is this resident a Pag-IBIG member?
                </label>
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
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}
    </main>
  );
}
