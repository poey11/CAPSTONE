"use client"

import type { Metadata } from "next";
import "@/CSS/barangaySide/announcements.css";




const metadata:Metadata = { 
  title: "Announcements Barangay Side",
  description: "Announcements for Barangay Side",
};

export default function Announcements() {
    return (
      
      <main className="main-container">
         <div className="section-1">
          <h1>Announcements</h1>
          <button className="add-announcement-btn">Add Announcement</button>
         </div>
         <div className="section-2">
          <input 
              type="text" 
              className="search-bar" 
              placeholder="Search Announcements..." 
          />
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Featured Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                <th>Announcement Headline</th>
                <th>Featured in Announcements</th>
                <th>Published Date</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array(7)
                .fill(null)
                .map((_, index) => (
                  <tr key={index}>
                    <td>
                      <div className="announcement-info">
                        <img
                          src="/Images/anak.jpg"
                          alt="Announcement Image"
                          className="announcement-image"
                        />
                        <span>2024 Bar Passer</span>
                      </div>
                    </td>
                    <td>Active</td>
                    <td>January 15, 2024</td>
                    <td>Super Tester</td>
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
