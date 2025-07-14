"use client"

import { useRouter, useSearchParams} from "next/navigation";
import type { Metadata } from "next";
import { useState, useEffect} from "react";
import { Eye, EyeOff } from "lucide-react";
import { db, storage } from "../../../../db/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "@/CSS/User&Roles/ModifyBarangayAcc.css";
import Link from "next/link";
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
    middleName: string;
    lastName: string;
    phone: string;
    sex: string;
    department: string;
    updatedBy?: string;
    updatedAt?: string;
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
        middleName: "",
        lastName: "",
        phone: "",
        sex: "",
        department: ""
      });


    const handleBack = () => {
        router.push("/dashboard/admin/BarangayUsers");
    };

    const [originalData, setOriginalData] = useState({ ...formData });

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        if (password) {
            if (password.length < 6) {
                setPopupErrorMessage("Password should be at least 6 characters.");
                setShowErrorPopup(true);
                setShowSavePopup(false);
    
                setTimeout(() => setShowErrorPopup(false), 3000);
                return;
            }
    
            if (password !== confirmPassword) {
                setPopupErrorMessage("Confirm password must match New password.");
                setShowErrorPopup(true);
                setShowSavePopup(false);
    
                setTimeout(() => setShowErrorPopup(false), 3000);
                return;
            }
        }
    
        const contactPattern = /^091\d{8}$/;
        if (!contactPattern.test(formData.phone)) {
            setPopupErrorMessage("Invalid contact number. Format: 0917XXXXXXX");
            setShowErrorPopup(true);
            setShowSavePopup(false);
    
            setTimeout(() => setShowErrorPopup(false), 3000);
            return;
        }
    
        
        setShowSavePopup(false);
        setPopupMessage("Changes saved successfully!");
        setShowPopup(true);
    
        setTimeout(() => {
            setShowPopup(false);
            router.push(`/dashboard/admin/BarangayUsers?highlight=${userId}`);
        }, 3000);
    
        const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
        await handleSubmit(fakeEvent as unknown as React.FormEvent<HTMLFormElement>);
    };
    


    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userId || !formData) return;
      
        setLoading(true);
        try {
          const docRef = doc(db, "BarangayUsers", userId);
          let updatedData: Partial<BarangayUser> = { 
            ...formData,
            updatedBy: session?.user?.fullName || "Unknown",
            updatedAt: new Date().toISOString(),          // optional: track time
          };
      
          if (password) { 
            updatedData.password = await hash(password, 12);
          }
      
          await updateDoc(docRef, updatedData);
      
        } catch (err) {
          console.error(err);
          setError("Failed to update barangay user");
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
                        middleName: docSnap.data().middleName || "",
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

    const [activeSection, setActiveSection] = useState("account details");


    

    return (

        <main className="editbrgyacc-main-container">

            {/*
            <div className="path-section">
                <h1 className="breadcrumb">User and Roles<span className="chevron">/</span></h1>
                <h1 className="breadcrumb">
                    <Link href="/dashboard/admin/BarangayUsers">Barangay Users</Link>
                    <span className="chevron">/</span>
                </h1>
                <h2 className="breadcrumb">Edit Barangay User<span className="chevron"></span></h2>
            </div>
            <div className="editbrgyacc-page-title-section-1">
                <h1>Barangay Users</h1>
            </div>
              */}

            <div className="editbrgyuser-main-content">
                <div className="editbrgyuser-main-section1">
                    <div className="editbrgyuser-main-section1-left">
                        <button onClick={handleBack}>
                        <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>

                        <h1> Edit Barangay User </h1>
                    </div>

                    <div className="action-btn-section">
                        {isAuthorized ? (
                            <>
                            <button className="discard-btn" onClick={handleDiscardClick}>Discard</button>
                            <button className="save-btn" onClick={handleSaveClick} disabled={loading}>
                        
                            {loading ? "Saving..." : "Save"}
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
                
                <div className="add-resident-bottom-section">
                    <nav className="editbrgyuser-info-toggle-wrapper">
                    {["account details", "password details"].map((section) => (
                        <button
                        key={section}
                        type="button"
                        className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                        onClick={() => setActiveSection(section)}
                        >
                        {section === "account details" && "Account Details"}
                        {section === "password details" && "Password Details"}
                        </button>
                    ))}
                    </nav>

                    <div className="editbrgyuser-bottom-section-scroll">
                        {activeSection === "account details" && (
                            <>
                                <div className="editbrgyuser-section-2-full-top">
                                    <div className="editbrgyuser-section-2-left-side">
                                        <div className="fields-section">
                                            <p>User ID</p>
                                            <input
                                                type="number"
                                                className="editbrgyuser-input-field-disabled"
                                                placeholder="User ID"
                                                value={formData.userid}
                                                disabled
                                                name="userID"
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="fields-section">
                                            <p>Official First Name</p>
                                            <input
                                                type="text"
                                                className="editbrgyuser-input-field"
                                                placeholder="Official First Name"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="fields-section">
                                            <p>Official Middle Name</p>
                                            <input
                                                type="text"
                                                className="editbrgyuser-input-field"
                                                placeholder="Official First Name"
                                                name="middleName"
                                                value={formData.middleName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="fields-section">
                                            <p>Birthday</p>
                                            <input
                                                type="date"
                                                className="editbrgyuser-input-field"
                                                placeholder="Birthday"
                                                name="birthDate"
                                                value={formData.birthDate}
                                                onChange={handleChange}
                                                max={new Date().toISOString().split("T")[0]}
                                            />
                                        </div>

                                        <div className="fields-section">
                                            <p>Position</p>

                                            <select
                                                name="position"
                                                className="editbrgyuser-input-field"
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
                                    </div>

                                    <div className="editbrgyuser-section-2-left-side">
                                        <div className="fields-section">
                                            <p>Official Last Name</p>
                                            <input
                                                type="text"
                                                className="editbrgyuser-input-field"
                                                placeholder="Official Last Name"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="editbrgyacc-fields-container">
                                            <div className="fields-section">
                                                <p>Address</p>
                                                <input
                                                    type="text"
                                                    className="editbrgyuser-input-field"
                                                    placeholder="Address"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="fields-section">
                                            <p>Sex</p>
                                            <select
                                                name="gender"
                                                className="editbrgyuser-input-field"
                                                required
                                                value={formData.sex}
                                                onChange={handleChange}
                                            >
                                                <option value="" disabled>Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div> 

                                        <div className="fields-section">
                                            <p>Contact Number</p>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                className="editbrgyuser-input-field"
                                                placeholder="Enter Contact Number"
                                                maxLength={11}
                                                pattern="^[0-9]{11}$" 
                                                title="Please enter a valid 11-digit contact number. Format: 0917XXXXXXX "
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const input = e.target.value;
                                                    // Only allow digits and limit to 11 characters
                                                    if (/^\d{0,11}$/.test(input)) {
                                                    handleChange(e);
                                                    }
                                                }}
                                            />
                                        </div>  

                                        {formData.position === "LF Staff" && (
                                            <div className="fields-section">
                                                <p>Department:</p>

                                                <select 
                                                    name="department" 
                                                    value={formData.department} 
                                                    onChange={handleChange}
                                                    className="editbrgyuser-input-field"
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

                                    </div>
                                </div>
                            </>
                        )}

                        {activeSection === "password details" && (
                            <>
                                <div className="editbrgyuser-section-2-full-top">
                                    <div className="editbrgyuser-section-2-left-side">
                                        <div className="password-input-wrapper">
                                            <p>New Password</p>
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="editbrgyuser-input-field-pass"
                                                onChange={handleChange}
                                                name="password"
                                            />
                                            <button
                                                type="button"
                                                className="editbrgyuser-toggle-password-btn"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="editbrgyuser-section-2-left-side">
                                        <div className="password-input-wrapper">
                                            <p>Confirm Password</p>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="editbrgyuser-input-field-pass"
                                                onChange={handleChange}
                                                name="confirmPassword"
                                            />
                                            <button
                                                type="button"
                                                className="editbrgyuser-toggle-password-btn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div> 
                                    </div>
                                </div>
                            </>
                        )}          
                    </div>       

                </div>       

            </div>


            {showDiscardPopup && (
                        <div className="confirmation-popup-overlay-add">
                            <div className="confirmation-popup-add">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                                <p>Are you sure you want to discard the changes?</p>
                                <div className="yesno-container-add">
                                    <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
                                    <button onClick={confirmDiscard} className="yes-button-add">Yes</button> 
                                </div> 
                            </div>
                        </div>
                    )}

          {showSavePopup && (
                        <div className="confirmation-popup-overlay">
                            <div className="confirmation-popup">
                                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
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
                        <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
                        <p>{popupMessage}</p>
                    </div>
                </div>
                )}

            {showErrorPopup && (
                <div className={`error-popup-overlay show`}>
                    <div className="popup">
                        <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}

        </main>
    );
}