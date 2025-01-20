"use client"
import {auth,db,storage} from "../db/firebase";
import { deleteObject,ref, uploadBytes } from "firebase/storage";
import { deleteDoc,doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification,signOut } from "firebase/auth";
import { useState, ChangeEvent } from "react";
import { useRouter } from 'next/navigation';
import ReCAPTCHA from "react-google-recaptcha";

/*Fixed the register func logic where any failure in the process will delete any partial passed through the db
 however form validation is still partially implemented.
 the only validation added are sex, email, and password requirement (confirm password is not yet added ). 
 if register the user is successful, the user will be redirected to the homepage (not yet added) and the form should be cleared.
 ill added it later. have to double check the error handling of register process.
 terms and condition havent been implemented */

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
    status: "unverified";
  };
  
const registerForm:React.FC = () => {
    const router = useRouter();
    const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || "";
    const [captchaToken, setCaptchaToken] = useState<string>("");
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
        status: "unverified"
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
        let user = null;
        let docRef = null;
        let storageRef = null;
        try{
           const userCredentials= await createUserWithEmailAndPassword(auth, resident.email, resident.password);
            user = userCredentials.user;
            
            let fileName ='';
            if(resident.upload){
              const timeStamp = Date.now()
              const fileExtention = resident.upload.name.split('.').pop();
              fileName = `valid_id_${resident.first_name}_${resident.last_name}_${timeStamp}.${fileExtention}`
              storageRef = ref(storage, `valid_id_image/${fileName}`);
              await uploadBytes(storageRef,  resident.upload)
            }
              
 
            const response = await fetch('/api/registerForm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ captchaToken }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || 'Something went wrong');
            }
            docRef = doc(db, "ResidentUsers", user.uid);
            await setDoc(docRef, {
              first_name: resident.first_name,  
              last_name: resident.last_name,
              email: resident.email,
              phone: resident.phone,
              address: resident.address,
              sex: resident.sex,
              role: resident.role,
              createdAt: new Date(),
              status: resident.status,
              validIdDocID: fileName
          });
         
         await sendEmailVerification(user);

         await signOut(auth);


            alert("Register sucessful! Email verification sent to your email address");
            /*clear form*/  

            /* then redirect back to homepage if successful*/
            router.push("/");
          
        }
        catch(error: string | any){
            alert("Register failed! " + error.message);
            if(docRef){
              try{
                await deleteDoc(docRef);
              }
              catch(e){
                console.log("Error deleting document: ", e);
              }
            }
            if(storageRef){
              try{
                await deleteObject(storageRef);
              }
              catch(e){
                console.log("Error deleting file: ", e);
              }
            }

            if(user){
              try{
                await user.delete();
              }
              catch(e){
                console.log("Error deleting user: ", e);
              }
            }
            
            
        }        
      }

      const handleCheckBox = (e:ChangeEvent<HTMLInputElement>) => {
        setIsTermChecked(e.target.checked);
      }

      const handleToken = (token: string | null) => {
        if(token){
          setCaptchaToken(token);
        }
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
            <ReCAPTCHA sitekey= {captchaSiteKey} onChange={handleToken}  />
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