"use client";
import "@/CSS/DashboardModule/dashboard.css";
import Link from "next/link";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

export default function Dashboard() {
  const [barangayUsersCount, setBarangayUsersCount] = useState(0);
  const [residentUsersCount, setResidentUsersCount] = useState(0);
  const [newResidentUsersCount, setNewResidentUsersCount] = useState(0); // change to demographics for users
  const [residentsCount, setResidentsCount] = useState(0);
  const [incidentReportsCount, setIncidentReportsCount] = useState(0);
  const [verifiedResidentsCount, setVerifiedResidentsCount] = useState(0);
  const [incidentReportsByMonth, setIncidentReportsByMonth] = useState<{ monthYear: string; count: number }[]>([]);
  const [otherIncidentReportsCount, setOtherIncidentReportsCount] = useState(0);
  const [pendingIncidentReportsCount, setPendingIncidentReportsCount] = useState(0);
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

        const totalReports = incidentReportsSnapshot.size;
        
        const pendingReports = incidentReportsSnapshot.docs.filter(
          (doc) => doc.data().status === "Pending"
        ).length;
  
        setPendingIncidentReportsCount(pendingReports);
        setOtherIncidentReportsCount(totalReports - pendingReports);

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

        incidentReportsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const monthlyCounts: Record<string, number> = {};
        incidentReportsData.forEach((report) => {
          const reportDate = new Date(report.date);
          const monthYear = reportDate.toLocaleString("default", { month: "long", year: "numeric" });
        
          monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
        });
        
        const formattedData = Object.keys(monthlyCounts).map((monthYear) => ({
          monthYear,
          count: monthlyCounts[monthYear],
        }));
        
        setIncidentReportsByMonth(formattedData);
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

  const COLORS = ["#4CAF50", "#F3B50B"];
  const VERIFICATION_COLORS = ["#2196F3", "#F3B50B"];


  const incidentReportData = [
    { name: "Pending Reports", value: pendingIncidentReportsCount },
    { name: "Other Statuses", value: otherIncidentReportsCount },
  ];
  
  const INCIDENT_COLORS = ["#FF9800", "#4CAF50"];
  
  

  return (
    <main className="main-container">

      <p className="dashboard">Summaries</p>

      

        <div className="summaries-section">

      
          <div className="metric-card">
              <div className="card-left-side">
                <Link href="/dashboard/OfficialsModule">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    Barangay Officials:
                  </p>
                </Link>
                  <p className="count">{ barangayUsersCount}</p>
              </div>

            <div className="card-right-side">

                            {/* need to change the graph to an image @derick */}

              <ResponsiveContainer width={200} height={250} >
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

                            {/* gang dito lang need mo idelete */}

              </div>
          </div>
          
          <div className="metric-card">
    
             
            <div className="card-left-side">
            <Link href="/dashboard/admin">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    Total Registered Resident Users:
                  </p>
                </Link>
                  <p className="count">{residentUsersCount}</p>
            </div>

            <div className="card-right-side">
              <ResponsiveContainer width={200} height={250}>
                <PieChart>
                  <Pie data={verificationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {residentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
       


          </div>

          <div className="metric-card">
          {/*change this to resident demographics 
          Residents that Adults >=
          Below 18(Legal Age)
          Senior Citizens >= 60
          */}
            <div className="card-left-side">
                <Link href="/dashboard/admin">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    New Registered Resident Users:
                  </p>
                </Link>
                  <p className="count">{newResidentUsersCount}</p>
            </div>

            <div className="card-right-side">
              <ResponsiveContainer width={200} height={250}>
                <PieChart>
                  <Pie data={verificationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {residentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </div>
       

          </div>

          <div className="metric-card">
           
              <div className="card-left-side">
                <Link href="/dashboard/ResidentModule">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    Total Residents:
                  </p>
                </Link>
                <p className="count">{residentsCount}</p>
              </div>

          <div className="card-right-side">
          <ResponsiveContainer width={200} height={250}>
            <PieChart>
              <Pie data={residentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
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

         <div className="metric-card">
          {/* need to change this to the document requests table count */}
            <div className="card-left-side">
                <Link href="/dashboard/ServicesModule/OnlineRequests">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    Total Document Requests:
                  </p>
                </Link>
                  <p className="count">{incidentReportsCount}</p>
            </div>

            <div className="card-right-side">
              
          <ResponsiveContainer width={200} height={250}>
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

         <div className="metric-card">
          
          <div className="card-left-side">
                <Link href="/dashboard/IncidentModule/Lupon">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    Incident Reports:
                  </p>
                </Link>
              <p className="count">{incidentReportsCount}</p>
          </div>

          <div className="card-right-side">
           
            <ResponsiveContainer width={200} height={250}>
              <PieChart>
                <Pie data={incidentReportData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {incidentReportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={INCIDENT_COLORS[index % INCIDENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>


          </div>

       </div>
          
      </div> 


      <p className="dashboard">Incident Reports Chart</p>
      <div className="heatmap-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incidentReportsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" textAnchor="end" /> 
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#B3EBF2" name="Monthly Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="dashboard">Incident Heat Map</p>

          <div className="heatmap-container">
                  
        

          </div>

     

      
    </main>
  );
}
