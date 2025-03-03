"use client"
import {auth,db,storage} from "../../db/firebase";
import { deleteObject,ref, uploadBytes } from "firebase/storage";
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
    upload: File | null;
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
          await signOut(auth); 
            
            let fileName ='';
            if(resident.upload){
              const timeStamp = Date.now().toString();
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
              createdAt: new Date().getTime(),
              status: resident.status,
              validIdDocID: fileName
          });
         
          await sendEmailVerification(user);



          alert("Register sucessful! Email verification sent to your email address");
          
          router.push("/resident");
          
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
      <main className="main-container">
    

      <div className="register-section">
        <h1>Register</h1>
        <form className="register-form" onSubmit={handleSubmit}> {/* Use onSubmit to trigger the redirect */}
          <div className="form-group">
            <label htmlFor="sex" className="form-label">Sex:</label>
            <select  value={resident.sex}  onChange={handleChange} id="sex" name="sex"  className="form-input" required>
              <option value="" disabled>Select a Sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
           
          </div>

          <div className="form-group">
          <label htmlFor="first_name" className="form-label">First Name: </label>
          <input value={resident.first_name} onChange={handleChange} id="first_name" 
          type="text" name="first_name" 
          className="form-input"
          placeholder= "Enter Name"
           required />

          </div>

          <div className="form-group">
          <label htmlFor="last_name" className="form-label" >Last Name: </label>  
           

            <input value={resident.last_name} onChange={handleChange} id="last_name" 
            type="text" name="last_name" 
            className="form-input" 
            placeholder="Enter Last Name"
            required/>

          </div>

          <div className="form-group">
          <label htmlFor="email" className="form-label" >Email: </label>
          <input  value={resident.email} onChange={handleChange} id="email" 
          type="email" name="email" 
          className="form-input" 
          placeholder="Enter Email"
          required />
          </div>

          <div className="form-group">
          <label htmlFor="phone" className="form-label" >Phone: </label>
          <input  value={resident.phone} onChange={handleChange} id="phone" 
          type="tel" name="phone"
           className="form-input" 
           placeholder="Enter Phone Number"
           required />
          </div>


          <div className="form-group">
          <label htmlFor="address" className="form-label">Address: </label>
          <input value={resident.address} onChange={handleChange} id="address" 
          type="text" name="address" 
          className="form-input" 
          placeholder="Enter Address"
          required />
          </div>


          <div className="form-group">
          <label htmlFor="password" className="form-label">Password: </label>
          <input value={resident.password} onChange={handleChange} id="password"
           type="password" name="password" 
           className="form-input"
           placeholder="Enter Password"
           required/>
          </div>

          <div className="form-group">
          <label htmlFor="confirm_password" className="form-label">Confirm Password: </label>
          <input id="confirm_password" type="password"
           name="confirm_password"
           className="form-input"
           placeholder="Confirm Password"
           />
          </div>


          <div className="signature/printedname-container">
            <label className="form-label">Upload Valid ID with address: </label>

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
          <label htmlFor="terms" className="form-label">I agree to the terms and conditions</label>
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