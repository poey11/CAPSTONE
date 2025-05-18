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

  const router = useRouter();

  useEffect(() => {
    if (!residentId) return;

    const fetchResident = async () => {
      try {
        const docRef = doc(db, "Residents", residentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setResidentData(docSnap.data());
        } else {
          console.error("Resident not found");
        }
      } catch (error) {
        console.error("Error fetching resident:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResident();
  }, [residentId]);

  if (loading) return <p>Loading...</p>;
  if (!residentData) return <p>Resident not found</p>;

  const residentFields = [
    { label: "Resident Number", key: "residentNumber" },
    { label: "Full Name", key: "name" },
    { label: "Home Address", key: "address" },
    { label: "Date of Birth", key: "dateOfBirth" },
    { label: "Place of Birth", key: "placeOfBirth" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Occupation", key: "occupation" },
    { label: "Contact Number", key: "contactNumber" },
    { label: "Email Address", key: "emailAddress" },
    { label: "Precinct Number", key: "precinctNumber" },
    { label: "General Location", key: "generalLocation" },
    { label: "Cluster", key: "cluster" },
    { label: "Student", key: "isStudent", isBoolean: true },
    { label: "PWD", key: "isPWD", isBoolean: true },
    { label: "Senior Citizen", key: "isSeniorCitizen", isBoolean: true },
    { label: "Solo Parent", key: "isSoloParent", isBoolean: true },
    { label: "Created By", key: "createdBy" },
    { label: "Updated By", key: "updatedBy" },
    { label: "Created At", key: "createdAt" },
  ];

  const handleBack = () => {
    router.back();
  };

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

      <div className="viewresident-main-content">
        <div className="viewresident-section-1-header">
          <button onClick={handleBack}>
                <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn"/> 
              </button>
          <p>Resident Details</p>
        </div>

        {residentFields.map((field) => {
          let value;

          if (field.key === "name") {
            const { lastName = "", firstName = "", middleName = "" } = residentData;
            value = `${lastName}, ${firstName} ${middleName}`.trim();
          } else if (field.isBoolean !== undefined) {
            value = residentData[field.key] ? "Yes" : "No";
          } else {
            value = residentData[field.key] ?? "N/A";
          }

          return (
            <div className="viewresident-details-section" key={field.key}>
              <div className="viewresident-title">
                <p>{field.label}</p>
              </div>
              <div className={`viewresident-description ${field.key === "residentNumber" ? "disabled-field" : ""}`}>
                <p>{value}</p>
              </div>
            </div>
          );
        })}

        {/* Display Valid ID */}
        <div className="viewresident-details-section">
          <div className="viewresident-title">
            <p>Valid ID</p>
          </div>
          <div className="viewresident-description">
            {residentData.fileURL ? (
              <div className="resident-id-container">
                <img
                  src={residentData.fileURL}
                  alt="Resident's Valid ID"
                  className="resident-id-image"
                />
                <a
                  href={residentData.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-image-link"
                >
                  View Image
                </a>
              </div>
            ) : (
              <p>No ID uploaded</p>
            )}
          </div>
        </div>
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


     <div className="viewresident-content-body">
        <div className="resident-photo-section">
          <span className="resident-details-label">Resident Details</span>

          <div className="resident-profile-container">
            <img src="/Images/feeding2.jpg" alt="Resident" className="resident-photo" />
            <div className="resident-name-box">
              <h2 className="resident-name">Justine Anne Rosete</h2>
            </div>
          </div>
        </div>


          <div className="resident-details-section">

              <div className="resident-details-container">
                    <div className="resident-details-container-left-side">
                        
                    </div>
              </div>
          </div>
      </div>





      



       
      </div>





      



    </main>
  );
}
