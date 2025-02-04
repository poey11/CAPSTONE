"use client";
import { useState } from "react";
import Link from "next/link";
import "@/CSS/BMenu/header.css";


const bMenu: React.FC = () => {
  const [isResidentOpen, setIsResidentOpen] = useState(false);

  return (
    <div className="flex flex-col justify-center bg-slate-400 w-32 h-screen fixed">
      <Link
        href="/dashboard"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Dashboard
      </Link>
      <Link
        href="/dashboard/admin"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Admin Module
      </Link>

      <div className="contents">

          <Link
            href="/dashboard/admin"
              className="module"
          >
            User and Roles
          </Link>
     {/* Resident Management Dropdown */}
     <div className="relative">
        <button
          onClick={() => setIsResidentOpen(!isResidentOpen)}
          className="p-4 text-black hover:bg-slate-500 hover:text-white w-full text-left"
        >
          Resident Management
        </button>

        {isResidentOpen && (
          <div className="flex flex-col bg-white border rounded shadow-lg">
            <Link
              href="/dashboard/ResidentModule"
              className="px-4 py-2 text-black hover:bg-slate-500 hover:text-white"
            >
              Main Residents
            </Link>
            <Link
              href="/dashboard/ResidentModule/registeredVoters"
              className="px-4 py-2 text-black hover:bg-slate-500 hover:text-white"
            >
              Registered Voters
            </Link>
          </div>
        )}
      </div>
          <Link
            href="/dashboard/OfficialsModule"
            className="module"
          >
            Officials Module
          </Link>
          <Link
            href="/dashboard/reports"
            className="module"
            
          >
            Reports Module
          </Link>
          <Link
            href="/dashboard/services"
            className="module"
          >
            Services Module
          </Link>
          <Link
            href="/dashboard/incidentManagement"
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
            href="/dashboard/programs"
            className="module"
          >
           Programs and Events
          </Link>
         

      </div>
    
    </div>
  );
};

export default bMenu;
