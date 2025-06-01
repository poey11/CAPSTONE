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
  const [activeSection, setActiveSection] = useState("complainant");

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
    name: reportData?.complainant.fname + " " + reportData?.complainant.lname,
    contact: reportData?.complainant.contact,
    address:reportData?.complainant.address,
    civilStatus: reportData?.complainant.civilStatus,
    sex: reportData?.complainant.sex,
    age: reportData?.complainant.age,
  }

  const respondent =  {
    name: reportData?.respondent.fname + " " + reportData?.respondent.lname,
    contact: reportData?.respondent.contact,
    address:reportData?.respondent.address,
    civilStatus: reportData?.respondent.civilStatus,
    sex: reportData?.respondent.sex,
    age: reportData?.respondent.age,
  }


  const deskOfficerData =  {
    name: reportData?.receivedBy,
    dateTimeReceived:  reportData?.dateReceived + " " + reportData?.timeReceived,
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


  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
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
              {["complainant", "respondent", "barangay desk" , "incident"].map((section) => (
                <button
                  key={section}
                  type="button"
                  className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                >
                  {section === "complainant" && "Complainant"}
                  {section === "respondent" && "Respondent"}
                  {section === "barangay desk" && "Barangay Desk Officer"}
                  {section === "incident" && "Incident"}
                </button>
              ))}
            </div>  
          </div>

          <div className="view-incident-header-body-bottom-section">
            <div className="incident-main-details-container">
              <div className="incident-main-details-section">
                <div className="incident-main-details-topsection">
                  <h1>LPN - CHJGDQ - 0015</h1>
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
                        <h1>Description</h1>
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
                      <div className="view-incident-content-left-side">
                        <div className="view-incident-fields-section">
                          <p>Full Name</p>
                          <input type="text" className="view-incident-input-field" name="complainantName" value={complainantsData.name || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Civil Status</p>
                          <input type="text" className="view-incident-input-field" name="complainantCivilStatus" value={complainantsData.civilStatus || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Age</p>
                          <input type="text" className="view-incident-input-field" name="complainantAge" value={complainantsData.age || "N/A"} required readOnly />
                        </div>
                      </div>

                      <div className="view-incident-content-right-side">
                        <div className="view-incident-fields-section">
                          <p>Sex</p>
                          <input type="text" className="view-incident-input-field" name="complainantSex" value={complainantsData.sex || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Address</p>
                          <input type="text" className="view-incident-input-field" name="complainantAddress" value={complainantsData.address || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Contact Number</p>
                          <input type="text" className="view-incident-input-field" name="complainantContact" value={complainantsData.contact || "N/A"} required readOnly />
                        </div>
                      </div>
                    </>
                  )}

                  {activeSection === "respondent" && (
                    <>
                      <div className="view-incident-content-left-side">
                        <div className="view-incident-fields-section">
                          <p>Full Name</p>
                          <input type="text" className="view-incident-input-field" name="respondentName" value={respondent.name || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Civil Status</p>
                          <input type="text" className="view-incident-input-field" name="respondentCivilStatus" value={respondent.civilStatus || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Age</p>
                          <input type="text" className="view-incident-input-field" name="respondentAge" value={respondent.age || "N/A"} required readOnly />
                        </div>
                      </div>

                      <div className="view-incident-content-right-side">
                        <div className="view-incident-fields-section">
                          <p>Sex</p>
                          <input type="text" className="view-incident-input-field" name="respondentSex" value={respondent.sex || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Address</p>
                          <input type="text" className="view-incident-input-field" name="respondentAddress" value={respondent.address || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Contact Number</p>
                          <input type="text" className="view-incident-input-field" name="respondentContact" value={respondent.contact || "N/A"} required readOnly />
                        </div>
                      </div>
                    </>
                  )}
                  {activeSection === "barangay desk" && (
                    <>
                      <div className="view-incident-content-left-side">
                        <div className="view-incident-fields-section">
                          <p>Full Name</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerName" value={deskOfficerData.name || "N/A"} required readOnly />
                        </div>
                      </div>

                      <div className="view-incident-content-right-side">
                        <div className="view-incident-fields-section">
                          <p>Date & Time Signed</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerDateTimeReceived" value={deskOfficerData.dateTimeReceived || "N/A"} required readOnly />
                        </div>
                      </div>

                    </>
                  )}

                  {activeSection === "incident" && (
                    <>
                      <div className="view-incident-content-left-side">
                        <div className="view-incident-fields-section">
                          <p>Nature</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerName" value={otherinformation.nature || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Date & Time Signed</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerDateTimeReceived" value={otherinformation.date || "N/A"} required readOnly />
                        </div>
                        <div className="view-incident-fields-section">
                          <p>Location</p>
                          <input type="text" className="view-incident-input-field" name="deskOfficerDateTimeReceived" value={otherinformation.location || "N/A"} required readOnly />
                        </div>
                      </div>

                      <div className="view-incident-content-right-side">
                        
                      </div>

                    </>
                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

        
      </div>
          

     
      <div className="main-content-view">

        <div className="section-1-view">

       
        <div className="viewincident-content-section1-left-view">

            <button type="submit" className="back-button-view" onClick={handleViewLupon}></button>
  
             <h1>Complainant's Details</h1>

        </div>

          <div className="status-section-view">
              <p className={`status-badge-view ${getStatusClass(status)}`}>{status}</p> 
          </div>
          
        </div>


        {complainantsFields.map((field) => (
          <div className="details-section-view" key={field.key}>
            <div className="title-view">
              <p>{field.label}</p>
            </div>
            <div className="description-view">
              <p>{complainantsData[field.key as keyof typeof complainantsData]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content-view">
        <div className="section-1-view">
          <h1>Respondent's Details</h1>
        </div>

        {respondentsField.map((field) => (
          <div className="details-section-view" key={field.key}>
            <div className="title-view">
              <p>{field.label}</p>
            </div>
            <div className="description-view">
              <p>{respondent[field.key as keyof typeof respondent]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content-view">
        <div className="section-1-view">
          <h1>Barangay Desk Officer's Details</h1>
        </div>

        {deskOfficerFields.map((field) => (
          <div className="details-section-view" key={field.key}>
            <div className="title-view">
              <p>{field.label}</p>
            </div>
            <div className="description-view">
              <p>{deskOfficerData[field.key as keyof typeof deskOfficerData]}</p>
            </div>
          </div>
       ))}
      </div>

      <div className="main-content-view">
        <div className="section-1-view">
          <h1>Incident Information</h1>
        </div>

        {otherinformationFields.map((field) => (
          <div className="details-section-view" key={field.key}>
            <div className="title-view">
              <p>{field.label}</p>
            </div>
            <div className="description-view">
              {field.key === "image" ? (
                otherinformation.image ? ( // ✅ Check if image exists
                  <>
                    <a href={otherinformation.image} target="_blank" rel="noopener noreferrer">
                      <img
                        src={otherinformation.image}
                        alt="Incident Image"
                        style={{ cursor: "pointer" , width: '30%', height: '100%', marginRight: '5px' }}
                      />
                    </a>
                  </>
                ) : (
                  // ✅ Show fallback text when no image is available
                  <p style={{ color: "gray", fontStyle: "italic" }}>No image available</p>
                )
              ) : (
                <p>{otherinformation[field.key as keyof typeof otherinformation]}</p>
              )}
            </div>
            {departId === "GAD" && field.key === "location" && (
              <>
               
                <div className="title-view">
                  <p>Nos of Male Children Victim/s</p>
                </div>
                <div className="description-view">
                    <p>{reportData?.nosofMaleChildren}</p>
                </div>
                <div className="title-view">
                  <p>Nos of Female Children Victim/s</p>
                </div>
                <div className="description-view">
                    <p>{reportData?.nosofFemaleChildren}</p>
                </div>
              </>
            )} 
          </div>
          
        
       ))}
         
       
      </div>

      
        
      {dialogueData && (
        <div className="main-content-view">
          <div className="section-1-view">
            <h1>Dialogue Details</h1>
          </div>

          {dialogueFields.map((field) => (
            <div className="details-section-view" key={field.key}>
              <div className="title-view">
                <p>{field.label}</p>
              </div>
              <div className="description-view">
                <p>{dialogueFormData[field.key as keyof typeof dialogueFormData]}</p>
              </div>
            </div>
         ))}
        </div>
      )}
     
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

        

      

    </main>
  );
}
