"use client";

import { useSearchParams } from "next/navigation";

export default function AnnouncementDetails() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const date = searchParams.get("date");
  const image = searchParams.get("image");

  return (
    <main className="main-container">



    <div className="Page">
        <p>ANNOUNCEMENTS</p>
      </div>


      <div className="TitlePage">
        <p>"Strengthening our community through information"</p>
        <img 
          src="/images/QCLogo.png" 
          alt="Barangay Captain" 
          className="aboutus-image" 
        />
      </div>

      {title && description && date && image ? (
        <div className="announcement-details">

          <div className="announcement-image-container">
            <img
              src={image}
              alt={title}
              className="announcement-image"
            />
          </div>

          <div className="announcement-content">
            <h1 className="announcement-title">{title}</h1>
            <p className="announcement-date">{date}</p>
            <p className="announcement-description">{description}</p>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}

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
          width: 800px;
          height: 100px;
          border-radius: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 auto;
          margin-bottom: 2rem;
          padding-left: 1rem;
          padding-right: 1rem;
          word-wrap: break-word; 
          overflow: hidden; 
        }

        .TitlePage p {
          color: black;
          font-size: 24px;
          font-weight: bold;
          text-overflow: ellipsis; 
          white-space: normal; 
          overflow: hidden;
          width: 100%; 
        }

        .aboutus-image {
          width: 160px;
          height: 80px;
        }

        .announcement-details {
          display: flex;
          flex-direction: column;
          align-items: center; /* Center image and content horizontally */
          text-align: center;
          padding: 1rem;
           background-color: rgba(255, 255, 255, 0.4);
          border-radius: 20px;
          margin-left: 150px;
          margin-right: 150px;
         
        }

        .announcement-image-container {
          display: flex;
          justify-content: center; /* Center image horizontally */
          align-items: center; /* Center image vertically if needed */
          width: 100%;
          margin-bottom: 1rem;
        }

        .announcement-image {
          width: 450px;
          height: 400px;
          object-fit: cover; /* Maintain aspect ratio and cover the area */
          border-radius: 15px;
          margin-top: 30px;
        }

        .announcement-content {
          padding: 50px;
          background-color: #FFE0CA;
          justify-content: center;
          align-items: center; 
          border-radius: 20px;
          border-color: grey;
          margin-top: 50px;
          width: 1000px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .announcement-content .announcement-title {
          color: #e56723;
          font-weight: bold;
          font-size: 30px;
          white-space: normal; 
          margin-bottom: 5px;
        }

        .announcement-content .announcement-date {
          color: grey;
          margin-bottom: 30px;
        }

        .announcement-content .announcement-description {
        text-align: justify;
        }
        
       

      `}</style>
    </main>
  );
}
