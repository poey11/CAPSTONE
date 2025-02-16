"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import type { Metadata } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from 'next/link';


const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function EditLuponIncident() {

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

    const router = useRouter();

    const handleAddLupon = () => {
      router.push("/dashboard/IncidentModule/Lupon");
    };
    
    const handleGenerateDialouge = () => {
        router.push("/dashboard/IncidentModule/Lupon/EditIncident/DialogueLetter");
      };

      const handleGenerateSummonLetter = () => {
        router.push("/dashboard/IncidentModule/Lupon/EditIncident/SummonLetter");
      };

      const [status, setStatus] = useState("pending"); //REMOVE PAG IMPLEMENTED NA SA BACKEND

      const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden

      const handleToggleClick = () => {
          setShowDialogueContent(prevState => !prevState); // Toggle visibility
      };




  return (
    <main className="main-container">


       <div className="letters-content">
            <button className="letter-announcement-btn" onClick={handleGenerateDialouge}>Generate Dialouge Letter</button>
            <button className="letter-announcement-btn" onClick={handleGenerateSummonLetter}>Generate Summon Letter</button>
            <select
                        id="status"
                        className={`status-dropdown ${status}`}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        >
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="settled">Settled</option>
                        <option value="archived">Archived</option>
              </select>
            

       </div>

        
        <div className="main-content">
            
       
         <button type="submit" className="back-button" onClick={handleAddLupon}></button>

       

            <div className="section-1">
                <p className="NewOfficial"> Robbery Incident</p>
                    <div className="actions">
                        <button className="action-delete">Delete</button>
                        <button className="action-view">Save</button>

                
                    </div>
             </div>


             <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Official Name" 
                    />

                   
                <p>Sex</p>
                  <select 
                  id="featuredStatus" 
                  name="featuredStatus" 
                  className="featuredStatus" 
                  required
                  defaultValue=""  
                  >
                  <option value="" disabled>Choose</option>
                  <option value="active">Male</option>
                  <option value="inactive">Female</option>
                  </select>


                    <p>Age</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Age" 
                    />

                    <p>Contact Information</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Contact Number" 
                    />

                    


                </div>

                <div className="section-2-right-side">

                <p>Respondent's Information</p>
                  <p>Name</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Enter Official Name" 
                  />

                  <p>Sex</p>
                  <select 
                  id="featuredStatus" 
                  name="featuredStatus" 
                  className="featuredStatus" 
                  required
                  defaultValue=""  
                  >
                  <option value="" disabled>Choose</option>
                  <option value="active">Male</option>
                  <option value="inactive">Female</option>
                  </select>

                  <p>Age</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Enter Age" 
                  />

                  <p>Contact Information</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder="Enter Contact Number" 
                  />
                   

                </div>

            </div>


            <div className="section-3">
                <p className="title">Other Information</p>
                
                <div className="bars">
                    <div className="input-group">
                        <p>Nature of Complaint</p>
                        <input type="text" className="search-bar" placeholder="Enter Nature of Complaint" />
                    </div>

                    <div className="input-group">
                        <p>Date Filed</p>
                        <input type="date" className="search-bar" placeholder="Enter Date" />
                    </div>

                    <div className="input-group">
                        <p>Location</p>
                        <input type="text" className="search-bar" placeholder="Enter Location" />
                    </div>
                </div>
            </div>



            <div className="section-4">

                <div className="section-4-left-side">

                  <div className="fields-section">
                              <p>Description</p>
                                  <textarea 
                                      className="description" 
                                      placeholder="Enter Description"
                                      rows={15}
                               ></textarea>
                    </div>

                 </div>

            <div className="section-4-right-side">

              <div className="title">
                    <p> Photo</p>
              </div> 
            
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
                

            </div>
           

        </div> 

    
        <div className="dialouge-meeting-section">
             
                <div className="title-section">
                    <button type="button" className="plus-button" onClick={handleToggleClick}></button>
                    <p className="NewOfficial">Dialogue Meeting</p>
                </div>

                {showDialogueContent && (
                    <>
                        <div className="section-2-dialouge">
                            <p>Complainant's Information</p>
                            <div className="bars">
                                <div className="input-group">
                                    <p>Date</p>
                                    <input type="date" className="search-bar" placeholder="Enter Date" />
                                </div>
                                <div className="input-group">
                                    <p>For</p>
                                    <input type="text" className="search-bar" placeholder="Enter For" />
                                </div>
                                <div className="input-group">
                                    <p>Time</p>
                                    <input type="time" className="search-bar" placeholder="Enter Time" />
                                </div>
                            </div>
                        </div>

                        <div className="section-3-dialouge">
                            <div className="fields-section">
                                <p>Minutes of Dialogue</p>
                                <textarea className="description" placeholder="Enter Minutes of Dialogue" rows={13}></textarea>
                            </div>
                        </div>

                        <div className="section-4-dialouge">
                            <div className="fields-section">
                                <p>Remarks</p>
                                <textarea className="description" placeholder="Enter Remarks" rows={10}></textarea>
                            </div>
                            <div className="fields-section">
                                <p>Parties</p>
                                <textarea className="description" placeholder="Enter Parties" rows={10}></textarea>
                            </div>
                        </div>
                    </>
                )}
            </div>

    <div className="hearing-section">
        
            <div className="title-section">
                <button type="button" className="plus-button" onClick={handleToggleClick}></button>
                <p className="NewOfficial">First Hearing</p>
            </div>


    </div>

    <div className="hearing-section">
        
            <div className="title-section">
                <button type="button" className="plus-button" onClick={handleToggleClick}></button>
                <p className="NewOfficial">Second Hearing</p>
            </div>
    </div>

    <div className="hearing-section">
        
        <div className="title-section">
            <button type="button" className="plus-button" onClick={handleToggleClick}></button>
            <p className="NewOfficial">Third Hearing</p>
        </div>
    </div>


    
    </main>
  );
}
