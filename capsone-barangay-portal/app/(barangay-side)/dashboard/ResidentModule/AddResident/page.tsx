"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../../db/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

export default function AddResident() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const [files, setFiles] = useState<{ [key: string]: { name: string, preview: string | undefined }[] }>({
    container1: [],
});

// Handle file selection for any container
const handleFileChange = (container: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles).map((file) => {
        const preview = URL.createObjectURL(file);
        return { name: file.name, preview };
      });
      setFiles((prevFiles) => ({
        ...prevFiles,
        [container]: [...prevFiles[container], ...fileArray], // Append new files to the specified container
      }));
    }
  };

  // Handle file deletion for any container
  const handleFileDelete = (container: string, fileName: string) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [container]: prevFiles[container].filter((file) => file.name !== fileName),
    }));
  };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      let fileURL = "";
      if (file) {
        const storageRef = ref(storage, `ResidentsFiles/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }
  
      // Fetch the highest residentNumber
      const residentsRef = collection(db, "Residents");
      const q = query(residentsRef, orderBy("residentNumber", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
  
      let newResidentNumber = 1; // Default to 1 if no residents exist
  
      if (!querySnapshot.empty) {
        const lastResident = querySnapshot.docs[0].data();
        newResidentNumber = lastResident.residentNumber + 1;
      }
  
      // Add the new resident with an incremented residentNumber
      await addDoc(residentsRef, {
        ...formData,
        residentNumber: newResidentNumber,
        createdAt: serverTimestamp(),
        fileURL,
      });
  
      alert("Resident added successfully!");
      router.push("/dashboard/ResidentModule");
    } catch (err) {
      setError("Failed to add resident");
      console.error(err);
    }
  
    setLoading(false);
  };
  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule";
  };

  return (
      <main className="add-resident-main-container">

        <div className="section-1">
          <h1>Add New Resident</h1>
        </div>
        
        <div className="add-resident-main-content">
          <div className="add-resident-main-section1">
            <div className="add-resident-main-section1-left">
              <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>

              <h1> New Resident </h1>
            </div>

            <div className="action-btn-section">
              <button className="action-view" type="submit" form="addResidentForm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            
          </div>
          
          <hr/>


          <form id="addResidentForm" onSubmit={handleSubmit} className="add-resident-section-2">
            {/* Left Side - Resident Form */}
            <div className="add-resident-section-2-left-side">
              <div className="fields-container">
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

              {/* File Upload Section */}
              <div className="file-upload-container">
                <label htmlFor="file-upload" className="upload-link">Click to Upload File</label>
                <input id="file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleFileChange('container1')} />


              <div className="uploadedFiles-container">
                                {/* Display the file names with image previews */}
                                {files.container1.length > 0 && (
                                    <div className="file-name-image-display">
                                        <ul>
                                            {files.container1.map((file, index) => (
                                                <div className="file-name-image-display-indiv" key={index}>
                                                    <li className="file-item"> 
                                                        {/* Display the image preview */}
                                                        {file.preview && (
                                                            <div className="filename-image-container">
                                                                <img
                                                                    src={file.preview}
                                                                    alt={file.name}
                                                                    className="file-preview"
                                                                />
                                                            </div>
                                                        )}
                                                        <span className="file-name">{file.name}</span>  
                                                        <div className="delete-container">
                                                            {/* Delete button with image */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileDelete('container1', file.name)}
                                                                className="delete-button"
                                                            >
                                                                <img
                                                                    src="/images/trash.png"  
                                                                    alt="Delete"
                                                                    className="delete-icon"
                                                                />
                                                            </button>
                                                        </div>
                                                    </li>
                                                </div>
                                            ))}  
                                        </ul>
                                    </div>
                                )}
                            </div>
              </div>
            </div>
          </form>

          {error && <p className="error">{error}</p>}
        </div>
      </main>
  );
}