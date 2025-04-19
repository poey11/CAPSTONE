"use client";
import "@/CSS/IncidentModule/MainDashboardIncident.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllSpecificDocument, deleteDocument } from "@/app/helpers/firestorehelper";
import { useSession } from "next-auth/react";

const statusOptions = ["Pending", "Resolved", "Settled", "Archived"];

export default function Department() {
  const { data: session } = useSession();
  const userDepartment = session?.user?.department;
  const userPosition = session?.user?.position;
  const userRole = session?.user?.role;

  
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]); // Ensure this is populated
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 10; // Can be changed
  

  const router = useRouter();
  const searchParam = useSearchParams();
  const departmentId = searchParam.get("id");

  const isAuthorized =
  userDepartment === departmentId ||
  (
    (userPosition === "LT Staff" || userPosition === "Assistant Secretary") &&
    userRole === "Barangay Official"
  );


  useEffect(() => {
    if (departmentId) {
      try {
        const unsubscribe = getAllSpecificDocument("IncidentReports", "department", "==", departmentId, (data) => {
          setIncidentData(data);
          setFilteredIncidents(data); // Update filteredIncidents when data is fetched
        });
  
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      } catch (error) {
        console.error("Error fetching incident data:", error);
        
      }
    
    }
  }, [departmentId]);


  const handleView = (reportId: string) => {
    router.push(`/dashboard/IncidentModule/ViewIncident?id=${reportId}`);
  };

  const handleEdit = (reportId: string) => {
    if (isAuthorized) {
      router.push(`/dashboard/IncidentModule/EditIncident?id=${reportId}`);
    }
  };

  const handleDelete = (reportId: string) => {
    if (isAuthorized) {
      deleteDocument("IncidentReports", reportId);
      deleteDocument("IncidentReports/Investigator", reportId);
    }
  };


//FILTERS LOGIC

const [showCount, setShowCount] = useState<number>(0);
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
const [selectedStatus, setSelectedStatus] = useState<string>("");
const [caseNumberSearch, setCaseNumberSearch] = useState("");


useEffect(() => {
  let filtered = [...incidentData];

  // Filter by status
  if (selectedStatus) {
    filtered = filtered.filter(
      (incident) =>
        incident.status?.toLowerCase().trim() === selectedStatus.toLowerCase()
    );
  }

  // Filter by case number segment
  if (caseNumberSearch) {
    filtered = filtered.filter((incident) => {
      const segments = incident.caseNumber?.split(" - ");
      const lastSegment = segments?.[2]?.trim();
      return lastSegment?.includes(caseNumberSearch.trim());
    });
  }

  // Sort
  filtered.sort((a, b) => {
    const numA = parseInt(a.residentNumber, 10) || 0;
    const numB = parseInt(b.residentNumber, 10) || 0;
    return sortOrder === "asc" ? numA - numB : numB - numA;
  });

  // Limit
  if (showCount) {
    filtered = filtered.slice(0, showCount);
  }

  setFilteredIncidents(filtered);
}, [incidentData, selectedStatus, showCount, sortOrder, caseNumberSearch]);


  // Pagination logic
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = filteredIncidents.slice(indexOfFirstIncident, indexOfLastIncident);
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbersToShow.push(i);
      } else if (
        (i === currentPage - 2 || i === currentPage + 2) &&
        pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
      ) {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  return (
    <main className="main-container-departments">
      <div className="section-1-departments">
        <h1>Lupon Tagapamayapa: {departmentId} Table</h1>
        <button className="add-announcement-btn-departments" onClick={() => router.push(`/dashboard/IncidentModule/AddIncident?departmentId=${departmentId}`)}>
          Add New Incident
        </button>
      </div>

      <div className="section-2-departments">
        <input type="text" className="search-bar-departments" placeholder="Enter Incident Case" />
        <select className="featuredStatus-departments">
          <option value="" disabled>Status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select className="featuredStatus-departments">
          <option value="" disabled>Show...</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
          <option value="10">Show 15</option>
        </select>


      </div>

      <div className="main-section-departments">
  {currentIncidents.length === 0 ? (
    <div className="no-result-card">
       <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
      <p className="no-results-department">No Results Found</p>
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Case #</th>
          <th>Date & Time of the Incident</th>
          <th>Nature of Complaint</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentIncidents.map((incident, index) => (
          <tr key={index}>
            <td>{incident.caseNumber}</td>
            <td>{incident.dateFiled} {incident.timeFiled}</td>
            <td>{incident.nature}</td>
            <td>
              <span className={`status-badge-departments ${incident.status.toLowerCase().replace(" ", "-")}`}>
                {incident.status}
              </span>
            </td>
            <td>
              <div className="actions-departments-main">
                <button className="action-view-departments-main" onClick={(e) => { e.stopPropagation(); handleView(incident.id); }}>View</button>
                {isAuthorized && (
                  <>
                    <button className="action-edit-departments-main" onClick={(e) => { e.stopPropagation(); handleEdit(incident.id); }}>Edit</button>
                    <button className="action-delete-departments-main" onClick={(e) => { e.stopPropagation(); handleDelete(incident.id); }}>Delete</button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>



<div className="redirection-section-departments">
        <button onClick={prevPage} disabled={currentPage === 1}>&laquo;</button>
        {getPageNumbers().map((number, index) => (
          <button
            key={index}
            onClick={() => typeof number === 'number' && paginate(number)}
            className={currentPage === number ? "active" : ""}
          >
            {number}
          </button>
        ))}
        <button onClick={nextPage} disabled={currentPage === totalPages}>&raquo;</button>
      </div>

    </main>
  );
}
