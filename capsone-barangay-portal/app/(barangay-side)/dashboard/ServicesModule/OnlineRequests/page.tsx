"use client"
import "@/CSS/barangaySide/ServicesModule/OnlineRequests.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";




  export default function OnlineRequests() {
    const [requestData, setRequestData] = useState<any[]>([]);
    const router = useRouter();
    const [searchType, setSearchType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const { data: session } = useSession();
    const user = session?.user || null; // Get user from session or set to null if not available
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [allOnlineRequests, setAllOnlineRequests] = useState<any[]>([]);
    const [taskAssignedData, setTaskAssignedData] = useState<any[]>([]);

     const isAuthorized = ["Assistant Secretary", "Secretary", "Admin Staff"].includes(user?.position || "");

    // Helpers to manage viewed requests
      const getViewedRequests = (): string[] => {
        const data = localStorage.getItem("viewedRequests");
        return data ? JSON.parse(data) : [];
      };
      
      const markAsViewed = async (id: string) => {
        try {
          const docRef = doc(db, "ServiceRequests", id);
          await updateDoc(docRef, { isViewed: true });
        } catch (error) {
          console.error("Error marking request as viewed:", error);
        }
    };
    

        const canSeeTasks =
      user?.position === "Admin Staff" ||
      user?.position === "Secretary" ||
      user?.position === "Assistant Secretary";


    useEffect(() => {
      let position ="";
      if(user?.position === "Admin Staff") {
        position = "Admin Staff";
      }
      else if (user?.position === "Secretary" || user?.position === "Assistant Secretary") {
        position = "SAS";
      }
      console.log("User Position:", position);
      try {
        const Collection = query(
          collection(db, "ServiceRequests"),
          where("accID", "!=", "INBRGY-REQ"), // Filter for Online requests
          orderBy("createdAt", "desc") // First, sort by latest
        );

        const viewed = getViewedRequests();
      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          let reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew: doc.data().isViewed === false,  // Tag new ones
          }));
          
          // Filter reports based on user position
          const filteredReports = reports.filter((report) => report.sendTo === position && (report.status !== "Completed" && report.status !== "Rejected"));

          // Now sort client-side: Pending (1) first, then Pickup (2), etc.
          filteredReports.sort((a, b) => {
            if (a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority; // status priority asc
            }
          
            // Convert string dates to timestamps
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        
          setRequestData(filteredReports);
         setTaskAssignedData(filteredReports);

        setLoading(false);
        setError(null);
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
      }
    }, [user]);
    console.log(requestData);

   

    useEffect(() => {
      
      try {
        const Collection = query(
          collection(db, "ServiceRequests"),
          where("accID", "!=", "INBRGY-REQ"), // Filter for Online requests
          orderBy("createdAt", "desc") // First, sort by latest
        );

        const viewed = getViewedRequests();
      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          let reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            isNew: doc.data().isViewed === false,  // Tag new ones
          }));
          

          // Now sort client-side: Pending (1) first, then Pickup (2), etc.
          reports.sort((a, b) => {
            if (a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority; // status priority asc
            }
          
            // Convert string dates to timestamps
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        
          setAllOnlineRequests(reports);
          
        setLoading(false);
        setError(null);
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
      }
    }, [user]);

    
const normalizeStatus = (status: string): string =>
  status.toLowerCase().replace(/\s*-\s*/g, "-").trim();

