"use client"
import "@/CSS/IncidentModule/Letters.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect,useState } from "react";
import { getSpecificDocument } from "@/app/helpers/firestorehelper";
import { doc, updateDoc } from "firebase/firestore";




export default function GenerateDialougeLetter() {

    const searchParam = useSearchParams();
    const docId = searchParam.get("id");
    const [userInfo, setUserInfo] = useState<any | null>(null);
   
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [otherInfo, setOtherInfo] = useState({
        DateOfDelivery: "",
        DateOfMeeting: "",
        LuponStaff: "",
        DateFiled: ""
    });

    useEffect(() => {
        if (docId) {
          getSpecificDocument("IncidentReports", docId, setUserInfo).then(() => {
            setLoading(false);
          });
        }
    }, []);
  
    const handleAddLupon = () => {
      router.back();
    };
    
    const handleUpdate = async () => {

    }

    const sendSMS = async () => {
      try{
        const response = await fetch("/api/twilioAPI", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: userInfo.complainant.contactNumber,
                message: `Hello ${userInfo.complainant.fname} ${userInfo.complainant.lname} , your being summoned to attend a meeting on ${otherInfo.DateOfMeeting} at ${otherInfo.LuponStaff} office
                for the dialouge letter. Thank you!`
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

    const onSubmit = (e: any) => {
        e.preventDefault();
        const action = e.nativeEvent.submitter.name;

        handleUpdate().then(() => {
            if (action === "print") {
                alert("Printing the document...");
            } else if (action === "sendSMS") {
                sendSMS()
               
            }
        });
        console.log(otherInfo)
    }
    
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setOtherInfo((prev) => ({
          ...prev,
          [name]: value,
        }));
    }

    const clearForm = () => {
        setOtherInfo({
            DateOfDelivery: "",
            DateOfMeeting: "",
            LuponStaff: "",
            DateFiled: ""
        })
    }
    

  return (
    <main className="main-container">


        
        <div className="main-content">
            
         

            <div className="section-1">
                    <button type="submit" className="back-button" onClick={handleAddLupon}></button>
                <p className="NewOfficial"> Dialouge Letter</p>
             </div>


             <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder={userInfo?.complainant.fname + " " + userInfo?.complainant.lname || ""}
                    disabled
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder= {userInfo?.complainant.address || ""}
                    disabled
                    />
                    

                </div>

                <div className="section-2-right-side">

                <p>Respondent's Information</p>
                  
                <p>Name</p>

                <input 
                type="text" 
                className="search-bar" 
                placeholder={userInfo?.respondent.fname + " " + userInfo?.respondent.lname || ""}
                disabled
                />

                <p>Address</p>

                <input 
                type="text" 
                className="search-bar" 
                placeholder= {userInfo?.respondent.address || ""}
                disabled
                />
                </div>

             </div>


              <div className="section-3">
                <p className="title">Other Information</p>
                <form onSubmit={onSubmit}>
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
                            <p>Date of Meeting</p>
                            <input type="date" className="search-bar" placeholder="Enter Date of Meeting" 
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
                            <p>Lupon Staff</p>
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
                </form>
            </div>


            



           

        </div> 

    

    
    </main>
  );
}
