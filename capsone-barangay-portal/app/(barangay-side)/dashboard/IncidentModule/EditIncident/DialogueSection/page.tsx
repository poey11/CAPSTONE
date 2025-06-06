"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"

export default function DialogueSection() {
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [reportData, setReportData] = useState<any>();

    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");

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
  


    return (
        <main className="main-container-edit">
            <div className="edit-incident-redirectionpage-section">
                <button className="edit-incident-redirection-buttons" onClick={handleInformationSection}>
                    <div className="edit-incident-redirection-icons-section">
                        <img src="/images/profile-user.png" alt="user info" className="redirection-icons-info"/> 
                    </div>
                    <h1>Incident Information</h1>
                </button>

                <div className="dialogue-dropdown">
                    <button className="edit-incident-redirection-buttons">
                        <div className="edit-incident-redirection-icons-section">
                        <img src="/images/team.png" alt="user info" className="redirection-icons-dialogue"/> 
                        </div>
                        <h1>Dialogue Meeting</h1>
                    </button>

                    <div className="dialogue-submenu">
                        <button className="submenu-button" name="dialogue" onClick={handleGenerateLetterAndInvitation}>
                            <h1>Generate Dialogue Letters</h1>
                        </button>

                        <button className="submenu-button" name="section" onClick={handleDialogueSection}>
                            <h1>Dialogue Section</h1>
                        </button>
                    </div>
                </div>

                <div className="hearing-dropdown">
                    <button className="edit-incident-redirection-buttons">
                        <div className="edit-incident-redirection-icons-section">
                            <img src="/images/group-discussion.png" alt="user info" className="redirection-icons-hearing"/> 
                        </div>
                        <h1>Hearing Section</h1>
                    </button>

                    <div className="hearing-submenu">
                        {reportData?.isDialogue ? (
                        <button className="submenu-button" name="summon" onClick={handleGenerateLetterAndInvitation}>
                            <h1>Generate Summon Letters</h1>
                        </button>
                        ) : (
                        <button
                            className="submenu-button"
                            name="summon"
                            onClick={() => {
                            setPopupErrorMessage("Generate A Dialogue Letter First");
                            setShowErrorPopup(true);
                            setTimeout(() => setShowErrorPopup(false), 3000);
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
                            setPopupErrorMessage("Generate A Summon Letter First");
                            setShowErrorPopup(true);
                            setTimeout(() => setShowErrorPopup(false), 3000);
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
            


        </main>
    );

}