"use client"
import "@/CSS/barangaySide/ServicesModule/OnlineRequests.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/app/db/firebase";




  export default function OnlineRequests() {
    const [requestData, setRequestData] = useState<any[]>([]);
    const router = useRouter();
    
    useEffect(() => {
      try {
        const Collection = query(
          collection(db, "ServiceRequests"),
          orderBy("createdAt", "desc") // First, sort by latest
        );
      
        const unsubscribe = onSnapshot(Collection, (snapshot) => {
          let reports: any[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
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
        });
      
        return unsubscribe;
      } catch (error: any) {
        console.log(error.message);
      }
    }, []);


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
  const handleView = (id:string) => {
    router.push(`/dashboard/ServicesModule/OnlineRequests/ViewRequest?id=${id}`);
 

  };


  const handleSMS = () => {
    //window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
  };

    return (

        <main className="onlinereq-main-container">
         <div className="onlinereq-section-1">
          <h1>Online Document Requests</h1>
          
         </div>
         <div className="onlinereq-section-2">
          <input 
              type="text" 
              className="search-bar" 
              placeholder="Enter Document Type" 
          />
          <input 
                type="date" 
                className="search-bar" 
                placeholder="Select Date From" 
            />
            <input 
                type="date" 
                className="search-bar" 
                placeholder="Select Date To" 
            />
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Select Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="forpickup">For Pick Up</option>
          </select>
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Show...</option>
            <option value="active">Show 5</option>
            <option value="inactive">Show 10</option>
          </select>
         </div>

         <div className="onlinereq-main-section">
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
            {requestData.map((request, index) => (
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
                  <div className="actions">
                    <button
                        className="action-view"
                        onClick={() => handleView(request.id)}
                    >
                        View
                    </button>

                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        <div className="redirection-section">
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