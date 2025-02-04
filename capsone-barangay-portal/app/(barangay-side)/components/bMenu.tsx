"use client";
import Link from "next/link";
import "@/CSS/BMenu/header.css";


const bMenu: React.FC = () => {
  /* Will add role base access later */
  return (
    <div className="header">

      <div className="logo" >
               <img 
                src="/Images/QClogo.png" 
                alt="Barangay Captain" 
                className="logo-image" 
      />

      </div>

      <div className="contents">

          <Link
            href="/dashboard"
            className="module"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/admin"
              className="module"
          >
            User and Roles
          </Link>
          <Link
            href="/dashboard/ResidentModule"
            className="module"
          >
            Resident Management Module
          </Link>
          <Link
            href="/dashboard/OfficialsModule"
            className="module"
          >
            Officials Module
          </Link>
          <Link
            href="/reports"
            className="module"
            
          >
            Reports Module
          </Link>
          <Link
            href="/services"
            className="module"
          >
            Services Module
          </Link>
          <Link
            href="/incidentManagement"
            className="module"
          >
            Incident Management Module
          </Link>
          <Link
            href="/dashboard/announcements"
            className="module"
          >
            Announcements
          </Link>

          <Link
            href="/programs"
            className="module"
          >
           Programs and Events
          </Link>
         

      </div>
    
    </div>
  );
};

export default bMenu;
