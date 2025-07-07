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
    const [filteredInBarangayRequests, setFilteredInBarangayRequests] = useState<any[]>([]);
    const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
  
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
            const filterReports = reports.filter(
              (report) => report.sendTo === position
            );

            filterReports.sort((a, b) => {
              if (a.statusPriority !== b.statusPriority) {
                return a.statusPriority - b.statusPriority;
              }
            
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
          
            setRequestData(filterReports);
            setFilteredInBarangayRequests(filterReports); // add

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
    let filtered = requestData;

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

    setFilteredInBarangayRequests(filtered);
    setCurrentPage(1);
  }, [searchType, dateFrom, dateTo, statusFilter, requestData]);




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


 const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentInBarangayRequests = filteredInBarangayRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  const totalPages = Math.ceil(filteredInBarangayRequests.length / requestsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
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



    return (

        <main className="inbarangayreq-main-container">
         <div className="inbarangayreq-section-1">
          {(user?.position === "Admin Staff") && (
              <button
                className="add-announcement-btn"
                onClick={handleGenerateDocument}
              >
                Generate Document
              </button>
          )}
         </div>

         <div className="inbarangayreq-section-2">
           
           <select
            className="inbarangay-services-module-filter"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="All">All Document Types</option>
            <option value="Barangay Certificate">Barangay Certificate</option>
            <option value="Barangay Indigency">Barangay Indigency</option>
            <option value="Barangay ID">Barangay ID</option>
            <option value="Barangay Permits">Barangay Permits</option>
            <option value="Barangay Clearance">Barangay Clearance</option>
            <option value="First Time Jobseeker">First Time Jobseeker</option>
            <option value="Other">Other Documents</option>
          </select>

            <input
              type="date"
              className="inbarangay-services-module-filter"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="inbarangay-services-module-filter"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <select
              className="inbarangay-services-module-filter"
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
        Assigned Requests: {requestData.length}
       <div className="inbarangayreq-main-section">
        {loading ? (
            <p>Loading Online Requests...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : currentInBarangayRequests.length === 0 ? (
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
              {currentInBarangayRequests.map((request, index) => (
                <tr key={index}>
                  <td>{request.docType}</td>
                  <td>{request.requestId}</td>
                  <td>{request.createdAt}</td>
                  <td>{request.requestor}</td>
                  <td>{request.purpose}</td>
                  <td>
                    <span className={`status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
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
            <button onClick={prevPage} disabled={currentPage === 1}>
              &laquo;
            </button>
            {getPageNumbers().map((number, index) => (
              <button
                key={index}
                onClick={() => typeof number === "number" && paginate(number)}
                className={currentPage === number ? "active" : ""}
              >
                {number}
              </button>
            ))}
            <button onClick={nextPage} disabled={currentPage === totalPages}>
              &raquo;
            </button>
        </div>

        All Requests: {allRequests.length}     
       <div className="inbarangayreq-main-section">
        {loading ? (
            <p>Loading Online Requests...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : allRequests.length === 0 ? (
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
              {allRequests.map((request, index) => (
                <tr key={index}>
                  <td>{request.docType}</td>
                  <td>{request.requestId}</td>
                  <td>{request.createdAt}</td>
                  <td>{request.requestor}</td>
                  <td>{request.purpose}</td>
                  <td>
                    <span className={`status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
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