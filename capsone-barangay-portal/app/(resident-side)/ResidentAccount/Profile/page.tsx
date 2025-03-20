"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "@/CSS/ResidentAccount/profile.css";

import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db, storage } from "@/app/db/firebase"; // Ensure 'auth' is imported



// need to fix yung pag gitna ng profile image section

export default function SettingsPageResident() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const residentId = searchParams.get("id");

    const [resident, setResident] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        sex: "",
        status: "",
        userIcon: "",
    });

    const [showPopup, setShowPopup] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null); // State for file upload
  

    useEffect(() => {
        if (residentId) {
          const fetchResidentData = async () => {
            const docRef = doc(db, "ResidentUsers", residentId);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
              const data = docSnap.data();
              setResident({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                phone: data.phone || "",
                email: data.email || "",
                sex: data.sex || "",
                status: data.status || "",
                userIcon: data.userIcon || "",
              });
    
              setPreview(data.userIcon)
            }
          };
    
          fetchResidentData();
        }
      }, [residentId]);
    

    const handleBack = () => {
        window.location.href = "/dashboard";
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
         } else {
            setResident((prevData) => ({ ...prevData, [name]: value }));
        }

    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
          setFile(selectedFile);
          setPreview(URL.createObjectURL(selectedFile)); // Show preview before upload
        }
    };

    const uploadImageToStorage = async (file: File) => {
        const storageRef = ref(storage, `userIcons/${residentId}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      };


      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
      
        try {
          const user = auth.currentUser;
          if (!user) {
            setMessage("User session expired. Please log in again.");
            setShowPopup(true);
            setLoading(false);
            return;
          }
      
          if (password || confirmPassword) {
            if (password !== confirmPassword) {
              setMessage("Passwords do not match!");
              setShowPopup(true);
              setLoading(false);
              return;
            }
      
            try {
              await updatePassword(user, password);
              setMessage("Password updated successfully!");
              setShowPopup(true);
            } catch (error: any) {
              setMessage(`Failed to update password: ${error.message}`);
              setShowPopup(true);
              setLoading(false);
              return;
            }
          }
      
          if (file) {
            const downloadURL = await uploadImageToStorage(file);
            resident.userIcon = downloadURL;
          }
      
          const docRef = doc(db, "ResidentUsers", residentId!);
          await updateDoc(docRef, {
            phone: resident.phone,
            userIcon: resident.userIcon,
          });
      
          setMessage("Profile updated successfully!");
          setShowPopup(true);
          router.push("/ResidentAccount/Profile");
        } catch (err: any) {
          setMessage("Failed to update profile. Please try again. " + err.message);
          setShowPopup(true);
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
                                <p>No Profile Image</p>
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
                    <p className="name">{resident.first_name || "N/A"}</p>
                    <p className="name">{resident.last_name || "N/A"}</p>
                    </div>

                    <div className="transactions-link">
                    <a href="/ResidentAccount/Transactions" className="transactions-text">
                        View Transactions
                    </a>
                    </div>
                </div>


                    

                    <div className="edit-section-profile">
                      <form onSubmit={handleSubmit}>
                        <div className="form-group-profile-section">
                            <label htmlFor="first_name" className="form-label-profile-section">First Name: </label>
                            <input 
                                id="first_name" 
                                name="first_name"
                                value={resident.first_name ||  "N/A"} 
                                onChange={handleChange} 
                                className="form-input-profile-section" 
                                required 
                                disabled
                            />
                        </div>

                        <div className="form-group-profile-section">
                            <label htmlFor="last_name" className="form-label-profile-section">Last Name: </label>
                            <input 
                                id="last_name" 
                                name="last_name"
                                value={resident.last_name ||  "N/A"} 
                                onChange={handleChange} 
                                className="form-input-profile-section" 
                                required 
                                disabled
                            />
                        </div>

                        <div className="form-group-profile-section">
                            <label htmlFor="sex" className="form-label-profile-section">Sex:</label>
                            <input 
                                id="sex" 
                                name="sex"
                                value={resident.sex ||  "N/A"}  
                                onChange={handleChange} 
                                className="form-input-profile-section" 
                                required 
                                disabled
                            />
                        </div>

                        <div className="form-group-profile-section">
                            <label htmlFor="email" className="form-label-profile-section">Email:</label>
                            <input 
                                id="email" 
                                name="email"
                                value={resident.email ||  "N/A"} 
                                onChange={handleChange} 
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
                                value={resident.phone ||  "N/A"} 
                                onChange={handleChange} 
                                className="form-input-profile-section" 
                                required 
                            />
                        </div>

                        <div className="form-group-profile-section">
                            <label htmlFor="status" className="form-label-profile-section">Status:</label>
                            <input 
                                id="status" 
                                name="status"
                                value={resident.status ||  "N/A"}  
                                onChange={handleChange} 
                                className="form-input-profile-section" 
                                required 
                                disabled 
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
                        <p>{message}</p>
                        <button onClick={() => setShowPopup(false)} className="continue-button">Continue</button>
                    </div>
                </div>
            )}
        </main>
    );
}
