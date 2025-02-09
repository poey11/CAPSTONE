
import "@/CSS/OfficialsPage/HOA.css";

import type { Metadata } from "next";


export const metadata: Metadata = {
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

   
    </main>
  );
}
