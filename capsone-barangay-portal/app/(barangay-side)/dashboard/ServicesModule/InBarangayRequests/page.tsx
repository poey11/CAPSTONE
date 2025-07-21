"use client"
import { useRouter, useSearchParams } from "next/navigation";
import {  useEffect, useState, useRef } from "react";
import "@/CSS/barangaySide/ServicesModule/InBarangayRequests.css";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import {normalizeToTimestamp} from "@/app/helpers/helpers";



  export default function InBarangayRequests() { 
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;
    const [requestData, setRequestData] = useState<any[]>([]);
    const [searchType, setSearchType] = useState("");
   {/*} const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");*/}
    const [statusFilter, setStatusFilter] = useState("");
    const [mainSearchRequestId, setMainSearchRequestId] = useState("");
  const [mainSearchRequestor, setMainSearchRequestor] = useState("");
const [mainSearchDateString, setMainSearchDateString] = useState("");



    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [taskAssignedData, setTaskAssignedData] = useState<any[]>([]);
    const [filteredMainRequests, setFilteredMainRequests] = useState<any[]>([]);

 const isAuthorized = ["Assistant Secretary", "Secretary", "Admin Staff"].includes(user?.position || "");

  

 const [filtersLoaded, setFiltersLoaded] = useState(false);
 const hasAnimatedOnce = useRef(false);
 
 useEffect(() => {
   // Animate filters only once on initial page load
   if (!hasAnimatedOnce.current) {
     hasAnimatedOnce.current = true;
     setFiltersLoaded(false);
     const timeout = setTimeout(() => {
       setFiltersLoaded(true);
     }, 50);
     return () => clearTimeout(timeout);
   } else {
     // Never retrigger animation again
     setFiltersLoaded(true);
   }
 }, []);



/* 
Added Filters for Tasks 
*/



 const [taskStatusFilter, setTaskStatusFilter] = useState("");
const [taskSearchType, setTaskSearchType] = useState("");
const [filteredTaskRequests, setFilteredTaskRequests] = useState(taskAssignedData);
const [taskSearchRequestId, setTaskSearchRequestId] = useState("");
const [taskSearchRequestor, setTaskSearchRequestor] = useState("");
const [taskSearchDateString, setTaskSearchDateString] = useState("");


/*For Names*/
const normalizeString = (str: string) =>
  str.toLowerCase().replace(/\s+/g, " ").trim();


useEffect(() => {
  let filtered = taskAssignedData;

  if (taskSearchRequestId !== "") {
    filtered = filtered.filter((req) =>
      req.requestId.toLowerCase().includes(taskSearchRequestId.toLowerCase())
    );
  }

    if (taskSearchRequestor !== "") {
      const normalizedSearch = normalizeString(taskSearchRequestor);
      filtered = filtered.filter((req) =>
        normalizeString(req.requestor).includes(normalizedSearch)
      );
    }


  if (taskStatusFilter !== "") {
    filtered = filtered.filter(
      (req) => normalizeStatus(req.status) === normalizeStatus(taskStatusFilter)
    );
  }

    if (taskSearchDateString !== "") {
    const date = new Date(taskSearchDateString);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    filtered = filtered.filter((req) =>
      req.createdAt.startsWith(formattedDate)
    );
  }

  setFilteredTaskRequests(filtered);
  setTaskCurrentPage(1);
}, [taskAssignedData, taskSearchRequestId, taskSearchRequestor, taskStatusFilter, taskSearchDateString]);






 useEffect(() => {
  const section = searchParams.get("section");
  if (!section) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", "allrequest");
    router.replace(`?${params.toString()}`, { scroll: false });
  }
}, []);
  
      useEffect(() => {
        let position = "";
        if(user?.position === "Admin Staff"){
          position = "Admin Staff";
        }else if(user?.position === "Secretary" || user?.position === "Assistant Secretary"){
          position = "SAS";
        }
        console.log("User Position:", position);
        try {
          const Collection = query(
            collection(db,"ServiceRequests"),
            where("accID", "==", "INBRGY-REQ"), // Filter for In Barangay requests
            orderBy("createdAt", "desc") // First, sort by latest
          );      
          const unsubscribe = onSnapshot(Collection, (snapshot) => {
            let reports: any[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

             // Filter based on sendTo field
            let filterReports = reports.filter(
              (report) => report.sendTo === position && (report.status !== "Completed" && report.status !== "Rejected")
            );


            filterReports.sort((a, b) => {
              if (a.statusPriority !== b.statusPriority) {
                return a.statusPriority - b.statusPriority;
              }
            
            return new Date (b.createdAt).getTime()  - new Date(a.createdAt).getTime();
            });
          
            setRequestData(filterReports);
            setTaskAssignedData(filterReports); // add
            

            setLoading(false);
            setError(null);
            console.log(requestData);

          });
        
          return unsubscribe;
        } catch (error: any) {
          console.log(error.message);
          }
        }, [user]);
        

    



    
      const [allRequests, setAllRequests] = useState<any[]>([]);
      

      useEffect(() => {
        try {
        const Collection = query(
          collection(db,"ServiceRequests"),
          where("accID", "==", "INBRGY-REQ"), // Filter for In Barangay requests
          orderBy("createdAt", "desc") // First, sort by latest
        );      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          let reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          reports.sort((a, b) => {
            if (a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority;
            }
          
            return new Date (b.createdAt).getTime()  - new Date(a.createdAt).getTime();
          });
        
          setAllRequests(reports);
          setLoading(false);
          setError(null);
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
        }
      }, []);


    /*
      FILTER LOGIC
    */

      const canSeeTasks =
      user?.position === "Admin Staff" ||
      user?.position === "Secretary" ||
      user?.position === "Assistant Secretary";



const normalizeStatus = (status: string): string =>
  status.toLowerCase().replace(/\s*-\s*/g, "-").trim();


useEffect(() => {
  let filtered = allRequests;

  if (searchType !== "" && searchType !== "All") {
    filtered = filtered.filter((req) =>
      req.docType.toLowerCase().includes(searchType.toLowerCase())
    );
  }

  if (mainSearchRequestId !== "") {
    filtered = filtered.filter((req) =>
      req.requestId.toLowerCase().includes(mainSearchRequestId.toLowerCase())
    );
  }

  if (mainSearchRequestor !== "") {
    const normalizedSearch = normalizeString(mainSearchRequestor);
    filtered = filtered.filter((req) =>
      normalizeString(req.requestor).includes(normalizedSearch)
    );
  }

  if (statusFilter !== "") {
    filtered = filtered.filter(
      (req) => normalizeStatus(req.status) === normalizeStatus(statusFilter)
    );
  }

      if (mainSearchDateString !== "") {
      // Convert mainSearchDateString (e.g. '2025-07-17') to '7/17/2025'
      const date = new Date(mainSearchDateString);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

      filtered = filtered.filter((req) =>
        req.createdAt.startsWith(formattedDate)
      );
    }


  setFilteredMainRequests(filtered);
  setMainCurrentPage(1);
}, [searchType, mainSearchRequestId, mainSearchRequestor, statusFilter, allRequests,mainSearchDateString]);




    const handleGenerateDocument = () => {
      router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
    };

    const handleView = (id: string, reqType: string) => {
  
    const cleanedReqType = reqType === "In Barangay" ? "inbarangay" : "online";
    router.push(`/dashboard/ServicesModule/ViewRequest?reqType=${cleanedReqType}&id=${id}`);

};



  const handleDeleteClick = (documentType: string) => {
    setSelectedDocumentType(documentType); 
    setShowDeletePopup(true);
};

const confirmDelete = () => {
  setShowDeletePopup(false);

  const documentType = selectedDocumentType || "Document";
  setPopupMessage(`${documentType} deleted successfully!`);
  setShowPopup(true);

  // Hide the popup after 3 seconds
  setTimeout(() => {
    setShowPopup(false);
  }, 3000);
};


  const [mainCurrentPage, setMainCurrentPage] = useState(1);
  const [taskCurrentPage, setTaskCurrentPage] = useState(1);
 
  const requestsPerPage = 10;

  // MAIN pagination
  const mainIndexOfLast = mainCurrentPage * requestsPerPage;
  const mainIndexOfFirst = mainIndexOfLast - requestsPerPage;
  const currentMainRequests = filteredMainRequests.slice(mainIndexOfFirst, mainIndexOfLast);
const mainTotalPages = Math.ceil(filteredMainRequests.length / requestsPerPage);

  // TASK pagination
  const taskIndexOfLast = taskCurrentPage * requestsPerPage;
  const taskIndexOfFirst = taskIndexOfLast - requestsPerPage;
const currentInBarangayRequests = filteredTaskRequests.slice(taskIndexOfFirst, taskIndexOfLast);
const taskTotalPages = Math.ceil(filteredTaskRequests.length / requestsPerPage);

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

  
  const [activeSection, setActiveSection] = useState("main");
  const today = new Date().toISOString().split("T")[0]; // format: YYYY-MM-DD




const searchParams = useSearchParams();
const highlightRequestId = searchParams.get("highlight");
const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);


