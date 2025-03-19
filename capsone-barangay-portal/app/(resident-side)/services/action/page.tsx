"use client"
import { ChangeEvent, useEffect, useState } from "react";
import {useAuth} from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsform/requestdocumentsform.css";
import {useSearchParams } from "next/navigation";
import { doc } from "firebase/firestore";




export default function BarangayCertificate() {
  const user = useAuth().user; // Get the current user from the context
  const searchParam = useSearchParams();
  const docType = searchParam.get("doc");

  const [clearanceInput, setClearanceInput] = useState({
    accountId: user?.uid || "Guest",
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
    signaturejpg: null,
    barangayIDjpg:null,
    validIDjpg: null,
    letterjpg:null,
  })
// State for all file containers
const [files, setFiles] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files2, setFiles2] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files3, setFiles3] = useState<{ name: string, preview: string | undefined }[]>([]);
const [files4, setFiles4] = useState<{ name: string, preview: string | undefined }[]>([]);

useEffect(() => {
  if (user) {
    setClearanceInput((prev) => ({
      ...prev,
      accountId: user.uid, // Ensure the latest value is set
    }));
  }
}, [user]); // Runs when `user` changes


const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>, 
  setFile: React.Dispatch<React.SetStateAction<{ name: string, preview: string | undefined }[]>>,
  fileKey: keyof typeof clearanceInput // Key for clearanceInput (signaturejpg, barangayIDjpg, etc.)
) => {
  const selectedFile = event.target.files?.[0];

  if (selectedFile) {
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validImageTypes.includes(selectedFile.type)) {
      alert("Only JPG, JPEG, and PNG files are allowed.");
      return;
    }

    // Create a preview and store the file details
    const preview = URL.createObjectURL(selectedFile);
    setFile([{ name: selectedFile.name, preview }]);

    // Update clearanceInput state with the selected file
    setClearanceInput((prev) => ({
      ...prev,
      [fileKey]: selectedFile, // Assign file directly
    }));

    // Revoke object URL after some time to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(preview), 10000);
  }
};



  // Handle file deletion for any container
  const handleFileDelete = (fileName: string, setFile: React.Dispatch<React.SetStateAction<{ name: string, preview: string | undefined }[]>>) => {
    setFile([]); // Reset the file list state
  
    const fileInput = document.getElementById(fileName) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Clear the file input field
    }
  };
  

    
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
  
    setClearanceInput((prev) => ({
      ...prev,
      [name]: value, // Handle other input types (text, textarea, select)
    }));
  };

    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission

      console.log(clearanceInput); // Log the form data
    };


    console.log(docType)
  return (

    <main className="main-form-container">
      <div className="headerpic">
        <p>SERVICES</p>
      </div>

      <div className="form-content">
        <h1 className="form-title">
            Barangay {docType} Request Form
        </h1>

        <hr/>

        
        <form className="doc-req-form" onSubmit={handleSubmit}>
        {(docType === "Certificate" || docType === "Clearance" ||  docType === "Indigency") && (
          <div className="form-group">
            
          <label htmlFor="purpose" className="form-label">Barangay {docType} Purpose</label>
          <select 
            id="purpose" 
            name="purpose" 
            className="form-input" 
            required
            value={clearanceInput.purpose}
            onChange={handleChange}
          >
            <option value="" disabled>Select purpose</option>
            {docType === "Certificate" ? (<>
              <option value="Residency">Residency</option>
              <option value="Loan">Occupancy /  Moving Out</option>
              <option value="Bank Transaction">Estate Tax</option>
              <option value="Local Employment">Death Residency</option>
              <option value="Maynilad">No Income (Scholarship)</option>
              <option value="Meralco">No Income (ESC)</option>
              <option value="Bail Bond">No Income (For Discount)</option>
              <option value="Character Reputation">Cohabitation</option>
              <option value="Request for Referral">Guardianship</option>
              <option value="Issuance of Postal ID">Good Moral and Probation</option>
              <option value="MWSI connection">Garage/PUV</option>
              <option value="Business Clearance">Garage/TRU</option>
            
            </>):docType === "Clearance" ? (<>
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
            </>):docType === "Indigency"&&( <>
              <option value="Loan">No Income</option>
              <option value="Bank Transaction">Public Attorneys Office</option>
              <option value="Bank Transaction">AKAP</option>
              <option value="Local Employment">Financial Subsidy of Solo Parent</option>
              <option value="Maynilad">Fire Emergency</option>
              <option value="Meralco">Flood Victims</option>
              <option value="Bail Bond">Philhealth Sponsor</option>
              <option value="Character Reputation">Medical Assistance</option>
            </>)}
            
          </select>
        </div>


        )}
            

           

            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First Name</label>
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
              <label htmlFor="middleName" className="form-label">Middle Name</label>
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
              <label htmlFor="lastName" className="form-label">Last Name</label>
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
              <label htmlFor="dateOfResidency" className="form-label">Date of Residency in Barangay Fairview</label>
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

            {docType ==="BarangayID" && (
              <div className="form-group">
                <label htmlFor="birthdayplace" className="form-label">Birthplace</label>
                <input 
                  type="text" 
                  id="birthdayplace" 
                  name="birthdayplace" 
                  className="form-input" 
                  required 
                  placeholder="Enter Birthplace" 
                />
              </div>
            )}

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

            {docType ==="BarangayID" && (
              <>
                <div className="form-group">
                  <label htmlFor="religion" className="form-label">Religion</label>
                  <input 
                    type="text" 
                    id="religion" 
                    name="religion" 
                    className="form-input" 
                    required 
                    placeholder="Enter Religion" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nationality" className="form-label">Nationality</label>
                  <input 
                    type="text" 
                    id="nationality" 
                    name="nationality" 
                    className="form-input" 
                    required 
                    placeholder="Enter Nationality" 
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="civilStatus" className="form-label">Civil Status</label>
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

            {docType ==="BarangayID" && (
              <>
                <div className="form-group">
                  <label htmlFor="height" className="form-label">Height</label>
                  <input 
                    type="number" 
                    id="height" 
                    name="height" 
                    className="form-input" 
                    required 
                    placeholder="Enter Height" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight" className="form-label">Weight</label>
                  <input 
                    type="number" 
                    id="weight" 
                    name="weight" 
                    className="form-input" 
                    required 
                    placeholder="Enter Weight" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bloodtype" className="form-label">Blood Type</label>
                  <input 
                    type="text" 
                    id="bloodtype" 
                    name="bloodtype" 
                    className="form-input" 
                    required 
                    placeholder="Enter Blood Type" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="occupation" className="form-label">Occupation</label>
                  <input 
                    type="text" 
                    id="occupation" 
                    name="occupation" 
                    className="form-input" 
                    required 
                    placeholder="Enter Occupation" 
                  />
                </div>

            </>)}

            <div className="form-group">
              <label htmlFor="contact" className="form-label">Contact Number</label>
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

            

            {docType ==="BarangayID" ? (
              <div className="form-group">
              <label htmlFor="precinctno" className="form-label">Precinct Number</label>
              <input 
                type="number" 
                id="precinctno" 
                name="precinctno" 
                className="form-input" 
                required 
                placeholder="Enter Precinct Number" 
              />
              </div>
            ):(<div className="form-group">
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
            </div>  )}
          

          <hr/>

          {docType ==="BarangayID" && (
            <>
              <h1 className="form-requirements-title">Emergency Details</h1>

              <div className="form-group">
                <label htmlFor="firstname" className="form-label">First Name</label>
                <input 
                  type="text"  
                  id="firstname"  
                  name="firstname"  
                  className="form-input"  
                  required  
                  placeholder="Enter First Name" 
                />
              </div>

              <div className="form-group">
                <label htmlFor="middlename" className="form-label">Middle Name</label>
                <input 
                  type="text"  
                  id="middlename"  
                  name="middlename"  
                  className="form-input" 
                  required  
                  placeholder="Enter Middle Name"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastname" className="form-label">Last Name</label>
                <input 
                  type="text"  
                  id="lastname"  
                  name="lastname"  
                  className="form-input"  
                  required 
                  placeholder="Enter Last Name"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="address" className="form-label">Address</label>
                <input 
                  type="text"  
                  id="address"  
                  name="address"  
                  className="form-input"  
                  required 
                  placeholder="Enter Address"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="relationship" className="form-label">Relationship</label>
                <input 
                  type="text"  
                  id="relationship"  
                  name="relationship"  
                  className="form-input"  
                  required 
                  placeholder="Enter Relationship"  
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactnumber" className="form-label">Contact Number</label>
                <input 
                  type="tel"  
                  id="contactnumber"  
                  name="contactnumber"  
                  className="form-input" 
                  required 
                  placeholder="Enter Contact Number"  
                  maxLength={10}  // Restrict the input to 10 characters as a number
                  pattern="^[0-9]{10}$"  // Regular expression to enforce a 10-digit number format
                  title="Please enter a valid 10-digit contact number"  // Tooltip for invalid input
                />
              </div>

              <hr/>
            </>
          )}

          <h1 className="form-requirements-title">Requirements</h1>

          <div className="signature/printedname-container">
            <h1 className="form-label"> Upload Signature Over Printed Name</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e, setFiles, 'signaturejpg');
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
                                  onClick={() => handleFileDelete('container1', setFiles)}
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
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles2, 'barangayIDjpg');
                  }} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files2.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files2.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container2', setFiles2)}
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
                  accept=".jpg,.jpeg,.png"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles3, 'validIDjpg');
                  }} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files3.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files3.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container3', setFiles3)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    handleFileChange(e,setFiles4, 'letterjpg');
                   
                  }} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files4.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files4.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container4', setFiles4)}
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