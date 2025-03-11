"use client";
import "@/CSS/HomePage/HomePage.css";
import { useState } from "react";
import Link from 'next/link';

const homePage:React.FC = () => {    
    const facilities = [
        {
        image: "/Images/feeding2.jpg",
        facility: "Barangay Hall",
        location: "Dahlia Avenue",
        },
        {
        image: "/Images/feeding2.jpg",
        facility: "Senior Citizen Building",
        location: "Complex, Dahlia Avenue",
        },
        {
        image: "/Images/feeding2.jpg",
        facility: "Multi-purpose Center",
        location: "Sitio Ruby",
        },
        {
        image: "/Images/feeding2.jpg",
        facility: "Sapamanai Covered Court",
        location: "Rose Street",
        },
        {
        image: "/Images/feeding2.jpg",
        facility: "Fairview Elementary School",
        location: "Tulip Lane",
        },
        {
        image: "/Images/feeding2.jpg",
        facility: " Sitio Kislap Covered Court",
        location: "Pearl Street",
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
                        <p className="quantity"> 22k</p>
                        <p className="name">Households </p>
                  </div>

                  <div className="card">
                        <p className="quantity"> 312</p>
                        <p className="name">Hectares</p>
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


      </main>
	);
}

export default homePage;