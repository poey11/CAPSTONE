import {  useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot,updateDoc,query, orderBy, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {getLocalDateTimeString} from "@/app/helpers/helpers";
import { fill } from "pdf-lib";

interface HearingFormProps {
    index: number;
    id: string;
    generatedHearingSummons: number;
}

interface HearingDetails {
    nosHearing: number;
    nos: string;
    minutesOfCaseProceedings: string;
    remarks: string;
    partyA: string;
    partyB: string;
    firstHearingOfficer: string;
    secondHearingOfficer: string;
    thirdHearingOfficer: string;
    filled: boolean;
    hearingMeetingDateTime: string;
    Cstatus: string;
    Rstatus:string;
}


const HearingForm: React.FC<HearingFormProps> = ({ index, id, generatedHearingSummons, }) => {
    const user = useSession().data?.user;
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const [hearingDetails, setHearingDetails] = useState<HearingDetails[]>([]);

    let nos ="";
    switch (index) {
        case 0:
            nos = "First";
            break;
        case 1:
            nos = "Second";
            break;
        case 2:
            nos = "Third";
            break;
        default:
            break;
    }
    const [dialogue, setIsDialogue] = useState(false);
    const [details, setDetails] = useState<HearingDetails>({
        nosHearing: index,
        nos: nos,
        minutesOfCaseProceedings: "",
        remarks: "",
        partyA: "",
        partyB: "",
        firstHearingOfficer:  "",
        secondHearingOfficer: "",
        thirdHearingOfficer: "",
        filled:false,
        hearingMeetingDateTime: "",
        Cstatus: "",
        Rstatus: "",
    }); 
    
    const [summonLetterData, setSummonLetterData] = useState<any[]>([]);
    useEffect(()=>{
        if(!id) return;
        const colRef = query(collection(db, "IncidentReports", id, "GeneratedLetters"), where("letterType", "==", "summon"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => doc.data());
            setSummonLetterData(fetchedData);
        });
        return () => unsubscribe();
    },[])
 

    useEffect(() => { 
        const docRef = query(collection(db, "IncidentReports", id, "SummonsMeeting"), orderBy("nosHearing", "asc"));
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
          const fetchedDetails = snapshot.docs.map(doc => doc.data());
          setHearingDetails(fetchedDetails as HearingDetails[]);
      
          setDetails(prevDetails => ({
            ...prevDetails,
            firstHearingOfficer: (fetchedDetails[0]?.firstHearingOfficer) || user?.fullName || "",
            secondHearingOfficer: (fetchedDetails[1]?.secondHearingOfficer) || user?.fullName || "",
            thirdHearingOfficer: (fetchedDetails[2]?.thirdHearingOfficer) || user?.fullName || "",
          }));
        });
      
        return () => unsubscribe();
      }, [id, user]);
      



      

      useEffect(() => { 
        const docRef = doc(db, "IncidentReports", id, "DialogueMeeting", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setIsDialogue(data.filled || false); 
            } else {
                console.log("No such document!");
            }
        });
        return () => unsubscribe(); 
    }, [])

    const [data, setData] = useState<any>({});  
    useEffect(() => {
        const docRef = doc(db, "IncidentReports", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setData(data); 
            } else {
                console.log("No such document!");
            }
        });
        return () => unsubscribe();

    },[])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement| HTMLSelectElement> ) => {
        const { name, value } = e.target;
        const keys = name.split(".");
    
        setDetails(prevDetails => {
            if (keys.length === 2) {
                const [parentKey, childKey] = keys;
    
                // Ensure the parent is a valid object
                const parent = prevDetails[parentKey as keyof HearingDetails];
    
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
    
            // Fallback for top-level keys
            return {
                ...prevDetails,
                [name]: value,
            };
        });
    };
    
    const searchParam = useSearchParams();
        const docId = searchParam.get("id");

    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [invalidFields, setInvalidFields] = useState<string[]>([]);
    const prevFilledHearing = hearingDetails[index - 1]?.filled || false;

    {/*
    const handleToggleClick = () => {
        if(index === 0 && generatedHearingSummons === 0 || !dialogue) return;
        if( index !== 0 && (index >= generatedHearingSummons||!prevFilledHearing)) return;
        
        
        setShowHearingContent(prev => !prev);
    };*/}

    const handleToggleClick = () => {
        setShowHearingContent(prev => !prev);
    };    
   

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const docRef = collection(db, "IncidentReports", id, "SummonsMeeting");
            await addDoc(docRef, {
                ...details,
                nosHearing: index,
                nos: nos,
                filled: true
            });
            
            const UpdateRef = doc(db, "IncidentReports", id,);
            await updateDoc(UpdateRef, {
            ...(data?.hearing !=3   && { hearing: data?.hearing + 1 })
            });
        } catch (error:any) {
            console.error("Error saving data:", error.message);
        }
    }


     // New handler to show confirmation popup on Save click
     const handleSaveClick = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const requiredFields: (keyof HearingDetails)[] = [
        "remarks",
        "partyA",
        "partyB",
        "minutesOfCaseProceedings",
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
    
    const saveSummon = async () => {
        try {
            const docRef = collection(db, "IncidentReports", id, "SummonsMeeting");
            await addDoc(docRef, {
                ...details,
                nosHearing: index,
                nos: nos,
                filled: true
            });
            
        } catch (error:any) {
            console.error("Error saving data:", error.message);
        }
          };

          const confirmSubmit = async () => {
            setShowSubmitPopup(false);
          
            try {
              await saveSummon(); 
          
              setPopupMessage("Summon Successfully Saved!");
              setShowPopup(true);
          
              setTimeout(() => {
                setShowPopup(false);
              }, 3000);
            } catch (error) {
              console.error("Error during confirmation submit:", error);
              setPopupErrorMessage("Error saving summon. Please try again.");
              setShowErrorPopup(true);
              setTimeout(() => setShowErrorPopup(false), 3000);
            }
          };


    const usersAbsent = () => details.Cstatus === "Absent" || details.Rstatus === "Absent";

    useEffect(() => {
        const updatedDetails = { ...details };
    
        let absentMinutes: string[] = [];
        let absentRemarks: string[] = [];
    
        // Initialize partyA and partyB as empty strings
        let partyA = "";
        let partyB = "";
    
        // Handle Complainant status
        if (details.Cstatus === "Absent") {
            partyA = "Complainant Absent.";
            partyB = "Respondent Present.";
            absentMinutes.push("Complainant Absent.");
            absentRemarks.push("Complainant Absent.");
        } else {

        }
    
        // Handle Respondent status
        if (details.Rstatus === "Absent") {
            partyB = "Respondent Absent.";
            partyA = "Complainant Present";  // If Respondent is absent, complainant is present
            absentMinutes.push("Respondent Absent.");
            absentRemarks.push("Respondent Absent.");
        } else {

        }
    
        updatedDetails.partyA = partyA;
        updatedDetails.partyB = partyB;
    
        // If any user is marked absent, overwrite minutes and remarks with absent messages
        if (absentMinutes.length > 0) {
            updatedDetails.minutesOfCaseProceedings = absentMinutes.join(" ");
            updatedDetails.remarks = absentRemarks.join(" ");
        } else {
            // If both are present, clear minutes and remarks
            updatedDetails.minutesOfCaseProceedings = "";
            updatedDetails.remarks = "";
        }
    
        setDetails(updatedDetails);
    }, [details.Cstatus, details.Rstatus]);
    

    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

      const [activeSection, setActiveSection] = useState("meeting");

    return (
        <>
            
   <form onSubmit={handleSaveClick} className="hearing-main-section">

       <div className="dialogue-header-body-top-section">
                        <div className="hearing-incident-info-toggle-wrapper">
                            {["meeting", "minutes" ].map((section) => (
                                <button
                                key={section}
                                type="button"
                                className={`info-toggle-btn-hearing ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                                {section === "meeting" && "Meeting Information"}
                                {section === "minutes" && "Minutes Information"}
                                </button>
                            ))}
                        </div>
                    </div>
 
        {activeSection === "meeting" && (
        <>

            <div className="edit-incident-dialoguesection-content">
            
                <div className="edit-incident-content-dialogue-leftsection">
                    <div className="edit-incident-content-left-side">
                        <div className="edit-incident-fields-section">
                             <p>Complainant's Name</p>
                              <input type="text" 
                                className="edit-incident-input-field" 
                                value={`${data?.complainant?.fname || ""} ${data?.complainant?.lname || ""}`}
                                disabled/>
                        </div>

                        <div className="checkbox-container-dialogue">
                          <label className="custom-checkbox-label">
                            <input
                                type="checkbox"
                                name="Cstatus"
                                disabled={hearingDetails[index]?.filled}
                                checked={details.Cstatus === "" || details.Cstatus === "Present"}
                                onChange={(e) =>
                                setDetails((prev: any) => ({
                                    ...prev,
                                    Cstatus: e.target.checked ? "" : "Absent"
                                }))
                                }
                            />
                            <span className="checkmark"></span>
                            Present
                            </label>

                        </div>

                        <div className="edit-incident-fields-section">
                            <p>Date and Time</p>
                            
                              <input type="datetime-local" 
                                className="edit-incident-input-field" 
                                name="hearingMeetingDateTime"
                                id="hearingMeetingDateTime"
                                value={summonLetterData[index]?.DateTimeOfMeeting||""}
                                disabled
                            />

                        </div>


                    </div>

                    <div className="edit-incident-content-right-side">
                        <div className="edit-incident-fields-section">
                            <p>Respondent's Name</p>
                              <input type="text" 
                                className="edit-incident-input-field" 
                                value={`${data?.respondent?.fname || ""} ${data?.respondent?.lname || ""}`}
                                disabled
                                />

                        </div>

                          <div className="checkbox-container-dialogue">
                            <label className="custom-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="Rstatus"
                                    disabled={hearingDetails[index]?.filled}
                                    checked={details.Rstatus === "" || details.Rstatus === "Present"}
                                    onChange={(e) =>
                                    setDetails((prev: any) => ({
                                        ...prev,
                                        Rstatus: e.target.checked ? "" : "Absent"
                                    }))
                                    }
                                />
                                <span className="checkmark"></span>
                                Present
                            </label>

                          
                         </div>

                        <div className="edit-incident-fields-section">
                                <p>
                                    {index === 0
                                    ? "First Hearing Officer"
                                    : index === 1
                                    ? "Second Hearing Officer"
                                    : "Third Hearing Officer"}
                                </p>
                                <input
                                    type="text"
                                    name={
                                    index === 0
                                        ? "firstHearingOfficer"
                                        : index === 1
                                        ? "secondHearingOfficer"
                                        : "thirdHearingOfficer"
                                    }
                                    id={
                                    index === 0
                                        ? "firstHearingOfficer"
                                        : index === 1
                                        ? "secondHearingOfficer"
                                        : "thirdHearingOfficer"
                                    }
                                    value={
                                    (index === 0
                                        ? details.firstHearingOfficer
                                        : index === 1
                                        ? details.secondHearingOfficer
                                        : details.thirdHearingOfficer) ||
                                    hearingDetails[index]?.[
                                        index === 0
                                        ? "firstHearingOfficer"
                                        : index === 1
                                        ? "secondHearingOfficer"
                                        : "thirdHearingOfficer"
                                    ] ||
                                    ""
                                    }
                                    onChange={handleChange}
                                    className="edit-incident-input-field"
                                    placeholder="Enter Hearing Officer"
                                    disabled={hearingDetails[index]?.filled || false}
                                />
                                </div>


                    </div>


                </div>

                <div className="edit-incident-content-dialogue-rightsection">
                    <div className="view-incident-dialogue-remarks-container">
                        <div className="box-container-outer-remarks-dialogue">
                            <div className="title-remarks-dialogue">
                                Remarks
                            </div>
                             <div className={`box-container-remarks-dialogue ${invalidFields.includes("remarks") ? "input-error" : ""}`}>
                                <span className="required-asterisk-incident">*</span>
                                 <textarea className="remarks-input-field-dialogue" 
                                    name="remarks"
                                    id="remarks"
                                    value={details.remarks||hearingDetails[index]?.remarks||""}
                                    onFocus={hearingDetails[index]?.filled||usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                    required={!hearingDetails[index]?.filled||usersAbsent() ? false : true}
                                    onChange={handleChange}
                                    placeholder="Enter Remarks" 
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

                                  <div className={`box-container-partyA-dialogue ${invalidFields.includes("partyA") ? "input-error" : ""}`}>
                                    <span className="required-asterisk-incident">*</span>
                                    <textarea className="remarks-input-field-partyA" 
                                    placeholder="Enter Party A" 
                                    name="partyA"
                                    id="partyA"
                                    value={details.partyA||hearingDetails[index]?.partyA||""}
                                    onChange={handleChange}
                                    rows={10}
                                    onFocus={hearingDetails[index]?.filled|| usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                    required={!hearingDetails[index]?.filled||usersAbsent() ? false : true}
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
                                           <textarea className="remarks-input-field-partyA" 
                                            placeholder="Enter Party"
                                            id="partyB"
                                            name="partyB"
                                            value={details.partyB||hearingDetails[index]?.partyB||""}
                                            onChange={handleChange}
                                            rows={10}
                                            onFocus={hearingDetails[index]?.filled|| usersAbsent()? (e => e.target.blur()):(() => {}) }
                                            required={!hearingDetails[index]?.filled|| usersAbsent() ? false : true}
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
                                    Minutes of Case Proceeedings
                                </div>

                                <div className={`box-container-partyA-dialogue ${invalidFields.includes("minutesOfCaseProceedings") ? "input-error" : ""}`}>
                                    <span className="required-asterisk-incident">*</span>
                                      <textarea className="remarks-input-field-partyA" 
                                    placeholder="Enter Minutes of Case Proceedings" 
                                    name="minutesOfCaseProceedings"
                                    id="minutesOfCaseProceedings"
                                    value={details.minutesOfCaseProceedings||hearingDetails[index]?.minutesOfCaseProceedings||""}
                                    onChange={handleChange}
                                    onFocus={hearingDetails[index]?.filled|| usersAbsent() ? (e => e.target.blur()):(() => {}) }
                                    required={!hearingDetails[index]?.filled|| usersAbsent()? false : true}
                                    rows={13}/>
            
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

                </>
            )}

            
                  <div className="flex justify-center items-center mt-10">
                        {!hearingDetails[index]?.filled && (<button type="submit" className="action-view-edit">Save</button>)}
                  </div>

               
            </form>
           
            
            
         {/*
            
                  <div className="section-2-dialouge-edit">
                  <p>Hearing  Information</p>
                
                    <p>Complainant's Name</p>
                    <select className="input-group-edit" disabled={hearingDetails[index]?.filled}
                    name="Cstatus"
                    id="Cstatus"
                    value={details.Cstatus||hearingDetails[index]?.Cstatus||""}
                    onChange={handleChange}
                    >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                     
                  </div>
                  <div className="section-2-dialouge-edit">
                      <p>Respondents' Name</p>
                      <select className="input-group-edit" disabled={hearingDetails[index]?.filled}
                        name="Rstatus"
                        id="Rstatus"
                        value={details.Rstatus||hearingDetails[index]?.Rstatus||""}
                        onChange={handleChange}
                        >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                      </select>

                  </div>
        
             
        
               
                  <div className="section-4-dialouge-edit">
                 
                      <div className="fields-section-edit">
                     
                            <p>Second Hearing Officer</p>
                            <input type="text" 
                            name="secondHearingOfficer"
                            id="secondHearingOfficer"
                            value={details.secondHearingOfficer||hearingDetails[index]?.secondHearingOfficer||""}
                            onChange={handleChange}
                            className="search-bar-edit" 
                            placeholder="Enter Hearing Officer"
                            disabled={hearingDetails[index]?.filled||false}
                            />

                            <p>Third Hearing Officer</p>
                            <input type="text" 
                            name="thirdHearingOfficer"
                            id="thirdHearingOfficer"
                            value={details.thirdHearingOfficer||hearingDetails[index]?.thirdHearingOfficer||""}
                            onChange={handleChange}
                            className="search-bar-edit" 
                            disabled={hearingDetails[index]?.filled||false}
                            placeholder="Enter Hearing Officer"
                            />
                      </div>

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
                        <button onClick={confirmSubmit} className="yes-button-add">
                        Yes
                        </button>
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

        </>
    )
}

export default HearingForm;