
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
    <main className="main-container-specific">



     <div className="headerpic-specific">
        <p>ANNOUNCEMENTS</p>
      </div>


      <div className="TitlePage-specific">
        <p>{title}</p>
        
      </div>
      
      <div className="slideshow-container-specific">
        {images.length > 0 && (
          <div className="slideshow-specific">
            <img
              src={images[currentSlide]}
              alt={`Slide ${currentSlide + 1}`}
              className="slideshow-image-specific"
            />
          </div>
        )}
        <button onClick={prevSlide} className="slideshow-button-specific left">
          &#8249;
        </button>
        <button onClick={nextSlide} className="slideshow-button-specific right">
          &#8250;
        </button>
      </div>
                
    <div className="programs-section-specific">

        <div className="description-card-specific">
            <h1>Description:</h1>
            <p>{description} </p>
        </div>

        <div className="info-cards-specific">
            <div className="info-card-specific">
                <h2>Schedule</h2>
                <p>{date}</p>
            </div>
            <div className="info-card-specific">
                <h2>Location</h2>
                <p>{Location}</p>
            </div>
        </div>

            <div className="info-cards-specific">
            <div className="info-card-specific">
                <h2>Progress Status</h2>
                <p>{ProgresStatus}</p>
            </div>
            <div className="info-card-specific">
                <h2>Participants</h2>
                <p>{Participants}</p>
            </div>
            </div>

        </div>

        <div className="register-section-specific">
        <h1>Register for this Event:</h1>
        <form className="register-form-specific">

            <div className="form-group-specific">
            <label htmlFor="firstname" className="form-label-specific">
              First Name <span className="required">*</span>
              </label>
            <input
                type="text"
                id="firstname"
                name="firstname"
                className="form-input-specific"
                required
                placeholder="Enter First Name"
            />
            </div>

            <div className="form-group-specific">
            <label htmlFor="lastname" className="form-label-specific">
              Last Name<span className="required">*</span>
              </label>
            <input
                type="text"
                id="lastname"
                name="lastname"
                className="form-input-specific"
                required
                placeholder="Enter Last Name"
            />
            </div>

            <div className="form-group-specific">
            <label htmlFor="contact" className="form-label-specific">
              Contact Number<span className="required">*</span>
              </label>
            <input
                type="tel"
                id="contact"
                name="contact"
                className="form-input-specific"
                required
                placeholder="Enter Contact Number"
            />
            </div>

            <div className="form-group-specific">
            <label htmlFor="email" className="form-label-specific">
              Email Address<span className="required">*</span>
              </label>
            <input
                type="email"
                id="email"
                name="email"
                className="form-input-specific"
                required
                placeholder="Enter Email Address"
            />
            </div>

            <div className="form-group-specific">
            <label htmlFor="location" className="form-label-specific">
              Location <span className="required">*</span>
              </label>
            <input
                type="text"
                id="location"
                name="location"
                className="form-input-specific"
                required
                placeholder="Enter Location"
            />
            </div>

            <button type="submit" className="register-button-specific">Register</button>

        </form>
        </div>

     
    </main>
  );
}
