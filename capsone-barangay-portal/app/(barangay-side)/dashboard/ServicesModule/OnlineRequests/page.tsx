"use client"
import "@/CSS/barangaySide/ServicesModule/OnlineRequests.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllDocument } from "@/app/helpers/firestorehelper";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";





  export default function OnlineRequests() {
    const [requestData, setRequestData] = useState<any[]>([]);
    const router = useRouter();
    const [searchType, setSearchType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineRequests, setOnlineRequests] = useState([]);

    

  // Helpers to manage viewed requests
const getViewedRequests = (): string[] => {
  const data = localStorage.getItem("viewedRequests");
  return data ? JSON.parse(data) : [];
};

const markAsViewed = (id: string) => {
  const viewed = getViewedRequests();
  if (!viewed.includes(id)) {
    viewed.push(id);
    localStorage.setItem("viewedRequests", JSON.stringify(viewed));
  }
};

    
    useEffect(() => {
      try {
        const Collection = query(
          collection(db, "ServiceRequests"),
          orderBy("createdAt", "desc") // First, sort by latest
        );

          const viewed = getViewedRequests();
      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          let reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
             isNew: !viewed.includes(doc.id)  // Tag new ones
          }));
        
          // Now sort client-side: Pending (1) first, then Pickup (2), etc.
          reports.sort((a, b) => {
            if (a.statusPriority !== b.statusPriority) {
              return a.statusPriority - b.statusPriority; // status priority asc
            }
          
            // Convert string dates to timestamps
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        
          setRequestData(reports);
           setFilteredOnlineRequests(reports); 

        setLoading(false);
        setError(null);
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
      }
    }, []);


    useEffect(() => {
      let filtered = requestData;

      // Filter by Document Type
      if (searchType.trim() !== "") {
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
          (req) => req.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      setFilteredOnlineRequests(filtered);
      setCurrentPage(1); // reset to first page when filters change
    }, [searchType, dateFrom, dateTo, statusFilter, requestData]);



    console.log(requestData);
  const [currentPage, setCurrentPage] = useState(1);
  const residentsPerPage = 10; //pwede paltan 

  const [filteredOnlineRequests, setFilteredOnlineRequests] = useState<any[]>([]);

  const indexOfLastRequest = currentPage * residentsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - residentsPerPage;
  const currentOnlineRequests = filteredOnlineRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  const totalPages = Math.ceil(filteredOnlineRequests.length / residentsPerPage);


  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  const getPageNumbers = () => {
    const totalPagesArray = [];
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

  const handleView = (id: string) => {
  markAsViewed(id); // mark before navigating
  router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest?id=${id}`);
};






  const handleSMS = () => {
    //window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
  };

    return (

        <main className="onlinereq-main-container">


              {/*}
      <div className="path-section">
          <h1 className="breadcrumb">Serivices Managemnt<span className="chevron">/</span></h1>
          <h2 className="breadcrumb">Online Requests<span className="chevron"></span></h2>
      </div>*/}




         <div className="onlinereq-section-2">
              <input
              type="text"
              className="online-services-module-filter"
              placeholder="Enter Document Type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            />

            <input
              type="date"
              className="online-services-module-filter"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <input
              type="date"
              className="online-services-module-filter"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <select
              className="online-services-module-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="forpickup">For Pick Up</option>
            </select>

         </div>

         <div className="onlinereq-main-section">
          
              {loading ? (
            <p>Loading Online Requests...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : currentOnlineRequests.length === 0 ? (
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
          {currentOnlineRequests.map((request, index) => (
            <tr key={index} className={request.isNew ? "highlight-new-request" : ""}>

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
                  <div className="-services-actions">
                    <button
                        className="action-view-services"
                        onClick={() => handleView(request.id)}
                    >
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

        <div className="redirection-section-services">
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