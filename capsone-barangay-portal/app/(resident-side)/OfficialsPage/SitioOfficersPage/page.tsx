import "@/CSS/OfficialsPage/Sitio.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitio Officers Page for Residents",
  description: "Stay updated with the latest lists of Sitio Officers",
};

export default function SitioOfficersPage() {
  
  const officials = [
    {
      Name: "Jane Doe",
      Role: "Sitio Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/Sitio.jpg",
      Phonenumber: "09176219124",
    },
    {
      Name: "John Smith",
      Role: "Sitio Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/Sitio.jpg",
      Phonenumber: "09176219125",
    },
    {
      Name: "Alice Brown",
      Role: "Sitio Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/Sitio.jpg",
      Phonenumber: "09176219126",
    },
    {
      Name: "Robert Black",
      Role: "Sitio Oficer",
      Location: "Rabosna Hoa, Ruby Street",
      image: "/Images/Sitio.jpg",
      Phonenumber: "09176219127",
    },

    {
        Name: "Robert Black",
        Role: "Sitio Oficer",
        Location: "Rabosna Hoa, Ruby Street",
        image: "/Images/Sitio.jpg",
        Phonenumber: "09176219127",
      },

      {
        Name: "Robert Black",
        Role: "Sitio Oficer",
        Location: "Rabosna Hoa, Ruby Street",
        image: "/Images/Sitio.jpg",
        Phonenumber: "09176219127",
      }, 

  ];

  return (

    
    <main className="main-container-sitio">

      <div className="headerpic-sitio">
        <p>MEET OUR SITIO OFFICERS</p>
      </div>

     
      {/* Officials Section */}
      <section className="Officials-section-sitio">
        {officials.map((official, index) => (
          <div key={index} className="official-card-sitio">
            <img src={official.image} className="official-image-sitio" alt={official.Name} />
            <div className="official-content-sitio">
              <h2 className="official-name-sitio">{official.Name}</h2>
              <p className="official-role-sitio">{official.Role}</p>
              <p className="official-location-sitio">{official.Location}</p>
              <p className="official-phonenumber-sitio">{official.Phonenumber}</p>
            </div>
          </div>
        ))}
      </section>

    </main>
  );
}
