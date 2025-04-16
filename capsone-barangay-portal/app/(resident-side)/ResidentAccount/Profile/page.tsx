"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "@/CSS/ResidentAccount/profile.css";

import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db, storage } from "@/app/db/firebase"; // Ensure 'auth' is imported



// I will send you a code can you check why is the first name and last name updating instanly in the account-profile-section when im changing it in the edit section but im not yet clicking the submit button yet

export default function SettingsPageResident() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const residentId = searchParams.get("id");

    const [resident, setResident] = useState({
        first_name: "",
        last_name: "",
        middle_name: "",
        phone: "",
        email: "",
        sex: "",
        status: "",
        address: "",
        userIcon: "",
        upload: "",
    });

    const [formData, setFormData] = useState({ ...resident });


    const [showPopup, setShowPopup] = useState(false);
    const [errorPopup, setErrorPopup] = useState({ show: false, message: "" });
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const [preview, setPreview] = useState<string | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [validIDFile, setValidIDFile] = useState<File | null>(null); 
  

    useEffect(() => {
        if (residentId) {
          const fetchResidentData = async () => {
            const docRef = doc(db, "ResidentUsers", residentId);
            const docSnap = await getDoc(docRef);
      
            if (docSnap.exists()) {
              const data = {
                first_name: docSnap.data().first_name || "N/A",
                last_name: docSnap.data().last_name || "N/A",
                middle_name: docSnap.data().middle_name || "N/A",
                phone: docSnap.data().phone || "N/A",
                email: docSnap.data().email || "N/A",
                sex: docSnap.data().sex  || "N/A",
                status: docSnap.data().status || "N/A",
                userIcon: docSnap.data().userIcon ||  "N/A",
                upload: docSnap.data().upload || "N/A",
                address: docSnap.data().address || "N/A",
              };
              setResident(data);
              setFormData(data);
              setPreview(data.userIcon);
            }
          };
      
          fetchResidentData();
        }
      }, [residentId]);
      

    const handleBack = () => {
        window.location.href = "/dashboard";
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          const { name, value } = e.target;
          setResident((prevData) => ({
              ...prevData,
              [name]: value,
          }));
  
          if (name === "password") {
              setPassword(value);
              setResident((prevData) => ({ ...prevData, password: value })); // formData.password
           
           } else if (name === "confirmPassword") {
              setConfirmPassword(value);
           } 
           else {
              setResident((prevData) => ({ ...prevData, [name]: value }));
          }
  
      };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
          setProfileFile(selectedFile);
          setPreview(URL.createObjectURL(selectedFile)); // Show preview before upload
        }
      };

      const uploadImageToStorage = async (file: File, path: string) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      };

      const handleValidIDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
          setValidIDFile(selectedFile);
          setPreview2(URL.createObjectURL(selectedFile)); // Show preview before upload
        }
      };
      
      const uploadValidIDToStorage = async (file: File) => {
        const storageRef = ref(storage, `validIDs/${residentId}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      };


      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setErrorPopup({ show: false, message: "" });
      
        try {
          const user = auth.currentUser;
          if (!user) {
            setErrorPopup({ show: true, message: "User session expired. Please log in again." });
            setLoading(false);
            return;
          }
      
          if (password || confirmPassword) {
            if (password !== confirmPassword) {
              setErrorPopup({ show: true, message: "Passwords do not match." });
              setLoading(false);
              return;
            }
      
            try {
              await updatePassword(user, password);
              setMessage("Password updated successfully!");
              setShowPopup(true);
            } catch (error: any) {
            /*error message*/
              setErrorPopup({ show: true, message: `Failed to update password: Password should be at least 6 characters.` });
              setLoading(false);
              return;
            }
          }

        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
        setErrorPopup({ show: true, message: "Invalid contact number. Format should be: 0917XXXXXXX" });
        setLoading(false);
        return;
        }
      
            // Upload profile picture if it exists
            if (profileFile) {
                const downloadURL = await uploadImageToStorage(profileFile, `userIcons/${residentId}`);
                resident.userIcon = downloadURL;
                }
    
            // Upload valid ID if status is "Rejected" and file exists
            if (validIDFile && resident.status === "Rejected") {
                const timeStamp = Date.now().toString();
                const fileExtension = validIDFile.name.split('.').pop();
                const fileName = `valid_id_${resident.first_name}_${resident.last_name}_${timeStamp}.${fileExtension}`;
                const downloadURL = await uploadImageToStorage(validIDFile, `ResidentUsers/valid_id_image/${fileName}`);
                resident.upload = downloadURL;
            }
      
          const docRef = doc(db, "ResidentUsers", residentId!);
          await updateDoc(docRef, {
            first_name: formData.first_name,
            last_name: formData.last_name,
            middle_name: formData.middle_name,
            phone: formData.phone,
            sex: formData.sex,
            userIcon: resident.userIcon,
            address: formData.address,
            upload: resident.upload,
          });
          
          setResident({ ...resident, ...formData });
          
      
          setMessage("Profile updated successfully!");
          setShowPopup(true);
          router.push("/ResidentAccount/Profile");
        } catch (err: any) {
            setErrorPopup({ show: true, message: "Failed to update profile. Please try again. " + err.message });
        }
      
        setLoading(false);
      };
      

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    return (
        <main className="main-container-resident-profile">
            <div className="first-section-resident-profile">

                <div className="account-details-section">

                <div className="acc-details-content-section-1">
                    <p>Account Details</p>
                </div>


                <div className="account-profile-section">
                    <div className="icon-container-profile-section">
                    {preview ? (
                                <img
                                    src={preview}
                                    alt="User Icon"
                                    className="user-icon-profile-section"
                                />
                            ) : resident.userIcon ? (
                                <img
                                    src={resident.userIcon}
                                    alt="User Icon"
                                    className="user-icon-profile-section"
                                />
                            ) : (
                                <img
                                    src="/images/user.png"
                                    alt="User Icon"
                                    className="user-icon-profile-section"
                                />
                            )}
                    <input
                        type="file"
                        accept="image/*"
                        id="fileUpload"
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                    />
                    <button
                        className="upload-btn-profile-section"
                        onClick={() => document.getElementById("fileUpload")?.click()}
                    >
                        Update Profile Image
                    </button>
                    </div>

                    <div className="name-section">
                    <p className="name">{resident.first_name}</p>
                    <p className="name">{resident.last_name}</p>
                    </div>

                    <div className="transactions-link">
                    <a href="/ResidentAccount/Transactions" className="transactions-text">
                        View Transactions
                    </a>
                    </div>

                                    {/* Show Valid ID section only if status is "Rejected" */}
                {resident.status === "Resubmission" && (
                <div className="account-profile-section">
                    <div className="icon-container-profile-section">
                    {preview2 ? (
                        <img
                        src={preview2}
                        alt="User Valid ID"
                        className="valid-id-container-profile-section"
                        />
                    ) : resident.upload ? (
                        <img
                        src={resident.upload}
                        alt="User Valid ID"
                        className="valid-id-container-profile-section"
                        />
                    ) : (
                        <p>No Valid ID</p>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        id="validIdUpload"
                        style={{ display: "none" }}
                        onChange={handleValidIDChange}
                    />
                    <button
                        className="upload-btn-profile-section"
                        onClick={() => document.getElementById("validIdUpload")?.click()}
                    >
                        Update Valid ID
                    </button>
                    </div>
                </div>
                )}
                </div>


                    

                    <div className="edit-section-profile">
                      <form onSubmit={handleSubmit}>
                      <div className="form-group-profile-section">
                        <label htmlFor="first_name" className="form-label-profile-section">First Name:</label>
                        <input 
                            id="first_name" 
                            name="first_name"
                            value={formData.first_name} 
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="form-input-profile-section" 
                            required
                        />
                    </div>

                    <div className="form-group-profile-section">
                        <label htmlFor="middle_name" className="form-label-profile-section">Middle Name:</label>
                        <input 
                            id="middle_name" 
                            name="middle_name"
                            value={formData.middle_name} 
                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                            className="form-input-profile-section" 
                            required
                        />
                    </div>

                    <div className="form-sgroup-profile-section">
                        <label htmlFor="last_name" className="form-label-profile-section">Last Name:</label>
                        <input 
                            id="last_name" 
                            name="last_name"
                            value={formData.last_name} 
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="form-input-profile-section"
                        />
                    </div>

                    <div className="form-group-profile-section">
                        <label htmlFor="sex" className="form-label-profile-section">Sex:</label>
                        <select
                            id="sex"
                            name="sex"
                            value={formData.sex}
                            onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                            className="form-input-profile-section"
                            required
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    <div className="form-group-profile-section">
                        <label htmlFor="email" className="form-label-profile-section">Email:</label>
                        <input 
                            id="email" 
                            name="email"
                            value={formData.email} 
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="form-input-profile-section" 
                            required 
                            disabled
                        />
                    </div>

                    <div className="form-group-profile-section">
                        <label htmlFor="phone" className="form-label-profile-section">Phone:</label>
                        <input 
                            id="phone" 
                            name="phone"
                            value={formData.phone} 
                            onChange={(e) => {
                                const input = e.target.value;
                                // Only allow digits and limit to 11 characters
                                if (/^\d{0,11}$/.test(input)) {
                                  setFormData({ ...formData, phone: input });
                                }
                              }}
                            className="form-input-profile-section" 
                            maxLength={11}  
                            pattern="^[0-9]{11}$" 
                        />
                    </div>

                    <div className="form-group-profile-section">
                        <label htmlFor="status" className="form-label-profile-section">Status:</label>
                        <input 
                            id="status" 
                            name="status"
                            value={formData.status}  
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="form-input-profile-section" 
                            required 
                            disabled 
                        />
                    </div>

                    <div className="form-group-profile-section">
                        <label htmlFor="address" className="form-label-profile-section">Address:</label>
                        <input 
                            id="address" 
                            name="address"
                            value={formData.address}  
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="form-input-profile-section" 
                            required 
                        />
                    </div>



                        
                        <div className="form-group-profile-section">
                            <label htmlFor="password" className="form-label-profile-section">New Password:</label>
                            <input 
                                id="password" 
                                name="password"
                                className="form-input-profile-section" 
                                type="password"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group-profile-section">
                            <label htmlFor="confirmPassword" className="form-label-profile-section">Confirm Password:</label>
                            <input 
                                id="confirmPassword" 
                                name="confirmPassword"
                                className="form-input-profile-section" 
                                type="password"
                                onChange={handleChange}
                            />
                        </div>

                        {formData.status === "Resubmission" && (
                            <div className="valid-id-section-profile">
                                <h3 className="valid-id-header">Your previous ID was rejected</h3>
                                <p className="valid-id-subtext">Please upload a new Valid ID for review.</p>
                                
                                <div className="valid-id-content">
                                {preview2 ? (
                                    <img
                                    src={preview2}
                                    alt="User Valid ID"
                                    className="valid-id-preview"
                                    />
                                ) : resident.upload ? (
                                    <img
                                    src={resident.upload}
                                    alt="User Valid ID"
                                    className="valid-id-preview"
                                    />
                                ) : (
                                    <p className="no-valid-id-text">No Valid ID uploaded</p>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    id="validIdUpload"
                                    style={{ display: "none" }}
                                    onChange={handleValidIDChange}
                                />

                            <button
                                type="button"
                                className="upload-btn-profile-section"
                                onClick={() => document.getElementById("validIdUpload")?.click()}
                            >
                                Update Profile Image
                            </button>

                                    </div>
                            </div>
                            )}


                        
                        <div className="submit-section-resident-account">

                            <button type="submit" className="submit-btn-profile-section" disabled={loading}>
                                {loading ? "Updating..." : "Update Profile"}
                            </button>

                        </div>

                       

                        </form>


                    </div>
                </div>

            </div>


            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <img src="/Images/successful.png" alt="warning icon" className="successful-icon-popup" />
                        <p>{message}</p>
                        <button onClick={() => setShowPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}

            {errorPopup.show && (
                <div className="popup-overlay error">
                    <div className="popup">
                    <img src="/Images/warning.png" alt="warning icon" className="warning-icon-popup" />
                    <p>{errorPopup.message}</p>
                    <button onClick={() => setErrorPopup({ show: false, message: "" })} className="continue-button"> Continue </button>
                    </div>
                </div>
            )}
        </main>
    );
}

