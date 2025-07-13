"use client";

import "@/CSS/barangaySide/header.css";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from '@/app/db/firebase';

export default function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State to hold loaded resident status
  const [viewedResidentStatus, setViewedResidentStatus] = useState<string | null>(null);

  // Fetch the resident status from Firestore if on /viewResidentUser
  useEffect(() => {
    const fetchResidentStatus = async () => {
      if (pathname === "/dashboard/admin/viewResidentUser") {
        const id = searchParams.get("id");
        if (id) {
          const docRef = doc(db, "ResidentUsers", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setViewedResidentStatus(docSnap.data().status || null);
          }
        }
      }
    };
    fetchResidentStatus();
  }, [pathname, searchParams]);

  const routeInfo = useMemo(() => {
    const departmentId = searchParams.get("id");

    const departmentLabels: Record<string, string> = {
      Lupon: "LUPON",
      GAD: "GAD",
      BCPC: "BCPC",
      VAWC: "VAWC",
    };

    // Dynamic mapping for departments
    const dynamicIncidentModuleMap: Record<string, { title: string; breadcrumb: string[] }> = {
      Lupon: {
        title: "Lupon Tagapamayapa: LUPON",
        breadcrumb: ["Incident Management", "LUPON"],
      },
      GAD: {
        title: "Lupon Tagapamayapa: GAD",
        breadcrumb: ["Incident Management", "GAD"],
      },
      BCPC: {
        title: "Lupon Tagapamayapa: BCPC",
        breadcrumb: ["Incident Management", "BCPC"],
      },
      VAWC: {
        title: "Lupon Tagapamayapa: VAWC",
        breadcrumb: ["Incident Management", "VAWC"],
      },
    };

    /* NOTE: Will add the other links pa */
    const staticMap: Record<string, { title: string; breadcrumb: string[] }> = {
    /* 
      Dashboard 
    */
      // Summaries
      "/dashboard": {
        title: "Summaries",
        breadcrumb: ["Dashboard", "Summaries"],
      },
      // Generate Report
      "/dashboard/ReportsModule?section=generate": {
        title: "Reports Module",
        breadcrumb: ["Dashboard", "Reports Module", "Generate Report"],
      },
      // Download Form
      "/dashboard/ReportsModule?section=download": {
        title: "Reports Module",
        breadcrumb: ["Dashboard", "Reports Module", "Download Form"],
      },

    /* 
      User and Roles  
    */
      // Barangay Users
      "/dashboard/admin/BarangayUsers": {
        title: "Barangay Users",
        breadcrumb: ["User and Roles", "Barangay Users"],
      },
      "/dashboard/admin/addBarangayUser": {
        title: "Barangay Users",
        breadcrumb: ["User and Roles", "Barangay Users", "Add Barangay User"],
      },
      "/dashboard/admin/viewBarangayUser": {
        title: "Barangay Users",
        breadcrumb: ["User and Roles", "Barangay Users", "View Barangay User"],
      },
      "/dashboard/admin/modifyBarangayAcc": {
        title: "Barangay Users",
        breadcrumb: ["User and Roles", "Barangay Users", "Edit Barangay User"],
      },
      // ResidentUsers 
      "/dashboard/admin/ResidentUsers": {
        title: "Resident Users",
        breadcrumb: ["User and Roles", "Resident Users"],
      },

      // NEED PA AYUSIN VIEEWS FOR PENDING AND RESIDENT USEERS KASI SAME CSS SILA 
      // MAY BUG PA

      "/dashboard/admin/viewResidentUser": {
        title: "Pending Resident Users",
        breadcrumb: ["User and Roles", "Pending Resident Users", "View Pending Resident User"],
      },

    /*
      Resident Management
    */
      // Main Residents
      "/dashboard/ResidentModule": {
        title: "Main Residents",
        breadcrumb: ["Residents Management", "Main Residents"],
      },
      "/dashboard/ResidentModule/AddResident": {
        title: "Main Residents",
        breadcrumb: ["Residents Management", "Main Residents", "Add New Resident"],
      },
      "/dashboard/ResidentModule/EditResident": {
        title: "Main Residents",
        breadcrumb: ["Residents Management", "Main Residents", "Edit Resident"],
      },
      "/dashboard/ResidentModule/ViewResident": {
        title: "Main Residents",
        breadcrumb: ["Residents Management", "Main Residents", "Resident Details"],
      },
      // Voter
      "/dashboard/ResidentModule/registeredVoters": {
        title: "Registered Voters",
        breadcrumb: ["Residents Management", "Registered Voters"],
      },
      "/dashboard/ResidentModule/registeredVoters/AddVoter": {
        title: "Registered Voters",
        breadcrumb: ["Residents Management", "Registered Voters", "Add New Voter"],
      },
      "/dashboard/ResidentModule/registeredVoters/EditVoter": {
        title: "Registered Voters",
        breadcrumb: ["Residents Management", "Registered Voters", "Edit Voter"],
      },
      "/dashboard/ResidentModule/registeredVoters/ViewVoter": {
        title: "Registered Voters",
        breadcrumb: ["Residents Management", "Registered Voters", "View Voter"],
      },
      // Kasambahay
      "/dashboard/ResidentModule/kasambahayList": {
        title: "Kasambahay Masterlist",
        breadcrumb: ["Residents Management", "Kasambahay Masterlist"],
      },
      "/dashboard/ResidentModule/kasambahayList/AddKasambahay": {
        title: "Kasambahay Masterlist",
        breadcrumb: ["Residents Management", "Kasambahay Masterlist", "Add New Kasambahay"],
      },
      "/dashboard/ResidentModule/kasambahayList/EditKasambahay": {
        title: "Kasambahay Masterlist",
        breadcrumb: ["Residents Management", "Kasambahay Masterlist", "Edit Kasambahay"],  
      },
      "/dashboard/ResidentModule/kasambahayList/ViewKasambahay": {
        title: "Kasambahay Masterlist",
        breadcrumb: ["Residents Management", "Kasambahay Masterlist", "View Kasambahay"],
      },
      // Jobseeker
      "/dashboard/ResidentModule/FirstTimeJobSeeker": {
        title: "First-Time Job Seeker List",
        breadcrumb: ["Residents Management", "First-Time Job Seeker List"],
      },
      "/dashboard/ResidentModule/FirstTimeJobSeeker/AddFirstTimeJobSeeker": {
        title: "First-Time Job Seeker List",
        breadcrumb: ["Residents Management", "First-Time Job Seeker List", "Add New First-Time Job Seeker"],
      },
      "/dashboard/ResidentModule/FirstTimeJobSeeker/EditFirstTimeJobSeeker": {
        title: "First-Time Job Seeker List",
        breadcrumb: ["Residents Management", "First-Time Job Seeker List", "Edit First-Time Job Seeker"],
      },
      "/dashboard/ResidentModule/FirstTimeJobSeeker/ViewFirstTimeJobSeeker": {
        title: "First-Time Job Seeker List",
        breadcrumb: ["Residents Management", "First-Time Job Seeker List", "View Job Seeker"],
      },

      // For Online Reports
      "/dashboard/IncidentModule/OnlineReports": {
        title: "Incident Online Reports",
        breadcrumb: ["Incident Management", "Online Reports"],
      },
      "/dashboard/IncidentModule/OnlineReports/ViewOnlineReport": {
        title: "View Online Reports",
        breadcrumb: ["Incident Management", "Online Reports", "View Online Report"],
      },

      "/dashboard/IncidentModule": {
        title: "Main Dashboard Incident Management",
        breadcrumb: ["Incident Management", "Main Dashboard"],
      },

      // For In Barangay Requests
      "/dashboard/ServicesModule/InBarangayRequests": {
        title: "In Barangay Documents Requests",
        breadcrumb: ["Services Management", "In Barangay Requests"],
      },
      "/dashboard/ServicesModule/InBarangayRequests/GenerateDocument": {
        title: "In Barangay Documents Requests",
        breadcrumb: ["Services Management", "In Barangay Requests", "New Document Request"],
      },
      "/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/addNewDoc": {
        title: "In Barangay Documents Requests",
        breadcrumb: ["Services Management", "In Barangay Requests", "New Document Request", "Add New Document"],
      },
      "/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/Action": {
        title: "In Barangay Documents Requests",
        breadcrumb: ["Services Management", "In Barangay Requests", "New Document Request"],
      },

      // For Online Requests
      "/dashboard/ServicesModule/OnlineRequests": {
        title: "Online Documents Requests",
        breadcrumb: ["Services Management", "Online Requests"],
      },

      // Appointments
      "/dashboard/ServicesModule/Appointments": {
        title: "Scheduled Appointments",
        breadcrumb: ["Services Management", "Appointments"],
      },
    };

    
    // Check for dynamic IncidentModule main page route
    if (pathname === "/dashboard/IncidentModule/Department" && departmentId) {
      return dynamicIncidentModuleMap[departmentId] || {
        title: "Lupon Tagapamayapa: Unknown",
        breadcrumb: ["Incident Management", departmentId],
      };
    }

    
    // Check for dynamic IncidentModule view page route
    if (pathname === "/dashboard/IncidentModule/ViewIncident" && departmentId && departmentLabels[departmentId]) {
      return {
        title: `Lupon Tagapamayapa: ${departmentLabels[departmentId]}`,
        breadcrumb: ["Incident Management", departmentLabels[departmentId], "View Incident"],
      };
    }

    

    // Override dynamically for viewResidentUser if Firestore status loaded
    if (pathname === "/dashboard/admin/viewResidentUser" && viewedResidentStatus) {
      if (viewedResidentStatus === "Verified") {
        return {
          title: "View Verified User",
          breadcrumb: ["User and Roles", "Resident Users", "View Verified User"],
        };
      } else {
        return {
          title: "View Pending Resident User",
          breadcrumb: ["User and Roles", "Pending Resident Users", "View Pending Resident User"],
        };
      }
    }


    // Check if pathname is ReportsModule and look at 'section' query param
    if (pathname === "/dashboard/ReportsModule") {
      const section = searchParams.get("section");
      if (section === "generate") {
        return {
          title: "Reports Module",
          breadcrumb: ["Dashboard", "Reports Module", "Generate Report"],
        };
      } else if (section === "download") {
        return {
          title: "Reports Module",
          breadcrumb: ["Dashboard", "Reports Module", "Download Form"],
        };
      }
    }

    // Check if pathname is ResidentUsers and look at 'section' query param
    if (pathname === "/dashboard/admin/ResidentUsers") {
      const section = searchParams.get("section");
      if (section === "verified") {
        return {
          title: "Resident Users",
          breadcrumb: ["User and Roles", "Resident Users", "Verified Users"],
        };
      } else if (section === "pending") {
        return {
          title: "Resident Users",
          breadcrumb: ["Dashboard", "Resident Users", "Pending Users"],
        };
      }
    }

    // Check if pathname is InBarangayRequests and look at 'section' query param
    if (pathname === "/dashboard/ServicesModule/InBarangayRequests") {
      const section = searchParams.get("section");
      if (section === "allrequest") {
        return {
          title: "In Barangay Requests",
          breadcrumb: ["Services Management", "In Barangay Requests", "All Requests"],
        };
      } else if (section === "assignedtasks") {
        return {
          title: "In Barangay Requests",
          breadcrumb: ["Services Management", "In Barangay Requests", "Assigned Tasks"],
        };
      }
    }

    // Fallback to static routes
    return staticMap[pathname] || {
      title: "Undefined",
      breadcrumb: ["Undefined"],
    };
  }, [pathname, Array.from(searchParams.entries()).toString(), viewedResidentStatus]);

  return (
<div className="header-main-container">
  <div className="main-header">
    <div className="path-section">
      {routeInfo.breadcrumb.map((crumb, index) => {
        const isLast = index === routeInfo.breadcrumb.length - 1;
        const Tag = isLast ? "h2" : "h1";

            const pathSegments = pathname.split("/").filter(Boolean);
            const href = "/" + pathSegments.slice(0, index + 1).join("/");

            return (
             <Tag className="breadcrumb" key={index}>
              {crumb}
              {!isLast && <span className="chevron">/</span>}
            </Tag>
            );
          })}
        </div>

        <div className="addresident-page-title-section-1">
          <h1>{routeInfo.title}</h1>
        </div>
      </div>
    </div>
  );
}
