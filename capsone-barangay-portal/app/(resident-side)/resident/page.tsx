import type { Metadata } from "next";
import LoginForm from "../components/rLoginForm";

export const metadata:Metadata = { 
    title: "Login For Residents",
    description: "Login as a resident to access the barangay portal",
  };

export default function Resident() {

    
    return (
        <div  className="flex flex-col items-center">
            Login For Residents
            <LoginForm />
        </div>
    );
}