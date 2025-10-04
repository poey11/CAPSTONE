"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import "@/CSS/IncidentModule/Letters.css";
import MenuBar from "@/app/(barangay-side)/components/incidentMenuBar";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { collection,doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const docId = searchParams.get("id");
    const department = searchParams.get("department");
    const [reportData, setReportData] = useState<any>(null);
    const [summonLetterData, setSummonLetterData] = useState<any[]>([]);
    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    // wala yung success pop up here!!!!
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [activeSection, setActiveSection] = useState("meeting");

    
    console.log(docId)
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
        // Cleanup function to unsubscribe from the snapshot listener
          return () => unsubscribe();
        
        
    }, [docId]);

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
    const [toUpdate, setToUpdate] = useState<any|null>({
          complainant: {
            fname: "",
            lname: "",
            sex: "",
            age: "",
            civilStatus: "",
            address: "",
            contact: "",
          },
          respondent: {
            fname: "",
            lname: "",
            sex: "",
            age: "",
            civilStatus: "",
            address: "",
            contact: "",
          },
          fname: "",
          lname: "",
          nature: "",
          location: "",
          status: reportData?.status,
          nosofMaleChildren: "",
          nosofFemaleChildren: "",
          
          
          refailureDialogueStatus:"Present",
          reasonForFailureToAppearDialogue: reportData?.reasonForFailureToAppearDialogue || "",
        });

        const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
        
            setToUpdate((prevState: any) => {
              if (type === "file") {
                const fileInput = e.target as HTMLInputElement;
                if (fileInput.files && fileInput.files.length > 0) {
                  const file = fileInput.files[0];
        
                  const keys = name.split(".");
                  if (keys.length === 2) {
                    return {
                      ...prevState,
                      [keys[0]]: {
                        ...prevState[keys[0]],
                        [keys[1]]: file, // Store the file object
                      },
                    };
                  }
        
                  return {
                    ...prevState,
                    [name]: file,
                  };
                }
              }
        
              let newValue: any = value;
        
              // ✅ Prevent negative numbers
              if (type === "number") {
                const numericValue = Number(value);
                if (numericValue < 0) return prevState; // Do not update if negative
                newValue = numericValue;
              }
        
              // Handle nested fields (text/select inputs)
              const keys = name.split(".");
              if (keys.length === 2) {
                return {
                  ...prevState,
                  [keys[0]]: {
                    ...prevState[keys[0]],
                    [keys[1]]: newValue,
                  },
                };
              }
        
              return {
                ...prevState,
                [name]: newValue,
              };
            });
        };
      return (
        <main className="main-container-refailure-dialogue">
            <MenuBar id = {docId||""} department={department ||  ""} />

            <div className="edit-incident-main-content-refailure-dialogue">
                <div className="edit-incident-main-section1">
                    <div className="edit-incident-main-section1-left">
                        <button onClick={() => router.back()} >
                        <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Refailure Meeting (Dialogue) </h1>
                    </div>
                    <div className="action-btn-section">
  {!(reportData?.reasonForFailureToAppearDialogue?.trim()) && (
    <button
      type="button"
      className={`
        action-save-refailure 
        w-full font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200
      `}
      onClick={() => {
        if (
          (toUpdate.refailureDialogueStatus === "Present" &&
            (toUpdate.reasonForFailureToAppearDialogue === "" ||
              !toUpdate.reasonForFailureToAppearDialogue))
        ) {
          setErrorPopup({
            show: true,
            message: "Please fill out the reason for failure to appear.",
          });
          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
          return;
        }

        if (!docId) return;

        const docRef = doc(db, "IncidentReports", docId);
        updateDoc(docRef, {
          reasonForFailureToAppearDialogue:
            toUpdate.reasonForFailureToAppearDialogue ||
            reportData?.reasonForFailureToAppearDialogue ||
            "",
        });

        setPopupMessage("Refailure Dialogue Updated Successfully");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
        setTimeout(() => {
          router.push(
            `/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${docId}&action=summon&department=${department}`
          );
        }, 2000);
      }}
    >
      Submit
    </button>
  )}
</div> 
                    
                </div>
                <div className="edit-incident-header-body-refailure-dialogue">
                  <div className="dialogue-header-body-top-section">
                        <div className="edit-incident-info-toggle-wrapper">
                            {[ "meeting" ].map((section) => (
                                <button
                                key={section}
                                type="button"
                                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                                onClick={() => setActiveSection(section)}
                                >
                                {section === "meeting" && "Refailure Meeting"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="dialogue-header-body-bottom-section">
                      <div className="dialogue-info-main-container">
                        <div className="dialogue-info-container-scrollable">
                          <div className="edit-incident-info-main-content-dialogue">
                            {activeSection === "meeting" && (
                              <>
                                <div className="edit-incident-dialoguerefailure-content">
                                  <div className="edit-incident-content-dialogue-refailure">
                                    <div className="view-incident-dialogue-remarks-container-update">
                                      <div className="box-container-outer-remarks-dialogue-update">
                                        <div className="title-remarks-dialogue-refailure-update">
                                          Reason for Failure to Appear During Dialogue Meeting
                                        </div>

                                        <div className="box-container-remarks-dialogue-update">
                                          <span className="required-asterisk-incident-update">*</span>    
                                          <textarea
                                            placeholder="Enter reason here..."
                                            name="reasonForFailureToAppearDialogue"
                                            id="reasonForFailureToAppearDialogue"
                                            value={
                                              toUpdate.reasonForFailureToAppearDialogue ||
                                              reportData?.reasonForFailureToAppearDialogue ||
                                              ""
                                            }
                                            disabled={
                                              toUpdate.refailureDialogueStatus === "Absent" ||
                                              !!reportData?.reasonForFailureToAppearDialogue?.trim()
                                            }
                                            onChange={(e) => {
                                              if (toUpdate.refailureDialogueStatus === "Present") {
                                                handleFormChange(e); // only allow typing if Present
                                              }
                                            }}
                                            className={`
                                              remarks-input-field-dialogue-update
                                              ${toUpdate.refailureDialogueStatus === "Absent" ? "cursor-not-allowed" : ""}
                                              disabled:cursor-not-allowed
                                            `}
                                          />
                                        </div>
                                      </div>

                                      
                                    </div>               
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
            </div>

           

              {showPopup && (
                <div className={`popup-overlay-add show`}>
                    <div className="popup-add">
                      <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                      <p>{popupMessage}</p>
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