"use client"
import React,{useState, useEffect, ChangeEvent} from "react";
import {db} from "../../../../db/firebase";
import {collection, getDocs, onSnapshot, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/AddBarangayUser.css";
import { useRouter } from "next/navigation";


export default function AddBarangayUser() {     

    interface BarangayUser{
        id?: string;
        userId: string;
        position:string;
        password:string;
        role: string;
    }
    
    const [users, setUsers] = useState<BarangayUser>({
        userId:"",
        position:"",
        password:"",
        role:"Barangay Official"
    });
   
    const router = useRouter();

    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");


    const [loading, setLoading] = useState(false);



    const handleBack = () => {
        window.location.href = "/dashboard/admin";
    };

    const GenerateID = async (e: any) => {
        e.preventDefault();
        
        const generateNewID = async (): Promise<string> => {
            const year = new Date().getFullYear().toString(); // First 4 digits
            const randomNum = Math.floor(100 + Math.random() * 900).toString(); // Ensures 3-digit number (100-999)
            const randomId = year + randomNum; // Concatenates to make 7 digits
    
            // ✅ Check Firestore if the ID already exists
            const barangayUsersCollection = collection(db, "BarangayUsers");
            const querySnapshot = await getDocs(query(barangayUsersCollection, where("userId", "==", randomId)));
    
            if (!querySnapshot.empty) {
                console.log(`ID ${randomId} already exists, regenerating...`);
                return generateNewID(); // 🔄 Recursively call the function if ID exists
            }
    
            return randomId; // ✅ Unique ID found
        };
    
        const uniqueId = await generateNewID(); // Wait for a unique ID to be generated
    
        setUsers((prevUsers) => ({
            ...prevUsers,
            userId: uniqueId,
        }));
    
    };

    const handleChange = (  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>)=>{
            e.preventDefault();
          
            const {name, value} = e.target;
            setUsers((prevUsers) => ({
                ...prevUsers,
                [name]: value
            }));
    }

    const handleSubmitClick = async () => {
        const { 
          password, userId
      } = users;
      
        if (!password || !userId) {
    
          setPopupErrorMessage("Please fill up all required fields.");
          setShowErrorPopup(true);
      
        // Hide the popup after 3 seconds
        setTimeout(() => {
          setShowErrorPopup(false);
          
        }, 3000);
        
          return;
        }
      
        setShowSubmitPopup(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitPopup(false);
      
        setPopupMessage("Barangay User created successfully!");
        setShowPopup(true);
      
        // Hide the popup after 3 seconds
        setTimeout(() => {
          setShowPopup(false);
          router.push("/dashboard/admin");
        }, 3000);
      
        // Create a fake event and call handleSubmit
        const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
        await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
      };


    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
        
            
            console.log(users);
            
            try{
                const respone = await fetch('/api/barangayRegister', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userid: users.userId,
                        password: users.password,
                        role: users.role,
                        position: users.position,
                        createdBy: "Assistant Secretary"
                    })
                });
                const data = await respone.json();
    
    
                setUsers({
                    userId:"",
                    position:"",
                    password:"",
                    role:"Barangay Official"
                })
            }
            catch(error: string | any){
                console.log(error.message);
            }
            
       }
    

    return (

        <main className="add-barangayuser-main-container">
            <div className="add-barangayuser-page-title-section-1">
                <h1>Add New Barangay User</h1>
            </div>

            <div className="add-barangayuser-main-content">
                <div className="add-barangayuser-main-section1">
                    <div className="add-barangayuser-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> New Barangay User </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-view" onClick={handleSubmitClick} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                <hr/>

                <div className="create-new-barangay-user">
                    <form id="addBarangayUserForm" onSubmit={handleSubmit}>
                        <div className="fields-container">
                            <div className="fields-section">
                                <p>Position</p>
                                <select  value={users.position}  onChange={handleChange} id="roles" name="position" className="role" >
                                    <option value="" disabled>Select a Position</option>
                                    <option value="Punong Barangay">Punong Barangay</option>
                                    <option value="Secretary">Secretary</option>
                                    <option value="Assistant Secretary">Asst Secretary</option>
                                    <option value="Admin Staff">Admin Staff</option>
                                    <option value="LF Staff">LF Staff</option>
                                </select>
                            </div>
                    
                            <div className="fields-section">
                                <p>Password <span className="required">*</span></p>
                                <input 
                                    value={users.password} 
                                    onChange={handleChange} 
                                    id="password" 
                                    type="password" 
                                    name="password" 
                                    className="password" 
                                    placeholder="Enter Password"
                                    required
                                />
                            </div>

                            <div className="fields-section">
                                <p>User ID <span className="required">*</span> </p>
                                <input 
                                    type="text" 
                                    id="username"
                                    name="userId"
                                    className="userID" 
                                    value={users.userId} 
                                    placeholder="User ID"
                                    disabled  
                                    required
                                />
                            </div>
                        </div>
                        <div className="actions-section">
                            <button onClick={GenerateID} className="generateUserID">Generate User ID</button>
                        </div>
                        
                    </form>
                </div>

            </div>


            {showSubmitPopup && (
                        <div className="addbrgyuser-confirmation-popup-overlay">
                            <div className="addbrgyuser-confirmation-popup">
                                <p>Are you sure you want to submit?</p>
                                <div className="addbrgyuser-yesno-container">
                                    <button onClick={() => setShowSubmitPopup(false)} className="addbrgyuser-no-button">No</button>
                                    <button onClick={confirmSubmit} className="addbrgyuser-yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
        )}

        {showPopup && (
                <div className={`addbrgyuser-popup-overlay show`}>
                    <div className="addbrgyuser-popup">
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`addbrgyuser-error-popup-overlay show`}>
                    <div className="addbrgyuser-popup">
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
        </main>

    );
}