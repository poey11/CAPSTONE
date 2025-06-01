import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { redirect } from "next/navigation";
import Menu from "@/app/(barangay-side)/components/topMenu"
import Header from "@/app/(barangay-side)/components/header"
export const metadata:Metadata = { 
  title: "Barangay Dashboard",
};


export default async function DashboardLayout({
    children,
}:{
    children: React.ReactNode
}){           
    const session = await getServerSession(authOptions);
    
    if (!session) {
        redirect("/");
    }
    
    const User = session.user;
    console.log("Dashboard Layout",User);

    return (
        <div className="ml-40  flex ">
            <Menu/>
            {/*<Header/>*/}
            {children}
        </div>
    )         
}