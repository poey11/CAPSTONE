"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ViewResident() {
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");

  const [residentData, setResidentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);


   

  const [formData, setFormData] = useState({
    residentNumber: 0,
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    age: 0,
    sex: "",
    civilStatus: "",
    occupation: "",
    contactNumber: "",
    emailAddress: "",
    precinctNumber: "",
    generalLocation: "",
    cluster: "",
    isStudent: false,
    isPWD: false,
    isSeniorCitizen: false,
    isSoloParent: false,
    fileURL: "",
    updatedBy: "",
  });

   const [originalData, setOriginalData] = useState({ ...formData });
     const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (residentId) {
      const fetchResidentData = async () => {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = {
            residentNumber: docSnap.data().residentNumber || 0,
            firstName: docSnap.data().firstName || "",
            lastName: docSnap.data().lastName || "",
            middleName: docSnap.data().middleName || "",
            address: docSnap.data().address || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            placeOfBirth: docSnap.data().placeOfBirth || "",
            age: docSnap.data().age || 0,
            sex: docSnap.data().sex || "",
            civilStatus: docSnap.data().civilStatus || "",
            occupation: docSnap.data().occupation || "",
            contactNumber: docSnap.data().contactNumber || "",
            emailAddress: docSnap.data().emailAddress || "",
            precinctNumber: docSnap.data().precinctNumber || "",
            generalLocation: docSnap.data().generalLocation || "",
            cluster: docSnap.data().cluster || "",
            isStudent: docSnap.data().isStudent || false,
            isPWD: docSnap.data().isPWD || false,
            isSeniorCitizen: docSnap.data().isSeniorCitizen || false,
            isSoloParent: docSnap.data().isSoloParent || false,
            fileURL: docSnap.data().fileURL || "",
            updatedBy: docSnap.data().updatedBy || "",
          };

          setFormData(data);
          setOriginalData(data); // Store original data
          setPreview(docSnap.data().fileURL || null);
        }
      };
      fetchResidentData();
    }
  }, [residentId]);

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule";
  };


  const [activeSection, setActiveSection] = useState("basic");

  return (
    <main className="viewresident-main-container">


       <div className="path-section">
          <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
          <h1 className="breadcrumb">
            <Link href="/dashboard/ResidentModule">Main Residents</Link>
            <span className="chevron">/</span>
          </h1>
          <h2 className="breadcrumb">Resident Details<span className="chevron"></span></h2>
        </div>

        <div className="viewresident-page-title-section-1">
          <h1>Main Residents</h1>
        </div>    


      <div className="viewresident-main-content-1">
        <div className="viewresident-section-1-header-1">
            
            <div className="viewresident-header-first-section">
                <img src="/Images/QClogo.png" alt="Barangay Captain" className="logo-image-side-bar-1" />
            </div>

           <div className="viewresident-header-second-section">
            <h2 className="gov-info">Republic of the Philippines</h2>
            <h2 className="gov-info">Quezon City</h2>
            <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
            <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
            <h2 className="contact">930-0040 / 428-9030</h2>
          </div>

            
            <div className="viewresident-header-third-section">
                  <img src="/Images/QClogo.png" alt="Barangay Captain" className="logo-image-side-bar-1" />
            </div>
        </div>



          <div className="view-resident-section-2-header">

              <div className="main-resident-back-section">
                  <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-main-resident"/> 
              </button>
              </div>
                <div className="info-toggle-wrapper">
                    {["basic", "full", "others"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                        onClick={() => setActiveSection(section)}
                      >
                        {section === "basic" && "Basic Info"}
                        {section === "full" && "Full Info"}
                        {section === "others" && "Others"}
                      </button>
                    ))}
                  </div>  
            </div>

  



     <div className="viewresident-content-body">
        <div className="resident-photo-section">
          <span className="resident-details-label">Resident Details</span>

          <div className="resident-profile-container">
            <img src="/Images/feeding2.jpg" alt="Resident" className="resident-photo" />
            <div className="resident-name-box">
              <h2 className="resident-name">Ronda Macapagal</h2>
            </div>
          </div>
        </div>


          <div className="resident-details-section">


              <div className="resident-details-container">
                    <div className="resident-details-container-left-side">
                        <div className="fields-section-residents">
                        <p>Resident Number</p>
                        <input type="text" className="main-resident-input-field" name="residentNumber" value={formData.residentNumber} readOnly/>
                      </div>

                      <div className="fields-section-residents">
                        <p>First Name</p>
                        <input type="text" className="main-resident-input-field" placeholder="Enter First Name" name="firstName" value={formData.firstName} required readOnly />
                      </div>

                      
                  <div className="fields-section-residents">
                    <p>Age</p>
                    <input type="number" className="main-resident-input-field" placeholder="Enter Age" name="age" value={formData.age} required readOnly/>
                  </div>


                
            

                    </div>

                    
                    <div className="resident-details-container-right-side">

                      <div className="fields-section-residents">
                        <p>Last Name </p>
                        <input type="text" className="main-resident-input-field" placeholder="Enter Last Name" name="lastName" value={formData.lastName}  required readOnly />
                      </div>

                      <div className="fields-section-residents">
                        <p>Middle Name</p>
                        <input type="text" className="main-resident-input-field" placeholder="Enter Middle Name" name="middleName" value={formData.middleName} required readOnly />
                      </div>


                      <div className="fields-section-residents">
                        <p>Sex</p>
                        <input name="sex" className="main-resident-input-field" value={formData.sex}  readOnly>
                        </input>
                      </div>
                      

                    </div>


              </div>
          </div>
      </div>





      



       
      </div>





      



    </main>
  );
}
