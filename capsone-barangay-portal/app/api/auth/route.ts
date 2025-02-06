import NextAuth, { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {compare } from "bcryptjs";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { JWT } from "next-auth/jwt";




export const bAuthOptions: NextAuthOptions = {
    providers:[
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                userid: {label: "User ID", type: "text"},
                password: {label: "Password", type: "password"},
            },
            authorize: async (credentials) => {
                if (!credentials) {
                    return null;
                }
                const { userid, password } = credentials;
                console.log("userid: ", userid);
                console.log("password: ", password);
                console.log("credentials: ", credentials);
                const userCollection = collection(db, "BarangayUsers");
                const usernameQuery = query(userCollection, where("userid", "==", userid));
                const querySnapshot = await getDocs(usernameQuery);

                if (querySnapshot.empty) {
                    return null;
                }

                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                if (!userData || !userData.password || !userData.role) {
                    return null; // Invalid user data
                  }

                const isValidPassword = await compare(password, userData.password);

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: userDoc.id,
                    name: userData.userid,
                    email: userData.email,
                    role: userData.role,
                    position: userData.position,
                    firstTimeLogin: userData.firstTimeLogin,
                };
            }
        }),
    ],
    callbacks:{
        async jwt({token, user}: {token: JWT, user?: any}){
            if(user){
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
                token.position = user.position;
                token.firstTimeLogin = user.firstTimeLogin;
            }
            return token;
        },
        async session({session, token}: {session: Session, token: JWT}){
            session.user ={
                id: token.id,
                name: token.name,
                email: token.email,
                role: token.role,
                position: token.position,
                firstTimeLogin: token.firstTimeLogin,
            }
            return session;
        },
    },
    pages:{
        signIn: "/official",
    },
}

const handler = NextAuth(bAuthOptions);
export {handler as GET, handler as POST};


// export async function POST(req: Request) {
//     try{
//         const body = await req.json();
//         const {userid, password} = body;
//         const userCollection = collection(db, "BarangayUsers");

//         const usernameQuery = query(userCollection, where("userid", "==", userid));
//         const querySnapshot = await getDocs(usernameQuery);

//         if (querySnapshot.empty) {
//             return NextResponse.json({ message: "User not found" }, {status:404});
//         }

//         const userDoc = querySnapshot.docs[0];
//         const userData = userDoc.data();
//         const isValidPassword = await compare(password, userData.password);


//         if(!isValidPassword){
//             return NextResponse.json({message: 'Invalid password'}, {status: 401});
//         }

//         if(userData.firstTimelogin){
//             /*If firsttimeLogin is true then the account has not been setup */
//             const response = NextResponse.json({
//             message: "Login Successful but user has not setup account",
//             user:{
//                 userid: userData.userid,
//                 role: userData.role,
//                 position: userData.position,
//                 }
//             },{status: 200})
            
//             response.headers.set("Set-Cookie", `barangayToken=${userDoc.id}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
//             return response;
                
//         }
//         else{
//             /*If firsttimeLogin is false then the account has alr been setup */
//             const response = NextResponse.json({
//                 message: "Login Successful and user has already setup account",
//                 user:{
//                     userid: userData.userid,
//                     role: userData.role,
//                     position: userData.position,
//                 }
//             },{status: 201})
//             response.headers.set("Set-Cookie", `barangayToken=${userDoc.id}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`);
//             return response;
//         }



        
//     }
//     catch(error: string | any){
//         return NextResponse.json({
//             error: "Failed to login",
//             details: error.message || error,
//         }, {status:500});
//     }

// }