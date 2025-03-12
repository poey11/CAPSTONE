"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import { useState } from "react";
import "@/CSS/barangaySide/ServicesModule/InBarangayRequests.css";
import { useEffect, useState } from "react";



const metadata: Metadata = {
    title: "In Barangay Request",
    description: "In Barangay Request in Services Module",
  };


  export default function InBarangayRequests() {
    const requestData = [
      {
        documentType: "Barangay Clearance",
        purpose: "Loan",
        name: "Jonnell Quebal",
        contact: "09171218101",
        date: "2024-01-17",
        status: "New",
      },
      {
          documentType: "Barangay Indigency",
          purpose: "No Income",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "In Progress",
      },
      {
          documentType: "Barangay ID",
          purpose: "N/A",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "In Progress",
      },
      {
          documentType: "Barangay Permit",
          purpose: "Business Permit",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "Completed",
      },
      {
          documentType: "Barangay Permit",
          purpose: "Temporary Business Permit",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "Completed",
      },
      {
          documentType: "Barangay Permit",
          purpose: "Construction Permit",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "Completed",
      },
      {
          documentType: "Barangay Permit",
          purpose: "Liquor Permit",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "Completed",
      },
      {
          documentType: "Barangay Permit",
          purpose: "COOP",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "In Progress",
      },
      {
          documentType: "Barangay Certificate",
          purpose: "Death Residency",
          name: "Rose Yap Fernandez",
          contact: "09171218101",
          date: "2024-01-17",
          status: "In Progress",
      },
      {
          documentType: "First Time Jobseeker",
          purpose: "N/A",
          name: "Jonnell Quebal",
          contact: "09171218101",
          date: "2024-01-17",
          status: "New",
      },
        
      
    ];

   

    const router = useRouter();

    const handleGenerateDocument = () => {
      router.push("/dashboard/ServicesModule/GenerateDocument");
    };

    const handleView = (documentType: string, purpose: string) => {
      const documentRoutes: { [key: string]: string } = {
          "Barangay Clearance": "/dashboard/ServicesModule/InBarangayRequests/View/BarangayClearance",
          "Barangay Indigency": "/dashboard/ServicesModule/InBarangayRequests/View/BarangayIndigency",
          "Barangay ID": "/dashboard/ServicesModule/InBarangayRequests/View/BarangayID",
          "Barangay Certificate": "/dashboard/ServicesModule/InBarangayRequests/View/BarangayCertificate",
          "First Time Jobseeker": "/dashboard/ServicesModule/InBarangayRequests/View/FirstTimeJobseeker",
      };

      if (documentType === "Barangay Permit" && purpose) {
          const formattedPurpose = purpose.replace(/\s+/g, ""); // Remove spaces for URL consistency
          router.push(`/dashboard/ServicesModule/InBarangayRequests/View/BarangayPermit/${formattedPurpose}`);
      } else {
          const route = documentRoutes[documentType] || "/dashboard/ServicesModule/InBarangayRequests/View";
          router.push(route);
      }
  };

  const handleEdit = (documentType: string, purpose: string) => {
    const documentRoutes: { [key: string]: string } = {
        "Barangay Clearance": "/dashboard/ServicesModule/InBarangayRequests/Edit/BarangayClearance",
        "Barangay Indigency": "/dashboard/ServicesModule/InBarangayRequests/Edit/BarangayIndigency",
        "Barangay ID": "/dashboard/ServicesModule/InBarangayRequests/Edit/BarangayID",
        "Barangay Certificate": "/dashboard/ServicesModule/InBarangayRequests/Edit/BarangayCertificate",
        "First Time Jobseeker": "/dashboard/ServicesModule/InBarangayRequests/Edit/FirstTimeJobseeker",
    };

    if (documentType === "Barangay Permit" && purpose) {
        const formattedPurpose = purpose.replace(/\s+/g, ""); // Remove spaces for URL consistency
        router.push(`/dashboard/ServicesModule/InBarangayRequests/Edit/BarangayPermit/${formattedPurpose}`);
    } else {
        const route = documentRoutes[documentType] || "/dashboard/ServicesModule/OnlineRequests/View";
        router.push(route);
    }
};

  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

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

        <main className="main-container">
         <div className="section-1">
          <h1>In Barangay Document Requests</h1>
          <button
            className="add-announcement-btn"
            onClick={handleGenerateDocument}
          >
            Generate Document
          </button>
         </div>
         <div className="section-2">
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
            <option value="active">New</option>
            <option value="inactive">Completed</option>
            <option value="inactive">In Progress</option>
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

         <div className="main-section">
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
                    <button className="action-delete" onClick={() => handleDeleteClick(request.documentType)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
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