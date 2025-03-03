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
  const [residentUsersCount, setResidentUsersCount] = useState(0);
  const [residentsCount, setResidentsCount] = useState(0);
  const [eastResidentsCount, seteastResidentsCount] = useState(0);
  const [westResidentsCount, setwestResidentsCount] = useState(0);
  const [southResidentsCount, setsouthResidentsCount] = useState(0);
  const [incidentReportsCount, setIncidentReportsCount] = useState(0);
  const [verifiedResidentsCount, setVerifiedResidentsCount] = useState(0);
  const [incidentReportsByWeek, setIncidentReportsByWeek] = useState<{ monthWeek: string; count: number }[]>([]);
  const [otherIncidentReportsCount, setOtherIncidentReportsCount] = useState(0);
  const [pendingIncidentReportsCount, setPendingIncidentReportsCount] = useState(0);
[]>([]);
  

  useEffect(() => {
    const fetchCounts = async () => {
      try {

        const residentUsersSnapshot = await getDocs(collection(db, "ResidentUsers"));
        setResidentUsersCount(residentUsersSnapshot.size);

        const residentsSnapshot = await getDocs(collection(db, "Residents"));
        setResidentsCount(residentsSnapshot.size);

        let eastCount = 0, westCount = 0, southCount = 0;

        residentsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.generalLocation === "East Fairview") eastCount++;
          else if (data.generalLocation === "West Fairview") westCount++;
          else if (data.generalLocation === "South Fairview") southCount++;
        });
  
        seteastResidentsCount(eastCount);
        setwestResidentsCount(westCount);
        setsouthResidentsCount(southCount);
  

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

        const weeklyCounts: Record<string, number> = {};

        incidentReportsData.forEach((report) => {
          const reportDate = new Date(report.date);

          const startOfWeek = new Date(reportDate);
          startOfWeek.setDate(reportDate.getDate() - ((reportDate.getDay() + 6) % 7)); // Adjust to Monday start
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          const weekLabel = `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${
            endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          }`;

          weeklyCounts[weekLabel] = (weeklyCounts[weekLabel] || 0) + 1;
        });

        const formattedWeeklyData = Object.keys(weeklyCounts).map((week) => ({
          monthWeek: week, 
          count: weeklyCounts[week],
        })).sort((a, b) => new Date(a.monthWeek.split(" - ")[0]).getTime() - new Date(b.monthWeek.split(" - ")[0]).getTime());

        setIncidentReportsByWeek(formattedWeeklyData);
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

  const generalLocationData = [
    { name: "East Fairview", value: eastResidentsCount },
    { name: "West Fairview", value: westResidentsCount },
    { name: "South Fairview", value: southResidentsCount },
  ];
  
  const verificationData = [
    { name: "Verified Residents", value: verifiedResidentsCount },
    { name: "Unverified Residents", value: Math.max(residentUsersCount - verifiedResidentsCount, 0) },
  ];

  const COLORS = ["#4CAF50", "#F3B50B"];
  const VERIFICATION_COLORS = ["#2196F3", "#F3B50B"];
  const LOCATION_COLORS = ["#4CAF50", "#2196F3", "#FF9800"];  


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
                <Link href="/dashboard/ResidentModule">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    1. Resident Population:
                  </p>
                </Link>
                  <p className="count">{residentsCount}</p>
              </div>

            <div className="card-right-side">
                <ResponsiveContainer width={200} height={250}>
                <PieChart>
                    <Pie
                    data={generalLocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                    >
                    {generalLocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} />
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
            <Link href="/dashboard/admin">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                    2. Total Registered Resident Users:
                  </p>
                </Link>
                  <p className="count">{residentUsersCount}</p>
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
          {/*change this to resident demographics 
          Residents that Adults >=
          Below 18(Legal Age)
          Senior Citizens >= 60
          */}
            <div className="card-left-side">
                <Link href="/dashboard/admin">
                  <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                   3. Barangay Demographics:
                  </p>
                </Link>
                  <p className="count">{}</p>
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
                    Most Requested Documents(Weekly):
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
                    4. Total Document Requests:
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
                  6. Incident Reports:
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


      <p className="dashboard">Incident Reports(Weekly) Chart</p>
      <div className="heatmap-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incidentReportsByWeek} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthWeek" textAnchor="end" /> 
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#B3EBF2" name="Weekly Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="dashboard">Incident Heat Map</p>

          <div className="heatmap-container">
                  
        

          </div>

     

      
    </main>
  );
}
