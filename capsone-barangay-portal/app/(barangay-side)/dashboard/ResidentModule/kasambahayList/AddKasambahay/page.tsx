"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function AddKasambahay() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    registrationControlNumber: "",
    lastName: "",
    firstName: "",
    middleName: "",
    homeAddress: "",
    dateOfBirth: "",
    placeOfBirth: "",
    sex: "",
    age: 0,
    civilStatus: "",
    educationalAttainment: "",
    natureOfWork: "",
    employmentArrangement: "",
    salary: "",
    sssMember: false,
    philhealthMember: false,
    pagibigMember: false,
    employerName: "",
    employerAddress: "",
    createdAt:"",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

  useEffect(() => {
    const fetchLatestNumber = async () => {
      try {
        const kasambahayCollection = collection(db, "KasambahayList");
        const q = query(kasambahayCollection, orderBy("registrationControlNumber", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        let newNumber = 1;
        if (!querySnapshot.empty) {
          const latestEntry = querySnapshot.docs[0].data();
          newNumber = latestEntry.registrationControlNumber + 1;
        }

        setFormData((prevData) => ({
          ...prevData,
          registrationControlNumber: newNumber.toString(),
        }));
      } catch (error) {
        console.error("Error fetching latest registration number:", error);
      }
    };

    fetchLatestNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Convert specific fields to numbers
    const numericFields = ["educationalAttainment", "natureOfWork", "employmentArrangement", "salary"];
    
    setFormData({
      ...formData,
      [name]: numericFields.includes(name) ? Number(value) : type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };
  

  const handleSubmitClick = async () => {
    const { lastName, firstName, homeAddress, placeOfBirth, dateOfBirth, age, sex, civilStatus, educationalAttainment, natureOfWork, employmentArrangement, salary, employerName, employerAddress} = formData;
  
    if (!lastName || !firstName ||!homeAddress || !placeOfBirth ||!dateOfBirth || !age || !sex || !civilStatus || !educationalAttainment || !natureOfWork || !employmentArrangement || !salary || !employerName || !employerAddress) {

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
  
    setPopupMessage("Kasambahay Record added successfully!");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ensure the latest registration number is assigned
      const kasambahayCollection = collection(db, "KasambahayList");
      const q = query(kasambahayCollection, orderBy("registrationControlNumber", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let latestNumber = 1;
      if (!querySnapshot.empty) {
        const latestEntry = querySnapshot.docs[0].data();
        latestNumber = latestEntry.registrationControlNumber + 1;
      }

      const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format


      await addDoc(kasambahayCollection, {
        ...formData,
        registrationControlNumber: latestNumber,
        createdAt: currentDate,
      });

    } catch (err) {
      setError("Failed to add kasambahay");
      console.error(err);
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.push("/dashboard/ResidentModule/kasambahayList");
  };

  return (
    <main className="add-resident-main-container">

      <div className="addresident-page-title-section-1">
      <h1>Kasambahay Masterlist</h1>
      </div>
      <div className="add-resident-main-content">

      <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> Add New Kasambahay </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view"  onClick={handleSubmitClick} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            
          </div>

          <hr/>
        
        <form id="addKasambahayForm" onSubmit={handleSubmit} className="add-resident-section-2">
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
                <p>Middle Name</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
              </div>

              <div className="fields-section">
                <p>Home Address <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Address" name="homeAddress" value={formData.homeAddress} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Place of Birth <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required/>
              </div>

              <div className="fields-section">
                <p>Date of Birth <span className="required">*</span></p>
                <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>
                
              <div className="fields-section">
                <p>Age <span className="required">*</span></p>
                  <input
                    type="number"
                    className="add-resident-input-field" 
                    placeholder="Enter Age" 
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="1"
                    max="120"
                  />
              </div>

              <div className="fields-section">
                <p>Sex <span className="required">*</span></p>
                <select name="sex" className="add-resident-input-field" value={formData.sex} onChange={handleChange} required>
                  <option value="" disabled>Choose Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Civil Status <span className="required">*</span></p>
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
                <p>Educational Attainment <span className="required">*</span></p>
                  <select name="educationalAttainment" className="add-resident-input-field" value={formData.educationalAttainment} onChange={handleChange} required>
                    <option value="" disabled>Choose Educational Attainment</option>
                    <option value="1">Elem Under Grad</option>
                    <option value="2">Elem Grad</option>
                    <option value="3">HS Grad</option>
                    <option value="4">HS Under Grad</option>
                    <option value="5">COL Grad</option>
                    <option value="6">COL Under Grad</option>
                    <option value="7">Educational</option>
                    <option value="8">Vocational</option>
                </select>
              </div>
                
              <div className="fields-section">
                <p>Nature of Work <span className="required">*</span></p>
                <select name="natureOfWork" className="add-resident-input-field" value={formData.natureOfWork} onChange={handleChange} required>
                  <option value="" disabled>Choose Nature of Work</option>
                  <option value="1">Gen. House Help (All Around)</option>
                  <option value="2">YAYA</option>
                  <option value="3">COOK</option>
                  <option value="4">Gardener</option>
                  <option value="5">Laundry Person</option>
                  <option value="6">Others</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Employment Arrangement <span className="required">*</span></p>
                <select name="employmentArrangement" className="add-resident-input-field" value={formData.employmentArrangement} onChange={handleChange} required>
                  <option value="" disabled>Choose Employment Arrangement</option>
                  <option value="1">Live - IN</option>
                  <option value="2">Live - OUT</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Range of Salary <span className="required">*</span></p>
                <select name="salary" className="add-resident-input-field" value={formData.salary} onChange={handleChange} required>
                  <option value="1">₱1,500 - ₱1,999</option>
                  <option value="2">₱2,000 - ₱2,499</option>
                  <option value="3">₱2,500 - ₱4,999</option>
                  <option value="4">₱5,000 and Above</option>
                </select>
              </div>

                
              <div className="fields-section">
                <p>Employer Name <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Employer" name="employerName" value={formData.employerName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Employer Address <span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Employer Address" name="employerAddress" value={formData.employerAddress} onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="add-resident-section-2-right-side">
            <div className="checkboxes-container">
              <p>SSS Membership</p>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" name="sssMember" checked={formData.sssMember} onChange={handleChange} />
                    Is this resident an SSS Member?
                  </label>
                </div>

                <p>Pag-Ibig Membership</p>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" name="pagibigMember" checked={formData.pagibigMember} onChange={handleChange} />
                    Is this resident a Pag-Ibig Member?
                  </label>
                </div>

                <p>PhilHealth Membership</p>
                <div className="checkbox-container">
                  <label className="checkbox-label">
                    <input type="checkbox" name="philhealthMember" checked={formData.philhealthMember} onChange={handleChange} />
                    Is this resident a PhilHealth Member?
                  </label>
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
