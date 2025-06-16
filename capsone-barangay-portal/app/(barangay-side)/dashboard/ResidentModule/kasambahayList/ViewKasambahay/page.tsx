"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../../../../db/firebase";
import { doc, getDoc } from "firebase/firestore";

interface KasambahayFormData {
  registrationControlNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
  homeAddress: string;
  dateOfBirth: string;
  placeOfBirth: string;
  age: number;
  sex: string;
  civilStatus: string;
  educationalAttainment: string;
  natureOfWork: string;
  employmentArrangement: string;
  salary: string;
  employerId: string;
  employerName: string;
  employerAddress: string;
  sssMember: boolean;
  philhealthMember: boolean;
  pagibigMember: boolean;
  verificationFilesURLs: string[];
  updatedBy: string;
  createdBy: string;
  createdAt: string;
  identificationFileURL: string;
}


export default function ViewKasambahay() {
  const searchParams = useSearchParams();
  const kasambahayId = searchParams.get("id");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("basic");
  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);

  
    const [formData, setFormData] = useState<KasambahayFormData>({
      registrationControlNumber: "",
      firstName: "",
      lastName: "",
      middleName: "",
      homeAddress: "",
      dateOfBirth: "",
      placeOfBirth: "",
      age: 0,
      sex: "",
      civilStatus: "",
      educationalAttainment: "",
      natureOfWork: "",
      employmentArrangement: "",
      salary: "",
      employerId: "",
      employerName: "",
      employerAddress: "",
      sssMember: false,
      philhealthMember: false,
      pagibigMember: false,
      identificationFileURL: "",
      verificationFilesURLs: [],
      updatedBy: "",
      createdBy: "",
      createdAt: "",
    });
  

    useEffect(() => {
      if (!kasambahayId) return;
  
      const fetchKasambahay = async () => {
        try {
          const docRef = doc(db, "KasambahayList", kasambahayId);
          const docSnap = await getDoc(docRef);
  
          if (docSnap.exists()) {
            const data = {
              registrationControlNumber: docSnap.data().registrationControlNumber || "",
              firstName: docSnap.data().firstName || "",
              lastName: docSnap.data().lastName || "",
              middleName: docSnap.data().middleName || "",
              homeAddress: docSnap.data().homeAddress || "",
              dateOfBirth: docSnap.data().dateOfBirth || "",
              placeOfBirth: docSnap.data().placeOfBirth || "",
              age: docSnap.data().age || "",
              sex: docSnap.data().sex || "",
              civilStatus: docSnap.data().civilStatus || "",
              educationalAttainment: docSnap.data().educationalAttainment || "",
              natureOfWork: docSnap.data().natureOfWork || "",
              employmentArrangement: docSnap.data().employmentArrangement || "",
              salary: docSnap.data().salary || "",
              employerId: docSnap.data().employerId || "",
              employerName: docSnap.data().employerName || "",
              employerAddress: docSnap.data().employerAddress || "",
              sssMember: docSnap.data().sssMember ?? false,
              philhealthMember: docSnap.data().philhealthMember ?? false,
              pagibigMember: docSnap.data().pagibigMember ?? false,
              verificationFilesURLs: docSnap.data().verificationFilesURLs || [],
              updatedBy: docSnap.data().updatedBy || "",
              createdBy: docSnap.data().createdBy || "",
              createdAt: docSnap.data().createdAt || "",
              identificationFileURL: docSnap.data().identificationFileURL || "",

            };
  
            setFormData(data);
          setOriginalData(data); // Store original data
          setVerificationPreviews(docSnap.data().verificationFilesURLs || []);
          setIdentificationPreview(docSnap.data().identificationFileURL || null);
  
          } else {
            setError("Kasambahay record not found.");
          }
        } catch (error) {
          console.error("Error fetching Kasambahay:", error);
          setError("Failed to load data.");
        }
      };
  
      fetchKasambahay();
    }, [kasambahayId]);


    const [originalData, setOriginalData] = useState<KasambahayFormData>({ ...formData });


  const educationalAttainmentMap: Record<number, string> = {
    1: "Elem Under Grad",
    2: "Elem Grad",
    3: "HS Grad",
    4: "HS Under Grad",
    5: "COL Grad",
    6: "COL Under Grad",
    7: "Educational",
    8: "Vocational",
  };

  const natureOfWorkMap: Record<number, string> = {
    1: "Gen. House Help (All Around)",
    2: "YAYA",
    3: "COOK",
    4: "Gardener",
    5: "Laundry Person",
    6: "Others",
  };

  const employeeArrangementMap: Record<number, string> = {
    1: "Live - IN",
    2: "Live - OUT",
  };

  const rangeOfSalaryMap: Record<number, string> = {
    1: "₱1,500 - ₱1,999",
    2: "₱2,000 - ₱2,499",
    3: "₱2,500 - ₱4,999",
    4: "₱5,000 and Above",
  };

  const booleanToYesNo = (value: boolean): string => {
    return value ? "Yes" : "No";
  };

  
  const kasambahayFields = [
    { label: "Registration Control Number", key: "registrationControlNumber" },
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Middle Name", key: "middleName" },
    { label: "Home Address", key: "homeAddress" },
    { label: "Date of Birth", key: "dateOfBirth" },
    { label: "Place of Birth", key: "placeOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Educational Attainment", key: "educationalAttainment" },
    { label: "Nature of Work", key: "natureOfWork" },
    { label: "Employment Arrangement", key: "employmentArrangement" },
    { label: "Salary Range", key: "salary" },
    { label: "SSS Member", key: "sssMember", isBoolean: true },
    { label: "PhilHealth Member", key: "philhealthMember", isBoolean: true },
    { label: "Pag-IBIG Member", key: "pagibigMember", isBoolean: true },
    { label: "Employer Name", key: "employerName" },
    { label: "Employer Address", key: "employerAddress" },
    { label: "Created By", key: "createdBy" },
    { label: "Updated By", key: "updatedBy" },
    { label: "Created At", key: "createdAt"},
  ];

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule/kasambahayList";
  };



  return (
    <main className="viewresident-main-container">
      

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
            {["basic", "employment", "others" , "history"].map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section === "basic" && "Basic Info"}
                {section === "employment" && "Employment Info"}
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
                
              <img
                  src={formData.identificationFileURL || "/Images/default-identificationpic.jpg"}
                  alt="Resident"
                  className={
                    formData.identificationFileURL
                      ? "resident-picture uploaded-picture"
                      : "resident-picture default-picture"
                  }
              />
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
                        <p>Registration Control Number</p>
                        <input type="text" name="registrationControlNumber" value={formData.registrationControlNumber} className="view-resident-input-field" readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>First Name</p>
                        <input type="text" name="firstName" value={formData.firstName} className="view-resident-input-field" readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Sex</p>
                        <input type="text" name="sex" value={formData.sex} className="view-resident-input-field" readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p> Date of Birth</p>
                        <input type="text" name="dateOfBirth" value={formData.dateOfBirth} className="view-resident-input-field" readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p> Civil Status</p>
                        <input type="text" name="civilStatus" value={formData.civilStatus} className="view-resident-input-field" readOnly/>
                      </div>

                 

                    </div>

                    <div className="view-main-resident-content-right-side">

                    <div className="view-resident-fields-section">
                        <p>Last Name</p>
                        <input type="text" name="lastName" value={formData.lastName} className="view-resident-input-field" readOnly/>
                      </div>


                    <div className="view-resident-fields-section">
                        <p> Middle Name</p>
                        <input type="text" name="middleName" value={formData.middleName} className="view-resident-input-field" readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p> Home Address</p>
                        <input type="text" name="homeAddress" value={formData.homeAddress} className="view-resident-input-field" readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p> Place of Birth</p>
                        <input type="text" name="placeOfBirth" value={formData.placeOfBirth} className="view-resident-input-field" readOnly/>
                      </div>


                    </div>

                  </>
                )}


                  {activeSection === "employment" && (
                  <>

                    <div className="view-main-resident-content-left-side">

                    <div className="view-resident-fields-section">
                        <p>Employer Name</p>
                          <input
                          type="text"
                          name="educationalAttainment"
                          value={formData.employerName}
                          className="view-resident-input-field"
                          readOnly
                        />
                      </div>

                     <div className="view-resident-fields-section">
                        <p>Educational Attainment</p>
                          <input
                          type="text"
                          name="educationalAttainment"
                          value={educationalAttainmentMap[Number(formData.educationalAttainment)] || "N/A"}
                          className="view-resident-input-field"
                          readOnly
                        />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Employment Arrangement</p>
                          <input
                          type="text"
                          name="employmentArrangement"
                          value={employeeArrangementMap[Number(formData.employmentArrangement)] || "N/A"}
                          className="view-resident-input-field"
                          readOnly
                        />
                      </div>

                    

                 

                    </div>

                    <div className="view-main-resident-content-right-side">

                    <div className="view-resident-fields-section">
                        <p>Employer Address</p>
                          <input
                          type="text"
                          name="employerAddress"
                          value={formData.employerAddress}
                          className="view-resident-input-field"
                          readOnly
                        />
                      </div>


                     <div className="view-resident-fields-section">
                        <p>Nature of Work</p>
                          <input
                          type="text"
                          name="natureOfWork"
                          value={natureOfWorkMap[Number(formData.natureOfWork)] || "N/A"}
                          className="view-resident-input-field"
                          readOnly
                        />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Range Of Salary</p>
                          <input
                          type="text"
                          name="salary"
                          value={rangeOfSalaryMap[Number(formData.salary)] || "N/A"}
                          className="view-resident-input-field"
                          readOnly
                        />
                      </div>


                    </div>

                  </>
                )}


                {activeSection === "others" && (
                  <>
                  <div className="view-main-resident-content-others">

                  <div className="add-main-resident-section-2-full-top">  
                   <div className="voters-details-container-center ">

                   <div className="view-resident-fields-section-details">
                          <p>SSS Member</p>
                          <input
                            type="text"
                            name="sssMember"
                            value={booleanToYesNo(formData.sssMember)}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-resident-fields-section-details">
                          <p>PhilHealth Member</p>
                          <input
                            type="text"
                            name="philhealthMember"
                            value={booleanToYesNo(formData.philhealthMember)}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-resident-fields-section-details">
                          <p>Pag-IBIG Member</p>
                          <input
                            type="text"
                            name="pagibigMember"
                            value={booleanToYesNo(formData.pagibigMember)}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                   </div>
                   </div>

                   <div className="add-main-resident-section-2-full-bottom-view">
                   {formData.verificationFilesURLs.length > 0 ? (
                            formData.verificationFilesURLs.map((url, index) => (
                              <div key={index} className="services-onlinereq-verification-requirements-section">
                                <span className="verification-requirements-label">
                                  {formData.verificationFilesURLs.length === 1
                                    ? 'Verification Requirement'
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
                                        style={{ cursor: 'pointer' }}
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
                   </div>
                  </div>

                  </>
                )}

            {activeSection === "history" && (
                  <>

                   <div className="voters-details-container-center ">

                        <div className="view-resident-fields-section">
                          <p>Created By</p>
                          <input
                            type="text"
                            name="createdBy"
                            value={formData.createdBy}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-resident-fields-section">
                          <p>Created At</p>
                          <input
                            type="text"
                            name="createdAt"
                            value={formData.createdAt}
                            className="view-resident-input-field"
                            readOnly
                          />
                        </div>

                        <div className="view-resident-fields-section">
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






                </div>

          </div>

          </div>

        </div>

       
            


          </div>



        

      </div>
    </main>
  );
}
