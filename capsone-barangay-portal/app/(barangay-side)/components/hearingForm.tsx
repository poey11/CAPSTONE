import {  use, useEffect, useState } from "react";
import { collection, addDoc, doc, onSnapshot,updateDoc,query, orderBy, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {getLocalDateTimeString} from "@/app/helpers/helpers";
import { fill } from "pdf-lib";
import {handleLetterOfFailure} from "@/app/helpers/pdfhelper";

interface HearingFormProps {
    index: number;
    id: string;
    hearing: number;
    status: string; 
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
    createdAt: Date;
}


const HearingForm: React.FC<HearingFormProps> = ({ index, id, hearing, status }) => {
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
        Cstatus: "Present",
        Rstatus: "Present",
        createdAt: new Date()
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
            Cstatus: fetchedDetails[index]?.Cstatus || "Present",
            Rstatus: fetchedDetails[index]?.Rstatus || "Present",
          }));
        });
      
        return () => unsubscribe();
      }, [id, user]);
      
    


      console.log("Hearing Details:", hearingDetails);

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

    useEffect(() => {
      if((data?.complainantAbsents === 2) || (data?.respondentAbsents === 2 && data?.complainantAbsent===2) ){
        const mainDocRef = doc(db, "IncidentReports", id); 
        updateDoc(mainDocRef, {
          status: "dismissed",
          statusPriority: 5,
        })
        router.push(`/dashboard/IncidentModule/Department?id=${data?.department}`);
      }
    }, [data]);

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
    const department = searchParam.get("department");


    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [invalidFields, setInvalidFields] = useState<string[]>([]);
    const prevFilledHearing = hearingDetails[index - 1]?.filled || false;
    const [toUpdate, setToUpdate] = useState<any>(null);
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

            
        return () => { unsubscribe();}
    },[]);
    const [showSetRefailureMeetingPopup, setShowSetRefailureMeetingPopup] = useState(false);
    const [resheduleDateTime, setResheduleDateTime] = useState("");
     const [deliveryDate, setDeliveryDate] = useState("");
    const [deliverby, setDeliveryBy] = useState("");

    const handleRescheduleMeeting = async (date: string) => {
      const deliver = barangayList.find(user => user.id === deliverby);
      const mainDocRef = doc(db, "IncidentReports", id);
      await updateDoc(mainDocRef, {
        [`refailureExplainationMeetingHearing${index}`]: date,
        [`refailureLetterHearingDeliverBy${index}`]: `${deliver?.firstName} ${deliver?.lastName}`,
        [`refailureLetterHearingDeliverDate${index}`]: deliveryDate,
        [`refailureLetterHearingDateFiled${index}`]: new Date().toLocaleString(),
      })
    }

    const saveSummon = async () => {
        try {
            const docRef = collection(db, "IncidentReports", id, "SummonsMeeting");
            const success = await addDoc(docRef, {
                ...details,
                nosHearing: index,
                nos: nos,
                filled: true
            });

        

            const mainDocRef = doc(db, "IncidentReports", id); 
            
            if(details.Rstatus === "Absent" && details.Cstatus !== "Absent"){
              //Send letter of refailure to appear to respondent
              // A small window or popup to set the date and time of explaination of the failure to appear
              //setShowSetRefailureMeetingPopup(true);
              await updateDoc(mainDocRef, {
              //[`sentLetterOfFailureToAppearHearing${index}`]: true,
              
              // sentLetterOfFailureToAppearHearing: {
              //   ...(data?.sentLetterOfFailureToAppearHearing || {}),
              //   [index]: true
              // },

              [`respondentAbsentInHearing${index}`]: true,
              respondentAbsents: (data?.respondentAbsents || 0) + 1,
              })
              if(index === 2){
                await updateDoc(mainDocRef, {
                  status: "CFA",
                  statusPriority: 4,
                })
              }
              
              setTimeout(() => {
                setShowPopup(false);
              }, 3000);
              return;
            }
            else if(details.Cstatus === "Absent" && details.Rstatus !== "Absent"){
              await updateDoc(mainDocRef, {
                  complainantAbsents: (data?.complainantAbsents || 0) + 1,                
                })
              if(index === 2){
                await updateDoc(mainDocRef, {
                  status: "dismissed",
                  statusPriority: 5,
                })
              }  
              return;
            } 
            else if(details.Rstatus === "Absent" && details.Cstatus === "Absent"){
              await updateDoc(mainDocRef, {
                  respondentAbsents: (data?.respondentAbsents || 0) + 1,
                  complainantAbsents: (data?.complainantAbsents || 0) + 1,
                })
                if(index === 2){
                await updateDoc(mainDocRef, {
                    status: "dismissed",
                    statusPriority: 5,
                  })
                }  
              return;
            }
            else if (details.Cstatus !== "Absent" && details.Rstatus !== "Absent") {
              setShowDoneIncidentPopup(true);
              return;
            }    
            router.push(`/dashboard/IncidentModule/EditIncident/RefailureHearing?id=${id}&department=${department}`);


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
                if(index === 2) {
                    //window.location.reload(); // Reload the page to reflect changes
                }
            }, 3000);
            //router.push(`/dashboard/IncidentModule/EditIncident?id=${docId}`);
            } catch (error) {
              console.error("Error during confirmation submit:", error);
              setPopupErrorMessage("Error saving summon. Please try again.");
              setShowErrorPopup(true);
              setTimeout(() => setShowErrorPopup(false), 3000);
            }
          };


    const usersAbsent = () => details.Cstatus === "Absent" || details.Rstatus === "Absent";

        
    useEffect(() => {
      setDetails((prev) => {
        // Clean previous status-related strings from minutes and remarks
        let minutes = (prev.minutesOfCaseProceedings || "")
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
          minutesOfCaseProceedings: minutes,
          remarks: remarks,
          partyA,
          partyB,
        };
      });
    }, [details.Cstatus, details.Rstatus]);

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

    const router = useRouter();
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
      }, 3000); // Wait 3 seconds before redirecting or showing next popup
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
            router.push(`/dashboard/IncidentModule/Department?id=${department}`);
          }, 3000); // ✅ Delay redirect

        }
      }

