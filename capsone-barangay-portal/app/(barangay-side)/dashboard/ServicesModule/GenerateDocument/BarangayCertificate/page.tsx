"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";




const metadata:Metadata = { 
  title: "Add Announcements Barangay Side",
  description: "Add Announcements for Barangay Side",
};

export default function addAnnouncements() {

    const router = useRouter();

    const handleBackToGenerateDocument = () => {
      router.push("/dashboard/ServicesModule/GenerateDocument");
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

    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
                <h1>Generate Document</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBackToGenerateDocument}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/>
                        </button>

                        <h1>Barangay Certificate</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn">Discard</button>
                        <button className="save-btn">Save</button>
                    </div>

                </div>
                
                <hr/>

                <div className="main-fields-container">
                    <div className="main-fields-container-section1">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Purpose</p>
                                    <select 
                                        id="clearancePurpose" 
                                        name="clearancePurpose" 
                                        className="input-field" 
                                        required
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select purpose</option>
                                        <option value="Occupancy/Moving Out">Occupancy / Moving Out</option>
                                        <option value="Estate Tax">Estate Tax</option>
                                        <option value="Death Residency">Death Residency</option>
                                        <option value="No Income (Scholarship)">No Income (Scholarship)</option>
                                        <option value="No Income (ESC)">No Income (ESC)</option>
                                        <option value="No Income (For Discount)">No Income (For Discount)</option>
                                        <option value="Cohabitation">Cohabitation</option>
                                        <option value="Guardianship">Guardianship</option>
                                        <option value="Good Moral and Probation">Good Moral and Probation</option>
                                        <option value="Garage/PUV">Garage/PUV</option>
                                        <option value="Garage/TRU">Garage/TRU</option>
                                        <option value="Residencye">Residency</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Other Purpose</p>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Other Purpose" 
                                    />
                                </div>

                            </div>

                            </div>

                            <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Date Requested</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From" 
                                    />
                                    
                                </div>
                                <div className="fields-section">
                                    <p>Resident Since</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From" 
                                    />
                                </div>
                                
                            </div>
                        </div>
                            
                    </div>

                    <div className="main-fields-container-section2">
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>First Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="First Name" 
                                />
                            </div>

                            <div className="fields-section">
                                <p>Middle Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Middle Name" 
                                />
                            </div>

                            <div className="fields-section">
                                <p>Last Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Last Name" 
                                />
                            </div>
                            <div className="fields-section">
                                <p>Address</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Address" 
                                />
                            </div>

                        </div>
                    </div>

                    <div className="main-fields-container-section3">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Age</p>
                                    <input 
                                        type="number"  // Ensures the input accepts only numbers
                                        id="age"  
                                        name="age"  
                                        className="input-field" 
                                        required 
                                        min="1"  // Minimum age (you can adjust this as needed)
                                        max="150"  // Maximum age (you can adjust this as needed)
                                        placeholder="Enter Age"  
                                        step="1"  // Ensures only whole numbers can be entered
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Civil Status</p>  
                                    <select 
                                        id="civilstatus" 
                                        name="civilstatus" 
                                        className="input-field" 
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

                                <div className="fields-section">
                                    <p>Citizenship</p>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Address" 
                                    />
                                </div>

                            </div>

                            </div>

                        <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Birthday</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From" 
                                    />    
                                </div>
                                <div className="fields-section">
                                    <p>Gender</p>
                                    <select 
                                        id="gender" 
                                        name="gender" 
                                        className="input-field" 
                                        required
                                        defaultValue=""  
                                    >
                                        <option value="" disabled>Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>

                                <div className="fields-section">
                                    <p>Contact Number</p>
                                    <input 
                                        type="tel"  
                                        id="contactnumber"  
                                        name="contactnumber"  
                                        className="input-field" 
                                        required 
                                        placeholder="Enter Contact Number"  
                                        maxLength={10}  // Restrict the input to 10 characters as a number
                                        pattern="^[0-9]{10}$"  // Regular expression to enforce a 10-digit number format
                                        title="Please enter a valid 10-digit contact number"  // Tooltip for invalid input
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="main-fields-container-section4">
                        <p>Requirements</p>
                        <div className="requirements-file-upload-container">
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



                </div>

                

                
        



                
                
            </div>
            
        </main>
    );
}

