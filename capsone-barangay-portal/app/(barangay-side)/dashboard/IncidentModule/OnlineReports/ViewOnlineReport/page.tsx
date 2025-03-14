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
    { label: "Proof Photo", key: "/Images/kap.jpg" },
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

                    {field.label === "Proof Photo" ? (
                        <img src={field.key} alt="Proof Photo" className="detail-section-image" />
                        ) : (
                        <p>{field.key}</p>
                        )}
            </div>
          </div>
        ))}
      </div>
    

    <div className="main-content-response-section">

        <div className="section-1-response">

        <h1 className="title-response-section">Respondent's Information</h1>

            <div className="official-section-online-report">


            <p>Respondent Officer</p>
                  <select 
                  id="" 
                  name="" 
                  className="online-report-input-field" 
                  required
                  defaultValue=""  
                  >
                  <option value="" disabled>Choose</option>
                  <option value="">Malcolm </option>
                  <option value="">Luen</option>
                  <option value="">Payao</option>
                  </select>

                    
                </div>


            <div className="fields-section-online-report">
                    <p>Investigation Report</p>
                <textarea 
                    className="description" 
                    placeholder="Enter Description"
                    rows={15}
                ></textarea>
             </div>
      
        </div>


        <div className="">

        </div>



        <div className="submit-response-section">
                 <button className="save-btn-online-report-response-section">Save</button>
        </div>

       

    </div>

    
    </main>
  );
}