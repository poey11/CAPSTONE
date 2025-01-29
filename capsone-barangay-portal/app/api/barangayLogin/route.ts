import {NextApiRequest, NextApiResponse} from 'next'
import { compare } from 'bcryptjs'
import {db} from '@/app/db/firebase'
import { collection, query, where, getDocs } from "firebase/firestore";


export default async function handler(req:NextApiRequest, res:NextApiResponse){
    if(req.method !== 'POST'){
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {username, password} = req.body;
    
    try{
        const userCollection = collection(db, "BarangayUsers");

        const usernameQuery = query(userCollection, where("username", "==", username));
        const querySnapshot = await getDocs(usernameQuery);

        if (querySnapshot.empty) {
            return res.status(404).json({ message: "User not found" });
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        const isValidPassword = await compare(password, userData.password);


        if(!isValidPassword){
            return res.status(401).json({message: 'Invalid password'});
        }
        res.setHeader('Set-Cookie', `barangayToken=${userDoc.id}; HttpOnly; Path=/dashboard; Max-Age=86400; SameSite=Strict`);

        return res.status(200).json({
            message: "Login successful",
            user: {
                username: userData.username,
                role: userData.role,
                position: userData.position,
            },
        });
    }
    catch(error: string | any){
        return res.status(500).json({
            error: "Failed to login",
            details: error.message || error,
        });
    }

}