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
  const [firstTimeJobSeekersCount, setFirstTimeJobSeekersCount] = useState(0);
  const [barangayPermitsCount, setBarangayPermitsCount] = useState(0);
  const [barangayIndigencyCount, setBarangayIndigencyCount] = useState(0);
  const [barangayIDCount, setBarangayIDCount] = useState(0);
  const [barangayClearanceCount, setBarangayClearanceCount] = useState(0);
  const [barangayCertificateCount, setBarangayCertificateCount] = useState(0);

  // for charts that can be toggled
  const [currentChartBoxOne, setCurrentChartBoxOne] = useState(0);
  const [currentChartBoxTwo, setCurrentChartBoxTwo] = useState(0);
  const [currentChartBoxThree, setCurrentChartBoxThree] = useState(0);
  const [currentChartBoxFour, setCurrentChartBoxFour] = useState(0);
  const [currentChartBoxFive, setCurrentChartBoxFive] = useState(0);
  const [currentChartBoxSix, setCurrentChartBoxSix] = useState(0);
[]>([]);
  

  useEffect(() => {
    const fetchCounts = async () => {
      try {


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


        // for incident report graph chart
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

        const weeklyCounts: Record<string, number> = {};

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

  const chartsBoxOne = [
    {
      title: "Barangay Population:",
      count: residentsCount,
      data: [
        { name: "East Fairview", value: eastResidentsCount },
        { name: "West Fairview", value: westResidentsCount },
        { name: "South Fairview", value: southResidentsCount },
      ],
      colors: ["#4CAF50", "#2196F3", "#FF9800", "#F3B50B", "#D32F2F"],
    },
    {
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
    },
  ];

  const chartsBoxSix = [
    {
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
    },    
    {
        title: "Total Incident Reports:",
        count: incidentReportsCount,
        data: [
          { name: "Pending", value: pendingIncidentReportsCount },
          { name: "Settled", value: settledIncidentReportsCount },
          { name: "Resolved", value: resolvedIncidentReportsCount },
          { name: "Archived", value: archivedIncidentReportsCount },
        ],
        colors: ["#FF9800", "#03A9F4", "#4CAF50", "#9E9E9E"],
      },
  ];



  // for toggles per box
  const toggleChartBoxOne = () => {
    setCurrentChartBoxOne((prev) => (prev + 1) % chartsBoxOne.length);
  };
  // const toggleChartBoxTwo = () => {
  //   setCurrentChartBoxTwo((prev) => (prev + 1) % chartsBoxTwo.length);
  // };
  // const toggleChartBoxThree = () => {
  //   setCurrentChartBoxThree((prev) => (prev + 1) % chartsBoxThree.length);
  // };
  // const toggleChartBoxFour = () => {
  //   setCurrentChartBoxFour((prev) => (prev + 1) % chartsBoxFour.length);
  // };
  // const toggleChartBoxFive = () => {
  //   setCurrentChartBoxFive((prev) => (prev + 1) % chartsBoxFive.length);
  // };
  const toggleChartBoxSix = () => {
    setCurrentChartBoxSix((prev) => (prev + 1) % chartsBoxSix.length);
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
  const IN_BARANGAY_REQUESTS_COLORS = ["#2196F3", "#673AB7", "#FF9800", "#4CAF50", "#FFEB3B", "#F44336"];
  const WEEKLY_BARANGAY_REQUESTS_COLORS = ["#03A9F4", "#9C27B0", "#FF5722", "#8BC34A", "#FFC107", "#E91E63"];
  
  

  return (
    <main className="main-container">
      <p className="dashboard">Summaries</p>
        <div className="summaries-section">

        <div className="metric-card">
          <div className="card-left-side">
            <Link href="/dashboard/ResidentModule">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {chartsBoxOne[currentChartBoxOne].title}
              </p>
            </Link>
            <p className="count">{chartsBoxOne[currentChartBoxOne].count}</p>
          </div>

          <div className="card-right-side">
            <div className="chart-controls">
              <button onClick={toggleChartBoxOne}>Next</button>
            </div>
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={chartsBoxOne[currentChartBoxOne].data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {chartsBoxOne[currentChartBoxOne].data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartsBoxOne[currentChartBoxOne].colors[index % chartsBoxOne[currentChartBoxOne].colors.length]} />
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
          <ResponsiveContainer width={300} height={300}>
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
                  Weekly Statuses of Requested Documents and Total statuses of Requested Documents( to be implemented):
                  </p>
                </Link>
                <p className="count">{residentsCount}</p>
              </div>

          <div className="card-right-side">
          <ResponsiveContainer width={300} height={300}>
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
                  Weekly Requested Documents and Total Requested Documents (To be implemented)
                  </p>
                </Link>
                  <p className="count">{incidentReportsCount}</p>
            </div>

            <div className="card-right-side">
              
          <ResponsiveContainer width={300} height={300}>
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
            <Link href="/dashboard/IncidentModule">
              <p className="title" style={{ cursor: "pointer", textDecoration: "underline" }}>
                {chartsBoxSix[currentChartBoxSix].title}
              </p>
            </Link>
            <p className="count">{chartsBoxSix[currentChartBoxSix].count}</p>
          </div>

          <div className="card-right-side">
            <div className="chart-controls">
              <button onClick={toggleChartBoxSix}>Next</button>
            </div>
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={chartsBoxSix[currentChartBoxSix].data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {chartsBoxSix[currentChartBoxSix].data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartsBoxSix[currentChartBoxSix].colors[index % chartsBoxSix[currentChartBoxSix].colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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

      <p className="dashboard">Incident Heat Map</p>

          <div className="heatmap-container">
                  
        

          </div>

     

      
    </main>
  );
}
