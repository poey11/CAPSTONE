"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
interface official{
    username: string;
    password: string;
    remember: boolean;
}

const bLoginForm:React.FC = () => {
    const router = useRouter();
    const [official, setOfficial] = useState<official>({
        username: "",
        password: "",
        remember: false
    });

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if(type === "checkbox"){
            setOfficial({
                ...official,
                [name]: (e.target as HTMLInputElement).checked,
            });
        }
        else{
            setOfficial({
                ...official,
                [name]: value,
            });
        }
    }

    const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(official);
        try{
            const response = await fetch("/api/barangayLogin", {
                method: "POST",
                headers:{
                    "Content-Type": "application/json"},
                body: JSON.stringify({userid: official.username, password: official.password})
            });
            if(response.ok){
                /* should check the first time login column to check if it would have to redirect to the account setup first or if the account has alr been setuped */
                router.push("/dashboard");
            }else{
                const data = await response.json();
                alert("Login Failed " +  data.message)
            }
        }
        catch(error:string|any){
            console.log("Error: " + error.message)
        }
    }

    return (  
        <form   onSubmit={handleLogin} className="flex flex-col  justify-center">
            <label htmlFor="username">Username: </label>
            <input onChange={handleChange} value={official.username}   id="username" type="text" name="username" className="border-2 border-black" required />
            
            <label htmlFor="password">Password: </label>
            <input  onChange={handleChange} value={official.password} id="password" type="password" name="password" className="border-2 border-black" required />
            
            <label htmlFor="remember">Remember me: </label>
            <input  onChange={handleChange} checked={official.remember} id="remember" type="checkbox" name="remember" />

            
            <button type="submit" className="bg-blue-500 text-white">Login</button>
        </form>
    );
}
 
export default bLoginForm;