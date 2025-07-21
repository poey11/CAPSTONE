"use client";
import { useState, useEffect } from "react";
import { auth } from '../../db/firebase';
import { signInWithEmailAndPassword,signOut, sendPasswordResetEmail, fetchSignInMethodsForEmail} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {signIn} from 'next-auth/react';
import { Eye, EyeOff } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../../db/firebase';

interface User {
    email: string;
    password: string;
}


const rLoginForm:React.FC = () => {
    const router = useRouter(); 
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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

  
    const messages = [
        "Log in to access services, updates, and connect with Barangay Fairview.",
        "Easily request documents and certificates online.",
        "Stay informed with barangay announcements and notices.",
        "Reach out to your local leaders anytime.",
        "Your community, your digital access starts here."
    ];

    const [index, setIndex] = useState(0);
    const [fadeState, setFadeState] = useState("fade-in"); // 'fade-in' or 'fade-out'

    useEffect(() => {
        const visibleDuration = 3200; // how long it's visible
        const fadeDuration = 500; // how long fade in/out lasts

        const timer = setTimeout(() => {
        setFadeState("fade-out");

        setTimeout(() => {
            setIndex((prev) => (prev + 1) % messages.length);
            setFadeState("fade-in");
        }, fadeDuration); // change text after fade-out finishes

        }, visibleDuration + fadeDuration); // wait before starting fade-out

        return () => clearTimeout(timer);
    }, [index]);

/*
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
                
                // Display a generic error message for both incorrect password and non-existing email
                setErrorMessage("Login failed. Please try again.");
                setShowErrorPopup(true);
               
            }
         
           
                
           
        }
        */

        const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            try {
              const userCredentials = await signInWithEmailAndPassword(auth, resident.email, resident.password);
              const user = userCredentials.user;
          
              if (!user.emailVerified) {
                await signOut(auth);
                setShowVerifyPopup(true);
                return;
              }
          
              const userDocRef = doc(db, "ResidentUsers", user.uid);
              const userDocSnap = await getDoc(userDocRef);
          
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
          
                if (userData.status === "Rejected") {
                    setErrorMessage("Your account has been disabled because your request was rejected.");
                    setShowErrorPopup(true);
                  
                    return; // Stop further execution
                  }
                  
                setFirstName(userData.first_name || "");
                setLastName(userData.last_name || "");
              }
          
              setShowPopup(true);
              setTimeout(() => {
                setShowPopup(false);
                router.push("/");
              }, 3000);
            } catch (error: string | any) {
              const result = await signIn("credentials", {
                userid: resident.email,
                password: resident.password,
                redirect: false,
              });
          
              setErrorMessage("Login failed. Please try again.");
              setShowErrorPopup(true);
            }
          };
          
    
    return (   

        <div className="login-container-resident">

            <div className="login-card-wrapper">

                <div className="login-left-panel">
                    <h2 className="login-heading">Login</h2>
                       <form onSubmit={handleLogin}>
                            <div className="form-group-resident">
                                <label htmlFor="Email" className="form-label-resident">Email:</label>
                                <div className="input-icon-wrapper">
                                    <input 
                                        onChange={handleChange}
                                        value={resident.email}
                                        type="text"  
                                        id="email"  
                                        name="email"  
                                        className="form-input-resident"  
                                        required  
                                    />
                                
                                    <i className="input-icon" />
                                </div>
                            </div>

                            <div className="form-group-resident">
                               <label htmlFor="password" className="form-label-resident">Password:</label>
                                <div className="input-icon-wrapper">
                                     <input 
                                    onChange={handleChange}
                                    value={resident.password}
                                    type={showPassword ? "text" : "password"}
                                    id="password"  
                                    name="password"  
                                    className="form-input-resident" 
                                    required  
                                />

                                         <button
                                                                    type="button"
                                                                    className="toggle-password-btn"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                >
                                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                                </button>
                                </div>

                                
                            </div>


                            <div className="section3-resident">
                                <button type="submit" className="submit-button-resident">Login</button>
                                </div>

                        <div className="section2-resident">
                                <span className="section2options-resident" onClick={handleForgotPassword}>Forgot Password?</span>
                                <span className="section2options-resident" onClick={handleRegister}>Sign Up</span>
                         </div>

                       </form>
                </div>

                <div className="login-right-panel">
                     <img src="/Images/QClogo.png" alt="Quezon City Logo" className="qc-logo" />
                         <h2>WELCOME TO <br />BARANGAY FAIRVIEW</h2>
                         <p className={`fade-text ${fadeState}`}>
                            {messages[index]}
                        </p>
                </div>

            </div>


           
            {/*
            
                    OLD
           
            <div className="login-contents-resident">


                <div className="login-card-resident">
                <div className="login-title-page">
                <h1>User Login</h1>
                </div>
              

                    <form onSubmit={handleLogin}>
                        <div className="section1-resident">
                            <div className="form-group-resident">
                                <label htmlFor="Email" className="form-label-resident">Email:</label>
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
                                <label htmlFor="password" className="form-label-resident">Password:</label>
                                <div className="relative">
                                <input 
                                    onChange={handleChange}
                                    value={resident.password}
                                    type={showPassword ? "text" : "password"}
                                    id="password"  
                                    name="password"  
                                    className="form-input-resident" 
                                    required  
                                />
                                <button
                                                                    type="button"
                                                                    className="toggle-password-btn"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                >
                                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                                </button>

                                </div>
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

            */}

             {showPopup && (
             <div className="popup-overlay-login">
                <div className="popup-login modern">
                    <img
                    src="/Images/successful.png"
                    alt="Success icon"
                    className="successful-icon-popup"
                    />
                    <h1>Welcome, {firstName} {lastName}!</h1>
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
        </div>

    );
}
 
export default rLoginForm;