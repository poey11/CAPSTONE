"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from 'next/link';



const metadata:Metadata = { 
  title: "Barangay Fairview Portal",
  description: "Welcome to the Home Page",
};

export default function Home() {


  const facilities = [
    {
      image: "/Images/feeding2.jpg",
      facility: "Barangay Hall",
      location: "Dahlia Avenue",
    },
    {
      image: "/Images/feeding2.jpg",
      facility: "Health Center",
      location: "Dahlia Avenue",
    },
    {
      image: "/Images/feeding2.jpg",
      facility: "Multi-purpose Hall",
      location: "Dahlia Avenue",
    },
    {
      image: "/Images/feeding2.jpg",
      facility: "Community Center",
      location: "Rose Street",
    },
    {
      image: "/Images/feeding2.jpg",
      facility: "Public Library",
      location: "Tulip Lane",
    },
    {
      image: "/Images/feeding2.jpg",
      facility: "Sports Complex",
      location: "Lily Road",
    },
  ];


  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      (prev + 1) % (facilities.length - 2) 
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      (prev - 1 + facilities.length - 2) % (facilities.length - 2) 
    );
  };



  return (
      
      
      
      <main className="main-container">
     
        <div className="hompage-container">

      

         <div className="first-container">


        
            <div className="first-section">
                  <p className="first-paragraph"> Discover Our Community</p>
                  <p className="second-paragraph"> Barangay Fairview</p>
                  <p className="third-paragraph"> The thriving heart of Barangay Fairview—where opportunities and progress come together. 
                    Let’s move forward as one community!</p>
                  
                    <Link href="/aboutus"> 
                        <button type="button" className="learn-more-button">
                          Learn More
                        </button>
                    </Link> 
                 
            </div>

            <div className="second-section">

            <img 
              src="/Images/CaptainImage.jpg" 
              alt="Barangay Captain" 
              className="captain-image" 
            />

            </div>
        
            

           </div>


              <div className="second-container">

                  <div className="card">
                        <p className="quantity"> 81k</p>
                        <p className="name">Population </p>
                  </div>

                  <div className="card">
                        <p className="quantity"> 81k</p>
                        <p className="name">Population </p>
                  </div>

                  <div className="card">
                        <p className="quantity"> 81k</p>
                        <p className="name">Population </p>
                  </div>

                  <div className="card">
                        <p className="quantity"> 81k</p>
                        <p className="name">Population </p>
                  </div>


                  

                </div>


          <hr/>


          <div className="third-container">

              <div className="third-container-column1">
                 
                    <p className="barangaycaptain"> Barangay Captain </p>
              </div>
              
              <div className="third-container-column2">

                  <div className="column2-section1">
                       
                    <img 
                      src="/Images/CaptainImage.jpg" 
                      alt="Barangay Captain" 
                      className="captain-image2" 
                    />

                  </div>

                  <div className="column2-section2">

                        <p className="section2-title"> JONEL L. QUEBAL</p>

                        <p className="section2-quote">

                        “Great leaders inspire unity, progress, and hope within their community” 
                        </p>

                        <p className="section2-description">
                         Barangay Captain Jonel Quebal, a dedicated public servant and a true 
                         advocate for the well-being of Barangay Fairview.
                         A proud product of our barangay, Captain Jonel Quebal has been serving 
                         the community with passion and commitment since 2013. Learn more about Barangay 
                         Captain Jonel Quebal and his vision for Barangay Fairview. Read his blog to stay
                        connected and inspired!
                        </p>

                  </div>



              </div>

          </div>
  

          <hr/>

          <div className="fourth-container">
          <div className="fourth-container-column1">
            <p className="BarangayFacilities">Barangay Facilities</p>
          </div>

          <div className="slideshow-container">
            <button onClick={prevSlide} className="slideshow-button left">
              &#8249;
            </button>

            <div className="facilities-cards">
              {facilities
                .slice(currentSlide, currentSlide + 3)
                .map((facility, index) => (
                  <div key={index} className="facilities-card">
                    <img
                      src={facility.image}
                      alt={facility.facility}
                      className="facility-image"
                    />
                    <div className="facility-content">
                      <p className="facility">{facility.facility}</p>
                      <p className="location">{facility.location}</p>
                    </div>
                  </div>
                ))}
            </div>

            <button onClick={nextSlide} className="slideshow-button right">
              &#8250;
            </button>
          </div>
        </div>
  

      </div>


     
     <style jsx>{` 
   

        .main-container {
          background-color: #f7e5d5;
          height: 100%;
          width: 100%;
        }
        
        .hompage-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .first-container{
          display: flex;
          background-color: rgba(255, 255, 255, 0.7);
          width: 75%;
          border-radius: 2rem;
          margin-top: 5rem;
          border: 1px solid #ddd;
        }

        .first-section {
           display: flex;
           flex-direction: column;
           padding: 5rem;
           margin-left: 5rem;
           width: 50%;
           
        }
        
        .first-paragraph {
          font-weight: light;
          font-size: 1.25rem;
          color: grey;
        }

        .second-paragraph {
          font-weight: bold;
          font-size: 2.5rem;
          color: grey;
        }

        .third-paragraph {
         font-weight: light;
          font-size: 1rem;
          color: grey;
        }


        .learn-more-button {
        background-color: #f49028;
        color: white;
        font-size: 16px;
        font-weight: bold;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 2rem;
        transition: background-color 0.3s ease;
        width: 250px;
      }

        
      .learn-more-button {
        background-color: #d87d20;
      }

      .learn-more-button {
        background-color: #bf6a18;
      }

      .second-section {
        align-self: center;
        padding: 3rem;
      }
        
      .captain-image {
      width:  300px;
      height: 300px
      border-radius: 2rem;
      object-fit: cover; 
      }

      .second-container{
          display: flex;
          width: 100%;
          border-radius: 2rem;
          padding: 5rem;
        
      }

      .card {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
       background-color: rgba(255, 255, 255, 0.7);
       padding: 1rem;
       border-radius: 2rem;
       width: 20%;
       margin: auto;
       border: 2px solid #ddd;
      }

      .quantity{
        font-weight: bold;
        font-size: 2rem;
        color: grey;

      }

      .name {
    color: #e56723;
      font-weight: bold;
      font-size: 2rem;
      }

       .hompage-container hr {
         border: none; 
         border-top: 2px solid rgba(0, 0, 0, 0.20);
         margin: 50px 0; 
         width: 75%; 
         margin: 0 auto 50px; 
        }

      .third-container {
       width: 75%;
       display: flex;
       flex-direction: column;
       background: white;
       padding: 3rem;
       border-radius: 2rem;
       background-color: rgba(255, 255, 255, 0.7);
       margin-bottom: 3rem;
        border: 2px solid #ddd;
      }

      .third-container-column1 {
        
        margin-left: 2rem;
      }

      .barangaycaptain {
        font-weight: Bold;
        font-size: 1.75em;
        color: grey;
        margin-left: 1rem;
      }

      .third-container-column2{
        display: flex;
        justify-content: space-between;
      }

      .column2-section1 {
       width: 50%;
       padding: 2rem;
      }

      .column2-section2 {
       width: 50%;
       display: flex;
       flex-direction: column;
       padding: 3rem;
       
      }

      .section2-title {
       color: #e56723;
        font-weight: bold;
        font-size: 2rem;
      }

      .section2-quote {
       color: grey;
       font-size: 1rem;
       margin-top: 1rem;
       font-weight: bold;
      }
      
       .section2-description {
       color: grey;
       font-size: 1rem;
       font-weight: light;
       margin-top: 1rem;
      }

      .captain-image2{
        width:  350px;
        height: 350px
        object-fit: cover; 
        border-radius: 2rem;
      }

      .fourth-container {
       width: 75%;
       display: flex;
       flex-direction: column;
       margin-bottom: 2rem;
     
      }

      .fourth-container-column1 {
      display: flex; 
      justify-content: center;
      padding: 2rem;
      }

      .BarangayFacilities {
       font-weight: Bold;
       color: grey;
       font-size: 2.5rem;
      }

      .fourth-container-column2 {
       display: flex;
       padding: 1rem;
      }

      .facilities-card {
       display: flex;
       flex-direction: column;
       width: 50%;
       background: white;
       border-radius: 10px;
       margin: 20px;
      border: 2px solid #ddd;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
      transition: transform 0.3s ease, box-shadow 0.3s ease; 
      }

      
        .facilities-card:hover {
        transform: translateY(-10px); 
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }

      .facility-image {
       width: 100%;
       height: 12rem;
       object-fit: cover;
      }

      .facility-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 1rem;
      }
      
      .facility {
      font-size: 1.5rem;
       color: #e56723;
       font-weight: bold;
      }

      .location {
        font-size: 1.25rem;
        color: grey;
        font-weight: light;
      }

        .slideshow-container {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-top: 2rem;
         
        }

        .slideshow-button {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          z-index: 10;
        }

        .slideshow-button.left {
          left: -50px;
        }

        .slideshow-button.right {
          right: -50px;
        }

        .facilities-cards {
         display: flex;
         
        }




     


      `}</style>


      </main>
    );
  }
