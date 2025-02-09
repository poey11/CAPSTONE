import Form from "@/app/(resident-side)/components/bLoginForm";
import type { Metadata } from "next";
import "@/CSS/LoginPage/oLogin.css";

 export const metadata: Metadata = {
  title: "Login For Officials",
  description: "Login as an official to access the barangay portal",
};

export default function LoginOfficial() {
  return (
    <>
      <Form/>
    </>
  );
}
