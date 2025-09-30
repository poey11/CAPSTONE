"use client";
import "@/CSS/IncidentModule/EditIncident.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";
import { collection,doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import MenuBar from "@/app/(barangay-side)/components/incidentMenuBar";


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
          
          
          reasonForFailureToAppearDialogue: reportData?.reasonForFailureToAppearDialogue || "",
        });
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
      

      console.log("reportData", reportData);
     return (
        <main className="main-container-dialogue-hearing">
          <MenuBar id = {docId||""} department={department ||  ""} />
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
           {reportData?.sentLetterOfFailureToAppearHearing && Object.keys(reportData.sentLetterOfFailureToAppearHearing).length > 0 && (
              <>
                {Object.entries(reportData?.sentLetterOfFailureToAppearHearing).map(
                  ([key, value]) => (
                    <div key={key} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 max-w-md mx-auto">
                      <div className="text-lg font-semibold text-gray-800 mb-4 flex justify-center">
                        Refailure Meeting ({Number(key) === 0 ? (<>First</>) : Number(key) === 1 ? (<>Second</>) : Number(key) === 2 && (<>Third</>)} Hearing)
                      </div>
                      {/* <div className="flex items-center space-x-2 mb-4">
                       <input
                          type="checkbox"
                          id={`refailureHearingStatus${key}`}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={
                            //(toUpdate[`refailureHearingStatus${key}`] ?? reportData?.refailureHearingDetails?.[key]?.status) !== "Absent"
                            toUpdate[`refailureHearingStatus${key}`] === "Present" ||
                            (toUpdate[`refailureHearingStatus${key}`] === undefined && reportData?.refailureHearingDetails?.[key]?.resStatus === "Present")
                          }                                          
                          onChange={(e) =>
                            setToUpdate((prev: any) => ({
                              ...prev,
                              [`refailureHearingStatus${key}`]: e.target.checked ? "Present" : "Absent",
                              [`reasonForFailureToAppearHearing${key}`]: e.target.checked
                                ? "" // 🔹 clear when switching back to Present
                                : "Respondent Absent", // auto-set when Absent
                            }))
                          }
                          disabled={
                              !!(typeof reportData?.refailureHearingDetails?.[key]?.reason === "string" && reportData?.refailureHearingDetails?.[key]?.reason.trim())
                          }
                        />
                        <label
                          htmlFor={`refailureHearingStatus${key}`}
                          className="text-gray-700 font-medium"
                        >
                          Respondent Present
                        </label>
                        
                        
                      </div> */}
                        
                      {/* Textarea */}
                      <div className="mb-4">
                        <label
                          htmlFor={`reasonForFailureToAppearHearing${key}`}
                          className="block text-gray-600 font-medium mb-2"
                        >
                          Reason for Failure to Appear During Hearing Meeting
                        </label>
                        <textarea
                          placeholder="Enter reason here..."
                          name={`reasonForFailureToAppearHearing${key}`}
                          id={`reasonForFailureToAppearHearing${key}`}
                          value={
                            // toUpdate[`reasonForFailureToAppearHearing${key}`] ||
                            // reportData[`reasonForFailureToAppearHearing${key}`] ||""
                            toUpdate[`reasonForFailureToAppearHearing${key}`] !== undefined
                              ? toUpdate[`reasonForFailureToAppearHearing${key}`]
                              : reportData?.refailureHearingDetails?.[key]?.reason || ""
                          }
                          disabled={
            
                              !!(typeof reportData?.refailureHearingDetails?.[key]?.reason === "string" && reportData?.refailureHearingDetails?.[key]?.reason.trim())
                          
                          }
                          onChange={(e) => {
                            
                              handleFormChange(e); // only allow typing if Present
                            
                          }}
                          className={`w-full min-h-[100px] p-3 border border-gray-300 rounded-lg shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700
                            ${toUpdate[`refailureHearingStatus${key}`] === "Absent" ? "bg-gray-100 cursor-not-allowed" : ""}
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
                          
                          !!(typeof reportData?.refailureHearingDetails?.[key]?.reason === "string" && reportData?.refailureHearingDetails?.[key]?.reason.trim())
                          
                        }
                      
                        onClick={() => {
                          if (
                             toUpdate[`refailureHearingStatus${key}`] === "Present" &&
                            toUpdate[`reasonForFailureToAppearHearing${key}`] === "" ||
                            !toUpdate[`reasonForFailureToAppearHearing${key}`]
                          ) {
                            
                            setErrorPopup({ show: true, message: "Please fill out the reason for failure to appear." });
                            setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                            return;
                          }
                          if(!docId) return;
                          const docRef = doc(db, "IncidentReports", docId );
                          updateDoc(docRef, {
                            [`refailureHearingDetails.${key}`]: {
                              //resStatus: toUpdate[`refailureHearingStatus${key}`] || "Absent",
                              reason: toUpdate[`reasonForFailureToAppearHearing${key}`] 
                                    || reportData?.[`reasonForFailureToAppearHearing${key}`] 
                            }
                          });
                          const hearingLabel =
                          Number(key) === 0
                            ? "First"
                            : Number(key) === 1
                            ? "Second"
                            : Number(key) === 2
                            ? "Third"
                            : "";
                          
                          setErrorPopup({ show: true, message: `${hearingLabel} Hearing Refailure Updated Successfully` });
                          setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                          
                        }}
                        
                      >
                        Submit
                      </button>
                    </div>
                  )
                )}
              </>
            )} 
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