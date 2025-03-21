"use client"

import { useRouter, useSearchParams} from "next/navigation";
import type { Metadata } from "next";
import { useState, useEffect} from "react";
import { Eye, EyeOff } from "lucide-react";
import { db, storage } from "../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "@/CSS/User&Roles/ModifyBarangayAcc.css";
import { form } from "framer-motion/m";
import { hash } from 'bcryptjs'; 
import { useSession } from "next-auth/react";


const metadata:Metadata = { 
    title: "Modify Barangay Accounts",
    description: "Modify Barangay Accounts Barangay Side",
};

interface BarangayUser {
    userid: number;
    role: string;
    position: string;
    password: string;
    createdBy: string;
    createdAt: string;
    address: string;
    birthDate: string;
    firstName: string;
    lastName: string;
    phone: string;
    sex: string;
    department: string;
  }

export default function EditBarangayAccount() {
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const userPosition = session?.user?.position;
    const isAuthorized = ["Assistant Secretary"].includes(userPosition || "");
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get("id");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    


    const [formData, setFormData] = useState({
        userid: 0,
        role: "",
        position: "",
        password: "",
        createdBy: "",
        createdAt: "",
        address: "",
        birthDate: "",
        firstName: "",
        lastName: "",
        phone: "",
        sex: "",
        department: ""
      });


    const handleBack = () => {
        router.push("/dashboard/admin");
    };

    const [originalData, setOriginalData] = useState({ ...formData });

    const [showPassword, setShowPassword] = useState(false);
    const [showDiscardPopup, setShowDiscardPopup] = useState(false);
    const [showSavePopup, setShowSavePopup] = useState(false); 
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");


    const handleDiscardClick = async () => {
        setShowDiscardPopup(true);
    }

    const confirmDiscard = async () => {
        setShowDiscardPopup(false);

    
        setFormData(originalData); // Reset to original data

        setPopupMessage("Changes discarded successfully!");
        setShowPopup(true);

        // Hide the popup after 3 seconds
        setTimeout(() => {
            setShowPopup(false);
        }, 3000);
    };

    const handleSaveClick = async () => {
        setShowSavePopup(true);
    }

    const confirmSave = async () => {

        if (password !== confirmPassword) {
            setPopupErrorMessage("Confirm password must match New password.");
            setShowErrorPopup(true);

            setShowSavePopup(false);

            // Hide the popup after 3 seconds
            setTimeout(() => {
                setShowErrorPopup(false);
            }, 3000);


            return;  // Stop execution here if passwords do not match
        }if (password === confirmPassword){
            setShowSavePopup(false);
            setPopupMessage("Changes saved successfully!");
            setShowPopup(true);
    
            // Hide the popup after 3 seconds
            setTimeout(() => {
                setShowPopup(false);
                router.push("/dashboard/admin");
            }, 3000);
    
             // Create a fake event and call handleSubmit
            const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
            await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
        }

        
    };


    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userId || !formData) return;
    
        setLoading(true);
        try {
          const docRef = doc(db, "BarangayUsers", userId);
          let updatedData: Partial<BarangayUser> = { ...formData };

          if (password) { // ✅ Only hash if user provided a new password
            updatedData.password = await hash(password, 12);
        }
            await updateDoc(docRef, updatedData);

        } catch (err) {
          console.error(err);
          setError("Failed to update job seeker");
        }
        setLoading(false);
    };


    const [showRecordDetails, setShowRecordDetails] = useState(false); 
    const [showPasswordDetails, setShowPasswordDetails] = useState(false);
    
    const handleToggleClickRecordDetails = () => {
        setShowRecordDetails(prevState => !prevState);
    };
    
    const handleToggleClickPasswordDetails = () => {
        setShowPasswordDetails(prevState => !prevState);
    };


    useEffect(() => {

        console.log("User ID from search params:", userId);
        if (userId) {
            const fetchUserData = async () => {
                const docRef = doc(db, "BarangayUsers", userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = {
                        userid: docSnap.data().userid || 0,
                        role: docSnap.data().role || "",
                        position: docSnap.data().position || "",
                        password: docSnap.data().password || "",
                        createdBy: docSnap.data().createdBy || "",
                        createdAt: docSnap.data().createdAt || "",
                        address: docSnap.data().address || "",
                        birthDate: docSnap.data().birthDate || "",
                        firstName: docSnap.data().firstName || "",
                        lastName: docSnap.data().lastName || "",
                        phone: docSnap.data().phone || "",
                        sex: docSnap.data().sex || "",
                        department: docSnap.data().department || "",
                    };

                    setFormData(data);
                    setOriginalData(data); // Store original data
                }
            };

            fetchUserData();
        }
        
    }, [userId]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === "password") {
            setPassword(value);
            setFormData((prevData) => ({ ...prevData, password: value })); // ✅ Update formData.password
        } else if (name === "confirmPassword") {
            setConfirmPassword(value);
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    

    return (

        <main className="editbrgyacc-main-container">
            <div className="editbrgyacc-page-title-section-1">
                <h1>Admin Module</h1>
            </div>

            <div className="editbrgyacc-main-content">
                <div className="editbrgyacc-main-section1">
                    <div className="editbrgyacc-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
                        </button>

                        <h1>Edit Barangay Account</h1>
                    </div>

                    <div className="action-btn-section">
                        {isAuthorized ? (
                            <>
                            <button 
                                className="discard-btn" 
                                onClick={() => handleDiscardClick}
                            >
                                Discard
                            </button>
                            <button 
                                className="save-btn" 
                                onClick={() => handleSaveClick}
                            >
                                Save
                            </button>
                            </>
                        ) : (
                            <>
                            <button className="residentmodule-action-edit opacity-0 cursor-not-allowed" disabled>
                                Edit
                            </button>
                            <button className="residentmodule-action-delete opacity-0 cursor-not-allowed" disabled>
                                Delete
                            </button>
                            </>
                        )}
                    </div>
                </div>

                <hr/>

                <div className="editbrgyacc-main-fields-container">

                    <div className="account-details-section">

                        <h1>Account Details</h1>
                        <hr/>

                        <div className="editbrgyacc-main-fields-container-section1">
                            <div className="editbrgyacc-section-left">
                                <div className="editbrgyacc-fields-container">
                                    <div className="editbrgyacc-fields-section">
                                        <p>User ID</p>
                                        <input
                                            type="number"
                                            className="editbrgyacc-input-field"
                                            placeholder="User ID"
                                            value={formData.userid}
                                            disabled
                                            name="userID"
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="editbrgyacc-fields-section">
                                        <p>Official First Name</p>
                                        <input
                                            type="text"
                                            className="editbrgyacc-input-field"
                                            placeholder="Official First Name"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="editbrgyacc-fields-section">
                                        <p>Official Last Name</p>
                                        <input
                                            type="text"
                                            className="editbrgyacc-input-field"
                                            placeholder="Official Last Name"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="editbrgyacc-fields-section">
                                        <p>Contact Number</p>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className="editbrgyacc-input-field"
                                            placeholder="Enter Contact Number"
                                            maxLength={10}
                                            pattern="^[0-9]{10}$"
                                            title="Please enter a valid 10-digit contact number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>  
                                </div>
                            </div>
                            <div className="editbrgyacc-section-right">
                                <div className="editbrgyacc-fields-container">

                                    <div className="editbrgyacc-fields-section">
                                        <p>Position</p>

                                        <select
                                            name="position"
                                            className="editbrgyacc-input-field"
                                            required
                                            value={formData.position}
                                            onChange={handleChange}
                                        >
                                            
                                            <option value="" disabled>Select a Position</option>
                                            <option value="Punong Barangay">Punong Barangay</option>
                                            <option value="Secretary">Secretary</option>
                                            <option value="Assistant Secretary">Asst Secretary</option>
                                            <option value="Admin Staff">Admin Staff</option>
                                            <option value="LF Staff">LF Staff</option>
                                        </select>
                                    </div>

                                    

                                    {formData.position === "LF Staff" && (
                                        <div className="editbrgyacc-fields-section">
                                            <p>Department:</p>

                                            <select 
                                                name="department" 
                                                value={formData.department} 
                                                onChange={handleChange}
                                                className="editbrgyacc-input-field"
                                                required
                                            >
                                                <option value="">Select a Department</option>
                                                <option value="GAD">GAD</option>
                                                <option value="Lupon">Lupon</option>
                                                <option value="VAWC">VAWC</option>
                                                <option value="BCPC">BCPC</option>
                                            </select>
                                        </div>
                                    )}
                                    
                                    <div className="editbrgyacc-fields-section">
                                        <p>Birthday</p>
                                        <input
                                            type="date"
                                            className="editbrgyacc-input-field"
                                            placeholder="Birthday"
                                            name="birthDate"
                                            value={formData.birthDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="editbrgyacc-fields-section">
                                        <p>Sex</p>
                                        <select
                                            name="gender"
                                            className="editbrgyacc-input-field"
                                            required
                                            value={formData.sex}
                                            onChange={handleChange}
                                        >
                                            <option value="" disabled>Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div> 
                            
                                </div>
                            </div>
                        </div>

                        <div className="editbrgyacc-main-fields-container-section2">
                            <div className="editbrgyacc-fields-container">
                                <div className="editbrgyacc-fields-section">
                                    <p>Address</p>
                                    <input
                                        type="text"
                                        className="editbrgyacc-input-field"
                                        placeholder="Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>
                        </div>

                    </div>
                    


                    <div className="record-details-section">

                        <div className="record-details">
                            <div className="record-details-topsection">
                                <button type="button" 
                                        className={showRecordDetails ? "record-details-minus-button" : "record-details-plus-button"} 
                                        onClick={handleToggleClickRecordDetails}>
                                </button>
                                <h1>Record Details</h1>
                            </div>

                            <hr/>

                            {showRecordDetails && (
                            <>
                                <div className="editbrgyacc-main-fields-container-section1">
                                    <div className="editbrgyacc-section-left">
                                        <div className="editbrgyacc-fields-container">
                                            <div className="editbrgyacc-fields-section">
                                                <p>Created By</p>
                                                <input
                                                    type="text"
                                                    className="editbrgyacc-input-field"
                                                    placeholder="Created By"
                                                    value={formData.createdBy}
                                                    disabled
                                                    name="createdBy"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="editbrgyacc-section-right">
                                        <div className="editbrgyacc-fields-container">
                                            <div className="editbrgyacc-fields-section">
                                                <p>Created At</p>
                                                <input
                                                    type="number"
                                                    className="editbrgyacc-input-field"
                                                    placeholder="Created At"
                                                    value={formData.createdAt}
                                                    disabled
                                                    name="createdAt"
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>

                            )}
                        </div>
                    </div>

                    <div className="password-details-section">

                        <div className="password-details">

                            <div className="password-details-topsection">
                                <button type="button" 
                                        className={showPasswordDetails ? "record-details-minus-button" : "record-details-plus-button"} 
                                        onClick={handleToggleClickPasswordDetails} 
                                        >
                                        
                                </button>

                                <h1>Password Details</h1>
                            </div>

                            <hr/>


                            {showPasswordDetails && (
                                <>
                                    <div className="editbrgyacc-main-fields-container-section2">
                                            <div className="editbrgyacc-fields-container">
                                                <div className="editbrgyacc-fields-section">
                                                    <p>New Password</p>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            className="editbrgyacc-input-field"
                                                            onChange={handleChange}
                                                            name="password"
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

                                                <div className="editbrgyacc-fields-section">
                                                    <p>Confirm Password</p>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            className="editbrgyacc-input-field"
                                                            onChange={handleChange}
                                                            name="confirmPassword"
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

                                </>

                            )}
                        </div>
                    </div>
                </div>

            </div>


            {showDiscardPopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to discard the changes?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button">No</button>
                                    <button onClick={confirmDiscard} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

          {showSavePopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <p>Are you sure you want to save the changes?</p>
                                <div className="yesno-container">
                                    <button onClick={() => setShowSavePopup(false)} className="no-button">No</button> 
                                    <button onClick={confirmSave} className="yes-button">Yes</button> 
                                </div> 
                            </div>
                        </div>
            )}
                    

          {showPopup && (
                <div className={`popup-overlay show`}>
                    <div className="popup">
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}

{showErrorPopup && (
                <div className={`error-popup-overlay show`}>
                    <div className="popup">
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}

        </main>
    );
}