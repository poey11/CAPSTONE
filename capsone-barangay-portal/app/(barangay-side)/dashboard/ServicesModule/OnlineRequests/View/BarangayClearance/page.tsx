"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/ViewOnlineRequest.css";


const metadata: Metadata = {
    title: "In Barangay Request",
    description: "In Barangay Request in Services Module",
  };


  export default function ViewOnlineRequest() {
    const requestData = [
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "In Progress",
        },
    ];

    const router = useRouter();

    const handleAddAnnouncement = () => {
      router.push("/dashboard/ServicesModule/GenerateDocument");
    };

    return (

        <main className="main-container">
         <div className="section-1">
          <h1>In Barangay Document Requests</h1>
          <button
            className="add-announcement-btn"
            onClick={handleAddAnnouncement}
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
                <td>
                 {request.documentType}
                </td>
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
                    <button className="action-view">View</button>
                    <button className="action-edit">Edit</button>
                    <button className="action-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

      </main>
        
    );
}