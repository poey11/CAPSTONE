"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase"; 
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import "@/CSS/ResidentAccount/profile.css";

export default function SettingsPageResident() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const residentId = searchParams.get("id");
    const auth = getAuth();

    const [resident, setResident] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        sex: "",
        status: "",
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
                }
            };
            fetchResidentData();
        }
    }, [residentId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setResident((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const user = auth.currentUser;
        if (user && resident.email) {
            try {
                const credential = EmailAuthProvider.credential(resident.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                alert("Password updated successfully!");
            } catch (error) {
                setError("Failed to update password. Check your current password.");
                console.error(error);
            }
        }
    };

    return (
        <main className="main-container-resident-profile">
            <div className="first-section-resident-profile">
                <div className="account-profile-section">
                    <p className="Details">Profile</p>
                    <div className="name-section">
                        <p className="name">{resident.first_name || "N/A"}</p>
                        <p className="name">{resident.last_name || "N/A"}</p>
                    </div>
                </div>

                <div className="account-details-section">
                    <p className="Details">Account Details</p>
                    <form onSubmit={handlePasswordChange}>
                        {error && <p className="error-text">{error}</p>}
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
                            <label htmlFor="currentPassword" className="form-label-profile-section">Current Password:</label>
                            <input 
                                id="current-password" 
                                type="password"
                                name="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="form-input-profile-section" 
                                required 
                            />
                        </div>
                        <div className="form-group-profile-section">
                            <label htmlFor="newPassword" className="form-label-profile-section">New Password:</label>
                            <input 
                                id="new-password" 
                                type="password"
                                name="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="form-input-profile-section" 
                                required 
                            />
                        </div>
                        <div className="form-group-profile-section">
                            <label htmlFor="confirmPassword" className="form-label-profile-section">Confirm Password:</label>
                            <input 
                                id="confirm-password" 
                                type="password"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="form-input-profile-section" 
                                required 
                            />
                        </div>
                        <button type="submit" className="submit-btn-profile-section" disabled={loading}>
                            {loading ? "Updating..." : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
