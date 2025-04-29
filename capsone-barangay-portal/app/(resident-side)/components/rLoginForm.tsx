"use client";
import { useState } from "react";
import { auth } from '../../db/firebase';
import { signInWithEmailAndPassword,signOut, sendPasswordResetEmail, fetchSignInMethodsForEmail} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {signIn} from 'next-auth/react';
import { FirebaseError } from "firebase/app"; 
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from '../../db/firebase';

interface User {
    email: string;
    password: string;
}


const rLoginForm:React.FC = () => {
    const router = useRouter(); 
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const handleRegister = () => {
      router.push("/register");
    };
    const [resident, setResident] = useState<User>({
        email: "",
        password: "",
    });

    const [showPopup, setShowPopup] = useState(false);
    const [showVerifyPopup, setShowVerifyPopup] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [userEmail, setUserEmail] = useState("");

     // Handle form submission
    
    const handleForgotPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, resident.email);
            setErrorMessage("Password reset email sent. Please check your inbox.");
            setShowErrorPopup(true);
            resident.email = "";
        } catch (error: string | any) {
            if(resident.email === ""){
                setErrorMessage("Please enter your email address.");
            }
            else{
                setErrorMessage("Invalid email. Please try again.");
            }
            setShowErrorPopup(true);
        }

    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
       const { name, value, type } = e.target;
         if(type === "checkbox"){
              setResident({
                ...resident,
                [name]: (e.target as HTMLInputElement).checked,
              });
         }
         else{
              setResident({
                ...resident,
                [name]: value,
              });
        }
    }
    

    
    const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {    
        e.preventDefault();
        try{
            const userCredentials = await signInWithEmailAndPassword(auth, resident.email, resident.password);
            const user = userCredentials.user;

            if (user.emailVerified) {
               
                const userDocRef = doc(db, "ResidentUsers", user.uid);
                const userDocSnap = await getDoc(userDocRef);
    
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const status = userData.status;

                    setFirstName(userData.first_name || "");
                    setLastName(userData.last_name || "");
                }
    
                setShowPopup(true);
                setTimeout(() => {
                    setShowPopup(false);
                    router.push("/");
                }, 2000);
                return;
            } else {
                await signOut(auth);
                setShowVerifyPopup(true);
            }

            
            
        } catch (error: string | any) {
            const result = await signIn("credentials", { 
                userid: resident.email,
                password: resident.password,
                redirect: false,
            });
            
            setErrorMessage("Login failed. Please try again.");
            setShowErrorPopup(true);
           
        }  
    }
        
    




    /*
        Something wrong with the error messages. Palagi dinidisplay "Account does not exist"

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        try {
            // Try to sign in with email and password
            const userCredentials = await signInWithEmailAndPassword(auth, resident.email, resident.password);
            const user = userCredentials.user;
    
            // Check if email is verified
            if (!user.emailVerified) {
                await signOut(auth);
                setShowVerifyPopup(true);
                return;
            }
    
            // Check Firestore doc
            const userDocRef = doc(db, "ResidentUsers", user.uid);
            const userDocSnap = await getDoc(userDocRef);
    
            if (!userDocSnap.exists()) {
                await signOut(auth);
                setErrorMessage("Account does not exist.");
                setShowErrorPopup(true);
                return;
            }
    
            // Load user info
            const userData = userDocSnap.data();
            setFirstName(userData.first_name || "");
            setLastName(userData.last_name || "");
    
            // Success popup
            setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
                router.push("/");
            }, 2000);
    
        }catch (error: any) {
            console.error("Login error:", error.code); // Optional: Keep this for debugging
        
            if (error.code === "auth/user-not-found") {
                setErrorMessage("Account does not exist.");
            } else if (
                error.code === "auth/wrong-password" || 
                error.code === "auth/invalid-credential"
            ) {
                // Now check if the email exists
                try {
                    const methods = await fetchSignInMethodsForEmail(auth, resident.email);
                    if (methods.length === 0) {
                        setErrorMessage("Account does not exist.");
                    } else {
                        setErrorMessage("Incorrect password. Please try again.");
                    }
                } catch {
                    setErrorMessage("Login failed. Please try again.");
                }
            } else if (error.code === "auth/invalid-email") {
                setErrorMessage("Invalid email format.");
            } else {
                setErrorMessage("Login failed. Please try again.");
            }
        
            setShowErrorPopup(true);
        }
    };*/
    
    


    

    
    return (   

        <div className="login-container-resident">
            {showPopup && (
                <div className="popup-overlay-login">
                    <div className="popup-login">
                    <img src="/Images/successful.png" alt="warning icon" className="successful-icon-popup" />
                        <h1>Welcome, {firstName} {lastName}!</h1>
                        <br/>
                        <p>Redirecting to the Home Page...</p>
                    </div>
                </div>
            )}
            {showVerifyPopup && (
                <div className="popup-overlay-login">
                    <div className="popup-login">
                        <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                        <p>Please verify your email first.</p>
                        <button onClick={() => setShowVerifyPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}
            {showErrorPopup && (
                <div className="popup-overlay-login">
                    <div className="popup-login">
                        <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                        <p>{errorMessage}</p>
                        <button onClick={() => setShowErrorPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}
            <div className="login-contents-resident">


                <div className="login-card-resident">
                <div className="login-title-page">
                <h1>User Login</h1>
                </div>
              

                    <form onSubmit={handleLogin}>
                        <div className="section1-resident">
                            <div className="form-group-resident">
                                <label htmlFor="Email" className="form-label-resident">Email</label>
                                <input 
                                    onChange={handleChange}
                                    value={resident.email}
                                    type="text"  
                                    id="email"  
                                    name="email"  
                                    className="form-input-resident"  
                                    required  
                                />
                            </div>

                            <div className="form-group-resident">
                                <label htmlFor="password" className="form-label-resident">Password</label>
                                <input 
                                    onChange={handleChange}
                                    value={resident.password}
                                    type="password"  
                                    id="password"  
                                    name="password"  
                                    className="form-input-resident" 
                                    required  
                                />
                            </div>
                        </div>

                        <div className="section2-resident">
                            <button type="button" className="section2options-resident" onClick={handleForgotPassword}>Forgot Password</button>
                            <button type="button"className="section2options-resident" onClick={handleRegister}>Create an Account</button>
                        </div>

                        <div className="section3-resident">
                            <button type="submit" className="submit-button-resident">Login</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    );
}
 
export default rLoginForm;