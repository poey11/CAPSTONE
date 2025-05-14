"use client"
import "@/CSS/IncidentModule/Letters.css";
import { useRouter, useSearchParams } from "next/navigation";
import {  useEffect,useState } from "react";
import { addDoc,collection,doc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { db } from "@/app/db/firebase";
import { getLocalDateString, getLocalDateTimeString } from "@/app/helpers/helpers";

export default function GenerateDialougeLetter() {
    const user = useSession().data?.user;
    const searchParam = useSearchParams();
    const docId = searchParam.get("id")?.split("?")[0];
    const actionId = searchParam.get("id")?.split("?")[1].split("=")[1];
    const today = getLocalDateString(new Date());
    const [listOfStaffs, setListOfStaffs] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any | null>(null);
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    
    const [otherInfo, setOtherInfo] = useState({
        DateOfDelivery: "",
        DateTimeOfMeeting: "",
        LuponStaff: "",
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
        }
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
                    setListOfStaffs((prev) => [...prev, doc.data()]);
                });
      
            } catch (error: any) {
              console.error("Error fetching LT List:", error.message);
            }    
        }
        fetchStaffList();
    },[]);

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
                    contact: userInfo.complainant?.contact || ""
                },
                respondent: {
                    fname: `${userInfo.respondent?.fname || ""} ${userInfo.respondent?.lname || ""}`.trim(),
                    address: userInfo.respondent?.address || "",
                    contact: userInfo.respondent?.contact || ""
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

      try{
        const response = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: otherInfo.complainant.contact,
                message: `Hello Mr/Ms. ${otherInfo.complainant.fname}, a dialogue invitation will be deliver to you by ${otherInfo.LuponStaff} at ${otherInfo.DateOfDelivery}.
                Please wait for the invitation. Thank you!`
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
                message: `Hello Mr/Ms. ${otherInfo.respondent.fname}, a dialogue invitation will be deliver to you by ${otherInfo.LuponStaff} at ${otherInfo.DateOfDelivery}.
                Please wait for the invitation. Thank you!`
            })
        });
        if (!responseB.ok) throw new Error("Failed to send SMS");

        const dataB = await responseB.json();
        console.log(dataB);
      }
      catch(err) {
        console.log(err);
      }  
      
    }

    const sendSMSForSummons = async () => {
        //dont forget to add respondent contact number
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  to: otherInfo.respondent.contact,
                  message: `Hello Mr/Ms. ${otherInfo.respondent.fname}, a summons will be deliver to you by ${otherInfo.LuponStaff} at ${otherInfo.DateOfDelivery}.
                Please wait for the invitation. Thank you!`
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
                message: `Hello Mr/Ms. ${otherInfo.complainant.fname}, a summons will be deliver to you by ${otherInfo.LuponStaff} at ${otherInfo.DateOfDelivery}.
              Please wait for the invitation. Thank you!`
            })
        });
        if (!responseB.ok) throw new Error("Failed to send SMS");

        const dataB = await responseB.json();
        console.log(dataB);
        }
        catch(err) {
          console.log(err);
        }  
    }
  

    const printDialouge = async () => {
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
            
        } catch (error) {
            console.error(error)
        }
    }
    const printSummon = async () => {
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
        
        let hearingB ="";
        if(hearing == 0 ){ 
            hearingB = "First";
        }
        else if (hearing == 1){
            hearingB = "Second";
        }
        else if (hearing == 2){
            hearingB = "Third";
        }
       
        
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
       }
       catch(e:any){
        console.log()
       } 
    
    }
    

    const handleIsDialogue = async () => {
        try {
            if(!docId) throw new Error("Document ID is undefined");

            const docRef = doc(db, "IncidentReports", docId);
            const updates = {
                isDialogue: true,
            };
            await updateDoc(docRef, updates);
            const docRefB = (collection(db, "IncidentReports", docId, "GeneratedLetters"))
            
            await addDoc(docRefB, {
                createdAt: new Date(),
                createdBy: user?.fullName,
                letterType: actionId,
                DateOfDelivery: otherInfo.DateOfDelivery,
                DateTimeOfMeeting: otherInfo.DateTimeOfMeeting,
                LuponStaff: otherInfo.LuponStaff,
                DateFiled: otherInfo.DateFiled,                
            });
        }
        catch (error: string|any) {
            console.error(error);
        }
    }
    const handleIsHearing = async () => {
        try {
            if(!docId) throw new Error("Document ID is undefined");

            const docRefB = (collection(db, "IncidentReports", docId, "GeneratedLetters"))
            console.log(hearing);
            await addDoc(docRefB, {
                createdAt: new Date(),
                createdBy: user?.fullName,
                letterType: actionId,
                DateOfDelivery: otherInfo.DateOfDelivery,
                DateTimeOfMeeting: otherInfo.DateTimeOfMeeting,
                LuponStaff: otherInfo.LuponStaff,
                DateFiled: otherInfo.DateFiled,                
               hearingNumber: hearing
            });

            const docRef = doc(db, "IncidentReports", docId);
            const updates = {
                    ...(hearing !== 3 && { hearing: hearing + 1 }),
                generatedHearingSummons: generatedHearingSummons + 1,
            };
            await updateDoc(docRef, updates);

        }
        catch (error: string|any) {
            console.error(error);
        }
    }

    const meeting = getLocalDateString(new Date(otherInfo.DateTimeOfMeeting.split("T")[0]));
    const delivery = getLocalDateString(new Date(otherInfo.DateOfDelivery));
    const onSubmit = (e: any) => {
        e.preventDefault();
        const action = e.nativeEvent.submitter.name;
        
        if(delivery > meeting){
            setErrorPopup({ show: true, message: "Date of Delivery must be earlier than Date of Meeting" });
            return;
        }
        if (action === "print") {
            if(actionId === "summon"){
                handleIsHearing();
                // printSummon()
            }
            else{
                handleIsDialogue();
                // printDialouge()
            }
            //clearForm();
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
            }
        })
    }
    

  return (
    <main className="main-container">
        {errorPopup.show && (
              <div className="popup-overlay error">
                  <div className="popup">
                      <p>{errorPopup.message}</p>
                      <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button">Close</button>
                  </div>
              </div>
        )}
        <div className="main-content">
            <div className="section-1">
                <button type="button" className="back-button" onClick={handleAddLupon}></button>
                {actionId === "summon" ? <p className="NewOfficial">Summon Letter ({hearing} Hearing)</p> : <p className="NewOfficial">Dialouge Letter</p>}

             </div>

             <form onSubmit={onSubmit}>
             <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                        type="text" 
                        className="search-bar" 
                        placeholder={otherInfo.complainant.fname}
                        value={otherInfo.complainant.fname}
                        id="complainant.fname"
                        name="complainant.fname"
                        disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.complainant.address}
                    value={otherInfo.complainant.address}
                    id="complainant.address"
                    name="complainant.address"
                    disabled
                    />
                    
                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.complainant.contact}
                    value={otherInfo.complainant.contact}
                    id="complainant.contact"
                    name="complainant.contact"
                    disabled
                    />

                </div>

                <div className="section-2-right-side">

                    <p>Respondent's Information</p>
                    
                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder={otherInfo.respondent.fname}
                    value={otherInfo.respondent.fname}
                    id="respondent.fname"
                    name="respondent.fname"
                    disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.respondent.address}
                    value={otherInfo.respondent.address}
                    id="respondent.address"
                    name="respondent.address"
                    disabled
                    />
                

                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.respondent.contact}
                    value={otherInfo.respondent.contact}
                    id="respondent.contact"
                    name="respondent.contact"
                    disabled
                    />
                </div>
            </div>


              <div className="section-3">
                <p className="title">Other Information</p>
                {actionId === "dialogue" ? (<>
                    <div className="bars">
                        <div className="input-group">
                            <p>Date of Delivery</p>
                            <input type="date" className="search-bar" placeholder="Enter Date of Delivery" 
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
                        
                        <div className="input-group">
                            <p>Date and Time of Meeting</p>
                            <input type="datetime-local" className="search-bar" 
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

                    </div>

                    <div className="bars">
                        <div className="input-group">
                            {/* change into drop box */}
                            <p>Delivered By</p>
                            <select className="search-bar" value={safeData[0]?.LuponStaff||otherInfo.LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            onChange={handleChange}
                            required
                            disabled = {safeData[0]?.LuponStaff ? true : false}
                            >
                                <option value="">Select Official/Kagawad</option>
                                {listOfStaffs.map((staff, index) => (
                                    <option key={index} value={`${staff.firstName} ${staff.lastName}`}>
                                        {staff.firstName} {staff.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <p>Date Filed</p>
                            <input type="date" className="search-bar" 
                            value={otherInfo.DateFiled}
                            max={today}
                            id="DateFiled"
                            name="DateFiled"
                            onKeyDown={(e) => e.preventDefault()}
                            onChange={handleChange}
                            disabled
                            />
                        </div>
                    </div>
                
                </>) : 
                (<>
                    <div className="bars">
                        <div className="input-group">
                            <p>Date of Delivery</p>
                            <input type="date" className="search-bar" placeholder="Enter Date of Delivery" 
                            value={otherInfo.DateOfDelivery}
                            id="DateOfDelivery"
                            name="DateOfDelivery"
                            min={today}
                            onKeyDown={(e) => e.preventDefault()}
                            onChange={handleChange}
                            required
                           
                            />
                        </div>
                        
                        <div className="input-group">
                            <p>Date and Time of Meeting</p>
                            <input type="datetime-local" className="search-bar" 
                            value={otherInfo.DateTimeOfMeeting}
                            onKeyDown={(e) => e.preventDefault()}
                            id="DateTimeOfMeeting"
                            name="DateTimeOfMeeting"
                            onChange={handleChange}
                            min={todayWithTime}
                            required                            />
                            
                        </div>

                    </div>

                    <div className="bars">
                        <div className="input-group">
                            {/* change into drop box */}
                            <p>Delivered By</p>
                            <select className="search-bar" value={otherInfo.LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            onChange={handleChange}
                            required
                            >
                                <option value="">Select Official/Kagawad</option>
                                {listOfStaffs.map((staff, index) => (
                                    <option key={index} value={`${staff.firstName} ${staff.lastName}`}>
                                        {staff.firstName} {staff.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <p>Date Filed</p>
                            <input type="date" className="search-bar" 
                            value={otherInfo.DateFiled}
                            max={today}
                            id="DateFiled"
                            name="DateFiled"
                            onKeyDown={(e) => e.preventDefault()}
                            onChange={handleChange}
                            disabled
                            />
                        </div>
                    </div>
                </>)}
                    
                    <div className="section-4">
                        {(generatedHearingSummons < 3 && actionId==="summon") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                        {(!isDialogue && actionId==="dialogue") && ( <button className="letter-announcement-btn" type="submit" name="print" >Print</button>)}
                        <button className="letter-announcement-btn" type="submit" name="sendSMS">Send SMS</button>
                    </div>
            </div>
           </form>

        </div> 
       
       
    </main>
  );
}
