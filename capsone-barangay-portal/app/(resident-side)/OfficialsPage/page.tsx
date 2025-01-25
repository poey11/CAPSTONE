"use client";

import type { Metadata } from "next";

const metadata: Metadata = {
  title: "Official Page for Residents",
  description: "Stay updated with the latest lists of officials",
};

export default function Official() {
  const captain = {
    Name: "Jonel Quebal",
    Role: "Barangay Captain",
    Term: "2024-2025",
    image: "/Images/CaptainImage.jpg",
    Phonenumber: "09176219123",
  };

  const officials = [
    {
      Name: "Jane Doe",
      Role: "Barangay Secretary",
      Term: "2024-2025",
      image: "/Images/anak.jpg",
      Phonenumber: "09176219124",
    },
    {
      Name: "John Smith",
      Role: "Barangay Treasurer",
      Term: "2024-2025",
      image: "/Images/anak.jpg",
      Phonenumber: "09176219125",
    },
    {
      Name: "Alice Brown",
      Role: "Barangay Councilor",
      Term: "2024-2025",
      image: "/Images/anak.jpg",
      Phonenumber: "09176219126",
    },
    {
      Name: "Robert Black",
      Role: "Barangay Councilor",
      Term: "2024-2025",
      image: "/Images/anak.jpg",
      Phonenumber: "09176219127",
    },

    {
        Name: "Robert Black",
        Role: "Barangay Councilor",
        Term: "2024-2025",
        image: "/Images/anak.jpg",
        Phonenumber: "09176219127",
      },

      {
        Name: "Robert Black",
        Role: "Barangay Councilor",
        Term: "2024-2025",
        image: "/Images/anak.jpg",
        Phonenumber: "09176219127",
      }, 

  ];

  return (

    
    <main className="main-container">

      <div className="Page">
        <p>MEET OUR BARANGAY OFFICIALS</p>
      </div>

      {/* Captain Section */}
      <section className="Captain-section">
        <div className="captain-card">
          <img src={captain.image} className="Captain-image" alt="Captain" />
          <div className="Captain-content">
            <h2 className="official-name">{captain.Name}</h2>
            <p className="official-role">{captain.Role}</p>
            <p className="official-term">{captain.Term}</p>
            <p className="official-phonenumber">{captain.Phonenumber}</p>
          </div>
        </div>
      </section>

      {/* Officials Section */}
      <section className="Officials-section">
        {officials.map((official, index) => (
          <div key={index} className="official-card">
            <img src={official.image} className="official-image" alt={official.Name} />
            <div className="official-content">
              <h2 className="official-name">{official.Name}</h2>
              <p className="official-role">{official.Role}</p>
              <p className="official-term">{official.Term}</p>
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

        /* Captain Section */
        .Captain-section {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .captain-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 1rem;
          padding: 1rem; /* Increased padding for larger card */
          max-width: 450px; /* Larger width */
        }

        .Captain-image {
          width: 350px; /* Larger image */
          height: 350px; /* Larger image */
          border-radius: 10px;
          margin-bottom: 1rem;
          object-fit: cover;
        }

        .Captain-content {
          padding: 1rem;
        }

        .Captain-content .official-name {
          font-size: 2rem; /* Larger font size for captain name */
          font-weight: bold;
          margin-bottom: 1rem;
          color: orange;
        }

        .Captain-content .official-role {
            font-weight: bold;
            color: grey;
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
          width: 350px; /* Slightly smaller image than captain */
          height: 350px;
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
