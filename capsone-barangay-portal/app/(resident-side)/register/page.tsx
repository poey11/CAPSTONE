import type { Metadata } from "next";
import RegisterForm from "../components/registerForm";

export const metadata:Metadata = { 
  title: "Register for Residents",
  description: "Register as a resident to access the barangay portal",
};

export default function Register() {
 
  
    return (
     
        <RegisterForm />
     
    );
}