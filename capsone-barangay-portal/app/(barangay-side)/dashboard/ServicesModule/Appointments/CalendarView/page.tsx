"use client"

import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import "@/CSS/barangaySide/ServicesModule/CalendarView.css";


const metadata: Metadata = {
    title: "Appointments Calendar View",
    description: "Appointments Calendar View in Services Module",
  };


  export default function Appointments() {


    return (

        <main className="main-container">
         <div className="section-1">
          <h1>Appointments Calendar</h1> 
         </div>
         <div className="section-2">
          <select 
            id="appointmentType" 
            name="appointmentType" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>All</option>
            <option value="Barangay Certificate">Barangay Certificate</option>
            <option value="Barangay Indigency">Barangay Indigency</option>
          </select>
          
         </div>

         <div className="main-section">
          
        </div>

      </main>
        
    );
}