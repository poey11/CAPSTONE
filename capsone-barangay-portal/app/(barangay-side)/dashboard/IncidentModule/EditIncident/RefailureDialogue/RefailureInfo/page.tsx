"use client"
import "@/CSS/IncidentModule/Letters.css";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, use, useEffect, useState } from "react";
import { collection,doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { handleLetterOfFailure } from "@/app/helpers/pdfhelper";
import MenuBar from "@/app/(barangay-side)/components/incidentMenuBar";

export default function RefailureInfo() {
    const router = useRouter();
    const searchParam = useSearchParams();
    const docId = searchParam.get("id")?.split("?")[0];
    const department = searchParam.get("department");
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    const [showSubmitPopup, setShowSubmitPopup] = useState<{ show: boolean; message: string; message2: string; letterType?: "dialogue" | "summon" }>({
        show: false,
        message: "",
        message2: "",
        letterType: undefined,
    });
    const phTime = new Date()
    const today  = new Date(phTime.getTime() - phTime.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
    const todayWithTime = new Date().toISOString().slice(0,16);
    const [otherInfo, setOtherInfo] = useState<any>({
        DateOfDelivery: "",
        DateTimeOfMeeting: "",

        LuponStaff: "",
        LuponStaffId: "",
        DateFiled: today,
          complainant: {
            fname: "",
            lname: "",
            contact: "",
            address: ""
        },
        respondent: {
            fname: "",
            lname: "",
            contact: "",
            address: ""
        }
    });
    const [listOfStaffs, setListOfStaffs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    const [refailureDialogueData, setRefailureDialogueData] = useState<any>(null);
        

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

        useEffect(() => {
            setRefailureDialogueData({
            DateOfDelivery: reportData?.refailureLetterDialogueDeliverDate || "",
            DateTimeOfMeeting: reportData?.refailureExplainationMeetingDialogue || "",
            LuponStaff: reportData?.refailureLetterDialogueDeliverBy || "",
            DateFiled: reportData?.refailureLetterDialogueDateFiled || "",
            })
        }, [reportData]);
        console.log("Refailure Dialogue Data:", refailureDialogueData);

        

    useEffect(() => {
  if (!reportData) return;

  setOtherInfo((prev: any) => ({
    ...prev,
    complainant: {
      fname: reportData?.complainant?.fname || "",
      lname: reportData?.complainant?.lname || "",
      contact: reportData?.complainant?.contact || "",
      address: reportData?.complainant?.address || ""
    },
    respondent: {
      fname: reportData?.respondent?.fname || "",
      lname: reportData?.respondent?.lname || "",
      contact: reportData?.respondent?.contact || "",
      address: reportData?.respondent?.address || ""
    }
  }));
}, [reportData]);

  

    useEffect(() => {
        const staffquery = query(collection(db, "BarangayUsers"), where("position", "==","LF Staff"), where("firstTimelogin", "==", false));
        const unsubscribe = onSnapshot(staffquery, (snapshot) => {
            const staffList: any[] = [];
            snapshot.forEach((doc) => {
                staffList.push({ ...doc.data(), id: doc.id });
            });
            console.log("Staff List:", staffList);
            setListOfStaffs(staffList);
        });                     

            
        return () => { unsubscribe();  // Clean up the listener on unmount}
            }
        },[]);

        const filteredStaffs = listOfStaffs.filter((staff) => staff.department === department);


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
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
            const { name, value } = e.target;
            const keys = name.split("."); 
        
            setOtherInfo((prev:any) => {
                if (keys.length === 2) {
                    const [parentKey, childKey] = keys;
                    return {
                        ...prev,
                        [parentKey]: {
                            ...(prev[parentKey as keyof typeof prev] as object), 
                            [childKey]: value 
                        }
                    };
                }
                return { ...prev, [name]: value };
            });
        };
    const [barangayList, setBarangayList] = useState<any[]>([]);
    useEffect(() => {
        const staffquery = query(collection(db, "BarangayUsers"), where("position", "==","LF Staff"), where("firstTimelogin", "==", false));
        const unsubscribe = onSnapshot(staffquery, (snapshot) => {
            const staffList: any[] = [];
            snapshot.forEach((doc) => {
                staffList.push({ ...doc.data(), id: doc.id });
            });
            console.log("Staff List:", staffList);
            setBarangayList(staffList);
        });                     

            
        return () => { unsubscribe();  // Clean up the listener on unmount}
            }
        },[]);
    
            const handleRescheduleMeeting = async (DateTimeOfMeeting: string) => {
        const deliver = barangayList.find((staff) => staff.id === otherInfo.LuponStaffId);
        if (!docId) return;
        const mainDocRef = doc(db, "IncidentReports", docId);
          await updateDoc(mainDocRef, {
            sentLetterOfFailureToAppearDialogue: true,
            refailureExplainationMeetingDialogue: DateTimeOfMeeting,
            refailureLetterDialogueDeliverBy: `${deliver?.firstName} ${deliver?.lastName}`,
            refailureLetterDialogueDeliverDate: otherInfo.DateOfDelivery,
            refailureLetterDialogueDateFiled: new Date().toLocaleString(),
          })        
    }
    //add the notification func here
    const [staffContactNos, setStaffContactNos] = useState("");
    const [staffName, setStaffName] = useState("");
    const [staffLastName, setStaffLastName] = useState("");
    const [DateOfDelivery, setDateOfDelivery] = useState("");
    useEffect(() => {
        if (!otherInfo.LuponStaffId) return;
        
        const staff = filteredStaffs.find(staff => staff.id === otherInfo.LuponStaffId);
        setStaffContactNos(staff?.phone || "");
        setStaffName(staff?.firstName || "");
        setStaffLastName(staff?.lastName || "");
        setDateOfDelivery(otherInfo.DateOfDelivery || "");
    }, [otherInfo, filteredStaffs]);

    const handleSMSNotification = async () => {
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                    to: reportData?.respondent.contact,
                    message: 
                    `Good day Mr./Ms. ${reportData?.respondent.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay 
                    Fairview will be delivering a Refailure Meeting (Dialgoue) Invitation to you. The invitation will be handed personally by ${staffName} ${staffLastName}  on 
                    ${DateOfDelivery}.\n\nThis letter contains important details regarding the scheduled meeting and deadline for the excuse of absence. 
                    We kindly ask for your attention and cooperation in receiving and acknowledging the said document.
                    \n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.
                    \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`
              })
          });
          if (!response.ok) throw new Error("Failed to send SMS");
  
          const data = await response.json();
          console.log(data);
        } catch (error) {
            console.error("Error sending SMS:", error);
        }
        
        try {
            const responseC = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: staffContactNos,
                message:  `Good day Mr./Ms. ${staffName} ${staffLastName},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview has prepared a 
                 Refailure letter that requires your attention.\n\nYou are requested to proceed to the Lupon office on ${DateOfDelivery} 
                 to retrieve the said document. Once received, kindly ensure its prompt delivery to both the respondent and the complainant involved in the case.
                \n\nThis letter contains important information regarding the scheduled dialogue, and your assistance in facilitating its delivery is greatly appreciated.
                 \n\nShould you have any questions or need further clarification, please contact the Barangay Hall.\n\nThank you for your cooperation.
                 \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`

            })

        });
        if (!responseC.ok) throw new Error("Failed to send SMS");
        const dataC = await responseC.json();
        console.log(dataC);
        } catch (error) {
            console.error("Error sending SMS:", error);
        }
        console.log("SMS Notification Sent to Staff", {
            to: staffContactNos,
            message:  `Good day Mr./Ms. ${staffName} ${staffLastName},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview has prepared a
                Refailure letter that requires your attention.\n\nYou are requested to proceed to the Lupon office on ${DateOfDelivery}
                to retrieve the said document. Once received, kindly ensure its prompt delivery to both the respondent and the complainant involved in the case.
                \n\nThis letter contains important information regarding the scheduled dialogue, and your assistance in facilitating its delivery is greatly appreciated.
                \n\nShould you have any questions or need further clarification, please contact the Barangay Hall.\n\nThank you for your cooperation.
                \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`
        });
    }
    return (
        <main className="main-container-letter">


        {errorPopup.show && (
            <div className={'popup-overlay-error show'}>
                <div className="popup-letter">
                      <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert-letter"/>
                    <p>{errorPopup.message}</p>
                </div>
            </div>
        )}

            {showPopup && (
            <div className={`popup-overlay-add show`}>
                <div className="popup-add">
                  <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                  <p>{popupMessage}</p>
                </div>
            </div>
        )}



                {showSubmitPopup.show && (
                <div className="popup-backdrop">
                    <div className="popup-content">
                    <img
                        src="/Images/check.png"
                        alt="check icon"
                        className="successful-icon-popup-letter"
                    />
                    <p>{showSubmitPopup.message}</p>
                    <h2>{showSubmitPopup.message2}</h2>

                    {showSubmitPopup.letterType === "summon" ? (
                            <button
                            onClick={() => {
                                setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });

                                // Show the success popup message immediately
                                setPopupMessage("SMS sent successfully!!");
                                setShowPopup(true);

                                if (showSubmitPopup.letterType === "summon") {
                                // Redirect to HearingSection after 3 seconds
                                //sendSMSForSummons();
                                setTimeout(() => {
                                    router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}&department=${department}`);
                                    setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
                                }, 3000);
                                } else {
                                // Go back after 2 seconds
                                setTimeout(() => {
                                    setShowPopup(false);
                                    router.back();
                                }, 2000);
                                }
                            }}
                            className="send-sms-btn"
                            >
                            Send SMS
                            </button>

                    ) : (
                        // CODE BLOCK FOR SEND SMS BUTTON INSIDE POP UP
                        <button
                            onClick={() => {
                                setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });

                                // Show popup immediately
                                setPopupMessage("SMS sent successfully!!");
                                setShowPopup(true);

                                if (showSubmitPopup.letterType === "dialogue") {
                                //sendSMSForDialogue(); 
                                setTimeout(() => {
                                    router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}&department=${department}`);
                                    setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
                                }, 3000);
                                } else {
                                // Redirect after 2 seconds
                                setTimeout(() => {
                                    setShowPopup(false);
                                    router.back();
                                }, 2000);
                                }
                            }}
                            className="send-sms-btn"
                            >
                            Send SMS
                        </button> 
                    )}
                    </div>
                </div>
                )}
            {isLoading && (
                <div className="popup-backdrop">
                    <div className="popup-content">
                        <div className="spinner"/>
                        <p>Generating letter, please wait...</p>
                    </div>
                </div>
            )}

        <MenuBar id = {docId||""} department={department ||  ""} />

        <div className="main-content-letter">
                    <form  className="container-letters">

                        <div className="section-1-letter">

                            <div className="section-left-side-letter">
                                <button type="button" onClick={router.back} className="back-btn-letter-container">
                                    <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn-letter"/> 
                                </button>

                                <h1 className="NewOfficial">Refailure Meeting (Dialogue)</h1> 
                            </div>
                        <div className="actions-letter">
                        {(
                            !refailureDialogueData || 
                            !refailureDialogueData.DateOfDelivery || 
                            !refailureDialogueData.DateTimeOfMeeting || 
                            !refailureDialogueData.LuponStaff
                            ) && (
                            <button
                                className="letter-announcement-btn"
                                type="submit"
                                name="print"
                                onClick={(e) => {
                                e.preventDefault();
                                if (!otherInfo.DateOfDelivery || !otherInfo.DateTimeOfMeeting || !otherInfo.LuponStaff) {
                                    setErrorPopup({ show: true, message: "Please fill up all the required fields." });
                                    setTimeout(() => setErrorPopup({ show: false, message: "" }), 3000);
                                    return;
                                }

                                handleRescheduleMeeting(otherInfo?.DateTimeOfMeeting);
                                setPopupMessage("Refailure Meeting (Dialogue) Info Updated Successfully!!");
                                setShowPopup(true);
                                setTimeout(() => {
                                    setShowPopup(false);
                                    router.push(
                                    `/dashboard/IncidentModule/EditIncident/RefailureDialogue?id=${docId}&department=${department}`
                                    );
                                }, 2000);

                                handleLetterOfFailure(
                                    docId ?? "",
                                    otherInfo?.DateTimeOfMeeting ?? "",
                                    `${reportData?.complainant?.fname ?? ""} ${reportData?.complainant?.lname ?? ""}`,
                                    `${reportData?.respondent?.fname ?? ""} ${reportData?.respondent?.lname ?? ""}`,
                                    "dialogue"
                                );
                                //handleSMSNotification();
                                }}
                            >
                                Print
                            </button>
                            )}
                                
                           
                            
                        </div>
                    </div>



                   <div className="scroll-letter">
                        <div className="section-2-letter">

                        <div className="section-2-letter-upper">
                            <div className="section-2-letter-left-side">
                                <div className="section-2-information-section">
                                    <div className="section-2-information-top">
                                        <div className="section-title-letter">
                                                <h1>Complainant’s Information</h1>
                                        </div>
                                    </div>

                                    <div className="section-2-information-bottom-upper">
                                        <div className="information-bottom-first-section">
                                            <div className="fields-section-letter">
                                                    <p>Name</p>
                                                        <input 
                                                        type="text" 
                                                        className="generate-letter-input-field" 
                                                        placeholder={otherInfo.complainant.fname}
                                                        value={`${otherInfo.complainant.fname} ${otherInfo.complainant.lname}`}
                                                             id="complainant.fname"
                                                           name="complainant.fname"
                                                        disabled
                                                    />
                                            </div>

                                            <div className="fields-section-letter">
                                                    <p>Contact Nos</p>
                                                    <input 
                                                    type="text" 
                                                    className="generate-letter-input-field" 
                                                    placeholder= {otherInfo.complainant.contact}
                                                    value={otherInfo.complainant.contact}
                                                    id="complainant.contact"
                                                  name="complainant.contact"
                                                    disabled
                                                    />

                                                </div>

                                        </div>

                                        <div className="information-bottom-second-section">

                                            <div className="fields-section-letter-address">
                                                <p>Address</p>
                                                    <input 
                                                    type="text" 
                                                    className="generate-letter-input-field-address" 
                                                        placeholder= {otherInfo.complainant.address}
                                                        value={otherInfo.complainant.address}
                                                        id="complainant.address"
                                                        name="complainant.address"
                                                    disabled
                                                    />
                                            </div>
                                            
                                        </div>




                                    </div>

                                </div>

                            </div>


                     <div className="section-2-letter-right-side">

                        <div className="section-2-information-section">

                                <div className="section-2-information-top">

                                    <div className="section-title-letter">
                                            <h1>Respondent’s Information</h1>
                                    </div>
                                </div>

                            <div className="section-2-information-bottom-upper">


                                <div className="information-bottom-first-section ">
                                
                                    <div className="fields-section-letter">
                                    <p>Name</p>
                                        
                                        <input 
                                        type="text" 
                                        className="generate-letter-input-field" 
                                            placeholder={otherInfo.respondent.fname}
                                            value={`${otherInfo.respondent.fname} ${otherInfo.respondent.lname}`}
                                            id="respondent.fname"
                                            name="respondent.fname"
                                        disabled
                                        />

                                    </div>

                                    
                                    <div className="fields-section-letter">
                                        <p>Contact Nos</p>
                                        <input 
                                        type="text" 
                                        className="generate-letter-input-field" 
                                        placeholder= {otherInfo.respondent.contact}
                                        value={otherInfo.respondent.contact}
                                    id="respondent.contact"
                                        name="respondent.contact"
                                        disabled
                                        />

                                    </div>

                                </div>

                                <div className="information-bottom-second-section ">

                                <div className="fields-section-letter-address">
                                        <p>Address</p>
                                            <input 
                                            type="text" 
                                            className="generate-letter-input-field-address" 
                                        placeholder= {otherInfo.respondent.address}
                                         value={otherInfo.respondent.address}
                                        id="respondent.address"
                                         name="respondent.address"
                                            disabled
                                            />
                            
                                    </div>
                                    
                                </div>



                            
                            </div>       
                        

                        
                            </div>

                                </div>




                            
                        </div>



                            <div className="section-2-letter-lower">

                                    <div className="section-2-letter-lower">
                                    <div className="section-2-information-section">
                                        <div className="section-2-information-top">
                                            <div className="section-title-letter">
                                            <h1>Refailure Information (Dialogue)</h1>
                                            </div>
                                        </div>
                                        <div className="section-2-information-bottom">
                                           
                                            <div className="section-2-letter-left-side-others">
                                                <div className="fields-section-letter">
                                                    <p>Date of Delivery</p>
                                                    <input
                                                        type="date"
                                                        className="generate-letter-input-field"
                                                        placeholder="Enter Date of Delivery"
                                                        value={refailureDialogueData?.DateOfDelivery || otherInfo.DateOfDelivery}
                                                        id="DateOfDelivery"
                                                        name="DateOfDelivery"
                                                        min={(() => {
                                                            const tomorrow = new Date();
                                                            tomorrow.setDate(tomorrow.getDate() + 1);

                                                            const pad = (n: number) => n.toString().padStart(2, "0");
                                                            const yyyy = tomorrow.getFullYear();
                                                            const mm = pad(tomorrow.getMonth() + 1);
                                                            const dd = pad(tomorrow.getDate());
                                                            return `${yyyy}-${mm}-${dd}`;
                                                        })()}
                                                        onKeyDown={(e) => e.preventDefault()}
                                                        onChange={(e) => {
                                                            handleChange(e); // ✅ actually call it
                                                            setOtherInfo((prev: any) => ({
                                                            ...prev,
                                                            DateTimeOfMeeting: "", // ✅ reset meeting when delivery date changes
                                                            }));
                                                        }}
                                                        required
                                                        disabled={!!refailureDialogueData?.DateOfDelivery}
                                                        />

                                                </div>
                                                <div className="fields-section-letter">
                                                    <p>Date and Time of Meeting</p>
                                                    <input
                                                        type="datetime-local"
                                                        className="generate-letter-input-field"
                                                        value={refailureDialogueData?.DateTimeOfMeeting || otherInfo.DateTimeOfMeeting}
                                                        onKeyDown={(e) => e.preventDefault()}
                                                        id="DateTimeOfMeeting"
                                                        name="DateTimeOfMeeting"
                                                        onChange={handleChange}
                                                        min={(() => {
                                                        if (!otherInfo.DateOfDelivery) return "";
                                                        const tomorrow = new Date(otherInfo.DateOfDelivery);
                                                        tomorrow.setDate(tomorrow.getDate() + 1);

                                                        const pad = (n: number) => n.toString().padStart(2, "0");
                                                        const yyyy = tomorrow.getFullYear();
                                                        const mm = pad(tomorrow.getMonth() + 1);
                                                        const dd = pad(tomorrow.getDate());
                                                        const hh = pad(tomorrow.getHours());
                                                        const min = pad(tomorrow.getMinutes());

                                                        // Must return `YYYY-MM-DDTHH:MM`
                                                        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
                                                        })()}
                                                        required
                                                        disabled={!!refailureDialogueData?.DateTimeOfMeeting}
                                                    />
                                                    </div>

                                            </div>
                                            <div className="section-2-letter-right-side-others">
                                            <div className="fields-section-letter">
                                                    <p>Delivered By</p>      
                                                    <select
                                                            className="generate-letter-input-field-dropdown"
                                                            value={refailureDialogueData?.LuponStaff||otherInfo.LuponStaff}
                                                            onChange={(e) => {
                                                                const select = e.target;
                                                                const selectedOption = select.options[select.selectedIndex];
                                                                const selectedName = selectedOption.value;
                                                                const selectedId = selectedOption.getAttribute("data-staffid") || "";
                                                                console.log("DEBUG SELECT:", selectedName, selectedId);
                                                                setOtherInfo((prev: any) => ({
                                                                    ...prev,
                                                                    LuponStaff: selectedName,
                                                                    LuponStaffId: selectedId
                                                                }));
                                                            }}
                                                            required
                                                            disabled={!!refailureDialogueData?.LuponStaff}
                                                        >
                                                            <option disabled value="">Select Official/Kagawad</option>
                                                            {filteredStaffs.map((staff, index) => (
                                                                <option
                                                                    key={index}
                                                                    value={`${staff.firstName} ${staff.lastName}`}
                                                                    data-staffid={staff.id}
                                                                >
                                                                    {staff.firstName} {staff.lastName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                </div>
                                                <div className="fields-section-letter">
                                                    <p>Date Filed</p>
                                                <input type="datetime" className="generate-letter-input-field" 
                                                    value={refailureDialogueData?.DateFiled||otherInfo.DateFiled}
                                                    max={today}
                                                    id="DateFiled"
                                                    name="DateFiled"
                                                    onKeyDown={(e) => e.preventDefault()}
                                                    onChange={handleChange}
                                                    disabled
                                                    />
                                                </div>
                                            </div>
                                            
                                           
                                        </div>
                                        </div>
                                    </div>

                            </div>

                        </div>
                    
                        </div>

                    
                    </form>

        </div> 
      

        </main>
    );
}



