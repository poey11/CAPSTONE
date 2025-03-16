"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/OnlineRequests.css";
import { useEffect, useState } from "react";


const metadata: Metadata = {
    title: "Online Request",
    description: "Online Request in Services Module",
  };


  export default function OnlineRequests() {
    const requestData = [
        {
            documentType: "Barangay Clearance",
            purpose: "Loan",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pick Up",
        },
        {
            documentType: "Barangay Indigency",
            purpose: "No Income",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pick Up",
        },
        {
            documentType: "Barangay ID",
            purpose: "N/A",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Completed",
        },
        {
            documentType: "Barangay Permit",
            purpose: "Business Permit",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pending",
        },
        {
            documentType: "Barangay Permit",
            purpose: "Temporary Business Permit",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pending",
        },
        {
            documentType: "Barangay Permit",
            purpose: "Construction Permit",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pending",
        },
        {
            documentType: "Barangay Permit",
            purpose: "Liquor Permit",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pending",
        },
        {
            documentType: "Barangay Permit",
            purpose: "COOP",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pending",
        },
        {
          documentType: "Barangay Certificate",
          purpose: "Certificate of Residency",
          name: "Rose Yap Fernandez",
          contact: "09171218101",
          date: "2024-01-17",
          status: "Pending",
      },
        {
            documentType: "First Time Jobseeker",
            purpose: "N/A",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            status: "Pick Up",
        },
        
      
    ];

    const router = useRouter();

    const handleView = (documentType: string, purpose: string) => {
        const documentRoutes: { [key: string]: string } = {
            "Barangay Clearance": "/dashboard/ServicesModule/OnlineRequests/View/BarangayClearance",
            "Barangay Indigency": "/dashboard/ServicesModule/OnlineRequests/View/BarangayIndigency",
            "Barangay ID": "/dashboard/ServicesModule/OnlineRequests/View/BarangayID",
            "Barangay Certificate": "/dashboard/ServicesModule/OnlineRequests/View/BarangayCertificate",
            "First Time Jobseeker": "/dashboard/ServicesModule/OnlineRequests/View/FirstTimeJobseeker",
        };

        if (documentType === "Barangay Permit" && purpose) {
            const formattedPurpose = purpose.replace(/\s+/g, ""); // Remove spaces for URL consistency
            router.push(`/dashboard/ServicesModule/OnlineRequests/View/BarangayPermit/${formattedPurpose}`);
        } else {
            const route = documentRoutes[documentType] || "/dashboard/ServicesModule/OnlineRequests/View";
            router.push(route);
        }
    };

    const handleEdit = (documentType: string, purpose: string) => {
      const documentRoutes: { [key: string]: string } = {
          "Barangay Clearance": "/dashboard/ServicesModule/OnlineRequests/Edit/BarangayClearance",
          "Barangay Indigency": "/dashboard/ServicesModule/OnlineRequests/Edit/BarangayIndigency",
          "Barangay ID": "/dashboard/ServicesModule/OnlineRequests/Edit/BarangayID",
          "Barangay Certificate": "/dashboard/ServicesModule/OnlineRequests/Edit/BarangayCertificate",
          "First Time Jobseeker": "/dashboard/ServicesModule/OnlineRequests/Edit/FirstTimeJobseeker",
      };

      if (documentType === "Barangay Permit" && purpose) {
          const formattedPurpose = purpose.replace(/\s+/g, ""); // Remove spaces for URL consistency
          router.push(`/dashboard/ServicesModule/OnlineRequests/Edit/BarangayPermit/${formattedPurpose}`);
      } else {
          const route = documentRoutes[documentType] || "/dashboard/ServicesModule/OnlineRequests/View";
          router.push(route);
      }
  };

  const handleSMS = () => {
    window.location.href = "/dashboard/ServicesModule/OnlineRequests/SMS";
};

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
                <th>Purpose</th>
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
                <td>{request.documentType}</td>
                <td>{request.purpose}</td>
                <td>{request.name}</td>
                <td>{request.contact}</td>
                <td>{request.date}</td>
                <td>
                    <span className={`status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
                        {request.status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                        className="action-view"
                        onClick={() => handleView(request.documentType, request.purpose)}
                    >
                        View
                    </button>
                    <button
                        className="action-edit"
                        onClick={() => handleEdit(request.documentType, request.purpose)}
                    >
                        Edit
                    </button>
                    <button className="action-delete">Delete</button>


                    <button type="button" className="action-view" onClick={handleSMS}>SMS</button>
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