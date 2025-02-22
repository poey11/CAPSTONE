"use client"
import "@/CSS/IncidentModule/Letters.css";
import type { Metadata } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";



const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function GenerateSummonLetter() {

   

    const router = useRouter();

    const handleAddLupon = () => {
      router.push("/dashboard/IncidentModule/Lupon/EditIncident");
    };



  return (
    <main className="main-container">


        
        <div className="main-content">
            
         
            <div className="section-1">
                    <button type="submit" className="back-button" onClick={handleAddLupon}></button>
                <p className="NewOfficial"> Summon Letter</p>
            </div>


             <div className="section-2">

                <div className="section-2-left-side">

                    <p >Complainant's Information</p>
                    <p>Name</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Official Name" 
                    />

                    <p>Address</p>

                    <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="Enter Address" 
                    />

                    

                </div>

                <div className="section-2-right-side">

                <p>Respondent's Information</p>
                  
                <p>Name</p>

                <input 
                type="text" 
                className="search-bar" 
                placeholder="Enter Official Name" 
                />

                <p>Address</p>

                <input 
                type="text" 
                className="search-bar" 
                placeholder="Enter Address" 
                />
                </div>

             </div>


              <div className="section-3">
                <p className="title">Other Information</p>
                
                <div className="bars">

                    <div className="input-group">
                        <p>Date of Delivery</p>
                        <input type="date" className="search-bar" placeholder="Enter Date of Delivery" />
                    </div>
                    
                    <div className="input-group">
                        <p>Date of Meeting</p>
                        <input type="date" className="search-bar" placeholder="Enter Date of Meeting" />
                    </div>

                </div>

                <div className="bars">
                    <div className="input-group">
                        <p>Lupon Staff</p>
                        <input type="text" className="search-bar" placeholder="Enter Name of Lupon Staff" />
                    </div>

                    <div className="input-group">
                        <p>Date Filed</p>
                        <input type="number" className="search-bar" placeholder="Choose hearing number" />
                    </div>
                </div>
            </div>


            <div className="section-4">

                <button className="letter-announcement-btn" >Print</button>
                <button className="letter-announcement-btn" >Send SMS</button>
                
            </div>



           

        </div> 

    

    
    </main>
  );
}