useEffect(() => {
  if (highlightRequestId && filteredMainRequests.length > 0) {
    const targetIndex = filteredMainRequests.findIndex(
      (req) => req.id === highlightRequestId
    );

    if (targetIndex !== -1) {
      const targetPage = Math.floor(targetIndex / requestsPerPage) + 1;
      setMainCurrentPage(targetPage);
      setHighlightedRequestId(highlightRequestId);

      setTimeout(() => {
        const targetElement = document.querySelector(`tr[data-id="${highlightRequestId}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);


        // Remove highlight and update URL after 3 seconds
        const timeoutId = setTimeout(() => {
          setHighlightedRequestId(null);

          const params = new URLSearchParams(window.location.search);
          params.delete("highlight");
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          router.replace(newUrl, { scroll: false });
        }, 3000);

        return () => clearTimeout(timeoutId);

    }
  }
}, [highlightRequestId, filteredMainRequests]);


{console.log("Assigned Tasks:", taskAssignedData)}




    return (

        <main className="inbarangayreq-main-container" >


          <div className="inbarangayreq-section-1">
            <div className="center-wrapper">
                {canSeeTasks && (
                  <div
                    className={`assigned-incident-info-toggle-wrapper ${filtersLoaded ? "filters-animated" : ""} ${
                      user?.position === "Admin Staff" ? "with-add-request" : ""
                    }`}
                  >
                    {["main", "tasks"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        className={`info-toggle-btn-assigned assigned-tasks ${activeSection === section ? "active" : ""}`}
                        onClick={() => {
                          setActiveSection(section);
                          const params = new URLSearchParams(searchParams.toString());
                          if (section === "main") {
                            params.set("section", "allrequest");
                          } else if (section === "tasks") {
                            params.set("section", "assignedtasks");
                          }
                          router.push(`?${params.toString()}`, { scroll: false });
                        }}
                      >
                        {section === "main" && "All Requests"}
                        {section === "tasks" && (
                          <>
                            <span className="badge-container">
                              Assigned Tasks
                              {taskAssignedData.length > 0 && (
                                <span className="task-badge">{taskAssignedData.length}</span>
                              )}
                            </span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            
            {(user?.position === "Admin Staff") && filtersLoaded && (
              <div className="section-generate-doc">
                <button className="add-requests-btn add-new-doc-req" onClick={handleGenerateDocument}>
                  New Document Request
                </button>
                </div>
            )}
            
          </div>



        {activeSection === "main" && (
          <>
              <div className={`inbarangayreq-section-2 ${filtersLoaded ? "filters-animated" : ""}`} /* edited this class*/> 
                
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search by Request ID (e.g. LPLHOT - 0063)"
                    className="inbarangay-services-module-filter"
                    value={mainSearchRequestId}
                    onChange={(e) => setMainSearchRequestId(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search by Requestor Name (e.g. Juan Dela Cruz)"
                    className="inbarangay-services-module-filter"
                    value={mainSearchRequestor}
                    onChange={(e) => setMainSearchRequestor(e.target.value)}
                  />
                </div>


                   <div className="dropdown-group">

                     <select
                     className={`inbarangay-services-module-filter-dropdown ${searchType ? "has-value" : ""}`}
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                      >
                        <option value="All">All Document Types</option>
                        <option value="Barangay Certificate">Barangay Certificate</option>
                        <option value="Barangay Indigency">Barangay Indigency</option>
                        <option value="Business Permit">Barangay Business Permits</option>
                        <option value="Construction">Construction Permits</option>
                        <option value="Barangay Clearance">Barangay Clearance</option>
                        <option value="Other">Other Documents</option>
                      </select>

                   </div>
                   
                    <div className="dropdown-group">

                      <select
                        className={`inbarangay-services-module-filter-dropdown ${searchType ? "has-value" : ""}`}
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

                    <div className="input-group">
                      <input
                        type="date"
                        className="inbarangay-services-module-filter"
                        value={mainSearchDateString}
                        onChange={(e) => setMainSearchDateString(e.target.value)}
                        max={today}
                      />
                    </div>



            

              </div>


                <div
              className={`inbarangayreq-main-section ${
              !isAuthorized ? "expand-when-no-section1-inbarangayreq" : ""
                }`}
              >
              {loading ? (
                  <p>Loading Online Requests...</p>
                ) : error ? (
                  <p className="error">{error}</p>
                    ) : filteredMainRequests.length === 0 ? (
                  <div className="no-result-card-inbarangay" /* edited this class */>
                    <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-inbarangay" />
                    <p className="no-results-inbarangay">No Results Found</p>
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
                  {currentMainRequests.map((request, index) => (
                      <tr /* edited this class*/
                          key={index}
                          data-id={request.id}
                          className={highlightedRequestId === request.id ? "highlighted-row" : ""}
                        >

                        <td /* edited this class */>{request.docType}</td>
                        <td>{request.requestId}</td>
                        <td>{request.createdAt}</td>
                        <td>{request.requestor}</td>
                        <td>{request.purpose}</td>
                        <td>
                        <span className={`status-badge-inbarangay ${request.status.toLowerCase().replace(/\s*-\s*/g, "-")}`}>
                            <p>{request.status}</p>
                          </span>
                        </td>
                        <td>
                          <div className="actions-inbarangay">
                            <button className="action-inbarangay-services" /* edited this class */onClick={() => handleView(request.id, request.reqType)}>
                                <img
                                  className={
                                    isAuthorized && request.status !== "Completed" && request.status !== "Rejected"
                                      ? "action-inbarangay-edit"
                                      : "action-inbarangay-view"
                                  }
                                  src={
                                    isAuthorized && request.status !== "Completed" && request.status !== "Rejected"
                                      ? "/Images/edit.png"
                                      : "/Images/view.png"
                                  }
                                  alt={
                                    isAuthorized && request.status !== "Completed" && request.status !== "Rejected"
                                      ? "Edit"
                                      : "View"
                                  }
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

            <div className="redirection-section-inbarangay" /* edited this class */>
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
              <button
                onClick={() => setMainCurrentPage((prev) => Math.min(prev + 1, mainTotalPages))}
                disabled={mainCurrentPage === mainTotalPages}
              >
                &raquo;
              </button>
            </div>
          </>
        )}

        {canSeeTasks && activeSection === "tasks" && (
          <>

          <div className="inbarangayreq-section-2 filters-animated">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search by Request ID (e.g. LPLHOT - 0063)"
                className="inbarangay-services-module-filter"
                value={taskSearchRequestId}
                onChange={(e) => setTaskSearchRequestId(e.target.value)}
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="Search by Requestor Name (e.g. Juan Dela Cruz)"
                className="inbarangay-services-module-filter"
                value={taskSearchRequestor}
                onChange={(e) => setTaskSearchRequestor(e.target.value)}
              />
            </div>

            {/*}
              <div className="dropdown-group">
                <select
                  className={`inbarangay-services-module-filter-dropdown ${taskStatusFilter ? "has-value" : ""}`}
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Pick-up">For Pick Up</option>
                  <option value="In-Progress">In - Progress</option>
                </select>
              </div>
              */}

              <div className="input-group">
                <input
                    type="date"
                    className="inbarangay-services-module-filter"
                    value={taskSearchDateString}
                    onChange={(e) => setTaskSearchDateString(e.target.value)}
                    max={today}
                  />
              </div>

          </div>


          


            <div className="inbarangayreq-main-section">
              {loading ? (
                  <p>Loading Online Requests...</p>
                ) : error ? (
                  <p className="error">{error}</p>
                ) : currentInBarangayRequests.length === 0 ? (
                    <div className="no-task-card-inbrgy">
                      <img src="/images/customer-service.png" alt="No results icon" className="no-task-icon-inbrgy" />
                      <p className="no-task-department-inbrgy">You have No Tasks For Today!</p>
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
                    {currentInBarangayRequests.map((request, index) => (
                      <tr key={index}>
                        <td>{request.docType}</td>
                        <td>{request.requestId}</td>
                        <td>{request.createdAt}</td>
                        <td>{request.requestor}</td>
                        <td>{request.purpose}</td>
                        <td>
                          <span className={`status-badge-inbarangay ${request.status.toLowerCase().replace(/\s*-\s*/g, "-")}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <div className="actions-inbarangay">
                            <button className="action-inbarangay-services" onClick={() => handleView(request.id, request.reqType)}>
                               <img src="/Images/edit.png" alt="Edit" className="action-inbarangay-edit" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="redirection-section-inbarangay">
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
              <button
                onClick={() => setTaskCurrentPage((prev) => Math.min(prev + 1, taskTotalPages))}
                disabled={taskCurrentPage === taskTotalPages}
              >
                &raquo;
              </button>
            </div>

          </>
        )}

      
        {showPopup && (
                <div className={`popup-overlay show`}>
                    <div className="popup">
                        <p>{popupMessage}</p>
                    </div>
                </div>
        )}

        {showDeletePopup && (
          <div className="confirmation-popup-overlay">
              <div className="confirmation-popup">
                  <p>Are you sure you want to delete this request?</p>
                  <div className="yesno-container">
                      <button onClick={() => setShowDeletePopup(false)} className="no-button">No</button>
                      <button onClick={confirmDelete} className="yes-button">Yes</button>
                  </div> 
              </div>
          </div>
          )}
                

      </main>
        
    );
}