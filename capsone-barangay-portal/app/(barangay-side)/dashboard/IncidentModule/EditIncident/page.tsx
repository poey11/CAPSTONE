"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpecificDocument, generateDownloadLink } from "../../../../helpers/firestorehelper";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../db/firebase";
import React from "react";




export default function EditLuponIncident() {
    /* do the partial edit/modify of info of the incident.*/
    const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [loading , setLoading] = useState(true);
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>();
    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
    const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden
  
 
    const [toUpdate, setToUpdate] = useState<any|null>({
      complainant: {
        fname: "",
        lname: "",
        sex: "",
        age: "",
        civilStatus: "",
        address: "",
        contact: "",
      },
      respondent: {
        fname: "",
        lname: "",
        sex: "",
        age: "",
        civilStatus: "",
        address: "",
        contact: "",
      },
      fname: "",
      lname: "",
      nature: "",
      location: "",
      status: reportData?.status,
      nosofMaleChildren: "",
      nosofFemaleChildren: "",
      investigator: {
        fullname: "",
        dateInvestigated:"",
        timeInvestigated: "",
        investigationReport: "",
        investigateImage: "",
      }
    });
    let status = toUpdate.status;
   

    useEffect(() => {
      if(docId){
        getSpecificDocument("IncidentReports", docId, setReportData).then(() => setLoading(false));
           }
      else{
        console.log("No document ID provided.");
        setReportData(null);
       
      }
    }, [docId]);
    useEffect(() => {
      if(reportData?.file){
        generateDownloadLink(reportData?.file, "IncidentReports").then(url => {
          if (url) setconcernImageUrl(url);
        });
      }
    },[reportData]);


    const department =  reportData?.department;

    
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

    const handleFileDeleteContainer1 = (fileName: string) => {
      setFilesContainer1([]);
  
      // Reset file input
      const fileInput = document.getElementById('file-upload1') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    };    
    

    
    
    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
    
      setToUpdate((prevState: any) => {
        if (type === "file") {
          const fileInput = e.target as HTMLInputElement;
          if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
    
            // Handle nested properties (e.g., "investigator.investigateImage")
            const keys = name.split(".");
            if (keys.length === 2) {
              return {
                ...prevState,
                [keys[0]]: {
                  ...prevState[keys[0]],
                  [keys[1]]: file, // Store the file object
                },
              };
            }
    
            return {
              ...prevState,
              [name]: file,
            };
          }
        }
    
        let newValue: any = value;
    
        // ✅ Prevent negative numbers
        if (type === "number") {
          const numericValue = Number(value);
          if (numericValue < 0) return prevState; // Do not update if negative
          newValue = numericValue;
        }
    
        // Handle nested fields (text/select inputs)
        const keys = name.split(".");
        if (keys.length === 2) {
          return {
            ...prevState,
            [keys[0]]: {
              ...prevState[keys[0]],
              [keys[1]]: newValue,
            },
          };
        }
    
        return {
          ...prevState,
          [name]: newValue,
        };
      });
    };
    
      
    const removeUndefined = (obj: any): any => {
      if (typeof obj !== "object" || obj === null) return obj;
    
      return Object.fromEntries(
        Object.entries(obj)
          .map(([key, value]) => [key, removeUndefined(value)]) // Recursively clean nested objects
          .filter(([_, value]) => value !== undefined) // Remove undefined values
      );
    };
    
    // Ensure mergeData never returns undefined
    const mergeData = (oldValue: any, newValue: any) => {
      return newValue !== "" && newValue !== undefined ? newValue : oldValue;
    };
    
    const HandleEditDoc = async () => {
      if (docId) {
        const docRef = doc(db, "IncidentReports", docId);
    
        // Fixing receivedBy handling (avoiding split on undefined)
        const receivedByParts = reportData.receivedBy?.split(" ") || ["", ""];
        const receivedByFname = mergeData(receivedByParts[0], toUpdate.fname);
        const receivedByLname = mergeData(receivedByParts[1], toUpdate.lname);
    
        const cleanedData = removeUndefined({
          complainant: {
            fname: mergeData(reportData.complainant?.fname, toUpdate.complainant?.fname),
            lname: mergeData(reportData.complainant?.lname, toUpdate.complainant?.lname),
            sex: mergeData(reportData.complainant?.sex, toUpdate.complainant?.sex),
            age: mergeData(reportData.complainant?.age, toUpdate.complainant?.age),
            civilStatus: mergeData(reportData.complainant?.civilStatus, toUpdate.complainant?.civilStatus),
            address: mergeData(reportData.complainant?.address, toUpdate.complainant?.address),
            contact: mergeData(reportData.complainant?.contact, toUpdate.complainant?.contact),
          },
          respondent: {
            fname: mergeData(reportData.respondent?.fname, toUpdate.respondent?.fname),
            lname: mergeData(reportData.respondent?.lname, toUpdate.respondent?.lname),
            sex: mergeData(reportData.respondent?.sex, toUpdate.respondent?.sex),
            age: mergeData(reportData.respondent?.age, toUpdate.respondent?.age),
            civilStatus: mergeData(reportData.respondent?.civilStatus, toUpdate.respondent?.civilStatus),
            address: mergeData(reportData.respondent?.address, toUpdate.respondent?.address),
            contact: mergeData(reportData.respondent?.contact, toUpdate.respondent?.contact),
          },
          investigator: {
            fullname: mergeData(reportData.investigator?.fullname, toUpdate.investigator?.fullname),
            dateInvestigated: mergeData(reportData.investigator?.dateInvestigated, toUpdate.investigator?.dateInvestigated),
            timeInvestigated: mergeData(reportData.investigator?.timeInvestigated, toUpdate.investigator?.timeInvestigated),
            investigationReport: mergeData(reportData.investigator?.investigationReport, toUpdate.investigator?.investigationReport),
            investigateImage: mergeData(reportData.investigator?.investigateImage, toUpdate.investigator?.investigateImage),
          },
          receivedBy: `${receivedByFname} ${receivedByLname}`,
          nature: mergeData(reportData.nature, toUpdate.nature),
          location: mergeData(reportData.location, toUpdate.location),
          status: mergeData(reportData.status, toUpdate.status),
          nosofFemaleChildren: mergeData(reportData.nosofFemaleChildren, toUpdate.nosofFemaleChildren),
          nosofMaleChildren: mergeData(reportData.nosofMaleChildren, toUpdate.nosofMaleChildren),
        });
    
        await updateDoc(docRef, cleanedData);
      }
    };
    
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        console.log(toUpdate);  
        if (form.checkValidity()) {
          HandleEditDoc().then(() => {
            alert("Successfully Updated")
            handleBack();
          }).catch((error) => {
            console.error("Error updating document: ", error);
          }); 
        } else {
          form.reportValidity(); 
        }
    };


    const handleBack = () => {
      router.back();
    };
    
    const handleGenerateLetterAndInvitation = (e:any) => {
      const action = e.currentTarget.name;
      router.push(`/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${docId}?action=${action}`);
    };

      

    const handleDeleteForm=()=>{
        setToUpdate({
          complainant: {
            fname: "",
            lname: "",
            sex: "",
            age: "",
            civilStatus: "",
            address: "",
            contact: "",
          },
          respondent: {
            fname: "",
            lname: "",
            sex: "",
            age: "",
            civilStatus: "",
            address: "",
            contact: "",
          },
          fname: "",
          lname: "",
          nature: "",
          location: "",
          status:"",
          nosofFemaleChildren: "",
          nosofMaleChildren: "",
          investigator: {
            fullname: "",
            dateInvestigated: "",
            timeInvestigated: "",
            investigationReport: "",
            investigateImage: "",
          },
        });
    }

    const handleToggleClick = () => {
          setShowDialogueContent(prevState => !prevState); // Toggle visibility
    };


    const [showRecordDetails, setShowRecordDetails] = useState(false);
