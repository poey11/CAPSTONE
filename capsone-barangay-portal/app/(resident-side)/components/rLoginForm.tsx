"use client";
import Link from 'next/link';
import { useState } from "react";
import { auth } from '../../db/firebase';
import { signInWithEmailAndPassword,signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
interface Resident {
    email: string;
    password: string;
    remember: boolean;
}


const rLoginForm:React.FC = () => {
    const router = useRouter(); 
    const [resident, setResident] = useState<Resident>({
        email: "",
        password: "",
        remember: false
    });
    
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
        /* I havent added the forget password and remember me functions */
        e.preventDefault();
        console.log(resident);
        try{
            const userCredentials = await signInWithEmailAndPassword(auth, resident.email, resident.password);
            const user = userCredentials.user;
            if(user.emailVerified){
                setResident({
                    email: "",
                    password: "",
                    remember: false
                });
                alert("Login Successful");
                router.push("/");
            }
            else{
                await signOut(auth);
                alert("Please verify your email first");
                /* should i inclde an option to resend verification? */
            }
            
        }
        catch(error: string|any){
          alert(error.message);
        }
     

       
    }
    

    return (   
    <form  onSubmit={handleLogin} className="flex flex-col  justify-center">
        <label htmlFor="email">Email: </label>
        <input value={resident.email} onChange={handleChange} id="email" type="email" name="email" className="border-2 border-black" required />
        
        <label htmlFor="password">Password: </label>
        <input value={resident.password} onChange={handleChange} id="password" type="password" name="password" className="border-2 border-black" required />
        
        <label htmlFor="remember">Remember me: </label>
        <input  checked={resident.remember} onChange={handleChange} id="remember" type="checkbox" name="remember" />

        <Link className="text-blue-800" href="/forgot-password">Forgot Password?</Link>
        
        <button type="submit" className="bg-blue-500 text-white">Login</button>
    </form>

    );
}
 
export default rLoginForm;