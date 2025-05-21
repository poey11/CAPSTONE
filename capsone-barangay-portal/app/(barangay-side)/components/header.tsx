"use client";

import "@/CSS/barangaySide/header.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Header() {
  const pathname = usePathname();

  const routeInfo = useMemo(() => {
    const map: Record<string, { title: string; breadcrumb: string[] }> = {

    /*
      NOTE: will add the remaining path links pa
    */
    /* Dashboard */
      // Summaries
      "/dashboard": {
        title: "Summaries",
        breadcrumb: ["Dashboard", "Summaries"],
      },
      // Generate Report
      "/dashboard/ReportsModule": {
        title: "Reports Module",
        breadcrumb: ["Dashboard", "Reports Module"],
      },

    /* User and Roles*/
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


      
      //NEED PA AYUSIN VIEEWS FOR PENDING AND RESIDENT USEERS KASI SAME CSS SILA 
      //MAY BUG PA

      //Pending Resident Useers
      "/dashboard/admin/PendingResidentUsers": {
        title: "Pending Resident Users",
        breadcrumb: ["User and Roles", "Pending Resident Users"],
      },

       "/dashboard/admin/viewResidentUser": {
        title: "Pending Resident Users",
        breadcrumb: ["User and Roles", "Pending Resident Users", "View Pending Resident Users"],
      },

    

      //ResidentUsers
      "/dashboard/admin/ResidentUsers": {
        title: "Resident Users",
        breadcrumb: ["User and Roles", "Resident Users"],
      },





      // Resident Management
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

      // Jobseeker
      "/dashboard/ResidentModule/FirstTimeJobSeeker": {
        title: "First-Time Job Seeker List",
        breadcrumb: ["Residents Management", "First-Time Job Seeker List"],
      },

    };

    // default
    return (
      map[pathname] || {
        title: "Undefined",
        breadcrumb: ["Undefined"],
      }
    );
  }, [pathname]);

  return (
    <div className="header-main-container">
      <div className="add-resident-main-header">
        <div className="path-section">
        {routeInfo.breadcrumb.map((crumb, index) => {
          const isLast = index === routeInfo.breadcrumb.length - 1;
          const Tag = isLast ? "h2" : "h1";

          // Build the dynamic href from the pathname
          const pathSegments = pathname.split("/").filter(Boolean); // removes empty strings
          const href = "/" + pathSegments.slice(0, index + 1).join("/");

          return (
            <Tag className="breadcrumb" key={index}>
              {!isLast && index !== 0 ? (
                <Link href={href}>{crumb}</Link>
              ) : (
                crumb
              )}
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
