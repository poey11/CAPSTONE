"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../../db/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSession } from "next-auth/react";
import { useRef } from "react";




export default function AddKasambahay() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    registrationControlNumber: "", 
    lastName: "", 
    firstName: "", 
    middleName: "", 
    homeAddress: "", 
    dateOfBirth: "", 
    sex: "", 
    age: 0, 
    placeOfBirth: "",
    civilStatus: "", 
    educationalAttainment: "",
    natureOfWork: "",
    employmentArrangement: "",
    salary: "",
    sssMember: false,
    philhealthMember: false,
    pagibigMember: false,
    employerId: "",
    employerName: "",
    employerAddress: "",
    createdAt:"",
  });

  const fieldSectionMap: { [key: string]: "basic" | "full" | "others" } = {
    lastName: "basic",
    firstName: "basic",
    middleName: "basic",
    sex: "basic",
    homeAddress: "basic",
    dateOfBirth: "basic",
    
    age: "full",
    placeOfBirth: "full",
    civilStatus: "full",
    educationalAttainment: "full",
    natureOfWork: "full",
    employmentArrangement: "full",
    salary: "full",
    employerName: "full",
    employerAddress: "full",

    verificationFiles: "others",
    identificationFile: "others"
  };

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
  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const employerPopupRef = useRef<HTMLDivElement>(null);

  const [residents, setResidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);


  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const residentsCollection = collection(db, "Residents");
            const residentsSnapshot = await getDocs(residentsCollection);
            const residentsList = residentsSnapshot.docs.map(doc => {
                const data = doc.data() as {
                    residentNumber: string;
                    firstName: string;
                    middleName: string;
                    lastName: string;
                    address: string;
                };
    
                return {
                    id: doc.id,
                    ...data
                };
            });
    
            setResidents(residentsList);
      } catch (error) {
        console.error("Error fetching residents:", error);
      }
    };
  
    fetchResidents();
  }, []);

  // Show popup on input focus
  const handleEmployerClick = () => {
    setShowResidentsPopup(true);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employerPopupRef.current &&
        !employerPopupRef.current.contains(event.target as Node)
      ) {
        setShowResidentsPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    if (verificationFiles.length === 0) {
      invalidFields.push("verificationFiles");
    }



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
      
      let verificationFilesURLs: string[] = [];
      if (verificationFiles.length > 0) {
        for (const file of verificationFiles) {
          const storageRef = ref(storage, `ResidentsFiles/VerificationFiles/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          verificationFilesURLs.push(url);
        }
      }

      let identificationFileURL = "";
      if (identificationFile) {
        const storageRef = ref(storage, `ResidentsFiles/IndentificationFile/${identificationFile.name}`);
        await uploadBytes(storageRef, identificationFile);
        identificationFileURL = await getDownloadURL(storageRef);
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
        verificationFilesURLs,
        identificationFileURL,
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

  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
  
      // Ensure only one file is processed
      setIdentificationFile(selectedFile);
      setIdentificationPreview(URL.createObjectURL(selectedFile));
  
      // Reset the file input to prevent multiple selections
      e.target.value = "";
    }
  };

  const handleVerificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const selectedFiles = Array.from(e.target.files);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setVerificationFiles((prev) => [...prev, ...selectedFiles]);
    setVerificationPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }
};
  

  const handleIdentificationFileDelete = () => {
    setIdentificationFile(null);
    setIdentificationPreview(null);
  };

  const handleVerificationFileDelete = (index: number) => {
    setVerificationFiles((prev) => prev.filter((_, i) => i !== index));
    setVerificationPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const [activeSection, setActiveSection] = useState("basic");
// options: "basic", "full", "others"

  return (
    <main className="add-resident-main-container">

      {/*
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
      </div>*/}

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


      <div className="add-resident-bottom-section">
        <nav className="info-toggle-wrapper">
          {["basic", "full", "others"].map((section) => (
            <button
              key={section}
              type="button"
              className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
              onClick={() => setActiveSection(section)}
            >
              {section === "basic" && "Basic Info"}
              {section === "full" && "Full Info"}
              {section === "others" && "Others"}
            </button>
          ))}
        </nav>

      

      <div className="add-resident-bottom-section-scroll">
        <form id="addKasambahayForm" onSubmit={handleSubmit} className="add-resident-section-2">

        {activeSection === "basic" && (
          <>
            <div className="add-main-resident-section-2-full-top">  
              <div className="add-main-resident-section-2-left-side">
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
              </div>

              <div className="add-main-resident-section-2-right-side">
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
                  <p>Date of Birth<span className="required">*</span></p>
                  <input type="date"
                    className={`add-resident-input-field ${invalidFields.includes("dateOfBirth") ? "input-error" : ""}`}
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split("T")[0]}
                    required />
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === "full" && (
          <>
            <div className="add-main-resident-section-2-full-top">  
              <div className="add-main-resident-section-2-left-side">
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
                  <p>Place of Birth</p>
                  <input type="text"
                    className="add-resident-input-field"
                    placeholder="Enter Place of Birth"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleChange}/>
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
              </div>

              <div className="add-main-resident-section-2-right-side">
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

                <div ref={employerPopupRef}>
                  <div className="fields-section">
                    <p>Employer Name<span className="required">*</span></p>
                    <input 
                      type="text"
                      className={`add-resident-input-field ${invalidFields.includes("employerName") ? "input-error" : ""}`} 
                      placeholder="Select Employer"
                      name="employerName"
                      value={formData.employerName}
                      onChange={handleChange}
                      required
                      onClick={handleEmployerClick}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="add-main-resident-section-2-full-bottom">
              <div className="add-main-resident-section-2-cluster">
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
          </>
        )}

        {activeSection === "others" && (
          <>
            <div className="add-main-resident-others-mainsection">
              <div className="add-main-resident-section-2-top-side">
                <div className="box-container-outer-resclassification">
                  <div className="title-resclassification">
                    Social Benefit Status
                  </div>

                  <div className="box-container-resclassification">
                    <div className="checkbox-container">
                      <label className="checkbox-label">
                        <input type="checkbox" name="sssMember" checked={formData.sssMember} onChange={handleChange} />
                        SSS Membership
                      </label>
                    </div>
                    <div className="checkbox-container">
                      <label className="checkbox-label">
                      <input type="checkbox" name="pagibigMember" checked={formData.pagibigMember} onChange={handleChange} />
                        Pag-Ibig Membership
                      </label>
                    </div>
                    <div className="checkbox-container">
                      <label className="checkbox-label">
                      <input type="checkbox" name="philhealthMember" checked={formData.philhealthMember} onChange={handleChange} />
                      PhilHealth Membership
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="add-main-resident-section-2-bottom-side">
                <div className="box-container-outer-resindentificationpic">
                  <div className="title-resindentificationpic">
                    Identification Picture
                  </div>

                  <div className="box-container-resindentificationpic">

                    {/* File Upload Section */}
                    <div className="file-upload-container">
                      <label htmlFor="identification-file-upload" className="upload-link">Click to Upload File</label>
                      <input id="identification-file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleIdentificationFileChange} />

                      {identificationFile && (
                        <div className="file-name-image-display">
                          <div className="file-name-image-display-indiv">
                            {identificationPreview && <img src={identificationPreview} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />}
                            <span>{identificationFile.name}</span>
                            <div className="delete-container">
                              <button type="button" onClick={handleIdentificationFileDelete} className="delete-button">
                                <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>              
                  </div>
                </div>

                <div className="box-container-outer-verificationdocs">
                  <div className="title-verificationdocs">
                    Verification Documents
                  </div>

                  <div className={`box-container-verificationdocs ${invalidFields.includes("verificationFiles") ? "input-error" : ""}`}>
                    <span className="required-asterisk">*</span>

                    {/* File Upload Section */}
                    <div className="file-upload-container">
                      <label htmlFor="verification-file-upload" className="upload-link">Click to Upload File</label>
                      <input id="verification-file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleVerificationFileChange} required/>

                      {verificationFiles.length > 0 && (
                        <div className="file-name-image-display">
                          {verificationFiles.map((file, index) => (
                            <div key={index} className="file-name-image-display-indiv">
                              {verificationPreviews[index] && (
                                <img src={verificationPreviews[index]} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />
                              )}
                              <span>{file.name}</span>
                              <div className="delete-container">
                                <button type="button" onClick={() => handleVerificationFileDelete(index)} className="delete-button">
                                  <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
          )}
        </form>
      </div>
    </div> 
    {error && <p className="error">{error}</p>}
  </div>



      {showResidentsPopup && (
      <div className="kasambahay-employer-popup-overlay">
        <div className="kasambahay-employer-popup" ref={employerPopupRef}>
          <h2>Employers List</h2>
          <h1>* Please select Employer's Name *</h1>

          <input
            type="text"
            placeholder="Search Employer's Name"
            className="employer-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="employers-list">
            {residents.length === 0 ? (
              <p>No residents found.</p>
            ) : (
              <table className="employers-table">
                <thead>
                  <tr>
                    <th>Resident Number</th>
                    <th>First Name</th>
                    <th>Middle Name</th>
                    <th>Last Name</th>
                  </tr>
                </thead>
                <tbody>
                {residents
                .filter((resident) => {
                  const fullName = `${resident.firstName} ${resident.middleName || ""} ${resident.lastName}`.toLowerCase();
                  return fullName.includes(searchTerm.toLowerCase());
                })
                .map((resident) => (
                    <tr
                      key={resident.id}
                      className="employers-table-row"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          employerId: resident.id,
                          employerName: `${resident.lastName}, ${resident.firstName} ${resident.middleName || ''}`,
                          employerAddress: resident.address || '',
                        });
                        setShowResidentsPopup(false);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{resident.residentNumber}</td>
                      <td>{resident.firstName}</td>
                      <td>{resident.middleName}</td>
                      <td>{resident.lastName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )}

      {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add-kasambahay">
                            <div className="confirmation-popup-add-kasambahay">
                              <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`popup-overlay-add-kasambahay show`}>
                    <div className="popup-add-kasambahay">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add-kasambahay show`}>
                    <div className="popup-add-kasambahay">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
    </main>
  );
}
