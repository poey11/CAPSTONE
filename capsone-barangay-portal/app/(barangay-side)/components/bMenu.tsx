"use client";
import { useState } from "react";
import Link from "next/link";
import "@/CSS/BMenu/header.css";

const BMenu: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<"resident" | "officials" | "services" | "incidents"|null>(null);

  const toggleDropdown = (menu: "resident" | "officials"| "services" | "incidents") => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  return (
    <div className="header">
      <div className="logo">
        <img src="/Images/QClogo.png" alt="Barangay Captain" className="logo-image" />
      </div>

      <div className="contents">
        <Link href="/dashboard" className="module">Dashboard</Link>
        <Link href="/dashboard/admin" className="module">User and Roles</Link>

        {/* Resident Management */}
        <div className="dropdown-wrapper">
          <button onClick={() => toggleDropdown("resident")} className="dropdown-button">Resident Management</button>
          {openDropdown === "resident" && (
            <div className="dropdown-container">
              <Link href="/dashboard/ResidentModule" className="dropdown-item">Main Residents</Link>
              <Link href="/dashboard/ResidentModule/registeredVoters" className="dropdown-item">Registered Voters</Link>
            </div>
          )}
        </div>

        {/* Officials Module */}
        <div className="dropdown-wrapper">
          <button onClick={() => toggleDropdown("officials")} className="dropdown-button">Officials Module</button>
          {openDropdown === "officials" && (
            <div className="dropdown-container">
              <Link href="/dashboard/OfficialsModule" className="dropdown-item">Officials</Link>
              <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Sitio/HOA Officers</Link>
            </div>
          )}
        </div>

        <Link href="/reports" className="module">Reports Module</Link>

        {/* Services Module */}
        <div className="dropdown-wrapper">
          <button onClick={() => toggleDropdown("services")} className="dropdown-button">Services Module</button>
          {openDropdown === "services" && (
            <div className="dropdown-container">
              <Link href="/dashboard/ServicesModule/InBarangayRequests" className="dropdown-item">In Barangay Requests</Link>
              <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Online Requests</Link>
              <Link href="/dashboard/OfficialsModule/SitioHoaOfficers" className="dropdown-item">Appointments</Link>
            </div>
          )}
        </div>

          {/* Incident Module */}
          <div className="dropdown-wrapper">
          <button onClick={() => toggleDropdown("incidents")} className="dropdown-button">Incident Module</button>
          {openDropdown === "incidents" && (
            <div className="dropdown-container">
              <Link href="/dashboard/IncidentModule/Lupon" className="dropdown-item">Lupon</Link>
              <Link href="/dashboard/IncidentModule/GAD" className="dropdown-item">GAD</Link>
              <Link href="/dashboard/IncidentModule/BCPC" className="dropdown-item">BCPC</Link>
              <Link href="/dashboard/IncidentModule/VAWC" className="dropdown-item">VAWC</Link>
            </div>
          )}
        </div>


        <Link href="/dashboard/announcements" className="module">Announcements</Link>
        <Link href="/programs" className="module">Programs and Events</Link>
      </div>
    </div>
  );
};

export default BMenu;