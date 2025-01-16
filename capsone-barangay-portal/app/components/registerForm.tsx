"use client"
import {auth,db,storage} from "../api/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useState, ChangeEvent,FormEvent } from "react";
interface Resident {
    sex: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    upload: File | null;
  };
  
  type residentUser = Resident & {
    role: "resident";
  };
  
const registerForm:React.FC = () => {
    const [isTermChecked, setIsTermChecked] = useState<boolean>(false);
    const [resident, setResident] = useState<residentUser>({
        sex: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        role: "resident",
        upload: null,
      });

      const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const { name, value, type } = e.target;
        if(type=== "file" && e.target instanceof HTMLInputElement && e.target.files){
          setResident({
            ...resident,
            upload: e.target.files[0],
          })
        }
        else{
          setResident({
            ...resident,
            [name]:value,
          })
        }
      };

      const handleSubmit =async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form submitted: ", resident);
        try{
           const userCredentials= await createUserWithEmailAndPassword(auth, resident.email, resident.password);
          
            const user = userCredentials.user;
            await setDoc(doc(db, "ResidentUsers", user.uid), {
                first_name: resident.first_name,  
                last_name: resident.last_name,
                email: resident.email,
                phone: resident.phone,
                address: resident.address,
                sex: resident.sex,
                role: resident.role,
                createdAt: new Date(),
            });

            
            if(resident.upload){
              const storageRef = ref(storage, `valid_id_image/${user.uid}`);
              await uploadBytes(storageRef,  resident.upload)
            }
        }
        catch(error: string | any){
            alert("Register failed! " + error.message);
        }
        alert("Register sucessful!");
        
      }

      const handleCheckBox = (e:ChangeEvent<HTMLInputElement>) => {
        setIsTermChecked(e.target.checked);
      }
    return ( 
        <div>
        <form onSubmit={handleSubmit} className="flex flex-col  justify-center">
        <label htmlFor="sex">Sex:</label>
            <select  value={resident.sex}  onChange={handleChange} id="sex" name="sex" className="border-2 border-black" required>
              <option value="" disabled>Select a Sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <label htmlFor="first_name">First Name: </label>
            <input value={resident.first_name} onChange={handleChange} id="first_name" type="text" name="first_name" className="border-2 border-black" required />

            <label htmlFor="last_name">Last Name: </label>  
            <input value={resident.last_name} onChange={handleChange} id="last_name" type="text" name="last_name" className="border-2 border-black" required/>

            <label htmlFor="email">Email: </label>
            <input  value={resident.email} onChange={handleChange} id="email" type="email" name="email" className="border-2 border-black" required />

            <label htmlFor="phone">Phone: </label>
            <input  value={resident.phone} onChange={handleChange} id="phone" type="tel" name="phone" className="border-2 border-black" required />

            <label htmlFor="address">Address: </label>
            <input value={resident.address} onChange={handleChange} id="address" type="text" name="address" className="border-2 border-black" required />
            
            <label htmlFor="password">Password: </label>
            <input value={resident.password} onChange={handleChange} id="password" type="password" name="password" className="border-2 border-black" required/>

            <label htmlFor="confirm_password">Confirm Password: </label>
            <input id="confirm_password" type="password" name="confirm_password" className="border-2 border-black" />

            <label htmlFor="terms">I agree to the terms and conditions</label>
            <input id="terms" onChange={handleCheckBox}  type="checkbox" name="terms" className="" />
            
            <label htmlFor="upload">Upload Valid ID with address: </label>
            <input onChange={handleChange} id="upload" type="file" name="upload" className="" accept="image/*"  />
            <button
                type="submit"
                className={`bg-slate-200 mt-2 ${
                    isTermChecked ? "opacity-100" : "opacity-50 cursor-not-allowed"
                }`}
                disabled={!isTermChecked} // Disable the button if checkbox is not checked
                >
                Register
                </button>

        </form>
        
        </div>
     );
}
 
export default registerForm;