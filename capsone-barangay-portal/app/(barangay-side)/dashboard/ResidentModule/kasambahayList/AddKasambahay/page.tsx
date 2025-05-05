"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSession } from "next-auth/react";


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
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

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
  
    if (name === "dateOfBirth") {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
  
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--; // Adjust if birthday hasn't happened yet this year
      }
  
      setFormData({
        ...formData,
        dateOfBirth: value,
        age: age,
      });
    } else {
      setFormData({
        ...formData,
        [name]: numericFields.includes(name)
          ? Number(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
      });
    }
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
    const { lastName, firstName, homeAddress, dateOfBirth, age, sex, 
      civilStatus, educationalAttainment, natureOfWork, employmentArrangement, 
      salary, employerName, employerAddress} = formData;
  

    const invalidFields : string[] = [];

    if (!lastName) invalidFields.push("lastName");
    if (!firstName) invalidFields.push("firstName");
    if (!homeAddress) invalidFields.push("homeAddress");
    if (!dateOfBirth) invalidFields.push("dateOfBirth");
    if (!age) invalidFields.push("age");
    if (!sex) invalidFields.push("sex");
    if (!civilStatus) invalidFields.push("civilStatus");
    if (!educationalAttainment) invalidFields.push ("educationalAttainment");
    if (!natureOfWork) invalidFields.push ("natureOfWork");
    if (!employmentArrangement) invalidFields.push ("employmentArrangement");
    if (!salary) invalidFields.push("salary");
    if (!employerName) invalidFields.push("employerName");
    if (!employerAddress) invalidFields.push("employerAddress")



      if (invalidFields.length > 0) {
        setInvalidFields(invalidFields);
        setPopupErrorMessage("Please fill up all required fields.");
        setShowErrorPopup(true);
    
        setTimeout(() => {
          setShowErrorPopup(false);
        }, 3000);
        return;
      }
    
      setInvalidFields([]);
      setShowSubmitPopup(true);
  };


  const confirmSubmit = async () => {
    setShowSubmitPopup(false);

    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    const docId = await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  
    if (!docId) {
      setPopupErrorMessage("Failed to create Kasambahay Record.");
      setShowErrorPopup(true);
      return;
    }

    setPopupMessage("Kasambahay Record added successfully!");
    setShowPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
      router.push(`/dashboard/ResidentModule/kasambahayList?highlight=${docId}`);
    }, 3000);

  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      let fileURL = "";
      if (file) {
        const storageRef = ref(storage, `KasambahayFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }
  
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

      const docRef = await addDoc(kasambahayCollection, {
        ...formData,
        registrationControlNumber: latestNumber,
        createdAt: currentDate,
        fileURL,
        createdBy: session?.user?.position || "Unknown",
      });
      return docRef.id; // return ID
  
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
      <div className="path-section">
        <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
        <h1 className="breadcrumb">
          <Link href="/dashboard/ResidentModule/kasambahayList">Kasambahay Masterlist</Link>
          <span className="chevron">/</span>
        </h1>
        <h2 className="breadcrumb">Add Kasambahay<span className="chevron"></span></h2>
      </div>

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
                <p>Last Name<span className="required">*</span></p>
                <input type="text"
                className={`add-resident-input-field ${invalidFields.includes("lastName") ? "input-error" : ""}`}
                  placeholder="Enter Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange} 
                  required />
              </div>

              <div className="fields-section">
                <p>First Name<span className="required">*</span></p>
                <input type="text"
                   className={`add-resident-input-field ${invalidFields.includes("firstName") ? "input-error" : ""}`}
                   placeholder="Enter First Name"
                   name="firstName"
                   value={formData.firstName}
                   onChange={handleChange}
                   required />
              </div>
              
              <div className="fields-section">
                <p>Middle Name</p>
                <input type="text"
                className="add-resident-input-field"
                 placeholder="Enter Middle Name"
                 name="middleName"
                value={formData.middleName}
                 onChange={handleChange} 
                 required
                 />
              </div>

              <div className="fields-section">
                <p>Home Address<span className="required">*</span></p>
                <input type="text"
                  className={`add-resident-input-field ${invalidFields.includes("homeAddress") ? "input-error" : ""}`}
                  placeholder="Enter Address"
                   name="homeAddress"
                    value={formData.homeAddress}
                     onChange={handleChange}
                      required />
              </div>

              <div className="fields-section">
                <p>Place of Birth</p>
                <input type="text"
                 className="add-resident-input-field"
                  placeholder="Enter Place of Birth"
                   name="placeOfBirth"
                    value={formData.placeOfBirth}
                     onChange={handleChange}/>
              </div>

              <div className="fields-section">
                <p>Date of Birth<span className="required">*</span></p>
                <input type="date"
                 className={`add-resident-input-field ${invalidFields.includes("dateOfBirth") ? "input-error" : ""}`}
                 name="dateOfBirth"
                 value={formData.dateOfBirth}
                 onChange={handleChange}
                 max={new Date().toISOString().split("T")[0]}
                 required />
              </div>
                
              <div className="fields-section">
                <p>Age<span className="required">*</span></p>
                  <input
                    type="number"
                    className={`add-resident-input-field ${invalidFields.includes("age") ? "input-error" : ""}`}
                    placeholder="Enter Age" 
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    readOnly
                  />
              </div>

              <div className="fields-section">
                <p>Sex<span className="required">*</span></p>
                <select
                 name="sex"
                 className={`add-resident-input-field ${invalidFields.includes("sex") ? "input-error" : ""}`}
                   value={formData.sex}
                    onChange={handleChange}
                     required>
                  <option value="" disabled>Choose Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Civil Status<span className="required">*</span></p>
                  <select
                   name="civilStatus"
                   className={`add-resident-input-field ${invalidFields.includes("civilStatus") ? "input-error" : ""}`}
                     value={formData.civilStatus}
                      onChange={handleChange}
                       required
                       >
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
                  <select name="educationalAttainment"  className={`add-resident-input-field ${invalidFields.includes("educationalAttainment") ? "input-error" : ""}`} value={formData.educationalAttainment} onChange={handleChange} required>
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
                <select 
                name="natureOfWork"
                className={`add-resident-input-field ${invalidFields.includes("natureOfWork") ? "input-error" : ""}`} 
                  value={formData.natureOfWork}
                   onChange={handleChange}
                    required
                    >
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
                <select 
                name="employmentArrangement"
                className={`add-resident-input-field ${invalidFields.includes("employmentArrangement") ? "input-error" : ""}`} 
                  value={formData.employmentArrangement}
                   onChange={handleChange}
                    required
                    >
                  <option value="" disabled>Choose Employment Arrangement</option>
                  <option value="1">Live - IN</option>
                  <option value="2">Live - OUT</option>
                </select>
              </div>

              <div className="fields-section">
                <p>Range of Salary<span className="required">*</span></p>
                <select 
                name="salary"
                className={`add-resident-input-field ${invalidFields.includes("salary") ? "input-error" : ""}`} 
                  value={formData.salary}
                   onChange={handleChange}
                    required>
                  <option value="" disabled>Choose Salary Range</option>
                  <option value="1">₱1,500 - ₱1,999</option>
                  <option value="2">₱2,000 - ₱2,499</option>
                  <option value="3">₱2,500 - ₱4,999</option>
                  <option value="4">₱5,000 and Above</option>
                </select>
              </div>

                
              <div className="fields-section">
                <p>Employer Name<span className="required">*</span></p>
                <input 
                type="text"
                className={`add-resident-input-field ${invalidFields.includes("employerName") ? "input-error" : ""}`} 
                  placeholder="Enter Employer"
                   name="employerName"
                    value={formData.employerName}
                     onChange={handleChange}
                      required />
              </div>

              <div className="fields-section">
                <p>Employer Address<span className="required">*</span></p>
                <input 
                type="text"
                className={`add-resident-input-field ${invalidFields.includes("employerAddress") ? "input-error" : ""}`} 
                  placeholder="Enter Employer Address"
                  name="employerAddress"
                  value={formData.employerAddress}
                  onChange={handleChange}
                  required />
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
