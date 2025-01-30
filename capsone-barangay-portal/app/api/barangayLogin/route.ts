import { NextResponse } from "next/server";
import { compare } from 'bcryptjs'
import {db} from '@/app/db/firebase'
import { collection, query, where, getDocs } from "firebase/firestore";


export async function POST(req: Request) {
    try{
        const body = await req.json();
        const {userid, password} = body;
        const userCollection = collection(db, "BarangayUsers");

        const usernameQuery = query(userCollection, where("userid", "==", userid));
        const querySnapshot = await getDocs(usernameQuery);

        if (querySnapshot.empty) {
            return NextResponse.json({ message: "User not found" }, {status:404});
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const isValidPassword = await compare(password, userData.password);


        if(!isValidPassword){
            return NextResponse.json({message: 'Invalid password'}, {status: 401});
        }
        const response = NextResponse.json({
            message: "Login Successful",
            user:{
                userid: userData.userid,
                role: userData.role,
                position: userData.position,
            }
        },{status: 200})
        
        response.headers.set("Set-Cookie", `barangayToken=${userDoc.id}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
        return response;
    }
    catch(error: string | any){
        return NextResponse.json({
            error: "Failed to login",
            details: error.message || error,
        }, {status:500});
    }

}