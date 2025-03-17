"use client"
import "@/CSS/IncidentModule/Letters.css";
import { useRouter, useSearchParams } from "next/navigation";
import {  useEffect,useState } from "react";
import { getSpecificDocument } from "@/app/helpers/firestorehelper";
import { doc, updateDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";



export default function GenerateDialougeLetter() {
    const user = useSession().data?.user;
    const searchParam = useSearchParams();
    const docId = searchParam.get("id")?.split("?")[0];
    const actionId = searchParam.get("id")?.split("?")[1].split("=")[1];
    const [userInfo, setUserInfo] = useState<any | null>(null);
    const [otherInfo, setOtherInfo] = useState({
        DateOfDelivery: "",
        DateOfMeeting: "",
        LuponStaff: "",
        DateFiled: "",
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
 
    useEffect(() => {
        
        if (docId) {
          getSpecificDocument("IncidentReports", docId, setUserInfo).then(() => {
            setLoading(false);
          });
        }
    }, []);

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
  
   

    const handleAddLupon = () => {
      router.back();
    };
    
    const handleUpdate = async () => {
        /* create a new subcollection to store each generation of summon and dialogue letter per respondent/complaint */

    }

    const sendSMSForDialogue = async () => {
      try{
        const response = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: otherInfo.complainant.contact,
                message: `Hello Mr/Ms. ${otherInfo.complainant.fname}, a dialogue letter will be sent to you by ${otherInfo.LuponStaff} at ${otherInfo.DateOfDelivery}.
                Please wait for the letter. Thank you!`
            })
        });
        if (!response.ok) throw new Error("Failed to send SMS");

        const data = await response.json();
        console.log(data);
      }
      catch(err) {
        console.log(err);
      }  
      try{
        const response = await fetch("/api/clickSendApi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: otherInfo.respondent.contact,
                message: `Hello Mr/Ms. ${otherInfo.respondent.fname}, a dialogue letter will be sent to you by ${otherInfo.LuponStaff} at ${otherInfo.DateOfDelivery}.
                Please wait for the letter. Thank you!`
            })
        });
        if (!response.ok) throw new Error("Failed to send SMS");

        const data = await response.json();
        console.log(data);
      }
      catch(err) {
        console.log(err);
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
                  to: otherInfo.complainant.contact,
                  message: `Hello Mr/Ms. ${otherInfo.complainant.fname}, you are being summoned to attend a meeting in the Lupon Tagapamaya Office at 
                  ${otherInfo.DateOfMeeting} for the dialouge letter. Thank you!`
              })
          });
          if (!response.ok) throw new Error("Failed to send SMS");
  
          const data = await response.json();
          console.log(data);
        }
        catch(err) {
          console.log(err);
        }  
        try{
          const response = await fetch("/api/clickSendApi", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  to: otherInfo.respondent.contact,
                  message: `Hello Mr/Ms. ${otherInfo.respondent.fname}, you are being summoned to attend a meeting in the Lupon Tagapamaya Office at 
                  ${otherInfo.DateOfMeeting} for the dialouge letter. Thank you!`
              })
          });
          if (!response.ok) throw new Error("Failed to send SMS");
  
          const data = await response.json();
          console.log(data);
        }
        catch(err) {
          console.log(err);
        }  
      }
  

    const printDialouge = async () => {
        const day = otherInfo.DateOfMeeting.split("T")[0].split("-")[2];    
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = parseInt(otherInfo.DateOfMeeting.split("T")[0].split("-")[1], 10) - 1;
        const month = monthNames[monthIndex];
        const year = otherInfo.DateOfMeeting.split("T")[0].split("-")[0];
        const time24 = otherInfo.DateOfMeeting.split("T")[1];

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
                    "Text5":"First",//make it dynamic
                    "Text6": otherInfo.DateOfMeeting,//Month Day, Year
                    "Text7":otherInfo.DateOfMeeting,//Day
                    "Text8":otherInfo.DateOfMeeting,//MonthYear
                    "Text9":otherInfo.DateOfMeeting,//Time
                    "Text10":"Morning",//Collective
                    "Text11":otherInfo.DateOfMeeting,//Day
                    "Text12":otherInfo.DateOfMeeting,//MonthYear
                    "Text14":user?.fullName,    
                }
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

    const onSubmit = (e: any) => {
        e.preventDefault();
        const action = e.nativeEvent.submitter.name;

        handleUpdate().then(() => {
            if (action === "print") {
                if(actionId === "summon"){
                    printSummon().then(() => {
                        clearForm();
                    });
                }
                else{
                    printDialouge().then(() => {
                        clearForm();
                    });
                }
            } else if (action === "sendSMS") {
                //sendSMSForDialogue();
            }
        });
        console.log(otherInfo);
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const { name, value } = e.target;
        const keys = name.split("."); // Split "complainant.fname" into ["complainant", "fname"]
    
        setOtherInfo((prev) => {
            if (keys.length === 2) {
                // If name is like "complainant.fname", update the nested object
                const [parentKey, childKey] = keys;
                return {
                    ...prev,
                    [parentKey]: {
                        ...(prev[parentKey as keyof typeof prev] as object), // Copy existing object
                        [childKey]: value // Update the specific field
                    }
                };
            }
            return { ...prev, [name]: value }; // Default case for non-nested values
        });
    };
    

    const clearForm = () => {
        setOtherInfo({
            DateOfDelivery: "",
            DateOfMeeting: "",
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


        
        <div className="main-content">
            
         

            <div className="section-1">
                <button type="button" className="back-button" onClick={handleAddLupon}></button>
                {actionId === "summon" ? <p className="NewOfficial">Summon Letter</p> : <p className="NewOfficial">Dialouge Letter</p>}

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
                        onChange={handleChange}
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.complainant.address}
                    value={otherInfo.complainant.address}
                    id="complainant.address"
                    name="complainant.address"
                    onChange={handleChange}
                    />
                    
                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.complainant.contact}
                    value={otherInfo.complainant.contact}
                    id="complainant.contact"
                    name="complainant.contact"
                    onChange={handleChange}
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
                    onChange={handleChange}
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.respondent.address}
                    value={otherInfo.respondent.address}
                    id="respondent.address"
                    name="respondent.address"
                    onChange={handleChange}
                    />
                

                    <p>Contact Nos</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {otherInfo.respondent.contact}
                    value={otherInfo.respondent.contact}
                    id="respondent.contact"
                    name="respondent.contact"
                    onChange={handleChange}
                    />
                </div>
            </div>


              <div className="section-3">
                <p className="title">Other Information</p>
                
                    <div className="bars">
                        <div className="input-group">
                            <p>Date of Delivery</p>
                            <input type="date" className="search-bar" placeholder="Enter Date of Delivery" 
                            value={otherInfo.DateOfDelivery}
                            id="DateOfDelivery"
                            name="DateOfDelivery"
                            onChange={handleChange}
                            required
                            />
                        </div>
                        
                        <div className="input-group">
                            <p>Date and Time of Meeting</p>
                            <input type="datetime-local" className="search-bar" placeholder="Enter Date of Meeting" 
                            value={otherInfo.DateOfMeeting}
                            id="DateOfMeeting"
                            name="DateOfMeeting"
                            onChange={handleChange}
                            required
                            />
                            
                        </div>

                    </div>

                    <div className="bars">
                        <div className="input-group">
                            <p>Delivered By</p>
                            <input type="text" className="search-bar" placeholder="Enter Name of Lupon Staff" 
                            value={otherInfo.LuponStaff}
                            id="LuponStaff"
                            name="LuponStaff"
                            onChange={handleChange}
                            required
                            />
                        </div>

                        <div className="input-group">
                            <p>Date Filed</p>
                            <input type="date" className="search-bar" placeholder="Choose hearing number" 
                            value={otherInfo.DateFiled}
                            id="DateFiled"
                            name="DateFiled"
                            onChange={handleChange}
                            required
                            />
                        </div>
                    </div>
                    <div className="section-4">
                        <button className="letter-announcement-btn" type="submit" name="print" >Print</button>
                        <button className="letter-announcement-btn" type="submit" name="sendSMS">Send SMS</button>
                    </div>
            </div>
           </form>

        </div> 

    

    
    </main>
  );
}
