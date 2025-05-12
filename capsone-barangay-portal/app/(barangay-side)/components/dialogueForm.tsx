
import { db } from "@/app/db/firebase";
import {getLocalDateTimeString} from "@/app/helpers/helpers";
import { doc, onSnapshot,collection, setDoc } from "firebase/firestore";
import { useState,useEffect } from "react";
import { useSession } from "next-auth/react";




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
    dialogueMeetingDateTime: string;

    
  };
  

const dialogueForm: React.FC<DialogueFormProps> = ({id, complainantName, respondentName}) => {
    const user = useSession().data?.user;
    const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden
    const [existingData, setExistingData] = useState(false);
    const [isDialogue, setIsDialogue] = useState(false);
    const today = getLocalDateTimeString(new Date());
    const [dialogueLetterData, setDialogueLetterData] = useState<any>(null);

    const [details, setDetails] = useState<DialogueDetails>({
        HearingOfficer: "",
        minutesOfDialogue: "",
        remarks: "",
        partyA: "",
        partyB: "",
        dialogueMeetingDateTime:"",
    });

    useEffect(() => {
        setDetails(prevDetails => ({
            ...prevDetails,
            HearingOfficer: user?.fullName || ""
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
    
    useEffect(()=>{
        if(!id) return;
        const colRef = collection(db, "IncidentReports", id, "GeneratedLetters");
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            snapshot.forEach((doc) => {
                setDialogueLetterData(doc.data());
            });
        });
        return () => unsubscribe();
    },[])
    console.log(dialogueLetterData);

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
                minutesOfDialogue: details.minutesOfDialogue,
                remarks: details.remarks,
                partyA: details.partyA,
                partyB: details.partyB,
                HearingOfficer: details.HearingOfficer,
                filled:true,
                createdAt: new Date(),
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
                                        name="DateTimeOfMeeting"
                                        id="DateTimeOfMeeting"
                                        value={dialogueLetterData?.DateTimeOfMeeting||""}
                                        disabled
                                    />
                                </div>
                            </div>    
                              <p>Complainant's Name</p>
                              <div className="bars-edit">
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
        </>
    )
}

export default dialogueForm;