useEffect(() => {
  let filtered = allOnlineRequests;

  // Filter by Document Type
  if (searchType !== "" && searchType !== "All") {
    filtered = filtered.filter((req) =>
      req.docType.toLowerCase().includes(searchType.toLowerCase())
    );
  }

  // Filter by Date Range
  if (dateFrom && dateTo) {
    filtered = filtered.filter((req) => {
      const requestDate = new Date(req.createdAt);
      return requestDate >= new Date(dateFrom) && requestDate <= new Date(dateTo);
    });
  }

  // Filter by Status
  if (statusFilter !== "") {
    filtered = filtered.filter(
      (req) => normalizeStatus(req.status) === normalizeStatus(statusFilter)
    );
  }

  setFilteredOnlineRequests(filtered);
  setMainCurrentPage(1);
}, [searchType, dateFrom, dateTo, statusFilter, allOnlineRequests]);




    console.log(requestData);

    
    const [mainCurrentPage, setMainCurrentPage] = useState(1);
    const [taskCurrentPage, setTaskCurrentPage] = useState(1);
     const [filteredOnlineRequests, setFilteredOnlineRequests] = useState<any[]>([]);

    const requestsPerPage = 10;

    // MAIN pagination
    const mainIndexOfLast = mainCurrentPage * requestsPerPage;
    const mainIndexOfFirst = mainIndexOfLast - requestsPerPage;
    const currentMainRequests = filteredOnlineRequests.slice(mainIndexOfFirst, mainIndexOfLast);
    const mainTotalPages = Math.ceil(filteredOnlineRequests.length / requestsPerPage);

    // TASK pagination
    const taskIndexOfLast = taskCurrentPage * requestsPerPage;
    const taskIndexOfFirst = taskIndexOfLast - requestsPerPage;
    const currentTaskRequests = taskAssignedData.slice(taskIndexOfFirst, taskIndexOfLast);
    const taskTotalPages = Math.ceil(taskAssignedData.length / requestsPerPage);



   const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pageNumbersToShow = [];
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


    const handleView = (request: any) => {
      console.log("Viewing request:", request);
      const id = request.id;
      markAsViewed(id); // mark before navigating
      if(request.type === "OtherDocument") {
        router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest/otherDocument?id=${id}`);
        router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest/otherDocument?id=${id}`);
      }
      else{
        router.push(`/dashboard/ServicesModule/ViewRequest?id=${id}`);
        
      }
    };


  // Highlighting Logic based on the URL parameter
  const searchParams = useSearchParams();
  const highlightResidentId = searchParams.get("highlight");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);


  useEffect(() => {
    if (highlightResidentId && filteredOnlineRequests.length > 0) {
      const targetIndex = filteredOnlineRequests.findIndex(resident => resident.id === highlightResidentId);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / requestsPerPage) + 1;
        setHighlightedId(highlightResidentId);
        setMainCurrentPage(targetPage);

        setTimeout(() => {
          const targetElement = document.querySelector(`tr[data-id="${highlightResidentId}"]`);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 500);

        const timeoutId = setTimeout(() => {
          setHighlightedId(null);

          const params = new URLSearchParams(window.location.search);
          params.delete("highlight");
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          router.replace(newUrl, { scroll: false });
        }, 3000);

        return () => clearTimeout(timeoutId);

      }
    }
  }, [highlightResidentId, filteredOnlineRequests]);


