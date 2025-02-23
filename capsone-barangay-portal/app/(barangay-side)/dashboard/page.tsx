"use client";
import "@/CSS/DashboardModule/dashboard.css";

import { useEffect, useState } from "react";
import { db } from "@/app/db/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [barangayUsersCount, setBarangayUsersCount] = useState(0);
  const [residentUsersCount, setResidentUsersCount] = useState(0);
  const [newResidentUsersCount, setNewResidentUsersCount] = useState(0);
  const [residentsCount, setResidentsCount] = useState(0);
  const [incidentReportsCount, setIncidentReportsCount] = useState(0);
  const [verifiedResidentsCount, setVerifiedResidentsCount] = useState(0);
  const [incidentReports, setIncidentReports] = useState<{ 
    reportID: string;
    firstname: string;
    lastname: string;
    address: string;
    concerns: string;
    date: string;
    time: string;
  }[]>([]);
  

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

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        const newResidentQuery = query(
          collection(db, "ResidentUsers"),
          where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
        );
        const newResidentSnapshot = await getDocs(newResidentQuery);
        setNewResidentUsersCount(newResidentSnapshot.size);

        const verifiedQuery = query(collection(db, "ResidentUsers"), where("verified", "==", true));
        const verifiedSnapshot = await getDocs(verifiedQuery);
        setVerifiedResidentsCount(verifiedSnapshot.size);

        const incidentReportsData = incidentReportsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            reportID: data.reportID,
            firstname: data.firstname,
            lastname: data.lastname,
            address: data.address,
            concerns: data.concerns,
            date: data.date,
            time: data.time,
          };
        });

        setIncidentReports(incidentReportsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchCounts();
  }, []);

  const residentData = [
    { name: "Resident Users", value: residentUsersCount },
    { name: "Non-Users", value: Math.max(residentsCount - residentUsersCount, 0) },
  ];

  const verificationData = [
    { name: "Verified Residents", value: verifiedResidentsCount },
    { name: "Unverified Residents", value: Math.max(residentUsersCount - verifiedResidentsCount, 0) },
  ];

  const COLORS = ["#4CAF50", "#FF9800"];
  const VERIFICATION_COLORS = ["#2196F3", "#F44336"];

  return (
    <main className="main-container">
      <div className="section-1">
        <h1>Dashboard</h1>
        <div className="dashboard-metrics">
          <div className="metric-card">
            <h3>Barangay Officials</h3>
            <p>{barangayUsersCount}</p>
          </div>
          <div className="metric-card">
            <h3>Registered Resident Users</h3>
            <p>{residentUsersCount}</p>
          </div>
          <div className="metric-card">
            <h3>New Resident Users (Last 7 Days)</h3>
            <p>{newResidentUsersCount}</p>
          </div>
          <div className="metric-card">
            <h3>Total Residents</h3>
            <p>{residentsCount}</p>
          </div>
          <div className="metric-card">
            <h3>Incident Reports</h3>
            <p>{incidentReportsCount}</p>
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              <Pie data={residentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {residentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              <Pie data={verificationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {verificationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={VERIFICATION_COLORS[index % VERIFICATION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="main-section">
        <h2>Incident Reports</h2>
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
                <td colSpan={8} className="no-data">No incident reports</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
