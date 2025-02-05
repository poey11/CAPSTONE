import type { Metadata } from "next";

export const metadata:Metadata = { 
  title: "Barangay Dashboard",
};


export default async function DashboardLayout({
    children,
}:{
    children: React.ReactNode
}){           
    return (
        <div className="ml-32  flex bg-gray-200">    
            {children}
        </div>
    )         
        
    
}