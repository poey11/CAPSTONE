"use client";
import "@/CSS/ResidentModule/viewresident.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../../../db/firebase";
import { doc, getDoc, where, getDocs, collection, query } from "firebase/firestore";

export default function ViewResident() {
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");

  const [residentData, setResidentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
  const [verificationPreviews, setVerificationPreviews] = useState<string[]>([]);


   

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
    verificationFilesURLs: [],
    identificationFileURL: "",
    createdBy: "",
    updatedBy: "",
    createdAt: "",
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
            verificationFilesURLs: docSnap.data().verificationFilesURLs || [],
            identificationFileURL: docSnap.data().identificationFileURL || "",
            createdBy: docSnap.data().createdBy || "",
            updatedBy: docSnap.data().updatedBy || "",
            createdAt: docSnap.data().createdAt || "",
          };

          setFormData(data);
          setOriginalData(data); // Store original data
          setVerificationPreviews(docSnap.data().verificationFilesURLs || []);
          setIdentificationPreview(docSnap.data().identificationFileURL || null);
        }
      };
      fetchResidentData();
    }
  }, [residentId]);

  const handleBack = () => {
    window.location.href = "/dashboard/ResidentModule";
  };


  const [incidentReports, setIncidentReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchIncidentReports = async () => {
      if (!residentId) return;
  
      const incidentRef = collection(db, "IncidentReports");
  
      // Query where the resident is the complainant
      const complainantQuery = query(
        incidentRef,
        where("complainant.residentId", "==", residentId)
      );
  
      // Query where the resident is the respondent
      const respondentQuery = query(
        incidentRef,
        where("respondent.residentId", "==", residentId)
      );
  
      // Query where the general residentId matches
      const generalQuery = query(
        incidentRef,
        where("residentId", "==", residentId)
      );
  
      const [complainantSnap, respondentSnap, generalSnap] = await Promise.all([
        getDocs(complainantQuery),
        getDocs(respondentQuery),
        getDocs(generalQuery),
      ]);
  
      const reports: any[] = [];
  
      complainantSnap.forEach((doc) => {
        reports.push({ id: doc.id, role: "Complainant", ...doc.data() });
      });
  
      respondentSnap.forEach((doc) => {
        if (!reports.find((r) => r.id === doc.id)) {
          reports.push({ id: doc.id, role: "Respondent", ...doc.data() });
        }
      });
  
      generalSnap.forEach((doc) => {
        if (!reports.find((r) => r.id === doc.id)) {
          reports.push({ id: doc.id, role: "Complainant", ...doc.data() });
        }
      });
  
      setIncidentReports(reports);
    };
  
    fetchIncidentReports();
  }, [residentId]);
  

const [serviceRequests, setServiceRequests] = useState<any[]>([]);

