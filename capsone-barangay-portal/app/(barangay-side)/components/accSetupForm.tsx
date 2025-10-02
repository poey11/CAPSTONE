"use client";
import { db } from '@/app/db/firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hash } from 'bcryptjs'; 
import { Eye, EyeOff } from "lucide-react";
import "@/CSS/BarangayACForm/accSetupForm.css";

interface AccSetupFormProps {
    userID: string | undefined;
}

interface AccountSetupProps {
    fName: string;
    mName: string;
    lName: string;
    bday: string;
    address: string;
    phone: string;
    sex: string;
    department?: string; // Only required if LF Staff
    password: string;
    confirmPassword: string;
    facebookLink?: string;
    email?: string;
}

const AccSetupForm: React.FC<AccSetupFormProps> = ({ userID }) => {
    const router = useRouter();
    const { data: session, update } = useSession();
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const today = new Date().toISOString().split("T")[0]; 
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupErrorMessage, setPopupErrorMessage] = useState("");

    const [user, setUser] = useState<AccountSetupProps>({
        fName: '',
        mName: '',
        lName: '',
        bday: '',
        address: '',
        phone: '',
        sex: '',
        department: '',
        password: '',
        confirmPassword: '',
        facebookLink: '',
        email: ''

    });

    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<string | null>(null); // Store the assigned position

    // Fetch the assigned position from Firestore
    useEffect(() => {
        const fetchUserPosition = async () => {
            if (!userID) return;
            const userDoc = await getDoc(doc(db, "BarangayUsers", userID));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setPosition(userData.position); // Assign the position from Firestore
            }
        };

        fetchUserPosition();
    }, [userID]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prevUser => ({
            ...prevUser,
            [name]: value
        }));

        // Reset department if position is not LF Staff
        if (name === "department" && position !== "LF Staff") {
            setUser(prevUser => ({
                ...prevUser,
                department: ""
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userID) {
            console.log("User ID is undefined");
            return;
        }

        if (user.password) {
            if (user.password.length < 6) {
                setPopupErrorMessage("Password should be at least 6 characters.");
                setShowErrorPopup(true);
                setTimeout(() => { setShowErrorPopup(false); }, 3000);
                return;
            }
    
            if (user.password !== user.confirmPassword) {
                setPopupErrorMessage("Confirm password must match New password.");
                setShowErrorPopup(true);
                setTimeout(() => { setShowErrorPopup(false); }, 3000);
                return;
            }
        }

        // Validate contact number: should be 11 digits and start with "09"
        if (!/^09\d{9}$/.test(user.phone)) {
            setPopupErrorMessage( "Invalid contact number. Format: 0917XXXXXXX");
            setShowErrorPopup(true);
            setTimeout(() => { setShowErrorPopup(false); }, 3000);
            return;
        }

        try {
            const docRef = doc(db, 'BarangayUsers', userID);
            const hashedPassword = await hash(user.password, 12);

            await updateDoc(docRef, {
                firstName: user.fName,
                middleName: user.mName,
                lastName: user.lName,
                birthDate: user.bday,
                address: user.address,
                phone: user.phone,
                sex: user.sex,
                department: position === "LF Staff" ? user.department : "", // Only save department if LF Staff
                password: hashedPassword,
                firstTimelogin: false,
                facebookLink: user.facebookLink,
                email: user.email
               
            });

            await update();
            router.push('/dashboard');
        } catch (e: any) {
            console.log(e.message);
        }
    };

    if (position === null) return <p>Loading...</p>; // Prevent form rendering until position is fetched

    return (
        <main className="accSetup-main-container">
            <div className="accSetup-main-content">
                <div className="accSetup-title-section">
                    <h1>ACCOUNT SET UP</h1>
                </div>

                <div className="accSetup-main-form">
                    <form onSubmit={handleSubmit} className="accSetup-form">

                        <div className="form-group-accsetup-form">
                            <label htmlFor="fName">First Name:<span className="required">*</span></label>
                            <input onChange={handleChange} value={user.fName} id="fName" type="text" name="fName" placeholder="Enter First Name" className="form-input-accsetup-form" required />
                        </div>

                        <div className="form-group-accsetup-form">
                            <label htmlFor="mName">Middle Name:</label>
                            <input onChange={handleChange} value={user.mName} id="mName" type="text" name="mName" placeholder="Enter Middle Name" className="form-input-accsetup-form" />
                        </div>   
                        
                        <div className="form-group-accsetup-form">
                            <label htmlFor="lName">Last Name:<span className="required">*</span></label>
                            <input onChange={handleChange} value={user.lName} id="lName" type="text" name="lName" placeholder="Enter Last Name" className="form-input-accsetup-form" required />
                        </div>

                        <div className="form-group-accsetup-form">
                            <label htmlFor="lName">Email:<span className="required">*</span></label>
                            <input onChange={handleChange} value={user.email} id="email" type="text" name="email" placeholder="Enter Email" className="form-input-accsetup-form" required />
                        </div>     
                         
                        

                        <div className="form-group-accsetup-form">
                            <label htmlFor="lName">Facebook:<span className="required">*</span></label>
                            <input onChange={handleChange} value={user.facebookLink} id="facebookLink" type="text" name="facebookLink" placeholder="Enter Facebook Link" className="form-input-accsetup-form" required />
                        </div>     
                         
                        
                        <div className="form-group-accsetup-form">
                            <label htmlFor="sex">Gender:<span className="required">*</span></label>
                            <select value={user.sex} onChange={handleChange} id="sex" name="sex" className="form-input-accsetup-form" required>
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        
                        <div className="form-group-accsetup-form">
                            <label htmlFor="bday">Birthday:<span className="required">*</span></label>
                            <input onChange={handleChange} value={user.bday} id="bday" type="date" name="bday" max={today} className="form-input-accsetup-form" required />
                        </div>
                            
                        <div className="form-group-accsetup-form">
                            <label htmlFor="address">Address:<span className="required">*</span></label>
                            <input onChange={handleChange} value={user.address} id="address" type="text" name="address" placeholder="Enter Address" className="form-input-accsetup-form" required />
                        </div>     
                        
                        <div className="form-group-accsetup-form">
                            <label htmlFor="phone">Phone Number:<span className="required">*</span></label>
                            <input value={user.phone} id="phone" type="text" name="phone" placeholder="Enter Phone Number" className="form-input-accsetup-form" required 
                                onChange={(e) => {
                                    const input = e.target.value;
                                    // Only allow digits and limit to 11 characters
                                    if (/^\d{0,11}$/.test(input)) {
                                    handleChange(e);
                                    }
                                }}
                            />
                        </div>
                            
                        {/* Display position but don't allow editing */}
                        <div className="form-group-accsetup-form">
                            <label htmlFor="position">Position:</label>
                            <input id="position" type="text" value={position} className="form-input-accsetup-form" readOnly disabled />
                        </div>  

                        {/* Conditionally show department dropdown if position is LF Staff */}
                        <div className="form-group-accsetup-form">
                            {position === "LF Staff" && (
                                    <>
                                        <label htmlFor="department">Department:<span className="required">*</span></label>
                                        <select value={user.department} onChange={handleChange} id="department" name="department" className="form-input-accsetup-form" required>
                                            <option value="" disabled>Select a Department</option>
                                            <option value="GAD">GAD</option>
                                            <option value="BCPC">BCPC</option>
                                            <option value="Lupon">LUPON</option>
                                            <option value="VAWC">VAWC</option>
                                        </select>
                                    </>
                                )}
                        </div>
                            
                        <div className="form-group-accsetup-form">
                            <label htmlFor="password">New Password:<span className="required">*</span></label>
                            <div className="relative">
                                <input onChange={handleChange} value={user.password} id="password" type={showNewPassword ? "text" : "password"} name="password" className="form-input-accsetup-form" required />
                                <button
                                                            type="button"
                                                            className="toggle-password-btn"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                        </button>
                            </div>
                            
                        </div>
                            
                        <div className="form-group-accsetup-form">
                            <label htmlFor="confirmPassword">Confirm Password:<span className="required">*</span></label>
                            <div className="relative">
                                <input onChange={handleChange} value={user.confirmPassword} id="confirmPassword" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" className="form-input-accsetup-form" required />
                                <button
                                                            type="button"
                                                            className="toggle-password-btn"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>      
                        </div>
                        

                        <div className="form-group button-container">
                            <button type="submit" className="submit-button" >Submit</button>
                        </div>

                    </form>
                </div>
            </div>
            

        {showErrorPopup && (
                <div className={`accsetup-error-popup-overlay show`}>
                    <div className="accsetup-popup">
                    <img src={ "/Images/warning-1.png"} alt="popup icon" className="icon-alert"/>
                        <p>{popupErrorMessage}</p>
                    </div>
                </div>
                )}
        </main>
    );
};

export default AccSetupForm;
