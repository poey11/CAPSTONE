"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpecificDocument, generateDownloadLink } from "../../../../helpers/firestorehelper";
import { doc, updateDoc} from "firebase/firestore";
import { db } from "../../../../db/firebase";
import { getLocalDateTimeString,isValidPhilippineMobileNumber } from "@/app/helpers/helpers";
import React from "react";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"
import Hearing from "@/app/(barangay-side)/components/hearingForm";




export default function EditLuponIncident() {
   
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");



    const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);
    const [loading , setLoading] = useState(true);
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>();
    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
    const today = getLocalDateTimeString(new Date());
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
        accAssigned: "",
        dateTimeInvestigated: "",
        investigationReport: "",
        investigateImage: "",
      }
    });

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
            accAssigned: mergeData(reportData.investigator?.accAssigned, toUpdate.investigator?.accAssigned),
            dateTimeInvestigated: mergeData(reportData.investigator?.dateTimeInvestigated, toUpdate.investigator?.dateTimeInvestigated),
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
          if(!isValidPhilippineMobileNumber(toUpdate.complainant.contact) || !isValidPhilippineMobileNumber(toUpdate.respondent.contact)){
            setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 3000);
            return;
          } 
          HandleEditDoc().then(() => {
          //  alert("Successfully Updated")
            setPopupMessage("Incident Successfully Updated!")
            setShowPopup(true);
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
            accAssigned: "",
            dateTimeInvestigated: "",
            investigationReport: "",
            investigateImage: "",
          },
        });
    }


  const [showRecordDetails, setShowRecordDetails] = useState(false);
  const [showComplainantDetails, setShowComplainantDetails] = useState(false);
  const [showInvestigatedDetails, setShowInvestigatedDetails] = useState(false);
  const [showOtherDetails, setShowOtherDetails] = useState(false);

  const toggleRecordDetails = () => setShowRecordDetails(prev => !prev);
  const toggleComplainantDetails = () => setShowComplainantDetails(prev => !prev);
  const toggleInvestigatedDetails = () => setShowInvestigatedDetails(prev => !prev);
  const toggleOtherDetails = () => setShowOtherDetails(prev => !prev);




  const confirmSubmit = async () => {
    setShowSubmitPopup(false);
  
    setPopupMessage("Incident Record added successfully!");
    setShowPopup(true);
  
    // Hide the popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
      router.push("/dashboard/IncidentModule");
    }, 3000);
  
    // Create a fake event and call handleSubmit
    const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
    await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
  };
 


  return (
    <>
      {loading ? (       <p></p> ) : (
        <main className="main-container-edit">
          {errorPopup.show && (
              <div className="popup-overlay error">
                  <div className="popup">
                      <p>{errorPopup.message}</p>
                      <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button">Close</button>
                  </div>
              </div>
        )}
          <div className="letters-content-edit">
               <button className="letter-announcement-btn-edit" name="dialogue" onClick={handleGenerateLetterAndInvitation}>Generate Dialogue Letter</button>

                {(reportData.isDialogue) ? (<button className="letter-announcement-btn-edit" name="summon" onClick={handleGenerateLetterAndInvitation}>Generate Summon Letter</button>)
                :(<><button className="letter-announcement-btn-edit" name="summon" onClick={() => setErrorPopup({ show: true, message: "Generate A Dialogue Letter First"})}>Generate Summon Letter</button></>)}
              
               <select
                  id="status"
                  className={`status-dropdown-edit ${toUpdate.status?.toLowerCase() || reportData.status?.toLowerCase() || "pending"}`}
                  name="status"
                  value={toUpdate.status ?? reportData.status ?? "pending"}  // changed to small
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

                      <h1 className="title-side-edit">Update Complainant's Information</h1>
                      
                      
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
                  
                      <select   className="search-bar-edit"    
                      value={toUpdate.complainant.civilStatus || reportData.complainant.civilStatus || ""} // Show db value or user-updated value
                      name="complainant.civilStatus"
                      id="complainant.civilStatus"
                      onChange={handleFormChange}
                      required>
                      <option value="" disabled>Choose A Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      </select>

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

                  <h1>Update Respondent's Information</h1>
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
                      <select   className="search-bar-edit"    
                      value={toUpdate.respondent.civilStatus || reportData.respondent.civilStatus || ""} // Show db value or user-updated value
                      name="respondent.civilStatus"
                      id="respondent.civilStatus"
                      onChange={handleFormChange}
                      required>
                        <option value="" disabled>Choose A Civil Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Divorced">Divorced</option>

                      </select>

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
                       <>
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

                        </>
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
                      disabled
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
                      disabled
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

              <hr/>


                  {showInvestigatedDetails&& (   
                    <div className="bars-edit">
                      {/* revised this. the investigator will be the sitio/kagawads or the lf staffs. will discuss with grpmates */}
                        <div className="input-group-edit">
                            <p>Investigator Assigned</p>
                            <input type="text" className="search-bar-edit" 
                            placeholder={reportData?.investigator?.accAssigned ?? "Enter Full Name"}
                            value={toUpdate?.investigator.accAssigned}
                            name="investigator.accAssigned"
                            id="investigator.accAssigned"
                            onChange={handleFormChange}
                            />
                        </div>

                        <div className="input-group-edit">
                            <p>Date and Time Investigated</p>
                            <input type="datetime-local" className="search-bar-edit" 
                              value={toUpdate?.investigator?.dateTimeInvestigated || reportData?.investigator?.dateTimeInvestigated || ""}
                              name="investigator.dateTimeInvestigated"
                              id="investigator.dateTimeInvestigated"
                              onChange={handleFormChange} 
                              max={today} 
                              />
                        </div>
                        
                    </div>

                  )}

    
               </div>
               
                     
               <div className="section-4-edit">


               <div className="record-details-topsection">
                            <button type="button" 
                                className={showOtherDetails ? "record-details-minus-button" : "record-details-plus-button"} 
                                onClick={toggleOtherDetails}>
                            </button>
                   <h1>Other Details</h1>
              </div>

              <hr/>

              

              {showOtherDetails && (
    <>


      <div className="section-4-upper-edit">
        <div className="section-4-left-side-edit">
          <div className="fields-section-edit">
            <p>Investigation Report</p>
            {/* only the assigned investiagtor should be able to edit this */}
            <textarea
              className="description-edit resize-none"
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
            <p>Photo of Investigation (if Applicable)</p>
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
              }}
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
                              <img src="/images/trash.png" alt="Delete" className="delete-icon-edit" />
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

      <div className="section-4-lower-edit">
        <p className="title">Image of Incident</p>
        <div className="description">
          {concernImageUrl ? (
            <a href={concernImageUrl} target="_blank" rel="noopener noreferrer">
              <img src={concernImageUrl} alt="Incident" className="incident-image" style={{ width: '30%', height: '100%', marginRight: '5px', cursor: "pointer" }} />
            </a>
          ) : (
            <div className="input-group">
              <p style={{ color: "gray", fontStyle: "italic" }}>No image available</p>
            </div>
          )}
        </div>
      </div>
      </>
     )}
      </div>
      </form>
        <Dialogue  id={docId || ""}/>
        {Array.from({ length: reportData.nosHearing }, (_, i) => (
          <Hearing key={i}  hearingIndex={i} nosOfGeneration={reportData?.nosOfGeneration} id={docId||""}/>
        ))}



      {showSubmitPopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <p>Are you sure you want to submit?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}
        {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}




     </main>
      )}
    </>
  );
}
