import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {db} from '@/app/db/firebase'
import { collection, query, where, getDocs } from "firebase/firestore";

export const metadata:Metadata = { 
  title: "Barangay Dashboard",
};


export default async function DashboardLayout({
    children,
}:{
    children: React.ReactNode
}){
    const cookieStore = await cookies();
    const barangayToken = cookieStore.get("barangayToken");
    if(!barangayToken?.value){
        redirect("/");
    }
    else{
        try{
            const userCollection = collection(db, "BarangayUsers")
            const userQuery = query(userCollection, where("id", "==", barangayToken.value));
            const querySnapshot = await getDocs(userQuery)   
            if(querySnapshot.empty){
                cookieStore.delete("barangayToken");
                redirect("/");
            }  
            else{
                return (
                    <div className="ml-32  flex bg-gray-200">
                        {children}
                    </div>
                )        
            }
        }
        catch(e:string|any){
            console.log("Error: "+ e.message)
        }        
    }
}