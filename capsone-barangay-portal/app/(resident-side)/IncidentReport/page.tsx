"use client"
import "@/CSS/IncidentReport/IncidentReport.css";

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
                              <div className="filename-image-container">
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


     
    </main>
  );
}
