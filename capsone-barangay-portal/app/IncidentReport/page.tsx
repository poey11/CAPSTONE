"use client"; // Ensure this is a client-side component

import { useState } from "react"; 
import Link from "next/link"; // Import Link

export default function Announcement() {
  const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);

  // Handle file selection for container 1
  const handleFileChangeContainer1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles).map((file) => {
        const preview = URL.createObjectURL(file);
        return { name: file.name, preview };
      });
      setFilesContainer1((prevFiles) => [...prevFiles, ...fileArray]); // Append new files to the first container
    }
  };

  // Handle file deletion for container 1
  const handleFileDeleteContainer1 = (fileName: string) => {
    setFilesContainer1((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission

    // Manually trigger form validation
    const form = event.target as HTMLFormElement;
    if (form.checkValidity()) {
      // Redirect to the Notification page after form submission if validation is successful
      document.location.href = '/IncidentReport/Notification'; // Use JavaScript redirection
    } else {
      // If the form is invalid, trigger the validation
      form.reportValidity(); // This will show validation messages for invalid fields
    }
  };

  return (
    <main className="main-container">
      <div className="Page">
        <p>File an Incident Report</p>
      </div>

      <div className="register-section">
        <h1>Minor Incident Report</h1>
        <form className="register-form" onSubmit={handleSubmit}> {/* Use onSubmit to trigger the redirect */}
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
            <label htmlFor="concerns" className="form-label">Concerns</label>
            <input
              type="text"
              id="concerns"
              name="concerns"
              className="form-input"
              required
              placeholder="Enter your concerns"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date" className="form-label">Date of Incident</label>
            <input
              type="date"
              id="date"
              name="date"
              className="form-input"
              required
              placeholder="Enter Date of Incident"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location" className="form-label">Address of Incident</label>
            <input
              type="text"
              id="location"
              name="location"
              className="form-input"
              required
              placeholder="Enter Location"
            />
          </div>

          <div className="signature/printedname-container">
            <label className="form-label">Upload Proof of Incident (If Applicable)</label>

            <div className="file-upload-container">
              <label htmlFor="file-upload1" className="upload-link">Click to Upload File</label>
              <input
                id="file-upload1"
                type="file"
                className="file-upload-input"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChangeContainer1} // Handle file selection
              />

              <div className="uploadedFiles-container">
                {filesContainer1.length > 0 && (
                  <div className="file-name-image-display">
                    <ul>
                      {filesContainer1.map((file, index) => (
                        <div className="file-name-image-display-indiv" key={index}>
                          <li>
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

          {/* Submit button */}
          <button type="submit" className="submit-button">Submit</button>
        </form>
      </div>


      <style jsx>{`
        .Page {
          background-image: url('/Images/Background.jpeg');
          background-size: cover; 
          background-position: 50% 50%;
          background-repeat: no-repeat; 
          height: 200px; 
          display: flex;
          align-items: center;
          justify-content: center; 
          color: white; 
          font-size: 40px; 
          font-weight: bold; 
          position: relative;
          margin-bottom: 50px;
        }

        .Page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1); /* White overlay with 30% opacity */
          z-index: 1; /* Ensure the overlay appears above the background image */
        }

        .Page > * {
          position: relative;
          z-index: 2; /* Ensure text is above the overlay */
        }

        .main-container {
          background-color: #f7e5d5;
          display: flex;
          flex-direction: column;  
          min-height: 100vh; 
       }

        .register-section {
        display: flex;
        flex-direction: column;
        background-color: #ffe9d6;
        border-radius: 10px;
        padding: 2rem;
        margin: auto;
        width: 60%;
        margin-top: 2rem;
        
        }

        .register-section h1 {
        color: #f49028;
        font-size: 1.5rem;
        margin-bottom: 1rem;
        text-align: center;
        font-weight: bold;
        }

        .register-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        
        }

        .form-group {
        display: flex;
        flex-direction: column;
        }

        .form-label {
        font-size: 16px;
        font-weight: bold;
        color: gray;
        margin-bottom: 0.5rem;
        }

        .form-input {
        width: 100%;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        color: #555;
        }



        .form-input:focus {
        border-color: #f49028;
        outline: none;
        box-shadow: 0 0 5px rgba(244, 144, 40, 0.5);
        }

        .submit-button {
        background-color: #f49028;
        color: white;
        font-size: 16px;
        font-weight: bold;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
        transition: background-color 0.3s ease;
        align-self: center; /* Centers the button */
        width: 350px;
        }

        
        .submit-button:hover {
        background-color: #d87d20;
        }

        .submit-button:active {
        background-color: #bf6a18;
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


        
      `}</style>
    </main>
  );
}
