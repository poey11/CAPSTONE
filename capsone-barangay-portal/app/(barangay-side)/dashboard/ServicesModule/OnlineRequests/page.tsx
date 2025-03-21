"use client"

import { useRouter } from "next/navigation";
import "@/CSS/barangaySide/ServicesModule/OnlineRequests.css";
import { useEffect, useState } from "react";
import { getAllDocument, getAllSpecificDocument } from "@/app/helpers/firestorehelper";




  export default function OnlineRequests() {
    const [requestData, setRequestData] = useState<any[]>([]);
    const router = useRouter();

    const handleView = (id:string) => {
      router.push("/dashboard/ServicesModule/OnlineRequests/View?id=" + id);  
        
    };


  const handleSMS = () => {
    window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
};
  useEffect(() => {
    getAllDocument("ServiceRequests", setRequestData);

  },[])

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
                <th>Name</th>
                <th>Contact</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {requestData.map((request, index) => (
              <tr key={index}>
                <td>{request.docType}</td>
                <td>{request.firstName} {request.middleName} {request.lastName}</td>
                <td>{request.contact}</td>
                <td>{request.requestDate}</td>
                <td>
                    <span className={`status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
                        {request.status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                        className="action-view"
                        onClick={() => router.push(`/dashboard/ServicesModule/OnlineRequests/View?id=${request.id}`)}
                    >
                        View
                    </button>
                


{/*
                    <button type="button" className="action-view" onClick={handleSMS}>SMS</button>
*/}
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