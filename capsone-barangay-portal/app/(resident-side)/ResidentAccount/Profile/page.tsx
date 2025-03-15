"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase"; 
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
   

    useEffect(() => {

            if (residentId){
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
    
    return (
        <main className="main-container">
            <div className="first-section">
                <div className="account-profile-section">
                    <p className="Details">Profile</p>
                    <div className="name-section">
                        <p className="name">{resident.first_name}</p>
                        <p className="name">{resident.last_name || "N/A"}</p>
                    </div>
                </div>

                <div className="account-details-section">
                    <p className="Details">Account Details</p>

                    <div className="edit-section">
                        <div className="form-group">
                            <label htmlFor="sex" className="form-label">Sex:</label>
                            <input id="sex" value={resident.sex || ""} readOnly className="form-input" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email:</label>
                            <input id="email" value={resident.email || ""} readOnly className="form-input" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">Phone:</label>
                            <input id="phone" value={resident.phone|| ""} readOnly className="form-input" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status" className="form-label">Status:</label>
                            <input id="status" value={resident.status|| ""} readOnly className="form-input" />
                        </div>

                        <button className="upload-btn">Update Profile</button>
                    </div>
                </div>
            </div>
        </main>
    );
}
