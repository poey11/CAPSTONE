"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/Appointments.css";
import { useEffect, useState } from "react";


const metadata: Metadata = {
    title: "Appointments",
    description: "Appointments in Services Module",
  };


  export default function Appointments() {
    const requestData = [
        {
            appointmentType: "Barangay Indigency",
            purpose: "No Income",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            time: "09:00 AM - 09:30 AM",
            status: "Completed",
        },
        {
            appointmentType: "Barangay Certificate",
            purpose: "Certificate of Residency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            time: "10:00 AM - 10:30 AM",
            status: "Pending",
        },
        {
            appointmentType: "Barangay Certificate",
            purpose: "Certificate of Residency",
            name: "Jonnell Quebal",
            contact: "09171218101",
            date: "2024-01-17",
            time: "11:00 AM - 11:30 AM",
            status: "Pending",
        },
    ];

    const router = useRouter();

    const handleCalendarView = () => {
      router.push("/dashboard/ServicesModule/Appointments/CalendarView");
    };

    const handleView = () => {
      router.push("/dashboard/ServicesModule/Appointments/View");
    };

    const handleEdit = () => {
      router.push("/dashboard/ServicesModule/Appointments/Edit");
  };

  const handleSMS = () => {
    window.location.href = "/dashboard/ServicesModule/Appointments/SMS";
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

        <main className="appointments-main-container">
         <div className="appointments-section-1">
          <h1>Scheduled Appointments</h1>
          <button
            className="add-announcement-btn"
            onClick={handleCalendarView}
          >
            View Calendar
          </button>
          
         </div>
         <div className="appointments-section-2">
          <input 
              type="text" 
              className="search-bar" 
              placeholder="Enter Appointment Type" 
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

         <div className="appointments-main-section">
          <table>
            <thead>
              <tr>
                <th>Appointment Type</th>
                <th>Purpose</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
            {requestData.map((request, index) => (
              <tr key={index}>
                <td>{request.appointmentType}</td>
                <td>{request.purpose}</td>
                <td>{request.name}</td>
                <td>{request.contact}</td>
                <td>{request.date}</td>
                <td>{request.time}</td>
                <td>
                    <span className={`status-badge ${request.status.toLowerCase().replace(" ", "-")}`}>
                        {request.status}
                    </span>
                </td>
                <td>
                  <div className="actions">
                    <button
                        className="action-view"
                        onClick={handleView}
                    >
                        View
                    </button>
                    <button
                        className="action-edit"
                        onClick={handleEdit}
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