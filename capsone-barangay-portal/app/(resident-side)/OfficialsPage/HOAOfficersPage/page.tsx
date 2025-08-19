"use client";

import "@/CSS/OfficialsPage/HOA.css";


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
        <p>HOA OFFICERS</p>
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
