"use client"
import {auth,db,storage} from "../../db/firebase";
import { deleteObject,ref, uploadBytes } from "firebase/storage";
import { deleteDoc,doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification,signOut } from "firebase/auth";
import { useState, ChangeEvent } from "react";
import { useRouter } from 'next/navigation';
import ReCAPTCHA from "react-google-recaptcha";
import "@/CSS/Components/registerform.css";


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
    role: "Resident";
    status: "Unverified";
  };
  
const registerForm:React.FC = () => {
    const router = useRouter();
    const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || "";
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const [isTermChecked, setIsTermChecked] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");
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
        upload: null,
        status: "Unverified"
      });

      const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const { name, value, type } = e.target;
      
        if (name === "confirm_password") {
          setConfirmPassword(value);
        } else if (type === "file" && e.target instanceof HTMLInputElement) {
          const files = e.target.files;
          if (files && files.length > 0) {
            setResident((prev) => ({
              ...prev,
              upload: files[0],
            }));
          }
        } else {
          setResident((prev) => ({
            ...prev,
            [name]: value,
          }));
        }
      };
      

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Check if password matches confirmPassword
        if (resident.password !== confirmPassword) {
          setErrorPopup({ show: true, message: "Passwords do not match!" });
          setConfirmPassword(""); // Clear the confirm password field
          return;
        }

        let user = null;
        let docRef = null;
        let storageRef = null;
        
        try {
          const userCredentials = await createUserWithEmailAndPassword(auth, resident.email, resident.password);
          user = userCredentials.user;
          await signOut(auth); 
          
          let fileName = '';
          if (resident.upload) {
            const timeStamp = Date.now().toString();
            const fileExtension = resident.upload.name.split('.').pop();
            fileName = `valid_id_${resident.first_name}_${resident.last_name}_${timeStamp}.${fileExtension}`;
            storageRef = ref(storage, `ResidentUsers/valid_id_image/${fileName}`);
            await uploadBytes(storageRef, resident.upload);
          }

          docRef = doc(db, "ResidentUsers", user.uid);
          await setDoc(docRef, {
            ...resident,
            createdAt: new Date().toISOString(),
            validIdDocID: fileName,
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

      const handleCheckBox = (e:ChangeEvent<HTMLInputElement>) => {
        setIsTermChecked(e.target.checked);
      }

      const handleToken = (token: string | null) => {
        if(token){
          setCaptchaToken(token);
        }
      }

      const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);

  // Handle file selection for container 1
  const handleFileChangeContainer1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles).map((file) => {
        const preview = URL.createObjectURL(file);
        return { name: file.name, preview };
      });
      setFilesContainer1((prevFiles) => [...prevFiles, ...fileArray]); // Append new files to the first container
    }
  };

  // Handle file deletion for container 1
  const handleFileDeleteContainer1 = (fileName: string) => {
    setFilesContainer1((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
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
            <input value={resident.password} onChange={handleChange} id="password"
            type="password" name="password" 
            className="form-input-register-form "
            placeholder="Enter Password"
            required/>
            </div>

            <div className="form-group-register-form">
            <label htmlFor="confirm_password" className="form-label-register-form">Confirm Password: </label>
              <input
                id="confirm_password"
                type="password"
                name="confirm_password"
                value={confirmPassword}
                onChange={handleChange}
                className="form-input-register-form"
                placeholder="Confirm Password"
              />
            </div>


            <div className="signature/printedname-container">
              <label className="form-label-register-form">Upload Valid ID with address: </label>

              <div className="file-upload-container">
                <label htmlFor="upload" className="upload-link">Click to Upload File</label>
                <input
                  id="file-upload1"
                  type="file"
                  className="file-upload-input"
                  multiple
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChangeContainer1} // Handle file selection
                />

            <input onChange={handleChange} id="upload" type="file" name="upload" className="file-upload-input" accept="image/*"  />
          
                <div className="uploadedFiles-container">


                  
                  {filesContainer1.length > 0 && (
                    <div className="file-name-image-display">
                      <ul>
                        {filesContainer1.map((file, index) => (
                          <div className="file-name-image-display-indiv" key={index}>
                            <li>
                              {file.preview && (
                                <div className="filename-image-container">
                                  <img
                                    src={file.preview}
                                    alt={file.name}
                                    style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                  />
                                </div>
                              )}
                              {file.name}
                              <div className="delete-container">
                                <button
                                  type="button"
                                  onClick={() => handleFileDeleteContainer1(file.name)}
                                  className="delete-button"
                                >
                                  <img
                                    src="/images/trash.png"
                                    alt="Delete"
                                    className="delete-icon"
                                  />
                                </button>
                              </div>
                            </li>
                          </div>
                        ))}
                      </ul>

                      
                    </div>

                    

                    
                  )}
                </div>
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