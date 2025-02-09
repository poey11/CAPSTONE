"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";

const bMenu: React.FC =  () => {


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
        href="/residentManagement"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Resident Managment
      </Link>
      <Link
        href="/officials"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Officials Module
      </Link>
      <Link
        href="/reports"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Reports Module
      </Link>
      <Link
        href="/services"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Services Module
      </Link>
      <Link
        href="/incidentManagement"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Incident Management Module
      </Link>
      <Link
        href="/programs"
        className="p-4 text-black hover:bg-slate-500 hover:text-white"
      >
        Programs Module
      </Link>
      <button
        onClick={() => signOut({callbackUrl: "/"})}
        className="p-4 text-black hover:bg-slate-500 hover:text-white hover:cursor-pointer text-left"
      >
        Log Out
      </button>
    </div>
  );
};

export default bMenu;