const [showGovAgencyPopup, setShowGovAgencyPopup] = useState<string | null>(null);

      const [activeSection, setActiveSection] = useState("meeting");

    return (
        <>
            
   <form onSubmit={handleSaveClick} className="hearing-main-section-form">

       <div className="hearing-edit-header-body-top-section">
            
            <div className="hearing-edit-first-section">
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


                  <div className="hearing-edit-section-2">
                        {(!hearingDetails[index]?.filled && data?.status === "pending" ) && (<button type="submit" className="action-save-edit-hearing">Save</button>)}
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
                              checked={details.Cstatus === "Present" || hearingDetails[index]?.Cstatus === "Present"}
                              onChange={(e) =>
                                setDetails((prev: any) => ({
                                  ...prev,
                                  Cstatus: e.target.checked ?  "Present" : "Absent"
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
                                    checked={details.Rstatus === "Present" || hearingDetails[index]?.Rstatus === "Present"}
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

                <div className="edit-incident-content-dialogue-rightsection-update">
                    <div className="view-incident-dialogue-remarks-container-update">
                        <div className="box-container-outer-remarks-dialogue-update">
                            <div className="title-remarks-dialogue-update">
                                Remarks
                            </div>
                             <div className={`box-container-remarks-dialogue-update ${invalidFields.includes("remarks") ? "input-error" : ""}`}>
                                <span className="required-asterisk-incident-update">*</span>
                                 <textarea className="remarks-input-field-dialogue-update" 
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

            

               
            </form>
           
            
            


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
{showDoneIncidentPopup && (
  <div className="confirmation-popup-overlay-add">
    <div className="confirmation-popup-add">
      <img src="/Images/question.png" alt="icon alert" className="successful-icon-popup" />
      <p>Has the incident case been settled?</p>
      <div className="yesno-container-add">

       

        {/* Case 2: hearing !== 3 && NOT dismissed */}
        {hearing !== 3 && data?.status !== "dismissed" && (
          <button
            onClick={() => {
              setShowDoneIncidentPopup(false);
              setPopupMessage("Incident has been updated successfully.");
              setShowPopup(true);
              setTimeout(() => setShowPopup(false), 3000);            }}
            className="no-button-add"
          >
            No
          </button>
        )}

        {/* Case 3: hearing === 3 */}
        {(hearing === 3 && department === "Lupon") ? (
          <button
            onClick={() => handleClosingCase(false)}
            className="no-button-add bg-gray-600"
          >
            CFA
          </button>
        ):(hearing === 3 && department !== "Lupon") && (
          <button
            onClick={() => setShowGovAgencyPopup("")}
            className="no-button-add bg-gray-600"
          >
            Refer to Government Agency
          </button>
        )}

        {/* YES button (shared by all) */}
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


{showGovAgencyPopup !== null && (
  <div className="confirmation-popup-overlay-add">
    <div className="confirmation-popup-add">
      <img src="/Images/question.png" alt="icon alert" className="successful-icon-popup" />
      <p>Which Government Agency to Refer this to?</p>

      {/* Quick-pick buttons that fill the same text field */}
      <div className="settlement-options-modern-section">
        {[
          "Social Services Development Department (SSDD)",
          "Department of Social Welfare and Development (DSWD)",
          "Police Station",
        ].map((label) => (
          <label
            key={label}
            className={`settlement-card-section ${
              showGovAgencyPopup === label ? "selected-section" : ""
            }`}
            onClick={() => setShowGovAgencyPopup(label)}
          >
            <input
              type="radio"
              name="govAgencyPick"
              checked={showGovAgencyPopup === label}
              onChange={() => setShowGovAgencyPopup(label)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {/* Single input used for any agency (preset or custom) */}
      <input
        type="text"
        className="edit-incident-input-field mt-3"
        placeholder="Type or confirm the government agency name"
        value={showGovAgencyPopup ?? ""}
        onChange={(e) => setShowGovAgencyPopup(e.target.value)}
        autoFocus
      />

      <div className="yesno-container-add-section">
        <button
          className="no-button-add"
          onClick={() => setShowGovAgencyPopup(null)}
        >
          Cancel
        </button>

        <button
          className="yes-button-add-section"
          onClick={async () => {
            const agency = (showGovAgencyPopup ?? "").trim();

            if (!agency) {
              setPopupErrorMessage("Please enter a government agency before submitting.");
              setShowErrorPopup(true);
              setTimeout(() => setShowErrorPopup(false), 3000);
              return;
            }

            // Persist the status + chosen agency
            const mainDocRef = doc(db, "IncidentReports", id);
            await updateDoc(mainDocRef, {
              status: "Refer to Government Agency",
              statusPriority: 6,
              referredAgency: agency, // <-- stored in one field
            });

            setShowGovAgencyPopup(null);
            // If you want to also leverage your existing confirmSubmitB flow, you can still call it:
            // (this keeps the same success UX + redirect timing you already have)
            confirmSubmitB();
          }}
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}


{showSubmitPopupB && (
  <div className="confirmation-popup-overlay-add-section">
    <div className="confirmation-popup-add-section">
      <p className="popup-title-section">How was the case settled?</p>

      <div className="settlement-options-modern-section">
        {[
          { label: "Mediation", key: "isMediation" },
          { label: "Conciliation", key: "isConciliation" },
          { label: "Arbitration", key: "isArbitration" },
        ].map(({ label, key }) => {
          const isSelected = toUpdate?.[key] === true;
          return (
            <label
              className={`settlement-card-section ${isSelected ? "selected-section" : ""}`}
              key={key}
            >
              <input
                type="radio"
                name="settlementMethod"
                checked={isSelected}
                onChange={() =>
                  setToUpdate((prev: any) => ({
                    ...prev,
                    isMediation: key === "isMediation",
                    isConciliation: key === "isConciliation",
                    isArbitration: key === "isArbitration",
                  }))
                }
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      <div className="yesno-container-add-section">
        <button
          className="yes-button-add-section"
          onClick={() => {
            const isAnySelected =
              toUpdate?.isMediation || toUpdate?.isConciliation || toUpdate?.isArbitration;

            if (!isAnySelected) {
              setPopupErrorMessage("Please select a settlement method before submitting.");
              setShowErrorPopup(true);

              // Auto-hide after 3 seconds
              setTimeout(() => {
                setShowErrorPopup(false);
              }, 3000);
            } else {
              confirmSubmitB();
            }
          }}
        >
          Submit
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
                <div className={`error-popup-overlay-settled show`}>
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
                  className=""
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
              <p>When to Deliver?</p>
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
              <p>Deliver By?</p>
              <div className="yesno-container-add">
                <select
                  className="border p-2 rounded w-full "
                  name="deliverBy"
                  id="deliverBy"
                  value={deliverby}
                  onChange={(e) => setDeliveryBy(e.target.value)}
                  required
                >
                  <option value="" disabled >Select Deliver By</option>
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
                    handleLetterOfFailure(id, resheduleDateTime, `${data?.complainant?.fname} ${data?.complainant?.lname}`, `${data?.respondent?.fname} ${data?.respondent?.lname}`, "summon", index);
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

export default HearingForm;