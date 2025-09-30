"use client"
import "@/CSS/IncidentModule/EditIncident.css";
import { ChangeEvent,useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { generateDownloadLink } from "@/app/helpers/firestorehelper";
import { doc, updateDoc, collection, where, getDocs, query, onSnapshot, deleteDoc, orderBy} from "firebase/firestore";
import { db } from "@/app/db/firebase";
import React from "react";
import { report } from "process";

interface IncidentMenuBarProps {
  id: string;
  department: string;
  action?: string;
}

const incidentMenuBar: React.FC<IncidentMenuBarProps> = ({ id, department, action }) => {
    const router = useRouter();
    const pathname = usePathname();
    const path = pathname.split("?")[0]; 
    const lastSegment = path.split("/").pop();
    const secondToTheLastSegment = path.split("/").slice(-2, -1)[0];

    const [reportData, setReportData] = useState<any | null>(null);
    useEffect(() => {
      if(!id) return;
        const docRef = doc(db, "IncidentReports", id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setReportData(data);
          } else {
            console.log("No such document!");
          }
        });
        return () => unsubscribe();
    }, [id]);

    console.log("Report Data in Menu Bar: ", reportData);
    const [summonLetterData, setSummonLetterData] = useState<any[]>([]); 
    useEffect(()=>{
        if (!id) return;
        const colRef = query(
            collection(db, "IncidentReports", id, "SummonsMeeting"),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const fetchedData = snapshot.docs.map(doc => doc.data());
            setSummonLetterData(fetchedData);
        });
        return () => unsubscribe();
    },[id]);

    const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);
    useEffect(() => {
      if (!id) return;
      const docRef = doc(db, "IncidentReports", id, "DialogueMeeting", id);
    
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsDialogueSectionFilled(data.filled); // true or false
        } else {
          setIsDialogueSectionFilled(false); // default to false if no doc
        }
      });
    
      return () => unsubscribe();
    }, [id]);


    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    useEffect(() => {
        const fetchSummonLetterStatus = async () => {
          try {
            if (!id) return; // Ensure docId is loaded
      
            const lettersRef = collection(db, "IncidentReports", id, "GeneratedLetters");
      
            const q = query(lettersRef, where("letterType", "==", "summon"));
            const snapshot = await getDocs(q);
      
            if (!snapshot.empty) {
              setHasSummonLetter(true);
            } else {
              setHasSummonLetter(false); // Optional fallback
            }
          } catch (error) {
            console.error("Error checking summon letters:", error);
          }
        };
      
        fetchSummonLetterStatus();
    }, [id]);

    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);

    const handleGenerateLetterAndInvitation = (e: any) => {
    const action = e.currentTarget.name;
        router.push(`/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${id}&action=${action}&department=${department}`);
    };

    const handleDialogueSection = () => {
        router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${id}&department=${department}`);
    };

    const handleHearingSection = (e:any) => {
        router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${id}&department=${department}`);
    };
    if (!reportData) {
        return (
            <div className="edit-incident-redirectionpage-section">
            <p>Loading incident data...</p>
            </div>
        );
    }

	return (
		<div className="edit-incident-redirectionpage-section">
            <button className= {lastSegment ==="EditIncident" ? "edit-incident-redirection-buttons-selected" : "edit-incident-redirection-buttons"} type="button" onClick={()=>{
                router.push(`/dashboard/IncidentModule/EditIncident?id=${id}&department=${department}`)
            }}>
              <div className="edit-incident-redirection-icons-section">
                <img src="/Images/profile-user.png" alt="user info" className="redirection-icons-info"/> 
              </div>
              <h1>Incident Information</h1>
            </button>
          
            {(reportData?.typeOfIncident === "Major" || reportData?.typeOfIncident === "Minor")  && (
              <>
                <div className="dialogue-dropdown">
                  <button className = {((lastSegment === "LetterAndInvitation" && action === "dialogue") || (lastSegment === "DialogueSection"))? "edit-incident-redirection-buttons-selected" :"edit-incident-redirection-buttons"} >
                    <div className="edit-incident-redirection-icons-section">
                      <img src="/Images/team.png" alt="user info" className="redirection-icons-dialogue"/> 
                    </div>
                    <h1>Dialogue Meeting</h1>
                  </button>

                  <div className="dialogue-submenu">
                    <button className="submenu-button" name="dialogue" onClick={handleGenerateLetterAndInvitation}>
                      <h1>Generate Dialogue Letters</h1>
                    </button>

                    {reportData?.isDialogue ? (
                      <button className="submenu-button" name="section" onClick={handleDialogueSection}>
                        <h1>Dialogue Section</h1>
                      </button>
                    ) : (
                      <button
                        className="submenu-button"
                        name="section"
                        onClick={() => {
                          setPopupErrorMessage("Generate A Dialogue Letter First");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                        }}
                      >
                        <h1>Dialogue Section</h1>
                      </button>
                    )}

                    
                    
                  </div>
                </div>

                <div className="hearing-dropdown">
                  <button className = {((lastSegment === "LetterAndInvitation" && action === "summon") || (lastSegment === "HearingSection"))? "edit-incident-redirection-buttons-selected" :"edit-incident-redirection-buttons"} >
                    <div className="edit-incident-redirection-icons-section">
                      <img src="/Images/group-discussion.png" alt="user info" className="redirection-icons-hearing"/> 
                    </div>
                    <h1>Hearing Section</h1>
                  </button>

                  <div className="hearing-submenu">
                    <button
                      className="submenu-button"
                      name="summon"
                      onClick={(e) => {
                        const lastSummon = summonLetterData[summonLetterData.length];
                        const summonNo = ["First", "Second", "Third"];
                      
                        
                        if (reportData?.isDialogue === false) {
                          setPopupErrorMessage("Generate a Dialogue Letter first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return;
                        }
                      
                        // ✅ Step 2: Check if dialogue section is filled
                        if (!isDialogueSectionFilled) {
                          setPopupErrorMessage("Fill out the Dialogue Section first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return;
                        }
                      
                        // ✅ Step 3: Check if latest summon is not yet filled 
                        if( 
                            
                          reportData?.generatedHearingSummons > 0 &&
                          reportData?.generatedHearingSummons < 3 &&
                          reportData?.generatedHearingSummons > summonLetterData.length

                          ) {
                          if ((!lastSummon?.filled)) {
                            setPopupErrorMessage(`Fill out the ${summonNo[summonLetterData.length]} Hearing summons first.`);
                            setShowErrorPopup(true);
                            setTimeout(() => setShowErrorPopup(false), 3000);
                            return;
                          }
                        }
                      
                        

                        if((reportData?.refailureHearingDetails &&Object.keys(reportData?.refailureHearingDetails).length) !== (reportData?.sentLetterOfFailureToAppearHearing&&Object.keys(reportData?.sentLetterOfFailureToAppearHearing).length)){
                          setPopupErrorMessage("Fill out Refailure Meeting (Hearing) first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return;
                        }

                        if(!reportData?.sentLetterOfFailureToAppearDialogue){
                          setPopupErrorMessage("Fill out Refailure Meeting (Dialogue) first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return;
                        }

                        if(!reportData?.reasonForFailureToAppearDialogue){
                          setPopupErrorMessage("Fill out Refailure Meeting (Dialogue) first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return;
                        }
                        // ✅ All good
                        handleGenerateLetterAndInvitation(e);
                      }}
                    >
                      <h1>Generate Summon Letters</h1>
                    </button>




                    {hasSummonLetter ? (
                      <button className="submenu-button" name="section" onClick={(e)=>{
                        if(reportData?.sentLetterOfFailureToAppearDialogue && !reportData?.reasonForFailureToAppearDialogue){
                          setPopupErrorMessage("Fill out Refailure Meeting (Dialogue) first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return
                        }
                        if((reportData?.refailureHearingDetails &&Object.keys(reportData?.refailureHearingDetails).length) !== (reportData?.sentLetterOfFailureToAppearHearing&&Object.keys(reportData?.sentLetterOfFailureToAppearHearing).length)){
                          setPopupErrorMessage("Fill out Refailure Meeting (Hearing) first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                          return;
                        }
                          handleHearingSection(e);
                
                        }
                      }>
                        <h1>Hearing Section</h1>
                      </button>
                    ) : (
                      <button
                        className="submenu-button"
                        name="section"
                        onClick={() => {
                          
                          setPopupErrorMessage("Generate a Summon Letter First");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                        }}
                      >
                        <h1>Hearing Section</h1>
                      </button>
                    )}
                  </div>

                  
                  

                </div>
                
                {(reportData?.respondentAbsentInDialogue === true) && (
                  <div className="dialogue-dropdown">
                      <button className = {((lastSegment === "RefailureDialogue" || (lastSegment === "RefailureInfo" && secondToTheLastSegment === "RefailureDialogue")))? 
                        "edit-incident-redirection-buttons-selected" :"edit-incident-redirection-buttons"} >

                        <div className="edit-incident-redirection-icons-section">
                            <img src="/Images/team.png" alt="user info" className="redirection-icons-dialogue" /> 
                        </div>
                        <h1>Refailure Meeting (Dialogue)</h1>
                    </button>

                    <div className="dialogue-submenu">
                    <button className="submenu-button" name="dialogue" onClick={() => router.push(`/dashboard/IncidentModule/EditIncident/RefailureDialogue/RefailureInfo?id=${id}&department=${department}`)}>
                        <h1>Generate Refailure Letters</h1>
                    </button>

                    {reportData?.sentLetterOfFailureToAppearDialogue === true ? (
                        <button className="submenu-button" name="section" onClick={() => router.push(`/dashboard/IncidentModule/EditIncident/RefailureDialogue?id=${id}&department=${department}`)}>
                        <h1>Refailure Meeting Section</h1>
                        </button>
                    ) : (
                        <button
                        className="submenu-button"
                        name="section"
                        onClick={() => {
                          
                          setPopupErrorMessage("Fill up Refailure Meeting (Dialogue) first.");
                          setShowErrorPopup(true);
                          setTimeout(() => setShowErrorPopup(false), 3000);
                        }}
                        >
                        <h1>Refailure Meeting Section</h1>
                        </button>
                    )}
                    </div>
                </div>
                )}  
                  {Object.keys(reportData || {}).some(
                    key => key.startsWith("respondentAbsentInHearing") && reportData[key] === true
                  ) && (
                  <div className="hearing-dropdown">
                      <button className = {((lastSegment === "RefailureHearing" || (lastSegment === "RefailureInfo" && secondToTheLastSegment === "RefailureHearing")))? 
                        "edit-incident-redirection-buttons-selected" :"edit-incident-redirection-buttons"} >
                        <div className="edit-incident-redirection-icons-section">
                            <img src="/Images/group-discussion.png" alt="user info" className="redirection-icons-hearing" />
                        </div>
                        <h1>Refailure Meeting (Hearing)</h1>
                    </button>
                    <div className="hearing-submenu">
                    <button className="submenu-button" name="summon" onClick={() => router.push(`/dashboard/IncidentModule/EditIncident/RefailureHearing/RefailureInfo?id=${id}&department=${department}`)}>
                        <h1>Generate Refailure Letters</h1>
                    </button>
                    {reportData?.sentLetterOfFailureToAppearHearing && Object.keys(reportData?.sentLetterOfFailureToAppearHearing).length > 0 ? (
                        <button className="submenu-button" name="section" onClick={() => router.push(`/dashboard/IncidentModule/EditIncident/RefailureHearing/RefailureInfo?id=${id}&department=${department}`)}>
                        <h1>Refailure Meeting Section</h1>
                        </button>
                    ) : (
                        <button
                        className="submenu-button"
                        name="section"
                        onClick={() => {
                          router.push(`/dashboard/IncidentModule/EditIncident/RefailureHearing?id=${id}&department=${department}`);
                        }}>
                        <h1>Refailure Meeting Section</h1>
                        </button>
                    )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
            )}
                       
        </div>
	);
}

export default incidentMenuBar;
