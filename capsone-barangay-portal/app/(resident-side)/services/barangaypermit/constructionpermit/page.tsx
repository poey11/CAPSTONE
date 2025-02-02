"use client"
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/ServicesPage/barangaypermit/constructionpermit/constructionpermit.css";


const metadata:Metadata = { 
  title: "Barangay Construction Permit",
  description: "Barangay Construction Permit form page for the barangay website",
};
export default function BarangayConstructionPermit() {



    // State for all file containers
    const [files, setFiles] = useState<{ [key: string]: { name: string, preview: string | undefined }[] }>({
      container1: [],
      container2: [],
      container3: [],
      container4: [],
      container5: [],
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
            Barangay Construction Permit
        </h1>

        <hr/>

        
          <form onSubmit={handleSubmit}>

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
                <label className="form-label">Type of Construction Activity</label>
                <div className="main-form-radio-group">
                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="structure" name="structure" value="structure" required />
                            Structure
                        </label>
                        <label className="form-radio">
                        <input type="radio" id="renovation" name="renovation" value="renovation" required />
                            renovation
                        </label>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="fencing" name="fencing" value="fencing" required />
                            Fencing
                        </label>
                        <label className="form-radio">
                        <input type="radio" id="excavation" name="excavation" value="excavation" required />
                            Excavation
                        </label>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio">
                        <input type="radio" id="demolition" name="demolition" value="demolition" required />
                            Demolition
                        </label>
                    </div>
                </div>   
            </div>

            <div className="form-group">
              <label htmlFor="firstname" className="form-label">Applicant's First Name</label>
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
              <label htmlFor="middlename" className="form-label">Applicant's Middle Name</label>
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
              <label htmlFor="lastname" className="form-label">Applicant's Last Name</label>
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
              <label htmlFor="address" className="form-label">Home/Office Address</label>
              <input 
                type="text"  
                id="address"  
                name="address"  
                className="form-input"  
                required 
                placeholder="Enter Home/Office Address"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectloc" className="form-label">Project Location</label>
              <input 
                type="text"  
                id="projectloc"  
                name="projectloc"  
                className="form-input"  
                required 
                placeholder="Enter Project Location"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="buildingtype" className="form-label">Type of Building</label>
              <input 
                type="text"  
                id="buildingtype"  
                name="buildingtype"  
                className="form-input"  
                required 
                placeholder="Enter Business Nature"  
              />
            </div>

            <div className="form-group">
              <label htmlFor="projecttitle" className="form-label">Project Title</label>
              <input 
                type="text"  
                id="projecttitle"  
                name="projecttitle"  
                className="form-input"  
                required 
                placeholder="Enter Business Nature"  
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

          <h1 className="form-requirements-title">Documentary Requirements</h1>

          <div className="signature/printedname-container">
            <h1 className="form-label">Certified True Copy of Title of the Property/Contract of Lease</h1>

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

          
          <br/>

          <div className="barangayID-container">
            <h1 className="form-label">Certified True Copy of Tax Declaration</h1>

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
            <h1 className="form-label">Endorsement of Homeowners Association </h1>
            <h1 className="form-label-description">(if applicable)</h1>

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
            <h1 className="form-label">Approved Building/Construction Plan</h1>
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

          <div className="endorsementletter-container">
            <h1 className="form-label">Upload Signature over Printed Name</h1>

            <div className="file-upload-container">
              <label htmlFor="file-upload4"  className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload4"
                  type="file"
                  className="file-upload-input" 
                  multiple
                  accept=".jpg,.jpeg,.png"
                  required
                  onChange={handleFileChange('container5')} // Handle file selection
                />

              <div className="uploadedFiles-container">
                {/* Display the file names with image previews */}
                {files.container5.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {files.container5.map((file, index) => (
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
                                  onClick={() => handleFileDelete('container5', file.name)}
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
    </div>
    
    );
}