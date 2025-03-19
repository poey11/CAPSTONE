"use client"
import "@/CSS/IncidentModule/OnlineReporting.css";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const metadata: Metadata = {
  title: "Incident Management Module",
  description: "Manage incidents efficiently with status tracking and actions",
};

const statusOptions = ["Acknowledged", "Pending", "Resolved"];

export default function ViewOnlineReports() {
  const incidentData = [
    { label: "First Name", key: "firstname" },
    { label: "Last Name", key: "lastname" },
    { label: "Date Of Incident", key: "date" },
    { label: "Concern", key: "concerns" },
    { label: "Status", key: "status" },
    { label: "Proof Photo", key: "file" },
  ];

  const router = useRouter();

  const handleViewOnlineReport = () => {
    router.push("/dashboard/IncidentModule/BCPC/ViewIncident");
  };

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


  return (
    <main className="main-container">
      <div className="main-content-view-online-report">

        <div className="section-1-online-report">
             <div className="section-1-online-report-left-side">
                <button type="button" className="back-button" onClick={() => router.back()}></button>
                <p>Online Report Details</p>
            </div>
        </div>

        {incidentData.map((field, index) => (
          <div key={index} className="online-report-details-section">
            <div className="title-section">
              <p>{field.label}</p>
            </div>
            <div className="description-section">

                    {field.label === "Proof Photo" ? (
                        <img src={field.key} alt="Proof Photo" className="detail-section-image" />
                        ) : (
                        <p>{field.key}</p>
                        )}
            </div>
          </div>
        ))}
      </div>
    

    <div className="main-content-response-section">

    <div className="title-section-response-section">
            <h1 className="title-response-section">Respondent's Information</h1>
    </div>

    <div className="main-section-response-section">

   
    
        <div className="section-1-response">

      

            <div className="official-section-online-report">


            <p>Respondent Officer</p>
                  <select 
                  id="" 
                  name="" 
                  className="online-report-input-field" 
                  required
                  defaultValue=""  
                  >
                  <option value="" disabled>Choose</option>
                  <option value="">Malcolm </option>
                  <option value="">Luen</option>
                  <option value="">Payao</option>
                  </select>

                    
                </div>


            <div className="fields-section-online-report">
                    <p>Investigation Report</p>
                <textarea 
                    className="description" 
                    placeholder="Enter Description"
                    rows={15}
                ></textarea>
             </div>

    

      
        </div>

        

        <div className="section-2-response">

           <p> Investigation Photo</p>


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


        <div className="submit-response-section">
                 <button className="save-btn-online-report-response-section">Save</button>
        </div>
       

    </div>

    
    </main>
  );
}


make this dynamic 

the status should be editable for the values of Pending Acknowledged Resolved