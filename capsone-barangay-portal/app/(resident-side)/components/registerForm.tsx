"use client"
import { auth, db, storage } from "../../db/firebase";
import { deleteObject, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteDoc, doc, setDoc, addDoc, collection } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { useState, ChangeEvent } from "react";
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from "lucide-react";
import  {isValidPhilippineMobileNumber} from "@/app/helpers/helpers";
import ReCAPTCHA from "react-google-recaptcha";
import "@/CSS/Components/registerform.css";

interface Resident {
    sex: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    password: string;
    upload: File | null;
    isViewed: boolean;
}


// need to add notif for Assistant Sec

type residentUser = Resident & {
    role: "Resident";
    status: "Unverified";
};

const RegisterForm: React.FC = () => {
    const router = useRouter();
    const captchaSiteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || "";
    const [captchaToken, setCaptchaToken] = useState<string>("");
    const today = new Date().toISOString().split("T")[0]; 
    const [isTermChecked, setIsTermChecked] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPopup, setShowPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    /*
      For pop up overlay errors
    */
    const [popupErrorMessage, setPopupErrorMessage] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);



const [invalidFields, setInvalidFields] = useState<string[]>([]);
const [showSubmitPopup, setShowSubmitPopup] = useState<boolean>(false);

    const [resident, setResident] = useState<residentUser>({
        sex: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
        dateOfBirth: "",
        role: "Resident",
        upload: null,
        status: "Unverified",
        isViewed: false,
        
    });

    const [filePreview, setFilePreview] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                setFilePreview(URL.createObjectURL(files[0])); // Set file preview
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

       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

         if (!emailRegex.test(resident.email)) {
    setErrorPopup({ show: true, message: "Invalid email format. Please enter a valid email address." });
    return;
  }
    
        if(!isValidPhilippineMobileNumber(resident.phone)) {
            setErrorPopup({ show: true, message: "Invalid phone number format. Please enter a valid Philippine mobile number." });
            return;
        }

      if (resident.password !== confirmPassword) {
        setErrorPopup({ show: true, message: "Make sure passwords match." });
        setConfirmPassword("");
        return;
      }


        // Check if Terms is unchecked
        if (!isTermChecked) {
            setErrorPopup({ show: true, message: "Please agree to the terms and conditions." });
            return;
        }

        // Check if captchaToken is missing
        if (!captchaToken) {
            setErrorPopup({ show: true, message: "Please complete the CAPTCHA verification." });
            return;
        }


          // Age check - must be 18 or older
            const birthDate = new Date(resident.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            const hasHadBirthdayThisYear = (
                today.getMonth() > birthDate.getMonth() ||
                (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
            );
            const actualAge = hasHadBirthdayThisYear ? age : age - 1;

            if (actualAge < 18) {
                setErrorPopup({ show: true, message: "You must be at least 18 years old to register." });
                return;
            }


    
      let user = null;
      let docRef = null;
      let storageRef = null;
      let fileDownloadURL = '';
    
      try {
        // Create the user
        const userCredentials = await createUserWithEmailAndPassword(auth, resident.email, resident.password);
        user = userCredentials.user;
        await signOut(auth);
    
        // Upload the file to Firebase Storage if available
        if (resident.upload) {
          const timeStamp = Date.now().toString();
          const fileExtension = resident.upload.name.split('.').pop();
          const fileName = `valid_id_${resident.first_name}_${resident.last_name}_${timeStamp}.${fileExtension}`;
          storageRef = ref(storage, `ResidentUsers/valid_id_image/${fileName}`);
    
          await uploadBytes(storageRef, resident.upload);
          fileDownloadURL = await getDownloadURL(storageRef); // Get the download URL
        }
    
        // Store resident data in Firestore
        docRef = doc(db, "ResidentUsers", user.uid);
        await setDoc(docRef, {
          ...resident,
           isViewed: false,
          upload: fileDownloadURL, // Save the file URL instead of the file object
          createdAt: today,
         
        });

        // Add notification for Assistant Secretary to review
        const notificationRef = collection(db, "BarangayNotifications");
        await addDoc(notificationRef, {
        message: `New resident registration pending approval by ${resident.first_name} ${resident.last_name}.`,
        timestamp: new Date(),
        isRead: false,
        transactionType: "Resident Registration",
        recipientRole: "Assistant Secretary",
        accID: docRef.id,
        });
        
    
        await sendEmailVerification(user);
    
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          router.push("/resident/login");
        }, 2000);
    } catch (error: any) {
        let errorMessage = "Register failed!";
    
        if (error.code === "auth/email-already-in-use") {
            errorMessage = "Email already in use.";
        } else if (error.code === "auth/weak-password") {
            errorMessage = "Password should be at least 6 characters.";
        }
    
        setErrorPopup({ show: true, message: errorMessage });
    
        // Cleanup in case of error
        if (docRef) await deleteDoc(docRef);
        if (storageRef) await deleteObject(storageRef);
        if (user) await user.delete();
    }
    };

const handleSubmitClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();

  const invalidFields: string[] = [];

  if (!resident.first_name.trim()) invalidFields.push("first_name");
  if (!resident.last_name.trim()) invalidFields.push("last_name");
  if (!resident.dateOfBirth) invalidFields.push("dateOfBirth");
  if (!resident.sex) invalidFields.push("sex");
  if (!resident.address.trim()) invalidFields.push("address");
    if (!resident.email.trim()) invalidFields.push("email");
    if (!resident.password.trim()) invalidFields.push("password");
    if (!resident.sex.trim()) invalidFields.push("sex");
  if (!resident.phone.trim()) invalidFields.push("phone");
  if (!resident.upload) invalidFields.push("upload"); // file upload check

//  if (!isTermChecked) invalidFields.push("terms");

    if (invalidFields.length > 0) {
      setInvalidFields(invalidFields);
    setPopupErrorMessage("Please fill up all required fields.");
    setShowErrorPopup(true);
      setTimeout(() => {
       setShowErrorPopup(false);
      }, 3000);
      return;
    }

  setInvalidFields([]);
 setShowSubmitPopup(true);
};


const confirmSubmit = async () => {
  setShowSubmitPopup(false);

  const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
  await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
};

    
    
    const handleCheckBox = (e: ChangeEvent<HTMLInputElement>) => {
        setIsTermChecked(e.target.checked);
    };

    const handleToken = (token: string | null) => {
        if (token) {
            setCaptchaToken(token);
        }
    };

    const [filesContainer1, setFilesContainer1] = useState<{ name: string, preview: string | undefined }[]>([]);

    const handleFileChangeContainer1 = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            const validImageTypes = ["image/jpeg", "image/png", "image/jpg"];
            
            if (!validImageTypes.includes(selectedFile.type)) {
                alert("Only JPG, JPEG, and PNG files are allowed.");
                return;
            }
        
            const preview = URL.createObjectURL(selectedFile);
            setFilesContainer1([{ name: selectedFile.name, preview }]);
    
            // Update resident state with the file
            setResident((prev) => ({ ...prev, upload: selectedFile }));
        }
    };

  const handleFileDeleteContainer1 = (fileName: string) => {
    setFilesContainer1([]);
    
    // Reset file input
    const fileInput = document.getElementById('file-upload-register') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };






    return (
        <main className="main-container-register-form">
        

            <div className="headerpic-reg">
                <p>REGISTER</p>
            </div>


             <div className="register-section-register-form">
                <h1>Sign Up</h1>

                <hr/>
            <form className="register-form" autoComplete="off">

                    
                    <div className="form-container">

                        <div className="form-container-upper ">

                       
                        <div className="form-container-left-side">

                            <div className="form-group-register-form">
                                <label htmlFor="first_name" className="form-label-register-form">First Name:<span className="required">*</span> </label>
                                <input value={resident.first_name} onChange={handleChange} id="first_name" 
                                type="text" name="first_name" 
                                 className={`form-input-register-form ${invalidFields.includes("first_name") ? "input-error" : ""}`}
                                placeholder= "Enter First Name"
                                required />

                            </div>

                            <div className="form-group-register-form">
                                <label htmlFor="last_name" className="form-label-register-form" >Last Name:<span className="required">*</span> </label>  
                                

                                <input value={resident.last_name} onChange={handleChange} id="last_name" 
                                type="text" name="last_name" 
                               className={`form-input-register-form ${invalidFields.includes("last_name") ? "input-error" : ""}`}
                                placeholder="Enter Last Name"
                                required/>

                            </div>

                              

                            <div className="form-group-register-form">
                                <label htmlFor="middle_name" className="form-label-register-form">Middle Name: </label>
                                <input value={resident.middle_name} onChange={handleChange} id="middle_name" 
                                type="text" name="middle_name" 
                                className="form-input-register-form "
                                placeholder= "Enter Middle Name" />

                            </div>

                                

                            <div className="form-group-register-form">
                                    <label htmlFor="sex" className="form-label-register-form">Gender:<span className="required">*</span></label>
                                    <select value={resident.sex} onChange={handleChange} id="sex" name="sex"  className={`form-input-register-form ${invalidFields.includes("sex") ? "input-error" : ""}`} required>
                                        <option value="" disabled>Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                            </div>


                              <div className="form-group-register-form">
                                    <label htmlFor="password" className="form-label-register-form">Password:<span className="required">*</span> </label>
                                    <div className="relative">
                                        <input value={resident.password} onChange={handleChange} id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password" 
                                             className={`form-input-register-form ${invalidFields.includes("password") ? "input-error" : ""}`}
                                            placeholder="Enter Password"
                                            required/>
                                            <button
                                                 type="button"
                                                 className="toggle-password-btn"
                                                 onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                    </div>
                                </div>

                        </div>

                         <div className="form-container-right-side">
                            
                            

                            
                            <div className="form-group-register-form">
                                <label htmlFor="phone" className="form-label-register-form" >Phone Number:<span className="required">*</span> </label>
                                <input  value={resident.phone} id="phone" 
                                type="tel" name="phone"
                                className={`form-input-register-form ${invalidFields.includes("phone") ? "input-error" : ""}`}
                                maxLength={11}
                                pattern="^[0-9]{11}$" 
                                placeholder="Enter Phone Number"
                                onChange={(e) => {
                                    const input = e.target.value;
                                    // Only allow digits and limit to 11 characters
                                    if (/^\d{0,11}$/.test(input)) {
                                    handleChange(e);
                                    }
                                }}
                                required />
                            </div>

                            <div className="form-group-register-form">
                                <label htmlFor="dateOfBirth" className="form-label-register-form" >Date of Birth:<span className="required">*</span> </label>
                                <input   value={resident.dateOfBirth} onChange={handleChange} id="dateOfBirth" 
                                type="date" name="dateOfBirth" 
                                 className={`form-input-register-form ${invalidFields.includes("dateOfBirth") ? "input-error" : ""}`}
                                max={today}
                                required />
                            </div>

                            <div className="form-group-register-form">
                                <label htmlFor="address" className="form-label-register-form">Address:<span className="required">*</span> </label>
                                <input value={resident.address} onChange={handleChange} id="address" 
                                type="text" name="address" 
                               className={`form-input-register-form ${invalidFields.includes("address") ? "input-error" : ""}`}
                                placeholder="Enter Address"
                                required />
                            </div>

                            <div className="form-group-register-form">
                                <label htmlFor="email" className="form-label-register-form" >Email Address:<span className="required">*</span> </label>
                                <input  value={resident.email} onChange={handleChange} id="email" 
                                type="email" name="email" 
                               className={`form-input-register-form ${invalidFields.includes("email") ? "input-error" : ""}`}
                                placeholder="Enter Email"
                                required />
                            </div>

                             <div className="form-group-register-form">
                        <label htmlFor="confirm_password" className="form-label-register-form">Confirm Password:<span className="required">*</span></label>
                        <div className="relative">
                            <input
                                id="confirm_password"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirm_password"
                                value={confirmPassword}
                                onChange={handleChange}
                              className={`form-input-register-form ${invalidFields.includes("password") ? "input-error" : ""}`}
                                placeholder="Confirm Password"
                                required
                            />
                            <button
                                                                            type="button"
                                                                            className="toggle-password-btn"
                                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                        >
                                                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                        </div>
                    </div>

                        </div>

                         </div>



                         <div className="form-container-lower">

                          <div className="signature/printedname-container">
                        <label className="form-label-register-form">Upload Valid ID with address:<span className="required">*</span></label>
                        
                       <div className={`file-upload-container-register ${invalidFields.includes("upload") ? "input-error" : ""}`}>

                            <label htmlFor="file-upload-register" className="upload-link">Click to Upload File</label>
                            <input
                            id="file-upload-register"
                            type="file"
                            className="file-upload-input-register"
                            accept="image/*"
                            onChange={handleFileChangeContainer1}
                            required

                            style={{ display: "none" }}
                            />
                            <div className="uploadedFiles-container-register">
                            {filesContainer1.length > 0 && (
                                <div className="file-name-image-display-register">
                                <ul>
                                    {filesContainer1.map((file, index) => (
                                    <div className="file-name-image-display-indiv-register" key={index}>
                                        <li>
                                        {file.preview && (
                                            <div className="filename-image-container-register">
                                            <img
                                                src={file.preview}
                                                alt={file.name}
                                                style={{ width: '50px', height: '50px', marginRight: '5px' }}
                                            />
                                            </div>
                                        )}
                                        {file.name}
                                        <div className="delete-container-register">
                                            <button
                                            type="button"
                                            onClick={() => handleFileDeleteContainer1(file.name)}
                                            className="delete-button-register"
                                            >
                                            <img
                                                src="/images/trash.png"
                                                alt="Delete"
                                                className="delete-icon-register"
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
                        <label htmlFor="terms" className="form-label-register-form">I agree to the terms and conditions <span className="required">*</span></label>
                        <input id="terms" onChange={handleCheckBox} type="checkbox" name="terms" className="form-checkbox" required/>
                    </div>

                    <div className="form-captcha">
                        <ReCAPTCHA sitekey={captchaSiteKey} onChange={handleToken} />
                    </div>

                 <button type="button" onClick={handleSubmitClick} className="submit-button">
                    Register
                    </button>

                         </div>

                    </div>
                  
                </form>
            </div>



            {showSubmitPopup && (
            <div className="confirmation-popup-overlay-register">
                <div className="confirmation-popup-register">
                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                <p>Are you sure you want to submit?</p>
                <div className="yesno-container-add">
                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                </div>
                </div>
            </div>
            )}


        {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <img src="/Images/successful.png" alt="warning icon" className="successful-icon-popup" />
                        <p>Registration Successful!</p>
                        <p>Redirecting to Login Page...</p>
                    </div>
                </div>
            )}
            {errorPopup.show && (
                <div className="popup-overlay-register-error error">
                    <div className="popup-register-error">
                        <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                        <p>{errorPopup.message}</p>
                        <button onClick={() => setErrorPopup({ show: false, message: "" })} className="close-button">Close</button>
                    </div>
                </div>
            )}

            {showErrorPopup && (
                <div className={`error-popup-overlay-register show`}>
                    <div className="popup-ad-register">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
        </main>

        
    );
};

export default RegisterForm;
