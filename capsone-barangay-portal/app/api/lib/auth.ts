import NextAuth, { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {compare } from "bcryptjs";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { JWT } from "next-auth/jwt";




 export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
            userid: {label: "User ID", type: "text"},
            password: {label: "Password", type: "password"},
        },
        async authorize(credentials) {
            if (!credentials) return null;
          
            const  {userid, password} = credentials;
            
            const userCollection = collection(db, "BarangayUsers");
            const usernameQuery = query(userCollection, where("userid", "==", userid));
            const querySnapshot = await getDocs(usernameQuery); 

            if (querySnapshot.empty) {
                return null;
            } 
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();  
            const isValidPassword = await compare(password, userData.password);
            
            if (!isValidPassword) {
                return null;
            }
            
            return {
                id: userDoc.id,
                name: userData.userid,
                role: userData.role,
                position: userData.position,
                loginStatus: userData.firstTimelogin,
                fullName: `${userData.firstName} ${userData.lastName}`,
                department: userData.department,
                profileImage: userData.profileImage,
            };
          
        }
      })
    ],
    callbacks:{
        async session({session, token}: {session: Session, token: JWT}){
            session.user ={
                id: token.id,
                name: token.name,
                role: token.role,
                position: token.position,
                loginStatus: token.loginStatus,
                fullName: token.fullName,
                department: token.department,
                profileImage: token.profileImage,
                createdAt: token.createdAt as import("firebase/firestore").Timestamp, // Ensure createdAt is included if needed
            }
            return session;
        },
        async jwt({token, user}: {token: JWT, user?: any}){
            if (user) {
                // Set initial user data on login
                token.id = user.id;
                token.name = user.name;
                token.role = user.role;
                token.position = user.position;
                token.loginStatus = user.loginStatus;
                token.fullName = user.fullName;
                token.department = user.department
                token.profileImage = user.profileImage

            } else if (token.id) {
                // Fetch updated user data from Firestore
                const userDoc = await getDoc(doc(db, "BarangayUsers", token.id));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    token.loginStatus = userData.firstTimelogin; // Ensure session gets updated
                    token.fullName = `${userData.firstName} ${userData.lastName}`;
                    token.department = userData.department
                    token.profileImage = userData.profileImage
                }
            }
            return token;
        },
    }
  };