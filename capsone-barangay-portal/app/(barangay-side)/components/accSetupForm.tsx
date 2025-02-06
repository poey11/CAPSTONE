"use client";
import {db} from '@/app/db/firebase'
import { doc, updateDoc } from "firebase/firestore";
import { useState } from 'react';
import {useRouter} from 'next/navigation';
interface AccSetupFormProps {
    cookies: string|undefined;
}

interface accountSetupProps {
    fName: string;
    lName: string;
    bday: string;
    address: string;
    phone: string;
}


const accSetupForm: React.FC<AccSetupFormProps> = ({ cookies }) => {
    const router = useRouter();
    const [User, setUser] = useState<accountSetupProps>({
        fName: '',
        lName: '',
        bday: '',
        address: '',
        phone: ''
    });
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setUser({
            ...User,
            [name]: value
        });
    }


    const addNewAttribute = async() => {
        console.log(User);
        console.log(cookies);
        
        try{
            if (!cookies) {
                throw new Error("Cookies are undefined");
            }
            const docRef = doc(db, 'BarangayUsers', cookies);
            await updateDoc(docRef, {
                firstName: User.fName,
                lastName: User.lName,
                birthDate: User.bday,
                address: User.address,
                phone: User.phone,
                firstTimelogin: false
            });
            console.log('New attribute added');
        }
        catch(e: any){
            console.log(e.message);
        }

        router.push('/dashboard');
    }
    

    return(
        <form action = {addNewAttribute} className="flex flex-col  justify-center">
            <label htmlFor="fName">First Name: </label>
            <input onChange={handleChange} value={User.fName} id="fName" type="text" name="fName" className="border-2 border-black" required />

            <label htmlFor="lName">Last Name: </label>
            <input onChange={handleChange} value={User.lName} id="lName" type="text" name="lName" className="border-2 border-black" required />

            <label htmlFor="bday">Birth date: </label>
            <input onChange={handleChange} value={User.bday} id="bday" type="text" name="bday" className="border-2 border-black" required />

            <label htmlFor="address">Address: </label>
            <input onChange={handleChange} value={User.address} id="address" type="text" name="address" className="border-2 border-black" required />

            <label htmlFor="phone">Cellphone / Telephone #: </label>
            <input onChange={handleChange} value={User.phone} id="phone" type="text" name="phone" className="border-2 border-black" required />
        
            <button   className="bg-blue-500 mt-3 text-white">Submit</button>
        </form>
    );

}

export default accSetupForm;