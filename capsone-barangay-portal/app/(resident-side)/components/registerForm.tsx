"use client"
import { auth, db, storage } from "../../db/firebase";
import { deleteObject, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
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
}

type residentUser = Resident & {
    role: "Resident";
    status: "Unverified";
};

const RegisterForm: React.FC = () => {
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
    
      if (resident.password !== confirmPassword) {
        setErrorPopup({ show: true, message: "Passwords do not match!" });
        setConfirmPassword("");
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
          upload: fileDownloadURL, // Save the file URL instead of the file object
          createdAt: new Date().toISOString(),
        });
    
        await sendEmailVerification(user);
    
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          router.push("/resident/login");
        }, 3000);
      } catch (error: any) {
        setErrorPopup({ show: true, message: "Register failed! " + error.message });
    
        // Cleanup in case of error
        if (docRef) await deleteDoc(docRef);
        if (storageRef) await deleteObject(storageRef);
        if (user) await user.delete();
      }
    };
    

    const handleCheckBox = (e: ChangeEvent<HTMLInputElement>) => {
        setIsTermChecked(e.target.checked);
    };

    const handleToken = (token: string | null) => {
        if (token) {
            setCaptchaToken(token);
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
                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group-register-form">
                        <label htmlFor="sex" className="form-label-register-form">Sex:<span className="required">*</span></label>
                        <select value={resident.sex} onChange={handleChange} id="sex" name="sex" className="form-input-register-form" required>
                            <option value="" disabled>Select a Sex</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <div className="form-group-register-form">
            <label htmlFor="first_name" className="form-label-register-form">First Name:<span className="required">*</span> </label>
            <input value={resident.first_name} onChange={handleChange} id="first_name" 
            type="text" name="first_name" 
            className="form-input-register-form "
            placeholder= "Enter Name"
            required />

            </div>

            <div className="form-group-register-form">
            <label htmlFor="last_name" className="form-label-register-form" >Last Name:<span className="required">*</span> </label>  
            

              <input value={resident.last_name} onChange={handleChange} id="last_name" 
              type="text" name="last_name" 
              className="form-input-register-form " 
              placeholder="Enter Last Name"
              required/>

            </div>

            <div className="form-group-register-form">
            <label htmlFor="email" className="form-label-register-form" >Email Address:<span className="required">*</span> </label>
            <input  value={resident.email} onChange={handleChange} id="email" 
            type="email" name="email" 
            className="form-input-register-form " 
            placeholder="Enter Email"
            required />
            </div>

            <div className="form-group-register-form">
            <label htmlFor="phone" className="form-label-register-form" >Phone:<span className="required">*</span> </label>
            <input  value={resident.phone} onChange={handleChange} id="phone" 
            type="tel" name="phone"
            className="form-input-register-form " 
            placeholder="Enter Phone Number"
            required />
            </div>


            <div className="form-group-register-form">
            <label htmlFor="address" className="form-label-register-form">Address:<span className="required">*</span> </label>
            <input value={resident.address} onChange={handleChange} id="address" 
            type="text" name="address" 
            className="form-input-register-form " 
            placeholder="Enter Address"
            required />
            </div>


            <div className="form-group-register-form">
            <label htmlFor="password" className="form-label-register-form">Password:<span className="required">*</span> </label>
            <input value={resident.password} onChange={handleChange} id="password"
            type="password" name="password" 
            className="form-input-register-form "
            placeholder="Enter Password"
            required/>
            </div>

            <div className="form-group-register-form">
            <label htmlFor="confirm_password" className="form-label-register-form">Confirm Password:<span className="required">*</span></label>
              <input
                id="confirm_password"
                type="password"
                name="confirm_password"
                value={confirmPassword}
                onChange={handleChange}
                className="form-input-register-form"
                placeholder="Confirm Password"
                required
              />
            </div>


            <div className="signature/printedname-container">
                <label className="form-label-register-form" htmlFor="upload">Upload Valid ID with address:<span className="required">*</span></label>
                
                {/* Single File Input */}
                <label htmlFor="upload" className="upload-link">Click to Upload File</label>

                <input
                    id="upload"
                    type="file"
                    name="upload"
                    className="file-upload-input"
                    accept="image/*"
                    onChange={handleChange}
                    required
                />
                
                {/* File Preview */}
                {filePreview && (
                    <div className="file-preview">
                    <img src={filePreview} alt="Preview" style={{ width: '100px', height: '100px', marginTop: '10px' }} />
                    </div>
                )}
            </div>


                    <div className="form-checkbox-section">
                        <label htmlFor="terms" className="form-label-register-form">I agree to the terms and conditions <span className="required">*</span></label>
                        <input id="terms" onChange={handleCheckBox} type="checkbox" name="terms" className="form-checkbox" required/>
                    </div>

                    <div className="form-captcha">
                        <ReCAPTCHA sitekey={captchaSiteKey} onChange={handleToken} />
                    </div>

                    <button type="submit" className="submit-button" disabled={!isTermChecked}>
                        Register
                    </button>
                </form>
            </div>
        </main>
    );
};

export default RegisterForm;
