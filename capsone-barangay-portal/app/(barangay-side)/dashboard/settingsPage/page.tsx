"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import "@/CSS/SettingsPage/settingsPage.css";

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

    

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
        }
    };

    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form submitted"); // Debugging log
    
        setLoading(true);
        setError("");
    
        if (!userId) {
            setError("User ID not found.");
            setLoading(false);
            return;
        }
    
        if (!/^\d{10}$/.test(userData.phone)) {
            setError("Please enter a valid 10-digit contact number.");
            setLoading(false);
            return;
        }
    
        try {
            const docRef = doc(db, "BarangayUsers", userId);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
                const currentData = docSnap.data();
                const isDataChanged = Object.keys(userData).some(
                    (key) =>
                        userData[key as keyof typeof userData]?.toString().trim() !==
                        currentData[key]?.toString().trim()
                );
    
                if (!isDataChanged) {
                    alert("No changes detected.");
                    setLoading(false);
                    return;
                }
            }
    
            await updateDoc(docRef, { ...userData });
    
            alert("Profile updated successfully!");
            router.push("/dashboard");
        } catch (err) {
            setError("Failed to update user data.");
            console.error(err);
        }
    
        setLoading(false);
    };
    
    

    return (
        <main className="modifyaccsettings-main-container">
            <div className="section-1">
                <h1>Account Settings</h1>
            </div>

            <div className="modifyaccsettings-main-section">

          
                <div className="modifyaccsettings-main-section1">
                    <div className="modifyaccsettings-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>
                        <h1>Edit Account Settings</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn" type="button">Discard</button>
                        <button className="save-btn" type="submit" form="settings-form">Save</button>
                    </div>
                </div>

                <hr />

                <form  id ="settings-form" onSubmit={handleSubmit}>


                <div className="main-fields-container">


                    <div className="account-details-section">
                        <div className="icon-container">
                        <img
                            src={selectedImage || userData.profileImage || undefined}
                            alt="User Icon"
                            className="user-icon"
                        />

                            <input
                    
                                type="file"
                                accept="image/*"
                                id="fileUpload"
                                style={{ display: "none" }}
                                onChange={handleImageChange}
                            />
                            <button className="upload-btn" onClick={() => document.getElementById("fileUpload")?.click()}>
                                Upload Image
                            </button>
                        </div>

                        <div className="main-fields-container-section2">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Official First Name</p>
                                    <input 
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                     className="input-field" 
                                     value={userData.firstName}
                                      onChange={handleChange} 
                                      />
                                </div>
                                
                                <div className="fields-section">
                                    <p>Official Last Name</p>
                                    <input 
                                    id="lastName"
                                    name="lastName"
                                    type="text" 
                                    className="input-field" 
                                    value={userData.lastName } 
                                    onChange={handleChange} />
                                </div>

                                <div className="fields-section">
                                    <p>Address</p>
                                    <input 
                                    id="address"
                                    name="address"
                                    type="text" 
                                    className="input-field"
                                     value={userData.address} 
                                     onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="main-fields-container-section1">
                            <div className="section-left">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Birthday</p>
                                        <input 
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                         className="input-field" 
                                         value={userData.birthDate} 
                                         onChange={handleChange} />
                                    </div>
                                    <div className="fields-section">
                                        <p>Sex</p>
                                        <select 
                                        id="sex"
                                        name="sex"
                                        className="input-field"  
                                        value={userData.sex} 
                                        onChange={(e) => setUserData({ ...userData, sex: e.target.value })}>

                                            <option value="" disabled>Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="section-right">
                                <div className="fields-section">
                                    <p>Contact Number</p>
                                    <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    className="input-field"
                                    maxLength={10}
                                    title="Please enter a valid 10-digit contact number"
                                    value={userData.phone}
                                    onChange={handleChange}
                                    />

                                </div>

                                <div className="fields-section">
                                    <p>Position</p>
                                    <input
                                      id="position"
                                      name="position"
                                      type="text" 
                                      className="input-field"
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
