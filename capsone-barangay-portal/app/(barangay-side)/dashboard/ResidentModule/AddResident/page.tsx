"use client";
import "@/CSS/ResidentModule/addresident.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function AddResident() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    address: "",
    dateOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    occupation: "",
    employer: "",
    employerAddress: "",
    contactNumber: "",
    emailAddress: "",
    precinctNumber: "",
    placeOfBirth: "",
    generalLocation:"",
    PWD:false,
    soloParent:false,
    isVoter: false,
  });

  const [files, setFiles] = useState<{ name: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        preview: URL.createObjectURL(file),
      }));
      setFiles([...files, ...uploadedFiles]);
    }
  };

  const handleFileDelete = (fileName: string) => {
    setFiles(files.filter((file) => file.name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addDoc(collection(db, "Residents"), {
        ...formData,
        createdAt: serverTimestamp(),
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
        <button type="button" className="back-button" onClick={handleBack}></button>;
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

        <div className="section-2-left-side">
            <p>First Name</p>
            <input type="text" 
            className="search-bar" 
            placeholder="Enter First Name"  
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} required />


            <p>Last Name</p>
            <input type="text" 
            className="search-bar" 
            placeholder="Enter Last Name"  
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} required />


            <p>Middle Name</p>
            <input type="text" 
            className="search-bar" 
            placeholder="Enter Middle Name"  
            name="middleName" 
            value={formData.middleName} 
            onChange={handleChange} required />            
            

            <p>Address</p>
            <input type="text" 
            className="search-bar" 
            placeholder="Enter Address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} required />
            
            <p>Location</p>
            <select name="generalLocation" className="featuredStatus" value={formData.generalLocation} onChange={handleChange} required>
              <option value="" disabled>Choose Part of Fairview</option>
              <option value="East Fairview">East Fairview</option>
              <option value="West Fairview">West Fairview</option>
              <option value="South Fairview">South Fairview</option>
            </select>

            <p>Place of Birth</p>
            <input type="text" 
            className="search-bar" 
            placeholder="Enter Place of Birth" 
            name="placeOfBirth" 
            value={formData.placeOfBirth} 
            onChange={handleChange} required />

            <p>Date of Birth</p>
            <input type="date" 
            className="search-bar" 
            name="dateOfBirth" 
            value={formData.dateOfBirth} 
            onChange={handleChange} required />

            <p>Age</p>
            <input
              type="number"
              className="search-bar" 
              placeholder="Enter Age" 
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="1"
              max="120"
            />

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
            <input type="text" 
            className="search-bar"           
            placeholder="Enter Occupation"  
            name="occupation" 
            value={formData.occupation} 
            onChange={handleChange} required />

            <p>Employer Name</p>
            <input type="text" 
            className="search-bar"           
            placeholder="Enter Employer"  
            name="employer" 
            value={formData.employer} 
            onChange={handleChange} required />

            <p>Employer Address</p>
            <input type="text" 
            className="search-bar"           
            placeholder="Enter Employer Address"  
            name="employerAddress" 
            value={formData.employerAddress} 
            onChange={handleChange} required />

            <p>Contact Number</p>
            <input
              type="tel"
              className="search-bar"                       
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              pattern="[0-9]{11}"
              placeholder="Enter 11-digit phone number"
            />

            <p>Email Address</p>
            <input type="email" 
            className="search-bar"           
            placeholder="Enter Email Address"              
            name="emailAddress" 
            value={formData.emailAddress} 
            onChange={handleChange} required />

            <p>Precinct Number</p>
            <input type="text" 
            className="search-bar"           
            placeholder="Enter Precinct Number"              
            name="precinctNumber" 
            value={formData.precinctNumber} 
            onChange={handleChange} required />

            <p>PWD</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="PWD" checked={formData.PWD} onChange={handleChange} />
                Is this resident a person with disability?
              </label>
            </div>

            <p>Solo Parent</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="soloParent" checked={formData.soloParent} onChange={handleChange} />
                Is this resident a solo parent?
              </label>
            </div>

            <p>Voter</p>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="isVoter" checked={formData.isVoter} onChange={handleChange} />
                Is this resident a registered voter?
              </label>
            </div>

            </div>
            <div className="section-2-right-side">
  <div className="file-upload-container">
    <label htmlFor="file-upload" className="upload-link">Click to Upload File</label>
    <input
      id="file-upload"
      type="file"
      className="file-upload-input"
      multiple
      accept=".jpg,.jpeg,.png"
      // required 
      onChange={handleFileChange}
    />
    <div className="uploadedFiles-container">
      {files.length > 0 && (
        <div className="file-name-image-display">
          <ul>
            {files.map((file, index) => (
              <div className="file-name-image-display-indiv" key={index}>
                <li>
                  {file.preview && (
                    <div className="filename&image-container">
                      <img
                        src={file.preview}
                        alt={file.name}
                        style={{ width: "50px", height: "50px", marginRight: "5px" }}
                      />
                    </div>
                  )}
                  {file.name}
                  <div className="delete-container">
                    <button
                      type="button"
                      onClick={() => handleFileDelete(file.name)}
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
