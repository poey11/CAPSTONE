import type { Metadata } from "next";
import {db} from "../api/firebase";
export const metadata:Metadata = { 
  title: "Register for Residents",
  description: "Register as a resident to access the barangay portal",
};
export default function Register() {
    return (
      <div>
          REGISTER
      </div>
    );
}