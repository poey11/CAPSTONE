"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import "@/CSS/SettingsPage/settingsPage.css";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


export default function SettingsPage() {
    const router = useRouter();

     const searchParams = useSearchParams();
     const userId = searchParams.get("id")
     
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        address: "",
        birthDate: "",
        sex: "",
        phone: "",
        profileImage: "",
        position:"",
        department: "",
    });

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {

        const fetchUserData = async () => {
            const docRef = doc(db, "BarangayUsers", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
               
                setUserData({
                    firstName: docSnap.data().firstName || "User",
                    lastName: docSnap.data().lastName || "User",
                    address: docSnap.data().address || "",
                    birthDate: docSnap.data().birthDate || "",
                    sex: docSnap.data().sex || "",
                    phone: docSnap.data().phone || "",
                    position: docSnap.data().position || "",
                    profileImage: docSnap.data().profileImage || "/images/user.png",
                    department: docSnap.data().department || "",
                });

                setPreview(docSnap.data().fileURL || null);
            }
        };

        fetchUserData();
        }
    }, [userId]);

    const handleBack = () => {
        router.push("/dashboard");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && userId) {
            const storage = getStorage();
            const storageRef = ref(storage, `profileImages/${userId}_${file.name}`);
            
            try {
                // Upload the image
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                
                // Update Firestore profileImage field with new URL
                const userRef = doc(db, "BarangayUsers", userId);
                await updateDoc(userRef, {
                    profileImage: downloadURL,
                });
    
                // Update local state for instant UI feedback
                setSelectedImage(downloadURL);
                setUserData((prev) => ({
                    ...prev,
                    profileImage: downloadURL,
                }));
    
            } catch (err) {
                console.error("Image upload failed", err);
                setError("Failed to upload image. Please try again.");
            }
        }
    };
    

    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

   


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!userId) {
        setError("User session expired. Please log in again.");
        setLoading(false);
        return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(userData.phone)) {
        setError("Invalid contact number. Format should be: 0917XXXXXXX");
        setLoading(false);
        return;
    }

    try {
        const docRef = doc(db, "BarangayUsers", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const isDataChanged = Object.keys(userData).some((key) => {
                const newVal = userData[key as keyof typeof userData]?.toString().trim();
                const currentVal = currentData[key]?.toString().trim();
                return newVal !== currentVal;
            });

            if (!isDataChanged) {
                alert("No changes detected.");
                setLoading(false);
                return;
            }
        }

        await updateDoc(docRef, { ...userData });
        alert("Profile updated successfully!");
      //  router.push("/dashboard");
    } catch (err: any) {
        console.error("Error updating profile:", err);
        setError("Failed to update profile. Please try again. " + err.message);
    }

    setLoading(false);
};

    

    return (
        <main className="modifyaccsettings-main-container-settings">
            <div className="section-1-settings">
                <h1>Account Settings</h1>
            </div>

            <div className="modifyaccsettings-main-section-settings">

          
                <div className="modifyaccsettings-main-section1-settings">
                    <div className="modifyaccsettings-main-section1-left-settings">
                        <button onClick={handleBack}>   
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-settings" />
                        </button>
                        <h1>Edit Account Settings</h1>
                    </div>

                    <div className="action-btn-section-settings">
                        <button className="discard-btn-settings" type="button">Discard</button>
                        <button className="save-btn-settings" type="submit" form="settings-form">Save</button>
                    </div>
                </div>

                <hr />

                <form  id ="settings-form" onSubmit={handleSubmit}>


                <div className="main-fields-container-settings">


                    <div className="account-details-section-settings">
                        <div className="icon-container-settings">
                        <img
                            src={selectedImage || userData.profileImage || undefined}
                            alt="User Icon"
                            className="user-icon-settings"
                        />

                            <input
                    
                                type="file"
                                accept="image/*"
                                id="fileUpload"
                                style={{ display: "none" }}
                                onChange={handleImageChange}
                            />
                            <button className="upload-btn-settings" onClick={() => document.getElementById("fileUpload")?.click()}>
                                Upload Image
                            </button>
                        </div>

                        <div className="main-fields-container-section2-settings">
                            <div className="fields-container-settings">
                                <div className="fields-section-settings">
                                    <p>Official First Name</p>
                                    <input 
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                     className="input-field-settings" 
                                     value={userData.firstName}
                                      onChange={handleChange} 
                                      />
                                </div>
                                
                                <div className="fields-section-settings">
                                    <p>Official Last Name</p>
                                    <input 
                                    id="lastName"
                                    name="lastName"
                                    type="text" 
                                    className="input-field-settings" 
                                    value={userData.lastName } 
                                    onChange={handleChange} />
                                </div>

                                <div className="fields-section-settings">
                                    <p>Address</p>
                                    <input 
                                    id="address"
                                    name="address"
                                    type="text" 
                                    className="input-field-settings"
                                     value={userData.address} 
                                     onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="main-fields-container-section1-settings">
                            <div className="section-left-settings">
                                <div className="fields-container-settings">
                                    <div className="fields-section-settings">
                                        <p>Birthday</p>
                                        <input 
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                         className="input-field-settings" 
                                         value={userData.birthDate} 
                                         onChange={handleChange} />
                                    </div>
                                    <div className="fields-section-settings">
                                        <p>Sex</p>
                                        <select 
                                        id="sex"
                                        name="sex"
                                        className="input-field-settings"  
                                        value={userData.sex} 
                                        onChange={(e) => setUserData({ ...userData, sex: e.target.value })}>

                                            <option value="" disabled>Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>


                                    {userData.position === "LF Staff" && (

                                        <>
                                        <div className="fields-section-settings">
                                        <p>Department</p>
                                        <input
                                        id="department"
                                        name="department"
                                        type="text" 
                                        className="input-field-settings"
                                        value={userData.department} 
                                        readOnly 
                                        onChange={handleChange} />
                                        </div>
                                        </>
                                        )}
                                    </div>
                            </div>
                            <div className="section-right-settings">
                                <div className="fields-section-settings">
                                    <p>Contact Number</p>
                                    <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="input-field-settings"
                                    maxLength={10}
                                    title="Please enter a valid 10-digit contact number"
                                    value={userData.phone}
                                    onChange={handleChange}
                                    />

                                </div>

                                <div className="fields-section-settings">
                                    <p>Position</p>
                                    <input
                                      id="position"
                                      name="position"
                                      type="text" 
                                      className="input-field-settings"
                                      value={userData.position} 
                                      readOnly 
                                      onChange={handleChange} />
                                </div>



                            </div>
                
                        </div>
                    </div>

                </div>
            </form>
                
            </div>

        </main>
    );
}
