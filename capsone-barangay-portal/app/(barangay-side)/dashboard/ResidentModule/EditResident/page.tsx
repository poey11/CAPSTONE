"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, storage } from "../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

export default function EditResident() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");

  const [formData, setFormData] = useState({
    residentNumber: 0,
    name: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    occupation: "",
    contactNumber: "",
    emailAddress: "",
    precinctNumber: "",
    generalLocation: "",
    isStudent: false,
    isPWD: false,
    isSeniorCitizen: false,
    isSoloParent: false,
    fileURL: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (residentId) {
      const fetchResidentData = async () => {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData({
            residentNumber: docSnap.data().residentNumber || 0,
            name: docSnap.data().name || "",
            address: docSnap.data().address || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            placeOfBirth: docSnap.data().placeOfBirth || "",
            age: docSnap.data().age || 0,
            sex: docSnap.data().sex || "",
            civilStatus: docSnap.data().civilStatus || "",
            occupation: docSnap.data().occupation || "",
            contactNumber: docSnap.data().contactNumber || "",
            emailAddress: docSnap.data().emailAddress || "",
            precinctNumber: docSnap.data().precinctNumber || "",
            generalLocation: docSnap.data().generalLocation || "",
            isStudent: docSnap.data().isStudent || false,
            isPWD: docSnap.data().isPWD || false,
            isSeniorCitizen: docSnap.data().isSeniorCitizen || false,
            isSoloParent: docSnap.data().isSoloParent || false,
            fileURL: docSnap.data().fileURL || "",
          });
                    setPreview(docSnap.data().fileURL || null);
        }
      };
      fetchResidentData();
    }
  }, [residentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    if (name === "age") {
      const ageValue = parseInt(value, 10) || 0;
      setFormData((prevData) => ({
        ...prevData,
        age: ageValue,
        isSeniorCitizen: ageValue >= 60,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: newValue,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      e.target.value = "";
    }
  };

  const handleFileDelete = () => {
    setFile(null);
    setPreview(null); // ✅ Ensure it's undefined
    setFormData((prev) => ({ ...prev, fileURL: "" }));  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let fileURL = formData.fileURL;
      if (file) {
        const storageRef = ref(storage, `ResidentsFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, "Residents", residentId!);
      await updateDoc(docRef, {
        ...formData,
        fileURL,
      });

      alert("Resident updated successfully!");
      router.push("/dashboard/ResidentModule");
    } catch (err) {
      setError("Failed to update resident");
      console.error(err);
    }

    setLoading(false);
  };
  
    const handleBack = () => {
      window.location.href = "/dashboard/ResidentModule";
    };
  

    return (
        <main className="add-resident-main-container">
          <div className="addresident-page-title-section-1">
            <h1>Edit Resident Details</h1>
          </div>
          <div className="add-resident-main-content">
          <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> Edit Resident </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view" type="submit" form="editResidentForm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            
          </div>

          <hr/>

  
            <form id="editResidentForm" onSubmit={handleSubmit} className="add-resident-section-2">
              {/* Left Side - Resident Form */}
              <div className="add-resident-section-2-left-side">

                <div className="fields-container">
                  <div className="fields-section">
                    <p>Resident Number</p>
                    <input type="text" className="add-resident-input-field-disabled" name="residentNumber" value={formData.residentNumber} onChange={handleChange} disabled />
                  </div>

                  <div className="fields-section">
                    <p>Full Name</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Full Name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  
                  <div className="fields-section">
                    <p>Address</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  
                  <div className="fields-section">
                    <p>Location</p>
                    <select name="generalLocation" className="add-resident-input-field" value={formData.generalLocation} onChange={handleChange} required>
                      <option value="" disabled>Choose Part of Fairview</option>
                      <option value="East Fairview">East Fairview</option>
                      <option value="West Fairview">West Fairview</option>
                      <option value="South Fairview">South Fairview</option>
                    </select>
                  </div>
                  
    
                  <div className="fields-section">
                    <p>Place of Birth</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required />
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
                    <p>Occupation</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
                  </div>
                  
    
                  <div className="fields-section">
                    <p>Contact Number</p>
                    <input type="tel" className="add-resident-input-field" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required pattern="[0-9]{11}" placeholder="Enter 11-digit phone number" />
                  </div>
                  
                  <div className="fields-section">
                    <p>Email Address</p>
                    <input type="email" className="add-resident-input-field" placeholder="Enter Email Address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />
                  </div>


                  <div className="fields-section">
                    <p>Precinct Number</p>
                    <input type="text" className="add-resident-input-field" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
                  </div>
                </div>
              </div>
  
              {/* Right Side - Checkboxes & File Upload */}
              <div className="add-resident-section-2-right-side">
                <div className="checkboxes-container">
                  <p>Student</p>
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input type="checkbox" name="isStudent" checked={formData.isStudent} onChange={handleChange} />
                      Is this resident a student?
                    </label>
                  </div>
  
                  <p>PWD</p>
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input type="checkbox" name="isPWD" checked={formData.isPWD} onChange={handleChange} />
                      Is this resident a person with disability?
                    </label>
                  </div>
  
                  <p>Solo Parent</p>
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input type="checkbox" name="isSoloParent" checked={formData.isSoloParent} onChange={handleChange} />
                      Is this resident a solo parent?
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
        </main>
    );
  }