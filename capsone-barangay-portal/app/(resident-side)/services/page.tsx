"use client";
import type { Metadata } from "next";
import "@/CSS/ServicesPage/requestdocumentsmain/requestdocumentsmain.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Services() {
  const router = useRouter();

  const goToServices = (e: any) => {
    const action = e.currentTarget.id;
    router.push(`/services/action?doc=${action}`);
  }
  
  

  return (
    <main className="services-container">
      <div className="headerpic">
        <p>SERVICES</p>
      </div>
      
      <div className="services-main-container">
        <div className="documents-container"  >
          <div className="documents-container-column">
            <div className="documents-card dropdown-container" onClick={goToServices} id="Barangay Certificate">
              <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay Certificate</h1>
            </div>

              <div className="documents-card"   id="Barangay Indigency" onClick={goToServices}>
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay Indigency</h1>
              </div>

              <div className="documents-card" onClick={goToServices} id="Barangay ID">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay ID</h1>
              </div>
            
          </div>


          <div className="documents-container-column">
          <div className="documents-card dropdown-container">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay Permits</h1>
              <div className="dropdown">
                
              <div className="nested-dropdown-container" >
                <p className="nested-trigger" onClick={goToServices} id="Temporary Business Permit" >Temporary Business Permit</p>
              </div>
                <p onClick={goToServices} id="Business Permit">Business Permit</p>
                <p onClick={goToServices} id="Construction Permit">Construction Permit</p>  
              </div>
            </div>
            
              <div className="documents-card" onClick={goToServices} id="Barangay Clearance">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay Clearance</h1>
              </div>
            
              <div className="documents-card" onClick={goToServices} id="First Time Jobseeker">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>First Time Jobseeker</h1>
              </div>
           

          </div>

        </div>
      </div>
    </main>
  );
}