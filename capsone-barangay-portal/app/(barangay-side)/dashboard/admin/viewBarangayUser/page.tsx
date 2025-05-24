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
    const [activeSection, setActiveSection] = useState("basic");

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

        <main className="view-user-main-container">
            
            <div className="view-user-main-content">

                    <div className="view-user-main-section1">
                <div className="view-user-header-first-section">
                    <img src="/Images/QClogo.png" alt="QC Logo" className="user-logo1-image-side-bar-1" />
                </div>

                <div className="view-user-header-second-section">
                    <h2 className="gov-info">Republic of the Philippines</h2>
                    <h2 className="gov-info">Quezon City</h2>
                    <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
                    <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
                    <h2 className="contact">930-0040 / 428-9030</h2>
                </div>

                <div className="view-user-header-third-section">
                    <img src="/Images/logo.png" alt="Brgy Logo" className="user-logo2-image-side-bar-1" />
                </div>
            </div>

              <div className="view-user-header-body">

                <div className="view-user-header-body-top-section">
                    <div className="view-user-backbutton-container">
                        <button onClick={handleBack}>
                            <img src="/images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident"/> 
                        </button>
                    </div>


                <div className="view-user-info-toggle-wrapper">
                    {["basic", "full", "others" , "history"].map((section) => (
                    <button
                        key={section}
                        type="button"
                        className={`user-info-toggle-btn ${activeSection === section ? "active" : ""}`}
                        onClick={() => setActiveSection(section)}
                    >
                        {section === "basic" && "Basic Info"}
                        {section === "full" && "Full Info"}
                        {section === "others" && "Others"}
                        {section === "history" && "History"}
                    </button>
                    ))}
                </div>  
                </div>


                <div className="view-user-header-body-bottom-section">

                <div className="user-photo-section">
            <span className="user-details-label">Barangay User Details</span>

            <div className="user-profile-container">

                {/*
              <img
                  src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                  alt="Resident"
                  className={
                    formData.identificationFileURL
                      ? "resident-picture uploaded-picture"
                      : "resident-picture default-picture"
                  }
              />
              <div className="user-name-section">
                  <h2>
                    {formData.firstName || "N/A"} {formData.lastName || "N/A"}
                  </h2>
                </div>
                */}
            </div>
          </div>


          <div className="view-user-info-main-container">
               <div className="view-user-info-container-scrollable">

                    <div className="view-user-info-main-content">

                    {activeSection === "basic" && (
                    <>

                    <div className="view-main-user-content-left-side">

                    </div>

                    <div className="view-main-user-content-right-side">

                    </div>


                    
                        </>
                    )}

                    </div>

               </div>

          </div>





                </div>

          

                </div>

            </div>

          
     


        
        </main>
    );
}