"use client"
import { ChangeEvent, useState } from "react";
import {useAuth} from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsform/requestdocumentsform.css";




export default function BarangayCertificate() {
  const {user} = useAuth();
  const [clearanceInput, setClearanceInput] = useState({
    accountType: user?.uid || "Guest",
    purpose: "",
    dateRequested: new Date().toISOString().split('T')[0],
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfResidency: "",
    address: "",
    birthday: "",
    age: "",
    gender: "",
    civilStatus: "",
    contact: "",
    citizenship: "",
    signaturejpg: "",
    barangayIDjpg: "",
    validIDjpg: "",
    letterjpg: "",
  })

// State for all file containers
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);

  // Handle file selection for any container
  const handleFileChangeContainer1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
      
      if (!validImageTypes.includes(selectedFile.type)) {
        alert("Only JPG, JPEG, and PNG files are allowed.");
        return;
      }

      // Replace existing file instead of adding multiple
      const preview = URL.createObjectURL(selectedFile);
      setFiles([{ name: selectedFile.name, preview }]);
    }
    };


  // Handle file deletion for any container
  const handleFileDeleteContainer1 = (fileName: string) => {
    setFiles([]);

    // Reset file input
    const fileInput = document.getElementById(fileName) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

    
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const {name,value,type} = e.target;
      if (type === "file" && e.target instanceof HTMLInputElement && e.target.files) {
        setClearanceInput((prev:any) => ({
            ...prev,
            file: (e.target as HTMLInputElement).files?.[0] || null,
        }));
        return;
    }


      setClearanceInput((prev) => ({
        ...prev,
        [name]: value
      }));
    }

    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission

      console.log(clearanceInput); // Log the form data
    };

  return (

    <main className="main-form-container">
      <div className="headerpic">
        <p>SERVICES</p>
      </div>

      <div className="form-content">
        <h1 className="form-title">
            Barangay Clearance
        </h1>

        <hr/>

        
        <form className="doc-req-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="purpose" className="form-label">Barangay Clearance Purpose</label>
              <select 
                id="purpose" 
                name="purpose" 
                className="form-input" 
                required
                value={clearanceInput.purpose}
                onChange={handleChange}
              >
                <option value="" disabled>Select purpose</option>
                <option value="Loan">Loan</option>
                <option value="Bank Transaction">Bank Transaction</option>
                <option value="Bank Transaction">Residency</option>
                <option value="Local Employment">Local Employment</option>
                <option value="Maynilad">Maynilad</option>
                <option value="Meralco">Meralco</option>
                <option value="Bail Bond">Bail Bond</option>
                {/* <option value="Character Reputation">Character Reputation</option> */}
                {/* <option value="Request for Referral">Request for Referral</option> */}
                {/* <option value="Issuance of Postal ID">Issuance of Postal ID</option> */}
                {/* <option value="MWSI connection">MWSI connection</option> */}
                {/* <option value="Business Clearance">Business Clearance</option> */}
                {/* <option value="Firearms License">Police Clearance</option> */}
                {/* <option value="Others">Others</option> */}
              </select>
            </div>


           

            <div className="form-group">
              <label htmlFor="firstname" className="form-label">First Name</label>
              <input 
                type="text"  
                id="firstName"  
                name="firstName"  
                className="form-input"  
                required  
                placeholder="Enter First Name" 
                value={clearanceInput.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="middlename" className="form-label">Middle Name</label>
              <input 
                type="text"  
                id="middleName"  
                name="middleName"  
                className="form-input" 
                required  
                value={clearanceInput.middleName}
                onChange={handleChange}
                placeholder="Enter Middle Name"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastname" className="form-label">Last Name</label>
              <input 
                type="text"  
                id="lastName"  
                name="lastName"  
                className="form-input"  
                required 
                value={clearanceInput.lastName}
                onChange={handleChange}
                placeholder="Enter Last Name"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="residentsince" className="form-label">Date of Residency in Barangay Fairview</label>
              <input 
                type="date" 
                id="dateOfResidency" 
                name="dateOfResidency" 
                value={clearanceInput.dateOfResidency}
                onChange={handleChange}
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">Address</label>
              <input 
                type="text"  
                id="address"  
                name="address"  
                value={clearanceInput.address}
                onChange={handleChange}
                className="form-input"  
                required 
                placeholder="Enter Address"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="birthday" className="form-label">Birthday</label>
              <input 
                type="date" 
                id="birthday" 
                name="birthday" 
                className="form-input" 
                value={clearanceInput.birthday}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="age" className="form-label">Age</label>
              <input 
                type="number"  // Ensures the input accepts only numbers
                id="age"  
                name="age"  
                className="form-input" 
                value={clearanceInput.age}
                onChange={handleChange}
                required 
                min="1"  // Minimum age (you can adjust this as needed)
                max="150"  // Maximum age (you can adjust this as needed)
                placeholder="Enter Age"  
                step="1"  // Ensures only whole numbers can be entered
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select 
                id="gender" 
                name="gender" 
                className="form-input" 
                required
                value={clearanceInput.gender}
                onChange={handleChange}
               >
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="civilstatus" className="form-label">Civil Status</label>
              <select 
                id="civilStatus" 
                name="civilStatus" 
                className="form-input" 
                required
                value={clearanceInput.civilStatus}
                onChange={handleChange}
  
              >
                <option value="" disabled>Select civil status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widow">Widow</option>
                <option value="Separated">Separated</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contactnumber" className="form-label">Contact Number</label>
              <input 
                type="tel"  
                id="contact"  
                name="contact"  
                className="form-input" 
                required 
                value={clearanceInput.contact}
                onChange={handleChange}
                placeholder="Enter Contact Number"  
                maxLength={10}  // Restrict the input to 10 characters as a number
                pattern="^[0-9]{10}$"  // Regular expression to enforce a 10-digit number format
                title="Please enter a valid 10-digit contact number"  // Tooltip for invalid input
              />
            </div>

            <div className="form-group">
              <label htmlFor="citizenship" className="form-label">Citizenship</label>
              <input 
                type="text"  
                id="citizenship"  
                name="citizenship"  
                className="form-input"  
                value={clearanceInput.citizenship}
                onChange={handleChange}
                required 
                placeholder="Enter Citizenship"  
              />
            </div>
          

          <hr/>

          <h1 className="form-requirements-title">Requirements</h1>

          <div className="signature/printedname-container">
            <h1 className="form-label"> Upload Signature Over Printed Name</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  value={clearanceInput.signaturejpg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChangeContainer1(e);
                    handleChange(e);
                  }} 
                  
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.map((file, index) => (
                        <div className="file-name-image-display-indiv" key={index}>
                          <li> 
                              {/* Display the image preview */}
                              {file.preview && (
                                <div className="filename&image-container">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                  />
                                </div>
                                )}
                              {file.name}  
                            <div className="delete-container">
                              {/* Delete button with image */}
                              <button
                                  type="button"
                                  onClick={() => handleFileDeleteContainer1('container1')}
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

          <h1 className="form-label-reqs"> Upload either of the following requirements</h1>
          <br/>

          <div className="barangayID-container">
            <h1 className="form-label"> Barangay ID</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload2"
                  type="file"
                  value={clearanceInput.barangayIDjpg}
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChangeContainer1(e);
                    handleChange(e);
                  }} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.map((file, index) => (
                        <div className="file-name-image-display-indiv" key={index}>
                          <li> 
                              {/* Display the image preview */}
                              {file.preview && (
                                <div className="filename&image-container">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                  />
                                </div>
                                )}
                              {file.name}  
                            <div className="delete-container">
                              {/* Delete button with image */}
                              <button
                                  type="button"
                                  onClick={() => handleFileDeleteContainer1('container2')}
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


          <div className="validID-container">
            <h1 className="form-label"> Valid ID with an  address in Barangay Fairvirew</h1>
            <h1 className="form-label-description">(for residents with no Barangay ID)</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload3"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload3"
                  type="file"
                  value={clearanceInput.validIDjpg}
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChangeContainer1(e);
                    handleChange(e);
                  }} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.map((file, index) => (
                        <div className="file-name-image-display-indiv" key={index}>
                          <li> 
                              {/* Display the image preview */}
                              {file.preview && (
                                <div className="filename&image-container">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                  />
                                </div>
                                )}
                              {file.name}  
                            <div className="delete-container">
                              {/* Delete button with image */}
                              <button
                                  type="button"
                                  onClick={() => handleFileDeleteContainer1('container3')}
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

          <div className="endorsementletter-container">
            <h1 className="form-label"> Endorsement Letter from Homeowner/Sitio President</h1>
            <h1 className="form-label-description">(for residents of Barangay Fairview for less than 6 months)</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload4"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  value={clearanceInput.letterjpg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChangeContainer1(e);
                    handleChange(e);
                  }} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.map((file, index) => (
                        <div className="file-name-image-display-indiv" key={index}>
                          <li> 
                              {/* Display the image preview */}
                              {file.preview && (
                                <div className="filename&image-container">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                  />
                                </div>
                                )}
                              {file.name}  
                            <div className="delete-container">
                              {/* Delete button with image */}
                              <button
                                  type="button"
                                  onClick={() => handleFileDeleteContainer1(file.name)}
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

          <div className="form-group button-container">
            
              <button type="submit" className="submit-button">Submit</button>
        
          </div>

        </form>
      </div>

    </main>

    );
}      