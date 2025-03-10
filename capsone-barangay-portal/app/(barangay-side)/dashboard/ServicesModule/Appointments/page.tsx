"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/Appointments.css";


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

    const handleView = (appointmentType: string, purpose: string) => {
        const appointmentRoutes: { [key: string]: string } = {
            "Barangay Indigency": "/dashboard/ServicesModule/Appointments/View/BarangayIndigency",
            "Barangay Certificate": "/dashboard/ServicesModule/Appointments/View/BarangayCertificate",
        };

        const route = appointmentRoutes[appointmentType] || "/dashboard/ServicesModule/OnlineRequests/View";
        router.push(route);
    };

    const handleEdit = (appointmentType: string, purpose: string) => {
      const appointmentRoutes: { [key: string]: string } = {
        "Barangay Indigency": "/dashboard/ServicesModule/Appointments/Edit/BarangayIndigency",
        "Barangay Certificate": "/dashboard/ServicesModule/Appointments/Edit/BarangayCertificate",
      };

      const route = appointmentRoutes[appointmentType] || "/dashboard/ServicesModule/OnlineRequests/Edit";
        router.push(route);
  };

  const handleSMS = () => {
    window.location.href = "/dashboard/ServicesModule/Appointments/SMS";
};

  

    return (

        <main className="main-container">
         <div className="section-1">
          <h1>Scheduled Appointments</h1>
          <button
            className="add-announcement-btn"
            onClick={handleCalendarView}
          >
            View Calendar
          </button>
          
         </div>
         <div className="section-2">
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

         <div className="main-section">
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
                        onClick={() => handleView(request.appointmentType, request.purpose)}
                    >
                        View
                    </button>
                    <button
                        className="action-edit"
                        onClick={() => handleEdit(request.appointmentType, request.purpose)}
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

      </main>
        
    );
}