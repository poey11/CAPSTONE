import type { Metadata } from "next";
import BLoginForm from "../components/bLoginForm";

export const metadata:Metadata = { 
  title: "Login For Officials",
  description: "Login as an official to access the barangay portal",
};
export default function Official() {
  return (
    <div  className="flex flex-col items-center">
      Login For Barangay Officials
      <BLoginForm/>
    </div>
  );
}