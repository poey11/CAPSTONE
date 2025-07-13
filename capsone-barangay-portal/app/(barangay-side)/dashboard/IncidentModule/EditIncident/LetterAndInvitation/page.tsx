"use client"
import "@/CSS/IncidentModule/Letters.css";
import { useRouter, useSearchParams } from "next/navigation";
import {  useEffect,useState } from "react";
import { addDoc,collection,doc, getDocs, onSnapshot, orderBy, query, updateDoc, where, setDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { db } from "@/app/db/firebase";
import { getLocalDateString, getLocalDateTimeString } from "@/app/helpers/helpers";
import { getSpecificDocument, generateDownloadLink } from "../../../../../helpers/firestorehelper";

export default function GenerateDialogueLetter() {
    const user = useSession().data?.user;
    const searchParam = useSearchParams();
    const docId = searchParam.get("id")?.split("?")[0];
    const actionId = searchParam.get("id")?.split("?")[1].split("=")[1];
    const today = getLocalDateString(new Date());
    const [listOfStaffs, setListOfStaffs] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any | null>(null);
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    const [showSubmitPopup, setShowSubmitPopup] = useState<{ show: boolean; message: string; message2: string; letterType?: "dialogue" | "summon" }>({
        show: false,
        message: "",
        message2: "",
        letterType: undefined,
    });


    const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
    const [hasSummonLetter, setHasSummonLetter] = useState(false);
    const [reportData, setReportData] = useState<any>();
    const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);


  
    const [isLoading, setIsLoading] = useState(false);


    
    const [otherInfo, setOtherInfo] = useState({
        DateOfDelivery: "",
        DateTimeOfMeeting: "",
        LuponStaff: "",
        LuponStaffId: "",
        DateFiled:today ,
        complainant:{
            fname:"",
            address: "",
            contact:"",
        },
        respondent:{
            fname: "",
            address: "",
            contact: "",
        },
        sendDialogueSms: false,
        sendHearingSms: false,
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set time to 00:00:00.000

    const todayWithTime = getLocalDateTimeString(tomorrow);
    const [isDialogue, setIsDialogue] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchStaffList = async () => {
            try {
                const staffquery = query(collection(db, "BarangayUsers"), where("position", "==","LF Staff"), where("firstTimelogin", "==", false));
                const querySnapshot = await getDocs(staffquery);
                
                querySnapshot.forEach((doc) => {
                    setListOfStaffs((prev) => [...prev, { ...doc.data(), id: doc.id }]);
                  });
      
            } catch (error: any) {
              console.error("Error fetching LT List:", error.message);
            }    
        }
        fetchStaffList();
    },[]);


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

    useEffect(() => {
        if(!docId) return;
        try {

            const docRef = doc(db, "IncidentReports", docId);
            const subDocRef = collection(docRef, "GeneratedLetters");
            const q = query(subDocRef, where("letterType", "==", actionId), orderBy("createdAt", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
            const reports:any[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setData(reports);
            });
            return unsubscribe;

        } catch (error) {
            
        }        
    
    },[])

    const safeData = Array.isArray(data) ? data : [];

    useEffect(() => {
        if(!docId) return;
        const docRef = doc(db, "IncidentReports", docId);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setIsDialogue(data.isDialogue); 
            } else {
                console.log("No such document!");
            }
        });
        return () => unsubscribe(); 
    },[])
    useEffect(() => {
        if(!docId) return;
        const docRef = doc(db, "IncidentReports", docId);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setUserInfo(data);
                setLoading(false);
            } else {
                console.log("No such document!");
            }
        }
        );
        return () => unsubscribe();

    }, []);
    let hearing = userInfo?.hearing;
    let generatedHearingSummons = userInfo?.generatedHearingSummons || 0; 
    
    useEffect(() => {
        if (userInfo) {
            setOtherInfo((prev) => ({
                ...prev,
                complainant: {
                    fname: `${userInfo.complainant?.fname || ""} ${userInfo.complainant?.lname || ""}`.trim(),
                    address: userInfo.complainant?.address || "",
                    contact: userInfo.complainant?.contact || "",
                    residentId: userInfo.complainant?.residentId || "",
                },
                respondent: {
                    fname: `${userInfo.respondent?.fname || ""} ${userInfo.respondent?.lname || ""}`.trim(),
                    address: userInfo.respondent?.address || "",
                    contact: userInfo.respondent?.contact || "",
                    residentId: userInfo.respondent?.residentId || "",

                }
            }));
        }
    }, [userInfo]);
  
    console.log("otherinfo",otherInfo);
    console.log("userinfo",userInfo);
    const handleAddLupon = () => {
      router.back();
    };
    
 
    const sendSMSForDialogue = async () => {
     //dont forget to add the assing staff contact number
       setIsLoading(true); // Start loading


      try{
        const response = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: otherInfo.complainant.contact,
                message: `Good day Mr./Ms. ${otherInfo.complainant.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a dialogue invitation to you. The invitation will be handed personally by ${otherInfo.LuponStaff} on ${otherInfo.DateOfDelivery}.\n\nThis letter contains important details regarding the scheduled dialogue between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.\n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.\n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`
            })
        });
        if (!response.ok) throw new Error("Failed to send SMS");

        const data = await response.json();
        console.log(data);


        const responseB = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: otherInfo.respondent.contact,
               message: `Good day Mr./Ms. ${otherInfo.respondent.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a dialogue invitation to you. The invitation will be handed personally by ${otherInfo.LuponStaff} on ${otherInfo.DateOfDelivery}.\n\nThis letter contains important details regarding the scheduled dialogue between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.\n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.\n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`
            })
        });
        if (!responseB.ok) throw new Error("Failed to send SMS");

           setShowSubmitPopup({
                show: true,
                message: "SMS message for both parties sent succesfully!",
                message2: "",
                letterType: "dialogue",
            });


        const dataB = await responseB.json();
        console.log(dataB);
      }
      catch(err) {
        console.log(err);
      }  finally {  //ADDED
             setTimeout(() => {
            setIsLoading(false); // End loading after 1 seconds
        }, 1000);
       }
      
    }

    const sendSMSForSummons = async () => {
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  to: otherInfo.respondent.contact,
                     message: `Good day Mr./Ms. ${otherInfo.respondent.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a Hearing invitation to you. The invitation will be handed personally by ${otherInfo.LuponStaff} on ${otherInfo.DateOfDelivery}.\n\nThis letter contains important details regarding the scheduled hearing between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.\n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.\n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`
              })
          });
          if (!response.ok) throw new Error("Failed to send SMS");
  
          const data = await response.json();
          console.log(data);

          const responseB = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: otherInfo.complainant.contact,
                 message: `Good day Mr./Ms. ${otherInfo.complainant.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a Hearing invitation to you. The invitation will be handed personally by ${otherInfo.LuponStaff} on ${otherInfo.DateOfDelivery}.\n\nThis letter contains important details regarding the scheduled hearing between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.\n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.\n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`
            })
        });
        if (!responseB.ok) throw new Error("Failed to send SMS");

              setShowSubmitPopup({
                show: true,
                message: "SMS message for both parties sent succesfuly!",
                message2: "",
                letterType: "summon",
            });


        const dataB = await responseB.json();
        console.log(dataB);
        }
        catch(err) {
          console.log(err);
        }   finally {  //ADDED
             setTimeout(() => {
            setIsLoading(false); // End loading after 2 seconds
            setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
        }, 2000);
       }
    }
  
  
    const [hearingB, setHearingB] =useState("");
    console.log("hearing",hearing);
    useEffect(() => { 
        if(hearing === 0 ){ 
            setHearingB("First");
        }
        else if (hearing === 1){
            setHearingB("Second");
        }
        else if (hearing > 1){
            setHearingB("Third");
        }
    }, [hearing]);

    const printDialogue = async () => {
         setIsLoading(true); // Start loading


        const day = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[2];    
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = parseInt(otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[1], 10) - 1;
        const month = monthNames[monthIndex];
        const year = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[0];
        const time24 = otherInfo.DateTimeOfMeeting.split("T")[1];

         // Convert 24-hour time to 12-hour format
        const [hourStr, minuteStr] = time24.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = minuteStr; // Keep minutes as-is
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12; // Convert hour to 12-hour format (0 should become 12)
        
        const time12 = `${hour}:${minute} ${ampm}`;
        
        // Determine collective time
        let collective = "Umaga"; // Default to morning
        if (hour >= 12 && hour < 18 && ampm === "PM") {
            collective = "Hapon"; // Afternoon
        } else if ((hour >= 6 && ampm === "PM") || (hour < 4 && ampm === "AM")) {
            collective = "Gabi"; // Evening
        }
        
        try {
            const response = await fetch("/api/fillPDF", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    location: "/IncidentReports/Templates",
                    pdfTemplate: "TEST2 - Copy.pdf",
                    data: {
                        "Text16": otherInfo.complainant.fname,
                        "Text15": otherInfo.complainant.address,
                        "Text17": otherInfo.respondent.fname,
                        "Text18": otherInfo.respondent.address,
                        "Text20": day,
                        "Text21": month,
                        "Text22": year,
                        "Text23": time12,
                        "Text24": collective,
                        "Text25": day,
                        "Text28": month,
                        "Text29": year,
                        "Text27": user?.fullName,
                        "Text19": otherInfo.LuponStaff,
                    },
                    centerField: ["Text27"]
                })
            });
            if (!response.ok) throw new Error("Failed to generate PDF");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "DialogueLetter.pdf";
            a.click();
            window.URL.revokeObjectURL(url);

            setShowSubmitPopup({
                show: true,
                message: "Dialogue Letter has been generated successfully!",
                message2: "Next: Complete the dialogue section after the meeting.",
                letterType: "dialogue",
            });

            
                        
        } catch (error) {
            console.error(error)
        } finally {  //ADDED
             setTimeout(() => {
            setIsLoading(false); // End loading after 2 seconds
        }, 2000);
       }
    }
    const printSummon = async () => {

        setIsLoading(true); // Start loading

        const day = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[2];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = parseInt(otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[1], 10) - 1;
        const month = monthNames[monthIndex];
        const year = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[0];
        const time24 = otherInfo.DateTimeOfMeeting.split("T")[1];
        const [hourStr, minuteStr] = time24.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = minuteStr;
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        const time12 = `${hour}:${minute} ${ampm}`;
        let collective = "Morning";
        if (hour >= 12 && hour < 18 && ampm === "PM") {
            collective = "Afternoon";
        } else if ((hour >= 6 && ampm === "PM") || (hour < 4 && ampm === "AM")) {
            collective = "Evening";
        }

        const date = new Date();
        const dayToday = date.toISOString();

        const issueDay = dayToday.split("T")[0].split("-")[2];
        const issueMonthIndex = parseInt(dayToday.split("T")[0].split("-")[1], 10) - 1;
        const issueMonth = monthNames[issueMonthIndex];
        const issueYear = dayToday.split("T")[0].split("-")[0];
        
       
        
       try{ 
        const response = await fetch("/api/fillPDF", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                location: "/IncidentReports/Templates",
                pdfTemplate: "summonTemplate.pdf",
                data: {
                    "Text1":otherInfo.complainant.fname,
                    "Text2":otherInfo.complainant.address,
                    "Text3":otherInfo.respondent.fname,
                    "Text4":otherInfo.respondent.address,
                    "Text5":hearingB,//make it dynamic
                    "Text6": `${month} ${day}, ${year}`,//Month Day, Year
                    "Text7":day,//Day
                    "Text8":`${month} ${year}`,//MonthYear
                    "Text9":time12,//Time
                    "Text10":collective,//Collective
                    "Text11":issueDay,//Day
                    "Text12":`${issueMonth} ${issueYear}`,//MonthYear
                    "Text14":user?.fullName,    
                },
                centerField: ["Text5","Text7","Text10","Text11","Text14"]
            })
        });
        if (!response.ok) throw new Error("Failed to generate PDF");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "SummonLetter.pdf";
        a.click();
        window.URL.revokeObjectURL(url);

          setShowSubmitPopup({
                show: true,
                message: "Summon Letter has been generated successfully!",
                message2: "Next: Complete the hearing section after the meeting",
                letterType: "summon",
            });

       }
       catch(e:any){
        console.log()
       } finally {  //ADDED
             setTimeout(() => {
            setIsLoading(false); // End loading after 2 seconds
        }, 2000);
       }
    
    }
    
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

      const handleIsDialogue = async () => {
        try {
            if (!docId) throw new Error("Document ID is undefined");
    
            // Update the parent IncidentReport to mark isDialogue
            const docRef = doc(db, "IncidentReports", docId);
            const updates = {
                isDialogue: true,
            };
            await updateDoc(docRef, updates);
    
            // Add GeneratedLetter subdocument
            const docRefB = collection(db, "IncidentReports", docId, "GeneratedLetters");
            await addDoc(docRefB, {
                createdAt: new Date(),
                createdBy: user?.fullName,
                letterType: actionId,
                DateOfDelivery: otherInfo.DateOfDelivery,
                DateTimeOfMeeting: otherInfo.DateTimeOfMeeting,
                LuponStaff: otherInfo.LuponStaff, // display name
                LuponStaffId: otherInfo.LuponStaffId, // keep staffId here silently
                DateFiled: otherInfo.DateFiled,
                dialougeSMS: otherInfo.sendDialogueSms,
            });
    
            //  Add the barangay notification for assigned staff
            if (otherInfo.LuponStaffId) {
                const barangayNotificationRef = doc(collection(db, "BarangayNotifications"));
                await setDoc(barangayNotificationRef, {
                    recipientRole: "LF Staff",
                    respondentID: otherInfo.LuponStaffId, // store hidden staffId
                    message: `You have been assigned to deliver a Dialogue letter for Case #${userInfo.caseNumber || docId}.`,
                    timestamp: new Date(),
                    isRead: false,
                    incidentID: docId,
                    transactionType: "Assigned Incident"
                });
            }

            // complainant notification

            if (userInfo.complainant?.residentId) {
                const complainantNotifRef = doc(collection(db, "Notifications"));
                await setDoc(complainantNotifRef, {
                    residentID: userInfo.complainant.residentId,
                    message: `You have a scheduled Dialogue meeting on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
                    transactionType: "Incident",
                    timestamp: new Date(),
                    isRead: false,
                });
            }
    
            //  Respondent notification
            if (userInfo.respondent?.residentId) {
                const respondentNotifRef = doc(collection(db, "Notifications"));
                await setDoc(respondentNotifRef, {
                    residentID: userInfo.respondent.residentId,
                    message: `You have a scheduled Dialogue meeting on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
                    transactionType: "Incident",
                    timestamp: new Date(),
                    isRead: false,
                });
            }
    
        } catch (error: string | any) {
            console.error(error);
        }
    }
    
    const handleIsHearing = async () => {
        try {
            if (!docId) throw new Error("Document ID is undefined");
    
            const docRefB = collection(db, "IncidentReports", docId, "GeneratedLetters");
            await addDoc(docRefB, {
                createdAt: new Date(),
                createdBy: user?.fullName,
                letterType: actionId,
                DateOfDelivery: otherInfo.DateOfDelivery,
                DateTimeOfMeeting: otherInfo.DateTimeOfMeeting,
                LuponStaff: otherInfo.LuponStaff,
                LuponStaffId: otherInfo.LuponStaffId,
                DateFiled: otherInfo.DateFiled,
                hearingNumber: hearing,
                hearingSms: otherInfo.sendHearingSms,
            });
    
            // Update parent doc hearing info
            const docRef = doc(db, "IncidentReports", docId);
            const updates = {
                ...(hearing !== 3 && { hearing: hearing + 1 }),
                generatedHearingSummons: generatedHearingSummons + 1,
            };
            await updateDoc(docRef, updates);
    
            // 🔥 Add notification for hearing
            if (otherInfo.LuponStaffId) {
                const barangayNotificationRef = doc(collection(db, "BarangayNotifications"));
                await setDoc(barangayNotificationRef, {
                    recipientRole: "LF Staff",
                    respondentID: otherInfo.LuponStaffId,
                    message: `You have been assigned to deliver a Summons letter for Case #${userInfo.caseNumber || docId}.`,
                    timestamp: new Date(),
                    isRead: false,
                    incidentID: docId,
                    transactionType: "Assigned Incident"
                });
            }

            // complainant notification
            if (userInfo.complainant?.residentID) {
                const complainantNotifRef = doc(collection(db, "Notifications"));
                await setDoc(complainantNotifRef, {
                    residentID: userInfo.complainant.residentId,
                    message: `You have a scheduled ${hearingB} Hearing on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
                    transactionType: "Incident",
                    timestamp: new Date(),
                    isRead: false,
                });
            }
    
            // Respondent notification
            if (userInfo.respondent?.residentID) {
                const respondentNotifRef = doc(collection(db, "Notifications"));
                await setDoc(respondentNotifRef, {
                    residentID: userInfo.respondent.residentId,
                    message: `You have a scheduled ${hearingB} Hearing on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
                    transactionType: "Incident",
                    timestamp: new Date(),
                    isRead: false,
                });
            }
    
    
        } catch (error: string | any) {
            console.error(error);
        }
    }
    

    const meeting = getLocalDateString(new Date(otherInfo.DateTimeOfMeeting.split("T")[0]));
    const delivery = getLocalDateString(new Date(otherInfo.DateOfDelivery));
    const onSubmit = (e: any) => {
        e.preventDefault();
        const action = e.nativeEvent.submitter.name;
        
        if(delivery > meeting){
            setErrorPopup({ show: true, message: "Delivery Date must be before Meeting Date." });
            return;
        }
        if (action === "print") {
            if(actionId === "summon"){
                handleIsHearing();
                 printSummon()
            }
            else{
                handleIsDialogue();
                 printDialogue()
            }
            clearForm();
        } else if (action === "sendSMS") {
            if(actionId === "summon"){
                //sendSMSForSummons();
            }
            else{
                //sendSMSForDialogue();
            }
        }
        console.log(otherInfo);
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        const { name, value } = e.target;
        const keys = name.split("."); 
    
        setOtherInfo((prev) => {
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
    
   
    const clearForm = () => {
        setOtherInfo({
            DateOfDelivery: "",
            DateTimeOfMeeting: "",
            LuponStaff: "",
            LuponStaffId: "",
            DateFiled: "",
            complainant:{
                fname: `${userInfo.complainant?.fname || ""} ${userInfo.complainant?.lname || ""}`.trim(),
                address: userInfo.complainant?.address || "",
                contact: userInfo.complainant?.contact || ""
            },
            respondent:{    
                fname: `${userInfo.respondent?.fname || ""} ${userInfo.respondent?.lname || ""}`.trim(),
                address: userInfo.respondent?.address || "",
                contact: userInfo.respondent?.contact || ""
            },
            sendDialogueSms: false,
            sendHearingSms: false,
        })
    }
    
    console.log(safeData);
    console.log(safeData.length)


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

// const hearingLabels = ["First", "Second", "Third"];
// const hearingB = hearingLabels[hearing] || "First";


useEffect(() => {
    if (reportData?.status === "archived" && reportData?.departmentId) {
      router.push(`/dashboard/IncidentModule/Department?id=${reportData?.departmentId}`);
    }
  }, [reportData?.status, reportData?.departmentId]);
  


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
                            //sendSMSForSummons();
                            setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });

                            if (showSubmitPopup.letterType === "summon") {
                                setTimeout(() => {
                                  router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}`);
                                }, 3000); // wait 3 seconds
                              } else {
                                setTimeout(() => {
                                  router.back();
                                }, 3000); // wait 3 seconds
                              }
                            }}
                        className="letter-announcement-btn"
                        >
                        Send SMS
                        </button>
                    ) : (
                        // CODE BLOCK FOR SEND SMS BUTTON INSIDE POP UP
                        <button
                        onClick={() => {
                            // sendSMSForDialogue();
                            setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });

                            if (showSubmitPopup.letterType === "dialogue") {
                                setTimeout(() => {
                                  router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}`);
                                }, 3000); // wait 3 seconds
                              } else {
                                setTimeout(() => {
                                  router.back();
                                }, 3000); // wait 3 seconds
                              }
                            }}
                        className="letter-announcement-btn"
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
                            <img src="/Images/loading.png" alt="loading..." className="successful-icon-popup-letter" />
                            <p>Generating letter, please wait...</p>
                        </div>
                    </div>
                )}



        {/*
               <div className="main-content-title-section">
            <div className="main-content-title-section-1">
                <h1>Generate Letter</h1>
            </div>
          
       </div> 
        */}

            <div className="edit-incident-redirectionpage-section">
                <button className="edit-incident-redirection-buttons" onClick={handleInformationSection}>
                    <div className="edit-incident-redirection-icons-section">
                    <img src="/images/profile-user.png" alt="user info" className="redirection-icons-info" /> 
                    </div>
                    <h1>Incident Information</h1>
                </button>

                <div className="dialogue-dropdown">
                    <button
                        className={
                            actionId === "dialogue"
                              ? "edit-incident-redirection-buttons-selected-dialogue-hearing"
                              : "edit-incident-redirection-buttons"
                        }
                    >
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
                    <button
                        className={
                            actionId === "summon"
                              ? "edit-incident-redirection-buttons-selected-dialogue-hearing"
                              : "edit-incident-redirection-buttons"
                        }
                    >
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
    


        <div className="main-content-letter">
        <form onSubmit={onSubmit}>

            <div className="section-1-letter">

                <div className="section-left-side-letter">
                    <button type="button" onClick={handleAddLupon}>
                        <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-letter"/> 
                    </button>

                      {actionId === "summon" ? <h1 className="NewOfficial">Summon Letter ({hearingB} Hearing)</h1> : <h1 className="NewOfficial">Dialogue Letter</h1>}
                </div>
            
            {userInfo?.status === "pending" && (
                <div className="actions-letter">
                          {(generatedHearingSummons < 3 && actionId==="summon") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                        {(!isDialogue && actionId==="dialogue") && ( <button className="letter-announcement-btn" type="submit" name="print" >Generate Letter</button>)}
                       
                       {/* this button should disappear base on hearingSMS and summonsSMS and when pressed the button should disappear but for summon needs to be press 3 times before disppear */}
                        {/* 
                        <button className="letter-announcement-btn" type="submit" name="sendSMS">
                        Send SMS
                        </button> 
                        */}                       
                            {/*Add condition when the users presses the button will be disabled (once for dialogue and 3 times for summons before disabling) */}
                </div>

            )}
                

             </div>

       
             <div className="section-2-letter">

            {/*
              <div className="section-4">
                        {(generatedHearingSummons < 3 && actionId==="summon") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                        {(!isDialogue && actionId==="dialogue") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                        <button className="letter-announcement-btn" type="submit" name="sendSMS">Send SMS</button> 
             </div>
            */}
                
                <div className="section-2-letter-upper">

                    <div className="section-2-letter-left-side">

                                        <div className="section-2-information-section">

                    <div className="section-2-information-top">

                          <div className="section-title-letter">
                                <h1>Complainant’s Information</h1>
                        </div>
                    </div>

                 <div className="section-2-information-bottom-upper">

                    <div className="information-bottom-first-section ">

                    <div className="fields-section-letter">
                          <p>Name</p>
                             <input 
                            type="text" 
                            className="generate-letter-input-field" 
                            placeholder={otherInfo.complainant.fname}
                            value={otherInfo.complainant.fname}
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
                            value={otherInfo.respondent.fname}
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

                                     <div className="section-2-information-section">
                        <div className="section-2-information-top">
                            <div className="section-title-letter">
                            <h1>Other Information</h1>
                            </div>
                        </div>

                        <div className="section-2-information-bottom">
                            {actionId === "dialogue" ? (
                            <>
                                <div className="fields-section-letter">
                                      <p>Date of Delivery</p>
                                    <input type="date" className="generate-letter-input-field" placeholder="Enter Date of Delivery" 
                                    value={safeData[0]?.DateOfDelivery||otherInfo.DateOfDelivery}
                                    id="DateOfDelivery"
                                    name="DateOfDelivery"
                                    min={today}
                                    onKeyDown={(e) => e.preventDefault()}
                                    onChange={handleChange}
                                    required
                                    disabled = {safeData[0]?.DateOfDelivery ? true : false}
                                    />
                                </div>
                                <div className="fields-section-letter">
                                     <p>Date and Time of Meeting</p>
                                    <input type="datetime-local" className="generate-letter-input-field" 
                                    value={safeData[0]?.DateTimeOfMeeting||otherInfo.DateTimeOfMeeting}
                                    onKeyDown={(e) => e.preventDefault()}
                                    id="DateTimeOfMeeting"
                                    name="DateTimeOfMeeting"
                                    onChange={handleChange}
                                    min={todayWithTime}
                                    required
                                    disabled = {safeData[0]?.DateTimeOfMeeting ? true : false}
                                    />

                                </div>
                                <div className="fields-section-letter">
                                      <p>Delivered By</p>      
                                      <select
                                            className="generate-letter-input-field-dropdown"
                                            value={safeData[0]?.LuponStaff || otherInfo.LuponStaff}
                                            onChange={(e) => {
                                                const select = e.target;
                                                const selectedOption = select.options[select.selectedIndex];
                                                const selectedName = selectedOption.value;
                                                const selectedId = selectedOption.getAttribute("data-staffid") || "";
                                                console.log("DEBUG SELECT:", selectedName, selectedId);

                                                setOtherInfo(prev => ({
                                                    ...prev,
                                                    LuponStaff: selectedName,
                                                    LuponStaffId: selectedId
                                                }));
                                            }}
                                            required
                                            disabled={!!safeData[0]?.LuponStaff}
                                        >
                                            <option value="">Select Official/Kagawad</option>
                                            {listOfStaffs.map((staff, index) => (
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
                                 <input type="date" className="generate-letter-input-field" 
                                    value={otherInfo.DateFiled}
                                    max={today}
                                    id="DateFiled"
                                    name="DateFiled"
                                    onKeyDown={(e) => e.preventDefault()}
                                    onChange={handleChange}
                                    disabled
                                    />
                                </div>
                            </>
                            ) : (
                            <>
                                <div className="fields-section-letter">
                                     <p>Date of Delivery</p>
                                     <input type="date" className="generate-letter-input-field" placeholder="Enter Date of Delivery" 
                                    value={otherInfo.DateOfDelivery}
                                    id="DateOfDelivery"
                                    name="DateOfDelivery"
                                    min={today}
                                    onKeyDown={(e) => e.preventDefault()}
                                    onChange={handleChange}
                                    required
                                
                                    />

                                </div>

                                <div className="fields-section-letter">
                                     <p>Date and Time of Meeting</p>
                                        <input type="datetime-local" className="generate-letter-input-field" 
                                        value={otherInfo.DateTimeOfMeeting}
                                        onKeyDown={(e) => e.preventDefault()}
                                        id="DateTimeOfMeeting"
                                        name="DateTimeOfMeeting"
                                        onChange={handleChange}
                                        min={todayWithTime}
                                        required              />

                                </div>

                                 <div className="fields-section-letter">
                                    <p>Delivered By</p>
                                    <select
                                        className="generate-letter-input-field-dropdown"
                                        value={otherInfo.LuponStaff}
                                        onChange={(e) => {
                                            const select = e.target;
                                            const selectedOption = select.options[select.selectedIndex];
                                            const selectedName = selectedOption.value;
                                            const selectedId = selectedOption.getAttribute("data-staffid") || "";

                                            console.log("DEBUG SELECT HEARING:", selectedName, selectedId);

                                            setOtherInfo(prev => ({
                                            ...prev,
                                            LuponStaff: selectedName,
                                            LuponStaffId: selectedId
                                            }));
                                        }}
                                        required
                                        >
                                        <option value="">Select Official/Kagawad</option>
                                        {listOfStaffs.map((staff, index) => (
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
                                    <input type="date" className="generate-letter-input-field" 
                                    value={otherInfo.DateFiled}
                                    max={today}
                                    id="DateFiled"
                                    name="DateFiled"
                                    onKeyDown={(e) => e.preventDefault()}
                                    onChange={handleChange}
                                    disabled
                                    />

                                </div>
                            </>
                            )}
                        </div>
                        </div>

                </div>

            

                



  








 
               

               
            </div>

          
           </form>

        </div> 
        {/* {data && data.length > 0 && (
           <>
             {Array.from({ length: data.length }, (_, i) => (
               <Template key={i} index={i} complainant={data[i].complainant} 
               respondent={data[i].respondent} DateFiled={data[i].DateFiled}
               DateOfDelivery={data[i].DateOfDelivery} DateOfMeeting={data[i].DateTimeOfMeeting}
               LuponStaff={data[i].LuponStaff} />
             ))}
           </>
        )} */}
       
       {/* {actionId === "summon" && (
                safeData.map((item, i) => (
                    <Letter 
                      key={i}
                      DateOfDelivery={item.DateOfDelivery}
                      DateFiled={item.DateFiled}
                      DateTimeOfMeeting={item.DateTimeOfMeeting}
                      LuponStaff={item.LuponStaff}
                      hearingNumber={item.hearingNumber}
                    />
                ))
        )} */}


      



    </main>
  );
}
