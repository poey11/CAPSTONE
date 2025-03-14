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

export default function OnlineReports() {
  const [incidentData, setIncidentData] = useState([
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Acknowledged" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
    { ComplainantFirstName: "Malcolm", ComplainantLastName: "Payao", DateFiled: "2024-02-01", Concern: "Robbery", Status: "Pending" },
   
  ]);

  const handleStatusChange = (index: number, newStatus: string) => {
    setIncidentData((prev) =>
      prev.map((incident, i) => (i === index ? { ...incident, Status: newStatus } : incident))
    );
  };

  const router = useRouter();

    const handleViewOnlineReport = () => {
      router.push("/dashboard/IncidentModule/OnlineReports/ViewOnlineReport");
    };


  
  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Online Reports</h1>
      </div>

      <div className="section-2">
        <input type="text" className="search-bar" placeholder="Enter Incident Case" />
        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Show...</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

      <div className="main-section">
        <table>
          <thead>
            <tr>
              <th>Complainant's First Name</th>
              <th>Complainant's Last Name</th>
              <th>Date Filed</th>
              <th>Concern</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidentData.map((incident, index) => (
              <tr key={index}>
                <td>{incident.ComplainantFirstName}</td>
                <td>{incident.ComplainantLastName}</td>
                <td>{incident.DateFiled}</td>
                <td>{incident.Concern}</td>
                <td>
                    <span className={`status-badge ${incident.Status.toLowerCase().replace(" ", "-")}`}>
                        {incident.Status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="action-notify" onClick={handleViewOnlineReport}>Notify</button>
                    <button className="action-edit" >Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
