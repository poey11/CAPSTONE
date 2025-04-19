
import { db } from "@/app/db/firebase";
import {getLocalDateTimeString} from "@/app/helpers/helpers";
import { doc, onSnapshot,collection, setDoc } from "firebase/firestore";
import { useState,useEffect } from "react";
import { useSession } from "next-auth/react";



interface HearingFormProps {
    id: string;
}
type DialogueDetails = {
    minutesOfDialogue: string;
    remarks: string;
    partyA: string;
    partyB: string;
    firstHearingOfficer: string;
    secondHearingOfficer: string;
    thirdHearingOfficer: string;
    dialogueMeetingDateTime: string;
    complainant:{
       firstName: string;
       middleName: string;
        lastName: string;
    },
    respondent:{
        firstName: string;
        middleName: string;
         lastName: string;
    },
  };
  

const dialogueForm: React.FC<HearingFormProps> = ({id}) => {
    const user = useSession().data?.user;
    const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden
    const [existingData, setExistingData] = useState(false);
    const [isDialogue, setIsDialogue] = useState(false);
    const today = getLocalDateTimeString(new Date());
    const [details, setDetails] = useState<DialogueDetails>({
        complainant:{
            firstName: "",
            middleName: "",
             lastName:"",
        },
        respondent:{
            firstName: "",
            middleName: "",
             lastName:"",
        },
        firstHearingOfficer: "",
        secondHearingOfficer: "",
        thirdHearingOfficer: "",
        minutesOfDialogue: "",
        remarks: "",
        partyA: "",
        partyB: "",
        dialogueMeetingDateTime: "",// add date validation
    });

    useEffect(() => {
        setDetails(prevDetails => ({
            ...prevDetails,
            firstHearingOfficer: user?.fullName || ""
        }));
            
    },[user])
    useEffect(() => {
        if(!id) return;
        const docRef = doc(db, "IncidentReports", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
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

    const handleToggleClick = () => {
        if(!isDialogue) return; 
        setShowDialogueContent(prevState => !prevState);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const subColRef = collection(db, "IncidentReports", id, "DialogueMeeting");
            const docRef = doc(subColRef, id);
            await setDoc(docRef, {
                complainant: {
                    firstName: details.complainant.firstName,
                    middleName: details.complainant.middleName,
                    lastName: details.complainant.lastName,
                   
                },
                respondent: {
                    firstName: details.respondent.firstName,
                    middleName: details.respondent.middleName,
                    lastName: details.respondent.lastName,
                },
                minutesOfDialogue: details.minutesOfDialogue,
                remarks: details.remarks,
                partyA: details.partyA,
                partyB: details.partyB,
                firstHearingOfficer: details.firstHearingOfficer,
                secondHearingOfficer: details.secondHearingOfficer,
                thirdHearingOfficer: details.thirdHearingOfficer,
                dialogueMeetingDateTime: details.dialogueMeetingDateTime,
                filled:true,
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (error:any) {
            console.error("Error saving data:", error.message);
        }
        console.log(details);
    }
    return (
        <>
            <div className="dialouge-meeting-section-edit">    
                <div className="title-section-edit">
                  <button type="button" className={showDialogueContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={handleToggleClick}></button>
                  <h1>Dialogue Meeting</h1>
                {(!isDialogue && <span className="text-red-500 ml-4">In order to create a Dialogue Meeting, you must generate a Dialogue Letter first</span>)}
                </div>
          
            <hr/>
          
            {(showDialogueContent && isDialogue) && (
                    <>
                        <form onSubmit={handleSubmit}>
                          <div className="section-2-dialouge-edit">
                            <p>Dialogue Meeting Information</p>
                            <div className="bars-edit">
                                <div className="input-group-edit">
                                        <p>Dialogue Meeting Date and Time</p>
                                        <input type="datetime-local" 
                                        className="search-bar-edit" 
                                        name="dialogueMeetingDateTime"
                                        id="dialogueMeetingDateTime"
                                        value={details.dialogueMeetingDateTime||""}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        onChange={handleChange}
                                        max={today} 
                                        onKeyDown={(e => e.preventDefault())}
                                    />
                                </div>
                            </div>    
                              <p>Complainant's Information</p>
                              <div className="bars-edit">
                                  <div className="input-group-edit">
                                        <p>First Name</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="complainant.firstName"
                                        id="complainant.firstName"
                                        value={details.complainant.firstName||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter First Name" />
                                  </div>
                                  <div className="input-group-edit">
                                        <p>Middle Name</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="complainant.middleName"
                                        id="complainant.middleName"
                                        value={details.complainant.middleName||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter Middle Name"
                                        />
                                  </div>
                                  <div className="input-group-edit">
                                        <p>Last Name</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="complainant.lastName"
                                        id="complainant.lastName"
                                        value={details.complainant.lastName||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter Last Name"
                                        />
                                  </div>
                              </div>
                          </div>

                          <div className="section-2-dialouge-edit">
                              <p>Respondents' Information</p>
                              <div className="bars-edit">
                                <div className="input-group-edit">
                                        <p>First Name</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="respondent.firstName"
                                        id="respondent.firstName"
                                        value={details.respondent.firstName||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter First Name" />
                                  </div>
                                  <div className="input-group-edit">
                                        <p>Middle Name</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="respondent.middleName"
                                        id="respondent.middleName"
                                        value={details.respondent.middleName||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter Middle Name"
                                        />
                                  </div>
                                  <div className="input-group-edit">
                                        <p>Last Name</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="respondent.lastName"
                                        id="respondent.lastName"
                                        value={details.respondent.lastName||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter Last Name"
                                        />
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
                                    onFocus={existingData ? (e => e.target.blur()):(() => {}) }
                                    required={!existingData}

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
                                    onFocus={existingData ? (e => e.target.blur()):(() => {}) }
                                    required={!existingData}
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
                                    onFocus={existingData ? (e => e.target.blur()):(() => {}) }
                                    required={!existingData}
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
                                    onFocus={existingData ? (e => e.target.blur()):(() => {}) }
                                    required={!existingData}
                                    rows={10}/>
                              </div>
                              <div className="fields-section-edit">
                                    <p>First Hearing Officer</p>
                                    <input type="text" 
                                    name="firstHearingOfficer"
                                    id="firstHearingOfficer"
                                    value={details.firstHearingOfficer||""}
                                    onChange={handleChange}
                                    className="search-bar-edit" 
                                    disabled/>

                                    <p>Second Hearing Officer</p>
                                    <input type="text" 
                                    name="secondHearingOfficer"
                                    id="secondHearingOfficer"
                                    value={details.secondHearingOfficer||""}
                                    onChange={handleChange}
                                    className="search-bar-edit" 
                                    disabled={existingData ? true : false}
                                    placeholder="Enter Hearing Officer"/>

                                    <p>Third Hearing Officer</p>
                                    <input type="text" 
                                    name="thirdHearingOfficer"
                                    id="thirdHearingOfficer"
                                    value={details.thirdHearingOfficer||""}
                                    onChange={handleChange}
                                    className="search-bar-edit" 
                                    disabled={existingData ? true : false}
                                    placeholder="Enter Hearing Officer"/>
                              </div>

                          </div>
                          <div className="flex justify-center items-center mt-10">
                                {!existingData && (<button type="submit" className="action-view-edit">Save</button>)}
                                
                                 
                          </div>
                        </form>
                    </>
            )}
            </div>
        </>
    )
}

export default dialogueForm;