"use client";
import "@/CSS/User&Roles/ViewUser.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";


export default function ViewUser() {

    const searchParams = useSearchParams();
    const barangayUserId = searchParams.get("id");

    const [BarangayUserData, setBarangayUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!barangayUserId) return;

        const fetchResident = async () => {
            try {
                const docRef = doc(db, "BarangayUsers", barangayUserId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setBarangayUserData(docSnap.data());
                  } else {
                    console.error("Barangay User not found");
                }
            } catch (error) {
                console.error("Error fetching Barangay User:", error);
            } finally {
                setLoading(false);
            }
        
        };
    
        fetchResident();
    }, [barangayUserId]);


    if (loading) return <p>Loading...</p>;
    if (!barangayUserId) return <p>Barangay User not found</p>;

    const barangayUserFields = [
        { label: "User ID", key: "userid" },
        { label: "Official First Name", key: "firstName" },
        { label: "Official Middle Name", key: "middleName" },
        { label: "Official Last Name", key: "lastName" },
        { label: "Position", key: "position" },
        { label: "Birthday", key: "birthDate" },
        { label: "Contact Number", key: "phone" },
        { label: "Sex", key: "sex" },
        { label: "Address", key: "address" },
        { label: "Created By", key: "createdBy" },
        { label: "Created At", key: "createdAt" },
    ];

    if (BarangayUserData?.position === "LF Staff") {
        barangayUserFields.splice(4, 0, { label: "Department", key: "department" });
    }

    const handleBack = () => {
        window.location.href = "/dashboard/admin/BarangayUsers";
    };

    return (

        <main className="viewresident-main-container">

            <div className="path-section">
                <h1 className="breadcrumb">User and Roles<span className="chevron">/</span></h1>
                <h1 className="breadcrumb">
                    <Link href="/dashboard/admin/BarangayUsers">Barangay Users</Link>
                    <span className="chevron">/</span>
                </h1>
                <h2 className="breadcrumb">View Barangay User Details<span className="chevron"></span></h2>
            </div>

            <div className="viewresident-page-title-section-1">
                <h1>Barangay Users</h1>
            </div>


            <div className="viewresident-main-content">

                <div className="viewresident-section-1">
                    <div className="viewresident-main-section1-left">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
                        </button>
                        <h1>Barangay User Details</h1>

                    </div>
                </div>

                {barangayUserFields.map((field) => (
                    <div className="viewresident-details-section" key={field.key}>
                        <div className="viewresident-title">
                            <p>{field.label}</p>
                        </div>
                        <div className={`viewresident-description ${field.key === "residentNumber" ? "disabled-field" : ""}`}>
                            <p> {BarangayUserData[field.key] ?? "N/A"} </p>
                        </div>    
                    </div>
                ))}

            </div>

        </main>
    );
}