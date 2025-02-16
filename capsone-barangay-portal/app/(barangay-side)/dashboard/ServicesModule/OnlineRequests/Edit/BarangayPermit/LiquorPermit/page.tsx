"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/LiquorPermit.css";




const metadata:Metadata = { 
  title: "Edit Online Liquor Permit Request",
  description: "Edit Online Liquor Permit Request",
};

export default function EditOnlineRequest() {

    const router = useRouter();

    const handleBack = () => {
      router.push("/dashboard/ServicesModule/OnlineRequests");
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

      const requestData = [
        {
            documentType: "Barangay Permit",
            purpose: "Liquor Permit",
            daterequested: "2024-01-17",
            firstname: "Jennie",
            middlename: "Yap",
            lastname: "Mendoza",
            address: "Calamba, Laguna",
            businessactivity: "Renewal",
            businessname: "Jennie's Salon",
            businesslocation: "Calamba, Laguna",
            businessnature: "Salon",
            estimatedcapital: "1000000",
            contact: "09171218101",
            status: "Pending",
            requirements: "/Images/document.png",
        },
    ];

    const residentData = requestData[0] as Record<string, string>;

    return (
        <main className="addAnnouncement-main-container">
            <div className="section-1">
                <h1>Barangay Permit Online Request</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/>
                        </button>

                        <h1>Liquor Permit</h1>
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
                                    <p>Date Requested</p>
                                    <input 
                                        type="date" 
                                        className="input-field" 
                                        placeholder="Select Date From" 
                                        defaultValue={residentData.daterequested}    
                                    />
                                    
                                </div>

                            </div>

                            </div>

                            <div className="section-right">
                            <div className="fields-container">

                                <div className="fields-section">
                                    <p>Status</p>
                                    <select
                                        id="status"
                                        name="status"
                                        className="input-field"
                                        required
                                        defaultValue={residentData.status}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Pickup">Pickup</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                                
                            </div>
                        </div>
                            
                    </div>

                    <div className="main-fields-container-section2">
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Applicant's First Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="First Name" 
                                    defaultValue={residentData.firstname}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Applicant's Middle Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Middle Name" 
                                    defaultValue={residentData.middlename}
                                />
                            </div>

                            <div className="fields-section">
                                <p>Applicant's Last Name</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Last Name"
                                    defaultValue={residentData.lastname} 
                                />
                            </div>
                            <div className="fields-section">
                                <p>Home Address</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Home Address"
                                    defaultValue={residentData.address} 
                                />
                            </div>

                        </div>
                    </div>

                    <div className="main-fields-container-section3">
                        <div className="section-left">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Business Name</p>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Business Name"
                                        defaultValue={residentData.businessname} 
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Business Location</p>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Business Location" 
                                        defaultValue={residentData.businesslocation}
                                    />
                                </div>

                                <div className="fields-section">
                                    <p>Nature of Business</p>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Nature of Business" 
                                        defaultValue={residentData.businessnature}
                                    />
                                </div>

                            </div>

                            </div>

                        <div className="section-right">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Type of Business Activity</p>
                                    <select 
                                        id="businessActivity" 
                                        name="businessActivity" 
                                        className="input-field" 
                                        required
                                        defaultValue={residentData.businessactivity}  
                                    >
                                        <option value="" disabled>Business Activity</option>
                                        <option value="Male">New</option>
                                        <option value="Female">Renewal</option>
                                    </select>
                                </div>
                                 <div className="fields-section">
                                    <p>Estimated Capital</p>
                                    <input 
                                        type="number" 
                                        className="input-field" 
                                        placeholder="Estimated Capital" 
                                        defaultValue={residentData.estimatedcapital}
                                    />
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
                                        defaultValue={residentData.contact}
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

