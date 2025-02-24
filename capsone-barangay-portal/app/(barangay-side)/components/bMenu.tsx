"use client";
import { useState } from "react";

import Link from "next/link";
import "@/CSS/BMenu/header.css";

const BMenu: React.FC = () => {

  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);

  return (
    <div className="header bg-slate-400">
      <div className="logo">
        <img src="/Images/QClogo.png" alt="Barangay Captain" className="logo-image" />
      </div>

      <div className="contents">

       
          {/* Dashboard Module */}
      <div className="dropdown-wrapper"
          onMouseEnter={() => setHoveredDropdown("dashboard")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >

        <div className="dropdown-button">
          <Link href="/dashboard">Dashboard</Link>
          <img 
              src={hoveredDropdown === "dashboard" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow" 
            />
        </div>
        <div className="dropdown-container">
          <Link href="/dashboard/ReportsModule" className="dropdown-item">Generate Report</Link>
        </div>
      </div>

        
        <Link href="/dashboard/admin" className="module">User and Roles</Link>

        {/* Resident Management */}
        <div className="dropdown-wrapper"
          onMouseEnter={() => setHoveredDropdown("resident")}
          onMouseLeave={() => setHoveredDropdown(null)}
        >
          
        <div className="dropdown-button">
          <Link href="/dashboard/ResidentModule">Residents Management</Link>
          <img 
              src={hoveredDropdown === "resident" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow" 
            />
        </div>


          <div className="dropdown-container">
            <Link href="/dashboard/ResidentModule" className="dropdown-item">Main Residents</Link>
            <Link href="/dashboard/ResidentModule/registeredVoters" className="dropdown-item">Registered Voters</Link>
          </div>
        </div>

        {/* Officials Module */}
        <div className="dropdown-wrapper"
          onMouseEnter={() => setHoveredDropdown("officials")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >
          
        <div className="dropdown-button">
          <Link  href="/dashboard/OfficialsModule">Officials Module</Link>
          <img 
              src={hoveredDropdown === "officials" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow" 
            />
        </div>
          
          <div className="dropdown-container">
            <Link href="/dashboard/OfficialsModule" className="dropdown-item">Officials</Link>
            <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Sitio/HOA Officers</Link>
          </div>
        </div>



        {/* Services Module */}
        <div className="dropdown-wrapper"
          onMouseEnter={() => setHoveredDropdown("services")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >

        <div className="dropdown-button">
          <Link href="/dashboard/ServicesModule/InBarangayRequests">Services Management</Link>
          <img 
              src={hoveredDropdown === "services" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow" 
            />
        </div>

          <div className="dropdown-container">
            <Link href="/dashboard/ServicesModule/InBarangayRequests" className="dropdown-item">In Barangay Requests</Link>
            <Link href="/dashboard/ServicesModule/OnlineRequests" className="dropdown-item">Online Requests</Link>
            <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Appointments</Link>
          </div>
        </div>

      {/* Incident Module */}
      <div className="dropdown-wrapper"
          onMouseEnter={() => setHoveredDropdown("incidents")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >

        <div className="dropdown-button">
          <Link href="/dashboard/IncidentModule">Incident Management</Link>
          <img 
              src={hoveredDropdown === "incidents" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow" 
            />
        </div>
        <div className="dropdown-container">
          <Link href="/dashboard/IncidentModule/Lupon" className="dropdown-item">Lupon</Link>
          <Link href="/dashboard/IncidentModule/GAD" className="dropdown-item">GAD</Link>
          <Link href="/dashboard/IncidentModule/BCPC" className="dropdown-item">BCPC</Link>
          <Link href="/dashboard/IncidentModule/VAWC" className="dropdown-item">VAWC</Link>
        </div>
      </div>

        <Link href="/dashboard/announcements" className="module">Announcements</Link>
        <Link href="/programs" className="module">Programs and Events</Link>
      </div>
    </div>
  );
};

export default BMenu;
