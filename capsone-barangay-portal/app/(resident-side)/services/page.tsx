"use client";
import { useAuth } from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsmain/requestdocumentsmain.css";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef} from "react";
import { db } from "@/app/db/firebase";
import { collection, getDocs, doc, getDoc,onSnapshot } from "firebase/firestore"; // ✅ fix

export default function Services() {
  const user = useAuth().user;
  const router = useRouter();

  const [permitOptions, setPermitOptions] = useState<any[]>([]);
  const [isGuest, setIsGuest] = useState(!user);  // ✅ fix
  const [userData, setUserData] = useState<any>(null);  // ✅ optional

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.querySelector(".services-section-withbg");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const sectionCenter = rect.top + rect.height / 2;
      const windowCenter = windowHeight / 2;

      const inMiddle = sectionCenter >= windowCenter - 100 && sectionCenter <= windowCenter + 100;

      if (inMiddle && !hasAnimated) {
        setHasAnimated(true); // Only trigger once
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasAnimated]);


  //  Fetch ResidentUser document to determine if guest
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsGuest(true);
        return;
      }

      const userDocRef = doc(db, "ResidentUsers", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        console.log("No ResidentUser document found.");
        setIsGuest(true);
        return;
      }

      const userData = userDocSnap.data();
      setUserData(userData);

      const isUnverified = !userData.status || userData.status === "Unverified";
      setIsGuest(isUnverified);
    };

    checkUserStatus();
  }, [user]);

  // ✅ Load available permits based on isGuest
  useEffect(() => {
    const fetchPermitOptions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "OtherDocuments"));
        const permits = querySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            if (data.type !== "Barangay Permit") return false;
  
            const forResidentOnly = data.forResidentOnly ?? false;
            return !isGuest || (isGuest && forResidentOnly === false);
          })
          .map(doc => ({
            id: doc.id,
            title: doc.data().title,
            type: doc.data().type,
          }));
  
        setPermitOptions(permits);
      } catch (error) {
        console.error("Error fetching Barangay Permit documents:", error);
      }
    };

    fetchPermitOptions();
  }, [isGuest]);

  const isAllowedForGuest = (docType: string) => {
    return (
      docType === "Temporary Business Permit" ||
      docType === "Business Permit" ||
      docType === "Construction Permit" ||
      docType === "Other Documents"
    );
  };

  const goToServices = (e: any) => {
    const action = e.currentTarget.id;
    if (isGuest && !isAllowedForGuest(action)) return;
    router.push(`/services/action?doc=${action}`);
 
  };

  const handleSubmitOther = (e: any) => {
        console.log("Selected Document:", e);
        router.push(`/services/action?doc=${e.type}&purpose=${e.title}`);
    }

  return (
    <main className="services-container-document">
      <div className="headerpic-services">
        <p>SERVICES</p>
      </div>


{/*
      <div className="services-main-container">
        <div className="documents-upper">
          <div className="documents-container">

            <div className="documents-container-column">
              <div className="tooltip-wrapper">
                <div
                  className={`documents-card ${isGuest && !isAllowedForGuest("Barangay Certificate") ? "disabled-card" : ""}`}
                  onClick={goToServices}
                  id="Barangay Certificate"
                >
                  <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                  <h1>Barangay Certificate</h1>
                </div>
                {isGuest && !isAllowedForGuest("Barangay Certificate") && (
                  <span className="tooltip-text">Login/Verification required to request this document</span>
                )}
              </div>

              <div className="tooltip-wrapper">
                <div
                  className={`documents-card ${isGuest && !isAllowedForGuest("Barangay Indigency") ? "disabled-card" : ""}`}
                  onClick={goToServices}
                  id="Barangay Indigency"
                >
                  <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                  <h1>Barangay Indigency</h1>
                </div>
                {isGuest && !isAllowedForGuest("Barangay Indigency") && (
                  <span className="tooltip-text">Login/Verification required to request this document</span>
                )}
              </div>
            </div>

            <div className="documents-container-column">
              <div className="tooltip-wrapper">
                <div
                  className={`documents-card ${isGuest && !isAllowedForGuest("Barangay Clearance") ? "disabled-card" : ""}`}
                  onClick={goToServices}
                  id="Barangay Clearance"
                >
                  <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                  <h1>Barangay Clearance</h1>
                </div>
                {isGuest && !isAllowedForGuest("Barangay Clearance") && (
                  <span className="tooltip-text">Login/Verification required to request this document</span>
                )}
              </div>

              <div className="documents-card dropdown-container">
              <div className="card-content-up">
                <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                <h1>Barangay Permits</h1>
                </div>
                <div className="dropdown">
                  <p id="Business Permit" onClick={goToServices}>Business Permit</p>
                  <p id="Temporary Business Permit" onClick={goToServices}>Temporary Business Permit</p>
                  <p id="Construction" onClick={goToServices}>Construction Permit</p>
                  {permitOptions.map((title, index) => (
                    <p key={index} id={title} onClick={goToServices}>
                      {title}
                    </p>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        <div className="documents-lower">
          <div className="documents-container-column-other">
            <div className="documents-card" onClick={goToServices} id="Other Documents">
              <img src="/images/document.png" alt="Document Icon" className="document-icon" />
              <h1>Other Documents</h1>
            </div>
          </div>
        </div>
      </div>
*/}


    
<div className="services-section-withbg">
  {/* Left document cards */}
  <div className={`button-column button-left slide-in ${hasAnimated ? "slide-in-visible" : ""}`}>
    <div className="tooltip-wrapper">
      <div
        className={`documents-card ${isGuest && !isAllowedForGuest("Barangay Certificate") ? "disabled-card" : ""}`}
        onClick={goToServices}
        id="Barangay Certificate"
      >
        <img src="/images/document.png" alt="Document Icon" className="document-icon" />
        <h1>Barangay Certificate</h1>
      </div>
      {isGuest && !isAllowedForGuest("Barangay Certificate") && (
        <span className="tooltip-text">Login/Verification required to request this document</span>
      )}
    </div>

    <div className="tooltip-wrapper">
      <div
        className={`documents-card ${isGuest && !isAllowedForGuest("Barangay Indigency") ? "disabled-card" : ""}`}
        onClick={goToServices}
        id="Barangay Indigency"
      >
        <img src="/images/document.png" alt="Document Icon" className="document-icon" />
        <h1>Barangay Indigency</h1>
      </div>
      {isGuest && !isAllowedForGuest("Barangay Indigency") && (
        <span className="tooltip-text">Login/Verification required to request this document</span>
      )}
    </div>

    <div className="tooltip-wrapper">
      <div
        className={`documents-card ${isGuest && !isAllowedForGuest("Barangay Clearance") ? "disabled-card" : ""}`}
        onClick={goToServices}
        id="Barangay Clearance"
      >
        <img src="/images/document.png" alt="Document Icon" className="document-icon" />
        <h1>Barangay Clearance</h1>
      </div>
      {isGuest && !isAllowedForGuest("Barangay Clearance") && (
        <span className="tooltip-text">Login/Verification required to request this document</span>
      )}
    </div>
  </div>

  {/* Center image stack */}
  <div className="center-images">
    <img src="/images/bluebg1.png" alt="Background" className="background-services" />
    <img src="/images/kap_nobg.png" alt="Kapitan" className="kap-services" />

    <div className="services-explore-title">
      <h1>Explore Our Document Services</h1>
    </div>
  </div>

  {/* Right document cards */}
  <div className={`button-column button-right slide-in ${hasAnimated ? "slide-in-visible" : ""}`}>
    <div className="documents-card dropdown-container">
      <div className="card-content-up">
        <img src="/images/document.png" alt="Document Icon" className="document-icon" />
        <h1>Barangay Permits</h1>
      </div>
      <div className="dropdown">
        <p id="Business Permit" onClick={goToServices}>Business Permit</p>
        <p id="Temporary Business Permit" onClick={goToServices}>Temporary Business Permit</p>
        <p id="Construction" onClick={goToServices}>Construction Permit</p>
        {permitOptions.map((title, index) => (
          <p key={title.id || index} onClick={()=>handleSubmitOther(title)}>
            {title.title}
          </p>
        ))}
      </div>
    </div>
    
    <div className="documents-card" onClick={goToServices} id="Other Documents">
      <img src="/images/document.png" alt="Document Icon" className="document-icon" />
      <h1>Other Documents</h1>
    </div>
  </div>
</div>

    </main>
  );
}
