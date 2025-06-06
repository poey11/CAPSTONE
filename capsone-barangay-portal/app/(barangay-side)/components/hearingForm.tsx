import {  useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot,updateDoc,query, orderBy, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
        });
    
        return () => unsubscribe();
    }, [id]);

    useEffect(() => {
        setDetails(prevDetails => ({
            ...prevDetails,
            firstHearingOfficer: user?.fullName || ""
        }));
            
    },[user])



      

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

    const usersAbsent = () => details.Cstatus === "Absent" || details.Rstatus === "Absent";

    useEffect(() => {
    const updatedDetails = { ...details };

    let absentMinutes: string[] = [];
    let absentRemarks: string[] = [];

    // Handle Complainant status
    if (details.Cstatus === "Absent") {
        updatedDetails.partyA = "Complainant Absent";
        absentMinutes.push("Complainant Absent.");
        absentRemarks.push("Complainant Absent.");
    } else {
        updatedDetails.partyA = "";
    }

    // Handle Respondent status
    if (details.Rstatus === "Absent") {
        updatedDetails.partyB = "Respondent Absent";
        absentMinutes.push("Respondent Absent.");
        absentRemarks.push("Respondent Absent.");
    } else {
        updatedDetails.partyB = "";
    }

    // If any user is marked absent, overwrite with only absent messages
    if (absentMinutes.length > 0 || absentRemarks.length > 0) {
        updatedDetails.minutesOfCaseProceedings = absentMinutes.join(" ");
        updatedDetails.remarks = absentRemarks.join(" ");
    }

    // If both are present, clear everything
    if (details.Cstatus === "Present" && details.Rstatus === "Present") {
        updatedDetails.minutesOfCaseProceedings = "";
        updatedDetails.remarks = "";
    }

    setDetails(updatedDetails);
}, [details.Cstatus, details.Rstatus]);

    const router = useRouter();

    const handleBack = () => {
        router.back();
    };


    return (
        <>
            

        
         <div className="hearing-section-edit">    
            
                <div className="title-section-edit">
                    <button type="button" className={showHearingContent ? "record-details-minus-button" : "record-details-plus-button"}  onClick={handleToggleClick}></button>
                    <h1>{nos} Hearing Section</h1>

                    {/*
                    {(index === 0 && (generatedHearingSummons === 0 || !dialogue)) && (
                        <span className="text-red-500 ml-4">
                            In order to fill up the current Hearing Section, you must fill up the Dialogue Letter and/or also generate a Summons Letter
                        </span>
                    )}
                    {( index !== 0 && (index >= generatedHearingSummons||!prevFilledHearing) ) && (
                    <span className="text-red-500 ml-4">
                    In order to fill up the current Hearing Section, you must fill up the previous Hearing and/or also generate a Summons Letter
                    </span>
                    )}*/}
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
                                value={summonLetterData[index]?.DateTimeOfMeeting||""}
                                disabled
                            />
                        </div>
                    </div>  
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
                      <div className="bars-edit">
                          <div className="input-group-edit">
                                <input type="text" 
                                className="search-bar-edit" 
                                value={`${data.complainant.fname} ${data.complainant.lname} `|| ""}
                                disabled/>
                          </div>
                      </div>
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
                      <div className="bars-edit">
                        <div className="input-group-edit">
                            
                                <input type="text" 
                                className="search-bar-edit" 
                                value={`${data.respondent.fname} ${data.respondent.lname} `|| ""}
                                disabled
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
                            value={details.minutesOfCaseProceedings||hearingDetails[index]?.minutesOfCaseProceedings||""}
                            onChange={handleChange}
                            onFocus={hearingDetails[index]?.filled|| usersAbsent() ? (e => e.target.blur()):(() => {}) }
                            required={!hearingDetails[index]?.filled|| usersAbsent()? false : true}
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
                            value={details.partyA||hearingDetails[index]?.partyA||""}
                            onChange={handleChange}
                            rows={10}
                            onFocus={hearingDetails[index]?.filled|| usersAbsent() ? (e => e.target.blur()):(() => {}) }
                            required={!hearingDetails[index]?.filled||usersAbsent() ? false : true}
                            />
                      </div>
                      <div className="fields-section-edit">
                            <p>Party B</p>
                            <textarea className="description-edit resize-none" 
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
                  <div className="section-4-dialouge-edit">
                      <div className="fields-section-edit">
                            <p>Remarks</p>
                            <textarea className="description-edit resize-none" 
                            name="remarks"
                            id="remarks"
                            value={details.remarks||hearingDetails[index]?.remarks||""}
                            onFocus={hearingDetails[index]?.filled||usersAbsent() ? (e => e.target.blur()):(() => {}) }
                            required={!hearingDetails[index]?.filled||usersAbsent() ? false : true}
                            onChange={handleChange}
                            placeholder="Enter Remarks" 
                            rows={10}
                            />
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
                  <div className="flex justify-center items-center mt-10">
                        {!hearingDetails[index]?.filled && (<button type="submit" className="action-view-edit">Save</button>)}
                  </div>
                </form>
            </>
            )}
            </div>


        </>
    )
}

export default HearingForm;