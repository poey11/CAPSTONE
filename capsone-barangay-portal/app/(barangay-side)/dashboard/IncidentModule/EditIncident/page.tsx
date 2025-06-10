"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpecificDocument, generateDownloadLink } from "../../../../helpers/firestorehelper";
import { doc, updateDoc, collection, where, getDocs, query, onSnapshot} from "firebase/firestore";
import { db } from "../../../../db/firebase";
import { isValidPhilippineMobileNumber } from "@/app/helpers/helpers";
import React from "react";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"
import Hearing from "@/app/(barangay-side)/components/hearingForm";


export default function EditLuponIncident() {
    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");


    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);
    const [loading , setLoading] = useState(true);
    const router = useRouter();
    const searchParam = useSearchParams();
    
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>();
    const departmentId = reportData?.department;
    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
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
    const caseNumber = reportData?.caseNumber;
    
    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
    
      setToUpdate((prevState: any) => {
        if (type === "file") {
          const fileInput = e.target as HTMLInputElement;
          if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
    
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
          receivedBy: `${receivedByFname} ${receivedByLname}`,
          nature: mergeData(reportData.nature, toUpdate.nature),
          location: mergeData(reportData.location, toUpdate.location),
          status: mergeData(reportData.status, toUpdate.status),
          nosofFemaleChildren: mergeData(reportData.nosofFemaleChildren, toUpdate.nosofFemaleChildren),
          nosofMaleChildren: mergeData(reportData.nosofMaleChildren, toUpdate.nosofMaleChildren),

          isMediation: toUpdate.isMediation ?? false,
          isConciliation: toUpdate.isConciliation ?? false,
          isArbitration: toUpdate.isArbitration ?? false,
        });
       
        await updateDoc(docRef, cleanedData);
      }
    };

    

    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      console.log(toUpdate);  //
    

const complainantContact = toUpdate.complainant.contact || reportData?.complainant?.contact || "";
const respondentContact = toUpdate.respondent.contact || reportData?.respondent?.contact || "";

      if (form.checkValidity()) {

        if (!isValidPhilippineMobileNumber(complainantContact) || 
            !isValidPhilippineMobileNumber(respondentContact)) {

          setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
          return;
        }
    
        setShowSubmitPopup(true); // ✅ Show confirmation only
      } else {
        form.reportValidity();
      }
    };
    


