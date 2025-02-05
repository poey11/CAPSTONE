import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {db} from '@/app/db/firebase'
import { collection, query, where, getDocs } from "firebase/firestore";

export async function middleware(req: NextRequest) {
    const barangayToken = req.cookies.get("barangayToken");
    
    if (barangayToken?.value) {
        try{
            const userCollection = collection(db, "BarangayUsers")
            const userQuery = query(userCollection, where("__name__", "==", barangayToken.value));
            const querySnapshot = await getDocs(userQuery)
            if(querySnapshot.empty){
                return NextResponse.redirect("/");
            }
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            console.log(userData);
            if(userData.firstTimelogin){
                return NextResponse.redirect("/dashboard/accountSetup");
            }
        }
        catch(e){
            console.log(e);
        }
    }
 
    return NextResponse.redirect('/');
}

export const config = { 
    matcher: ["/dashboard/:path*"],
};