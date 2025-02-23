"use client";
import "@/CSS/DashboardModule/dashboard.css";

import { useEffect, useState } from "react";
import { db } from "@/app/db/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";

export default function Dashboard() {
  const [barangayUsersCount, setBarangayUsersCount] = useState(0);
  const [residentUsersCount, setResidentUsersCount] = useState(0);
  const [newResidentUsersCount, setNewResidentUsersCount] = useState(0);
  const [residentsCount, setResidentsCount] = useState(0);
  const [incidentReportsCount, setIncidentReportsCount] = useState(0);
  const [incidentReports, setIncidentReports] = useState<
    {
      reportID: string;
      firstname: string;
      lastname: string;
      address: string;
      concerns: string;
      date: string;
      time: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const barangayUsersSnapshot = await getDocs(collection(db, "BarangayUsers"));
        setBarangayUsersCount(barangayUsersSnapshot.size);

        const residentUsersSnapshot = await getDocs(collection(db, "ResidentUsers"));
        setResidentUsersCount(residentUsersSnapshot.size);

        const residentsSnapshot = await getDocs(collection(db, "Residents"));
        setResidentsCount(residentsSnapshot.size);

        const incidentReportsSnapshot = await getDocs(collection(db, "IncidentReports"));
        setIncidentReportsCount(incidentReportsSnapshot.size);

        // Get current timestamp and calculate last week's date
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);

        const reportsData = incidentReportsSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const incidentDate = data.date?.toDate ? data.date.toDate() : null;

            return {
              reportID: data.reportID || "N/A",
              firstname: data.firstname || "N/A",
              lastname: data.lastname || "N/A",
              address: data.address || "N/A",
              concerns: data.concerns || "N/A",
              date: incidentDate ? incidentDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A",
              time: data.time || "N/A",
              timestamp: incidentDate ? incidentDate.getTime() : 0,
            };
          })
          .filter((report) => report.timestamp >= oneWeekAgo.getTime()) // Filter last 7 days
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by latest

        setIncidentReports(reportsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Dashboard</h1>
      </div>

      <div className="main-section">
        <div className="dashboard-cards">
          <div className="card">
            <h2>Total Barangay Users</h2>
            <p>{barangayUsersCount}</p>
          </div>

          <div className="card">
            <h2>Total Resident Users</h2>
            <p>{residentUsersCount}</p>
          </div>

          <div className="card">
            <h2>New Resident Users (Last 7 Days)</h2>
            <p>{newResidentUsersCount}</p>
          </div>

          <div className="card">
            <h2>Total Residents</h2>
            <p>{residentsCount}</p>
          </div>

          <div className="card">
            <h2>Total Incident Reports</h2>
            <p>{incidentReportsCount}</p>
          </div>
        </div>

        <h2>Incident Reports (Last 7 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>Report ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Address</th>
              <th>Concerns</th>
              <th>Date</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidentReports.length > 0 ? (
              incidentReports.map((report) => (
                <tr key={report.reportID}>
                  <td>{report.reportID}</td>
                  <td>{report.firstname}</td>
                  <td>{report.lastname}</td>
                  <td>{report.address}</td>
                  <td>{report.concerns}</td>
                  <td>{report.date}</td>
                  <td>{report.time}</td>
                  <td className="actions">
                    <button className="action-view">View</button>
                    <button className="action-edit">Edit</button>
                    <button className="action-delete">Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-data">No incident reports in the last 7 days</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
