import type { Metadata } from "next";


export const metadata:Metadata = { 
  title: "Barangay Dashboard",
};


export default function DashboardLayout({
    children,
}:{
    children: React.ReactNode
}){
    return (
        <div className="ml-40  flex ">
            {children}    
        </div>
    )
}