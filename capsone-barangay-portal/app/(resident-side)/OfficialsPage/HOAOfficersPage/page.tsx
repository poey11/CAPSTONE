"use client";

import type { Metadata } from "next";

const metadata: Metadata = {
  title: "HOA Officers Page for Residents",
  description: "Stay updated with the latest lists of Sitio Officers",
};

export default function HOAOfficersPage() {
  
  const officials = [
    {
      Name: "Jane Doe",
      Role: "HOA Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/HOA.jpg",
      Phonenumber: "09176219124",
    },
    {
      Name: "John Smith",
      Role: "HOA Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/HOA.jpg",
      Phonenumber: "09176219125",
    },
    {
      Name: "Alice Brown",
      Role: "HOA Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/HOA.jpg",
      Phonenumber: "09176219126",
    },
    {
      Name: "Robert Black",
      Role: "HOA Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/HOA.jpg",
      Phonenumber: "09176219127",
    },

    {
        Name: "Robert Black",
        Role: "HOA Oficer",
        Location: "Rabosna Hoa, Ruby Street",
        image: "/Images/HOA.jpg",
        Phonenumber: "09176219127",
      },

      {
        Name: "Robert Black",
        Role: "HOA Oficer",
        Location: "Rabosna Hoa, Ruby Street",
        image: "/Images/HOA.jpg",
        Phonenumber: "09176219127",
      }, 

  ];

  return (

    
    <main className="main-container">

      <div className="Page">
        <p>MEET OUR HOA OFFICERS</p>
      </div>

     
      {/* Officials Section */}
      <section className="Officials-section">
        {officials.map((official, index) => (
          <div key={index} className="official-card">
            <img src={official.image} className="official-image" alt={official.Name} />
            <div className="official-content">
              <h2 className="official-name">{official.Name}</h2>
              <p className="official-role">{official.Role}</p>
              <p className="official-location">{official.Location}</p>
              <p className="official-phonenumber">{official.Phonenumber}</p>
            </div>
          </div>
        ))}
      </section>

      <style jsx>{`
        .Page {
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
          background-image: url('/Images/Background.jpeg');
          background-size: cover; 
          background-position: 50% 50%;
          background-repeat: no-repeat; 
          z-index: 1; /* Ensure the overlay appears above the background image */
          filter: blur(2px); /* Adjust the blur intensity */
        }

        .Page > * {
          position: relative;
          z-index: 2; /* Ensure text is above the overlay */
        }

        .main-container {
          background-color: #f7e5d5;
        }

        /* Officials Section */
        .Officials-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4rem;
          padding: 3rem;
        }
          
        .official-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .official-image {
          width: 300px; 
          height: 300px;
          border-radius: 10px;
          margin-bottom: 1rem;
          object-fit: cover;
        }

        .official-content .official-name {
          font-size: 1.5rem; /* Smaller font size than captain */
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: orange;
        }

        .official-content .official-role {
           font-weight: bold;
           color: grey;
        }

        @media (max-width: 768px) {
          .Officials-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .Officials-section {
            grid-template-columns: 1fr;
          }
        }

      `}</style>
    </main>
  );
}
