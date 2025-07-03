"use client";
import { useState } from "react";

import Link from "next/link";
import "@/CSS/BMenu/header.css";
import React from "react";


const BMenu: React.FC = () => {

  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  return (
    <div className="side-bar">
      <div className="logo-side-bar">
        <img src="/Images/QClogo.png" alt="Barangay Captain" className="logo-image-side-bar" />
      </div>

      <div className="contents-side-bar">
       
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
          <Link href="/dashboard/ReportsModule" className="dropdown-item-brgy">Generate Report</Link>
        </div>
      </div>

        
        {/* User & Roles */}
        <div className="dropdown-wrapper"
          onMouseEnter={() => setHoveredDropdown("user&roles")}
          onMouseLeave={() => setHoveredDropdown(null)}
        >

          <div className="dropdown-button">
            <Link href="/dashboard/admin/BarangayUsers">User and Roles</Link>
            <img 
                src={hoveredDropdown === "user&roles" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
                alt="Menu Icon" 
                className="arrow" 
              />
          </div>

          <div className="dropdown-container">
            <Link href="/dashboard/admin/BarangayUsers" className="dropdown-item-brgy">Barangay Users</Link>
            <Link href="/dashboard/admin/PendingResidentUsers" className="dropdown-item-brgy">Pending Resident Users</Link>
            <Link href="/dashboard/admin/ResidentUsers" className="dropdown-item-brgy">Resident Users</Link>
            

          </div>
        </div>

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
            <Link href="/dashboard/ResidentModule" className="dropdown-item-brgy">Main Residents</Link>
            <Link href="/dashboard/ResidentModule/registeredVoters" className="dropdown-item-brgy">Registered Voters</Link>
            <Link href="/dashboard/ResidentModule/kasambahayList" className="dropdown-item-brgy">Kasambahay Master List</Link>
            <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker" className="dropdown-item-brgy">First-Time Job Seekers List</Link>

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
            <Link href="/dashboard/OfficialsModule" className="dropdown-item-brgy">Officials</Link>
            <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item-brgy">Sitio/HOA Officers</Link>
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
            <Link href="/dashboard/ServicesModule/InBarangayRequests" className="dropdown-item-brgy">In Barangay Requests</Link>
            <Link href="/dashboard/ServicesModule/OnlineRequests" className="dropdown-item-brgy">Online Requests</Link>
            <Link href="/dashboard/ServicesModule/Appointments" className="dropdown-item-brgy">Appointments</Link>
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
          <Link href="/dashboard/IncidentModule/Department?id=Lupon" className="dropdown-item-brgy">Lupon</Link>
          <Link href="/dashboard/IncidentModule/Department?id=GAD" className="dropdown-item-brgy">GAD</Link>
          <Link href="/dashboard/IncidentModule/Department?id=BCPC" className="dropdown-item-brgy">BCPC</Link>
          <Link href="/dashboard/IncidentModule/Department?id=VAWC" className="dropdown-item-brgy">VAWC</Link>
          <Link href="/dashboard/IncidentModule/OnlineReports" className="dropdown-item-brgy">Online Reports</Link>
        </div>
      </div>

        <Link href="/dashboard/announcements" className="module-title">Announcements</Link>


{/* For CAP2 */}

            {/* Programs and Events Module
          <div className="dropdown-wrapper"
            onMouseEnter={() => setHoveredDropdown("programs")}
            onMouseLeave={() => setHoveredDropdown(null)}
        >

            <div className="dropdown-button">
              <Link href="/dashboard">Programs</Link>
              <img 
                  src={hoveredDropdown === "programs" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
                  alt="Menu Icon" 
                  className="arrow" 
                />
            </div>
            <div className="dropdown-container">
            <Link href="/dashboard/ProgramsModule" className="dropdown-item-brgy">Volunteer Programs</Link>
            <Link href="/dashboard/ProgramsModule/ProgramResponses" className="dropdown-item-brgy">Program Responses</Link>
            </div>
        </div> */}

          {/* Events Module */}
          {/* <div className="dropdown-wrapper"
            onMouseEnter={() => setHoveredDropdown("events")}
            onMouseLeave={() => setHoveredDropdown(null)}
          >

            <div className="dropdown-button">
              <Link href="/dashboard">Events</Link>
              <img 
                  src={hoveredDropdown === "events" ? "/images/left-arrow.png" : "/images/down-arrow.png"} 
                  alt="Menu Icon" 
                  className="arrow" 
                />
            </div>
            <div className="dropdown-container">
            <Link href="/dashboard/EventsModule" className="dropdown-item-brgy">Events List</Link>
            <Link href="/dashboard/EventsModule/EventResponses" className="dropdown-item-brgy">Event Responses</Link>
            </div>
        </div>   */}

      </div>
    </div>
  );
};

export default BMenu;
