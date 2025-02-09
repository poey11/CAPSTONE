"use client"

import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/OnlineRequests.css";


const metadata: Metadata = {
    title: "Online Request",
    description: "Online Request in Services Module",
  };


  export default function OnlineRequests() {
    const requestData = [
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "Pick Up",
        },
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "Pick Up",
        },
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "Completed",
        },
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "Completed",
        },
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "Completed",
        },
        {
            documentType: "Indigency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "january 17, 2024",
            status: "Pick Up",
        },
        
      
    ];

    return (

        <main className="main-container">
         <div className="section-1">
          <h1>Online Document Requests</h1>
          
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