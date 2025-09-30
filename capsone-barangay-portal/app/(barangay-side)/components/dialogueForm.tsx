
import { db } from "@/app/db/firebase";
import {getLocalDateTimeString} from "@/app/helpers/helpers";
import { doc, onSnapshot,collection, setDoc, query, where, updateDoc } from "firebase/firestore";
import { useState,useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {handleLetterOfFailure} from "@/app/helpers/pdfhelper";


interface DialogueFormProps {
    id: string;
    complainantName: string;
    respondentName: string;
}
type DialogueDetails = {
    minutesOfDialogue: string;
    remarks: string;
    partyA: string;
    partyB: string;
    HearingOfficer: string;
    Cstatus: string;
    Rstatus: string;
  };
  

const dialogueForm: React.FC<DialogueFormProps> = ({id, complainantName, respondentName}) => {
    const user = useSession().data?.user;
    const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden
    const [existingData, setExistingData] = useState(false);
    const [isDialogue, setIsDialogue] = useState(false);
    const today = getLocalDateTimeString(new Date());
    const [dialogueLetterData, setDialogueLetterData] = useState<any>(null);

    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [invalidFields, setInvalidFields] = useState<string[]>([]);


    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const department = searchParam.get("department");

    const [details, setDetails] = useState<DialogueDetails>({
        HearingOfficer: "",
        minutesOfDialogue: "",
        remarks: "",
        partyA: "",
        partyB: "",
        Cstatus: "Present",
        Rstatus: "Present",
    });

    const [barangayList, setBarangayList] = useState<any[]>([]);

   useEffect(() => {
        const staffquery = query(collection(db, "BarangayUsers"), where("position", "==","LF Staff"), where("firstTimelogin", "==", false));
        const unsubscribe = onSnapshot(staffquery, (snapshot) => {
            const staffList: any[] = [];
            snapshot.forEach((doc) => {
                staffList.push({ ...doc.data(), id: doc.id });
            });
            console.log("Staff List:", staffList);
            setBarangayList(staffList);
        });                     

            
        return () => { unsubscribe();  // Clean up the listener on unmount}
            }
        },[]);
    useEffect(() => {
        setDetails(prevDetails => ({
            ...prevDetails,
            HearingOfficer: user?.fullName || ""
        }));
            
    },[user])
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        if(!id) return;
        const docRef = doc(db, "IncidentReports", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setData(data);
                setIsDialogue(data.isDialogue); 
            } else {
                console.log("No such document!");
            }
        });
        return () => unsubscribe(); 
    },[])

    useEffect(() => {
        if(!id) return;
        const docRef = doc(db, "IncidentReports", id, "DialogueMeeting", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setDetails(data as DialogueDetails); 
                setExistingData(true);
            } else {
                console.log("No such document!");
            }
        });
        return () => unsubscribe();
        
    },[])
    
    useEffect(()=>{
        if(!id) return;
        const colRef = query(collection(db, "IncidentReports", id, "GeneratedLetters"), where("letterType", "==", "dialogue"));
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            snapshot.forEach((doc) => {
                setDialogueLetterData(doc.data());
            });
        });
        return () => unsubscribe();
    },[])



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement|HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split(".");
    
        setDetails(prevDetails => {
            if (keys.length === 2) {
                const [parentKey, childKey] = keys;
    
                const parent = prevDetails[parentKey as keyof DialogueDetails];
    
                if (typeof parent === "object" && parent !== null) {
                    return {
                        ...prevDetails,
                        [parentKey]: {
                            ...(parent as Record<string, any>),
                            [childKey]: value,
                        },
                    };
                }
            }
            return {
                ...prevDetails,
                [name]: value,
            };
        });
    };
    

    const usersAbsent = () => details.Cstatus === "Absent" || details.Rstatus === "Absent";
    
    useEffect(() => {
      setDetails((prev) => {
        // Clean previous status-related strings from minutes and remarks
        let minutes = (prev.minutesOfDialogue || "")
          .replace(/Complainant Absent\.?\s*/g, "")
          .replace(/Respondent Absent\.?\s*/g, "")
          .replace(/Complainant Present\.?\s*/g, "")
          .replace(/Respondent Present\.?\s*/g, "")
          .trim();
    
        let remarks = (prev.remarks || "")
          .replace(/Complainant Absent\.?\s*/g, "")
          .replace(/Respondent Absent\.?\s*/g, "")
          .replace(/Complainant Present\.?\s*/g, "")
          .replace(/Respondent Present\.?\s*/g, "")
          .trim();
    
        let partyA = "";
        let partyB = "";
    
        const complainantAbsent = prev.Cstatus === "Absent";
        const respondentAbsent = prev.Rstatus === "Absent";
    
        if (complainantAbsent && respondentAbsent) {
          partyA = "Complainant Absent";
          partyB = "Respondent Absent";
          minutes = (minutes ? " " : "") + "Complainant Absent. Respondent Absent.";
          remarks = (remarks ? " " : "") + "Complainant Absent. Respondent Absent.";
        } else if (complainantAbsent) {
          partyA = "Complainant Absent";
          partyB = "Respondent Present";
          minutes = (minutes ? " " : "") + "Complainant Absent.";
          remarks = (remarks ? " " : "") + "Complainant Absent.";
        } else if (respondentAbsent) {
          partyA = "Complainant Present";
          partyB = "Respondent Absent";
          minutes = (minutes ? " " : "") + "Respondent Absent.";
          remarks = (remarks ? " " : "") + "Respondent Absent.";
        } else {
          partyA = "";
          partyB = "";
        }
    
        return {
          ...prev,
          minutesOfDialogue: minutes,
          remarks: remarks,
          partyA,
          partyB,
        };
      });
    }, [details.Cstatus, details.Rstatus]);


    // New handler to show confirmation popup on Save click
    {/*
            const handleSaveClick = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowSubmitPopup(true);
    };
    */}

    const handleSaveClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requiredFields: (keyof DialogueDetails)[] = [
        "minutesOfDialogue",
        "remarks",
        "partyA",
        "partyB",
    ];

    const missingFields: string[] = requiredFields.filter(field => !details[field]);

    if (missingFields.length > 0) {
        setInvalidFields(missingFields);
        setPopupErrorMessage("Please fill up all required fields.");
        setShowErrorPopup(true);
        setTimeout(() => setShowErrorPopup(false), 3000);
        return;
    }

    setInvalidFields([]);
    setShowSubmitPopup(true);
};


    const [showSetRefailureMeetingPopup, setShowSetRefailureMeetingPopup] = useState(false);
    const [resheduleDateTime, setResheduleDateTime] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [deliverby, setDeliveryBy] = useState("");

    const saveDialogue = async () => {
        try {
            const subColRef = collection(db, "IncidentReports", id, "DialogueMeeting");
            const docRef = doc(subColRef, id);
            await setDoc(docRef, {
              ...details,
              filled:true,
            });

            const mainDocRef = doc(db, "IncidentReports", id);
            
            if(details.Rstatus === "Absent" && details.Cstatus !== "Absent"){
              //setShowSetRefailureMeetingPopup(true);
              await updateDoc(mainDocRef, {
                //sentLetterOfFailureToAppearDialogue: true,
                respondentAbsentInDialogue: true,
                respondentAbsents: (data?.respondentAbsents || 0) + 1,
              })
              
              setTimeout(() => {
                setShowPopup(false);
              }, 3000);
              router.push(`/dashboard/IncidentModule/EditIncident/RefailureDialogue/RefailureInfo?id=${id}&department=${department}`);
            }
            else if(details.Cstatus === "Absent" && details.Rstatus !== "Absent"){
                await updateDoc(mainDocRef, {
                  complainantAbsents: (data?.respondentAbsents || 0) + 1,
              })

            }
            else if(details.Cstatus === "Absent" && details.Rstatus === "Absent"){
              await updateDoc(mainDocRef, {
                complainantAbsents: (data?.respondentAbsents || 0) + 1,
                respondentAbsents: (data?.respondentAbsents || 0) + 1,
              })
            }
            else if (details.Cstatus !== "Absent" && details.Rstatus !== "Absent") {
              setShowDoneIncidentPopup(true);
            }                                              
            console.log("Saving dialogue data:", details);
        } catch (error: any) {
          console.error("Error saving data:", error.message);
          throw error;
        }
      };
    
      const handleRescheduleMeeting = async (date: string) => {
          const deliver = barangayList.find(user => user.id === deliverby);
          const mainDocRef = doc(db, "IncidentReports", id);
          await updateDoc(mainDocRef, {
            refailureExplainationMeetingDialogue: date,
            refailureLetterDialogueDeliverBy: `${deliver?.firstName} ${deliver?.lastName}`,
            refailureLetterDialogueDeliverDate: deliveryDate,
            refailureLetterDialogueDateFiled: new Date().toLocaleString(),
          })
      }
      /* add the notification */

    const confirmSubmit = async () => {
        setShowSubmitPopup(false);
      
        try {
          await saveDialogue(); 
      
          setPopupMessage("Dialogue Successfully Saved!");
          setShowPopup(true);
      
          setTimeout(() => {
            setShowPopup(false);
            // router.push(`/dashboard/IncidentModule/EditIncident?id=${docId}`);
          //   router.push(`/dashboard/IncidentModule/Department?id=${department}`);
          }, 3000);


        } catch (error) {
          console.error("Error during confirmation submit:", error);
          setPopupErrorMessage("Error saving dialogue. Please try again.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
        }
      };

    const router = useRouter();

    const handleBack = () => {
        router.back();
      };

      const HandleEditDoc = async () => {

        if (!docId) return;
        const docRef = doc(db, "IncidentReports", docId);
        const data = {
            ...toUpdate
        }
        console.log("Data to update:", data);

        await updateDoc(docRef, data);
    }
    

    const confirmSubmitB = async () => {
        setShowSubmitPopupB(false);

        try {
          await HandleEditDoc(); // ✅ Only update when Yes is clicked

          setPopupMessage("Incident Successfully Updated!");
          setShowPopup(true);

          setTimeout(() => {
            setShowPopup(false);
            router.push(`/dashboard/IncidentModule/Department?id=${department}`);
          }, 3000);
        } catch (error) {
          console.error("Error during confirmation submit:", error);
          setPopupErrorMessage("Error updating incident. Please try again.");
          setShowErrorPopup(true);
          setTimeout(() => setShowErrorPopup(false), 3000);
        }
    };
    const [activeSection, setActiveSection] = useState("meeting");
    const [toUpdate, setToUpdate] = useState<any>(null);

    const [showSubmitPopupB, setShowSubmitPopupB] = useState(false);
    const [showDoneIncidentPopup, setShowDoneIncidentPopup] = useState(false);
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
                      if(department !== "Lupon"){
            router.push(`/dashboard/IncidentModule/Department?id=${department}`);
            }
            else{
              setShowSubmitPopupB(true);
            }
          }, 3000);

        }
    }
    
    return (
        <>
            
        
            <div className="edit-incident-main-content-dialogue-hearing">
              <form onSubmit={handleSaveClick} className="dialogue-hearing-container">
                <div className="edit-incident-main-section1">
                    <div className="edit-incident-main-section1-left">
                        <button type="button" onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Dialogue Section  </h1>
                    </div>

                    <div className="action-btn-section">  
                        {!existingData && (
                        <button type="submit" className="action-view-edit">
                            <p>Save</p>
                        </button>
                        )}
                    </div>
                    
                </div>

                <div className="edit-incident-header-body-dialogue">
                    <div className="dialogue-header-body-top-section">
                        <div className="edit-incident-info-toggle-wrapper">
                            {["meeting", "minutes" ].map((section) => (
                                <button
                                key={section}
                                type="button"
                                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                                {section === "meeting" && "Meeting Information"}
                                {section === "minutes" && "Minutes Information"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="dialogue-header-body-bottom-section">
                        <div className="dialogue-info-main-container">
                            <div className="dialogue-info-container-scrollable">
                                <div className="edit-incident-info-main-content-dialogue">
                                    {activeSection === "meeting" && (
                                        <>
                                            <div className="edit-incident-dialoguesection-content">
                                                <div className="edit-incident-content-dialogue-leftsection">
                                                    <div className="edit-incident-content-left-side">
                                                        <div className="edit-incident-fields-section">
                                                            <p>Complainant's Name</p>
                                                            <input 
                                                                type="text" 
                                                                className="edit-incident-input-field" 
                                                                name="complainant.fname"
                                                                id="complainant.fname"
                                                                value={complainantName}
                                                                disabled
                                                            />
                                                        </div>

                                                        <div className="checkbox-container-dialogue">
                                                            <label className="custom-checkbox-label">
                                                                <input
                                                                    type="checkbox"
                                                                    name="Cstatus"
                                                                    disabled={existingData}
                                                                    checked={details.Cstatus === "Present"}
                                                                    onChange={(e) =>
                                                                    setDetails((prev: any) => ({
                                                                        ...prev,
                                                                        Cstatus: e.target.checked ? "Present" : "Absent"
                                                                    }))
                                                                    }
                                                                />
                                                                <span className="checkmark"></span>
                                                                Present
                                                            </label>
                                                        </div>


                                                        <div className="edit-incident-fields-section">
                                                            <p>Date and Time</p>
                                                            <input 
                                                                type="datetime-local"  
                                                                className="edit-incident-input-field" 
                                                                name="DateTimeOfMeeting"
                                                                id="DateTimeOfMeeting"
                                                                value={dialogueLetterData?.DateTimeOfMeeting||""}
                                                                disabled
                                                            />

                                                            
                                                        </div>
                                                    </div>

                                                    <div className="edit-incident-content-right-side">
                                                        <div className="edit-incident-fields-section">
                                                            <p>Respondent's Name</p>
                                                            <input 
                                                                type="text" 
                                                                className="edit-incident-input-field" 
                                                                name="respondent.fname"
                                                                id="respondent.fname"
                                                                value={respondentName}
                                                                disabled
                                                            />

                                                            
                                                        </div>

                                                        <div className="checkbox-container-dialogue">
                                                            <label className="custom-checkbox-label">
                                                                <input
                                                                    type="checkbox"
                                                                    name="Rstatus"
                                                                    disabled={existingData}
                                                                    checked={details.Rstatus === "Present"}
                                                                    onChange={(e) =>
                                                                    setDetails((prev: any) => ({
                                                                        ...prev,
                                                                        Rstatus: e.target.checked ? "Present" : "Absent"
                                                                    }))
                                                                    }
                                                                />
                                                                <span className="checkmark"></span>
                                                                Present
                                                            </label>
                                                        </div>


                                                        

                                                        <div className="edit-incident-fields-section">
                                                            <p>Hearing Officer</p>
                                                            <input 
                                                                type="text" 
                                                                className="edit-incident-input-field" 
                                                                name="HearingOfficer"
                                                                id="HearingOfficer"
                                                                value={details.HearingOfficer||""}
                                                                onChange={handleChange}
                                                                disabled
                                                            />

                                                            
                                                        </div>
                                                    </div>
                                                </div> 
                                                <div className="edit-incident-content-dialogue-rightsection-update">
                                                    <div className="view-incident-dialogue-remarks-container-update">
                                                        <div className="box-container-outer-remarks-dialogue-update">
                                                            <div className="title-remarks-dialogue-update">
                                                                Remarks
                                                            </div>
                                                         {/*<div className="box-container-remarks-dialogue">*/}   
                                                             <div className={`box-container-remarks-dialogue-update ${invalidFields.includes("remarks") ? "input-error" : ""}`}>
                                                                <span className="required-asterisk-incident-update">*</span>    
                                                                <textarea 
                                                                    className="remarks-input-field-dialogue-update" 
                                                                    name="remarks" 
                                                                    id="remarks"
                                                                    value={details.remarks||""}
                                                                    onChange={handleChange}
                                                                    placeholder="Enter Remarks" 
                                                                    onFocus={existingData || usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                                                    required={!existingData|| usersAbsent() ? false : true}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeSection === "minutes" && (
                                        <>
                                            <div className="edit-incident-dialoguesection-content">
                                                <div className="edit-incident-dialoguesection-minutes-content">
                                                    <div className="minutes-content-topsection">
                                                        <div className="edit-incident-content-left-side">

                                                            <div className="view-incident-dialogue-partyA-container">
                                                                <div className="box-container-outer-partyA-dialogue">
                                                                    <div className="title-remarks-dialogue">
                                                                        Party A
                                                                    </div>
                                                                   {/* <div className="box-container-partyA-dialogue">*/} 
                                                                         <div className={`box-container-partyA-dialogue ${invalidFields.includes("partyA") ? "input-error" : ""}`}>
                                                                        <span className="required-asterisk-incident">*</span>
                                                                        <textarea 
                                                                            className="remarks-input-field-partyA" 
                                                                            placeholder="Enter Party A" 
                                                                            name="partyA"
                                                                            id="partyA"
                                                                            value={details.partyA||""}
                                                                            onChange={handleChange}
                                                                            onFocus={existingData || usersAbsent()? (e => e.target.blur()):(() => {}) }
                                                                            required={!existingData || usersAbsent() ? false : true}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                                    
                                                        </div>

                                                        <div className="edit-incident-content-right-side">
                                                            <div className="view-incident-dialogue-partyA-container">
                                                                <div className="box-container-outer-partyA-dialogue">
                                                                    <div className="title-remarks-dialogue">
                                                                        Party B
                                                                    </div>
                                                                    <div className={`box-container-partyA-dialogue ${invalidFields.includes("partyB") ? "input-error" : ""}`}>
                                                                        <span className="required-asterisk-incident">*</span>
                                                                        <textarea 
                                                                            className="remarks-input-field-partyA" 
                                                                            placeholder="Enter Party B"
                                                                            id="partyB"
                                                                            name="partyB"
                                                                            value={details.partyB||""}
                                                                            onChange={handleChange}
                                                                            onFocus={existingData || usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                                                            required={!existingData || usersAbsent() ? false : true}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                                
                                                        </div>

                                                    </div>
                                                    <div className="minutes-content-bottomsection">
                                                        <div className="view-incident-dialogue-partyA-container">
                                                                <div className="box-container-outer-partyA-dialogue">
                                                                    <div className="title-remarks-dialogue">
                                                                        Minutes of Dialogue
                                                                    </div>
                                                                   <div className={`box-container-partyA-dialogue ${invalidFields.includes("minutesOfDialogue") ? "input-error" : ""}`}>
                                                                        <span className="required-asterisk-incident">*</span>
                                                                        <textarea 
                                                                            className="remarks-input-field-partyA" 
                                                                            placeholder="Enter Minutes of Dialogue"
                                                                            name="minutesOfDialogue"
                                                                            id="minutesOfDialogue"
                                                                            value={details.minutesOfDialogue||""}
                                                                            onChange={handleChange}
                                                                            onFocus={existingData || usersAbsent() ? (e => e.target.blur()) : (() => {})}
                                                                            required={!existingData || usersAbsent() ? false : true}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>


             </form>   

            </div>
                




            {/* OLD CODE */}
            
            {/*
            <div className="dialouge-meeting-section-edit">    
                <div className="title-section-edit">
                  <button type="button" className={showDialogueContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={handleToggleClick}></button>
                  <h1>Dialogue Meeting</h1>
                {(!isDialogue && <span className="text-red-500 ml-4">In order to create a Dialogue Meeting, you must generate a Dialogue Letter first</span>)}
                </div>
          
                <hr/>
          
            {(isDialogue) && (
                    <>
                        <form onSubmit={handleSubmit}>
                          <div className="section-2-dialouge-edit">
                            <p>Dialogue Meeting Information</p>
                            <div className="bars-edit">
                                <div className="input-group-edit">
                                        <p>Dialogue Meeting Date and Time</p>
                                        <input type="datetime-local" 
                                        className="search-bar-edit" 
                                        name="DateTimeOfMeeting"
                                        id="DateTimeOfMeeting"
                                        value={dialogueLetterData?.DateTimeOfMeeting||""}
                                        disabled
                                    />
                                </div>
                            </div>    
                              <p>Complainant's Name</p>
                              <select className="input-group-edit" disabled={existingData} 
                                name="Cstatus"
                                id="Cstatus"
                                value={details.Cstatus}
                                onChange={handleChange}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                              </select>
                              <div className="input-group-edit">
                                  <div className="input-group-edit">
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="complainant.fname"
                                        id="complainant.fname"
                                        value={complainantName}
                                        disabled
                                        />
                                  </div>
                                  
                              </div>
                          </div>

                          <div className="section-2-dialouge-edit">
                              <p>Respondent's Name</p>
                              <select className="input-group-edit" disabled={existingData}
                                name="Rstatus"
                                id="Rstatus"
                                value={details.Rstatus}
                                onChange={handleChange}
                                >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                              <div className="bars-edit">
                                <div className="input-group-edit">
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="respondent.fname"
                                        id="respondent.fname"
                                        value={respondentName}
                                        disabled/>
                                  </div>
                                  
                              </div>
                          </div>

                          <div className="section-3-dialouge-edit">
                              <div className="fields-section-edit">
                                    <p>Minutes of Dialogue</p>
                                    <textarea className="description-edit resize-none" 
                                    placeholder="Enter Minutes of Dialogue" 
                                    name="minutesOfDialogue"
                                    id="minutesOfDialogue"
                                    value={details.minutesOfDialogue||""}
                                    onChange={handleChange}
                                    onFocus={existingData || usersAbsent() ? (e => e.target.blur()) : (() => {})}
                                    required={!existingData || usersAbsent() ? false : true}
                                    rows={13}/>
                              </div>
                          </div>
                
                          <div className="section-4-dialouge-edit">
                              <div className="fields-section-edit">
                                    <p>Party A</p>
                                    <textarea className="description-edit resize-none" 
                                    placeholder="Enter Party A" 
                                    name="partyA"
                                    id="partyA"
                                    value={details.partyA||""}
                                    onChange={handleChange}
                                    onFocus={existingData || usersAbsent()? (e => e.target.blur()):(() => {}) }
                                    required={!existingData || usersAbsent() ? false : true}
                                    rows={10}/>
                              </div>
                              <div className="fields-section-edit">
                                    <p>Party B</p>
                                    <textarea className="description-edit resize-none" 
                                    placeholder="Enter Party"
                                    id="partyB"
                                    name="partyB"
                                    value={details.partyB||""}
                                    onChange={handleChange}
                                    onFocus={existingData || usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                    required={!existingData || usersAbsent() ? false : true}
                                    rows={10}/>
                              </div>

                          </div>
                          <div className="section-4-dialouge-edit">
                              <div className="fields-section-edit">
                                    <p>Remarks</p>
                                    <textarea className="description-edit resize-none" 
                                    name="remarks"
                                    id="remarks"
                                    value={details.remarks||""}
                                    onChange={handleChange}
                                    placeholder="Enter Remarks" 
                                    onFocus={existingData || usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                    required={!existingData|| usersAbsent() ? false : true}
                                    rows={10}/>
                              </div>
                              <div className="fields-section-edit">
                                    <p>Hearing Officer</p>
                                    <input type="text" 
                                    name="HearingOfficer"
                                    id="HearingOfficer"
                                    value={details.HearingOfficer||""}
                                    onChange={handleChange}
                                    className="search-bar-edit" 
                                    disabled/>

                                  
                              </div>

                          </div>
                          <div className="flex justify-center items-center mt-10">
                                {!existingData && (<button type="submit" className="action-view-edit">Save</button>)}
                                
                                 
                          </div>
                        </form>
                    </>
            )}
            </div>

            */}
            



        {showSubmitPopup && (
            <div className="confirmation-popup-overlay-add">
                <div className="confirmation-popup-add">
                    <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                    <p>Are you sure you want to submit?</p>
                    <div className="yesno-container-add">
                        <button
                        onClick={() => setShowSubmitPopup(false)}
                        className="no-button-add"
                        >
                        No
                        </button>
                        <button onClick={confirmSubmit}
                         className="yes-button-add">
                        Yes
                        </button>
                    </div>

                </div>
            </div>
            )}

        {showDoneIncidentPopup && (
          <div className="confirmation-popup-overlay-add">
            <div className="confirmation-popup-add">
              <img src="/Images/question.png" alt="icon alert" className="successful-icon-popup" />
              <p>Has the incident case been settled?</p>
              <div className="yesno-container-add">
                
                <button
                  onClick={() => {
                    setShowDoneIncidentPopup(false);
                     setPopupMessage("Dialogue Successfully Saved!");
                     setShowPopup(true);
                    setTimeout(() => {
                       setShowPopup(false);
                      router.push(`/dashboard/IncidentModule/Department?id=${department}`);
                    }, 2000); 
                  }}
                  className="no-button-add"
                >
                  No
                </button>
                <button  
                  onClick={() => {
                    setShowDoneIncidentPopup(false);
                    setPopupMessage("Incident case has been Settled.");
                    setShowPopup(true);
                    setTimeout(() => setShowPopup(false), 3000);
                    handleClosingCase(true);
                  }}
                  className="yes-button-add"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>    
        )}


        
          {showSubmitPopupB && (
            <div className="confirmation-popup-overlay-add-section">
              <div className="confirmation-popup-add-section">
                <>
                  <p className="popup-title-section">How was the case settled?</p>
                  <div className="settlement-options-modern-section">
                    <label className={`settlement-card-section ${toUpdate?.isMediation ? "selected-section" : ""}`}>
                      <input
                        type="radio"
                        name="settlementMethod"
                        checked={toUpdate?.isMediation === true}
                        onChange={() =>
                          setToUpdate((prev: any) => ({
                            ...prev,
                            isMediation: true,
                            isConciliation: false,
                            isArbitration: false,
                          }))
                        }
                      />
                      <span>Mediation</span>
                    </label>
                    <label className={`settlement-card-section ${toUpdate?.isConciliation ? "selected-section" : ""}`}>
                      <input
                        type="radio"
                        name="settlementMethod"
                        checked={toUpdate?.isConciliation === true}
                        onChange={() =>
                          setToUpdate((prev: any) => ({
                            ...prev,
                            isMediation: false,
                            isConciliation: true,
                            isArbitration: false,
                          }))
                        }
                      />
                      <span>Conciliation</span>
                    </label>
                    <label className={`settlement-card-section ${toUpdate?.isArbitration ? "selected-section" : ""}`}>
                      <input
                        type="radio"
                        name="settlementMethod"
                        checked={toUpdate?.isArbitration === true}
                        onChange={() =>
                          setToUpdate((prev: any) => ({
                            ...prev,
                            isMediation: false,
                            isConciliation: false,
                            isArbitration: true,
                          }))
                        }
                      />
                      <span>Arbitration</span>
                    </label>
                  </div>

                  <div className="yesno-container-add-section">
                    <button onClick={confirmSubmitB} className="yes-button-add-section">
                      Submit
                    </button>
                  </div>
                </>
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

        {showSetRefailureMeetingPopup && (
          <div className="confirmation-popup-overlay-add">
            <div className="confirmation-popup-add">
              <img src="/Images/question.png" alt="icon alert" className="successful-icon-popup" />
              <p>Set meeting to explain failure to appear</p>
              <div className="yesno-container-add">
                <input
                  className="border p-2 rounded w-full"
                  name="resheduleDateTime"
                  id="resheduleDateTime"
                  value={resheduleDateTime}
                  onChange={(e) => setResheduleDateTime(e.target.value)}
                  type="date"
                  min={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    // Format as yyyy-MM-dd for date input
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    const yyyy = tomorrow.getFullYear();
                    const mm = pad(tomorrow.getMonth() + 1);
                    const dd = pad(tomorrow.getDate());
                    return `${yyyy}-${mm}-${dd}`;
                  })()}
                  required
                />
              </div>
              <p>When to deliver?</p>
              <div className="yesno-container-add">
                <input
                  className="border p-2 rounded w-full"
                  name="deliveryDate"
                  id="deliveryDate"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  type="date"
                  min={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate());
                    // Format as yyyy-MM-dd for date input
                    const pad = (n: number) => n.toString().padStart(2, "0");
                    const yyyy = tomorrow.getFullYear();
                    const mm = pad(tomorrow.getMonth() + 1);
                    const dd = pad(tomorrow.getDate());
                    return `${yyyy}-${mm}-${dd}`;
                  })()}
                  required
                />
              </div>
              <p>Deliver by?</p>
              <div className="yesno-container-add">
                <select
                  className="border p-2 rounded w-full "
                  name="deliverBy"
                  id="deliverBy"
                  value={deliverby}
                  onChange={(e) => setDeliveryBy(e.target.value)}
                  required
                >
                  <option value="" disabled selected>Select Deliver By</option>
                  {barangayList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <p>Date Filed</p>
              <div className="yesno-container-add">
                <input
                  className="border p-2 rounded w-full"
                  name="dateFiled"
                  id="dateFiled"
                  value={new Date().toLocaleString()}
                  type="date"
                />
              </div>
              <button
                  onClick={() => {
                    if (!resheduleDateTime) {
                      alert("Please select a date before submitting.");
                      return;
                    }
                    handleRescheduleMeeting(resheduleDateTime);
                    setShowSetRefailureMeetingPopup(false);
                    setPopupMessage("Successfully Set Meeting to Explain Failure to Appear");
                    setShowPopup(true);
                    setTimeout(() => {
                      setShowPopup(false);
                      //router.push(`/dashboard/IncidentModule/Department?id=${department}`);
                    }, 3000);
                    handleLetterOfFailure(id, resheduleDateTime, complainantName, respondentName, "dialogue");
                  }}
                  className="yes-button-add"
                  disabled={!resheduleDateTime}
                >
                  Submit
                </button>
            </div>  
          </div>
        )}


        </>
    )
}

export default dialogueForm;