const [showComplainantDetails, setShowComplainantDetails] = useState(false);
const [showInvestigatedDetails, setShowInvestigatedDetails] = useState(false);
const [showOtherDetails, setshowOtherDetails] = useState(false);

const toggleRecordDetails = () => setShowRecordDetails(prev => !prev);
const toggleComplainantDetails = () => setShowComplainantDetails(prev => !prev);
const toggleInvestigatedDetails = () => setShowInvestigatedDetails(prev => !prev);
const toggleOtherDetails = () => setshowOtherDetails(prev => !prev);








  




  return (
    <>
      {loading ? (       <p></p> ) : (
        <main className="main-container-edit">
        
          <div className="letters-content-edit">
               <button className="letter-announcement-btn-edit" name="dialogue" onClick={handleGenerateLetterAndInvitation}>Generate Dialouge Letter</button>
               <button className="letter-announcement-btn-edit" name="summon" onClick={handleGenerateLetterAndInvitation}>Generate Summon Letter</button>
              
               <select
                id="status"
                className={`status-dropdown-edit ${toUpdate.status || reportData.status || "pending"}`}  
                name="status"
                value={toUpdate.status ?? reportData.status ?? "Pending"} 
                onChange={handleFormChange}               
              >
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="settled">Settled</option>
                <option value="archived">Archived</option>
              </select>


        
          </div>
 
         
          <form className="main-content-edit" onSubmit={handleSubmit}>

          <div className="edit-incident-main-section1">

            <div className="edit-incident-main-section1-left">

              <button type="button"  onClick={handleBack}>

                  <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-edit"/>
              </button>
              <p className="NewOfficial-edit"> {reportData.caseNumber}</p>
            </div>

            <div className="action-btn-section-edit-incident">
              <button type="button" className="action-delete-edit" onClick={handleDeleteForm}>Delete</button>
              <button type="submit" className="action-view-edit">Save</button>   
            </div>

          </div>

          <hr/>
      

        
              <div className="section-2-edit">
                  <div className="section-2-left-side-edit">

                      <p >Update Complainant's Information</p>
                      <p>First Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.complainant.fname} 
                      name="complainant.fname"
                      id="complainant.fname"
                      value={toUpdate.complainant.fname}
                      onChange={handleFormChange}
                      />
                    <p>Last Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder= {reportData.complainant.lname}
                      value={toUpdate.complainant.lname}
                      name="complainant.lname"
                      id="complainant.lname"
                      onChange={handleFormChange}
                      />

                    <p>Sex</p>
                    <select 
                      className="featuredStatus-edit"                     
                      name="complainant.sex" 
                      id="complainant.sex"
                      value={toUpdate.complainant.sex || reportData.complainant.sex || ""} // Show db value or user-updated value
                      onChange={handleFormChange}
                      >
                      <option value="" disabled>Choose A Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>


                      <p>Age</p>

                      <input 
                      type="text" 
                      className="search-bar-edit"  
                      placeholder={reportData.complainant.age} 
                      value={toUpdate.complainant.age}
                      name="complainant.age"
                      id="complainant.age"
                      onChange={handleFormChange}
                      />

                      <p>Civil Status</p>
                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.complainant.civilStatus} 
                      value={toUpdate.complainant.civilStatus}
                      name="complainant.civilStatus"
                      id="complainant.civilStatus"
                      onChange={handleFormChange}
                      />

                      <p>Address</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.complainant.address}
                      value={toUpdate.complainant.address}
                      name="complainant.address"
                      id="complainant.address"
                      onChange={handleFormChange}
                      />

                      <p>Contact Information</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.complainant.contact}
                      value={toUpdate.complainant.contact}
                      name="complainant.contact"
                      id="complainant.contact"

                      onChange={handleFormChange}
                      />

                  </div>

                  <div className="section-2-right-side-edit">

                  <p >Update Respondent's Information</p>
                      <p>First Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.respondent.fname}
                      value={toUpdate.respondent.fname}
                      name="respondent.fname"
                      id="respondent.fname"
                      onChange={handleFormChange}
                      />
                    <p>Last Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.respondent.lname}
                      value={toUpdate.respondent.lname}
                      name="respondent.lname"
                      id="respondent.lname"

                      onChange={handleFormChange}
                      />

                    <p>Sex</p>
                    <select 
                      className="featuredStatus-edit"                     
                      name="respondent.sex" 
                      id="respondent.sex"
                      value={toUpdate.respondent.sex || reportData.respondent.sex || ""} // Show db value or user-updated value
                      onChange={handleFormChange}
                      >
                      <option value="" disabled>Choose A Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>


                      <p>Age</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.respondent.age}
                      value={toUpdate.respondent.age}
                      name="respondent.age"
                      id="respondent.age"

                      onChange={handleFormChange}
                      />

                      <p>Civil Status</p>
                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.respondent.civilStatus}
                      value={toUpdate.respondent.civilStatus}
                      name="respondent.civilStatus"
                      id="respondent.civilStatus"

                      onChange={handleFormChange}
                      />

                      <p>Address</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.respondent.address}
                      value={toUpdate.respondent.address}
                      name="respondent.address"
                      id="respondent.address"

                      onChange={handleFormChange}
                      />

                      <p>Contact Information</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.respondent.contact} 
                      value={toUpdate.respondent.contact}
                      name="respondent.contact"
                      id="respondent.contact"

                      onChange={handleFormChange}
                      />

                  </div>

              </div>

        
        
               <div className="section-3-edit">

               <div className="record-details-topsection">
                            <button type="button" 
                                className={showRecordDetails ? "record-details-minus-button" : "record-details-plus-button"} 
                                onClick={toggleRecordDetails}>
                            </button>
                   <h1>Incident Information</h1>

              </div>

              <hr/>



            
            
              {showRecordDetails && (

                
                   <div className="bars-edit">

                   
                     
                       <div className="input-group-edit">
                           <p>Nature of Complaint</p>
                           <input type="text" className="search-bar-edit" 
                            placeholder={reportData.nature}
                            value={toUpdate.nature}
                            name="nature"
                            id="nature"
                            onChange={handleFormChange}/>
                       </div>
        
                       <div className="input-group-edit">
                           <p>Location</p>
                           <input type="text" className="search-bar-edit" 
                           placeholder={reportData.location} 
                           value={toUpdate.location}
                           name="location"
                           id="location"
                           onChange={handleFormChange}/>
                       </div>

                       <div className="input-group-edit">
                           <p>Date & Time Filed</p>
                           <input type="text" className="search-bar-edit" placeholder={`${reportData.dateFiled} ${reportData.timeFiled}`} disabled/>
                       </div>

                       {department === "GAD" && (
                      <div>
                        <div className="input-group-edit">
                          <p>Nos of Male Children Victim/s</p>
                          <input type="number" 
                          className="search-bar-edit"
                          value={toUpdate.nosofMaleChildren || reportData.nosofMaleChildren}
                          onChange={handleFormChange}
                          name="nosofMaleChildren"
                          required />    
                        </div>

                        <div className="input-group-edit">
                          <p>Nos of Female Children Victim/s</p>
                          <input type="number"
                            className="search-bar-edit"
                            
                            value={toUpdate.nosofFemaleChildren||reportData.nosofFemaleChildren}
                            name="nosofFemaleChildren"
                            onChange={handleFormChange}
                            required />    
                        </div>

                      </div>
                    )}

   

                   </div>
                   )}



                <div className="record-details-topsection">
                            <button type="button" 
                                className={showComplainantDetails ? "record-details-minus-button" : "record-details-plus-button"} 
                                onClick={toggleComplainantDetails}>
                            </button>
                   <h1>Complainant's Recieved by</h1>
              </div>

                    <hr/>


                   {showComplainantDetails && (   



                  <div className="bars-edit">

                    <div className="input-group-edit">

                      <p>Barangay Desk Officer First Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.receivedBy.split(" ")[0]} 
                      value={toUpdate.fname}
                      name="fname"
                      id="fname"
                      onChange={handleFormChange}
                      />

                    </div>

                      <div className="input-group-edit">

                      <p>Barangay Desk Officer Last Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.receivedBy.split(" ")[1]} 
                      value={toUpdate.lname}
                      name="lname"
                      id="lname"
                      onChange={handleFormChange}
                      />

                    </div>


                    <div className="input-group-edit">
                          <p>Date & Time Received</p>
                          <input type="text" className="search-bar-edit" placeholder={`${reportData.dateReceived} ${reportData.timeReceived}`} id="dateReceived" name="dateReceived" 
                        disabled />
                      </div>




                  </div>

              )}


            <div className="record-details-topsection">
                            <button type="button" 
                                className={showInvestigatedDetails ? "record-details-minus-button" : "record-details-plus-button"} 
                                onClick={toggleInvestigatedDetails}>
                            </button>
                   <h1>Investigated Conducted By</h1>
              </div>


                  {showInvestigatedDetails&& (   
                    <div className="bars-edit">
                        <div className="input-group-edit">
                            <p>Investigator Full Name (FN SN)</p>
                            <input type="text" className="search-bar-edit" 
                            placeholder={reportData?.investigator?.fullname ?? "Enter Full Name"}
                            value={toUpdate?.investigator.fullname}
                            name="investigator.fullname"
                            id="investigator.fullname"
                            onChange={handleFormChange}
                            />
                        </div>

                        <div className="input-group-edit">
                            <p>Date Investigated</p>
                            <input type="date" className="search-bar-edit" 
                              value={toUpdate?.investigator?.dateInvestigated || reportData?.investigator?.dateInvestigated || ""}
                              name="investigator.dateInvestigated"
                              id="investigator.dateInvestigated"
                              onChange={handleFormChange} 
                  
                              />
                        </div>
                        <div className="input-group-edit">
                            <p>Time Investigated</p>
                            <input type="time" className="search-bar-edit" 
                            value={toUpdate?.investigator?.timeInvestigated || reportData?.investigator?.timeInvestigated  || ""} 
                            name="investigator.timeInvestigated"
                            id="investigator.timeInvestigated"
                            onChange={handleFormChange}  
                            />
                           
                        </div>
                    </div>

                  )}

            <hr/>


                    

                    <p  className="title-edit">Image of Incident</p>
                    <div className="description-edit">
                      {concernImageUrl ? (
                        <>
                          <a href={concernImageUrl} target="_blank" rel="noopener noreferrer">

                            <img src={concernImageUrl} alt="Incident" className="incident-image-edit"  style={{ width: '30%', height: '100%', marginRight: '5px', cursor: "pointer" }} />
                          </a>
                        </>

                       ) : ( 
                         <div className="input-group-edit">
                           <p style={{ color: "gray", fontStyle: "italic" }}>No image available</p>
                         </div>
                       )}
                       
                    </div>
                    
    
               </div>
               

               
               
                     
                     
                     
               <div className="section-4-edit">
                     
                   <div className="section-4-left-side-edit">
                     
                     <div className="fields-section-edit">
                                 <p>Investigation Report</p>
                                     <textarea 
                                          className="description-edit" 
                                          placeholder="Enter Investigation Report"
                                          rows={15}
                                          value={toUpdate.investigator.investigationReport}
                                          name="investigator.investigationReport"
                                          id="investigator.investigationReport"
                                          onChange={handleFormChange} 
                                  ></textarea>
                       </div>
                     
                    </div>
                     
               <div className="section-4-right-side-edit">
                     
                 <div className="title-edit">
                       <p> Photo of Investigation (if Applicable)</p>
                 </div> 
                     
                 <div className="file-upload-container-edit">
                   <label htmlFor="file-upload1" className="upload-link-edit">Click to Upload File</label>
                   <input
                     id="file-upload1"
                     type="file"
                     className="file-upload-input-edit"
                     accept=".jpg,.jpeg,.png"
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                       handleFileChangeContainer1(e);
                       handleFormChange(e);
                     }} // Handle file selection
                   />
                   <div className="uploadedFiles-container-edit">
                     {filesContainer1.length > 0 && (
                       <div className="file-name-image-display-edit">
                         <ul>
                           {filesContainer1.map((file, index) => (
                             <div className="file-name-image-display-indiv-edit" key={index}>
                               <li>
                                 {file.preview && (
                                   <div className="filename-image-container-edit">
                                     <img
                                       src={file.preview}
                                       alt={file.name}
                                       
                                       style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                     />
                                   </div>
                                 )}
                                 {file.name}
                                 <div className="delete-container-edit">
                                   <button
                                     type="button"
                                     onClick={() => handleFileDeleteContainer1(file.name)}
                                     className="delete-button-edit"
                                   >
                                     <img
                                       src="/images/trash.png"
                                       alt="Delete"
                                       className="delete-icon-edit"
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
    
        </form>
        



     
         <div className="dialouge-meeting-section-edit">
              
                 <div className="title-section-edit">
                     <button type="button" className="plus-button-edit" onClick={handleToggleClick}></button>
                     <p className="NewOfficial-edit">Dialogue Meeting</p>
                 </div>

                 <hr/>
 
                 {showDialogueContent && (
                     <>
                         <div className="section-2-dialouge-edit">
                             <p>Complainant's Information</p>
                             <div className="bars-edit">
                                 <div className="input-group-edit">
                                     <p>Date</p>
                                     <input type="date" className="search-bar-edit" placeholder="Enter Date" />
                                 </div>
                                 <div className="input-group-edit">
                                     <p>For</p>
                                     <input type="text" className="search-bar-edit" placeholder="Enter For" />
                                 </div>
                                 <div className="input-group-edit">
                                     <p>Time</p>
                                     <input type="time" className="search-bar-edit" placeholder="Enter Time" />
                                 </div>
                             </div>
                         </div>
 
                         <div className="section-3-dialouge-edit">
                             <div className="fields-section-edit">
                                 <p>Minutes of Dialogue</p>
                                 <textarea className="description-edit" placeholder="Enter Minutes of Dialogue" rows={13}></textarea>
                             </div>
                         </div>
 
                         <div className="section-4-dialouge-edit">
                             <div className="fields-section-edit">
                                 <p>Remarks</p>
                                 <textarea className="description-edit" placeholder="Enter Remarks" rows={10}></textarea>
                             </div>
                             <div className="fields-section-edit">
                                 <p>Parties</p>
                                 <textarea className="description-edit" placeholder="Enter Parties" rows={10}></textarea>
                             </div>
                         </div>
                     </>
                 )}
             </div>

           
 
     <div className="hearing-section-edit">
         
             <div className="title-section-edit">
                 <button type="button" className="plus-button-edit" onClick={handleToggleClick}></button>
                 <p className="NewOfficial-edit">First Hearing</p>
             </div>
 
 
     </div>
 
     <div className="hearing-section-edit">
         
             <div className="title-section-edit">
                 <button type="button" className="plus-button-edit" onClick={handleToggleClick}></button>
                 <p className="NewOfficial-edit">Second Hearing</p>
             </div>
     </div>
 
     <div className="hearing-section-edit">
         
         <div className="title-section-edit">
             <button type="button" className="plus-button-edit" onClick={handleToggleClick}></button>
             <p className="NewOfficial-edit">Third Hearing</p>
         </div>
     </div>
 
 
     </main>
      )}
    </>
  );
}