useEffect(() => {
  const fetchServiceRequests = async () => {
    if (!residentId) return;

    try {
      const requestsRef = collection(db, "ServiceRequests");
      const q = query(requestsRef, where("residentId", "==", residentId));
      const snapshot = await getDocs(q);

      const requests: any[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setServiceRequests(requests);
    } catch (error) {
      console.error("Error fetching service requests:", error);
    }
  };

  fetchServiceRequests();
}, [residentId]);



  const [activeSection, setActiveSection] = useState("basic");

  return (
    <main className="viewresident-main-container">

{/*
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
        </div>    */}

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
            {["basic", "full", "others" , "history", "incidents", "services"].map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section === "basic" && "Basic Info"}
                {section === "full" && "Full Info"}
                {section === "others" && "Others"}
                {section === "history" && "History"}
                {section === "incidents" && "Incidents"}
                {section === "services" && "Services"}
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
                        <p>Resident Number</p>
                        <input type="text" className="view-resident-input-field" name="residentNumber" value={formData.residentNumber} readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>First Name</p>
                        <input type="text" className="view-resident-input-field" name="firstName" value={formData.firstName || "N/A"} required readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Age</p>
                        <input type="number" className="view-resident-input-field" name="age" value={formData.age} required readOnly/>
                      </div>
                    </div>
                    
                    <div className="view-main-resident-content-right-side">
                      <div className="view-resident-fields-section">
                        <p>Last Name</p>
                        <input type="text" className="view-resident-input-field"  name="lastName" value={formData.lastName || "N/A"}  required readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Middle Name</p>
                        <input type="text" className="view-resident-input-field"  name="middleName" value={formData.middleName || "N/A"} required readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Sex</p>
                        <input name="sex" className="view-resident-input-field" value={formData.sex || "N/A"}  readOnly/>
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "full" && (
                  <>
                    <div className="view-main-resident-content-left-side">
                      <div className="view-resident-fields-section">
                        <p>Address</p><input type="text" className="view-resident-input-field" name="address" value={formData.address || "N/A"} readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Cluster</p>
                        <input type="text" name="cluster" className="view-resident-input-field" value={formData.cluster || "N/A"} readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Date of Birth</p>
                        <input type="date" className="view-resident-input-field" name="dateOfBirth" value={formData.dateOfBirth || "N/A"}  max={new Date().toISOString().split("T")[0]} readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Occupation</p>
                        <input type="text" className="view-resident-input-field"  name="occupation" value={formData.occupation || "N/A"} readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Precinct Number</p>
                        <input type="text" className="view-resident-input-field"  name="precinctNumber" value={formData.precinctNumber || "N/A"} readOnly />
                      </div> 
                    </div>

                    <div className="view-main-resident-content-right-side">
                      <div className="view-resident-fields-section">
                        <p>Location</p>
                        <input type="text" name="generalLocation" className="view-resident-input-field" value={formData.generalLocation || "N/A"} readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Place of Birth</p>
                        <input type="text" className="view-resident-input-field" name="placeOfBirth" value={formData.placeOfBirth || "N/A"}  readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Civil Status</p>
                        <input type="text" name="civilStatus" className="view-resident-input-field" value={formData.civilStatus || "N/A"} readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Contact Number</p>
                        <input type="text" className="view-resident-input-field" name="contactNumber" value={formData.contactNumber || "N/A"} readOnly />
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Email Address</p>
                        <input type="email" className="view-resident-input-field" name="emailAddress" value={formData.emailAddress || "N/A"} readOnly />
                      </div>
                    </div>

                  </>
                )}


                    {activeSection === "others" && (
                          <>

                          {/* add top bottom section div*/}
                        <div className="view-main-resident-content-others">

                        
                          <div className="add-main-resident-section-2-full-top">  
                            <div className="view-main-resident-content-left-side">

                                <div className="view-resident-fields-section">
                                  <p>Student</p>
                                  <input type="text" className="view-resident-input-field" name="isStudent"  value={formData.isStudent ? 'Yes' : 'No'} readOnly/>
                                </div>

                                <div className="view-resident-fields-section">
                                  <p>Senior Citizen</p>
                                  <input type="text" className="view-resident-input-field" name="isStudent"  value={formData.isSeniorCitizen ? 'Yes' : 'No'} readOnly/>
                                </div>
                            </div>

                            <div className="view-main-resident-content-right-side">

                              <div className="view-resident-fields-section">
                                <p>PWD</p>
                                <input type="text" className="view-resident-input-field" name="isPWD"  value={formData.isPWD ? 'Yes' : 'No'} readOnly/>
                              </div>


                              <div className="view-resident-fields-section">
                                <p>Solo Parent</p>
                                <input type="text" className="view-resident-input-field" name="isSoloParent"  value={formData.isSoloParent ? 'Yes' : 'No'} readOnly/>
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

                  <div className="view-main-resident-content-left-side">
                      <div className="view-resident-fields-section">
                        <p>Created By</p>
                        <input type="text" className="view-resident-input-field" name="createDby" value={formData.createdBy} readOnly/>
                      </div>

                      <div className="view-resident-fields-section">
                        <p>Created At</p>
                        <input type="text" className="view-resident-input-field" name="createdAt" value={formData.createdAt} readOnly/>
                      </div>

                    
                      
                    </div>

                    <div className="view-main-resident-content-right-side">
                      <div className="view-resident-fields-section">
                        <p>Updated By</p>
                        <input type="text" className="view-resident-input-field" name="updatedby" value={formData.updatedBy} readOnly/>
                      </div>

                    
                      
                    </div>
                    
                    
                        
                        
                  </>

                  )}
                  {activeSection === "incidents" && (
                    <>
                        <div className="view-resident-incident-table-container">
                          {incidentReports.length === 0 ? (
                            <div className="no-incident-message">
                              <p>No incident reports found for this resident.</p>
                            </div>
                          ) : (
                            <table className="incident-table-section">
                              <thead>
                                <tr>
                                  <th className="w-[250px] text-center">Case No.</th>
                                  <th className="w-[200px] text-center">
                                    {incidentReports.some((i) => i.department === "Online") ? "Date Filed" : "Date & Time Filed"}
                                  </th>
                                  <th className="w-[200px] text-center">
                                    {incidentReports.some((i) => i.department === "Online") ? "Concerns" : "Nature"}
                                  </th>
                                  <th className="w-[150px] text-center">Status</th>
                                  <th className="w-[120px] text-center">Role</th>
                                </tr>
                              </thead>
                              <tbody>
                                {incidentReports.map((incident) => {
                                  const isOnline = incident.department === "Online";
                                  const targetUrl = isOnline
                                    ? `/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${incident.id}`
                                    : `/dashboard/IncidentModule/ViewIncident?id=${incident.id}`;

                                  return (
                                    <tr key={incident.id} className="clickable-row">
                                      <td>
                                        <Link href={targetUrl}>
                                          {incident.caseNumber}
                                        </Link>
                                      </td>
                                      <td>
                                        <Link href={targetUrl}>
                                          {isOnline ? incident.dateFiled : `${incident.dateFiled} ${incident.timeFiled}`}
                                        </Link>
                                      </td>
                                      <td>
                                        <Link href={targetUrl}>
                                          {isOnline 
                                            ? (incident.concerns || "N/A")
                                            : (incident.nature === "Others" ? incident.specifyNature : incident.nature)}
                                        </Link>
                                      </td>
                                      <td>
                                        <Link href={targetUrl}>
                                          <span
                                            className={`status-badge-departments ${incident.status
                                              .toLowerCase()
                                              .replace(/\s+/g, "-")}`}
                                          >
                                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1).toLowerCase()}
                                          </span>
                                        </Link>
                                      </td>
                                      <td>
                                        <Link href={targetUrl}>
                                          {incident.role}
                                        </Link>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                    </>
                  )}
{activeSection === "services" && (
  <>
    <div className="view-resident-incident-table-container">
      {serviceRequests.length === 0 ? (
        <div className="no-incident-message">
          <p>No service requests found for this resident.</p>
        </div>
      ) : (
        <table className="incident-table-section">
          <thead>
            <tr>
              <th className="w-[200px] text-center">Account ID</th>
              <th className="w-[250px] text-center">Purpose</th>
              <th className="w-[200px] text-center">Document Type</th>
              <th className="w-[150px] text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {serviceRequests.map((req) => (
              <tr key={req.id} className="clickable-row">
                <td>
                  <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                    {req.requestId}
                  </Link>
                </td>
                <td>
                  <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                    {req.purpose}
                  </Link>
                </td>
                <td>
                  <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                    {req.docType}
                  </Link>
                  
                </td>
                <td>
                  <Link href={`/dashboard/ServicesModule/ViewRequest?id=${req.id}`}>
                    <span
                      className={`status-badge-departments ${req.status
                        ?.toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {req.status?.charAt(0).toUpperCase() + req.status?.slice(1).toLowerCase()}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
