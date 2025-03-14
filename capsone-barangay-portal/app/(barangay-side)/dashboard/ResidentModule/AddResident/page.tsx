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
      <main className="main-container">
        <div className="main-content">
          <Link href="/dashboard/ResidentModule">
            <button type="button" className="back-button" onClick={handleBack}></button>
          </Link>

          <div className="section-1">
            <p className="NewResident">New Resident</p>
            <div className="actions">
              <button className="action-view" type="submit" form="addResidentForm" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <form id="addResidentForm" onSubmit={handleSubmit} className="section-2">
            {/* Left Side - Resident Form */}
            <div className="section-2-left-side">
              <p>Full Name</p>
              <input type="text" className="search-bar" placeholder="Enter Full Name" name="name" value={formData.name} onChange={handleChange} required />

              <p>Address</p>
              <input type="text" className="search-bar" placeholder="Enter Address" name="address" value={formData.address} onChange={handleChange} required />

              <p>Location</p>
              <select name="generalLocation" className="featuredStatus" value={formData.generalLocation} onChange={handleChange} required>
                <option value="" disabled>Choose Part of Fairview</option>
                <option value="East Fairview">East Fairview</option>
                <option value="West Fairview">West Fairview</option>
                <option value="South Fairview">South Fairview</option>
              </select>

              <p>Place of Birth</p>
              <input type="text" className="search-bar" placeholder="Enter Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} required />

              <p>Date of Birth</p>
              <input type="date" className="search-bar" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />

              <p>Age</p>
              <input type="number" className="search-bar" placeholder="Enter Age" name="age" value={formData.age} onChange={handleChange} required min="1" max="120" />

              <p>Sex</p>
              <select name="sex" className="featuredStatus" value={formData.sex} onChange={handleChange} required>
                <option value="" disabled>Choose Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <p>Civil Status</p>
              <select name="civilStatus" className="featuredStatus" value={formData.civilStatus} onChange={handleChange} required>
                <option value="" disabled>Choose Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
                <option value="Separated">Separated</option>
              </select>

              <p>Occupation</p>
              <input type="text" className="search-bar" placeholder="Enter Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />

              <p>Contact Number</p>
              <input type="tel" className="search-bar" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required pattern="[0-9]{11}" placeholder="Enter 11-digit phone number" />

              <p>Email Address</p>
              <input type="email" className="search-bar" placeholder="Enter Email Address" name="emailAddress" value={formData.emailAddress} onChange={handleChange} />

              <p>Precinct Number</p>
              <input type="text" className="search-bar" placeholder="Enter Precinct Number" name="precinctNumber" value={formData.precinctNumber} onChange={handleChange} />
            </div>

            {/* Right Side - Checkboxes & File Upload */}
            <div className="section-2-right-side">
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
      </main>
  );
}