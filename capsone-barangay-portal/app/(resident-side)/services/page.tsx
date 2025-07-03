"use client";
import { useAuth } from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsmain/requestdocumentsmain.css";
import { useRouter } from "next/navigation";

export default function Services() {
  const user = useAuth().user;
  const router = useRouter();

  const isGuest = !user;

  const isAllowedForGuest = (docType: string) => {
    return (
      docType === "Temporary Business Permit" ||
      docType === "Business Permit" ||
      docType === "Construction Permit"
    );
  };

  const goToServices = (e: any) => {
    const action = e.currentTarget.id;
    if (isGuest && !isAllowedForGuest(action)) return;
    router.push(`/services/action?doc=${action}`);
  };

  const gotoOtherDocuments = () => {
    router.push("/services/other-documents");
  }

  return (
    <main className="services-container-document">
      <div className="headerpic-services">
        <p>SERVICES</p>
      </div>

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
                          <span className="tooltip-text">Login required to request this document</span>
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
                          <span className="tooltip-text">Login required to request this document</span>
                        )}
                      </div>

                
               </div>


               <div className="documents-container-column">

                     <div className="documents-card dropdown-container">
                      <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                      <h1>Barangay Permits</h1>
                      <div className="dropdown">
                        <p id="Temporary Business Permit" onClick={goToServices}>Temporary Business Permit</p>
                        <p id="Business Permit" onClick={goToServices}>Business Permit</p>
                        <p id="Construction Permit" onClick={goToServices}>Construction Permit</p>
                      </div>
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
                        <span className="tooltip-text">Login required to request this document</span>
                      )}

                    </div>


               </div>

                


              
              </div>

          </div>

          <div className="documents-lower">

                <div className="documents-container-column-other">
               
                    <div className="documents-card" onClick={gotoOtherDocuments}>
                      <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                      <h1>Other Documents</h1>
                    </div>  
                  
              </div>

          </div>
        </div>
   
    </main>
  );
}
