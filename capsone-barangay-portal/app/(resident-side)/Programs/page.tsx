
import "@/CSS/Programs/Programs.css";

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
        <p>Discover Programs Offered by the Barangay</p>
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

    </main>
  );
}
