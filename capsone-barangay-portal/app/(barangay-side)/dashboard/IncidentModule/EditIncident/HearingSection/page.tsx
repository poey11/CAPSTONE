"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { collection, doc, query, where, orderBy, getDocs,  onSnapshot} from "firebase/firestore";
import { db } from '@/app/db/firebase';
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import MenuBar from "@/app/(barangay-side)/components/incidentMenuBar";
import Hearing from "@/app/(barangay-side)/components/hearingForm";

export default function HearingSection() {

    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const department = searchParam.get("department");
    const [reportData, setReportData] = useState<any>();

    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");

    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);
    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
    const [loading , setLoading] = useState(true);

    const [filledHearings, setFilledHearings] = useState<boolean[]>([false, false, false]);

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


    const handleBack = () => {
            router.back();
    };

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

    const [summonCount, setSummonCount] = useState(0);

        useEffect(() => {
            const fetchSummonCount = async () => {
              if (!docId) return;
          
              const colRef = query(
                collection(db, "IncidentReports", docId, "GeneratedLetters"),
                where("letterType", "==", "summon")
              );
              const snapshot = await getDocs(colRef);
              setSummonCount(snapshot.size);
            };
          
            fetchSummonCount();
          }, [docId]);

          useEffect(() => {
            if (!docId) return;
          
            const fetchFilledHearings = async () => {
              const colRef = query(
                collection(db, "IncidentReports", docId, "SummonsMeeting"),
                orderBy("nosHearing", "asc")
              );
              const snapshot = await getDocs(colRef);
              const filledArray = [false, false, false];
          
              snapshot.forEach(doc => {
                const data = doc.data();
                if (typeof data.nosHearing === "number" && data.filled) {
                  filledArray[data.nosHearing] = true;
                }
              });
          
              setFilledHearings(filledArray);
            };
          
            fetchFilledHearings();
          }, [docId]);

    
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

    const [activeSection, setActiveSection] = useState("firsthearing");
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
        <main className="main-container-edit">

            {/* TO DO: will add logic pa for the redirection and pop ups */}
            <MenuBar id = {docId||""} department={department ||  ""} />


            <div className="edit-incident-main-content">
                <div className="edit-incident-main-section1">
                    <div className="edit-incident-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Hearing Section  </h1>
                    </div>
                    
                </div>

                <div className="edit-incident-header-body-dialogue">
                    <div className="hearing-header-body-top-section-main-hearing">

                    {/*
                        {["firsthearing", "secondhearing", "thirdhearing" ].map((section) => (
                            <button
                            key={section}
                            type="button"
                            className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                            onClick={() => setActiveSection(section)}
                            >
                            {section === "firsthearing" && "First Hearing"}
                            {section === "secondhearing" && "Second Hearing"}
                            {section === "thirdhearing" && "Third Hearing"}
                            </button>
                        ))}
                    */}
                {["firsthearing", "secondhearing", "thirdhearing"].map((section, i) => {
                const isDisabled =
                    summonCount <= i || // summon letter for this hearing NOT generated yet
                    filledHearings.slice(0, i).some(filled => !filled); // previous hearings not filled

                const handleClick = () => {
                    if (summonCount <= i) {
                    setPopupErrorMessage(`Generate a Summon Letter for ${["First", "Second", "Third"][i]} Hearing first.`);
                    setShowErrorPopup(true);
                    setTimeout(() => setShowErrorPopup(false), 3000);
                    return;
                    }

                    if (filledHearings.slice(0, i).some(filled => !filled)) {
                    const hearingNames = ["First", "Second", "Third"];
                    const firstUnfilledIndex = filledHearings.findIndex((filled, idx) => idx < i && !filled);
                    setPopupErrorMessage(`Fill up ${hearingNames[firstUnfilledIndex]} Hearing first.`);
                    setShowErrorPopup(true);
                    setTimeout(() => setShowErrorPopup(false), 3000);
                    return;
                    }

                    setActiveSection(section);
                };

                            return (
                                <button
                                    key={section}
                                    type="button"
                                    className={`info-toggle-btn-main-hearing ${activeSection === section ? "active" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                    onClick={handleClick}
                                >
                                    {section === "firsthearing" && "First Hearing"}
                                    {section === "secondhearing" && "Second Hearing"}
                                    {section === "thirdhearing" && "Third Hearing"}
                                </button>
                            );
                        })}
                    </div>

                    <div className="dialogue-header-body-bottom-section">
                        <div className="dialogue-info-main-container">
                            <div className="dialogue-info-container-scrollable">
                                <div className="edit-incident-info-main-content-dialogue">

                                    {/* NOTE: separated per hearing */}

                                    {activeSection === "firsthearing" && (
                                        <>
                                            {[0].map(i => (
                                                <Hearing
                                                    key={i}
                                                    index={i}
                                                    hearing={reportData?.hearing || 0}
                                                    id={docId || ""}
                                                    status={reportData?.status || ""}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {activeSection === "secondhearing" && (
                                        <>
                                            {[1].map(i => (
                                                <Hearing
                                                    key={i}
                                                    index={i}
                                                    hearing={reportData?.hearing || 0}
                                                    id={docId || ""}
                                                    status={reportData?.status || ""}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {activeSection === "thirdhearing" && (
                                        <>
                                            {[2].map(i => (
                                                <Hearing
                                                    key={i}
                                                    index={i}
                                                    hearing={reportData?.hearing || 0}
                                                    id={docId || ""}
                                                    status={reportData?.status || ""}
                                                />
                                            ))}
                                        </>
                                    )}
                                
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
                

                




                {/*
                {reportData?.hearing && Array.from({ length: reportData.hearing }, (_, i) => (
                    <Hearing
                        key={i}
                        index={i}
                        generatedHearingSummons={reportData.generatedHearingSummons}
                        id={docId || ""}
                    />
                ))}*/}
                

                
            </div>




            {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
                    </div>
                </div>
                )}

            {showErrorPopup && (
                <div className={`error-popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                      <p>{popupErrorMessage}</p>
                    </div>
                </div>
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