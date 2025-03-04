"use client";

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import { useSession } from "next-auth/react";
import "@/CSS/ResidentAccount/profile.css";

const metadata: Metadata = { 
    title: "Settings Page for Resident Side",
    description: "Settings Page for Barangay Side",
};

export default function SettingsPageResident() {
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
        <main className="main-container">

            <div className="account-profile-section">

            <p className="Details"> Profile </p>

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
                                Update Profile Image
                            </button>
                    </div>

                    <div className="name-section">
                        <p className="name"> Malcolm </p>
                        <p className="name"> Payao </p>
                    </div>


            </div>

            <div className="account-details-section">

                <p className="Details"> Account Details</p>

                  <div className= "edit-section">
                    
                    <div className="form-group">
                        <label htmlFor="sex" className="form-label">Sex:</label>
                        <select  id="sex" name="sex"  className="form-input" required>
                        <option value="" disabled>Select a Sex</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        </select>
                     </div>

                     <div className="form-group">
                        <label htmlFor="first_name" className="form-label">First Name: </label>
                        <input  id="first_name" 
                        type="text" name="first_name" 
                        className="form-input"
                        placeholder= "Enter Name"
                        required />

                        </div>

                        <div className="form-group">
                    <label htmlFor="last_name" className="form-label" >Last Name: </label>  
                    

                        <input  id="last_name" 
                        type="text" name="last_name" 
                        className="form-input" 
                        placeholder="Enter Last Name"
                        required/>

                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label" >Email: </label>
                        <input  id="email" 
                        type="email" name="email" 
                        className="form-input" 
                        placeholder="Enter Email"
                        required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone" className="form-label" >Phone: </label>
                        <input   id="phone" 
                        type="tel" name="phone"
                        className="form-input" 
                        placeholder="Enter Phone Number"
                        required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address" className="form-label">Address: </label>
                        <input  id="address" 
                        type="text" name="address" 
                        className="form-input" 
                        placeholder="Enter Address"
                        required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password: </label>
                        <input  id="password"
                        type="password" name="password" 
                        className="form-input"
                        placeholder="Enter Password"
                        required/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm_password" className="form-label">Confirm Password: </label>
                        <input id="confirm_password" type="password"
                        name="confirm_password"
                        className="form-input"
                        placeholder="Confirm Password"
                        />
                    </div>

                




                    <button 
                                className="upload-btn" 
                            >
                                Update Profile
                    </button>


                  </div>
         
            </div>


        </main>
    );
}
