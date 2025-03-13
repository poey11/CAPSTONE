"use client"
import "@/CSS/IncidentModule/AllDepartments.css";

import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, getAllSpecificDocument } from "@/app/helpers/firestorehelper";



const statusOptions = ["Pending", "Resolved", "Settled", "Archived"];
const departmentOptions = ["GAD", "BCPC", "VAWC", "Lupon"]

export default function MainPageIncident() {
  const [incidentData, setIncidentData] = useState<any[]>([])
  useEffect(() => {
      const unsubscribe = getAllSpecificDocument("IncidentReports", "department", "!=", "Online", setIncidentData);
        return () => {
        if (unsubscribe) {
          unsubscribe(); 
        }
    }  }, []);



  const router = useRouter();

  const handleView = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/ViewIncident?id=${reportId}`);
  };

  const handleEdit = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/EditIncident?id=${reportId}`);
  };

  const handleDelete = (reportId: string) => {
    deleteDocument("IncidentReports", reportId);
    deleteDocument("IncidentReports/Investigator", reportId);
  }


   
  
  return (
    <main className="main-container">
      <div className="section-1">
        <h1>All Departments</h1>

      </div>

      <div className="section-2">
        <input type="text" className="search-bar" placeholder="Enter Incident Case" />
      
        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Status</option>
          {statusOptions.map((Deparment) => (
            <option key={Deparment} value={Deparment}>{Deparment}</option>
          ))}
        </select>
        

        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Deparment</option>
          {departmentOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>


        <select className="featuredStatus" defaultValue="">
          <option value="" disabled>Show...</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

    
      <div className="titlesection">
             <p className="title"> Most Recent Incidents</p>
        </div>
     
      <div className="main-section">
        

      <div className="table-section">
        <table>
          <thead>
            <tr>
              <th>Case #</th>
              <th>Department</th>
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
                <td>{incident.department}</td>
                <td>{incident.dateFiled} {incident.timeFiled}</td>
                <td>{incident.nature}</td>
                <td>
                    <span className={`status-badge ${incident.status.toLowerCase().replace(" ", "-")}`}>
                        {incident.status}
                    </span>
                </td>   
                <td>
                  <div className="actions">
                    <button className="action-view" onClick={() => handleView(incident.id)}>View</button>
                    <button className="action-edit" onClick={()=>handleEdit(incident.id) }>Edit</button>
                    <button className="action-delete" onClick={()=> handleDelete(incident.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        
      </div>

    
     

      <div className="incidentmap-section">
        
      <div className="titlesection">
             <p className="title"> Incident HeatMap</p>
        </div>


      </div>

    </main>
  );
}
