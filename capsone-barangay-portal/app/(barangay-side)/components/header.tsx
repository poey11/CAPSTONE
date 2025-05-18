"use client";

import "@/CSS/barangaySide/header.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Header() {
  const pathname = usePathname();

  const routeInfo = useMemo(() => {
    const map: Record<string, { title: string; breadcrumb: string[] }> = {
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

      // Resident Management
      "/dashboard/ResidentModule": {
        title: "Main Residents",
        breadcrumb: ["Residents Management", "Main Residents"],
      },
      "/dashboard/ResidentModule/AddResident": {
        title: "Main Residents",
        breadcrumb: ["Residents Management", "Main Residents", "Add Resident"],
      },

      // Kasambahay
      "/dashboard/KasambahayModule": {
        title: "Kasambahay List",
        breadcrumb: ["Residents Management", "Kasambahay List"],
      },

      // Default fallback
    };

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
