"use client"
import "@/CSS/IncidentModule/ViewIncident.css";
import { useRouter,useSearchParams  } from "next/navigation"; // Use 'next/navigation' in Next.js 13+ (App Router)
import {   useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "@/app/helpers/firestorehelper";
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";

export default  function ViewLupon() {
  const router = useRouter();
  const searchParam = useSearchParams();
  const docId = searchParam.get("id");
  const [reportData, setReportData] = useState<any>();
  const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
  const [hearingData, setHearingData] = useState<any[]>([]);
  const [dialogueData, setDialogueData] = useState<any>(null);
  const [generatedSummonLetter, setGeneratedSummonLetter] = useState<any>();
  const [generatedDialogueLetter, setGeneratedDialogueLetter] = useState<any | null[]>([]);
  
  

  useEffect(()=>{
    if(!docId) return;
    const colRef = query(collection(db, "IncidentReports", docId, "GeneratedLetters"), where("letterType", "==", "summon"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const fetchedData = snapshot.docs.map(doc => doc.data());
        setGeneratedSummonLetter(fetchedData);
    });
    return () => unsubscribe();
    },[])

    useEffect(()=>{
      if(!docId) return;
      const colRef = query(collection(db, "IncidentReports", docId, "GeneratedLetters"), where("letterType", "==", "dialogue"));
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
          snapshot.forEach((doc) => {
              setGeneratedDialogueLetter(doc.data());
          });
      });
      return () => unsubscribe();
    },[])
      

  useEffect(() => {
    if(!docId)return;
    const fetchHearingAndDialogue = async () => {
      const docRef = doc(db, "IncidentReports", docId, "DialogueMeeting", docId);

        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            return setDialogueData(docSnap.data());
        } else {
            console.log("No such document!");
        }
    };
    fetchHearingAndDialogue();
  },[])
  console.log("Dialogue Data", dialogueData);

  useEffect(() => {
    if(!docId)return;
      const docRef = doc(db, "IncidentReports", docId);
      const subDocRef = collection(docRef, "SummonsMeeting");
      const subDocQuery = query(subDocRef, orderBy("nosHearing", "desc"));
      const unsubscribe = onSnapshot(subDocQuery, (snapshot) => {
      const reports:any[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
      }));

      setHearingData(reports);
      });
      return unsubscribe;
    
    

  },[]);
  console.log("Hearing Data", hearingData);

  useEffect(() => {
    if(docId){
      getSpecificDocument("IncidentReports", docId, setReportData);
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


  const status = reportData?.status; 
  const departId = reportData?.department;
  const complainantsData  ={
    fname: reportData?.complainant.fname,
    lname: reportData?.complainant.lname,
    contact: reportData?.complainant.contact,
    address:reportData?.complainant.address,
    civilStatus: reportData?.complainant.civilStatus,
    sex: reportData?.complainant.sex,
    age: reportData?.complainant.age,
  }

  const respondent =  {
    fname: reportData?.respondent.fname,
    lname: reportData?.respondent.lname,
    contact: reportData?.respondent.contact,
    address:reportData?.respondent.address,
    civilStatus: reportData?.respondent.civilStatus,
    sex: reportData?.respondent.sex,
    age: reportData?.respondent.age,
  }


  const deskOfficerData =  {
    name: reportData?.receivedBy, 
    dateReceived:  reportData?.dateReceived,
    timeReceived:  reportData?.timeReceived,
  };
  let natureC = reportData?.nature;
  if (natureC === "Others") {
    natureC = reportData?.specifyNature;
  }
  const otherinformation = {
    nature: natureC,
    date:  reportData?.dateFiled + " " + reportData?.timeFiled,
    location: reportData?.location,
    concern: reportData?.concern,
    image: concernImageUrl, 
  };

  
const formatDateTime = (rawDate: string | undefined) => {
  if (!rawDate) return "Not Yet Investigated";
  const date = new Date(rawDate);
  return `${date.getFullYear()} - ${String(date.getMonth() + 1).padStart(2, '0')} - ${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const dialogueFormData = !dialogueData || dialogueData === "" ? {
  partyA: "No Party A Assigned",
  partyB: "No Party B Assigned",
  dialogueMeetingDateTime: "Not Yet Investigated",
  remarks: "No Remarks Available",
  minutesOfDialogue: "No Minutes Available",
  HearingOfficer: "No Hearing Officer Assigned",
} : {
  partyA: dialogueData?.partyA || "No Party A Assigned",
  partyB: dialogueData?.partyB || "No Party B Assigned",
  dialogueMeetingDateTime: formatDateTime(generatedDialogueLetter?.DateTimeOfMeeting),
  remarks: dialogueData?.remarks || "No Remarks Available",
  minutesOfDialogue: dialogueData?.minutesOfDialogue || "No Minutes Available",
  HearingOfficer: dialogueData?.HearingOfficer || "No Hearing Officer Assigned",
};




  const hearingFormDataA =  (item: any, index: number) =>  ({
    partyA: item.partyA || "No Party A Assigned",
    partyB: item.partyB || "No Party B Assigned",
    hearingMeetingDateTime: formatDateTime(generatedSummonLetter[index].DateTimeOfMeeting)|| "Not Yet Investigated",
    remarks: item.remarks || "No Remarks Available",
    minutesOfCaseProceedings: item.minutesOfCaseProceedings || "No Minutes Available",
    firstHearingOfficer: item.firstHearingOfficer || "No First Hearing Officer Assigned",
    secondHearingOfficer: item.secondHearingOfficer || "No Second Hearing Officer Assigned",
    thirdHearingOfficer: item.thirdHearingOfficer || "No Third Hearing Officer Assigned"
  })


const firstHearing = hearingData?.length > 0 ? hearingFormDataA(hearingData[0], 0) : null;
const secondHearing = hearingData?.length > 1 ? hearingFormDataA(hearingData[1], 1) : null;
const thirdHearing = hearingData?.length > 2 ? hearingFormDataA(hearingData[2], 2) : null;
  
  const complainantsFields = [
    {label: "Name", key: "name" },
    {label: "Civil Status", key: "civilStatus"},
    {label: "Age", key: "age"},
    {label: "Sex", key: "sex"},
    {label: "Address", key: "address"},
    {label: "Contact No", key: "contact" }
  ];
  const respondentsField = [
    { label: "Name", key: "name" },
    {label: "Civil Status", key: "civilStatus"},
    {label:"Age", key: "age"},
    {label:"Sex", key: "sex"},
    {label: "Address", key: "address"},
    { label: "Contact No", key: "contact" }
  ];
  const deskOfficerFields = [
    { label: "Name", key: "name" },
    { label: "Date & Time Signed", key: "dateTimeReceived" },
    
  ];

  
  

  const otherinformationFields = [
    { label: "Nature", key: "nature" },
    { label: "Date & Time", key: "date" },
    { label: "Location", key: "location" },
    { label: "Nature of Facts", key: "concern" },
    { label: "Image", key: "image" },
  ];

  const dialogueFields = [
   
    { label: "Party A", key: "partyA" },
    { label: "Party B", key: "partyB" },
    
    {label: "Meeting Date and Time", key: "dialogueMeetingDateTime"},

    { label: "Remarks", key: "remarks" },

    {label:"Minutes Of Dialogue", key: "minutesOfDialogue"},

    {label:"Hearing Officer", key: "HearingOfficer"},
  ]

  const hearingFields = [
    { label: "Party A", key: "partyA" },
    { label: "Party B", key: "partyB" },
    
    {label: "Meeting Date and Time", key: "hearingMeetingDateTime"},

    { label: "Remarks", key: "remarks" },

    {label:"Minutes Of Case Proceedings", key: "minutesOfCaseProceedings"},

    {label:"First Hearing Officer", key: "firstHearingOfficer"},
    {label:"Second Hearing Officer", key: "secondHearingOfficer"},
    {label:"Third Hearing Officer", key: "thirdHearingOfficer"},
  ];


  function getHearingOfficer(nos: string, formData: any) {
    const key = `${nos.toLowerCase()}HearingOfficer`;
    return formData[key] || "No Hearing Officer Assigned";
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "resolved":
        return "resolved";
      case "settled":
        return "settled";
      case "archived":
        return "archived";
      default:
        return "";
    }
  };


    const handleViewLupon = () => {
      router.back();
    };

    const sections = [
      "complainant",
      "respondent",
      "incident",
      "barangay desk",
      "dialogue",
      "hearing",
    ];

  const [activeSection, setActiveSection] = useState("complainant");
  const [page, setPage] = useState(0); 
  const visibleSections = sections.slice(page * 3, page * 3 + 3);

  const [openIndices, setOpenIndices] = useState<{[key:number]: boolean}>({});

  const toggleOpen = (index: number) => {
    setOpenIndices(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <main className="main-container-view">
      {/* should also include hearing and dialogue info*/}


      <div className="view-incident-main-content">
        <div className="view-incident-main-section1">
            <div className="view-incident-header-first-section">
              <img src="/Images/QClogo.png" alt="QC Logo" className="logo1-image-side-bar-1" />
            </div>

            <div className="view-incident-header-second-section">
              <h2 className="gov-info">Republic of the Philippines</h2>
              <h2 className="gov-info">Quezon City</h2>
              <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
              <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
              <h2 className="contact">930-0040 / 428-9030</h2>
            </div>

            <div className="view-incident-header-third-section">
              <img src="/Images/logo.png" alt="Brgy Logo" className="logo2-image-side-bar-1" />
            </div>
        </div>

        <div className="view-incident-header-body">
          <div className="view-incident-header-body-top-section">
            <div className="view-incident-backbutton-container">
              <button onClick={handleViewLupon}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-main-resident"/> 
              </button>
            </div>

            

            <div className="view-incident-info-toggle-wrapper">

              <div className="toggle-navigate-backbutton">
                {/* Back button on the left */}
                <button
                  onClick={() => setPage(0)}
                  type="button"
                  disabled={page === 0}
                  style={{ background: "none", border: "none", cursor: page === 0 ? "default" : "pointer" }}
                >
                  <img src="/Images/back.png" alt="Back" style={{ width: "20px", opacity: page === 0 ? 0.3 : 1 }} />
                </button>
              </div>
              
              <div className="toggle-main-section">

                {visibleSections.map((section) => (
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
                    {section === "dialogue" && "Dialogue"}
                    {section === "hearing" && "Hearing"}
                  </button>
                ))}

              </div>
              

              <div className="toggle-navigate-nextbutton">
              {/* Right button on the right */}
                <button
                  onClick={() => setPage(1)}
                  type="button"
                  disabled={page === 1}
                  style={{ background: "none", border: "none", cursor: page === 1 ? "default" : "pointer" }}
                >
                  <img src="/Images/next.png" alt="Next" style={{ width: "20px", opacity: page === 1 ? 0.3 : 1 }} />
                </button>
              </div>
            </div>
     
          </div>

          <div className="view-incident-header-body-bottom-section">
            <div className="incident-main-details-container">
              <div className="incident-main-details-section">
                <div className="incident-main-details-topsection">
                  <h1>{reportData?.caseNumber}</h1>
                </div>
                <div className="incident-main-details-statussection">
                  <h1> Status</h1>

                  <div className="status-section-view">
                      <p className={`status-badge-view ${getStatusClass(status)}`}>{status}</p> 
                  </div>
                </div>
                <div className="incident-main-details-description">
                  <div className="incident-date-section">
                    <div className="incident-date-topsection">
                      <div className="incident-main-details-icons-section">
                        <img src="/Images/calendar.png" alt="calendar icon" className="view-incident-description-icon-calendar" />
                      </div>
                      <div className="incident-main-details-title-section">
                        <h1>Date Filed</h1>
                      </div>
                    </div>
                    <p>{reportData?.dateFiled || "N/A"}</p>
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
                    <p>{reportData?.location || "N/A"}</p>
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

            <div className="view-incident-info-main-container">
              <div className="view-incident-info-container-scrollable">
                <div className="view-incident-info-main-content">
                  {activeSection === "complainant" && (
                    <>
                      <div className="view-incident-dialogue-content">
                        <div className="view-incident-content-topsection">
                          <div className="view-incident-content-left-side">
                            <div className="view-incident-fields-section">
                              <p>Last Name</p>
                              <input type="text" className="view-incident-input-field" name="complainantName" value={complainantsData.lname || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>First Name</p>
                              <input type="text" className="view-incident-input-field" name="complainantName" value={complainantsData.fname || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>Civil Status</p>
                              <input type="text" className="view-incident-input-field" name="complainantCivilStatus" value={complainantsData.civilStatus || "N/A"} readOnly />
                            </div>
                          </div>

                          <div className="view-incident-content-right-side">
                            <div className="view-incident-fields-section">
                              <p>Age</p>
                              <input type="text" className="view-incident-input-field" name="complainantAge" value={complainantsData.age || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>Sex</p>
                              <input type="text" className="view-incident-input-field" name="complainantSex" value={complainantsData.sex || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>Address</p>
                              <input type="text" className="view-incident-input-field" name="complainantAddress" value={complainantsData.address || "N/A"} readOnly />
                            </div>
                          </div>
                        </div>
                        <div className="bottom-middle-section">
                          <div className="bottom-middle-incidentfields">
                            <p>Contact Number</p>
                            <input type="text" className="view-incident-input-field" name="complainantContact" value={complainantsData.contact || "N/A"} readOnly />
                            </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeSection === "respondent" && (
                    <>
                      <div className="view-incident-dialogue-content">
                        <div className="view-incident-content-topsection">
                          <div className="view-incident-content-left-side">
                            <div className="view-incident-fields-section">
                              <p>Last Name</p>
                              <input type="text" className="view-incident-input-field" name="respondentName" value={respondent.lname || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>First Name</p>
                              <input type="text" className="view-incident-input-field" name="respondentName" value={respondent.fname || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>Civil Status</p>
                              <input type="text" className="view-incident-input-field" name="respondentCivilStatus" value={respondent.civilStatus || "N/A"} readOnly />
                            </div>
                          </div>

                          <div className="view-incident-content-right-side">
                            <div className="view-incident-fields-section">
                              <p>Age</p>
                              <input type="text" className="view-incident-input-field" name="respondentAge" value={respondent.age || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>Sex</p>
                              <input type="text" className="view-incident-input-field" name="respondentSex" value={respondent.sex || "N/A"} readOnly />
                            </div>
                            <div className="view-incident-fields-section">
                              <p>Address</p>
                              <input type="text" className="view-incident-input-field" name="respondentAddress" value={respondent.address || "N/A"} readOnly />
                            </div>
                          </div>
                        </div>
                        <div className="bottom-middle-section">
                          <div className="bottom-middle-incidentfields">
                            <p>Contact Number</p>
                            <input type="text" className="view-incident-input-field" name="respondentContact" value={respondent.contact || "N/A"} readOnly />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {activeSection === "barangay desk" && (
                    <>
                      <div className="barangay-desk-officer-section">
                        <div className="view-incident-fields-section-deskofficer">
                          <p>Full Name</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerName" value={deskOfficerData.name || "N/A"} readOnly />
                        </div>

                        <div className="view-incident-fields-section-deskofficer">
                          <p>Date Signed</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerDateReceived" value={deskOfficerData.dateReceived || "N/A"} readOnly />
                        </div>

                        <div className="view-incident-fields-section-deskofficer">
                          <p>Time Signed</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerTimeReceived" value={deskOfficerData.timeReceived || "N/A"} readOnly />
                        </div>

                      </div>
                    </>
                  )}

                  {activeSection === "incident" && (
                    <>
                      <div className="view-incident-dialogue-content">
                        <div className="view-incident-content-topsection">
                          <div className="view-incident-content-left-side">
                            <div className="view-incident-fields-section">
                              <p>Nature</p>
                              <input type="text" className="view-incident-input-field" name="deskOfficerName" value={otherinformation.nature || "N/A"} readOnly />
                            </div>
                            
                            {departId === "GAD" && (
                              <>
                                <div className="view-incident-fields-section">
                                  <p>Nos of Male Children Victim/s</p>
                                  <input type="text" className="view-incident-input-field" name="nosofMaleChildren" value={reportData?.nosofMaleChildren || "N/A"} readOnly
                                  />
                                </div>
                              </>
                            )}
                             
                          </div>

                          <div className="view-incident-content-right-side">
                            <div className="view-incident-fields-section">
                              <p>Location</p>
                              <input type="text" className="view-incident-input-field" name="deskOfficerDateTimeReceived" value={otherinformation.location || "N/A"} readOnly />
                            </div>

                            {departId === "GAD" && (
                              <>
                                <div className="view-incident-fields-section">
                                  <p>Nos of Female Children Victim/s</p>
                                  <input type="text" className="view-incident-input-field" name="nosofFemaleChildren" value={reportData?.nosofFemaleChildren || "N/A"} readOnly
                                  />
                                </div>
                              </>
                            )}

                          </div>
                        </div>
                        <div className="bottom-middle-section">
                          <div className="bottom-middle-incidentfields">
                              <p>Date & Time Filed</p>
                              <input type="text" className="view-incident-input-field" name="deskOfficerDateTimeReceived" value={otherinformation.date || "N/A"} readOnly />
                            </div>
                        </div>

                        <div className="view-incident-content-bottomsection">
                          <div className="view-incident-partyA-container">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Nature of Facts
                              </div>
                              <div className="box-container-partyA">
                              <textarea className="natureoffacts-input-field" name="concern" value={otherinformation.concern} readOnly/>
                              </div>
                            </div>
                          </div>

                          <div className="view-incident-partyA-container">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Incident Image
                              </div>
                              <div className="box-container-incidentimage-2">
                                {otherinformation.image ? (
                                   <a href={otherinformation.image} target="_blank" rel="noopener noreferrer">
                                        <img
                                        src={otherinformation.image}
                                        alt="Incident Image"
                                        className="incident-img-view uploaded-pic"
                                      />
                                   </a>
                                  
                                ) : (
                                  <p className="no-image-text-view">No image available</p>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>

                        
                      </div>
                    </>
                  )}

                  {activeSection === "dialogue" && (
                    <>
                      <div className="view-incident-dialogue-content">
                        <div className="view-incident-content-topsection">
                          <div className="view-incident-content-left-side">
                            <div className="view-incident-fields-section">
                              <p>Meeting Date & Time</p>
                              <input type="text" className="view-incident-input-field" name="dialogueMeetingDateTime" value={dialogueFormData.dialogueMeetingDateTime || "N/A"} readOnly />
                            </div>
                          </div>

                          <div className="view-incident-content-right-side">
                            <div className="view-incident-fields-section">
                              <p>Hearing Officer</p>
                              <input type="text" className="view-incident-input-field" name="HearingOfficer" value={dialogueFormData.HearingOfficer || "No Hearing Officer Assigned"} readOnly />
                            </div>  
                          </div>
                        </div>
                      
                        <div className="view-incident-content-bottomsection">
                          <div className="view-incident-partyA-container">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Party A
                              </div>
                              <div className="box-container-partyA">
                                <textarea className="partyA-input-field" name="partyA" value={dialogueFormData.partyA} readOnly/>
                              </div>
                            </div>
                          </div>

                          <div className="view-incident-partyA-container">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Party B
                              </div>
                              <div className="box-container-partyA">
                                <textarea className="partyA-input-field" name="partyB" value={dialogueFormData.partyB} readOnly/>
                              </div>
                            </div>
                          </div>

                          <div className="view-incident-partyA-container">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Remarks
                              </div>
                              <div className="box-container-partyA">
                                <textarea className="partyA-input-field" name="remarks" value={dialogueFormData.remarks} readOnly/>
                              </div>
                            </div>
                          </div>

                          <div className="view-incident-partyA-container">
                            <div className="box-container-outer-natureoffacts">
                              <div className="title-remarks-partyA">
                                Minutes of Dialogue
                              </div>
                              <div className="box-container-partyA">
                                <textarea className="partyA-input-field" name="minutesOfDialogue" value={dialogueFormData.minutesOfDialogue} readOnly/>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    </>
                  )}

                  {activeSection === "hearing" && (
                    <div className="hearing-sections">
                      {hearingData.length > 0 &&
                      [...hearingData]
                        .sort((a, b) => {
                          const order = { First: 1, Second: 2, Third: 3 };
                          return order[a.nos as keyof typeof order] - order[b.nos as keyof typeof order];
                        })
                        .map((item, index) => {
                          const hearingFormData = hearingFormDataA(item, index);

                          return (
                            <div className="view-incident-dialogue-content" key={index}>
                            <div className="hearing-fullinfo-container">  
                              <div className="hearing-title-container" style={{cursor: 'pointer'}} onClick={() => toggleOpen(index)}>
                                  <div className="hearing-title">
                                    <h1>{item.nos} Hearing Details</h1>
                                  </div>
                                  <div className="hearing-button-section">
                                    <button className="toggle-btn-hearing"
                                      aria-label={openIndices[index] ? 'Hide details' : 'Show details'}
                                    >
                                      <img 
                                        src={openIndices[index] ? '/Images/up.png' : '/Images/down.png'} 
                                        alt={openIndices[index] ? 'Hide details' : 'Show details'} 
                                        style={{ width: '16px', height: '16px' }} 
                                      />
                                    </button>
                                  </div>
                                </div>

                              <div className="view-incident-content-topsection">
                                <div className="view-incident-content-left-side">
                                  <div className="view-incident-fields-section">
                                    <p>Meeting Date & Time</p>
                                    <input
                                      type="text"
                                      className="view-incident-input-field"
                                      name="hearingMeetingDateTime"
                                      value={hearingFormData.hearingMeetingDateTime || "N/A"}
                                      readOnly
                                    />
                                  </div>
                                </div>

                                <div className="view-incident-content-right-side">
                                  <div className="view-incident-fields-section">
                                    <p>{item.nos} Hearing Officer</p>
                                    <input
                                      type="text"
                                      className="view-incident-input-field"
                                      value={getHearingOfficer(item.nos, hearingFormData)}
                                      readOnly
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Conditionally render bottom section */}
                              {openIndices[index] && (
                                <div className="view-incident-content-bottomsection">
                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">Party A</div>
                                      <div className="box-container-partyA">
                                        <textarea
                                          className="partyA-input-field"
                                          name="partyA"
                                          value={hearingFormData.partyA}
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">Party B</div>
                                      <div className="box-container-partyA">
                                        <textarea
                                          className="partyA-input-field"
                                          name="partyB"
                                          value={hearingFormData.partyB}
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">Remarks</div>
                                      <div className="box-container-partyA">
                                        <textarea
                                          className="partyA-input-field"
                                          name="remarks"
                                          value={hearingFormData.remarks}
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="view-incident-partyA-container">
                                    <div className="box-container-outer-natureoffacts">
                                      <div className="title-remarks-partyA">Minutes of Dialogue</div>
                                      <div className="box-container-partyA">
                                        <textarea
                                          className="partyA-input-field"
                                          name="minutesOfDialogue"
                                          value={hearingFormData.minutesOfCaseProceedings}
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}

                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div> 
      </div>  


{/*
      {hearingData.length > 0 && hearingData.map((item, index) => {
        const hearingFormData = hearingFormDataA(item,index);

        return (
          <>
            <div className="main-content-view" key={index}>
            <div className="section-1-view">
              <h1>{hearingData[index].nos} Hearing Details</h1>
            </div>
            {hearingFields.map((field) => (
              <div className="details-section-view" key={field.key}>
                <div className="title-view">
                  <p>{field.label}</p>
                </div>
                <div className="description-view">
                  <p>{hearingFormData[field.key as keyof typeof hearingFormData]}</p>
                </div>
              </div>
            ))}
          </div>
          
          
          </>
        );    
      })}
        */}
    </main>
  );
}
