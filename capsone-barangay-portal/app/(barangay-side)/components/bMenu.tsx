"use client";
import { useState } from "react";
import Link from "next/link";
import "@/CSS/BMenu/header.css";

const BMenu: React.FC = () => {

  const [openDropdown, setOpenDropdown] = useState<"resident" | "officials" | "services" | "incidents"|null>(null);

  return (
    <div className="header bg-slate-400">
      <div className="logo">
        <img src="/Images/QClogo.png" alt="Barangay Captain" className="logo-image" />
      </div>

      <div className="contents">

       
          {/* Dashboard Module */}
      <div className="dropdown-wrapper">
        <div className="dropdown-button">
          <Link href="/dashboard">Dashboard</Link>
        </div>
        <div className="dropdown-container">
          <Link href="/dashboard/ReportsModule" className="dropdown-item">Generate Report</Link>
        </div>
      </div>

        
        <Link href="/dashboard/admin" className="module">User and Roles</Link>

        {/* Resident Management */}
        <div className="dropdown-wrapper">
          
        <div className="dropdown-button">
          <Link href="/dashboard/ResidentModule">Residents Management</Link>
        </div>


          <div className="dropdown-container">
            <Link href="/dashboard/ResidentModule" className="dropdown-item">Main Residents</Link>
            <Link href="/dashboard/ResidentModule/registeredVoters" className="dropdown-item">Registered Voters</Link>
          </div>
        </div>

        {/* Officials Module */}
        <div className="dropdown-wrapper">
          
        <div className="dropdown-button">
          <Link  href="/dashboard/OfficialsModule">Officials Module</Link>
        </div>
          
          <div className="dropdown-container">
            <Link href="/dashboard/OfficialsModule" className="dropdown-item">Officials</Link>
            <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Sitio/HOA Officers</Link>
          </div>
        </div>

        <Link href="/reports" className="module">Reports Module</Link>

        {/* Services Module */}
        <div className="dropdown-wrapper">

        <div className="dropdown-button">
          <Link href="/dashboard/ServicesModule/InBarangayRequests">Services Management</Link>
        </div>

          <div className="dropdown-container">
            <Link href="/dashboard/ServicesModule/InBarangayRequests" className="dropdown-item">In Barangay Requests</Link>
            <Link href="/dashboard/ServicesModule/OnlineRequests" className="dropdown-item">Online Requests</Link>
            <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Appointments</Link>
          </div>
        </div>

      {/* Incident Module */}
      <div className="dropdown-wrapper">
        <div className="dropdown-button">
          <Link href="/dashboard/IncidentModule">Incident Management</Link>
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