const confirmSubmit = async () => {
  setShowSubmitPopup(false);

  try {
    await HandleEditDoc(); // ✅ Only update when Yes is clicked

    setPopupMessage("Incident Successfully Updated!");
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      if (docId && departmentId) {
        router.push(`/dashboard/IncidentModule/Department?id=${departmentId}&incidentId=${docId}`);
      }
    }, 3000);
  } catch (error) {
    console.error("Error during confirmation submit:", error);
    setPopupErrorMessage("Error updating incident. Please try again.");
    setShowErrorPopup(true);
    setTimeout(() => setShowErrorPopup(false), 3000);
  }
};


    const handleBack = () => {
      router.back();
    };
    
    const handleGenerateLetterAndInvitation = (e:any) => {
      const action = e.currentTarget.name;
      router.push(`/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${docId}?action=${action}`);
    };

    const handleDialogueSection = () => {
      router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}`);
    };

    const handleHearingSection = () => {
      router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}`);
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
        });
    }

    


    useEffect(() => {
      if (reportData) {
        setToUpdate({
          complainant: {
            fname: reportData.complainant?.fname || "",
            lname: reportData.complainant?.lname || "",
            sex: reportData.complainant?.sex || "",
            age: reportData.complainant?.age || "",
            civilStatus: reportData.complainant?.civilStatus || "",
            address: reportData.complainant?.address || "",
            contact: reportData.complainant?.contact || "",
          },
          respondent: {
            fname: reportData.respondent?.fname || "",
            lname: reportData.respondent?.lname || "",
            sex: reportData.respondent?.sex || "",
            age: reportData.respondent?.age || "",
            civilStatus: reportData.respondent?.civilStatus || "",
            address: reportData.respondent?.address || "",
            contact: reportData.respondent?.contact || "",
          },
          fname: reportData.receivedBy?.split(" ")[0] || "",
          lname: reportData.receivedBy?.split(" ")[1] || "",
          nature: reportData.nature || "",
          location: reportData.location || "",
          status: reportData.status || "pending",
          nosofMaleChildren: reportData.nosofMaleChildren || "",
          nosofFemaleChildren: reportData.nosofFemaleChildren || "",
          isMediation: reportData.isMediation || false,
          isConciliation: reportData.isConciliation || false,
          isArbitration: reportData.isArbitration || false,
          timeReceived: reportData.timeReceived || "",
          dateReceived: reportData.dateReceived || ""
        });
      }
    }, [reportData]);


  const [showRecordDetails, setShowRecordDetails] = useState(false);
  const [showComplainantDetails, setShowComplainantDetails] = useState(false);
  const [showInvestigatedDetails, setShowInvestigatedDetails] = useState(false);
  const [showOtherDetails, setShowOtherDetails] = useState(false);

  const toggleRecordDetails = () => setShowRecordDetails(prev => !prev);
  const toggleComplainantDetails = () => setShowComplainantDetails(prev => !prev);
  const toggleInvestigatedDetails = () => setShowInvestigatedDetails(prev => !prev);
  const toggleOtherDetails = () => setShowOtherDetails(prev => !prev);

  const [activeSection, setActiveSection] = useState("complainant");


  useEffect(() => {
    const fetchSummonLetterStatus = async () => {
      try {
        if (!docId) return; // Ensure docId is loaded
  
        const lettersRef = collection(db, "IncidentReports", docId, "GeneratedLetters");
  
        const q = query(lettersRef, where("letterType", "==", "summon"));
        const snapshot = await getDocs(q);
  
        if (!snapshot.empty) {
          setHasSummonLetter(true);
        } else {
          setHasSummonLetter(false); // Optional fallback
        }
      } catch (error) {
        console.error("Error checking summon letters:", error);
      }
    };
  
    fetchSummonLetterStatus();
  }, [docId]);


  useEffect(() => {
    if (!docId) return; // or use `id` or whatever your incident ID is called
    const docRef = doc(db, "IncidentReports", docId, "DialogueMeeting", docId);
  
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.filled === true) {
          setIsDialogueSectionFilled(true);
        }
      }
    });
  
    return () => unsubscribe();
  }, [docId]);
  

  return (
    <>
      {loading ? (       <p></p> ) : (
        <main className="main-container-edit">

          {/* NEW CODE */}
          <div className="edit-incident-redirectionpage-section">
            <button className="edit-incident-redirection-buttons-selected">
              <div className="edit-incident-redirection-icons-section">
                <img src="/images/profile-user.png" alt="user info" className="redirection-icons-info"/> 
              </div>
              <h1>Incident Information</h1>
            </button>

            <div className="dialogue-dropdown">
              <button className="edit-incident-redirection-buttons">
                <div className="edit-incident-redirection-icons-section">
                  <img src="/images/team.png" alt="user info" className="redirection-icons-dialogue"/> 
                </div>
                <h1>Dialogue Meeting</h1>
              </button>

              <div className="dialogue-submenu">
                <button className="submenu-button" name="dialogue" onClick={handleGenerateLetterAndInvitation}>
                  <h1>Generate Dialogue Letters</h1>
                </button>

                {reportData.isDialogue ? (
                  <button className="submenu-button" name="section" onClick={handleDialogueSection}>
                    <h1>Dialogue Section</h1>
                  </button>
                ) : (
                  <button
                    className="submenu-button"
                    name="section"
                    onClick={() => {
                      setPopupErrorMessage("Generate A Dialogue Letter First");
                      setShowErrorPopup(true);
                      setTimeout(() => setShowErrorPopup(false), 3000);
                    }}
                  >
                    <h1>Dialogue Section</h1>
                  </button>
                )}

                
                
              </div>
            </div>

            <div className="hearing-dropdown">
              <button className="edit-incident-redirection-buttons">
                <div className="edit-incident-redirection-icons-section">
                  <img src="/images/group-discussion.png" alt="user info" className="redirection-icons-hearing"/> 
                </div>
                <h1>Hearing Section</h1>
              </button>

              <div className="hearing-submenu">
                {reportData.isDialogue ? (
                  isDialogueSectionFilled ? (
                    <button className="submenu-button" name="summon" onClick={handleGenerateLetterAndInvitation}>
                      <h1>Generate Summon Letters</h1>
                    </button>
                  ) : (
                    <button
                      className="submenu-button"
                      name="summon"
                      onClick={() => {
                        setPopupErrorMessage("Fill out the Dialogue Section first.");
                        setShowErrorPopup(true);
                        setTimeout(() => setShowErrorPopup(false), 3000);
                      }}
                    >
                      <h1>Generate Summon Letters</h1>
                    </button>
                  )
                ) : (
                  <button
                    className="submenu-button"
                    name="summon"
                    onClick={() => {
                      setPopupErrorMessage("Generate a Dialogue Letter first.");
                      setShowErrorPopup(true);
                      setTimeout(() => setShowErrorPopup(false), 3000);
                    }}
                  >
                    <h1>Generate Summon Letters</h1>
                  </button>
                )}

                {hasSummonLetter ? (
                  <button className="submenu-button" name="section" onClick={handleHearingSection}>
                    <h1>Hearing Section</h1>
                  </button>
                ) : (
                  <button
                    className="submenu-button"
                    name="section"
                    onClick={() => {
                      setPopupErrorMessage("Generate a Summon Letter First");
                      setShowErrorPopup(true);
                      setTimeout(() => setShowErrorPopup(false), 3000);
                    }}
                  >
                    <h1>Hearing Section</h1>
                  </button>
                )}
              </div>

            </div>

          </div>
          
          <div className="edit-incident-main-content">
            <div className="edit-incident-main-section1">
              <div className="edit-incident-main-section1-left">
                <button onClick={handleBack}>
                  <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                </button>

                <h1> Edit Incident </h1>
              </div>

              <div className="action-btn-section">
                
              <button type="submit" className="action-view-edit" onClick={handleSubmit}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
              
            </div>

            <div className="edit-incident-header-body">
              <div className="edit-incident-header-body-top-section">
                <div className="edit-incident-info-toggle-wrapper">
                  {["complainant", "respondent", "incident" , "barangay desk" ].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section === "complainant" && "Complainant"}
                      {section === "respondent" && "Respondent"}
                      {section === "incident" && "Incident"}
                      {section === "barangay desk" && "Desk Officer"}
                    </button>
                  ))}
                </div> 
              </div>

              <div className="edit-incident-header-body-bottom-section">
                <div className="edit-incident-main-details-container">
                  <div className="edit-incident-main-details-section">
                    <div className="edit-incident-main-details-topsection">
                      <h1>{reportData?.caseNumber}</h1>
                    </div>
                    <div className="edit-incident-main-details-statussection">
                      <h1> Status</h1>

                      <div className="status-section-view">
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
                    </div>

                    <div className="edit-incident-main-details-description">
                      <div className="incident-date-section">
                        <div className="incident-date-topsection">
                          <div className="incident-main-details-icons-section">
                            <img src="/Images/calendar.png" alt="calendar icon" className="view-incident-description-icon-calendar" />
                          </div>
                          <div className="incident-main-details-title-section">
                            <h1>Date Filed</h1>
                          </div>
                        </div>
                        <p>{reportData?.dateFiled || "N/A"}</p>
                      </div>

                      <div className="incident-location-section">
                        <div className="incident-loc-topsection">
                          <div className="incident-main-details-icons-section">
                            <img src="/Images/loc.png" alt="location icon" className="view-incident-description-icon-loc" />
                          </div>
                          <div className="incident-main-details-title-section">
                            <h1>Location</h1>
                          </div>
                        </div>
                        <p>{reportData?.location || "N/A"}</p>
                      </div>
                        
                      <div className="incident-description-section">
                        <div className="incident-desc-topsection">
                          <div className="incident-main-details-icons-section">
                            <img src="/Images/description.png" alt="description icon" className="view-incident-description-icon-desc" />
                          </div>
                          <div className="incident-main-details-title-section">
                            <h1>Nature</h1>
                          </div>
                        </div>
                        <p>{reportData?.nature || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="edit-incident-info-main-container">
                  <div className="edit-incident-info-container-scrollable">
                    <div className="edit-incident-info-main-content">
                      {activeSection === "complainant" && (
                        <>
                          <div className="edit-incident-dialogue-content">
                            <div className="edit-incident-content-topsection">
                              <div className="edit-incident-content-left-side">
                                <div className="edit-incident-fields-section">
                                  <p>Last Name</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.complainant.lname} value={toUpdate.complainant.lname} name="complainant.lname" id="complainant.lname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>First Name</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.complainant.fname} value={toUpdate.complainant.fname} name="complainant.fname" id="complainant.fname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Civil Status</p>
                                  <select   className="edit-incident-input-field"    
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
                                </div>
                              </div>

                              <div className="edit-incident-content-right-side">
                                <div className="edit-incident-fields-section">
                                  <p>Age</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.complainant.age} value={toUpdate.complainant.age} name="complainant.age" id="complainant.age" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Sex</p>
                                  <select 
                                    className="edit-incident-input-field"                     
                                    name="complainant.sex" 
                                    id="complainant.sex"
                                    value={toUpdate.complainant.sex || reportData.complainant.sex || ""} // Show db value or user-updated value
                                    onChange={handleFormChange}
                                    >
                                    <option value="" disabled>Choose A Sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                  </select>
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Address</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.complainant.address} value={toUpdate.complainant.address} name="complainant.address" id="complainant.address" onChange={handleFormChange} />
                                </div>
                              </div>
                            </div>

                            <div className="bottom-middle-section">
                              <div className="bottom-middle-incidentfields">
                                <p>Contact Number</p>
                                <input type="text" className="edit-incident-input-field" placeholder={reportData.complainant.contact} value={toUpdate.complainant.contact} name="complainant.contact" id="complainant.contact" onChange={handleFormChange} />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {activeSection === "respondent" && (
                        <>
                        <div className="edit-incident-dialogue-content">
                            <div className="edit-incident-content-topsection">
                              <div className="edit-incident-content-left-side">
                                <div className="edit-incident-fields-section">
                                  <p>Last Name</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.respondent.lname} value={toUpdate.respondent.lname} name="respondent.lname" id="respondent.lname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>First Name</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.respondent.fname} value={toUpdate.respondent.fname} name="respondent.fname" id="respondent.fname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Civil Status</p>
                                  <select   className="edit-incident-input-field"    
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
                                </div>
                              </div>

                              <div className="edit-incident-content-right-side">
                                <div className="edit-incident-fields-section">
                                  <p>Age</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.respondent.age} value={toUpdate.respondent.age} name="respondent.age" id="respondent.age" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Sex</p>
                                  <select 
                                    className="edit-incident-input-field"                     
                                    name="respondent.sex" 
                                    id="respondent.sex"
                                    value={toUpdate.respondent.sex || reportData.respondent.sex || ""} // Show db value or user-updated value
                                    onChange={handleFormChange}
                                    >
                                    <option value="" disabled>Choose A Sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                  </select>
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Address</p>
                                  <input type="text" className="edit-incident-input-field" placeholder= {reportData.respondent.address} value={toUpdate.respondent.address} name="respondent.address" id="respondent.address" onChange={handleFormChange} />
                                </div>
                              </div>
                            </div>

                            <div className="bottom-middle-section">
                              <div className="bottom-middle-incidentfields">
                                <p>Contact Number</p>
                                <input type="text" className="edit-incident-input-field" placeholder={reportData.respondent.contact} value={toUpdate.respondent.contact} name="respondent.contact" id="respondent.contact" onChange={handleFormChange} />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {activeSection === "incident" && (
                        <>
                          <div className="edit-incident-dialogue-content">
                            <div className="edit-incident-content-topsection">
                              <div className="edit-incident-content-left-side">
                                <div className="edit-incident-fields-section">
                                  <p>Nature of Complaint</p>
                                  {reportData?.nature === "Others" ? (<>
                                    <input type="text" className="edit-incident-input-field" 
                                    placeholder={reportData.specifyNature}
                                    value={toUpdate.nature}
                                    name="nature"
                                    id="nature"
                                    onChange={handleFormChange} disabled/>
                                  </>):(<>
                                    <input type="text" className="edit-incident-input-field" 
                                    placeholder={reportData.nature}
                                    value={toUpdate.nature}
                                    name="nature"
                                    id="nature"
                                    onChange={handleFormChange} disabled/>
                                  </>)}
                                </div>
                                {department === "GAD" && (
                                  <>
                                    <div className="edit-incident-fields-section">
                                      <p>Nos of Male Children Victim/s</p>
                                      <input 
                                        type="number" 
                                        className="edit-incident-input-field"
                                        value={toUpdate.nosofMaleChildren || reportData.nosofMaleChildren}
                                        onChange={handleFormChange}
                                        name="nosofMaleChildren"
                                        required 
                                      />   
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="edit-incident-content-right-side">
                                <div className="edit-incident-fields-section">
                                  <p>Location</p>
                                  <input type="text" className="edit-incident-input-field" 
                                    placeholder={reportData.location} 
                                    value={toUpdate.location}
                                    name="location"
                                    id="location"
                                    onChange={handleFormChange} disabled
                                  />
                                </div>

                                {department === "GAD" && (
                                  <>
                                    <div className="edit-incident-fields-section">
                                      <p>Nos of Female Children Victim/s</p>
                                      <input 
                                        type="number" 
                                        className="edit-incident-input-field"
                                        value={toUpdate.nosofFemaleChildren||reportData.nosofFemaleChildren}
                                        name="nosofFemaleChildren"
                                        onChange={handleFormChange}
                                        required 
                                      />   
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="bottom-middle-section">
                              <div className="bottom-middle-incidentfields">
                                <p>Date & Time Filed</p>
                                <input type="text" className="edit-incident-input-field" placeholder={`${reportData.dateFiled} ${reportData.timeFiled}`} disabled/>
                              </div>
                            </div>

                            <div className="edit-incident-content-bottomsection">
                              <div className="view-incident-partyA-container">
                                <div className="box-container-outer-natureoffacts">
                                  <div className="title-remarks-partyA">
                                    Nature of Facts
                                  </div>

                                  <div className="box-container-partyA">
                                    <textarea className="natureoffacts-input-field" name="concern" id="concern" value={reportData.concern} onChange={handleFormChange} onFocusCapture={(e) => {e.target.blur();}} />
                                  </div>
                                </div>
                              </div>

                              <div className="view-incident-partyA-container">
                                <div className="box-container-outer-natureoffacts">
                                  <div className="title-remarks-partyA">
                                    Incident Image
                                  </div>

                                  <div className="box-container-incidentimage">
                                    {concernImageUrl ? (
                                      <img
                                        src={concernImageUrl}
                                        alt="Incident Image"
                                        style={{ maxWidth: "100%", maxHeight: "260px", borderRadius: "10px" }}
                                      />
                                    ) : (
                                      <p style={{ color: "red", fontStyle: "italic", textAlign: "center", marginTop: "30%" }}>No image available</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {activeSection === "barangay desk" && (
                        <>
                          <div className="barangay-desk-officer-section">
                            <div className="edit-incident-fields-section-deskofficer">
                              <p>Full Name</p>
                              <input 
                                type="text" 
                                className="edit-incident-input-field" 
                                placeholder={reportData.receivedBy} 
                                value={toUpdate.fname||""}
                                name="fname"
                                id="fname"
                                disabled
                                onChange={handleFormChange}
                              />
                            </div>

                            <div className="edit-incident-fields-section-deskofficer">
                              <p>Date Signed</p>
                              <input 
                                type="text" 
                                className="edit-incident-input-field" 
                                placeholder={reportData.dateReceived} 
                                value={toUpdate.dateReceived||""} 
                                id="dateReceived" 
                                name="dateReceived"
                                disabled 
                                onChange={handleFormChange}
                              />
                            </div>

                            <div className="edit-incident-fields-section-deskofficer">
                              <p>Time Signed</p>
                              <input 
                                type="text" 
                                className="edit-incident-input-field" 
                                placeholder={reportData.timeReceived} 
                                value={toUpdate.timeReceived||""} 
                                id="timeReceived" 
                                name="time  Received" 
                                disabled
                                onChange={handleFormChange}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

          
                  

          {/* OLD CODE */}
          
          {/*
          <div className="letters-content-edit">
               <button className="letter-announcement-btn-edit" name="dialogue" onClick={handleGenerateLetterAndInvitation}>Generate Dialogue Letter</button>

                {(reportData.isDialogue) ? (<button className="letter-announcement-btn-edit" name="summon" onClick={handleGenerateLetterAndInvitation}>Generate Summon Letter</button>)
                :(<><button className="letter-announcement-btn-edit" name="summon" onClick={() => {setPopupErrorMessage("Generate A Dialogue Letter First"); setShowErrorPopup(true); setTimeout(() => setShowErrorPopup(false), 3000)}}>Generate Summon Letter</button></>)}
              
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
              <button type="submit" className="action-view-edit" onClick={handleSubmit}>Save</button>   
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
                           {reportData?.nature === "Others" ? (<>
                            <input type="text" className="search-bar-edit" 
                            placeholder={reportData.specifyNature}
                            value={toUpdate.nature}
                            name="nature"
                            id="nature"
                            onChange={handleFormChange} disabled/>
                           </>):(<>
                            <input type="text" className="search-bar-edit" 
                            placeholder={reportData.nature}
                            value={toUpdate.nature}
                            name="nature"
                            id="nature"
                            onChange={handleFormChange} disabled/>
                           </>)}
                            

                       </div>
        
                       <div className="input-group-edit">
                           <p>Location</p>
                           <input type="text" className="search-bar-edit" 
                           placeholder={reportData.location} 
                           value={toUpdate.location}
                           name="location"
                           id="location"
                           onChange={handleFormChange} disabled/>
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
                   <h1>Complaint Received by</h1>
              </div>

                    <hr/>


                   {showComplainantDetails && (   



                  <div className="bars-edit">

                    <div className="input-group-edit">

                      <p>Barangay Desk Officer Name</p>

                      <input 
                      type="text" 
                      className="search-bar-edit" 
                      placeholder={reportData.receivedBy} 
                      value={toUpdate.fname||""}
                      name="fname"
                      id="fname"
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
            <p>Nature of Facts</p>
            <textarea
              className="description-edit resize-none hover:cursor-default"
              rows={15}
              value={reportData.concern}
              name="concern"
              id="concern"
              onChange={handleFormChange}
              onFocusCapture={(e) => {e.target.blur();}}

            ></textarea>
          </div>
        </div>

        <div className="section-4-right-side-edit">
          <div className="title-edit">
            <p>Image of Incident</p>
          </div>

          <div className="file-upload-container-edit">
              <div className="description">
                {concernImageUrl ? (
                  <a href={concernImageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={concernImageUrl} alt="Incident" className="incident-image" />
                  </a>
                ) : (
                  <div className="input-group">
                    <p style={{ color: "gray", fontStyle: "italic" }}>No image available</p>
                  </div>
                )}
            </div>
          </div>
        </div>
        </div>

     
      </>
     )}
      </div>
      </form>
        <Dialogue  id={docId || ""} complainantName={`${reportData.complainant.fname} ${reportData.complainant.lname}`} respondentName={`${reportData.respondent.fname} ${reportData.respondent.lname}`}/>
        {Array.from({ length: reportData.hearing }, (_, i) => (
          <Hearing key={i}  index={i} generatedHearingSummons={reportData?.generatedHearingSummons} id={docId||""}/>
        ))}
        */}



{showSubmitPopup && (
  <div className="confirmation-popup-overlay-add">
    <div className="confirmation-popup-add">

      {toUpdate.status === "settled" ? (
        <>
          <p>How was the case settled?</p>
          <div className="settlement-options">
            <label>
              <input
                type="radio"
                name="settlementMethod"
                checked={toUpdate.isMediation === true}
                onChange={() => setToUpdate((prev: any) => ({
                  ...prev,
                  isMediation: true,
                  isConciliation: false,
                  isArbitration: false,
                }))}
              />
              Mediation
            </label>
            <label>
              <input
                type="radio"
                name="settlementMethod"
                checked={toUpdate.isConciliation === true}
                onChange={() => setToUpdate((prev: any) => ({
                  ...prev,
                  isMediation: false,
                  isConciliation: true,
                  isArbitration: false,
                }))}
              />
              Conciliation
            </label>
            <label>
              <input
                type="radio"
                name="settlementMethod"
                checked={toUpdate.isArbitration === true}
                onChange={() => setToUpdate((prev: any) => ({
                  ...prev,
                  isMediation: false,
                  isConciliation: false,
                  isArbitration: true,
                }))}
              />
              Arbitration
            </label>
          </div>

          <div className="yesno-container-add">
            <button
              onClick={() => setShowSubmitPopup(false)}
              className="no-button-add"
            >
              Cancel
            </button>
            <button onClick={confirmSubmit} className="yes-button-add">
              Submit
            </button>
          </div>
        </>
      ) : (
        <>
         <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
          <p>Are you sure you want to submit?</p>
          <div className="yesno-container-add">
            <button
              onClick={() => setShowSubmitPopup(false)}
              className="no-button-add"
            >
              No
            </button>
            <button onClick={confirmSubmit} className="yes-button-add">
              Yes
            </button>
          </div>
        </>
      )}

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
