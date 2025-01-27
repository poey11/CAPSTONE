"use client";
import Link from "next/link";

const bMenu: React.FC = () => {
  /* Will add role base access later */
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
      <Link
        href="/dashboard/residentManagement"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Resident Managment
      </Link>
      <Link
        href="/dashboard/officials"
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
