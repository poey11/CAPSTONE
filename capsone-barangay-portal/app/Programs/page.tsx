"use client";

import type { Metadata } from "next";
import Link from 'next/link';

const metadata: Metadata = {
  title: "Programs Page for Residents",
  description: "Stay updated with the latest Programs",
};

export default function Programs() {
  const programs = [
    {
      title: "Feeding Program 2025",
      description: `
    The Feeding Program 2025 aims to provide nutritious meals to children and families in need, fostering health and community well-being. Held at the Multi-Purpose Hall, this initiative underscores our commitment to addressing malnutrition and hunger within the community. Volunteers and participants will work together to ensure the program's success, creating a safe and supportive environment for all attendees. This event will also include educational activities about healthy eating and its importance, encouraging participants to adopt sustainable dietary practices. By participating, you contribute to a meaningful cause that impacts lives and strengthens our community bonds.
  `,
      date: "January 15, 2024",
      images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
      Location: "Multi-Purpose Hall",
      ProgressStatus: "Pending",
      Participants: "8/20",
    },
    {
      title: "Feeding Program 2025",
      description: `
    The Feeding Program 2025 aims to provide nutritious meals to children and families in need, fostering health and community well-being. Held at the Multi-Purpose Hall, this initiative underscores our commitment to addressing malnutrition and hunger within the community. Volunteers and participants will work together to ensure the program's success, creating a safe and supportive environment for all attendees. This event will also include educational activities about healthy eating and its importance, encouraging participants to adopt sustainable dietary practices. By participating, you contribute to a meaningful cause that impacts lives and strengthens our community bonds.
  `,
      date: "January 15, 2024",
      images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
      Location: "Multi-Purpose Hall",
      ProgressStatus: "Pending",
      Participants: "8/20",
    },

    {
      title: "Feeding Program 2025",
      description: `
    The Feeding Program 2025 aims to provide nutritious meals to children and families in need, fostering health and community well-being. Held at the Multi-Purpose Hall, this initiative underscores our commitment to addressing malnutrition and hunger within the community. Volunteers and participants will work together to ensure the program's success, creating a safe and supportive environment for all attendees. This event will also include educational activities about healthy eating and its importance, encouraging participants to adopt sustainable dietary practices. By participating, you contribute to a meaningful cause that impacts lives and strengthens our community bonds.
  `,
      date: "January 15, 2024",
      images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
      Location: "Multi-Purpose Hall",
      ProgressStatus: "Pending",
      Participants: "8/20",
    },
    {
      title: "Feeding Program 2025",
      description: `
    The Feeding Program 2025 aims to provide nutritious meals to children and families in need, fostering health and community well-being. Held at the Multi-Purpose Hall, this initiative underscores our commitment to addressing malnutrition and hunger within the community. Volunteers and participants will work together to ensure the program's success, creating a safe and supportive environment for all attendees. This event will also include educational activities about healthy eating and its importance, encouraging participants to adopt sustainable dietary practices. By participating, you contribute to a meaningful cause that impacts lives and strengthens our community bonds.
  `,
      date: "January 15, 2024",
      images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
      Location: "Multi-Purpose Hall",
      ProgressStatus: "Pending",
      Participants: "8/20",
    },
   
  ];



  return (
    <main className="main-container">
      <div className="Page">
        <p>PROGRAMS</p>
      </div>

      <div className="TitlePage">
        <p>"Discover Programs Offered by the Barangay"</p>
        <img 
          src="/images/QCLogo.png" 
          alt="Barangay Captain" 
          className="aboutus-image" 
        />
      </div>

      <section className="programs-section">
        {programs.map((program, index) => (
          <Link
            key={index}
            href={{
              pathname: `/Programs/${index}`,
              query: {
                title: program.title,
                description: program.description,
                date: program.date,
                image: program.images,
                Location: program.Location,
                ProgressStatus: program.ProgressStatus,
                Participants: program.Participants,
              },
            }}
          >
            <div className="programs-card">
            <img
                src={program.images[0]}
                alt={`${program.title} first image`}
                className="programs-image"
              />
              <div className="programs-content">
                
                <p className="programs-date">{program.date}</p>
                <h2 className="programs-title">{program.title}</h2>
                
             
              </div>
            </div>
          </Link>
        ))}
      </section>

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

        .TitlePage {
          background-color: #FFE0CA;
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
          
        .main-container {
          background-color: #f7e5d5;
        }

        .programs-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 3.5rem;
          padding-top: 3rem;
          padding-left: 10rem;
          padding-right: 10rem; 
          padding-bottom: 3rem;
        }

        @media (min-width: 640px) {
          .programs-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .programs-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .programs-card {
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          width: 100%;
          height: 350px; /* Fixed height for consistency */
          display: flex;
          flex-direction: column;
          border: 3px solid #ddd;
          transition: transform 0.3s ease, box-shadow 0.3s ease; /* Smooth transition for hover effects */
        }

        .programs-card:hover {
            transform: translateY(-10px); /* Slight lift effect */
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2); /* Enhanced shadow for hover */
            border-color: #aaa; /* Optional: Change border color on hover */
          }

        .programs-image {
          width: 100%;
          height: 12rem;
          object-fit: cover;
        }

        .programs-content {
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }

        .programs-title {
          font-size: 1.70rem;
          font-weight: bold;
          margin-top: 20px;
          color: #e56723;
          text-align: center;

        }
        .programs-date {
          font-size: 0.75rem;
          color: #9e9e9e;
          text-align: left;
        }

      
      `}</style>
    </main>
  );
}
