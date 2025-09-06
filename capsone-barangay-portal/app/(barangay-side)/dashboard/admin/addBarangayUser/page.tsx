"use client"
import React,{useState, ChangeEvent, useEffect} from "react";
import {db} from "../../../../db/firebase";
import {collection, getDocs, addDoc, query, where} from "firebase/firestore";
import "@/CSS/User&Roles/AddBarangayUser.css";
import { useRouter } from "next/navigation";
import { hash } from "bcryptjs";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface BarangayUser{
    id?: string;
    userId: string;
    position:string;
    password:string;
    role: string;
}


export default function AddBarangayUser() {     

   const user = useSession().data?.user;
    const userRole = user?.position;
    const [users, setUsers] = useState<BarangayUser>({
        userId:"",
        position:"",
        password:"",
        role:"Barangay Official",
    });
   
    const router = useRouter();

    const [showSubmitPopup, setShowSubmitPopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [invalidFields, setInvalidFields] = useState<string[]>([]);


    const [loading, setLoading] = useState(true);


    

    useEffect(() => {
        if(userRole !== "Admin" && userRole !== "Assistant Secretary") {
            router.push("/dashboard/admin/BarangayUsers");
            return;
        }
        setLoading(false);
    }, []);

    if (loading) return <p>Loading...</p>;
   



    const handleBack = () => {
        window.location.href = "/dashboard/admin/BarangayUsers";
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
        const { position, password, userId } = users;

        const invalidFields : string[] = [];

        if (!position) invalidFields.push("position");
        if (!password) invalidFields.push("password");
        if (!userId) invalidFields.push("userId");
        
        if (invalidFields.length > 0) {
            
         setInvalidFields(invalidFields);
        setPopupErrorMessage("Please fill up all required fields.");
        setShowErrorPopup(true);
    
        setTimeout(() => {
          setShowErrorPopup(false);
        }, 3000);
        return;

        }


        if (password.length < 6) {
            setInvalidFields(invalidFields);
            setPopupErrorMessage("Password must be at least 6 characters.");
            setShowErrorPopup(true);
            setTimeout(() => setShowErrorPopup(false), 3000);
            return;
        }
        
        setInvalidFields([]);
        setShowSubmitPopup(true);
    };


      const confirmSubmit = async () => {
        setShowSubmitPopup(false);
        
        const passwordHash = await hash(users.password, 12);
        const docRef = await addDoc(collection(db, "BarangayUsers"), {
          userid: users.userId,
          password: passwordHash,
          role: users.role,
          position: users.position,
          createdAt: new Date().toISOString().split("T")[0],
          firstTimelogin: true,
          firstName: "User",
          lastName: ""
        });
    
        setPopupMessage("Barangay User created successfully!");
        setShowPopup(true);
    
        setTimeout(() => {
          setShowPopup(false);
          
          router.push(`/dashboard/admin/BarangayUsers?highlight=${docRef.id}`);
        }, 3000);
    
        
        setUsers({ userId: "", position: "", password: "", role: "Barangay Official" });
      };


      const handleSubmit = () => {
        if (!users.userId || !users.password) {
          setPopupErrorMessage("Please fill up all required fields.");
          setShowErrorPopup(true);
          return setTimeout(() => setShowErrorPopup(false), 3000);
        }
        setShowSubmitPopup(true);
      };
    

    return (

        <main className="add-barangayuser-main-container">
        

            <div className="add-barangayuser-main-content">
                <div className="add-barangayuser-main-section1">
                    <div className="add-barangayuser-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> New Barangay User </h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="action-view" onClick={handleSubmitClick} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

              

                <div className="create-new-barangay-user">
                    <form id="addBarangayUserForm" onSubmit={handleSubmit} className="add-barangay-section-2">
                        <div className="fields-container-barangay-user">

                             <div className="add-barangay-user-section-2-left-side">
                                    <div className="fields-section">
                                        <p>Position <span className="required">*</span> </p>
                                        <select  value={users.position}  onChange={handleChange} id="roles" name="position" className={`barangay-user-input-fields ${invalidFields.includes("position") ? "input-error" : ""}`} >
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
                                            className={`barangay-user-input-fields ${invalidFields.includes("password") ? "input-error" : ""}`}
                                            placeholder="Enter Password"
                                            required
                                        />
                                    </div>
                             </div>
                          
                              <div className="add-barangay-user-section-2-right-side">

                                <div className="fields-section">
                                <p>User ID <span className="required">*</span> </p>
                                <input 
                                    type="text" 
                                    id="username"
                                    name="userId"
                                    className={`barangay-user-input-fields ${invalidFields.includes("userId") ? "input-error" : ""}`}
                                    value={users.userId} 
                                    placeholder="User ID"
                                    disabled  
                                    required
                                />
                                </div>
                               
                               <div className="actions-section-addbrgyuser">
                                    <button onClick={GenerateID} className="generateUserID">Generate User ID</button>
                                </div>

                              </div>
                     
                        
                        </div>
                     
                    </form>
                </div>

            </div>


            {showSubmitPopup && (
                        <div className="addbrgyuser-confirmation-popup-overlay">
                            <div className="addbrgyuser-confirmation-popup">
                                <img src="/Images/question.png" alt="warning icon" className="clarify-icon-popup" />
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
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}

        {showErrorPopup && (
                <div className={`addbrgyuser-error-popup-overlay show`}>
                    <div className="addbrgyuser-popup">
                    <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
        </main>

    );
}