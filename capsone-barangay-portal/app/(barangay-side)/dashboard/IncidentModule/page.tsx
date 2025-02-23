"use client"
import "@/CSS/IncidentModule/AllDepartments.css";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const metadata: Metadata = {
  title: "Incident Management Module",
  description: "Manage incidents efficiently with status tracking and actions",
};

const statusOptions = ["Pending", "Resolved", "Settled", "Archived"];
const departmentOptions = ["GAD", "BCPC", "VAWC", "Lupon"]

export default function MainPageIncident() {
  const [incidentData, setIncidentData] = useState([
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Resolved", Deparment: "BCPC" },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Pending", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Settled", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
    { ComplainantName: "Malcolm Payao Quebal", DateFiled: "2024-02-01", Nature: "Robbery", Status: "Archived", Deparment: "BCPC"  },
   

  ]);



  const router = useRouter();

    const handleViewBCPC = () => {
      router.push("/dashboard/IncidentModule/BCPC/ViewIncident");
    };

    const handleEditBCPC = () => {
      router.push("/dashboard/IncidentModule/BCPC/EditIncident");
    };

    const handleAddBCPC = () => {
      router.push("/dashboard/IncidentModule/BCPC/AddIncident");
    };

   
  
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

      <p className="title"> Most Recent Incidents</p>
     
      <div className="main-section">
        

        <table>
          <thead>
            <tr>
              <th>Complainant's Name</th>
              <th> Department</th>
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
                <td>{incident.Deparment}</td>
                <td>{incident.DateFiled}</td>
                <td>{incident.Nature}</td>
                <td>
                    <span className={`status-badge ${incident.Status.toLowerCase().replace(" ", "-")}`}>
                        {incident.Status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                  <button className="action-view" onClick={handleViewBCPC}>View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="incidentmap-section">



      </div>

    </main>
  );
}
