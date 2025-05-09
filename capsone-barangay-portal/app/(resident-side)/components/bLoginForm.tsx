"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation"; // Fix for 'router'
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Fix for 'auth'
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { db } from "../../db/firebase"; 
interface Official {
    username: string;
    password: string;
  }
  
  const bLoginForm: React.FC = () => {
    const [official, setOfficial] = useState<Official>({ username: "", password: "" });
    const [showErrorPopup, setShowErrorPopup] = useState(false);
  
    const router = useRouter(); // Initialize router
    const auth = getAuth();     // Initialize auth
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setOfficial((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      const result = await signIn("credentials", {
        userid: official.username,
        password: official.password,
        redirect: false,
      });
  
      if (result?.error) {
        setShowErrorPopup(true);
        return;
      }

router.push("/dashboard");


    };
 
      
    return (  
        <main className="main-container-officer-login">

            {showErrorPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>Invalid User ID or Password</p>
                        <button onClick={() => setShowErrorPopup(false)} className="continue-button">OK</button>
                    </div>
                </div>
            )}
            <div className="login-section-officer">
                <div className="first-section-officer">
                    <img 
                        src="/Images/QCLogo.png" 
                        alt="Barangay Captain" 
                        className="logo-image-officer" 
                    />
                </div>

                <div className="second-section-officer">
                    <form onSubmit={handleLogin}>
                        <div className="section1-officer">
                            <div className="form-group-officer">
                                <label htmlFor="username" className="form-label-officer">User ID: </label>
                                <input 
                                    type="text"  
                                    onChange={handleChange} value={official.username}
                                    id="username"  
                                    name="username"  
                                    className="form-input-officer"  
                                    required  
                                />
                            </div>

                            <div className="form-group-officer">
                                <label htmlFor="password" className="form-label-officer">Password</label>
                                <input 
                                    onChange={handleChange} value={official.password}
                                    type="password"  
                                    id="password"  
                                    name="password"  
                                    className="form-input-officer" 
                                    required  
                                />
                            </div>
                        </div>


                        <div className="section3-officer">
                            <button type="submit" className="submit-button-officer">Login</button>
                        </div>

                    </form> 
                </div>

            </div>
        </main>
      
    );
}
 
export default bLoginForm;