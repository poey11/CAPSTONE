"use client"
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/ServicesPage/requestdocumentsform/requestdocumentsform.css";

/*TO DO: add appointment system*/


const metadata:Metadata = { 
  title: "Barangay Indigency",
  description: "Barangay Indigency form page for the barangay website",
};
export default function BarangayIndigency() {



    // State for all file containers
    const [files, setFiles] = useState<{ [key: string]: { name: string, preview: string | undefined }[] }>({
      container1: [],
      container2: [],
      container3: [],
      container4: [],
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

    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission

      // Manually trigger form validation
      const form = event.target as HTMLFormElement;
      if (form.checkValidity()) {
        // Redirect to the Notification page after form submission if validation is successful
        document.location.href = '/services/notification'; // Use JavaScript redirection
      } else {
        // If the form is invalid, trigger the validation
        form.reportValidity(); // This will show validation messages for invalid fields
      }
    };

  return (

    <main className="main-form-container">
      <div className="headerpic">
        <p>SERVICES</p>
      </div>

      <div className="form-content">
        <h1 className="form-title">
            Barangay Indigency
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
                defaultValue=""  
              >
                <option value="" disabled>Select purpose</option>
                <option value="Loan">No Income</option>
                <option value="Bank Transaction">Public Attorneys Office</option>
                <option value="Bank Transaction">AKAP</option>
                <option value="Local Employment">Financial Subsidy of Solo Parent</option>
                <option value="Maynilad">Fire Emergency</option>
                <option value="Meralco">Flood Victims</option>
                <option value="Bail Bond">Philhealth Sponsor</option>
                <option value="Character Reputation">Medical Assistance</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="otherpurpose" className="form-label">Other Purpose</label>
              <input 
                type="text"  
                id="otherpurpose"  
                name="otherpurpose"  
                className="form-input"    
                placeholder="Enter Other Purpose" 
              />
            </div>

            <div className="form-group">
              <label htmlFor="date" className="form-label">Date</label>
              <input 
                type="date" 
                id="date" 
                name="date" 
                className="form-input" 
                required 
              />
            </div>

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
              <label htmlFor="residentsince" className="form-label">Date of Residency in Barangay Fairview</label>
              <input 
                type="date" 
                id="residentsince" 
                name="residentsince" 
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
                defaultValue=""  
              >
                <option value="" disabled>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="civilstatus" className="form-label">Civil Status</label>
              <select 
                id="civilstatus" 
                name="civilstatus" 
                className="form-input" 
                required
                defaultValue=""  
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

            <div className="form-group">
              <label htmlFor="citizenship" className="form-label">Citizenship</label>
              <input 
                type="text"  
                id="citizenship"  
                name="citizenship"  
                className="form-input"  
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
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
                  onChange={handleFileChange('container1')} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.container1.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.container1.map((file, index) => (
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

          <h1 className="form-label-reqs"> Upload either of the following requirements</h1>
          <br/>

          <div className="barangayID-container">
            <h1 className="form-label"> Barangay ID</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload2"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload2"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
                  onChange={handleFileChange('container2')} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.container2.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.container2.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container2', file.name)}
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
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
                  onChange={handleFileChange('container3')} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.container3.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.container3.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container3', file.name)}
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
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
                  onChange={handleFileChange('container4')} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.container4.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.container4.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container4', file.name)}
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