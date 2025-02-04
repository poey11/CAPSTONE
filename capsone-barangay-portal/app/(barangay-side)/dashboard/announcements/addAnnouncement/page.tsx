"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/barangaySide/announcements/addAnnouncement.css";




const metadata:Metadata = { 
  title: "Add Announcements Barangay Side",
  description: "Add Announcements for Barangay Side",
};

export default function addAnnouncements() {

    const router = useRouter();

    const handleAddAnnouncement = () => {
      router.push("/dashboard/announcements");
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
                <h1>New Announcement</h1>
            </div>

            <div className="addAnnouncement-main-section">
                <div className="addAnnouncement-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleAddAnnouncement}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/>
                        </button>

                        <h1 >New Announcement</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn">Discard</button>
                        <button className="save-btn">Save</button>
                    </div>

                </div>
                
                <hr/>

                <div className="main-fields-container">

                    <div className="section-left">
                        <div className="switch-container">
                            <label className="switch">
                                <input type="checkbox" />
                                <span className="slider"></span>
                            </label>
                            <span className="switch-label">Featured in Announcements</span>
                        </div>

                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Announcement Headline</p>
                                <input 
                                    type="text" 
                                    className="headline" 
                                    placeholder="Enter Announcement Headline" 
                                />
                            </div>

                            <div className="fields-section">
                                <p>Published Date</p>
                                <input 
                                    type="text" 
                                    className="date" 
                                    placeholder="Enter Date" 
                                />
                            </div>

                            <div className="fields-section">
                            <p>Description</p>
                                <textarea 
                                    className="description" 
                                    placeholder="Enter Description"
                                    rows={4}
                                ></textarea>
                            </div>

                        </div>

                    </div>

                    <div className="section-right">
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

