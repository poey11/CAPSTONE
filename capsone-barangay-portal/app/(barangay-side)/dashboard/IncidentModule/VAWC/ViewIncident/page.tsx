"use client"
import "@/CSS/IncidentModule/ViewIncident.css";
import type { Metadata } from "next";
import { useState } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";

const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function ViewVAWC() {
  const statusOptions = ["Pending", "Resolved", "Settled", "Archived"];
  const status = "Pending"; // Example status

  const complainantsData = {
    name: "Jonnell Quebal",
    sex: "Male",
    age: 33,
    civilStatus: "Single",
    contact: "09171218101",
  };

  const respondentsData = {
    name: "Jonnell Quebal",
    sex: "Male",
    age: 33,
    civilStatus: "Single",
    contact: "09171218101",
  };

  const otherinformation = {
    nature: "Robbery",
    date: "2025-01-03",
    location: "Fairview",
  };

  const complainantsFields = [
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Contact", key: "contact" },
  ];

  const respondentsFields = [
    { label: "Name", key: "name" },
    { label: "Age", key: "age" },
    { label: "Sex", key: "sex" },
    { label: "Civil Status", key: "civilStatus" },
    { label: "Contact", key: "contact" },
  ];

  const otherinformationFields = [
    { label: "Nature", key: "nature" },
    { label: "Date", key: "date" },
    { label: "Location", key: "location" },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "Resolved":
        return "resolved";
      case "Settled":
        return "settled";
      case "Archived":
        return "archived";
      default:
        return "";
    }
  };

  const router = useRouter();

  const handleViewVAWC = () => {
      router.push("/dashboard/IncidentModule/VAWC");
  };

  
  return (
    <main className="main-container">

        <div className="status-section">
            <p className={`status-badge ${getStatusClass(status)}`}>{status}</p> 
        </div>

     
      <div className="main-content">
        <div className="section-1">
    
            <button type="submit" className="back-button" onClick={handleViewVAWC}></button>
          <p>Complainant's Details</p>
        </div>

        {complainantsFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{complainantsData[field.key as keyof typeof complainantsData]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="section-1">
          <p>Respondent's Details</p>
        </div>

        {respondentsFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{respondentsData[field.key as keyof typeof respondentsData]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content">
        <div className="section-1">
          <p>Other's Information</p>
        </div>

        {otherinformationFields.map((field) => (
          <div className="details-section" key={field.key}>
            <div className="title">
              <p>{field.label}</p>
            </div>
            <div className="description">
              <p>{otherinformation[field.key as keyof typeof otherinformation]}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
