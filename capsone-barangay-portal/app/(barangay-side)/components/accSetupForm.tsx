"use client";
import {db} from '@/app/db/firebase'
import { doc, updateDoc } from "firebase/firestore";
import { useState } from 'react';
import {useRouter} from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hash } from 'bcryptjs'; 
import "@/CSS/BarangayACForm/accSetupForm.css";

interface AccSetupFormProps {
    userID: string | undefined;
}

interface accountSetupProps {
    fName: string;
    lName: string;
    bday: string;
    address: string;
    phone: string;
    sex: string;
    password: string;
}


const accSetupForm: React.FC<AccSetupFormProps> = ({userID}) => {
    /* Not yet implemented confirm password validation */

    const router = useRouter();
    const {data: session, update} = useSession();
    const [User, setUser] = useState<accountSetupProps>({
        fName: '',
        lName: '',
        bday: '',
        address: '',
        phone: '',
        sex: '',
        password: ''
    });
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser({
            ...User,
            [name]: value
        });
    }


    const addNewAttribute = async() => {
        if (!userID) {
            console.log("User ID is undefined");
            return;
        }
        
        try{    
        
            const docRef = doc(db, 'BarangayUsers', userID);
            const hashedPassword = await hash(User.password, 12);
            await updateDoc(docRef, {
                firstName: User.fName,
                lastName: User.lName,
                birthDate: User.bday,
                address: User.address,
                phone: User.phone,
                sex: User.sex,
                password: hashedPassword,
                firstTimelogin: false
            });

            await update();
           
        }
        catch(e: any){
            console.log(e.message);
        }
        router.push('/dashboard');
    }
    

    return(

    <main className="accSetup-main-container">


        <div className="accSetup-main-content">

            <div className="accSetup-title-section">
                <h1> ACCOUNT SET UP</h1>

            </div>

            <div className="accSetup-main-form">

          
                <form action = {addNewAttribute} className="accSetup-form" >
                    <label htmlFor="fName">First Name: </label>
                    <input onChange={handleChange} value={User.fName} id="fName" type="text" name="fName"  required />

                    <label htmlFor="lName">Last Name: </label>
                    <input onChange={handleChange} value={User.lName} id="lName" type="text" name="lName" required />

                    <label htmlFor="sex">Sex: </label>
                    <select  value={User.sex}  onChange={handleChange} id="sex" name="sex"  required>
                    <option value="" disabled>Select a Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    </select>

                    <label htmlFor="bday">Birth date: </label>
                    <input onChange={handleChange} value={User.bday} id="bday" type="date" name="bday"  required />

                    <label htmlFor="address">Address: </label>
                    <input onChange={handleChange} value={User.address} id="address" type="text" name="address"  required />

                    <label htmlFor="phone">Cellphone / Telephone #: </label>
                    <input onChange={handleChange} value={User.phone} id="phone" type="text" name="phone"  required />

                    <label htmlFor="password">New Password: </label>
                    <input onChange={handleChange} value={User.password} id="password" type="password" name="password" required />

                    <label htmlFor="confirmPassword">Confirm Password: </label>
                    <input id="confirmPassword" type="password" name="confirmPassword"  required />
                    
                
                    <button >Submit</button>
                </form>
              </div>
            
            </div>

     </main>
    );

}

export default accSetupForm;