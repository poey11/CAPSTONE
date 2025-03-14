"use client"
import "@/CSS/IncidentModule/OnlineReporting.css";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const metadata: Metadata = {
  title: "Incident Management Module",
  description: "Manage incidents efficiently with status tracking and actions",
};

const statusOptions = ["Acknowledged", "Pending"];

export default function ViewOnlineReports() {
  const incidentData = [
    { label: "First Name", key: "Malcolm" },
    { label: "Last Name", key: "Payao" },
    { label: "Date Of Incident", key: "2024-02-01" },
    { label: "Concern", key: "Broken Lamp Post at Payao Street" },
    { label: "Status", key: "Acknowledged" },
    { label: "Investigated By", key: "Jerico Ibanez" },
    { label: "Investigation Report", key: "The barangay promptly dispatched maintenance personnel to assess the broken lamp post after receiving the report, ensuring repairs were completed to restore proper lighting in the area." },
    { label: "Investigation Photo", key: "/Images/kap.jpg" },
  ];

  const router = useRouter();

  const handleViewOnlineReport = () => {
    router.push("/dashboard/IncidentModule/BCPC/ViewIncident");
  };

  return (
    <main className="main-container">
      <div className="main-content-view-online-report">

        <div className="section-1-online-report">
             <div className="section-1-online-report-left-side">
                <button type="button" className="back-button" onClick={() => router.back()}></button>
                <p>Online Report Details</p>
            </div>

                <div className="action-btn-section-online-report">
                     <button className="save-btn-online-report">Save</button>
                </div>
        </div>

        {incidentData.map((field, index) => (
          <div key={index} className="online-report-details-section">
            <div className="title-section">
              <p>{field.label}</p>
            </div>
            <div className="description-section">

                    {field.label === "Investigation Photo" ? (
                        <img src={field.key} alt="Investigation Photo" className="detail-section-image" />
                        ) : (
                        <p>{field.key}</p>
                        )}
            </div>
          </div>
        ))}
      </div>


    
    </main>
  );
}