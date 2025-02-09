"use client";
import Link from 'next/link';
import { useState } from "react";
import { auth } from '../../db/firebase';
import { signInWithEmailAndPassword,signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
interface Resident {
    email: string;
    password: string;
}


const rLoginForm:React.FC = () => {
    const router = useRouter(); 
    const [resident, setResident] = useState<Resident>({
        email: "",
        password: "",
    });
     // Handle form submission
    
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
            if(user.emailVerified){
                setResident({
                    email: "",
                    password: "",
                });
                alert("Login Successful");
                router.push("/");
            }
            else{
                await signOut(auth);
                alert("Please verify your email first");
            }
            
            /* ok di ko to gets HAHAHAH */
            // // Manually trigger form validation
            // const form = e.target as HTMLFormElement;
            // if (form.checkValidity()) {
            //     // Redirect to the Notification page after form submission if validation is successful
            //     document.location.href = '/services/barangayclearance/notification'; // Use JavaScript redirection
            // } else {
            // // If the form is invalid, trigger the validation
            //     form.reportValidity(); // This will show validation messages for invalid fields
            // }
            
        }
        catch(error: string|any){
          alert(error.message);
        }
     

       
    }
    


    return (   

        <div className="login-container">
            <div className="login-contents">
                <div className="login-card">
                    <form onSubmit={handleLogin}>
                        <div className="section1">
                            <div className="form-group">
                                <label htmlFor="Email" className="form-label">Email</label>
                                <input 
                                    onChange={handleChange}
                                    value={resident.email}
                                    type="text"  
                                    id="email"  
                                    name="email"  
                                    className="form-input"  
                                    required  
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input 
                                    onChange={handleChange}
                                    value={resident.password}
                                    type="password"  
                                    id="password"  
                                    name="password"  
                                    className="form-input" 
                                    required  
                                />
                            </div>
                        </div>

                        <div className="section2">
                            <p className="section2options">Forgot Password</p>
                            <p className="section2options">Create an Account</p>
                        </div>

                        <div className="section3">
                            <button type="submit" className="submit-button">Login</button>
                        </div>
                    </form>
                </div>
            </div>
      </div>



    // <form  onSubmit={handleLogin} className="flex flex-col  justify-center">
    //     <label htmlFor="email">Email: </label>
    //     <input value={resident.email} onChange={handleChange} id="email" type="email" name="email" className="border-2 border-black" required />
        
    //     <label htmlFor="password">Password: </label>
    //     <input value={resident.password} onChange={handleChange} id="password" type="password" name="password" className="border-2 border-black" required />
        
    //     <label htmlFor="remember">Remember me: </label>
    //     <input  checked={resident.remember} onChange={handleChange} id="remember" type="checkbox" name="remember" />

    //     <Link className="text-blue-800" href="/forgot-password">Forgot Password?</Link>
        
    //     <button type="submit" className="bg-blue-500 text-white">Login</button>
    // </form>

    );
}
 
export default rLoginForm;