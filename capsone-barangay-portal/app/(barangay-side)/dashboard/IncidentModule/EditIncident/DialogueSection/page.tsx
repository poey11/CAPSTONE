"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import { collection,doc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import Dialogue from "@/app/(barangay-side)/components/dialogueForm"
import MenuBar from "@/app/(barangay-side)/components/incidentMenuBar";


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
            <MenuBar id = {docId||""} department={department ||  ""} />


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