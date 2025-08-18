"use client";
import { useState } from "react";

import Link from "next/link";
import "@/CSS/BMenu/header.css";
import React from "react";


const BMenu: React.FC = () => {

  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  return (
    <div className="side-bar-brgyside">
      <div className="logo-side-bar-brgyside">
        <img src="/images/QClogo.png" alt="Barangay Captain" className="logo-image-side-bar-brgyside" />
      </div>

      <div className="contents-side-bar-brgyside">
       
          {/* Dashboard Module */}
      <div className="dropdown-wrapper-brgyside"
          onMouseEnter={() => setHoveredDropdown("dashboard")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >

        <div className="dropdown-button-brgyside">
        
          <Link href="/dashboard">Dashboard</Link>
          <img 
              src={hoveredDropdown === "dashboard" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow-brgyside" 
            />
        </div>
        <div className="dropdown-container-brgyside">
          <Link href="/dashboard/ReportsModule" className="dropdown-item-brgy-brgyside">Generate Report</Link>
        </div>
      </div>

        
        {/* User & Roles */}
        <div className="dropdown-wrapper-brgyside"
          onMouseEnter={() => setHoveredDropdown("user&roles")}
          onMouseLeave={() => setHoveredDropdown(null)}
        >

          <div className="dropdown-button-brgyside">
            <Link href="/dashboard/admin/BarangayUsers">User and Roles</Link>
            <img 
                src={hoveredDropdown === "user&roles" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
                alt="Menu Icon" 
                className="arrow-brgyside" 
              />
          </div>

          <div className="dropdown-container-brgyside">
            <Link href="/dashboard/admin/BarangayUsers" className="dropdown-item-brgy-brgyside">Barangay Users</Link>
            <Link href="/dashboard/admin/ResidentUsers" className="dropdown-item-brgy-brgyside">Resident Users</Link>
            

          </div>
        </div>

        {/* Resident Management */}
        <div className="dropdown-wrapper-brgyside"
          onMouseEnter={() => setHoveredDropdown("resident")}
          onMouseLeave={() => setHoveredDropdown(null)}
        >
          
        <div className="dropdown-button-brgyside">
          <Link href="/dashboard/ResidentModule">Residents Management</Link>
          <img 
              src={hoveredDropdown === "resident" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow-brgyside" 
            />
        </div>


          <div className="dropdown-container-brgyside">
            <Link href="/dashboard/ResidentModule" className="dropdown-item-brgy-brgyside">Main Residents</Link>
            <Link href="/dashboard/ResidentModule/registeredVoters" className="dropdown-item-brgy-brgyside">Registered Voters</Link>
            <Link href="/dashboard/ResidentModule/kasambahayList" className="dropdown-item-brgy-brgyside">Kasambahay Master List</Link>
            <Link href="/dashboard/ResidentModule/FirstTimeJobSeeker" className="dropdown-item-brgy-brgyside">First-Time Job Seekers List</Link>

          </div>
        </div>

 
        <div className="dropdown-wrapper-brgyside"
          onMouseEnter={() => setHoveredDropdown("officials")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >
          
        <div className="dropdown-button-brgyside">
          <Link  href="/dashboard/OfficialsModule">Officials Management</Link>
          <img 
              src={hoveredDropdown === "officials" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow-brgyside" 
            />
        </div>
          
          <div className="dropdown-container-brgyside">
            <Link href="/dashboard/OfficialsModule" className="dropdown-item-brgy-brgyside">Barangay Officials</Link>
            <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item-brgy-brgyside">Sitio/HOA Officers</Link>
          </div>
        </div>



        {/* Services Module */}
        <div className="dropdown-wrapper-brgyside"
          onMouseEnter={() => setHoveredDropdown("services")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >

        <div className="dropdown-button-brgyside">
          <Link href="/dashboard/ServicesModule/InBarangayRequests">Services Management</Link>
          <img 
              src={hoveredDropdown === "services" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow-brgyside" 
            />
        </div>

          <div className="dropdown-container-brgyside">
            <Link href="/dashboard/ServicesModule/InBarangayRequests" className="dropdown-item-brgy-brgyside">In Barangay Requests</Link>
            <Link href="/dashboard/ServicesModule/OnlineRequests" className="dropdown-item-brgy-brgyside">Online Requests</Link>
            <Link href="/dashboard/ServicesModule/Appointments" className="dropdown-item-brgy-brgyside">Appointments</Link>
          </div>
        </div>

      {/* Incident Module */}
      <div className="dropdown-wrapper-brgyside"
          onMouseEnter={() => setHoveredDropdown("incidents")}
          onMouseLeave={() => setHoveredDropdown(null)}
      >

        <div className="dropdown-button-brgyside">
          <Link href="/dashboard/IncidentModule/Department?id=Lupon">Incident Management</Link>
          <img 
              src={hoveredDropdown === "incidents" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
              alt="Menu Icon" 
              className="arrow-brgyside" 
            />
        </div>
        <div className="dropdown-container-brgyside">
          <Link href="/dashboard/IncidentModule/Department?id=Lupon" className="dropdown-item-brgy-brgyside">Lupon</Link>
          <Link href="/dashboard/IncidentModule/Department?id=GAD" className="dropdown-item-brgy-brgyside">GAD</Link>
          <Link href="/dashboard/IncidentModule/Department?id=BCPC" className="dropdown-item-brgy-brgyside">BCPC</Link>
          <Link href="/dashboard/IncidentModule/Department?id=VAWC" className="dropdown-item-brgy-brgyside">VAWC</Link>
          <Link href="/dashboard/IncidentModule/OnlineReports" className="dropdown-item-brgy-brgyside">Online Reports</Link>
        </div>
      </div>


        {/* For 
          <Link href="/dashboard/announcements" className="module-title-brgyside">Announcements</Link>
        */}

{/* For CAP2 */}
{/*
          <div className="dropdown-wrapper-brgyside"
            onMouseEnter={() => setHoveredDropdown("programs")}
            onMouseLeave={() => setHoveredDropdown(null)}
        >

            <div className="dropdown-button-brgyside">
              <Link href="/dashboard">Program</Link>
              <img 
                  src={hoveredDropdown === "programs" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
                  alt="Menu Icon" 
                  className="arrow-brgyside" 
                />
            </div>
            <div className="dropdown-container-brgyside">
            <Link href="/dashboard/ProgramsModule" className="dropdown-item-brgy-brgyside">Volunteer Programs</Link>
            <Link href="/dashboard/ProgramsModule/ProgramResponses" className="dropdown-item-brgy-brgyside">Program Responses</Link>
            </div>
        </div> */}

          {/* Events Module */}
          {/*
           <div className="dropdown-wrapper-brgyside"
            onMouseEnter={() => setHoveredDropdown("events")}
            onMouseLeave={() => setHoveredDropdown(null)}
          >

            <div className="dropdown-button-brgyside">
              <Link href="/dashboard">Events</Link>
              <img 
                  src={hoveredDropdown === "events" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
                  alt="Menu Icon" 
                  className="arrow-brgyside" 
                />
            </div>
            <div className="dropdown-container-brgyside">
            <Link href="/dashboard/EventsModule" className="dropdown-item-brgy-brgyside">Events List</Link>
            <Link href="/dashboard/EventsModule/EventResponses" className="dropdown-item-brgy-brgyside">Event Responses</Link>
            </div>
        </div>   
        */}

{/* fix redirection links nalang */}
        <div className="dropdown-wrapper-brgyside"
            onMouseEnter={() => setHoveredDropdown("programs")}
            onMouseLeave={() => setHoveredDropdown(null)}
        >

            <div className="dropdown-button-brgyside">
              <Link href="/dashboard">Programs Management</Link>
              <img 
                  src={hoveredDropdown === "programs" ? "/Images/left-arrow.png" : "/Images/down-arrow.png"} 
                  alt="Menu Icon" 
                  className="arrow-brgyside" 
                />
            </div>
            <div className="dropdown-container-brgyside">
            <Link href="/dashboard/ProgramsModule/ProgramsAndEvents" className="dropdown-item-brgy-brgyside">Programs / Events</Link>
            <Link href="/dashboard/ProgramsModule/ProgramResponses" className="dropdown-item-brgy-brgyside">Announcements</Link>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BMenu;
