"use client";
import "@/CSS/IncidentModule/AllDepartments.css";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import Heatmap from "@/app/(barangay-side)/components/heatmap";

const statusOptions = ["Pending", "Resolved", "Settled", "Archived"];
const departmentOptions = ["GAD", "BCPC", "VAWC", "Lupon"];

export default function MainPageIncident() {
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [caseNumberSearch, setCaseNumberSearch] = useState("");
  const [showCount, setShowCount] = useState<number>(0);

  const router = useRouter();

 


  useEffect(() => {
    /*Revised this. Copy from Online Request in Service Module. */
    const unsubscribe = getAllSpecificDocument(
      "IncidentReports",
      "department",
      "!=",
      "Online",
      (data: any[]) => {
        // Sort by dateFiled and timeFiled, newest first
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(`${a.dateFiled} ${a.timeFiled}`);
          const dateB = new Date(`${b.dateFiled} ${b.timeFiled}`);
          return dateB.getTime() - dateA.getTime(); // newest first
        });
      
        // Take only the latest 20 incidents
        const latest20 = sortedData.slice(0, 20);
      
        setIncidentData(latest20);
      }
    );
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);




  useEffect(() => {
    let filtered = [...incidentData];

    if (selectedStatus) {
      filtered = filtered.filter(
        (incident) =>
          incident.status?.toLowerCase().trim() === selectedStatus.toLowerCase()
      );
    }

    if (selectedDepartment) {
      filtered = filtered.filter(
        (incident) =>
          incident.department?.toLowerCase().trim() === selectedDepartment.toLowerCase()
      );
    }

    if (caseNumberSearch) {
      filtered = filtered.filter((incident) => {
        const segments = incident.caseNumber?.split(" - ");
        const lastSegment = segments?.[2]?.trim();
        return lastSegment?.includes(caseNumberSearch.trim());
      });
    }

    if (showCount) {
      filtered = filtered.slice(0, showCount);
    }

    setFilteredIncidents(filtered);
  }, [incidentData, selectedStatus, selectedDepartment, caseNumberSearch, showCount]);

  const handleView = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/ViewIncident?id=${reportId}`);
  };

  return (
    <main className="main-container-all-department">
      <div className="incident-layout-wrapper">

    

    <div className="incident-main-container">

       <div className="titlesection-all-department">
        <p>Latest 20 Incident Reports</p>
      </div>


  
     
      <div className="section-2-all-department">
        <input
          type="text"
          className="all-departments-filter"
          placeholder="Enter Incident Case"
          value={caseNumberSearch}
          onChange={(e) => setCaseNumberSearch(e.target.value)}
        />

        <select
          className="all-departments-filter"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className="all-departments-filter"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">Department</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <select
          className="all-departments-filter"
          value={showCount.toString()}
          onChange={(e) => setShowCount(parseInt(e.target.value))}
        >
          <option value="0">Show All</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

     
      <div className="main-section-all-department">
        
      
          {filteredIncidents.length === 0 ? (
            <div className="no-result-card">
              <img
                src="/images/no-results.png"
                alt="No results icon"
                className="no-result-icon"
              />
              <p className="no-results-department">No Results Found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Department</th>
                  <th>Date & Time of the Incident</th>
                  <th>Nature of Complaint</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident, index) => (
                  <tr
                    key={index}
                    onClick={() => handleView(incident.id)}
                    className="clickable-row cursor-pointer hover:bg-gray-200"
                  >
                    <td>{incident.caseNumber}</td>
                    <td>{incident.department}</td>
                    <td>
                      {incident.dateFiled} {incident.timeFiled}
                    </td>
                    <td>{incident.nature}</td>
                    <td>
                      <span
                        className={`status-badge-all-department ${incident.status
                          ?.toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
       
      </div>

        </div>

   

      <div className="incidentmap-section-all-department">
        <div className="titlesection-all-department">
          <p>Incident HeatMap</p>
        </div>

        <div className="heatmap-container">
          <Heatmap />
        </div>
      </div>

        </div>
    </main>
  );
}
