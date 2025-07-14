
"use client";
import "@/CSS/IncidentModule/OnlineReporting.css";
import { useState, useEffect } from "react";
import { getAllSpecificDocument } from "@/app/helpers/firestorehelper";
import { useRouter, useSearchParams} from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import {db} from "@/app/db/firebase";
import { useSession } from "next-auth/react";

const statusOptions = ["All", "Settled", "pending", "In - Progress"];

export default function OnlineReports() {
  const [incidentData, setIncidentData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchNameQuery, setSearchNameQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const user = useSession().data?.user;
  const [caseNumberSearch, setCaseNumberSearch] = useState("");
  const [showCount, setShowCount] = useState<number>(0);
  const isAuthorized = ["LF Staff"].includes(user?.position || "");

  const [taskAssignedData, setTaskAssignedData] = useState<any[]>([]);
  const searchParams = useSearchParams();

    // Helpers to manage viewed requests
const getViewedRequests = (): string[] => {
  const data = localStorage.getItem("viewedRequests");
  return data ? JSON.parse(data) : [];
};

  // Mark as viewed in Firestore
  const markAsViewed = async (id: string) => {
    try {
      const docRef = doc(db, "IncidentReports", id);
      await updateDoc(docRef, { isViewed: true });
    } catch (error) {
      console.error("Error updating isViewed:", error);
    }
  };

  
  useEffect(() => {
  const section = searchParams.get("section");
  if (!section) {
    const params = new URLSearchParams(window.location.search);
    params.set("section", "allrecords");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }
}, []);

  useEffect(() => {
    const Collection = query(
      collection(db, "IncidentReports"), 
      where("department", "==", "Online"),
      orderBy("createdAt", "desc"));
  
      const unsubscribe = onSnapshot(Collection, (snapshot) => {
          const data:any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew: doc.data().isViewed === false, // Check if the request is new
            }));
          data.sort((a, b) => {
            if(a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority; // Sort by status priority first
            }
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Sort by createdAt in descending order
          });
          setIncidentData(data);
          setFilteredData(data);
        });
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
  }, []);

  console.log(incidentData)

  console.log("Incident Data:", incidentData);
  useEffect(() => {
    if (!user?.id) return; 
    
    try {
      const Collection = query(
        collection(db, "IncidentReports"), 
        where("respondent.respondentName", "==", user?.id),
        orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          const data:any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew: doc.data().isViewed === false, // Check if the request is new
            }));

        // ✅ FILTER HERE BEFORE setting state
          const activeTasks = data.filter(task => task.status !== "Settled");

          data.sort((a, b) => {
            if(a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority; // Sort by status priority first
            }
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Sort by createdAt in descending order
          });
          setTaskAssignedData(activeTasks); //updated from "data" MEE
        });
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };

    } catch (error) {
      console.error("Error fetching incident data:", error);
      
    }

  }, [user]);


  console.log("Task Assigned Data:", taskAssignedData);

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

  // Handle view action
  const handleViewOnlineReport = (id: string) => {
    markAsViewed(id);
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

    const [activeSection, setActiveSection] = useState("main");



    const canSeeTasks =
      user?.position === "LF Staff";

      /* NEW UPDATED ADDED */
  const [filtersLoaded, setFiltersLoaded] = useState(false);


  return (
    <main className="main-container-online-reports">


      <div className="section-1-online-reports">


          {canSeeTasks && (
    
          <div className={`assigned-incident-info-toggle-wrapper ${filtersLoaded ? "filters-animated" : ""}`}>
              {["main", "tasks"].map((section) => (
                <button
                  key={section}
                  type="button"
                  className={`info-toggle-btn-assigned ${activeSection === section ? "active" : ""}`}
                  onClick={() => {
                    setActiveSection(section);

                    // Preserve existing query params
                    const params = new URLSearchParams(window.location.search);
                    params.set(
                      "section",
                      section === "main" ? "allrecords" : "assignedtasks"
                    );

                    const newUrl = `${window.location.pathname}?${params.toString()}`;
                    router.push(newUrl, { scroll: false });
                  }}
                  style={{ position: "relative" }}
                >
                  {section === "main" && "Online Records"}
                  {section === "tasks" && (
                    <>
                      Assigned Tasks
                      {taskAssignedData.length > 0 && (
                        <span className="task-badge">{taskAssignedData.length}</span>
                      )}
                    </>
                  )}
                </button>
              ))}   
          </div> 
          )}


      </div>

      {activeSection === "main" && (
        <>

   
        <div className={`section-2-online-reports ${filtersLoaded ? "filters-animated" : ""}`}  /* edited this class*/>
        <input
          type="text"
          className="online-reports-filter"
          placeholder="Enter Case Number (e.g. 0001)"
          value={caseNumberSearch}
          onChange={(e) => setCaseNumberSearch(e.target.value)}
        />
        <input
          type="text"
          className="online-reports-filter"
          placeholder="Enter Name"
          value={searchNameQuery}
          onChange={(e) => setSearchNameQuery(e.target.value)}
        />
        <select
          className="online-reports-filter"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
    
        <select
          className="online-reports-filter"
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
        >
          <option value="0">Show All</option>
          <option value="5">Show 5</option>
          <option value="10">Show 10</option>
          <option value="10">Show 15</option>
        </select>

      </div>

  
        <div
          className={`main-section-online-reports ${
          !isAuthorized ? "expand-when-no-section1-onlinereports" : ""
          }`}
       >
        {currentIncidents.length === 0 ? (
          <div className="no-result-card">
            <img src="/images/no-results.png" alt="No results icon" className="no-result-icon" />
            <p className="no-results-department">No Results Found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} style={{ cursor: "pointer" }}>
                  Case Number 
                </th>
                <th>Complainant's Full Name</th>
                <th>Date Filed</th>
                <th>Incident Date and Time</th>
                <th>Area of Incident</th>
                <th>Concern</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentIncidents.map((incident, index) => {  
                const fullName = `${incident.lastname || ""}, ${incident.firstname || ""}`.trim();
                return (
                   <tr key={index} className={incident.isNew ? "highlight-new-request" : ""}>
                    <td>{incident.caseNumber || "N/A"}</td>
                    <td>{fullName}</td>
                    <td>{incident.createdAt}</td>
                    <td>{incident.dateFiled} {incident.time}</td>
                    <td>{incident.areaOfIncident}</td>
                    <td>{incident.concerns}</td>
                    <td>
                  <span className={`status-badge ${incident.status.toLowerCase().replace(/[\s\-]+/g, "-")}`}>
                    {incident.status}
                  </span>
                  </td>
                    <td>
                      <div className="actions-services">
                        <button className="action-edit-services " onClick={() => handleViewOnlineReport(incident.id)}><img src="/Images/edit.png" alt="Edit" /></button>
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



                        </>
                      )}





        {/* this table shows all assigned task of the current user. 
        for now it will be for LF staff but will be change to barangay officer
        i will not include the pagination for now
         */}


     {activeSection === "tasks" && (
        <>
        <div className="main-section-online-reports-tasks ">
        {taskAssignedData.length === 0 ? (
          <div className="no-task-card">
            <img src="/images/customer-service.png" alt="No results icon" className="no-task-icon" />
            <p className="no-task-department">You have no Tasks For Today!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} style={{ cursor: "pointer" }}>
                  Case Number 
                </th>
                <th>Complainant's Full Name</th>
               
                <th>Concern</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taskAssignedData
                .filter((task) => task.status !== "Settled")
                .map((tasks, index) => {
                const fullName = `${tasks.lastname || ""}, ${tasks.firstname || ""}`.trim();
                return (
                   <tr key={index} className={tasks.isNew ? "highlight-new-request" : ""}>
                    <td>{tasks.caseNumber || "N/A"}</td>
                    <td>{fullName}</td>
               
                    <td>{tasks.concerns}</td>
                    <td>
                  <span className={`status-badge ${tasks.status.toLowerCase().replace(/[\s\-]+/g, "-")}`}>
                    {tasks.status}
                  </span>
                    </td>
                    <td>
                      <div className="actions-services">
                        <button className="action-edit-services " onClick={() => handleViewOnlineReport(tasks.id)}><img src="/Images/edit.png" alt="Edit" /></button>
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

                        </>
                      )}
    </main>
  );
}
