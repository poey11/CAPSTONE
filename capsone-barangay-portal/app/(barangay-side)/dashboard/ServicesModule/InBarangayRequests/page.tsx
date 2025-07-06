"use client"
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import "@/CSS/barangaySide/ServicesModule/InBarangayRequests.css";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";
import { useSession } from "next-auth/react";
import { report } from "process";


  export default function InBarangayRequests() { 
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;
    const [requestData, setRequestData] = useState<any[]>([]);
    const [searchType, setSearchType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [taskAssignedData, setTaskAssignedData] = useState<any[]>([]);
    const [filteredMainRequests, setFilteredMainRequests] = useState<any[]>([]);



    
  
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
              (report) => report.sendTo === position
            );

            if (user?.position === "Admin Staff") {
              filterReports = filterReports.filter((report) => report.status === "Pick-up");
            }

            filterReports.sort((a, b) => {
              if (a.statusPriority !== b.statusPriority) {
                return a.statusPriority - b.statusPriority;
              }
            
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
          
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        
          setAllRequests(reports);
          setLoading(false);
          setError(null);
          console.log(requestData);
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
        }
      }, []);


    /*
      FILTER LOGIC
    */


      useEffect(() => {
        let filtered = allRequests;
      
        if (searchType !== "" && searchType !== "All") {
          filtered = filtered.filter((req) =>
            req.docType.toLowerCase().includes(searchType.toLowerCase())
          );
        }
      
        if (dateFrom && dateTo) {
          filtered = filtered.filter((req) => {
            const requestDate = new Date(req.createdAt);
            return requestDate >= new Date(dateFrom) && requestDate <= new Date(dateTo);
          });
        }
      
        if (statusFilter !== "") {
          filtered = filtered.filter(
            (req) => req.status.toLowerCase() === statusFilter.toLowerCase()
          );
        }
      
        setFilteredMainRequests(filtered);
        setMainCurrentPage(1);            
      }, [searchType, dateFrom, dateTo, statusFilter, allRequests]);




    const handleGenerateDocument = () => {
      router.push("/dashboard/ServicesModule/InBarangayRequests/GenerateDocument");
    };

    const handleView =(id: string,reqType:string) => {
      if(reqType === "Other Documents"){
        router.push(`/dashboard/ServicesModule/InBarangayRequests/GenerateDocument/OtherNewDocument/view?id=${id}`);
      }
      else{
        router.push(`/dashboard/ServicesModule/ViewRequest?id=${id}`);
      }
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
  const currentInBarangayRequests = taskAssignedData.slice(taskIndexOfFirst, taskIndexOfLast);
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

  
  const [activeSection, setActiveSection] = useState("main");

    return (

        <main className="inbarangayreq-main-container">
         <div className="inbarangayreq-section-1">
          
          <div className="assigned-incident-info-toggle-wrapper">
            {["main", "tasks"].map((section) => (
            <button
            key={section}
            type="button"
            className={`info-toggle-btn-assigned ${activeSection === section ? "active" : ""}`}
            onClick={() => setActiveSection(section)}
            style={{ position: "relative" }}
            >
            {section === "main" && "All Requests"}
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
         </div>
         <div className="section-generate-doc">
          {(user?.position === "Admin Staff") && (
                <button
                  className="add-announcement-btn"
                  onClick={handleGenerateDocument}
                >
                  New Document Request
                </button>
            )}
         </div>


        {activeSection === "main" && (
          <>
              <div className="inbarangayreq-section-2">
                <div className="inbarangayreq-section-2-left">
                  <div className="date-input-group">
                    <label htmlFor="dateFrom">From Date :</label>
                    <input
                      id="dateFrom"
                      type="date"
                     className={`inbarangay-services-module-filter ${dateFrom ? 'has-value' : ''}`}
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="date-input-group">
                    <label htmlFor="dateTo">To Date :</label>
                    <input
                      id="dateTo"
                      type="date"
                     className={`inbarangay-services-module-filter ${dateFrom ? 'has-value' : ''}`}
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="inbarangayreq-section-2-right">

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
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="inProgress">In Progress</option>
                      </select>

                    </div>


                </div>



              </div>


            <div className="inbarangayreq-main-section">
              {loading ? (
                  <p>Loading Online Requests...</p>
                ) : error ? (
                  <p className="error">{error}</p>
                    ) : filteredMainRequests.length === 0 ? (
                  <div className="no-result-card-inbarangay">
                    <img src="/images/no-results.png" alt="No results icon" className="no-result-icon-inbarangay" />
                    <p className="no-results-inbarangay">No Results Found</p>
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
                      <tr key={index}>
                        <td>{request.docType}</td>
                        <td>{request.requestId}</td>
                        <td>{request.createdAt}</td>
                        <td>{request.requestor}</td>
                        <td>{request.purpose}</td>
                        <td>
                        <span className={`status-badge ${request.status.toLowerCase().replace(/\s*-\s*/g, "-")}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <div className="actions-inbarangay">
                            <button className="action-inbarangay-view" onClick={() => handleView(request.id, request.reqType)}>
                                <img src="/Images/view.png" alt="View" />
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

        {activeSection === "tasks" && (
          <>
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
                          <span className={`status-badge ${request.status.toLowerCase().replace(/\s*-\s*/g, "-")}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>
                          <div className="actions-inbarangay">
                            <button className="action-inbarangay-view" onClick={() => handleView(request.id, request.reqType)}>
                                <img src="/Images/view.png" alt="View" />
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