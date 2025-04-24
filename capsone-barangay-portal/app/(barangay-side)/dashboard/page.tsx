"use client";
import "@/CSS/DashboardModule/dashboard.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/app/db/firebase";
import { doc, collection, getDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import {PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid} from "recharts";

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

  const documentRequestsTypeData: { name: string; value: number }[] = [
    { name: "First Time Jobseeker", value: firstTimeJobSeekersCount },
    { name: "Barangay Clearance", value: barangayClearanceCount },
    { name: "Barangay Indigency", value: barangayIndigencyCount },
    { name: "Barangay ID", value: barangayIDCount },
    { name: "Barangay Permit", value: barangayPermitsCount },
    { name: "Barangay Certificate", value: barangayCertificateCount },
  ];
  
  const COLORS: string[] = ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336", "#00BCD4"];
  

[]>([]);
  

// site visits

useEffect(() => {
  const fetchSiteVisits = async () => {
    try {
      const docRef = doc(db, "SiteVisits", "homepageVisit");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteVisits(data.homepageCount ?? 0);
      } else {
        setSiteVisits(0);
      }
    } catch (error) {
      console.error("Error fetching site visits:", error);
    }
  };

  fetchSiteVisits();
}, []);

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
        else if (documentType === "Business Permit") permit++;
        else if (documentType === "Temporary Business Permit") permit++;
        else if (documentType === "Construction Permit") permit++;
        else if (documentType === "Barangay Certificate") certificate++;
      });

      setFirstTimeJobSeekersCount(firsttimejobseeker);
      setBarangayPermitsCount(permit);
      setBarangayIndigencyCount(indigency);
      setBarangayIDCount(barangayID);
      setBarangayClearanceCount(clearance);
      setBarangayCertificateCount(certificate)

      let documentPending = 0,
      documentPickUp = 0,
      documentCompleted = 0;

      documentRequestsSnapshots.docs.forEach((doc) => {
        const documentStatus = doc.data().status;
        if (documentStatus === "Pending") documentPending++;
        else if (documentStatus === "Pick-Up") documentPickUp++;
        else if (documentStatus === "Completed") documentCompleted++;
      });

      setdocumentRequestPendingCount(documentPending);
      setdocumentRequestPickUpCount(documentPickUp);
      setdocumentRequestCompletedCount(documentCompleted);

      // for document requests stacked bar chart

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





        // for residents pie charts
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
  
        // for demographics pie chart
        const residents = residentsSnapshot.docs.map((doc) => doc.data());

        let seniors = 0,
          pwds = 0,
          soloParents = 0,
          minors = 0,
          adults = 0;

        residents.forEach((resident) => {
          if (resident.age >= 60) seniors++;
          else if (resident.age < 18) minors++;
          else adults++;

          if (resident.isPWD === true) pwds++;
          if (resident.soloParent === true) soloParents++;
        });

        setSeniorCitizensCount(seniors);
        setPwdCount(pwds);
        setSoloParentCount(soloParents);
        setMinorsCount(minors);
        setAdultsCount(adults);

        // for user verification pie chart
        const verifiedQuery = query(collection(db, "ResidentUsers"), where("verified", "==", true));
        const verifiedSnapshot = await getDocs(verifiedQuery);
        setVerifiedResidentsCount(verifiedSnapshot.size);



               // for incident report pie charts
               const incidentReportsSnapshot = await getDocs(collection(db, "IncidentReports"));
               setIncidentReportsCount(incidentReportsSnapshot.size);
       
               let pending = 0,
               settled = 0,
               archived = 0,
               resolved = 0;
       
               incidentReportsSnapshot.docs.forEach((doc) => {
                 const status = doc.data().status;
                 if (status === "Pending") pending++;
                 else if (status === "Settled") settled++;
                 else if (status === "Archived") archived++;
                 else if (status === "Resolved") resolved++;
               });
         
               setPendingIncidentReportsCount(pending);
               setSettledIncidentReportsCount(settled);
               setArchivedIncidentReportsCount(archived);
               setResolvedIncidentReportsCount(resolved);
       
               let online = 0,
               gad = 0,
               bcpc = 0,
               vawc = 0,
               lupon = 0;
       
           incidentReportsSnapshot.docs.forEach((doc) => {
               const department = doc.data().department;
               if (department === "GAD") gad++;
               else if (department === "BCPC") bcpc++;
               else if (department === "VAWC") vawc++;
               else if (department === "Lupon") lupon++;
               else if (department === "Online") online++;
             });
       
             setBCPCReportsCount(bcpc);
             setGADReportsCount(gad);
             setVAWCReportsCount(vawc);
             setLuponReportsCount(lupon);
             setOnlineReportsCount(online);
       
               const today = new Date();
               const sevenDaysAgo = new Date();
               sevenDaysAgo.setDate(today.getDate() - 7);
       

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

        const incidentweeklyCounts: Record<string, number> = {};

        incidentReportsData.forEach((report) => {
          const reportDate = new Date(report.dateFiled);

          const startOfWeek = new Date(reportDate);
          startOfWeek.setDate(reportDate.getDate() - ((reportDate.getDay() + 6) % 7)); // Adjust to Monday start
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          const weekLabel = `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${
            endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          }`;

          incidentweeklyCounts[weekLabel] = (incidentweeklyCounts[weekLabel] || 0) + 1;
        });

        const formattedWeeklyData = Object.keys(incidentweeklyCounts).map((week) => ({
          monthWeek: week, 
          count: incidentweeklyCounts[week],
        })).sort((a, b) => new Date(a.monthWeek.split(" - ")[0]).getTime() - new Date(b.monthWeek.split(" - ")[0]).getTime());

        setIncidentReportsByWeek(formattedWeeklyData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchCounts();
  }, []);

  
  const barangayPopulationChart = {
    title: "Barangay Population:",
    count: residentsCount,
    data: [
      { name: "East Fairview", value: eastResidentsCount },
      { name: "West Fairview", value: westResidentsCount },
      { name: "South Fairview", value: southResidentsCount },
    ],
    colors: ["#4CAF50", "#2196F3", "#FF9800"],
  };
  
  const barangayDemographicsChart = {
    title: "Barangay Demographics:",
    count: residentsCount,
    data: [
      { name: "Senior Citizens", value: seniorCitizensCount },
      { name: "PWD", value: pwdCount },
      { name: "Solo Parents", value: soloParentCount },
      { name: "Minors", value: minorsCount },
      { name: "Adults", value: adultsCount },
    ],
    colors: ["#4CAF50", "#2196F3", "#FF9800", "#F3B50B", "#D32F2F"],
  };

  const documentRequestsStatusChart = {
    title: "Statuses of Document Requests",
    count: documentRequestsCount,
    data: [
      { name: "Pending", value: documentRequestPendingCount },
      { name: "For Pick-Up", value: documentRequestPickUpCount },
      { name: "Completed", value: documentRequestCompletedCount },
    ],
    colors: ["#4CAF50", "#2196F3", "#FF9800"],
  };



  const incidentReportsByDepartmentChart = {
    title: "Incident Reports Total by Department",
    count: incidentReportsCount,
    data: [
      { name: "GAD", value: GADReportsCount },
      { name: "BCPC", value: BCPCReportsCount },
      { name: "VAWC", value: VAWCReportsCount },
      { name: "Lupon", value: LuponReportsCount },
      { name: "Online", value: OnlineReportsCount },
    ],
    colors: ["#E91E63", "#8E44AD", "#3498DB", "#27AE60", "#F39C12"]
  };
  
  const totalIncidentReportsChart = {
    title: "Incident Reports Statuses:",
    count: incidentReportsCount,
    data: [
      { name: "Pending", value: pendingIncidentReportsCount },
      { name: "Settled", value: settledIncidentReportsCount },
      { name: "Resolved", value: resolvedIncidentReportsCount },
      { name: "Archived", value: archivedIncidentReportsCount },
    ],
    colors: ["#FF9800", "#03A9F4", "#4CAF50", "#9E9E9E"]
  };
  

  const residentData = [
    { name: "Resident Users", value: residentUsersCount },
    { name: "Non-Users", value: Math.max(residentsCount - residentUsersCount, 0) },
  ];

  const verificationData = [
    { name: "Verified Residents", value: verifiedResidentsCount },
    { name: "Unverified Residents", value: Math.max(residentUsersCount - verifiedResidentsCount, 0) },
  ];

  const barangayDemographics = [
    { name: "Senior Citizens", value: seniorCitizensCount },
    { name: "PWD", value: pwdCount },
    { name: "Solo Parents", value: soloParentCount },
    { name: "Minors", value: minorsCount },
    { name: "Adults", value: adultsCount },
  ];

  // colors for each dashboard

  const DEMOGRAPHICS_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F3B50B", "#D32F2F"];
  const VERIFICATION_COLORS = ["#2196F3", "#F3B50B"];
  
  

  return (
    <main className="main-container">
      <p className="dashboard">Summaries</p>
      <div className="metric-card">
        <div className="card-left-side">
          <Link href="/dashboard/admin">
            <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
              Total Registered Users:
            </p>
          </Link>
          <p className="count">{residentUsersCount}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="card-left-side">
            <p className="title">
              Total Homepage Visits:
            </p>
          <p className="count">{siteVisits}</p>
        </div>
      </div>

        <div className="summaries-section">

        <div className="metric-card">
          <div className="card-left-side">
            <Link href="/dashboard/ResidentModule">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {barangayPopulationChart.title}
              </p>
            </Link>
            <p className="count">{barangayPopulationChart.count}</p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width={300} height={300}>
              <BarChart
                data={barangayPopulationChart.data}
                layout="vertical"
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Number of Residents">
                  {barangayPopulationChart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barangayPopulationChart.colors[index % barangayPopulationChart.colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card">
          <div className="card-left-side">
            <Link href="/dashboard/ResidentModule">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {barangayDemographicsChart.title}
              </p>
            </Link>
            <p className="count">{barangayDemographicsChart.count}</p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={barangayDemographicsChart.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  label
                >
                  {barangayDemographicsChart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barangayDemographicsChart.colors[index % barangayDemographicsChart.colors.length]} />
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
            <Link href="/dashboard/ServicesModule/Appointments">
              <p
                className="title"
                style={{ cursor: "pointer", textDecoration: "underline" }}
              >
                  Pending or Completed Appointments(to be implemented):
              </p>
            </Link>
            <p className="count">
              {residentsCount}
            </p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={barangayDemographics}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {barangayDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEMOGRAPHICS_COLORS[index % DEMOGRAPHICS_COLORS.length]} />
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
            <Link href="/dashboard/ServicesModule/InBarangayRequests">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {documentRequestsStatusChart.title}
              </p>
            </Link>
            <p className="count">{documentRequestsStatusChart.count}</p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width={300} height={300}>
              <BarChart
                data={documentRequestsStatusChart.data}
                layout="vertical"
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Number of Documents">
                  {documentRequestsStatusChart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={documentRequestsStatusChart.colors[index % documentRequestsStatusChart.colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


          <div className="metric-card">
            <div className="card-left-side">
            <Link href="/dashboard/ServicesModule/InBarangayRequests">
            <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                Document Requests Breakdown</p>
              </Link>
            </div>
            <div className="card-right-side">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={documentRequestsTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {documentRequestsTypeData.map((entry: { name: string; value: number }, index: number) => (
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
            <Link href="/dashboard/IncidentModule">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {incidentReportsByDepartmentChart.title}
              </p>
            </Link>
            <p className="count">{incidentReportsByDepartmentChart.count}</p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={incidentReportsByDepartmentChart.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50} // doughnut style
                  label
                >
                  {incidentReportsByDepartmentChart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={incidentReportsByDepartmentChart.colors[index % incidentReportsByDepartmentChart.colors.length]} />
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
            <Link href="/dashboard/IncidentModule">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {totalIncidentReportsChart.title}
              </p>
            </Link>
            <p className="count">{totalIncidentReportsChart.count}</p>
          </div>

          <div className="card-right-side">
            <ResponsiveContainer width={300} height={300}>
              <BarChart
                data={totalIncidentReportsChart.data}
                layout="vertical"
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Number of Incidents">
                  {totalIncidentReportsChart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={totalIncidentReportsChart.colors[index % totalIncidentReportsChart.colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div> 

      <Link href="/dashboard/ServicesModule/InBarangayRequests">
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
            <Bar dataKey="Barangay Certificate" stackId="a" fill="#00BCD4" />

            {/* Dynamically render all "Permit" related bars */}
            {Object.keys(documentRequestsByWeek[0] || {})
              .filter((key) => key.includes("Permit"))
              .map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill="#F44336"
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Link href="/dashboard/IncidentModule">
        <p className="dashboard" style={{ cursor: "pointer", textDecoration: "underline" }}>
          Weekly Incident Reports Chart
        </p>
      </Link>
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

{/*
      <p className="dashboard">Incident Heat Map</p>*/}

          <div className="heatmap-container">
                  
        

          </div>

     

      
    </main>
  );
}
