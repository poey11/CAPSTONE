"use client"
import "@/CSS/IncidentModule/OnlineReporting.css";
import { useState, useEffect } from "react";
import { getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import { useRouter } from "next/navigation";


const statusOptions = ["Acknowledged", "Pending"];

export default function OnlineReports() {
  const [incidentData, setIncidentData] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = getAllSpecificDocument("IncidentReports","department","Online", setIncidentData);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);


  const handleStatusChange = (index: number, newStatus: string) => {
    setIncidentData((prev) =>
      prev.map((incident, i) => (i === index ? { ...incident, Status: newStatus } : incident))
    );
  };

  const router = useRouter();

    const handleViewBCPC = () => {
      router.push("/dashboard/IncidentModule/BCPC/ViewIncident");
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
                    <button className="action-notify">Notify</button>
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
