"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import { collection,doc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"

export default function DialogueSection() {
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const department = searchParam.get("department");
    const [reportData, setReportData] = useState<any>();

    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);


    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
    const [loading , setLoading] = useState(true);
    

    const handleBack = () => {
        router.back();
    };

    const handleInformationSection = (e:any) => {
        router.push(`/dashboard/IncidentModule/EditIncident?id=${docId}&department=${department}`);
    };

    const handleGenerateLetterAndInvitation = (e: any) => {
    const action = e.currentTarget.name;
    router.push(`/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${docId}&action=${action}&department=${department}`);
    };

    const handleDialogueSection = () => {
    router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}&department=${department}`);
    };

    const handleHearingSection = (e:any) => {
    router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}&department=${department}`);
    }
    
      useEffect(() => {
        if(!docId) return;
          const docRef = doc(db, "IncidentReports", docId);
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setReportData(data);
            } else {
              console.log("No such document!");
            }
          });
        setLoading(false);
        // Cleanup function to unsubscribe from the snapshot listener
          return () => unsubscribe();
        
        
      }, [docId]);
  
      useEffect(() => {
        if(reportData?.file){
          generateDownloadLink(reportData?.file, "IncidentReports").then(url => {
            if (url) setconcernImageUrl(url);
          });
        }
      },[reportData]);

      
        useEffect(() => {
        if (!docId) return;
        const docRef = doc(db, "IncidentReports", docId, "DialogueMeeting", docId);
      
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsDialogueSectionFilled(data.filled); // true or false
          } else {
            setIsDialogueSectionFilled(false); // default to false if no doc
          }
        });
      
        return () => unsubscribe();
      }, [docId]);


      useEffect(() => {
              const fetchSummonLetterStatus = async () => {
                try {
                  if (!docId) return; // Ensure docId is loaded
            
                  const lettersRef = collection(db, "IncidentReports", docId, "GeneratedLetters");
            
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
            }, [docId]);

       const [summonLetterData, setSummonLetterData] = useState<any[]>([]);
          useEffect(()=>{
              if (!docId) return;
              const colRef = query(
                  collection(db, "IncidentReports", docId, "SummonsMeeting"),
                  orderBy("createdAt", "desc")
              );
              const unsubscribe = onSnapshot(colRef, (snapshot) => {
                  const fetchedData = snapshot.docs.map(doc => doc.data());
                  setSummonLetterData(fetchedData);
              });
              return () => unsubscribe();
          },[docId]);
      
    return (
        <main className="main-container-dialogue-hearing">
            <div className="edit-incident-redirectionpage-section">
                <button className="edit-incident-redirection-buttons" onClick={handleInformationSection}>
                    <div className="edit-incident-redirection-icons-section">
                    <img src="/Images/profile-user.png" alt="user info" className="redirection-icons-info" /> 
                    </div>
                    <h1>Incident Information</h1>
                </button>

                <div className="dialogue-dropdown">
                    <button className="edit-incident-redirection-buttons-selected-dialogue-hearing">
                        <div className="edit-incident-redirection-icons-section">
                            <img src="/Images/team.png" alt="user info" className="redirection-icons-dialogue" /> 
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
                            setErrorPopup({ show: true, message: "Generate a Dialogue Letter First." });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                        }}
                        >
                        <h1>Dialogue Section</h1>
                        </button>
                    )}
                    </div>
                </div>

                <div className="hearing-dropdown">
                    <button className="edit-incident-redirection-buttons">
                    <div className="edit-incident-redirection-icons-section">
                        <img src="/Images/group-discussion.png" alt="user info" className="redirection-icons-hearing" /> 
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
                          setErrorPopup({ show: true, message: "Generate a Dialogue Letter first." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                          return;
                        }
                      
                        // ✅ Step 2: Check if dialogue section is filled
                        if (!isDialogueSectionFilled) {
                          
                          setErrorPopup({ show: true, message: "Fill out the Dialogue Section first." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                          
                          return;
                        }
                      
                        // ✅ Step 3: Check if latest summon is not yet filled
                        if(                          
                          reportData?.generatedHearingSummons > 0 &&
                          reportData?.generatedHearingSummons < 3 &&
                          reportData?.generatedHearingSummons > summonLetterData.length 
                        ) {
                        if ((!lastSummon?.filled)) { 
                            setErrorPopup({ show: true, message: `Fill out the ${summonNo[summonLetterData.length]} Hearing summons first.` });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                            return;
                          }
                        }
                        if(!reportData?.reasonForFailureToAppearDialogue){
                            setErrorPopup({ show: true, message: `Fill out Refailure Meeting (Dialogue) first.` });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                          return;
                        }
                        if(reportData?. refailureHearingDetails?.length !== reportData?.sentLetterOfFailureToAppearHearing?.length){
                          setErrorPopup({ show: true, message: "Fill out Refailure Meeting (Hearing) first." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
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
                          if(!reportData?.reasonForFailureToAppearDialogue){
                          setErrorPopup({ show: true, message: "Fill out Refailure Meeting (Dialogue) first." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000)
                          
                          return
                        }
                         if(reportData?.refailureHearingDetails.length !== reportData?.sentLetterOfFailureToAppearHearing.length){
                          setErrorPopup({ show: true, message: "Fill out Refailure Meeting (Hearing) first." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000)
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
                          setErrorPopup({ show: true, message: "Generate a Summon Letter First." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                        }}
                        >
                        <h1>Hearing Section</h1>
                        </button>
                    )}
                    </div>
                </div>
            </div>

            {reportData?.complainant && reportData?.respondent && (
                <Dialogue
                    id={docId || ""}
                    complainantName={`${reportData.complainant.fname} ${reportData.complainant.lname}`}
                    respondentName={`${reportData.respondent.fname} ${reportData.respondent.lname}`}
                />
            )}

        {errorPopup.show && (
              <div className={'popup-overlay-error show'}>
                  <div className="popup-letter">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert-letter"/>
                      <p>{errorPopup.message}</p>
                  </div>
              </div>
        )}
            


        </main>
    );

}