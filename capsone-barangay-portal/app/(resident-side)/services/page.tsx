"use client";
import type { Metadata } from "next";
import "@/CSS/ServicesPage/requestdocumentsmain/requestdocumentsmain.css";
import Link from "next/link";

const metadata: Metadata = {
  title: "Services",
  description: "Services page for the barangay website",
};

export default function Services() {
  return (
    <main className="services-container">
      <div className="headerpic">
        <p>SERVICES</p>
      </div>



    <div className="services-main-container">
      <div className="documents-container">
        <div className="documents-container-row">
            <div className="documents-card dropdown-container">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay Certificate</h1>
              <div className="dropdown">
                <Link href="/services/barangaycertificate/residency">
                  <p>Residency</p>
                </Link>
                <Link href="/services/barangaycertificate/others">
                    <p>Others</p>
                </Link>
              </div>
            </div>
            <Link href="/services/barangayindigency">
              <div className="documents-card">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay Indigency</h1>
              </div>
            </Link>

            <Link href="/services/barangayID">
              <div className="documents-card">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay ID</h1>
              </div>
            </Link>
            
          </div>
        
          <div className="documents-container-row">
            <div className="documents-card dropdown-container">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay Permits</h1>
              <div className="dropdown">

              <div
                className="nested-dropdown-container"
                onMouseEnter={(e) => {
                    const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                    if (dropdown) {
                    dropdown.style.display = 'block';
                    }
                }}
                onMouseLeave={(e) => {
                    const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                    if (dropdown) {
                    dropdown.style.display = 'none';
                    }
                }}
                >
                <p className="nested-trigger">Business Permit</p>
                <div className="nested-dropdown">
                    <Link href="/services/barangaypermit/businesspermit/new">
                    <p>New</p>
                    </Link>
                    <Link href="/services/barangaypermit/businesspermit/renewal">
                    <p>Renewal</p>
                    </Link>
                </div>
              </div>
                
              <div
                className="nested-dropdown-container"
                onMouseEnter={(e) => {
                    const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                    if (dropdown) {
                    dropdown.style.display = 'block';
                    }
                }}
                onMouseLeave={(e) => {
                    const dropdown = e.currentTarget.querySelector('.nested-dropdown') as HTMLElement | null;
                    if (dropdown) {
                    dropdown.style.display = 'none';
                    }
                }}
                >
                <p className="nested-trigger">Temporary Business Permit</p>
                <div className="nested-dropdown">
                    <Link href="/services/barangaypermit/tempbusinesspermit/new">
                    <p>New</p>
                    </Link>
                    <Link href="/services/barangaypermit/tempbusinesspermit/renewal">
                    <p>Renewal</p>
                    </Link>
                </div>
              </div>
                <Link href="/services/barangaypermit/constructionpermit">
                  <p>Construction Permit</p>
                </Link>
                <Link href="/services/barangaypermit/liquorpermit">
                  <p>Liquor Permit</p>
                </Link>
                <Link href="/services/barangaypermit/coop">
                  <p>COOP</p>
                </Link>
              </div>
            </div>
            <Link href="/services/barangayclearance">
              <div className="documents-card">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>Barangay Clearance</h1>
              </div>
            </Link>
            <Link href="/services/firsttimejobseeker">
              <div className="documents-card">
                <img
                  src="/images/document.png"
                  alt="Document Icon"
                  className="document-icon"
                />
                <h1>First Time Jobseeker</h1>
              </div>
            </Link>
          </div>





      </div>

    </div>



    </main>
  );
}