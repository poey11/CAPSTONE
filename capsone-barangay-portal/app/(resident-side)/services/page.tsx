"use client";
import type { Metadata } from "next";
import Link from "next/link";

const metadata: Metadata = {
  title: "Services",
  description: "Services page for the barangay website",
};

export default function Services() {
  return (
    <div className="services-container">
      <div className="services-headerpic">
        <p>SERVICES</p>
      </div>

      <div className="services-content">
        <div className="documents-container">
          <div className="documents-container-row">
            <div className="documents-card dropdown-container">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay Clearance</h1>
              <div className="dropdown">
                <Link href="/services/barangayclearance/residency">
                  <p>Residency</p>
                </Link>
                <Link href="/services/barangayclearance/others">
                    <p>Others</p>
                </Link>
              </div>
            </div>
            <div className="documents-card">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay Indigency</h1>
            </div>
            <div className="documents-card">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay ID</h1>
            </div>
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
                    <Link href="/services/barangayclearance/temporary-business">
                    <p>New</p>
                    </Link>
                    <Link href="/services/barangayclearance/construction">
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
                    <Link href="/services/barangayclearance/temporary-business">
                    <p>New</p>
                    </Link>
                    <Link href="/services/barangayclearance/construction">
                    <p>Renewal</p>
                    </Link>
                </div>
              </div>
                <Link href="/services/barangayclearance/others">
                  <p>Construction Permit</p>
                </Link>
                <Link href="/services/barangayclearance/others">
                  <p>Liquor Permit</p>
                </Link>
                <Link href="/services/barangayclearance/others">
                  <p>COOP</p>
                </Link>
              </div>
            </div>
            <div className="documents-card">
              <img
                src="/images/document.png"
                alt="Document Icon"
                className="document-icon"
              />
              <h1>Barangay Certificates</h1>
            </div>
            <div className="documents-card">
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

      <style jsx>{`
        .services-container {
          font-family: Arial, sans-serif;
          background-color: #ffe0ca;
          color: #333;
          margin: 0;
          width: 100%;
          height: 100vh;
        }

        .services-headerpic {
          background-image: url("/images/header.jpg");
          background-size: cover;
          background-position: 50% 50%;
          background-repeat: no-repeat;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 40px;
          font-weight: bold;
          position: relative;
        }

        .services-headerpic::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          z-index: 1;
        }

        .services-headerpic > * {
          position: relative;
          z-index: 2;
        }

        .services-content {
          background-color: rgba(255, 255, 255, 0.9);
          padding: 20px;
          margin-top: 70px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 150px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 1000px;
        }

        .documents-container {
          max-width: 1200px;
          margin-top: 50px;
          margin-bottom: 10px;
          margin-left: 50px;
          margin-right: 50px;
          display: flex;
          gap: 40px;
          justify-content: center;
          align-items: center;
        }

        .documents-container h1 {
          color: #ed7014;
          font-size: 20px;
        }

        documents-container-row {
          display: block;
        }

        .documents-card {
          flex: 1 1 calc(50% - 20px);
          background-color: rgba(237, 112, 20, 0.3);
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 10, 0.3);
          height: 70px;
          width: 350px;
          margin-bottom: 40px;
          transition: all 0.3s ease;
          display: flex;
          gap: 40px;
          align-items: center;
          z-index: 10;
        }

        .documents-card:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
          background-color: rgba(237, 112, 20, 0.4);
          cursor: pointer;
        }

        .document-icon {
          max-width: 100%;
          height: 40px;
          width: 40px;
        }

        .dropdown-container:hover .dropdown,
        .dropdown-container .dropdown:hover {
            display: block; /* Ensure the dropdown stays open when interacting with it */
        }

        .dropdown-container {
            position: relative;
        }

        .dropdown {
            display: none;
            position: absolute;
            top: 70px; /* Aligns directly below the container */
            left: 0;
            background-color: rgb(246, 195, 159);
            border: 1px solid #ddd;
            border-radius: 0px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 10px;
            z-index: 100; /* Ensure dropdown is above other elements */
            width: 350px; /* Optional: Set a minimum width for the dropdown */
        }

        .dropdown p {
            margin: 0;
            padding: 5px 10px;
            color: #333;
            font-size: 14px;
            cursor: pointer;
        }

        .dropdown p:hover {
            background-color: rgba(237, 112, 20, 0.3); /* Highlight option on hover */
        }

        
        /* Nested Dropdown */
        .nested-dropdown-container {
            position: relative;
        }

        .nested-trigger {
            margin: 0;
            padding: 5px 10px;
            cursor: pointer;
        }

        .nested-dropdown {
            display: none; /* Hidden by default */
            padding: 5px 10px;
            background-color: #f6c39f;
            border-radius: 8px;
            margin-top: 5px;
            animation: fadeIn 0.2s ease-in-out;
        }

        .nested-dropdown p {
            margin: 0;
            padding: 5px 10px;
            cursor: pointer;
        }

        /* Hover Behavior */
            .nested-trigger:hover + .nested-dropdown {
            display: block;
        }

        /* Optional: Animation */
        @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
        }

    
      `}</style>
    </div>
  );
}

