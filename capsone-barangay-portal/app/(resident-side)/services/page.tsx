"use client";
import type { Metadata } from "next";
import { useAuth } from "@/app/context/authContext";
import "@/CSS/ServicesPage/requestdocumentsmain/requestdocumentsmain.css";
import Link from "next/link";
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

  return (
    <main className="services-container">
      <div className="headerpic-services">
        <p>SERVICES</p>
      </div>

      <div className="services-main-container">
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

            <div className="tooltip-wrapper">
              <div
                className={`documents-card ${isGuest && !isAllowedForGuest("Barangay ID") ? "disabled-card" : ""}`}
                onClick={goToServices}
                id="Barangay ID"
              >
                <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                <h1>Barangay ID</h1>
              </div>
              {isGuest && !isAllowedForGuest("Barangay ID") && (
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

            <div className="tooltip-wrapper">
              <div
                className={`documents-card ${isGuest && !isAllowedForGuest("First Time Jobseeker") ? "disabled-card" : ""}`}
                onClick={goToServices}
                id="First Time Jobseeker"
              >
                <img src="/images/document.png" alt="Document Icon" className="document-icon" />
                <h1>First Time Jobseeker</h1>
              </div>
              {isGuest && !isAllowedForGuest("First Time Jobseeker") && (
                <span className="tooltip-text">Login required to request this document</span>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
