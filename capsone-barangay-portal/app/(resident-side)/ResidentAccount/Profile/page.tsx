"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Eye, EyeOff } from "lucide-react";
import "@/CSS/ResidentAccount/profile.css";

import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db, storage } from "@/app/db/firebase"; // Ensure 'auth' is imported





export default function SettingsPageResident() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const residentId = searchParams.get("id");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        reupload: "",
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
    const [reuploadDone, setReuploadDone] = useState(false);

  

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
                sex: docSnap.data().sex || "N/A",
                status: docSnap.data().status || "N/A",
                userIcon: docSnap.data().userIcon || "N/A",
                upload: docSnap.data().upload || "N/A",
                reupload: docSnap.data().reupload || "N/A",
                address: docSnap.data().address || "N/A",
              };
      
              if (data.status === "Verified") {
                const residentDocRef = doc(db, "Residents", docSnap.data()?.residentId);
                const residentSnap = await getDoc(residentDocRef);
                if (residentSnap.exists()) {
                  const verifiedData = residentSnap.data();
                  const mappedData = {
                    first_name: verifiedData.firstName || "N/A",
                    last_name: verifiedData.lastName || "N/A",
                    middle_name: verifiedData.middleName || "N/A",
                    phone: verifiedData.contactNumber || "N/A",
                    email: verifiedData.emailAddress || "N/A",
                    sex: verifiedData.sex || "N/A", // since Residents table may not have sex
                    status: "Verified",
                    userIcon: data.userIcon || "N/A", 
                    upload: verifiedData.verificationFilesURLs?.[0] || "N/A",
                    reupload: data.reupload || "N/A",
                    address: verifiedData.address || "N/A",
                  };
                  setResident(mappedData);
                  setFormData(mappedData);
                  setPreview(data.userIcon);
                }
              } else {
                setResident(data);
                setFormData(data);
                setPreview(data.userIcon);
              }
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
        if (formData.status === "Resubmission" && reuploadDone) {
            alert("You have already reuploaded your valid ID. Further uploads are disabled.");
            return;
        }
    
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setValidIDFile(selectedFile);
            setPreview2(URL.createObjectURL(selectedFile));
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
              /*setErrorPopup({ show: true, message: `Failed to update password: Password should be at least 6 characters.` });*/
              setErrorPopup({
                show: true,
                message: `Failed to update password: ${error.message.replace(/^Firebase:\s*/, "")}`,
              });

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
    
                if (validIDFile) {
                    const timeStamp = Date.now().toString();
                    const fileExtension = validIDFile.name.split('.').pop();
                    const fileName = `valid_id_${resident.first_name}_${resident.last_name}_${timeStamp}.${fileExtension}`;
                    const downloadURL = await uploadImageToStorage(validIDFile, `ResidentUsers/valid_id_image/${fileName}`);
                
                    if (formData.status === "Rejected") {
                        resident.upload = downloadURL;
                    } else if (formData.status === "Resubmission") {
                        resident.reupload = downloadURL;
                        setReuploadDone(true); // <- set flag after successful upload
                    }
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
            reupload: resident.reupload, // <-- ADD THIS
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


    //FOR NOTIFICATION REJECTION    
      useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
          // Wait for the page to render the section
          const scrollToSection = () => {
            const element = document.querySelector(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            } else {
              // Retry after slight delay if not yet available
              setTimeout(scrollToSection, 100);
            }
          };
          scrollToSection();
        }
      }, []);

  
      

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    return (
        <main className="main-container-resident-profile">

        <div className="account-section-incident-report">
                <h1>Account Profile</h1>
                <hr />

                <div className="account-profile-section-modern">

                  
                    <div className="profile-left">
                    {preview ? (
                        <img src={preview} alt="User Icon" className="profile-image" />
                    ) : resident.userIcon ? (
                        <img src={resident.userIcon} alt="User Icon" className="profile-image" />
                    ) : (
                        <img src="/images/user.png" alt="User Icon" className="profile-image" />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        id="fileUpload"
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                    />
                    <button
                        className="upload-btn"
                        onClick={() => document.getElementById("fileUpload")?.click()}
                    >
                        Update Profile Image
                    </button>
                    </div>

                  
                    <div className="profile-right">
                    <h2>{resident.first_name} {resident.last_name}</h2>

                    <a href="/ResidentAccount/Transactions" className="transactions-link-modern">
                        View Transactions →
                    </a>

                    <div className="note-box">
                        <p>
                        <span className="required">*</span> This data is uneditable as it is synced with the Barangay's database.<br />
                        <span className="required">*</span> For any concerns, please visit the Barangay.
                        </p>
                    </div>
                    </div>
                </div>

                <div className="account-details-section">

                    <form onSubmit={handleSubmit} className="account-details-content">

                        <div className="account-details-upper">

                            <div className="account-details-section-left">

                             <div className="form-group-profile-section">
                                    <label htmlFor="first_name" className="form-label-profile-section">First Name:</label>
                                    <input 
                                        id="first_name" 
                                        name="first_name"
                                        value={formData.first_name} 
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="form-input-profile-section" 
                                        required
                                        disabled={formData.status === "Verified"}                        />
                                </div>

                                
                                    <div className="form-group-profile-section">
                                        <label htmlFor="last_name" className="form-label-profile-section">Last Name:</label>
                                        <input 
                                            id="last_name" 
                                            name="last_name"
                                            value={formData.last_name} 
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="form-input-profile-section"
                                            disabled={formData.status === "Verified"}                        />
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
                                            disabled={formData.status === "Verified"}
                                        />
                                    </div>

                                    <div className="form-group-profile-section">
                                            <label htmlFor="status" className="form-label-profile-section">Status:</label>
                                            <input 
                                                id="status" 
                                                name="status"
                                                value={
                                                    formData.status === "Rejected" || formData.status === "Resubmission"
                                                        ? "Unverified"
                                                        : formData.status
                                                }
                                                className="form-input-profile-section" 
                                                disabled 
                                            />
                                        </div>

                                <div className="form-group-profile-section">
                                    <label htmlFor="password" className="form-label-profile-section">New Password:</label>
                                    <div className="relative">
                                        <input 
                                                id="password" 
                                                name="password"
                                                className="form-input-profile-section" 
                                                type={showNewPassword ? "text" : "password"}
                                                title="Please enter a password with a minimum of 6 characters"
                                                onChange={handleChange}
                                            />
                                            <button
                                                    type="button"
                                                    className="toggle-password-btn"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                            >
                                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>

                                    </div>
                                </div>
                                        
                            </div>

                            <div className="account-details-section-right">

                                    <div className="form-group-profile-section">
                                        <label htmlFor="middle_name" className="form-label-profile-section">Middle Name:</label>
                                        <input 
                                            id="middle_name" 
                                            name="middle_name"
                                            value={formData.middle_name} 
                                            onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                                            className="form-input-profile-section" 
                                            required
                                            disabled={formData.status === "Verified"}                        />
                                    </div>

                                      <div className="form-group-profile-section-dropdown">
                                            <label htmlFor="sex" className="form-label-profile-section">Sex:</label>
                                            <select
                                                id="sex"
                                                name="sex"
                                                value={formData.sex}
                                                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                                className="form-input-profile-section"
                                                required
                                                disabled={formData.status === "Verified"}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
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
                                            title="Please enter a valid 11-digit contact number. Format: 0917XXXXXXX "
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
                                            disabled={formData.status === "Verified"}
                                        />
                                    </div>

                                    <div className="form-group-profile-section">
                                        <label htmlFor="confirmPassword" className="form-label-profile-section">Confirm Password:</label>
                                        <div className="relative">
                                            <input 
                                             id="confirmPassword" 
                                              name="confirmPassword"
                                             className="form-input-profile-section" 
                                              type={showConfirmPassword ? "text" : "password"}
                                             title="Please enter a password with a minimum of 6 characters"
                                              onChange={handleChange}
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

                        <div className="account-details-lower">

                            
                             <div className="submit-section-resident-account">

                                <button type="submit" className="submit-btn-profile-section" disabled={loading}>
                                {loading ? "Updating..." : "Update Profile"}
                                </button>

                            </div>


                        </div>

            
 

                        </form>

                        

                </div>




         </div>




            <div className="first-section-resident-profile">

                <div className="account-details-section">

                <div className="acc-details-content-section-1">
                    <p>Account Details</p>
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
                            disabled={formData.status === "Verified"}                        />
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
                            disabled={formData.status === "Verified"}                        />
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
                            disabled={formData.status === "Verified"}
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
                            disabled={formData.status === "Verified"}
                        />
                    </div>



                        



                        {formData.status === "Resubmission" && (!resident.reupload || resident.reupload === "N/A") && (
                            <div id="resubmit-section" className="valid-id-section-profile">
                                <h3 className="valid-id-header">ID Rejected — Please Resubmit</h3>
                                <p className="valid-id-subtext">
                                    Your previously submitted valid ID did not meet the requirements. Kindly upload a new, clear image for review.
                                </p>

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
                                        Upload New Valid ID
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

