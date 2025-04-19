import {  useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot,updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import {getLocalDateTimeString} from "@/app/helpers/helpers";

interface HearingFormProps {
    hearingIndex: number;
    id: string;
    nosOfGeneration: number;
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
    hearingMeetingDateTime: string;
}


const HearingForm: React.FC<HearingFormProps> = ({ hearingIndex, id, nosOfGeneration}) => {
    const user = useSession().data?.user;
    const [showHearingContent, setShowHearingContent] = useState(false); // Initially hidden
    const [hearingDetails, setHearingDetails] = useState<HearingDetails[]>([]);
    const today = getLocalDateTimeString(new Date());

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
        minutesOfCaseProceedings: "",
        remarks: "",
        partyA: "",
        partyB: "",
        firstHearingOfficer:  "",
        secondHearingOfficer: "",
        thirdHearingOfficer: "",
        filled:false,
        hearingMeetingDateTime: "",
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
        setDetails(prevDetails => ({
            ...prevDetails,
            firstHearingOfficer: user?.fullName || ""
        }));
            
    },[user])

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

    const [hearing, setHearing] = useState(0);
    useEffect(() => {
        const docRef = doc(db, "IncidentReports", id);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setHearing(data.nosHearing || 0); 
            } else {
                console.log("No such document!");
            }
        });
        return () => unsubscribe();

    },[])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    
    
  
    const handleToggleClick = () => {
        if(hearingDetails.length < hearingIndex) return;
        if(hearingIndex === 0 && !dialogue) return;
        if(nosOfGeneration <= hearingIndex) return;
        setShowHearingContent(prev => !prev);
    };
    

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const docRef = collection(db, "IncidentReports", id, "SummonsMeeting");
            await addDoc(docRef, {
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
                minutesOfCaseProceedings: details.minutesOfCaseProceedings,
                remarks: details.remarks,
                partyA: details.partyA,
                partyB: details.partyB,
                firstHearingOfficer: details.firstHearingOfficer,
                secondHearingOfficer: details.secondHearingOfficer,
                thirdHearingOfficer: details.thirdHearingOfficer,
                nosHearing: hearingIndex,
                nos: nos,
                filled: true,
                hearingMeetingDateTime: details.hearingMeetingDateTime,
                createdAt: new Date(),
            });
            console.log("Document written with ID: ", docRef.id);
            
            const UpdateRef = doc(db, "IncidentReports", id,);
            await updateDoc(UpdateRef, {
                ...(hearing !=3   && { nosHearing: hearing + 1 })
            });
        } catch (error:any) {
            console.error("Error saving data:", error.message);
        }
        console.log("Form submitted:", details);
    }
  
    return (
        <>
            <div className="hearing-section-edit">    
                <div className="title-section-edit">
                    <button type="button" className={showHearingContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={handleToggleClick}></button>
                <h1>{nos} Hearing Section</h1>
                {((hearingIndex === 0) && !dialogue) && (
                    <span className="text-red-500 ml-4">
                        In order to fill up the current Hearing Section, you must fill up the Dialogue Letter and/or also generate a Summons Letter
                    </span>
                )}
                {(hearingDetails.length < hearingIndex ) && (
                  <span className="text-red-500 ml-4">
                  In order to fill up the current Hearing Section, you must fill up the previous Hearing and/or also generate a Summons Letter
                  </span>
                )}
            </div>
            <hr/>
            {showHearingContent && (
                <>
                <form onSubmit={handleSubmit}>
                  <div className="section-2-dialouge-edit">
                  <p>Hearing  Information</p>
                    <div className="bars-edit">
                        <div className="input-group-edit">
                                <p>Hearing Meeting Date and Time</p>
                                <input type="datetime-local" 
                                className="search-bar-edit" 
                                name="hearingMeetingDateTime"
                                id="hearingMeetingDateTime"
                                value={details.hearingMeetingDateTime||""}
                                disabled={filled ? true : false}
                                required={!filled}
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
                                        disabled={filled ? true : false}
                                        required={!filled}
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
                                        disabled={filled ? true : false}
                                        required={!filled}
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
                                        disabled={filled ? true : false}
                                        required={!filled}
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
                                        disabled={filled ? true : false}
                                        required={!filled}
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
                                        disabled={filled ? true : false}
                                        required={!filled}
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
                                        disabled={filled ? true : false}
                                        required={!filled}
                                        placeholder="Enter Last Name"
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
                            <p>First Hearing Officer</p>
                            <input type="text" 
                            name="firstHearingOfficer"
                            id="firstHearingOfficer"
                            value={details.firstHearingOfficer||""}
                            onChange={handleChange}
                            className="search-bar-edit" 
                            placeholder="Enter Hearing Officer"
                            disabled
                            />

                            <p>Second Hearing Officer</p>
                            <input type="text" 
                            name="secondHearingOfficer"
                            id="secondHearingOfficer"
                            value={details.secondHearingOfficer||""}
                            onChange={handleChange}
                            className="search-bar-edit" 
                            placeholder="Enter Hearing Officer"
                            disabled={filled ? true : false}
                            />

                            <p>Third Hearing Officer</p>
                            <input type="text" 
                            name="thirdHearingOfficer"
                            id="thirdHearingOfficer"
                            value={details.thirdHearingOfficer||""}
                            onChange={handleChange}
                            className="search-bar-edit" 
                            placeholder="Enter Hearing Officer"
                            disabled={filled ? true : false}
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