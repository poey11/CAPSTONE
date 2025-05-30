"use client";
import "@/CSS/IncidentModule/OnlineReporting.css";
import { useState, useEffect } from "react";
import { getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import { useRouter } from "next/navigation";

const statusOptions = ["All", "Acknowledged", "Pending"];

export default function OnlineReports() {
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchNameQuery, setSearchNameQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [caseNumberSearch, setCaseNumberSearch] = useState("");
  const [showCount, setShowCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = getAllSpecificDocument("IncidentReports", "department", "==", "Online", setIncidentData);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let data = [...incidentData];
  
    // Filter by case number segment
  if (caseNumberSearch) {
    data = data.filter((incident) => {
      const segments = incident.caseNumber?.split(" - ");
      const lastSegment = segments?.[2]?.trim();
      return lastSegment?.includes(caseNumberSearch.trim());
    });
  }

    if (searchNameQuery) {
      const query = searchNameQuery.toLowerCase();
      data = data.filter(
        (incident) =>
          (typeof incident.firstname === "string" && incident.firstname.toLowerCase().includes(query)) ||
          (typeof incident.lastname === "string" && incident.lastname.toLowerCase().includes(query))
      );
    }
    
    if (selectedStatus !== "All") {
      data = data.filter((incident) => incident.status === selectedStatus);
    }
  
    // Custom sorting function
    data.sort((a, b) => {
      const extractNumbers = (caseNum: string) => {
        if (!caseNum || caseNum === "N/A") return [Infinity, Infinity]; // Push N/A to bottom
        const match = caseNum.match(/^(\d{8})\s*-\s*(\d{4})$/); // Match "YYYYMMDD - XXXX"
        return match ? [parseInt(match[1], 10), parseInt(match[2], 10)] : [Infinity, Infinity];
      };
  
      const [dateA, seqA] = extractNumbers(a.caseNumber);
      const [dateB, seqB] = extractNumbers(b.caseNumber);
  
      return dateA !== dateB ? dateB - dateA : seqA - seqB; // Sort by date (desc), then sequence (asc)
    });
  
    setFilteredData(data);
  }, [incidentData, searchQuery, searchNameQuery, selectedStatus, caseNumberSearch]);
  
  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      const extractNumbers = (caseNum: string) => {
        if (!caseNum || caseNum === "N/A") return [Infinity, Infinity]; // Push "N/A" to bottom
        const match = caseNum.match(/^(\d{8})\s*-\s*(\d{4})$/); // Match "YYYYMMDD - XXXX"
        return match ? [parseInt(match[1], 10), parseInt(match[2], 10)] : [Infinity, Infinity];
      };
  
      const [dateA, seqA] = extractNumbers(a.caseNumber);
      const [dateB, seqB] = extractNumbers(b.caseNumber);
  
      return sortOrder === "desc"
        ? dateA !== dateB
          ? dateA - dateB // Ascending by date
          : seqA - seqB // Ascending by sequence
        : dateA !== dateB
        ? dateB - dateA // Descending by date
        : seqB - seqA; // Descending by sequence
    });
  };
  
  useEffect(() => {
    console.log("Fetched Incident Data:", incidentData);
  }, [incidentData]);

  useEffect(() => {
    let data = [...incidentData];
  
    if (searchQuery) {
      data = data.filter(
        (incident) =>
          typeof incident.caseNumber === "string" && incident.caseNumber.includes(searchQuery)
      );
    }

    if (searchNameQuery) {
      const query = searchNameQuery.toLowerCase();
      data = data.filter(
        (incident) =>
          (typeof incident.firstname === "string" && incident.firstname.toLowerCase().includes(query)) ||
          (typeof incident.lastname === "string" && incident.lastname.toLowerCase().includes(query))
      );
    }
    
    if (selectedStatus !== "All") {
      data = data.filter((incident) => incident.status === selectedStatus);
    }

      // Limit
  if (showCount) {
    data = data.slice(0, showCount);
  }
  
    setFilteredData(sortData(data));
  }, [incidentData, searchQuery, searchNameQuery, selectedStatus, sortOrder, showCount]);
  
  

  const router = useRouter();

  const handleViewOnlineReport = (id: string) => {
    router.push(`/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${id}`);
  };


    // Pagination logic

   
    const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]); // Ensure this is populated
    const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 10; // Can be changed
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = filteredData.slice(indexOfFirstIncident, indexOfLastIncident);
  const totalPages = Math.ceil(filteredData.length / incidentsPerPage);
  
  
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
    <main className="main-container">
      <div className="section-1">
        <h1>Online Reports</h1>
      </div>

      <div className="section-2">
        <input
          type="text"
          className="search-bar"
          placeholder="Enter Case Number (e.g. 0001)"
          value={caseNumberSearch}
          onChange={(e) => setCaseNumberSearch(e.target.value)}
        />
        <input
          type="text"
          className="search-bar"
          placeholder="Enter Name"
          value={searchNameQuery}
          onChange={(e) => setSearchNameQuery(e.target.value)}
        />
        <select
          className="featuredStatus"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
    
        <select
          className="featuredStatus"
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
        >
          <option value="0">Show All</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
          <option value="10">Show 15</option>
        </select>

      </div>

      <div className="main-section">
  {currentIncidents.length === 0 ? (
    <div className="no-result-card">
      <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
      <p className="no-results-department">No Results Found</p>
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Filed</th>
          <th onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} style={{ cursor: "pointer" }}>
            Case Number {sortOrder === "asc" ? "🔼" : "🔽"}
          </th>
          <th>Complainant's Full Name</th>
          <th>Date Filed</th>
          <th>Concern</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {currentIncidents.map((incident, index) => {
          const fullName = `${incident.lastname || ""}, ${incident.firstname || ""}`.trim();
          return (
            <tr key={index}>
              <td>{incident.isFiled === true ? "Filed" : "Not Yet Filed"}</td>
              <td>{incident.caseNumber || "N/A"}</td>
              <td>{fullName}</td>
              <td>{incident.dateFiled}</td>
              <td>{incident.concerns}</td>
              <td>
                <span className={`status-badge ${incident.status.toLowerCase().replace(" ", "-")}`}>
                  {incident.status}
                </span>
              </td>
              <td>
                <div className="actions">
                  <button className="action-edit" onClick={() => handleViewOnlineReport(incident.id)}>Edit</button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  )}
</div>


      <div className="redirection-section-online">
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
