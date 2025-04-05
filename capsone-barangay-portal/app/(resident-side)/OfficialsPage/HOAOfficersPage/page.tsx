
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

    
    <main className="main-container-hoa">

      <div className="headerpic-hoa">
        <p>MEET OUR HOA OFFICERS</p>
      </div>

     
      {/* Officials Section */}
      <section className="Officials-section-hoa">
        {officials.map((official, index) => (
          <div key={index} className="official-card-hoa">
            <img src={official.image} className="official-image-hoa" alt={official.Name} />
            <div className="official-content-hoa">
              <h2 className="official-name-hoa">{official.Name}</h2>
              <p className="official-role-hoa">{official.Role}</p>
              <p className="official-location-hoa">{official.Location}</p>
              <p className="official-phonenumber-hoa">{official.Phonenumber}</p>
            </div>
          </div>
        ))}
      </section>

   
    </main>
  );
}
