"use client";
import "@/CSS/DashboardModule/dashboard.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/app/db/firebase";
import { doc, collection, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
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

  const [siteVisits, setSiteVisits] = useState<number>(0);

  // for residents and users
  const [residentUsersCount, setResidentUsersCount] = useState(0);
  const [residentsCount, setResidentsCount] = useState(0);
  const [eastResidentsCount, seteastResidentsCount] = useState(0);
  const [westResidentsCount, setwestResidentsCount] = useState(0);
  const [southResidentsCount, setsouthResidentsCount] = useState(0);
  const [verifiedResidentsCount, setVerifiedResidentsCount] = useState(0);

  // for incidents
  const [incidentReportsCount, setIncidentReportsCount] = useState(0);
  const [incidentReportsByWeek, setIncidentReportsByWeek] = useState<{ monthWeek: string; count: number }[]>([]);
  const [pendingIncidentReportsCount, setPendingIncidentReportsCount] = useState(0);
  const [settledIncidentReportsCount, setSettledIncidentReportsCount] = useState(0);
  const [archivedIncidentReportsCount, setArchivedIncidentReportsCount] = useState(0);
  const [resolvedIncidentReportsCount, setResolvedIncidentReportsCount] = useState(0);
  const [BCPCReportsCount, setBCPCReportsCount] = useState(0);
  const [GADReportsCount, setGADReportsCount] = useState(0);
  const [VAWCReportsCount, setVAWCReportsCount] = useState(0);
  const [LuponReportsCount, setLuponReportsCount] = useState(0);
  const [OnlineReportsCount, setOnlineReportsCount] = useState(0);

  // for demographics
  const [pwdCount, setPwdCount] = useState(0);
  const [soloParentCount, setSoloParentCount] = useState(0);
  const [seniorCitizensCount, setSeniorCitizensCount] = useState(0);
  const [minorsCount, setMinorsCount] = useState(0);
  const [adultsCount, setAdultsCount] = useState(0);

  // for document requests
  const [documentRequestsCount, setdocumentRequestsCount] = useState(0);
  const [documentRequestsByWeek, setdocumentRequestsByWeek] = useState<
  {
    monthWeek: string;
    [key: string]: string | number;
  }[]
>([]);
  const [documentRequestPendingCount, setdocumentRequestPendingCount] = useState(0);
  const [documentRequestCompletedCount, setdocumentRequestCompletedCount] = useState(0);
  const [documentRequestPickUpCount, setdocumentRequestPickUpCount] = useState(0);

  const [firstTimeJobSeekersCount, setFirstTimeJobSeekersCount] = useState(0);
  const [barangayPermitsCount, setBarangayPermitsCount] = useState(0);
  const [barangayIndigencyCount, setBarangayIndigencyCount] = useState(0);
  const [barangayIDCount, setBarangayIDCount] = useState(0);
  const [barangayClearanceCount, setBarangayClearanceCount] = useState(0);
  const [barangayCertificateCount, setBarangayCertificateCount] = useState(0);

[]>([]);
  


  useEffect(() => {
    const fetchCounts = async () => {
      try {

        const documentRequestsSnapshots = await getDocs(collection(db, "ServiceRequests"));
        setdocumentRequestsCount(documentRequestsSnapshots.size);

        let firsttimejobseeker = 0,
        indigency = 0,
        barangayID = 0,
        clearance = 0,
        certificate = 0,
        permit = 0;

    documentRequestsSnapshots.docs.forEach((doc) => {
        const documentType = doc.data().docType;
        if (documentType === "First Time Jobseeker") firsttimejobseeker++;
        else if (documentType === "Barangay Clearance") clearance++;
        else if (documentType === "Barangay Indigency") indigency++;
        else if (documentType === "Barangay ID") barangayID++;
        else if (documentType === "Barangay Permit") permit++;
        else if (documentType === "Barangay Certificate") certificate++;
      });

      setFirstTimeJobSeekersCount(firsttimejobseeker);
      setBarangayPermitsCount(permit);
      setBarangayIndigencyCount(indigency);
      setBarangayIDCount(barangayID);
      setBarangayClearanceCount(clearance);
      setBarangayCertificateCount(certificate)

      
      const DocumentRequestsWeeklyCounts: Record<string, { [key: string]: number }> = {};

      documentRequestsSnapshots.docs.forEach((doc) => {
        const data = doc.data();
        const requestDate = new Date(data.requestDate?.toDate?.() || data.requestDate);
        const docType = data.docType;
      
        const startOfWeek = new Date(requestDate);
        startOfWeek.setDate(requestDate.getDate() - ((requestDate.getDay() + 6) % 7)); // Monday start
        startOfWeek.setHours(0, 0, 0, 0);
      
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
      
        const documentRequestsWeekLabel = `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      
        if (!DocumentRequestsWeeklyCounts[documentRequestsWeekLabel]) {
            DocumentRequestsWeeklyCounts[documentRequestsWeekLabel] = {};
        }
      
        DocumentRequestsWeeklyCounts[documentRequestsWeekLabel][docType] = (DocumentRequestsWeeklyCounts[documentRequestsWeekLabel][docType] || 0) + 1;
      });
      
      // Flatten into array for recharts
      const documentRequestFormattedWeeklyData = Object.entries(DocumentRequestsWeeklyCounts).map(([week, types]) => ({
        monthWeek: week,
        ...types,
      }));
      
      documentRequestFormattedWeeklyData.sort((a, b) => new Date(a.monthWeek.split(" - ")[0]).getTime() - new Date(b.monthWeek.split(" - ")[0]).getTime());
      
      setdocumentRequestsByWeek(documentRequestFormattedWeeklyData);
      



    // for incident report pie charts
    const incidentReportsSnapshot = await getDocs(collection(db, "IncidentReports"));
    setIncidentReportsCount(incidentReportsSnapshot.size);
    
    // for incident report graph weekly chart
    const incidentReportsData = incidentReportsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
        reportID: data.reportID,
        caseNumber: data.caseNumber,
        concern: data.concern,
        dateFiled: data.dateFiled,
        dateReceived: data.dateReceived,
        department: data.department,
        file: data.file,
        location: data.location,
        nature: data.nature,
        receivedBy: data.receivedBy,
        status: data.status,
        timeFiled:  data.timeFiled,
        timeReceived: data.timeReceived,
        };
    });

    incidentReportsData.sort((a, b) => new Date(a.dateFiled).getTime() - new Date(b.dateFiled).getTime());

    const incidentWeeklyCounts: Record<string, number> = {};

    incidentReportsData.forEach((report) => {
        const incidentReportDate = new Date(report.dateFiled);

        const startOfWeek = new Date(incidentReportDate);
        startOfWeek.setDate(incidentReportDate.getDate() - ((incidentReportDate.getDay() + 6) % 7)); // Adjust to Monday start
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const incidentWeekLabel = `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${
        endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }`;

        incidentWeeklyCounts[incidentWeekLabel] = (incidentWeeklyCounts[incidentWeekLabel] || 0) + 1;
    });

    const incidentformattedWeeklyData = Object.keys(incidentWeeklyCounts).map((week) => ({
        monthWeek: week, 
        count: incidentWeeklyCounts[week],
    })).sort((a, b) => new Date(a.monthWeek.split(" - ")[0]).getTime() - new Date(b.monthWeek.split(" - ")[0]).getTime());

    setIncidentReportsByWeek(incidentformattedWeeklyData);
    } catch (error) {
    console.error("Error fetching dashboard data:", error);
    }
};

    fetchCounts();
  }, []);

  

  return (
    <main className="main-container">
      <p className="dashboard">Summaries</p>
      <div className="summaries-section">
        <div className="metric-card">
          <div className="card-left-side">
            <Link href="/dashboard/ServicesModule/InBarangayRequests">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                Weekly Statuses of Requested Documents and Total Requested Documents
              </p>
            </Link>
            <p className="count">{documentRequestsCount}</p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentReportsByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthWeek" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


      </div> 

      <Link href="/dashboard/InBarangayRequests">
        <p className="dashboard" style={{ cursor: "pointer", textDecoration: "underline" }}>
          Weekly Barangay Requests Chart
        </p>
      </Link>
      <div className="heatmap-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={documentRequestsByWeek}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthWeek" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="First Time Jobseeker" stackId="a" fill="#4CAF50" />
            <Bar dataKey="Barangay Clearance" stackId="a" fill="#2196F3" />
            <Bar dataKey="Barangay Indigency" stackId="a" fill="#FF9800" />
            <Bar dataKey="Barangay ID" stackId="a" fill="#9C27B0" />
            <Bar dataKey="Barangay Permit" stackId="a" fill="#F44336" />
            <Bar dataKey="Barangay Certificate" stackId="a" fill="#00BCD4" />
          </BarChart>
        </ResponsiveContainer>

      </div>

{/*
      <p className="dashboard">Incident Heat Map</p>*/}

          <div className="heatmap-container">
                  
        

          </div>

     

      
    </main>
  );
}
