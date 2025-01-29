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
    // if(!barangayToken){
    //     redirect("/");
    // }
    // else{
       
    // }

    return (
        <div className="ml-32  flex bg-gray-200">
            {children}
        </div>
    )        



    // try{
    //     const userCollection = collection(db, "BarangayUsers");
    //     const usernameQuery = query(userCollection, where("userId", "==", barangayToken));
    //     const querySnapshot = await getDocs(usernameQuery);
    //     if(querySnapshot.empty){
    //         cookieStore.delete({
    //             name: "barangayToken", 
    //             path: "/",
    //             sameSite: "strict",
    //             httpOnly: true,
    //         });
    //         redirect("/");
    //     }
    //     else{
    //         return (
    //             <div className="ml-32  flex bg-gray-200">
    //                 {children}
    //             </div>
    //         )        
    //     }
       
    // }
    // catch(error:string|any){
    //     console.log(error.message);
    //     //redirect("/");

    // }
   
}