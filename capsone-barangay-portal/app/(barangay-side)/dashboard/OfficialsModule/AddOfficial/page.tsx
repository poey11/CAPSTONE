"use client"
import "@/CSS/OfficialsModuleBarangdaySide/addofficial.css";
import type { Metadata } from "next";
import { useState } from "react";

import Link from 'next/link';


const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function AddOfficial() {

    const [isActive, setIsActive] = useState(false);

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
    <main className="main-container">

        
        <div className="main-content">
            
        <Link href="/dashboard/OfficialsModule">    
        <button type="submit" className="back-button"></button>
        </Link>

            <div className="section-1">
                <p className="NewOfficial"> New Official</p>

                    <div className="actions">
                        <button className="action-delete">Delete</button>
                        <button className="action-view">Save</button>
                    </div>
                
             </div>


             <div className="section-2">

                <div className="section-2-left-side">

                    <div className="active">

                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider"></span>
                        </label>

                        <span className="status-text">Active</span>
                                                                        
                    </div>

                  
                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Official Name" 
                    />

                    <p>Role</p>
                     <select 
                    id="featuredStatus" 
                    name="featuredStatus" 
                    className="featuredStatus" 
                    required
                    defaultValue=""  
                >
                    <option value="" disabled>Choose Role</option>
                    <option value="active">Barangay Captain</option>
                    <option value="inactive">Secretary</option>
                </select>

                    <p>Term Duration</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Term Duration" 
                    />

                    <p>Contact Information</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Contact Number" 
                    />

                    


                </div>

                <div className="section-2-right-side">

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
                                            src="/Images/trash.png"  
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
