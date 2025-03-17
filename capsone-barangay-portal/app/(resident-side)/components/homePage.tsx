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
        image: "/Images/Sapamanai Covered Court.jpg",
        facility: "Sapamanai Covered Court",
        location: "Rose Street",
        },
        {
        image: "/Images/Fairview Elementary School.jpeg",
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
		
      
        <main className="main-container-home">
     
        <div className="homepage-container-home">

      

         <div className="first-container-home">


        
            <div className="first-section-home">
                  <p className="first-paragraph-home"> Discover Our Community</p>
                  <p className="second-paragraph-home"> Barangay Fairview</p>
                  <p className="third-paragraph-home"> The thriving heart of Barangay Fairview—where opportunities and progress come together. 
                    Let’s move forward as one community!</p>
                  
                    <Link href="/aboutus"> 
                        <button type="button" className="learn-more-button-home">
                          Learn More
                        </button>
                    </Link> 
                 
            </div>

            <div className="second-section-home">

            <img 
              src="/Images/CaptainImage.jpg" 
              alt="Barangay Captain" 
              className="captain-image-home" 
            />

            </div>
        
            

           </div>


              <div className="second-container-home">

                  <div className="card-home">
                        <p className="quantity-home"> 81k</p>
                        <p className="name-home">Population </p>
                  </div>

                  <div className="card-home">
                        <p className="quantity-home"> 22k</p>
                        <p className="name-home">Households </p>
                  </div>

                  <div className="card-home">
                        <p className="quantity-home"> 312</p>
                        <p className="name-home">Hectares</p>
                  </div>

                  <div className="card-home">
                        <p className="quantity-home"> 81k</p>
                        <p className="name-home">Population </p>
                  </div>


                  

                </div>


          <hr/>


          <div className="third-container-home">

              <div className="third-container-column1-home">
                 
                    <p className="barangaycaptain-home"> Barangay Captain </p>
              </div>
              
              <div className="third-container-column2-home">

                  <div className="column2-section1-home">
                       
                    <img 
                      src="/Images/CaptainImage.jpg" 
                      alt="Barangay Captain" 
                      className="captain-image2-home" 
                    />

                  </div>

                  <div className="column2-section2-home">

                        <p className="section2-title-home"> JONEL L. QUEBAL</p>

                        <p className="section2-quote-home">

                        “Great leaders inspire unity, progress, and hope within their community” 
                        </p>

                        <p className="section2-description-home">
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

          <div className="fourth-container-home">
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