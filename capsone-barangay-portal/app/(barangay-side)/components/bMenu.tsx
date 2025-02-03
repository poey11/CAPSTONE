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
              href="/dashboard/residentManagement/mainResidents"
              className="px-4 py-2 text-black hover:bg-slate-500 hover:text-white"
            >
              Main Residents
            </Link>
            <Link
              href="/dashboard/residentManagement/registeredVoters"
              className="px-4 py-2 text-black hover:bg-slate-500 hover:text-white"
            >
              Registered Voters
            </Link>
          </div>
        )}
      </div>

      <Link
        href="/dashboard/OfficialsModule"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Officials Module
      </Link>
      <Link
        href="/dashboard/reports"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Reports Module
      </Link>
      <Link
        href="/dashboard/services"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Services Module
      </Link>
      <Link
        href="/dashboard/incidentManagement"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Incident Management Module
      </Link>
      <Link
        href="/dashboard/programs"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Programs Module
      </Link>
      <Link
        href="/"
        className="p-4 text-black hover:bg-slate-500 hover:text-white hover:cursor-pointer"
      >
        Log Out
      </Link>
    </div>
  );
};

export default bMenu;
