
import { db } from "@/app/db/firebase";
import { getLocalDateString } from "@/app/helpers/helpers";
import { doc, onSnapshot,collection, setDoc } from "firebase/firestore";
import { useState,useEffect } from "react";


interface HearingFormProps {
    id: string;
}
type DialogueDetails = {
    date: string;
    forField: string;
    time: string;
    minutesOfDialogue: string;
    remarks: string;
    partyA: string;
    partyB: string;
    hearingOfficer: string;
  };
  

const dialogueForm: React.FC<HearingFormProps> = ({id}) => {
    const [showDialogueContent, setShowDialogueContent] = useState(false); // Initially hidden
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const toggleHearingContent = () => setShowHearingContent(prev => !prev);
    const [existingData, setExistingData] = useState(false);
    const [isDialogue, setIsDialogue] = useState(false);
    const today = getLocalDateString(new Date());
    const [details, setDetails] = useState<DialogueDetails>({
        date: "",
        forField: "",
        time: "",
        minutesOfDialogue: "",
        remarks: "",
        partyA: "",
        partyB: "",
        hearingOfficer: "",
    });
    const [, setRerender] = useState(0);

    const forceRerender = () => {
        setRerender(prev => prev + 1); // Changing state = triggers rerender
    };

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
    },[id])

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
        setDetails(prevDetails => ({
            ...prevDetails,
            [name]: value,
        }));
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const subColRef = collection(db, "IncidentReports", id, "DialogueMeeting");
            const docRef = doc(subColRef, id);
            await setDoc(docRef, {
                date: details.date,
                forField: details.forField,
                time: details.time,
                minutesOfDialogue: details.minutesOfDialogue,
                remarks: details.remarks,
                partyA: details.partyA,
                partyB: details.partyB,
                hearingOfficer: details.hearingOfficer,
                filled:true,
            });
            console.log("Document written with ID: ", docRef.id);
        
            forceRerender();
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
                              <p>Complainant's Information</p>
                              <div className="bars-edit">
                                  <div className="input-group-edit">
                                        <p>Date</p>
                                        <input type="date" 
                                        className="search-bar-edit"
                                        max={today} 
                                        onKeyDown={(e => e.preventDefault())}
                                        name="date"
                                        id="date"
                                        value={details.date||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        />
                                  </div>
                                  <div className="input-group-edit">
                                        <p>For</p>
                                        <input type="text" 
                                        className="search-bar-edit" 
                                        name="forField"
                                        id="forField"
                                        value={details.forField||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter For" />
                                  </div>
                                  <div className="input-group-edit">
                                        <p>Time</p>
                                        <input type="time" 
                                        className="search-bar-edit" 
                                        name="time"
                                        id="time"
                                        value={details.time||""}
                                        onChange={handleChange}
                                        disabled={existingData ? true : false}
                                        required={!existingData}
                                        placeholder="Enter Time" />
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
                                    name="hearingOfficer"
                                    id="hearingOfficer"
                                    value={details.hearingOfficer||""}
                                    onChange={handleChange}
                                    className="search-bar-edit" 
                                    disabled={existingData ? true : false}
                                    required={!existingData}
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