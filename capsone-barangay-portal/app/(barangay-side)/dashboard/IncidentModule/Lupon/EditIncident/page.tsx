"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db,storage } from "@/app/db/firebase";
import {  collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";


interface editFormProps {

}

export default function EditLuponIncident() {
    /* do the partial edit/modify of info of the incident. I need the online report category to be able to complete this. */
    const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>();
    const [LTreportData, setLTReportData] = useState<any>();
    const [listofLT, setListofLT] = useState<any[]>([]);
  
    // Handle file selection for any container
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
  

    useEffect(() => {
      const fetchReport = async () => {
            try {
              if (!docId) {
                console.log("No document ID provided.");
                setReportData(null);
                return;
              }
        
              // Fetch Firestore document
              const reportRef = doc(db, "IncidentReports", docId);
              const reportSnapshot = await getDoc(reportRef);
      
             
        
              if (!reportSnapshot.exists()) {
                console.log("No matching document.");
                setReportData(null);
                return;
              }
        
              const data = reportSnapshot.data();
              setReportData(data);
      
              const LTreportRef = collection(reportRef, "LTAssignedInfo");
              const LTreportCollectionSnapshot = await getDocs(LTreportRef);
              
              if (LTreportCollectionSnapshot.empty) {
                console.log("No matching document.");
                setLTReportData(null);
                return;
              }
              const LTdata = LTreportCollectionSnapshot.docs[0].data();
              setLTReportData(LTdata);
            } catch (error: any) {
              console.error("Error fetching report:", error.message);
            }
          };
        const fetchLT = async () => {
            try{
                const LTquery = query(collection(db, "BarangayUsers"), where("position", "==", "LT Staff"));
                const LTquerySnapshot = await getDocs(LTquery);
                LTquerySnapshot.forEach((doc) => {
                    setListofLT((prevList) => [...prevList, doc.data()]);
                });

            }
            catch  (error: any) {
                console.error("Error fetching LT List:", error.message);
              }
        }
        fetchReport();
        fetchLT();
    },[]);

    console.log(reportData);
    console.log(LTreportData);
    console.log(listofLT);

      // Handle file deletion for container 1
    const handleFileDeleteContainer1 = (fileName: string) => {
        setFilesContainer1((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      
        // Reset file input to ensure re-upload works
        const fileInput = document.getElementById('file-upload1') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
    };
      
    
    const handleFormChange = (e:ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
          
        //   if(type === "file" && e.target instanceof HTMLInputElement && e.target.files){
        //     setIncidentReport({
        //       ...incidentReport,
        //       file: e.target.files[0],
        //     })
        //   }
        //   else{
        //     setIncidentReport({
        //       ...incidentReport,
        //       [name]: value,
        //     })
    
        //   }
        }

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


    const handleAddLupon = () => {
      router.push("/dashboard/IncidentModule/Lupon");
    };
    
    const handleGenerateDialouge = () => {
        router.push("/dashboard/IncidentModule/Lupon/EditIncident/DialogueLetter");
      };

      const handleGenerateSummonLetter = () => {
        router.push("/dashboard/IncidentModule/Lupon/EditIncident/SummonLetter");
      };

      const status = reportData?.status//REMOVE PAG IMPLEMENTED NA SA BACKEND

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
                      
                        >
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Settled">Settled</option>
                        <option value="Archived">Archived</option>
              </select>
            

       </div>

        
        <div className="main-content">
            
       
         <button type="submit" className="back-button" onClick={handleAddLupon}></button>

       

            <div className="section-1">
                <p className="NewOfficial"> {reportData?.title || "Incident"}</p>
                    <div className="actions">
                        <button className="action-delete">Delete</button>
                        <button className="action-view">Save</button>                 
                    </div>
             </div>


             <div className="section-2">

                <div className="section-2-left-side">


                    <p >Complainant's Information</p>
                    <p>Account Type</p>
                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {reportData?.reportID}
                    disabled
                    />

                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder={`${reportData?.firstname} ${reportData?.lastname}`}
                    disabled
                    />


                    <p>Contact Information</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder={reportData?.contactNos}
                    disabled
                    />

                    


                </div>

                <div className="section-2-right-side">

                <p>Assigned LT's Information</p>
                <p>User ID</p>
                  <input
                    type="text"
                    className="search-bar"
                    placeholder={LTreportData?.LTUserId}
                    disabled
                    />
                  <p>Name</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder= {`${LTreportData?.Fname} ${LTreportData?.Lname}`}
                  disabled 
                  />

                  <p>Contact Information</p>

                  <input 
                  type="text" 
                  className="search-bar" 
                  placeholder= {LTreportData?.phone}
                    disabled
                  />
                

                <p>Change Assigned LT</p>
                  {/* The first option should be the first assigned LT staff*/}
                  <select 
                  id="featuredStatus" 
                  name="featuredStatus" 
                  className="featuredStatus" 
                  >
                       {listofLT.map((lt, index) => (
                          <option key={index} value={lt.id}>
                            {lt.userid} {lt.position}
                          </option>
                        ))}
                  </select>
                 

                </div>

            </div>


            <div className="section-3">
                <p className="title">Incident Information</p>
                
                <div className="bars">
                    <div className="input-group">
                        <p>Nature of Complaint</p>
                        <input type="text" className="search-bar" placeholder={reportData?.nature} />
                    </div>

                    <div className="input-group">
                        <p>Date of Investigation</p>
                        <input type="date" className="search-bar" placeholder={LTreportData?.dateofinvestigation} />
                    </div>

                    <div className="input-group">
                        <p>Date Reported</p>
                        <input type="text" className="search-bar" placeholder={`${reportData?.date} ${reportData?.time}`} disabled/>
                    </div>

                    <div className="input-group">
                        <p>Location</p>
                        <input type="text" className="search-bar" placeholder={reportData?.address} disabled/>
                    </div>
                </div>
            </div>



            <div className="section-4">

                <div className="section-4-left-side">

                  <div className="fields-section">
                              <p>Investigation Report</p>
                                  <textarea 
                                      className="description" 
                                      placeholder={LTreportData?.report}
                                      rows={15}
                               ></textarea>
                    </div>

                 </div>

            <div className="section-4-right-side">

              <div className="title">
                    <p> Photo</p>
              </div> 
            
               <div className="file-upload-container">


                    <label htmlFor="file-upload1"  className="upload-link">Click to Upload File</label>
                        <input
                        id="file-upload1"
                        type="file"
                        className="file-upload-input" 
                        multiple
                        accept=".jpg,.jpeg,.png"
                        required
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            handleFileChangeContainer1(e);
                            handleFormChange(e);
                          }} // Handle file selection
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
