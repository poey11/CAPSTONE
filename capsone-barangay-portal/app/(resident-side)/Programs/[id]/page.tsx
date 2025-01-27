
"use client"
import "@/CSS/Programs/SpecificProgram.css";


import { useSearchParams } from "next/navigation";
import { scheduler } from "timers/promises";
import { useState } from "react"; // Importing useState from React

export default function AnnouncementDetails() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const date = searchParams.get("date");
  const images = searchParams.getAll("image"); // Retrieve an array of images
  const Location = searchParams.get("Location");
  const ProgresStatus = searchParams.get("ProgressStatus");
  const Participants = searchParams.get("Participants");

  
  
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  
  

  return (
    <main className="main-container">



     <div className="Page">
        <p>ANNOUNCEMENTS</p>
      </div>


      <div className="TitlePage">
        <p>{title}</p>
        
      </div>
      
      <div className="slideshow-container">
        {images.length > 0 && (
          <div className="slideshow">
            <img
              src={images[currentSlide]}
              alt={`Slide ${currentSlide + 1}`}
              className="slideshow-image"
            />
          </div>
        )}
        <button onClick={prevSlide} className="slideshow-button left">
          &#8249;
        </button>
        <button onClick={nextSlide} className="slideshow-button right">
          &#8250;
        </button>
      </div>
                
    <div className="programs-section">

        <div className="description-card">
            <h1>Description:</h1>
            <p>{description}</p>
        </div>

        <div className="info-cards">
            <div className="info-card">
                <h2>Schedule</h2>
                <p>{date}</p>
            </div>
            <div className="info-card">
                <h2>Location</h2>
                <p>{Location}</p>
            </div>
        </div>

            <div className="info-cards">
            <div className="info-card">
                <h2>Progress Status</h2>
                <p>{ProgresStatus}</p>
            </div>
            <div className="info-card">
                <h2>Participants</h2>
                <p>{Participants}</p>
            </div>
            </div>

        </div>

        <div className="register-section">
        <h1>Register for this Event:</h1>
        <form className="register-form">

            <div className="form-group">
            <label htmlFor="firstname" className="form-label">First Name</label>
            <input
                type="text"
                id="firstname"
                name="firstname"
                className="form-input"
                required
                placeholder="Enter First Name"
            />
            </div>

            <div className="form-group">
            <label htmlFor="lastname" className="form-label">Last Name</label>
            <input
                type="text"
                id="lastname"
                name="lastname"
                className="form-input"
                required
                placeholder="Enter Last Name"
            />
            </div>

            <div className="form-group">
            <label htmlFor="contact" className="form-label">Contact Number</label>
            <input
                type="tel"
                id="contact"
                name="contact"
                className="form-input"
                required
                placeholder="Enter Contact Number"
            />
            </div>

            <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                required
                placeholder="Enter Email Address"
            />
            </div>

            <div className="form-group">
            <label htmlFor="location" className="form-label">Location</label>
            <input
                type="text"
                id="location"
                name="location"
                className="form-input"
                required
                placeholder="Enter Location"
            />
            </div>

            <button type="submit" className="register-button">Register</button>

        </form>
        </div>

     
    </main>
  );
}
