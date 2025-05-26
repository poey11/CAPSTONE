"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";


interface VoterFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  voterNumber: string;
  fullName: string;
  homeAddress: string;
  precinctNumber: string;

}


export default function ViewVoter() {
    const router = useRouter();
  const searchParams = useSearchParams();
  const voterId = searchParams.get("id");


  const [formData, setFormData] = useState<VoterFormData>({
    firstName:  "",
    middleName: "",
    lastName: "",
    voterNumber: "",
    fullName: "",
    homeAddress: "",
    precinctNumber: "",
  });

  const [originalData, setOriginalData] = useState({ ...formData });
  const [error, setError] = useState("");

  
  useEffect(() => {
    if (!voterId) return;

    const fetchVoter = async () => {
      try {
        const docRef = doc(db, "VotersList", voterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = {
            firstName: docSnap.data().firstName || "",
            middleName: docSnap.data().middleName || "",
            lastName: docSnap.data().lastName || "",
            voterNumber: docSnap.data().voterNumber || "",
            fullName: docSnap.data().fullName || "",
            homeAddress: docSnap.data().homeAddress || "",
            precinctNumber: docSnap.data().precinctNumber || "",
          };

          setFormData(data);
          setOriginalData(data); // Store original data
        } else {
          setError("Voter record not found.");
        }
      } catch (error) {
        console.error("Error fetching Voter:", error);
        setError("Failed to load data.");
      }
    };

    fetchVoter();
  }, [voterId]);


  const [activeSection, setActiveSection] = useState("details");


  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/registeredVoters";
  };

  return (
    <main className="viewresident-main-container">

      {/*
          <div className="path-section">
          <h1 className="breadcrumb">Residents Management<span className="chevron">/</span></h1>
          <h1 className="breadcrumb">
            <Link href="/dashboard/ResidentModule/registeredVoters">Registered Voters</Link>
            <span className="chevron">/</span>
          </h1>
          <h2 className="breadcrumb">View Voter Details<span className="chevron"></span></h2>
        </div>

      <div className="viewresident-page-title-section-1">
      <h1>Registered Voters</h1>
      </div>
      */}

      <div className="view-resident-main-content">

      <div className="view-resident-main-section1">
          <div className="view-resident-header-first-section">
            <img src="/Images/QClogo.png" alt="QC Logo" className="logo1-image-side-bar-1" />
          </div>

          <div className="view-resident-header-second-section">
            <h2 className="gov-info">Republic of the Philippines</h2>
            <h2 className="gov-info">Quezon City</h2>
            <h1 className="barangay-name">BARANGAY FAIRVIEW</h1>
            <h2 className="address">Dahlia Avenue, Fairview Park, Quezon City</h2>
            <h2 className="contact">930-0040 / 428-9030</h2>
          </div>

          <div className="view-resident-header-third-section">
            <img src="/Images/logo.png" alt="Brgy Logo" className="logo2-image-side-bar-1" />
          </div>
      
      </div>


      <div className="view-resident-header-body">

      <div className="view-resident-header-body-top-section">
          <div className="view-resident-backbutton-container">
            <button onClick={handleBack}>
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn-main-resident"/> 
            </button>
          </div>
              
          <div className="view-resident-info-toggle-wrapper">
            {["details"].map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section === "details" && "Details"}
               
              </button>
            ))}
          </div>  
          
        </div>


        <div className="view-resident-header-body-bottom-section">

              <div className="resident-photo-section">
              <span className="resident-details-label">Voter Details</span>

              <div className="resident-profile-container">
                {
                /* 

                  <img
                  src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                  alt="Resident"
                  className={
                    formData.identificationFileURL
                      ? "resident-picture uploaded-picture"
                      : "resident-picture default-picture"
                  }
              />
                
                */}
            
            {/* 
              <div className="resident-name-section">
                  <h2>
                   {formData.fullName || "N/A"}
                  </h2>
                </div>
            */}
            
            </div>

              </div>



              <div className="view-resident-info-main-container">

                    <div className="view-resident-info-container-scrollable">
                          
                          <div className="view-resident-info-main-content">
                          {activeSection === "details" && (
                            <>

                           
                           <div className="resident-details-container-left-side">

                                  <div className="view-resident-fields-section">
                                  <p>Voter Number</p>
                                  <input type="text" name="voterNumber" value={formData.voterNumber} 
                                  className="view-resident-input-field" readOnly />
                                </div>

                                  <div className="view-resident-fields-section">
                                    <p>Last Name</p>
                                    <input type="text" name="last_name" value={formData.lastName} 
                                    className="view-resident-input-field" readOnly />
                                  </div>

                                  <div className="view-resident-fields-section">
                                    <p>Precint Number</p>
                                    <input type="text" name="precintNumber" value={formData.precinctNumber} 
                                    className="view-resident-input-field" readOnly />
                                  </div>

                           </div>


                           <div className="resident-details-container-right-side">
                                <div className="view-resident-fields-section">
                                    <p>First Name</p>
                                    <input type="text" name="first_name" value={formData.firstName} 
                                    className="view-resident-input-field" readOnly />
                                  </div>

                                  <div className="view-resident-fields-section">
                                    <p>Middle Name</p>
                                    <input type="text" name="middle_name" value={formData.middleName} 
                                    className="view-resident-input-field" readOnly />
                                  </div>

                                  <div className="view-resident-fields-section">
                                  <p>Home Address</p>
                                  <input type="text" name="homeAddress" value={formData.homeAddress} 
                                  className="view-resident-input-field" readOnly />
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
