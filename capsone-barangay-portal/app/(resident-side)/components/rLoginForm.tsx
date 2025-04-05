"use client";
import { useState } from "react";
import { auth } from '../../db/firebase';
import { signInWithEmailAndPassword,signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {signIn} from 'next-auth/react';
interface User {
    email: string;
    password: string;
}


const rLoginForm:React.FC = () => {
    const router = useRouter(); 

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
                setUserEmail(resident.email);
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
            
            setErrorMessage("Invalid email or password. Please try again.");
            setShowErrorPopup(true);
           
        }
     
       
            
       
    }
    


    return (   

        <div className="login-container-resident">
            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>Welcome, {userEmail}!</p>
                        <p>Redirecting to the Home Page...</p>
                    </div>
                </div>
            )}
            {showVerifyPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>Please verify your email first.</p>
                        <button onClick={() => setShowVerifyPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}
            {showErrorPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>{errorMessage}</p>
                        <button onClick={() => setShowErrorPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}
            <div className="login-contents-resident">
                <div className="login-card-resident">
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