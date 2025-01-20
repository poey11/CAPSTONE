"use client";

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

     

      <style jsx>{`


           
       .Page {
          background-image: url('/Images/Background.jpeg');
          background-size: cover; 
          background-position: 50% 50%;
          background-repeat: no-repeat; 
          height: 200px; 
          display: flex;
          align-items: center;
          justify-content: center; 
          color: white; 
          font-size: 40px; 
          font-weight: bold; 
          position: relative;
          margin-bottom: 50px;
        }

        .Page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1); /* White overlay with 30% opacity */
          z-index: 1; /* Ensure the overlay appears above the background image */
        }

        .Page > * {
          position: relative;
          z-index: 2; /* Ensure text is above the overlay */
        }

        .main-container {
          background-color: #f7e5d5;
          flex-direction: column; /* Stack children vertically */
          justify-content: center; /* Center horizontally */
          align-items: center; /* Center vertically */
          min-height: 100vh; /* Ensure it takes the full viewport height */
        }

        .TitlePage {
          background-color: rgba(255, 255, 255, 0.4);
          width: 700px;
          height: 100px;
          border-radius: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 auto;
          margin-bottom: 2rem;
          word-wrap: break-word; 
          overflow: hidden; 
        }

        .TitlePage p {
          color: grey;
          font-size: 2rem;
          font-weight: bold;
          text-overflow: ellipsis; 
          text-align: center;
          overflow: hidden;
          width: 100%; 
        }

 .programs-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #ffe9d6;
        border-radius: 10px;
        padding: 2rem;
        margin-left: 8rem;
        margin-right: 8rem;
        width: 80%;
  }

  .description-card {
    background-color: #fff7f0;
    border: 1px solid #ccc;
    border-radius: 10px;
    padding: 1rem 2rem;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .description-card h1 {
    color: #f49028;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .description-card p {
    color: #555;
    font-size: 1rem;
    line-height: 1.5;
  }

  .info-cards {
    display: flex;
    justify-content: space-between;
    gap: 4rem;
    width: 100%;
  }

  .info-card {
    background-color: #fff7f0;
    border: 1px solid #ccc;
    border-radius: 10px;
    flex: 1;
    padding: 1rem;
    text-align: center;
    margin-bottom: 2rem;
  }

  .info-card h2 {
    color: #f49028;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .info-card p {
    color: #555;
    font-size: 1rem;
  }

  .register-section {
  display: flex;
  flex-direction: column;
  background-color: #ffe9d6;
  border-radius: 10px;
  padding: 2rem;
  margin-left: 8rem;
  margin-right: 8rem;
  width: 80%;
  margin-top: 2rem;
}

.register-section h1 {
  color: #f49028;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 16px;
  font-weight: bold;
  color: gray;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  color: #555;
}

.form-input:focus {
  border-color: #f49028;
  outline: none;
  box-shadow: 0 0 5px rgba(244, 144, 40, 0.5);
}

.register-button {
  background-color: #f49028;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s ease;
  align-self: center; /* Centers the button */
  width: 350px;
}

  
.register-button:hover {
  background-color: #d87d20;
}

.register-button:active {
  background-color: #bf6a18;
}

.programs-image {
  display: flex; 
  justify-content: center; 
  align-items: center; 
}


.image {
width: 450px;
height: 400px;
object-fit: cover; /* Maintain aspect ratio and cover the area */
border-radius: 15px;
}

 .slideshow-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2rem;
        }

        .slideshow-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2rem;
        }

        .slideshow {
          position: relative;
          width: 450px;
          height: 400px;
          overflow: hidden;
        }

        .slideshow-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 15px;
        }

        .slideshow-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
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
            margin-right: 700px;
          }
  
          .slideshow-button.right {
            margin-left: 700px; /* Move button closer to the image */
          }

        .slideshow-button:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }

      `}</style>
    </main>
  );
}
