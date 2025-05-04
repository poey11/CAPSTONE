"use client";
import "@/CSS/ResidentModule/addresident.css"; 
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";


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
  fileURL: string;
  updatedBy: string;
}

export default function EditKasambahay() {

  const { data: session } = useSession();

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
    fileURL: "",
    updatedBy: "",

  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [originalData, setOriginalData] = useState<KasambahayFormData>({ ...formData });

  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");

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
            fileURL: docSnap.data().fileURL || "",
            updatedBy: docSnap.data().updatedBy || "",
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


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };

  const handleFileDelete = async () => {
    if (!formData.fileURL) return;
  
    try {
      // Create a reference to the file in Firebase Storage
      const fileRef = ref(storage, formData.fileURL);
  
      // Delete the file from Firebase Storage
      await deleteObject(fileRef);
  
      // Clear the local state
      setFile(null);
      setPreview(null); // Ensure it's undefined
  
      // Reset fileURL in formData
      setFormData((prev) => ({
        ...prev,
        fileURL: "",
      }));
  
      console.log("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };
  




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

    const { lastName, firstName, homeAddress, dateOfBirth, age, sex, civilStatus, educationalAttainment, natureOfWork, employmentArrangement, salary, employerName, employerAddress} = formData;
  
    if (!lastName || !firstName ||!homeAddress ||!dateOfBirth || !age || !sex || !civilStatus || !educationalAttainment || !natureOfWork || !employmentArrangement || !salary || !employerName || !employerAddress) {

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
      let fileURL = formData.fileURL; // Default to existing URL
  
      //  If new file is selected, upload to Firebase Storage
      if (file) {
        const storageRef = ref(storage, `KasambahayFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

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
        fileURL,
        updatedBy: session?.user?.position,
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
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/kasambahayList">Kasambahay Masterlist</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">Edit Kasambahay<span className="chevron"></span></h2>
      </div>

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
                <p>First Name<span className="required">*</span></p>
                <input type="text" name="firstName" className="add-resident-input-field" value={formData.firstName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Last Name<span className="required">*</span></p>
                <input type="text" name="lastName" className="add-resident-input-field" value={formData.lastName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Middle Name</p>
                <input type="text" name="middleName" className="add-resident-input-field" value={formData.middleName} onChange={handleChange} />
              </div>

              <div className="fields-section">
                <p>Home Address<span className="required">*</span></p>
                <input type="text" name="homeAddress" className="add-resident-input-field" value={formData.homeAddress} onChange={handleChange} required />
              </div>
           
              <div className="fields-section">
                <p>Place of Birth</p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange}/>
              </div>

              <div className="fields-section">
                <p>Date of Birth<span className="required">*</span></p>
                <input type="date" className="add-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split("T")[0]} required />
              </div>
            
              <div className="fields-section">
                <p>Sex<span className="required">*</span></p>
                <select name="sex" className="add-resident-input-field" value={formData.sex} onChange={handleChange} required>
                  <option value="" disabled>Choose Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Civil Status<span className="required">*</span></p>
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
                <p>Educational Attainment<span className="required">*</span></p>
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
                <p>Nature of Work<span className="required">*</span></p>
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
                <p>Employment Arrangement<span className="required">*</span></p>
                <select name="employmentArrangement" className="add-resident-input-field" value={formData.employmentArrangement} onChange={handleChange} required>
                   <option value="" disabled>Choose Employment Arrangement</option>
                   <option value="1">Live - IN</option>
                   <option value="2">Live - OUT</option>
                </select>
              </div>
            
              <div className="fields-section">
                <p>Range of Salary<span className="required">*</span></p>
                <select name="salary" className="add-resident-input-field" value={formData.salary} onChange={handleChange} required>
                <option value="1">₱1,500 - ₱1,999</option>
                  <option value="2">₱2,000 - ₱2,499</option>
                  <option value="3">₱2,500 - ₱4,999</option>
                  <option value="4">₱5,000 and Above</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Employer Name<span className="required">*</span></p>
                <input type="text" className="add-resident-input-field" placeholder="Enter Employer" name="employerName" value={formData.employerName} onChange={handleChange} required />
              </div>

              <div className="fields-section">
                <p>Employer Address<span className="required">*</span></p>
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