"use client";
import { db } from '@/app/db/firebase';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hash } from 'bcryptjs'; 
import "@/CSS/BarangayACForm/accSetupForm.css";

interface AccSetupFormProps {
    userID: string | undefined;
}

interface AccountSetupProps {
    fName: string;
    lName: string;
    bday: string;
    address: string;
    phone: string;
    sex: string;
    department?: string; // Only required if LF Staff
    password: string;
    confirmPassword: string;
}

const AccSetupForm: React.FC<AccSetupFormProps> = ({ userID }) => {
    const router = useRouter();
    const { data: session, update } = useSession();

    const [user, setUser] = useState<AccountSetupProps>({
        fName: '',
        lName: '',
        bday: '',
        address: '',
        phone: '',
        sex: '',
        department: '',
        password: '',
        confirmPassword: '',
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

        if (user.password !== user.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        try {
            const docRef = doc(db, 'BarangayUsers', userID);
            const hashedPassword = await hash(user.password, 12);

            await updateDoc(docRef, {
                firstName: user.fName,
                lastName: user.lName,
                birthDate: user.bday,
                address: user.address,
                phone: user.phone,
                sex: user.sex,
                department: position === "LF Staff" ? user.department : "", // Only save department if LF Staff
                password: hashedPassword,
                firstTimelogin: false,
               
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
                        <label htmlFor="fName">First Name: 
                            <span className="required">*</span></label>
                        <input onChange={handleChange} value={user.fName} id="fName" type="text" name="fName" required />

                        <label htmlFor="lName">Last Name:<span className="required">*</span></label>
                        <input onChange={handleChange} value={user.lName} id="lName" type="text" name="lName" required />
                         <label htmlFor="sex">Sex:<span className="required">*</span></label>
                        <select value={user.sex} onChange={handleChange} id="sex" name="sex" required>
                            <option value="" disabled>Select a Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>

                        <label htmlFor="bday">Birth date:<span className="required">*</span></label>
                        <input onChange={handleChange} value={user.bday} id="bday" type="date" name="bday" required />

                        <label htmlFor="address">Address:<span className="required">*</span></label>
                        <input onChange={handleChange} value={user.address} id="address" type="text" name="address" required />

                        <label htmlFor="phone">Cellphone / Telephone #:<span className="required">*</span></label>
                        <input onChange={handleChange} value={user.phone} id="phone" type="text" name="phone" required />

                        {/* Display position but don't allow editing */}
                        <label htmlFor="position">Position:</label>
                        <input id="position" type="text" value={position} readOnly disabled />

                        {/* Conditionally show department dropdown if position is LF Staff */}
                        {position === "LF Staff" && (
                            <>
                                <label htmlFor="department">Department: <span className="required">*</span></label>
                                <select value={user.department} onChange={handleChange} id="department" name="department" required>
                                    <option value="" disabled>Select a Department</option>
                                    <option value="GAD">GAD</option>
                                    <option value="BCPC">BCPC</option>
                                    <option value="Lupon">LUPON</option>
                                    <option value="VAWC">VAWC</option>
                                </select>
                            </>
                        )}

                        <label htmlFor="password">New Password:<span className="required">*</span></label>
                        <input onChange={handleChange} value={user.password} id="password" type="password" name="password" required />

                        <label htmlFor="confirmPassword">Confirm Password:<span className="required">*</span></label>
                        <input onChange={handleChange} value={user.confirmPassword} id="confirmPassword" type="password" name="confirmPassword" required />

                        {error && <p className="error-message">{error}</p>}

                    <div className="form-group button-container">
                        <button type="submit" className="submit-button" >Submit</button>
                    </div>

                    </form>
                </div>
            </div>
        </main>
    );
};

export default AccSetupForm;
