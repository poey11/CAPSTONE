"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "@/CSS/barangaySide/ServicesModule/BarangayDocs/BarangayCertificate.css";
import "@/CSS/User&Roles/ModifyBarangayAcc.css";

const metadata:Metadata = { 
    title: "Modify Barangay Accounts",
    description: "Modify Barangay Accounts Barangay Side",
};

export default function EditBarangayAccount() {
    const router = useRouter();
    const handleBack = () => {
        router.push("/dashboard/admin");
    };

    const [showPassword, setShowPassword] = useState(false);

    return (

        <main className="editbrgyacc-main-container">
            <div className="section-1">
                <h1>Admin Module</h1>
            </div>

            <div className="editbrgyacc-main-section">
                <div className="editbrgyacc-main-section1">
                    <div className="addAnnouncement-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>

                        <h1>Edit Barangay Account</h1>
                    </div>

                    <div className="action-btn-section">
                        <button className="discard-btn">Discard</button>
                        <button className="save-btn">Save</button>
                    </div>
                </div>

                <hr/>

                <div className="main-fields-container">

                    <div className="account-details-section">

                        <h1>Account Details</h1>
                        <hr/>
                        <div className="main-fields-container-section1">
                            <div className="section-left">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>User ID</p>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="User ID"
                                            defaultValue="2025483"
                                            disabled
                                        />
                                    </div>
                                </div>  
                            </div>
                            <div className="section-right">

                            </div>
                            
                        </div>

                        <div className="main-fields-container-section1">
                            <div className="section-left">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Position</p>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Position"
                                            defaultValue="Secretary"
                                        />
                                    </div>
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
                                        />
                                    </div>
                                    
                                </div>
                            </div>
                            <div className="section-right">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Birthday</p>
                                        <input
                                            type="date"
                                            className="input-field"
                                            placeholder="Birthday"
                                            defaultValue="2002-09-15"
                                        />
                                    </div>
                                    <div className="fields-section">
                                        <p>Sex</p>
                                        <select
                                            name="gender"
                                            className="input-field"
                                            required
                                            defaultValue="Male"
                                        >
                                            <option value="" disabled>Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>  
                                </div>
                            </div>
                        </div>

                        <div className="main-fields-container-section2">
                            <div className="fields-container">
                                <div className="fields-section">
                                    <p>Official Name</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Official Name"
                                        defaultValue="Malcolm Payao"
                                    />
                                </div>
                                <div className="fields-section">
                                    <p>Address</p>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Address"
                                        defaultValue="1724 Taft Avenue Pasay City"
                                    />
                                </div>

                            </div>
                        </div>

                    </div>
                    


                    <div className="record-details-section">
                        <h1>Record Details</h1>
                        <hr/>

                        <div className="main-fields-container-section1">
                            <div className="section-left">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Created By</p>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Created By"
                                            defaultValue="Assistant Secretary"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="section-right">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Created At</p>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Created At"
                                            defaultValue="2025483"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="password-details-section">
                        <h1>Password Details</h1>
                        <hr/>

                        <div className="section-left">
                                <div className="fields-container">
                                    <div className="fields-section">
                                        <p>Current Password</p>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="input-field"
                                                defaultValue="password"
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                        </div>
                    </div>
                </div>

            </div>

        </main>
    );
}