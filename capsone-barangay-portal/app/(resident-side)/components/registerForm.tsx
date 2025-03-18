"use client"
import {auth,db,storage} from "../../db/firebase";
import { deleteObject,ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteDoc,doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification,signOut } from "firebase/auth";
import { useState, ChangeEvent } from "react";
import { useRouter } from 'next/navigation';
import ReCAPTCHA from "react-google-recaptcha";
import "@/CSS/Components/registerform.css";


/*Fixed the register func logic where any failure in the process will delete any partial passed through the db
 however form validation is still partially implemented.
 the only validation added are sex, email, and password requirement (confirm password is not yet added ). 
 if register the user is successful,  the form should be cleared.
  have to double check the error handling of register process.
 terms and condition havent been implemented */

interface Resident {
    sex: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  };
  
  type residentUser = Resident & {
    role: "Resident";
    status: "unverified";
  };
  
  
const registerForm:React.FC = () => {
    const router = useRouter();
    const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || "";
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const [isTermChecked, setIsTermChecked] = useState<boolean>(false);
    const [showPopup, setShowPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    const [resident, setResident] = useState<residentUser>({
        sex: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        role: "Resident",
        status: "unverified"
      });


      const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    

      const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const { name, value, type } = e.target;
      
        if (type === "file" && e.target instanceof HTMLInputElement && e.target.files) {
          setResident({
            ...resident,
          });
        } else if (name === "password") {
          setPassword(value);
          setResident((prevData) => ({ ...prevData, password: value })); 
        } else if (name === "confirmPassword") {
          setConfirmPassword(value);
        } else {
          setResident((prevData) => ({ ...prevData, [name]: value }));
        }
      };

      const handleSubmit =async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Check if passwords match
        if (resident.password !== confirmPassword) {
          setErrorPopup({ show: true, message: "Passwords do not match!" });
          return;
        }

        let user = null;
        let docRef = null;
        let storageRef = null;
        try{
          const userCredentials= await createUserWithEmailAndPassword(auth, resident.email, resident.password);
          user = userCredentials.user;
          await signOut(auth); 
            
            let fileURL = "";
                  if (file) {
                    const storageRef = ref(storage, `ResidentsFiles/${file.name}`);
                    await uploadBytes(storageRef, file);
                    fileURL = await getDownloadURL(storageRef);
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
              createdAt: new Date().getTime(),
              status: resident.status,
              validIdDocID: fileURL
          });
         
          await sendEmailVerification(user);



          setShowPopup(true);
            setTimeout(() => {
                setShowPopup(false);
                router.push("/resident/login");
            }, 3000);
          
        }
        catch (error: any) {
          setErrorPopup({ show: true, message: "Register failed! " + error.message });
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

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

      const handleCheckBox = (e:ChangeEvent<HTMLInputElement>) => {
        setIsTermChecked(e.target.checked);
      }

      const handleToken = (token: string | null) => {
        if(token){
          setCaptchaToken(token);
        }
      }

    
      const handleFileDelete = () => {
        setFile(null);
        setPreview(null);
      };

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          const selectedFile = e.target.files[0];
      
          // Ensure only one file is processed
          setFile(selectedFile);
          setPreview(URL.createObjectURL(selectedFile));
      
          // Reset the file input to prevent multiple selections
          e.target.value = "";
        }
      };
 

  

 

     
    return ( 
      <main className="main-container-register-form">
        {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <p>Registration Successful!</p>
                        <p>Redirecting to Login Page...</p>
                    </div>
                </div>
            )}
        {errorPopup.show && (
                <div className="popup-overlay error">
                    <div className="popup">
                        <p>{errorPopup.message}</p>
                        <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button">Close</button>
                    </div>
                </div>
            )}

        <div className="register-section-register-form">
          <h1>Register</h1>
          <form className="register-form" onSubmit={handleSubmit}> {/* Use onSubmit to trigger the redirect */}
            <div className="form-group-register-form">
              <label htmlFor="sex" className="form-label-register-form">Sex:</label>
              <select  value={resident.sex}  onChange={handleChange} id="sex" name="sex"  className="form-input-register-form " required>
                <option value="" disabled>Select a Sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            
            </div>

            <div className="form-group-register-form">
            <label htmlFor="first_name" className="form-label-register-form">First Name: </label>
            <input value={resident.first_name} onChange={handleChange} id="first_name" 
            type="text" name="first_name" 
            className="form-input-register-form "
            placeholder= "Enter Name"
            required />

            </div>

            <div className="form-group-register-form">
            <label htmlFor="last_name" className="form-label-register-form" >Last Name: </label>  
            

              <input value={resident.last_name} onChange={handleChange} id="last_name" 
              type="text" name="last_name" 
              className="form-input-register-form " 
              placeholder="Enter Last Name"
              required/>

            </div>

            <div className="form-group-register-form">
            <label htmlFor="email" className="form-label-register-form" >Email: </label>
            <input  value={resident.email} onChange={handleChange} id="email" 
            type="email" name="email" 
            className="form-input-register-form " 
            placeholder="Enter Email"
            required />
            </div>

            <div className="form-group-register-form">
            <label htmlFor="phone" className="form-label-register-form" >Phone: </label>
            <input  value={resident.phone} onChange={handleChange} id="phone" 
            type="tel" name="phone"
            className="form-input-register-form " 
            placeholder="Enter Phone Number"
            required />
            </div>


            <div className="form-group-register-form">
            <label htmlFor="address" className="form-label-register-form">Address: </label>
            <input value={resident.address} onChange={handleChange} id="address" 
            type="text" name="address" 
            className="form-input-register-form " 
            placeholder="Enter Address"
            required />
            </div>


            <div className="form-group-register-form">
            <label htmlFor="password" className="form-label-register-form">Password: </label>
            <input 
            onChange={handleChange} 
            id="password"
            type="password" 
            name="password" 
            className="form-input-register-form "
            placeholder="Enter Password"
            required/>
            </div>

            <div className="form-group-register-form">
            <label htmlFor="confirm_password" className="form-label-register-form">Confirm Password: </label>
            <input 
            onChange={handleChange}
            id="confirmPassword" 
            type="password"
            name="confirmPassword"
            className="form-input-register-form "
            placeholder="Confirm Password"
            />
            </div>


            <div className="signature/printedname-container">
              <label className="form-label-register-form">Upload Valid ID with address: </label>

              <div className="file-upload-container">
                <label htmlFor="file-upload" className="upload-link">Click to Upload File</label>
                <input id="file-upload" type="file" className="file-upload-input" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />

                {file && (
                  <div className="file-name-image-display">
                    <div className="file-name-image-display-indiv">
                      {preview && <img src={preview} alt="Preview" style={{ width: "50px", height: "50px", marginRight: "5px" }} />}
                      <span>{file.name}</span>
                      <div className="delete-container">
                        <button type="button" onClick={handleFileDelete} className="delete-button">
                          <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              
              </div>
            </div>

            <div className="form-checkbox-section">
            <label htmlFor="terms" className="form-label-register-form">I agree to the terms and conditions</label>
            <input id="terms" onChange={handleCheckBox}  type="checkbox" name="terms" className="form-checkbox" />
            </div>

            <div className="form-captcha">
            <ReCAPTCHA sitekey= {captchaSiteKey} onChange={handleToken}  />
            </div>


            {/* Submit button */}
            <button
              type="submit"
              className= "submit-button"
              disabled={!isTermChecked}
            >
              Register
            </button>
          </form>


        </div>


     
    </main>
     );
}
 
export default registerForm;