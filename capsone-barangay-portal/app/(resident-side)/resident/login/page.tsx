import Form  from "@/app/(resident-side)/components/rLoginForm";
import type { Metadata } from "next";
import "@/CSS/LoginPage/rLogin.css";

export const metadata:Metadata = { 
    title: "Login",
    description: "Login for Residents for the barangay website",
  };
  export default function LoginResidents() {   
    return (
      <Form />
    );
}