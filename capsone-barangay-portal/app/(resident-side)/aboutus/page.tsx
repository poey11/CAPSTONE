"use client"
import type { Metadata } from "next";
import "@/CSS/AboutUsPage/aboutus.css";

const metadata:Metadata = { 
  title: "About Us",
  description: "About Us page for the barangay website",
};
export default function AboutUs() {
  return (

    <main className="aboutus-main-container">
      <div className="headerpic">
        <p>ABOUT US</p>
      </div>

      <div className="aboutus-inner-container">
        <div className="kap-info-container">
          <div className="kap-info-container-sec1">
            <img src="/images/kap.jpg" alt="Barangay Captain" className="kapImage" />
          </div>
          <div className="kap-info-container-sec2">
            <h1 className="aboutus-kapinfo-name">Jonel L. Quebal</h1>
            <p className="aboutus-kapinfo-position">
              Barangay Captain
            </p>
          </div>

        </div>


        <div className="history-container">
          <>HISTORY</>

        </div>

      </div>
      
      

    </main>



    

  );
}