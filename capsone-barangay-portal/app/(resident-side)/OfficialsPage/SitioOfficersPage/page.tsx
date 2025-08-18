"use client";

import "@/CSS/OfficialsPage/Sitio.css";


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

      <div className="officials-header">
        <h1 className="officials-title">Meet the HOA Officers</h1>
        <div className="officials-underline"></div>
      </div>

     
      <div className="other-officials-section">
          {officials.map((official, index) => (
            <div key={index} className="official-card-officials">
              <img
                src={official.image}
                alt={official.Name}
                className="official-image-officials"
              />
              <div className="official-content-officials">
                <p className="official-role-officials">{official.Role}</p>
                <h2 className="official-name-officials">{official.Name}</h2>
                <p className="official-phonenumber-officials">
                  Contact Information: {official.Phonenumber}
                </p>
              </div>
            </div>
          ))}
        </div>

    </main>
  );
}
