"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db,storage } from "@/app/db/firebase";
import {  collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { stat } from "fs";



export default function EditLuponIncident() {
    /* do the partial edit/modify of info of the incident. I need the online report category to be able to complete this. */
    const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [loading , setLoading] = useState(true);
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>();
    const [LTreportData, setLTReportData] = useState<any>();
    const [listofLT, setListofLT] = useState<any[]>([]);
  

    useEffect(() => {
      const fetchReport = async () => {
        try {
          if (!docId) {
            console.log("No document ID provided.");
            setLoading(false);
            return;
          }
    
          // Fetch Firestore document
          const reportRef = doc(db, "IncidentReports", docId);
          const reportSnapshot = await getDoc(reportRef);
    
          if (!reportSnapshot.exists()) {
            console.log("No matching document.");
            setLoading(false);
            return;
          }
    
          const data = reportSnapshot.data();
          setReportData(data);
    
          const LTreportRef = collection(reportRef, "LTAssignedInfo");
          const LTreportCollectionSnapshot = await getDocs(LTreportRef);
    
          let LTdata = null;
          if (!LTreportCollectionSnapshot.empty) {
            LTdata = LTreportCollectionSnapshot.docs[0].data();
          }
    
          setLTReportData(LTdata);
          setLoading(false); // ✅ Ensure loading is turned off when data is fetched
        } catch (error: any) {
          console.error("Error fetching report:", error.message);
          setLoading(false); // ✅ Prevent infinite loading on error
        }
      };
    
      const fetchLT = async () => {
        try {
          const LTquery = query(collection(db, "BarangayUsers"), where("position", "==", "LT Staff"));
          const LTquerySnapshot = await getDocs(LTquery);
          
          const newLTList: any[] = [];
          LTquerySnapshot.forEach((doc) => {
            newLTList.push(doc.data());
          });
    
          setListofLT(newLTList);
        } catch (error: any) {
          console.error("Error fetching LT List:", error.message);
        }
      };
    
      fetchReport();
      fetchLT();
    }, []); 
    


 

    const complainantsData = reportData?.reportID != "Guest" ? {
      account: "Resident User",
      name: reportData?.firstname + " " + reportData?.lastname,
      contact: reportData?.contactNos,
      }:{
      account: "Guest User",
      name: reportData?.firstname + " " + reportData?.lastname,
      contact: reportData?.contactNos,
    };

    const respondentsData = LTreportData == null ? {
      LTUserId: "No LT Staff Assigned",
      name: "No LT Staff Assigned",
      contact: "No LT Staff Assigned",
      report: "No Report Available",
    } : {
      LTUserId: LTreportData?.LTUserId,
      name: LTreportData?.Fname + " " + LTreportData?.Lname,
      contact: LTreportData?.phone,
      report: LTreportData?.report,
    };

    const otherinformation = {
      nature: reportData?.nature,
      date:  reportData?.date + " " + reportData?.time,
      location: reportData?.address,
      concern: reportData?.concerns,
    };

    const handleFileChangeContainer1 = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
        
        if (!validImageTypes.includes(selectedFile.type)) {
          alert("Only JPG, JPEG, and PNG files are allowed.");
          return;
        }
    
        // Replace existing file instead of adding multiple
        const preview = URL.createObjectURL(selectedFile);
        setFilesContainer1([{ name: selectedFile.name, preview }]);
      }
    };

    // Handle file deletion for container 1
    const handleFileDeleteContainer1 = (fileName: string) => {
      setFilesContainer1([]);
  
      // Reset file input
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
    <>
      {loading ? (       <p>Loading...</p> ) : (
        <main className="main-container">

        <div className="letters-content">
             <button className="letter-announcement-btn" onClick={handleGenerateDialouge}>Generate Dialouge Letter</button>
             <button className="letter-announcement-btn" onClick={handleGenerateSummonLetter}>Generate Summon Letter</button>
             <select
                         id="status"
                         className={`status-dropdown ${status}`}                      
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
                 <p className="NewOfficial"> Incident</p>
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
                     placeholder= {complainantsData.account}
                     disabled
                     />
 
                     <p>Name</p>
 
                     <input 
                     type="text" 
                     className="search-bar" 
                     placeholder= {complainantsData.name}
                     disabled
                     />
 
 
                     <p>Contact Information</p>
 
                     <input 
                     type="text" 
                     className="search-bar" 
                     placeholder= {complainantsData.contact}
                     disabled
                     />
 
                     
 
 
                 </div>
 
                 <div className="section-2-right-side">
 
                 <p>Assigned LT's Information</p>
                 <p>User ID</p>
                   <input
                     type="text"
                     className="search-bar"
                     placeholder={respondentsData.LTUserId}
                     disabled
                     />
                   <p>Name</p>
 
                   <input 
                   type="text" 
                   className="search-bar" 
                   placeholder= {respondentsData.name}
                   disabled 
                   />
 
                   <p>Contact Information</p>
 
                   <input 
                   type="text" 
                   className="search-bar" 
                   placeholder= {respondentsData.contact}
                     disabled
                   />
                 
 
                 <p>Change Assigned LT Staff</p>
                   {/* The first option should be the first assigned LT staff*/}
                   <select 
                   id="featuredStatus" 
                   name="featuredStatus" 
                   className="featuredStatus" 
                   >
                      <option value="" disabled>Change LT Assigned</option>  
                      {listofLT.map((LT, index) => (
                        <option key={index} value={LT.userid}>{LT.userid} {LT.firstName} {LT.lastName}</option>
                      ))}
                     
                   </select>
                  
 
                 </div>
 
             </div>
 
 
             <div className="section-3">
                 <p className="title">Incident Information</p>
                 
                 <div className="bars">
                     <div className="input-group">
                         <p>Nature of Complaint</p>
                         <input type="text" className="search-bar" placeholder={otherinformation.nature}/>
                     </div>
 
                     <div className="input-group">
                         <p>Date of Investigation</p>
                         <input type="date" className="search-bar" placeholder="" />
                     </div>
 
                     <div className="input-group">
                         <p>Date Reported</p>
                         <input type="text" className="search-bar" placeholder={otherinformation.date} disabled/>
                     </div>
 
                     <div className="input-group">
                         <p>Location</p>
                         <input type="text" className="search-bar" placeholder={otherinformation.location} disabled/>
                     </div>
                 </div>
             </div>
 
 
 
             <div className="section-4">
 
                 <div className="section-4-left-side">
 
                   <div className="fields-section">
                               <p>Investigation Report</p>
                                   <textarea 
                                       className="description" 
                                       placeholder={respondentsData.report}
                                       rows={15}
                                ></textarea>
                     </div>
 
                  </div>
 
             <div className="section-4-right-side">
 
               <div className="title">
                     <p> Photo</p>
               </div> 
 
               <div className="file-upload-container">
                 <label htmlFor="file-upload1" className="upload-link">Click to Upload File</label>
                 <input
                   id="file-upload1"
                   type="file"
                   className="file-upload-input"
                   accept=".jpg,.jpeg,.png"
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
      )}
    </>
  );
}
