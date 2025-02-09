"use client"
import "@/CSS/IncidentModule/MainDashboardIncident.css";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";

const metadata: Metadata = {
  title: "Incident Management Module",
  description: "Manage incidents efficiently with status tracking and actions",
};

const statusOptions = ["Pending", "Resolved", "Settled", "Archived"];

export default function BCPCDepartment() {
  const [incidentData, setIncidentData] = useState([
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Resolved" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Pending" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Settled" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived" },
   

  ]);

  const handleStatusChange = (index: number, newStatus: string) => {
    setIncidentData((prev) =>
      prev.map((incident, i) => (i === index ? { ...incident, Status: newStatus } : incident))
    );
  };
  
  return (
    <main className="main-container">
      <div className="section-1">
        <h1>BCPC Department</h1>
        <Link href="/dashboard/IncidentModule/BCPC/AddIncident">
          <button className="add-announcement-btn">Add New Incident</button>
        </Link>
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
              <th>Complainant's Name</th>
              <th>Date Filed</th>
              <th>Nature of Complaint</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidentData.map((incident, index) => (
              <tr key={index}>
                <td>{incident.ComplainantName}</td>
                <td>{incident.DateFiled}</td>
                <td>{incident.Nature}</td>
                <td>
                    <span className={`status-badge ${incident.Status.toLowerCase().replace(" ", "-")}`}>
                        {incident.Status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                  <Link href="/dashboard/IncidentModule/BCPC/ViewIncident">
                    <button className="action-view">View</button>
                  </Link>
                    <button className="action-edit">Edit</button>
                    <button className="action-delete">Delete</button>
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
