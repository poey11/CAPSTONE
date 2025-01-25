"use client"
import type { Metadata } from "next";
import { useState } from "react";




const metadata:Metadata = { 
  title: "Barangay Certificate Others",
  description: "Barangay Certificate Others form page for the barangay website",
};
export default function BarangayClearanceOthers() {



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

    <div className="form-container">

      <div className="headerpic">
        <p>SERVICES</p>
      </div>

      <div className="form-content">
        <h1 className="form-title">
            Barangay Certificate
        </h1>

        <hr/>

        
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="purpose" className="form-label">Barangay Certificate Purpose</label>
              <select 
                id="purpose" 
                name="purpose" 
                className="form-input" 
                required
                defaultValue=""  
              >

                <option value="" disabled>Select purpose</option>
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





      <style jsx>{`

        .form-container {
          font-family: Arial, sans-serif;
          background-color: #ffe0ca;
          color: #333;
          margin: 0;
          width: 100%; 
          height: 100%;
        }

        .headerpic {
          position: relative; /* Required for pseudo-elements */
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 40px;
          font-weight: bold;
          overflow: hidden; /* Ensures blur doesn't spill outside */
        }

        .headerpic::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/header.jpg');
          background-size: cover;
          background-position: 50% 50%;
          background-repeat: no-repeat;
          filter: blur(2px); /* Adjust the blur intensity */
          z-index: 1; /* Place the blurred background below the text */
        }

        .headerpic > * {
          position: relative;
          z-index: 2; /* Ensure text is above the blurred background */
        }

        .form-content {
          background-color: rgba(255, 255, 255, 0.7);
          padding: 50px;
          margin-top: 55px;
          margin-left: 300px;
          margin-right: 300px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .form-content hr {
          border: none; 
          border-top: 2px solid rgba(0, 0, 0, 0.20);
          margin-top: 20px;
          margin-bottom: 40px;
        }

        .form-title {
          font-size: 30px; 
          color: rgba(0, 0, 0, 0.5);
          text-align: center;
          font-weight: bold;  
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .form-group {
          margin-top: 13px;
          margin-bottom: 0px;
        }


        .form-label {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.5);
        }

        .form-label-reqs{
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.5);
          text-align:center;
        }

        .form-label-description {
          display: block;
          font-size: 13px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.5);
        }

        .form-input {
          width: 100%;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-top: 2px;
          color: grey;
        }

        .form-requirements-title{
          font-size: 20px;
          color: rgba(0, 0, 0, 0.5); 
          text-align: center;
          font-weight: bold;  
          margin-bottom: 40px;
        }


        .form-requirements {
          margin-top: 30px;
          text-align: center;
        }

        .file-upload-container {
          margin-top: 5px;
          margin-bottom: 40px;
          border: 2px dashed rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 30px;
          background-color: rgba(255, 255, 255, 0.9);
          transition: background-color 0.3s ease;
          display: block;
          align-items: center; 
          justify-content: center; 
          text-align: center;
          height: 100%; /* Set a fixed height for better UI experience */
        }

        .file-upload-container:hover {
          background-color: rgba(245, 143, 88, 0.2);
        }

        .uploadedFiles-container{
          display: block;
        }

        .file-upload-label {
          font-size: 16px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.6);
          text-align: center;
          
        }

        .upload-link {
          color: rgb(245, 143, 88);
          text-decoration: underline;
          cursor: pointer;
        }

        .file-upload-input {
          display: none;
        }

        .file-name-image-display {
          margin-top: 10px;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.6);
          text-align: center;
        }

        .file-name-image-display-indiv {
          display: flex;
          align-items: center;
          justify-content: space-between; 
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }

        .filename&image-container {
          display: flex;
          align-items: center;
          flex-grow: 1; 
          overflow: hidden; 
          margin-top:10px;
        }

        .file-name-image-display-indiv li {
          display: flex;
          flex-grow: 1;
          overflow: hidden; 
          white-space: nowrap; 
          text-overflow: ellipsis; 
        }

        .delete-container {
          margin-left: auto; 
        }

        .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
        }

        .delete-icon {
          width: 20px;
          height: 20px;
        }

        .button-container {
          display: flex;
          justify-content: center; 
          margin-top: 50px; 
        }

        .submit-button {
          padding: 10px 20px;
          font-size: 16px;
          background-color:rgb(245, 143, 88);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer; 
          width: 350px;
          box-shadow: 0 2px 4px rgba(0, 0, 10, 0.3);
        }

        .submit-button:hover {
          background-color: #e56723;
        }

        


      `}</style>
    </div>
    
    );
}