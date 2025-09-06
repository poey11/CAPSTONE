"use client";
import "@/CSS/User&Roles/ViewUser.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";



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
  }

export default function ViewUser() {

    const searchParams = useSearchParams();
    const userId = searchParams.get("id");

    const [BarangayUserData, setBarangayUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState("full");
    

    const [formData, setFormData] = useState({
        userid: 0,
        role: "",
        position: "",
        password: "",
        createdBy: "",
        createdAt: "",
        updatedBy: "",
        address: "",
        birthDate: "",
        firstName: "",
        middleName: "",
        lastName: "",
        phone: "",
        sex: "",
        department: ""
      });

      const [originalData, setOriginalData] = useState({ ...formData });


/*
    if (BarangayUserData?.position === "LF Staff") {
        barangayUserFields.splice(4, 0, { label: "Department", key: "department" });
    }
        */

    const handleBack = () => {
        window.location.href = "/dashboard/admin/BarangayUsers";
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
                        updatedBy: docSnap.data().updatedBy || "",
                    };

                    setFormData(data);
                    setOriginalData(data); // Store original data
                }
            };

            fetchUserData();
        }
        
    }, [userId]);

    

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
                            <img src="/Images/left-arrow.png" alt="Left Arrow" className="user-back-btn-resident"/> 
                        </button>
                    </div>


                    <div className="view-user-info-toggle-wrapper">
                        {[ "full" , "history"].map((section) => (
                        <button
                            key={section}
                            type="button"
                            className={`user-info-toggle-btn ${activeSection === section ? "active" : ""}`}
                            onClick={() => setActiveSection(section)}
                        >
                
                            {section === "full" && "Full Info"}
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

                    {activeSection === "full" && (
                    <>

                    <div className="view-main-user-content-left-side">

                    <div className="view-user-fields-section">
                        <p>User Id</p>
                        <input type="text" className="view-user-input-field" name="residentNumber" value={formData.userid} readOnly/>
                      </div>

                      <div className="view-user-fields-section">
                            <p>Official Middle Name</p>
                            <input type="text" className="view-user-input-field" name="middleName" value={formData.middleName} readOnly/>
                        </div>

                        <div className="view-user-fields-section">
                            <p>Position</p>
                            <input type="text" className="view-user-input-field" name="position" value={formData.position} readOnly/>
                        </div>

                        <div className="view-user-fields-section">
                            <p>Contact Number</p>
                            <input type="input" className="view-user-input-field" name="phone" value={formData.phone} readOnly/>
                        </div>

                        <div className="view-user-fields-section">
                            <p>Address</p>
                            <input type="input" className="view-user-input-field" name="address" value={formData.address} readOnly/>
                        </div>




                    </div>

                    <div className="view-main-user-content-right-side">


                        <div className="view-user-fields-section">
                            <p>Official First Name</p>
                            <input type="text" className="view-user-input-field" name="firstName" value={formData.firstName} readOnly/>
                        </div>

                        <div className="view-user-fields-section">
                            <p>Official Last Name</p>
                            <input type="text" className="view-user-input-field" name="lastName" value={formData.lastName} readOnly/>
                        </div>

                        <div className="view-user-fields-section">
                            <p>Birthday</p>
                            <input type="date" className="view-user-input-field" name="birthDate" value={formData.birthDate} readOnly/>
                        </div>


                        <div className="view-user-fields-section">
                            <p>Sex</p>
                            <input type="input" className="view-user-input-field" name="gender" value={formData.sex} readOnly/>
                        </div>


                    </div>

                    {/*ADD PA YUNG CONDITION NA MIDSPLAY IF LUPON SIYA TAPOS MAADD DYNAMICALY YUNG DEPARTMENT */}


                    
                        </>
                    )}


                    {activeSection === "history" && (
                    <>

                        
                 <div className="user-details-container-center ">
                                 <div className="view-user-fields-section">
                          <p>Created By</p>
                          <input
                            type="text"
                            name="createdby"
                            value={formData.createdBy}
                            className="view-user-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-user-fields-section">
                          <p>Created At</p>
                          <input
                            type="text"
                            name="createdAt"
                            value={formData.createdAt}
                            className="view-user-input-field"
                            readOnly
                          />
                        </div>
                
                        <div className="view-user-fields-section">
                          <p>Updated By</p>
                          <input
                            type="text"
                            name="updatedBy"
                            value={formData.updatedBy}
                            className="view-user-input-field"
                            readOnly
                          />
                        </div>
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