"use client";

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import { useSession } from "next-auth/react";
import "@/CSS/SettingsPage/settingsPage.css";

const metadata: Metadata = { 
    title: "Settings Page for Barangay Side",
    description: "Settings Page for Barangay Side",
};

export default function SettingsPage() {
    const router = useRouter();
    const { data: session } = useSession();

    // name lang yung nareretrieve and display. not sure pano yung sa ibang fields
    const currentUser = {
        name: session?.user?.fullName || "User",
    };

    const handleBack = () => {
        router.push("/dashboard");
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
                        <button className="discard-btn">Discard</button>
                        <button className="save-btn">Save</button>
                    </div>
                </div>

                <hr/>

                <div className="main-fields-container">
                    <div className="account-details-section">
                        <div className="icon-container">
                            <img src={selectedImage || "/images/user.png"} alt="User Icon" className="user-icon" />
                            
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
                                Upload Image
                            </button>
                        </div>

                        <div className="main-fields-container-section2">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Official Name</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Official Name"
                                        defaultValue={currentUser.name}
                                    />
                                </div>
                                <div className="fields-section">
                                    <p>Address</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Address"
                                        defaultValue="1724 Taft Avenue Pasay City"
                                        //defaultValue={currentUser.address}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="main-fields-container-section1">
                            <div className="section-left">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Birthday</p>
                                        <input
                                            type="date"
                                            className="input-field"
                                            placeholder="Birthday"
                                            defaultValue="2002-09-15"
                                            //defaultValue={currentUser.birthday}
                                        />
                                    </div>
                                    <div className="fields-section">
                                        <p>Sex</p>
                                        <select
                                            name="gender"
                                            className="input-field"
                                            required
                                            defaultValue="Male"
                                            //defaultValue={currentUser.gender}
                                        >
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
                                        type="tel"
                                        id="contactnumber"
                                        name="contactnumber"
                                        className="input-field"
                                        required
                                        placeholder="Enter Contact Number"
                                        maxLength={10}
                                        pattern="^[0-9]{10}$"
                                        title="Please enter a valid 10-digit contact number"
                                        defaultValue="09088952877"
                                        //defaultValue={currentUser.contactNumber}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