const today = new Date().toISOString().split("T")[0]; // format: YYYY-MM-DD


  /* NEW UPDATED ADDED */
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  /* NEW UPDATED ADDED */
  useEffect(() => {
    setFiltersLoaded(false); // reset animation
    const timeout = setTimeout(() => {
      setFiltersLoaded(true); // retrigger
    }, 50); // adjust delay as needed
    return () => clearTimeout(timeout);
  }, [searchParams.toString()]);


    
  const [activeSection, setActiveSection] = useState("main");

    return (

        <main className="onlinereq-main-container" /* edited this class*/>

          <div className="onlinereq-section-1">


                {canSeeTasks && (
                  <div className={`assigned-incident-info-toggle-wrapper-online ${filtersLoaded ? "filters-animated" : ""}`}>
                    {["main", "tasks"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`info-toggle-btn-assigned-online assigned-tasks-online ${activeSection === section ? "active" : ""}`}
                        onClick={() => setActiveSection(section)}
                      >
                        {section === "main" && "All Requests"}
                        {section === "tasks" && (
                          <>
                            <span className="badge-container-online">
                              Assigned Tasks
                              {taskAssignedData.length > 0 && (
                                <span className="task-badge-online">{requestData.length}</span>
                              )}
                            </span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
         

                </div>


          {activeSection === "main" && (
          <>      


         <div className={`onlinereq-section-2 ${filtersLoaded ? "filters-animated" : ""}`}  /* edited this class*/>

     

            <div className="data-input-group-onlinereq">
              <label htmlFor="dateFrom">From Date :</label>
              <input
                type="date"
                 className={`online-services-module-filter ${dateFrom ? 'has-value' : ''}`}
                value={dateFrom}
                 max={today}
                onChange={(e) => setDateFrom(e.target.value)}
              />


            </div>

            <div className="data-input-group-onlinereq">
                <label htmlFor="dateTo">To Date :</label>
                
                <input
                  type="date"
                   className={`online-services-module-filter ${dateFrom ? 'has-value' : ''}`}
                  value={dateTo}
                   max={today}
                  onChange={(e) => setDateTo(e.target.value)}
                />

            </div>






            <div className="dropdown-group-onlinereq">

                <select
                    className={`online-services-module-filter-dropdown ${searchType ? "has-value" : ""}`}
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                        <option value="All">All Document Types</option>
                        <option value="Barangay Certificate">Barangay Certificate</option>
                        <option value="Barangay Indigency">Barangay Indigency</option>
                        <option value="Business Permit">Barangay Business Permits</option>
                        <option value="Barangay Clearance">Barangay Clearance</option>
                        <option value="Other">Other Documents</option>
                </select>

            </div>

              <div className="dropdown-group-onlinereq">

                 <select
                  className="online-services-module-filter-dropdown"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pick-up">For Pick Up</option>
                  <option value="In-Progress">In - Progress</option>
                </select>

            </div>

              
         </div>



       
      

                <div
              className={`onlinereq-main-section ${
              !isAuthorized ? "expand-when-no-section1-onlinereq" : ""
                }`}
              >
              {loading ? (
            <p>Loading Online Requests...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : filteredOnlineRequests.length === 0 ? (
            <div className="no-result-card-services">
              <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-services" />
              <p className="no-results-services">No Results Found</p>
            </div>
          ) : (
          <table>
            <thead>
              <tr>
                <th>Document Type</th>
                <th>Request ID</th>
                <th>Request Date</th>
                <th>Requestor</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
          {currentMainRequests.map((request, index) => (
              <tr key={index} className={`${request.isNew ? "highlight-new-request" : ""} ${highlightedId && request.id === highlightedId ? "highlighted-row" : ""}`}>

                <td>{request.docType}</td>
                <td>{request.requestId}</td>
                <td>{request.createdAt}</td>
                <td>{request.requestor}</td>
                <td>{request.purpose}</td>
                <td>
                    <span className={`status-badge-online-request ${request.status.toLowerCase().replace(/\s*-\s*/g, "-")}`}>
                        {request.status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                        className="action-view-services"
                        onClick={() => handleView(request)}
                    >
                    <img
                      className={isAuthorized ? "edit-icon" : "view-icon"}
                      src={isAuthorized ? "/Images/edit.png" : "/Images/view.png"}
                      alt={isAuthorized ? "Edit" : "View"}
                    />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
            )}
        </div>



          <div className="redirection-section-services">
            <button onClick={() => setMainCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={mainCurrentPage === 1}>
              &laquo;
            </button>
            {getPageNumbers(mainCurrentPage, mainTotalPages).map((number, index) => (
              <button
                key={index}
                onClick={() => typeof number === "number" && setMainCurrentPage(number)}
                className={mainCurrentPage === number ? "active" : ""}
              >
                {number}
              </button>
            ))}
            <button onClick={() => setMainCurrentPage((prev) => Math.min(prev + 1, mainTotalPages))} disabled={mainCurrentPage === mainTotalPages}>
              &raquo;
            </button>
          </div>


                        </>
        )}
 



        {canSeeTasks && activeSection === "tasks" && (
          <>

      <div className="onlinereq-main-section-tasks" /* edited this class*/>
          
              {loading ? (
            <p>Loading Online Requests...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : currentTaskRequests.length === 0 ? (
            <div className="no-result-card-services" /* edited this class */>
              <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-services" /* edited this class *//>
              <p className="no-results-services" /* edited this class */>No Results Found</p>
            </div>
          ) : (
          <table>
            <thead /* edited this class */>
              <tr>
                <th /* edited this class */>Document Type</th>
                <th>Request ID</th>
                <th>Request Date</th>
                <th>Requestor</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
          {currentTaskRequests.map((request, index) => (
              <tr /* edited this class*/
              key={index} className={`${request.isNew ? "highlight-new-request" : ""} ${highlightedId && request.id === highlightedId ? "highlighted-row" : ""}`}>

                <td /* edited this class */>{request.docType}</td>
                <td>{request.requestId}</td>
                <td>{request.createdAt}</td>
                <td>{request.requestor}</td>
                <td>{request.purpose}</td>
                <td>
                    <span className={`status-badge-online-request ${request.status.toLowerCase().replace(/\s*-\s*/g, "-")}`}>
                        {request.status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                        className="action-view-services"
                        onClick={() => handleView(request)}
                    >
                         <img src="/Images/edit.png" alt="Edit" className="edit-icon" />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
            )}
        </div>

        <div className="redirection-section-services">
          <button onClick={() => setTaskCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={taskCurrentPage === 1}>
            &laquo;
          </button>
          {getPageNumbers(taskCurrentPage, taskTotalPages).map((number, index) => (
            <button
              key={index}
              onClick={() => typeof number === "number" && setTaskCurrentPage(number)}
              className={taskCurrentPage === number ? "active" : ""}
            >
              {number}
            </button>
          ))}
          <button onClick={() => setTaskCurrentPage((prev) => Math.min(prev + 1, taskTotalPages))} disabled={taskCurrentPage === taskTotalPages}>
            &raquo;
          </button>
        </div>

                </>
        )}

      </main>
        
    );
}