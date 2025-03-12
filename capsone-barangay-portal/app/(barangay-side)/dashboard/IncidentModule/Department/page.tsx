"use client"
import "@/CSS/IncidentModule/MainDashboardIncident.css";
import { useState,useEffect } from "react";
import { useRouter,useSearchParams} from "next/navigation";
import { getAllSpecificDocument,deleteDocument } from "@/app/helpers/firestorehelper";


const statusOptions = ["Pending","In Progress", "Resolved", "Settled", "Archived"];

export default function Department() {
  const [incidentData, setIncidentData] = useState<any[]>([])
  const router = useRouter();
  const searchParam = useSearchParams();
  const departmentId = searchParam.get("id");
  
  useEffect(()=> {

    if(departmentId){
      const unsubscribe = getAllSpecificDocument("IncidentReports", "department", departmentId, setIncidentData);
        return () => {
        if (unsubscribe) {
          unsubscribe(); 
        }
      };
    }

   
  },[departmentId])
  console.log("Data:",incidentData);

  /*filtering and search is not yet working */
  const handleStatusChange = (index: number, newStatus: string) => {
    setIncidentData((prev) =>
      prev.map((incident, i) => (i === index ? { ...incident, Status: newStatus } : incident))
    );
  };

 

  const handleViewLupon = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/ViewIncident?id=${reportId}`);
  };

  const handleEditLupon = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/EditIncident?id=${reportId}`);
  };

  const handleDeleteLupon = (reportId: string) => {
    deleteDocument("IncidentReports", reportId);
    deleteDocument("IncidentReports/Investigator", reportId);
  }

  const handleAddLupon = () => {
    router.push(`/dashboard/IncidentModule/AddIncident?departmentId=${departmentId}`);
  };



  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Lupon Tagapamayapa: {departmentId} Table</h1>
          <button className="add-announcement-btn" onClick={handleAddLupon}>Add New Incident</button>
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
              <th>Case #</th>
              <th>Date & Time of the Incident</th>
              <th>Nature of Complaint</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidentData.map((incident, index) => (
              <tr key={index}>
                <td>{incident.caseNumber}</td>
                <td>{incident.dateFiled} {incident.timeFiled}</td>
                <td>{incident.nature}</td>
                <td>
                    <span className={`status-badge ${incident.status.toLowerCase().replace(" ", "-")}`}>
                        {incident.status}
                    </span>
                </td>   
                <td>
                  <div className="actions">
                    <button className="action-view" onClick={() => handleViewLupon(incident.id)}>View</button>
                    <button className="action-edit" onClick={()=>handleEditLupon(incident.id) }>Edit</button>
                    <button className="action-delete" onClick={()=> handleDeleteLupon(incident.id)}>Delete</button>
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
