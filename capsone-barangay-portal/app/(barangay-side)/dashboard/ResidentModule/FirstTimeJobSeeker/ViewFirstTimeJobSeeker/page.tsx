"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ViewFirstTimeJobSeeker() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [activeSection, setActiveSection] = useState("basic");
  const [formData, setFormData] = useState<any>(null);

  const [error, setError] = useState("");
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchJobSeeker = async () => {
      try {
        const docRef = doc(db, "JobSeekerList", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(data);
          setOriginalData(data);
        } else {
          setError("Job seeker not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch job seeker data");
      }
    };

    fetchJobSeeker();
  }, [id]);
 
  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/FirstTimeJobSeeker";
  };

  return (
    <main className="viewresident-main-container">

        <div className="view-resident-main-content">

        <div className="view-resident-main-section1">
              <div className="view-resident-header-first-section">
                <img src="/Images/QCLogo.png" alt="QC Logo" className="logo1-image-side-bar-1" />
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
                <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn-main-resident"/> 
              </button>
            </div>
                
            <div className="view-resident-info-toggle-wrapper">
              {["basic", "jobseeker", "others" , "history"].map((section) => (
                <button
                  key={section}
                  type="button"
                  className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                  onClick={() => setActiveSection(section)}
                >
                  {section === "basic" && "Basic Info"}
                  {section === "jobseeker" && "Jobseeker Info"}
                  {section === "others" && "Others"}
                  {section === "history" && "History"}
                </button>
              ))}
            </div>  
            

          </div>


              <div className="view-resident-header-body-bottom-section">

              <div className="resident-photo-section">
                  
                  <span className="resident-details-label">Resident Details</span>

                  <div className="resident-profile-container">
                      
                    {formData && (
                      <div className="resident-profile-container-voter">
                        <img
                          src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                          alt="Resident"
                          className={
                            formData.identificationFileURL
                              ? "resident-picture uploaded-picture"
                              : "resident-picture default-picture"
                          }
                        />
                      </div>
                    )}
                    <div className="resident-name-section">
                      <h2>
                      {formData?.firstName || "N/A"} {formData?.lastName || "N/A"}
                      </h2>
                    </div>
                  </div>
                </div>



              <div className="view-resident-info-main-container">

                    <div className="view-resident-info-container-scrollable">
                        
                          <div className="view-resident-info-main-content">
                          {activeSection === "basic" && (
                           <>

                            <div className="view-main-resident-content-left-side">

                                <div className="view-resident-fields-section">
                                  <p>Last Name</p>
                                  <input type="text" name="lastName"  value={formData?.lastName || ""} className="view-resident-input-field" readOnly/>
                                </div>

                                <div className="view-resident-fields-section">
                                  <p>Middle Name</p>
                                  <input type="text" name="middleName"  value={formData?.middleName || ""} className="view-resident-input-field" readOnly/>
                                </div>

                                <div className="view-resident-fields-section">
                                  <p>Age</p>
                                  <input type="number" name="age"  value={formData?.age || ""} className="view-resident-input-field" readOnly/>
                                </div>


                                

                            </div>

                            <div className="view-main-resident-content-right-side">

                              <div className="view-resident-fields-section">
                                <p>First Name</p>
                                <input type="text" name="firstName"  value={formData?.firstName || ""} className="view-resident-input-field" readOnly/>
                              </div>

                              <div className="view-resident-fields-section">
                                  <p>Date of Birth</p>
                                  <input type="text" name="dateOfBirth"  value={formData?.dateOfBirth || ""} className="view-resident-input-field" readOnly/>
                                </div>

                                <div className="view-resident-fields-section">
                                  <p>Sex</p>
                                  <input type="text" name="sex"  value={formData?.sex || ""} className="view-resident-input-field" readOnly/>
                                </div>



                              </div>

                           </>
                                    
                          )}

                        {activeSection === "jobseeker" && (
                          <>
                          
                          <div className="voters-details-container-center ">

                            <div className="view-resident-fields-section-details">
                                  <p>Date Applied</p>
                                  <input type="date" name="dateApplied"  value={formData?.dateApplied || ""} className="view-resident-input-field" readOnly/>
                            </div>

                            <div className="view-resident-fields-section-details">
                                  <p>Remarks</p>
                                  <input type="text" name="remarks"  value={formData?.remarks || ""} className="view-resident-input-field" readOnly/>
                            </div>


                          </div>


                          </>
                          
                          )}


                          </div>

                        {activeSection === "history" && (
                          
                           <>

                    <div className="voters-details-container-center ">
                                 <div className="view-resident-fields-section-details">
                          <p>Created By</p>
                          <input
                            type="text"
                            name="createdBy"
                            value={formData.createdBy}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-resident-fields-section-details">
                          <p>Created At</p>
                          <input
                            type="text"
                            name="createdAt"
                            value={formData.createdAt}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-resident-fields-section-details">
                          <p>Last Updated By</p>
                          <input
                            type="text"
                            name="updatedBy"
                            value={formData.updatedBy}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>
                          </div>

                            </>
                              
                            )}


                      {activeSection === "others" && (
                        <>
                          {formData?.verificationFilesURLs?.length > 0 ? (
                            formData.verificationFilesURLs.map((url: string, index: number) => (
                              <div key={index} className="services-onlinereq-verification-requirements-section">
                                <span className="verification-requirements-label">
                                  {formData.verificationFilesURLs.length === 1
                                    ? "Verification Requirement"
                                    : `Verification Requirement ${index + 1}`}
                                </span>

                                <div className="services-onlinereq-verification-requirements-container">
                                  <div className="file-name-image-display">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={url}
                                        alt={`Verification Requirement ${index + 1}`}
                                        className="verification-reqs-pic uploaded-pic"
                                        style={{ cursor: "pointer" }}
                                      />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="services-onlinereq-verification-requirements-section">
                              <span className="verification-requirements-label">Verification Requirements</span>
                              <div className="services-onlinereq-verification-requirements-container">
                                <div className="no-verification-files-text">
                                  <p>No verification requirements uploaded.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                    </div>

              </div>



              </div>


          </div>




        </div>

       
      
    </main>
  );
}
