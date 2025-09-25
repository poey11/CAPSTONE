"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
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
        <main className="main-container-dialogue-hearing">
            <div className="edit-incident-redirectionpage-section">
                <button className="edit-incident-redirection-buttons" onClick={handleInformationSection}>
                    <div className="edit-incident-redirection-icons-section">
                    <img src="/Images/profile-user.png" alt="user info" className="redirection-icons-info" /> 
                    </div>
                    <h1>Incident Information</h1>
                </button>

                <div className="dialogue-dropdown">
                    <button className="edit-incident-redirection-buttons">
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
                        if((reportData?.refailureHearingDetails &&Object.keys(reportData?.refailureHearingDetails).length) !== (reportData?.sentLetterOfFailureToAppearHearing&&Object.keys(reportData?.sentLetterOfFailureToAppearHearing).length)){
                            setErrorPopup({ show: true, message: `Fill out Refailure Meeting (Dialogue) first.` });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                          return;
                        }
                        if(reportData?.refailureHearingDetails?.length !== reportData?.sentLetterOfFailureToAppearHearing?.length){
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
                        if(!reportData?.reasonForFailureToAppearDialogue && reportData?.sentLetterOfFailureToAppearDialogue ){
                          setErrorPopup({ show: true, message: "Fill out Refailure Meeting (Dialogue) first." });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000)
                          
                          return
                        }
                        if((reportData?.refailureHearingDetails &&Object.keys(reportData?.refailureHearingDetails).length) !== (reportData?.sentLetterOfFailureToAppearHearing&&Object.keys(reportData?.sentLetterOfFailureToAppearHearing).length)){
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
                {(reportData?.sentLetterOfFailureToAppearDialogue) && (
                  <button className="edit-incident-redirection-buttons-selected-dialogue-hearing" type ="button" onClick={()=>{router.push(`/dashboard/IncidentModule/EditIncident/RefailureDialogue?id=${docId}&department=${department}`)}}>
                      <div className="edit-incident-redirection-icons-section">
                        <img src="/Images/team.png" alt="user info" className="redirection-icons-dialogue"/> 
                      </div>
                      <h1>Refailure Meeting (Dialogue)</h1>
                  </button>
                )}  
                {(reportData?.sentLetterOfFailureToAppearHearing && Object.keys(reportData?.sentLetterOfFailureToAppearHearing).length > 0 ) && (
                  <button className="edit-incident-redirection-buttons" type ="button" onClick={()=>{router.push(`/dashboard/IncidentModule/EditIncident/RefailureHearing?id=${docId}&department=${department}`)}}>
                    <div className="edit-incident-redirection-icons-section">
                      <img src="/Images/team.png" alt="user info" className="redirection-icons-dialogue"/> 
                    </div>
                    <h1>Refailure Meeting (Hearing)</h1>
                  </button>
                )}
            </div>
            <div className="edit-incident-main-content">
                <div className="edit-incident-main-section1">
                    <div className="edit-incident-main-section1-left">
                        <button onClick={() => router.back()} >
                        <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Incident Details </h1>
                    </div>
                </div>
                <div className="edit-incident-header-body">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 max-w-md mx-auto">
                        <div className="text-lg font-semibold text-gray-800 mb-4 flex justify-center">
                          Refailure Meeting (Dialogue)
                        </div>
                        {/* <div className="flex items-center space-x-2 mb-4">
                           <input
                              type="checkbox"
                              id="refailuredialoguepresent"
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              //checked={reportData?.refailureDialogueStatus !== "Absent"||toUpdate.refailureDialogueStatus !== "Absent"} // default checked
                              checked={
                                toUpdate.refailureDialogueStatus === "Present" ||
                                (toUpdate.refailureDialogueStatus === undefined && reportData?.refailureDialogueStatus === "Present")
                              }
                              onChange={(e) =>
                                setToUpdate((prev: any) => ({
                                  ...prev,
                                  refailureDialogueStatus: e.target.checked ? "Present" : "Absent",
                                  reasonForFailureToAppearDialogue: e.target.checked
                                    ? "" // 🔹 clear when switching back to Present
                                    : "Respondent Absent", // auto-set when Absent
                                }))
                              }
                              disabled={!!reportData?.reasonForFailureToAppearDialogue?.trim()}
                            />
                            <label
                              htmlFor="refailuredialoguepresent"
                              className="text-gray-700 font-medium"
                            >
                              Respondent Present
                            </label>
                        </div> */}
                            
                          {/* Textarea */}
                        <div className="mb-4">
                            <label
                              htmlFor="reasonForFailureToAppearDialogue"
                              className="block text-gray-600 font-medium mb-2"
                            >
                              Reason for Failure to Appear During Dialogue Meeting
                            </label>
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
                              className={`w-full min-h-[100px] p-3 border border-gray-300 rounded-lg shadow-sm 
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700
                                ${toUpdate.refailureDialogueStatus === "Absent" ? "bg-gray-100 cursor-not-allowed" : ""}
                                disabled:cursor-not-allowed disabled:bg-gray-100`}
                            />


                        </div>
                            
                          {/* Submit button */}
                        <button
                            type="button"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 
                                       rounded-lg shadow-md transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            // onClick={handleSubmitRefailureDialogue}
                            disabled={
                              !!(
                                  reportData?.reasonForFailureToAppearDialogue?.trim()
                                )
                            }

                            onClick={() => {
                              if (
                                toUpdate.refailureDialogueStatus === "Present" &&
                                toUpdate.reasonForFailureToAppearDialogue === "" ||
                                !toUpdate.reasonForFailureToAppearDialogue
                              ) {
                                
                                setErrorPopup({ show: true, message: "Please fill out the reason for failure to appear." });
                                setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                                return;
                              }
                              if(!docId) return;
                              const docRef = doc(db, "IncidentReports", docId );
                               updateDoc(docRef, {
                                //refailureDialogueStatus: toUpdate.refailureDialogueStatus || "Absent",
                                reasonForFailureToAppearDialogue: toUpdate.reasonForFailureToAppearDialogue || reportData?.reasonForFailureToAppearDialogue || "",
                              })

                              setErrorPopup({ show: true, message: "Refailure Dialogue Updated Successfully"});
                                setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);

                            }}
                          >
                            Submit
                        </button>
                    </div>
                </div>
                
            </div>

           

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