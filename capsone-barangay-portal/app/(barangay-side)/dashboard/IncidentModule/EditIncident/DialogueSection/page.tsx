"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import { collection,doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"

export default function DialogueSection() {
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
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
        router.push(`/dashboard/IncidentModule/EditIncident?id=${docId}`);
    };

    const handleGenerateLetterAndInvitation = (e:any) => {
        const action = e.currentTarget.name;
        router.push(`/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${docId}?action=${action}`);
    };
  
    const handleDialogueSection = () => {
        router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}`);
    };
  
    const handleHearingSection = () => {
        router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}`);
    };

    useEffect(() => {
        if(docId){
          getSpecificDocument("IncidentReports", docId, setReportData).then(() => setLoading(false));
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


      useEffect(() => {
              if (!docId) return; // or use `id` or whatever your incident ID is called
              const docRef = doc(db, "IncidentReports", docId, "DialogueMeeting", docId);
            
              const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.filled === true) {
                    setIsDialogueSectionFilled(true);
                  }
                }
              });
            
              return () => unsubscribe();
            }, [docId]);
  


    return (
        <main className="main-container-dialogue-hearing">
            <div className="edit-incident-redirectionpage-section">
                <button className="edit-incident-redirection-buttons" onClick={handleInformationSection}>
                    <div className="edit-incident-redirection-icons-section">
                    <img src="/images/profile-user.png" alt="user info" className="redirection-icons-info" /> 
                    </div>
                    <h1>Incident Information</h1>
                </button>

                <div className="dialogue-dropdown">
                    <button className="edit-incident-redirection-buttons-selected-dialogue-hearing">
                        <div className="edit-incident-redirection-icons-section">
                            <img src="/images/team.png" alt="user info" className="redirection-icons-dialogue" /> 
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
                        <img src="/images/group-discussion.png" alt="user info" className="redirection-icons-hearing" /> 
                    </div>
                    <h1>Hearing Section</h1>
                    </button>

                    <div className="hearing-submenu">
                    {reportData?.isDialogue ? (
                        isDialogueSectionFilled ? (
                        <button className="submenu-button" name="summon" onClick={handleGenerateLetterAndInvitation}>
                            <h1>Generate Summon Letters</h1>
                        </button>
                        ) : (
                        <button
                            className="submenu-button"
                            name="summon"
                            onClick={() => {
                            setErrorPopup({ show: true, message: "Fill out the Dialogue Section first." });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                            }}
                        >
                            <h1>Generate Summon Letters</h1>
                        </button>
                        )
                    ) : (
                        <button
                        className="submenu-button"
                        name="summon"
                        onClick={() => {
                            setErrorPopup({ show: true, message: "Generate a Dialogue Letter First." });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                        }}
                        >
                        <h1>Generate Summon Letters</h1>
                        </button>
                    )}

                    {hasSummonLetter ? (
                        <button className="submenu-button" name="section" onClick={handleHearingSection}>
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