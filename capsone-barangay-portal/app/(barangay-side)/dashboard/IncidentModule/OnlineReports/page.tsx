"use client";
import "@/CSS/IncidentModule/OnlineReporting.css";
import { useState, useEffect } from "react";
import { getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import { useRouter } from "next/navigation";

const statusOptions = ["All", "Acknowledged", "Pending"];

export default function OnlineReports() {
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    const unsubscribe = getAllSpecificDocument("IncidentReports", "department", "==", "Online", setIncidentData);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let data = [...incidentData];
  
    if (searchQuery) {
      data = data.filter((incident) =>
        typeof incident.caseNumber === "string" && incident.caseNumber.includes(searchQuery)
      );
    }
  
    if (selectedStatus !== "All") {
      data = data.filter((incident) => incident.status === selectedStatus);
    }
  
    setFilteredData(data);
  }, [incidentData, searchQuery, selectedStatus]);
  

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
        <input
          type="text"
          className="search-bar"
          placeholder="Enter Incident Case Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="featuredStatus"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
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
              <th>Case Number</th>
              <th>Complainant's First Name</th>
              <th>Complainant's Last Name</th>
              <th>Date Filed</th>
              <th>Concern</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((incident, index) => (
              <tr key={index}>
                <td>{incident.caseNumber || "N/A"}</td>
                <td>{incident.firstname}</td>
                <td>{incident.lastname}</td>
                <td>{incident.date}</td>
                <td>{incident.concern}</td>
                <td>
                  <span className={`status-badge ${incident.status.toLowerCase().replace(" ", "-")}`}>
                    {incident.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="action-notify" onClick={handleViewOnlineReport}>View</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center" }}>No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
