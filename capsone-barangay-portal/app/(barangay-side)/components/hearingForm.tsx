import { getLocalDateString } from "@/app/helpers/helpers";
import { useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import {getAllSpecificSubDocument} from "@/app/helpers/firestorehelper";

interface HearingFormProps {
    hearingIndex: number;
    id: string;
}

interface HearingDetails {
    nosHearing: number;
    nos: string;
    date: string;
    forField: string;
    time: string;
    minutesOfCaseProceedings: string;
    remarks: string;
    partyA: string;
    partyB: string;
    hearingOfficer: string;
    filled: boolean;
}


const HearingForm: React.FC<HearingFormProps> = ({ hearingIndex, id}) => {
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const [rerender, setRerender] = useState(0);
    const [hearingDetails, setHearingDetails] = useState<HearingDetails[]>([]);
    const today = getLocalDateString(new Date());
    const [submissionComplete, setSubmissionComplete] = useState(false);

    let nos ="";
    switch (hearingIndex) {
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
        nosHearing: hearingIndex,
        nos: nos,
        date: "",
        forField: "",
        time: "",
        minutesOfCaseProceedings: "",
        remarks: "",
        partyA: "",
        partyB: "",
        hearingOfficer: "",
        filled:false,
    }); 
    
    useEffect(() => { 
        const docRef = collection(db, "IncidentReports", id, "SummonsMeeting");
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            const fetchedDetails = snapshot.docs.map(doc => doc.data());
            setHearingDetails(fetchedDetails as HearingDetails[]);
        });
    
        return () => unsubscribe();
    }, [id]);



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


    const [filled, setFilled] = useState(false);
    useEffect(() => {
        let j = hearingIndex;
        for (let i = 0; i < hearingDetails.length; i++) {
          if (j === hearingDetails[i].nosHearing) {
            setDetails(hearingDetails[i]);
            setFilled(hearingDetails[i].filled);
          }
        }
      }, [hearingDetails] );


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prevDetails => ({
            ...prevDetails,
            [name]: value,
        }));
    }
    const forceRerender = () => {
        setRerender(prev => prev + 1); // Changing state = triggers rerender
    };
    const handleToggleClick = () => {
        if(hearingDetails.length < hearingIndex) return;
        else if(hearingIndex === 0 && !dialogue) return;
        setShowHearingContent(prev => !prev);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const docRef = collection(db, "IncidentReports", id, "SummonsMeeting");
            await addDoc(docRef, {
                date: details.date,
                forField: details.forField,
                time: details.time,
                minutesOfCaseProceedings: details.minutesOfCaseProceedings,
                remarks: details.remarks,
                partyA: details.partyA,
                partyB: details.partyB,
                hearingOfficer: details.hearingOfficer,
                nosHearing: hearingIndex,
                nos: nos,
                filled: true,
            });
            console.log("Document written with ID: ", docRef.id);
        
            setSubmissionComplete(true);  // Track submission success
        } catch (error:any) {
            console.error("Error saving data:", error.message);
        }
        console.log("Form submitted:", details);
    }
    useEffect(() => {
        if (submissionComplete) {
          forceRerender();
          setSubmissionComplete(false); // Reset after rerender
        }
      }, [submissionComplete]);
    return (
        <>
            <div className="hearing-section-edit">    
                <div className="title-section-edit">
                    <button type="button" className={showHearingContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={handleToggleClick}></button>
                <h1>{nos} Hearing Section</h1>
                {(hearingIndex === 0 && !dialogue) && (
                    <span className="text-red-500 ml-4">
                        In order to fill up the current Hearing Section, you must fill up the Dialogue Meeting
                    </span>
                )}
                {(hearingDetails.length < hearingIndex) && (
                  <span className="text-red-500 ml-4">
                    {hearingDetails.length}{hearingIndex}In order to fill up the current Hearing Section, you must fill up the previous Hearing
                  </span>
                )}
            </div>
            <hr/>
            {showHearingContent && (
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
                                disabled={filled ? true : false}
                                required={!filled}
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
                                placeholder="Enter For" 
                                disabled={filled ? true : false}
                                required={!filled}
                                />
                          </div>
                          <div className="input-group-edit">
                                <p>Time</p>
                                <input type="time" 
                                className="search-bar-edit" 
                                name="time"
                                id="time"
                                value={details.time||""}
                                onChange={handleChange}
                                placeholder="Enter Time" 
                                disabled={filled ? true : false}
                                required={!filled}
                                />
                          </div>
                      </div>
                  </div>
        
                  <div className="section-3-dialouge-edit">
                      <div className="fields-section-edit">
                            <p>Minutes of Case Proceedings</p>
                            <textarea className="description-edit resize-none" 
                            placeholder="Enter Minutes of Case Proceedings" 
                            name="minutesOfCaseProceedings"
                            id="minutesOfCaseProceedings"
                            value={details.minutesOfCaseProceedings||""}
                            onChange={handleChange}
                            onFocus={filled ? (e => e.target.blur()):(() => {}) }
                            required={!filled}
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
                            rows={10}
                            onFocus={filled ? (e => e.target.blur()):(() => {}) }
                            required={!filled}
                            />
                      </div>
                      <div className="fields-section-edit">
                            <p>Party B</p>
                            <textarea className="description-edit resize-none" 
                            placeholder="Enter Party"
                            id="partyB"
                            name="partyB"
                            value={details.partyB||""}
                            onChange={handleChange}
                            rows={10}
                            onFocus={filled ? (e => e.target.blur()):(() => {}) }
                            required={!filled}/>
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
                            rows={10}
                            onFocus={filled ? (e => e.target.blur()):(() => {}) }
                            required={!filled}/>
                      </div>
                      <div className="fields-section-edit">
                            <p>Hearing Officer</p>
                            <input type="text" 
                            name="hearingOfficer"
                            id="hearingOfficer"
                            value={details.hearingOfficer||""}
                            onChange={handleChange}
                            className="search-bar-edit" 
                            placeholder="Enter Hearing Officer"
                            disabled={filled ? true : false}
                            required={!filled}
                            />
                      </div>

                  </div>
                  <div className="flex justify-center items-center mt-10">
                        {!filled && (<button type="submit" className="action-view-edit">Save</button>)}
                  </div>
                </form>
            </>
            )}
            </div>


        </>
    )
}

export default HearingForm;