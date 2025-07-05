"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpecificDocument, generateDownloadLink } from "../../../../helpers/firestorehelper";
import { doc, updateDoc, collection, where, getDocs, query, onSnapshot, deleteDoc, orderBy} from "firebase/firestore";
import { db } from "../../../../db/firebase";
import React from "react";


export default function EditLuponIncident() {
    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showContinuePopup, setShowContinuePopup] = useState(false);
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
      reopenRequester: "",
    });

    const [summonLetterData, setSummonLetterData] = useState<any[]>([]);
    useEffect(()=>{
        if (!docId) return;
        const colRef = query(
            collection(db, "IncidentReports", docId, "SummonsMeeting"),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => doc.data());
            setSummonLetterData(fetchedData);
        });
        return () => unsubscribe();
    },[docId]);

    const [showDoneIncidentPopup, setShowDoneIncidentPopup] = useState(false);

    useEffect(() => {
      if(summonLetterData[2]?.filled && (reportData?.status === "pending")  ){
        setShowDoneIncidentPopup(true);
      }
    },[summonLetterData]);

    console.log("Summon Letter Data:", summonLetterData);

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

        // Determine statusPriority based on status
        let statusValue = mergeData(reportData.status, toUpdate.status);
        let statusPriority = 1;
        if (statusValue === "archived") {
          statusPriority = 2;
        } else if(statusValue === "settled") {
          statusPriority = 3;
        }
        else if (statusValue === "pending") {
          statusPriority = 1;
        }
        else if(statusValue === "CFA") {
          statusPriority = 4;
        }

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
          status: statusValue,
          statusPriority: statusPriority,
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
     
      if (form.checkValidity()) {

    
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
  



  
    const [dialogueReset, setDialogueReset] = useState(false);
    const [hearingReset, setHearingReset] = useState(false);
    useEffect(() => {
      if(reportData?.status !== "archived") return;
      if(reportData.isDialogue && reportData.hearing === 0){
        /*WHen in the dialogue section, has a absent it will ask which one requested to reopen the incident case */
        console.log("Dialogue Section is respondent/compainant absent. one of them requested to reopen the incident case");
        setShowContinuePopup(true);
        setDialogueReset(true);
      }
      else if(reportData.hearingId){
        /* When in the hearing section, has a absent it will ask which one requested to reopen the incident case */
        console.log("Hearing Section is respondent/compainant absent. one of them requested to reopen the incident case");
        setShowContinuePopup(true);
        setHearingReset(true);
      }


    },[reportData])


  const handleReopen = async(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (!docId) return;

    try {
      const docRef = doc(db, "IncidentReports", docId);
      // Only update the reopenRequester field and set status to "pending"
      await updateDoc(docRef, {
        reopenRequester: toUpdate.reopenRequester,
        status: "pending",
        statusPriority: 1,
      });

      if(dialogueReset) await deleteDoc(doc(db, "IncidentReports", docId, "DialogueMeeting", docId)); // Delete the summon letter if it exists
      if(hearingReset) await deleteDoc(doc(db, "IncidentReports", docId, "SummonsMeeting", reportData.hearingId)); // Delete the hearing section if it exists

      setShowContinuePopup(false);
      setPopupMessage("Incident case has been reopened.");
      setShowPopup(true);

      setTimeout(() => {
        setShowPopup(false);
        router.refresh(); // Refresh the page to reflect changes
        if (docId && departmentId) {
          window.location.reload(); // Reload the page to ensure all data is fresh
        }
      }, 3000);
    } catch (error) {
      setPopupErrorMessage("Failed to reopen the case. Please try again.");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
    }
  }

  const handleClosingCase = async(status:boolean) => {
    if (!docId) return;
    setShowDoneIncidentPopup(false);
    const docRef = doc(db, "IncidentReports", docId);
    if(status) {
      // If the case is closed, update the status to "Settled" and reset other fields
      setPopupMessage("Incident case has been Settled.");
      setShowPopup(true);
      await updateDoc(docRef, {
        status: "settled",
        statusPriority: 3,
      });
      setTimeout(() => {
        setShowPopup(false);
        //router.push(`/dashboard/IncidentModule/Department?id=${departmentId}&incidentId=${docId}`);
        window.location.reload(); // Reload the page to ensure all data is fresh
      }, 3000);
    }
    else{
      // If the case is not closed, update the status to "cfa"
      setPopupMessage("Incident case has been set to CFA.");
      setShowPopup(true);
      await updateDoc(docRef, {
        status: "CFA",
        statusPriority: 4,
      });
      setTimeout(() => {
        setShowPopup(false);
        //router.push(`/dashboard/IncidentModule/Department?id=${departmentId}&incidentId=${docId}`);
        window.location.reload(); // Reload the page to ensure all data is fresh
      }, 3000);
    }

  }

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
          
            {reportData?.typeOfIncident === "Major" && (
              <>
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
              
              </>
            )}
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
                          onFocus ={(e) => e.target.blur()} // Prevents focus outline
                          disabled
                        >
                          <option value="pending">Pending</option>
                          <option value="archived">Archived</option>
                          <option value="settled">Settled</option>
                          <option value="CFA">CFA</option>
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
                        <p>{`${reportData?.dateFiled}${reportData.isReportLate ? " (Late Filing)" : ""} `  || "N/A"}</p>

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
                        <p>{`${reportData?.location} - ${reportData.areaOfIncident}` || "N/A"}</p>
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
                                  <input type="text" className="edit-incident-input-field" 
                                  placeholder= {reportData.complainant.lname} value={toUpdate.complainant.lname} 
                                  name="complainant.lname" id="complainant.lname" onChange={handleFormChange} disabled/>
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>First Name</p>
                                  <input type="text" className="edit-incident-input-field" disabled placeholder= {reportData.complainant.fname} value={toUpdate.complainant.fname} name="complainant.fname" id="complainant.fname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Civil Status</p>
                                  <select   className="edit-incident-input-field"    
                                    value={toUpdate.complainant.civilStatus || reportData.complainant.civilStatus || ""} // Show db value or user-updated value
                                    name="complainant.civilStatus"
                                    id="complainant.civilStatus" disabled
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
                                  <input type="text" disabled className="edit-incident-input-field" placeholder= {reportData.complainant.age} value={toUpdate.complainant.age} name="complainant.age" id="complainant.age" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Sex</p>
                                  <select 
                                    className="edit-incident-input-field"                     
                                    name="complainant.sex" 
                                    id="complainant.sex" disabled
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
                                  <input type="text" disabled className="edit-incident-input-field" placeholder= {reportData.complainant.address} value={toUpdate.complainant.address} name="complainant.address" id="complainant.address" onChange={handleFormChange} />
                                </div>
                              </div>
                            </div>

                            <div className="bottom-middle-section">
                              <div className="bottom-middle-incidentfields">
                                <p>Contact Number</p>
                                <input type="text" disabled className="edit-incident-input-field" placeholder={reportData.complainant.contact} value={toUpdate.complainant.contact} name="complainant.contact" id="complainant.contact" onChange={handleFormChange} />
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
                                  <input type="text" disabled className="edit-incident-input-field" placeholder= {reportData.respondent.lname} value={toUpdate.respondent.lname} name="respondent.lname" id="respondent.lname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>First Name</p>
                                  <input type="text" disabled className="edit-incident-input-field" placeholder= {reportData.respondent.fname} value={toUpdate.respondent.fname} name="respondent.fname" id="respondent.fname" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Civil Status</p>
                                  <select   className="edit-incident-input-field"    
                                    value={toUpdate.respondent.civilStatus || reportData.respondent.civilStatus || ""} // Show db value or user-updated value
                                    name="respondent.civilStatus" disabled
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
                                  <input type="text" disabled className="edit-incident-input-field" placeholder= {reportData.respondent.age} value={toUpdate.respondent.age} name="respondent.age" id="respondent.age" onChange={handleFormChange} />
                                </div>

                                <div className="edit-incident-fields-section">
                                  <p>Sex</p>
                                  <select 
                                    className="edit-incident-input-field"                     
                                    name="respondent.sex" 
                                    id="respondent.sex" disabled
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
                                  <input type="text"  disabled className="edit-incident-input-field" placeholder= {reportData.respondent.address} value={toUpdate.respondent.address} name="respondent.address" id="respondent.address" onChange={handleFormChange} />
                                </div>
                              </div>
                            </div>

                            <div className="bottom-middle-section">
                              <div className="bottom-middle-incidentfields">
                                <p>Contact Number</p>
                                <input type="text" disabled className="edit-incident-input-field" placeholder={reportData.respondent.contact} value={toUpdate.respondent.contact} name="respondent.contact" id="respondent.contact" onChange={handleFormChange} />
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
                                        disabled
                                      />   
                                    </div>
                                  </>
                                )}
                                {/* I will be reusint the classname for recommendedEvent*/}
                                { reportData?.typeOfIncident === "Minor" && (
                                  <>
                                    <div className="edit-incident-content-middle-section">
                                      <div className="edit-incident-fields-section">
                                        <p>Recommended Event To Join By Desk Officer</p>
                                        <input type="text" className="edit-incident-input-field" 
                                        value={`${reportData.recommendedEvent}`} name="recommendedEvent" id="recommendedEvent" disabled/>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="edit-incident-content-right-side">
                                <div className="edit-incident-fields-section">
                                  <p>Location</p>
                                  <input type="text" className="edit-incident-input-field" 
                                    placeholder={reportData.location} 
                                    value={`${toUpdate.location} - ${reportData.areaOfIncident}`}
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
                                        disabled
                                      />   
                                    </div>
                                  </>
                                )}
                                { reportData?.typeOfIncident === "Minor" && (
                                    <div className="edit-incident-fields-section">
                                      <p>Date & Time Filed</p>
                                      <input type="text" className="edit-incident-input-field" placeholder={`${reportData.dateFiled} ${reportData.timeFiled}`} disabled/>
                                    </div>
                                )}
                               
                              </div>
                            </div>
                            
                            <div className="bottom-middle-section">
                              {reportData?.typeOfIncident === "Major" && (
                                 <div className="bottom-middle-incidentfields">
                                  <p>Date & Time Filed</p>
                                  <input type="text" className="edit-incident-input-field" placeholder={`${reportData.dateFiled} ${reportData.timeFiled}`} disabled/>
                                </div>
                              )}
                            </div>

                            <div className="edit-incident-content-bottomsection">
                              
                            {reportData?.isReportLate && (
                              <div className="box-container-outer-natureoffacts">
                                  <div className="title-remarks-partyA">
                                    Reason For Late Filing/Reporting
                                  </div>

                                  <div className="box-container-partyA">
                                    <textarea className="natureoffacts-input-field" name="reasonForLateFiling" id="reasonForLateFiling" value={reportData.reasonForLateFiling} onChange={handleFormChange} onFocusCapture={(e) => {e.target.blur();}} />
                                  </div>
                                </div>
                            )}

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
                                value={reportData.receivedBy||""}
                                name="receivedBy"
                                id="receivedBy"
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


        {showContinuePopup && (
          <div className="confirmation-popup-overlay-continue">
            <div className="confirmation-popup-continue">
               <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                    <p className="popup-title">Who requested to reopen the incident case?</p>

                          <div className="settlement-options">
                            <label className="settlement-option">
                              <input
                                type="radio"
                                name="reopenRequester"
                                checked={toUpdate.reopenRequester === "complainant"}
                                onChange={() =>
                                  setToUpdate((prev: any) => ({
                                    ...prev,
                                    reopenRequester: "complainant",
                                  }))
                                }
                              />
                              Complainant
                            </label>
                            <label className="settlement-option">
                              <input
                                type="radio"
                                name="reopenRequester"
                                checked={toUpdate.reopenRequester === "respondent"}
                                onChange={() =>
                                  setToUpdate((prev: any) => ({
                                    ...prev,
                                    reopenRequester: "respondent",
                                  }))
                                }
                              />
                              Respondent
                            </label>
                          </div>

              <div className="yesno-container-continue">
                <button
                  onClick={() => setShowContinuePopup(false)}
                  className="no-button-continue"
                >
                  Cancel
                </button>
                <button onClick={handleReopen} className="yes-button-continue">
                  Reopen
                </button>
              </div>
            </div>
          </div>
        )}

        {showDoneIncidentPopup && (
          <div className="confirmation-popup-overlay-add">
            <div className="confirmation-popup-add">
              <img src="/Images/check.png" alt="icon alert" className="successful-icon-popup" />
              <p>Has the incident case been settled?</p>
              <div className="yesno-container-add">
                <button
                  onClick={() => handleClosingCase(false)}
                  className="no-button-add"
                >
                  No
                </button>
                <button  
                  onClick={() => handleClosingCase(true)}
                  className="yes-button-add"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>    
        )}

     </main>
      )}
    </>
  );
}
