"use client"
import "@/CSS/IncidentModule/AllDepartments.css";

import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument, getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import Heatmap from "@/app/(barangay-side)/components/heatmap"


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
    <main className="main-container-all-department">
      <div className="section-1-all-department">
        <h1>All Departments</h1>

      </div>

      <div className="section-2-all-department">
        <input type="text" className="search-bar-all-department" placeholder="Enter Incident Case" />
      
        <select className="featuredStatus-all-department" defaultValue="">
          <option value="" disabled>Status</option>
          {statusOptions.map((Deparment) => (
            <option key={Deparment} value={Deparment}>{Deparment}</option>
          ))}
        </select>
        

        <select className="featuredStatus-all-department" defaultValue="">
          <option value="" disabled>Deparment</option>
          {departmentOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>


        <select className="featuredStatus-all-department" defaultValue="">
          <option value="" disabled>Show...</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
        </select>
      </div>

    
      <div className="titlesection-all-department">
             <p className="title-all-department"> Most Recent Incidents</p>
        </div>
     
      <div className="main-section-all-department">
        

      <div className="table-section-all-department">
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
                    <span className={`status-badge-all-department ${incident.status.toLowerCase().replace(" ", "-")}`}>
                        {incident.status}
                    </span>
                </td>   
                <td>
                  <div className="actions-all-department">
                    <button className="action-view-all-department" onClick={() => handleView(incident.id)}>View</button>
                    <button className="action-edit-all-department" onClick={()=>handleEdit(incident.id) }>Edit</button>
                    <button className="action-delete-all-department" onClick={()=> handleDelete(incident.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        
      </div>

    
     

      <div className="incidentmap-section-all-department">
        
      <div className="titlesection-all-department">
             <p className="title-all-department"> Incident HeatMap</p>
        </div>
        <Heatmap/>
      
      </div>

    </main>
  );
}
