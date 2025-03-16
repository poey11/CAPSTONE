"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "@/CSS/ResidentAccount/profile.css";

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
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [file, setFile] = useState<File | null>(null); // State for file upload
  
    
    useEffect(() => {
        if (residentId) {
            const fetchResidentData = async () => {
                const docRef = doc(db, "ResidentUsers", residentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setResident({
                        first_name: docSnap.data().first_name || "",
                        last_name: docSnap.data().last_name || "",
                        phone: docSnap.data().phone || "",
                        email: docSnap.data().email || "",
                        sex: docSnap.data().sex || "",
                        status: docSnap.data().status || "",
                    });

                    setPreview(docSnap.data().fileURL || null);
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
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
    
        try {
            const docRef = doc(db, "ResidentUsers", residentId!);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
                const currentData = docSnap.data();
    
                // Check if there are any changes
                const isDataChanged = Object.keys(resident).some(
                    (key) => resident[key as keyof typeof resident] !== currentData[key]
                );
    
                if (!isDataChanged) {
                    alert("No changes detected.");
                    setLoading(false);
                    return;
                }
            }
    
            // Proceed with update if data has changed
            await updateDoc(docRef, { ...resident });
    
            alert("Profile updated successfully!");
            router.push("/ResidentAccount/Profile");
        } catch (err) {
            setError("Failed to update resident");
            console.error(err);
        }
    
        setLoading(false);
    };

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
        }
    };
    
    return (
        <main className="main-container-resident-profile">
            <div className="first-section-resident-profile">
                <div className="account-profile-section">
                    <p className="Details">Profile</p>

                    <div className="icon-container-profile-section">

                        <img src={selectedImage || "/images/user.png"} alt="User Icon" className="user-icon-profile-section" />
                                
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

                    {/* Transactions Link */}
                    <div className="transactions-link">
                        <a href="/ResidentAccount/Transactions" className="transactions-text">
                            View Transactions
                        </a>
                    </div>

                </div>

                <div className="account-details-section">
                    <p className="Details">Account Details</p>

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

                            {/* MALCOLM HERE */}


                       <div className="form-group-profile-section">
                            <label htmlFor="current-password" className="form-label-profile-section">Current Password:</label>
                            <input 
                                id="current-password" 
                                name="current-password"
                                className="form-input-profile-section" 
                                required 
                                disabled 
                            />
                        </div>


                        <div className="form-group-profile-section">
                            <label htmlFor="new-password" className="form-label-profile-section">New Password:</label>
                            <input 
                                id="new-password" 
                                name="new-password"
                                className="form-input-profile-section" 
                                required 
                                disabled 
                            />
                        </div>

                        <div className="form-group-profile-section">
                            <label htmlFor="confirm-password" className="form-label-profile-section">Confirm Password:</label>
                            <input 
                                id="confirm-password" 
                                name="confirm-password"
                                className="form-input-profile-section" 
                                required 
                                disabled 
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
        </main>
    );
}
