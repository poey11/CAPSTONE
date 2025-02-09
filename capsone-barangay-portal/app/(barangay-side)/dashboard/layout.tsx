import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { redirect } from "next/navigation";


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
        return null;
    }
    return (
        <div className="ml-40  flex ">
            {children}    
        </div>
    )         
        
    
}