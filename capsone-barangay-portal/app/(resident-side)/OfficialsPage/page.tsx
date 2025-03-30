

import "@/CSS/OfficialsPage/OfficialsPage.css";


import type { Metadata } from "next";

export const metadata: Metadata = {
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

    
    <main className="main-container-officials">

      <div className="headerpic-officials">
        <p>MEET OUR BARANGAY OFFICIALS</p>
      </div>

      {/* Captain Section */}
      <section className="Captain-section-officials">
        <div className="captain-card-officials">
          <img src={captain.image} className="Captain-image-officials" alt="Captain" />
          <div className="Captain-content-officials">
            <h2 className="official-name-officials">{captain.Name}</h2>
            <p className="official-role-officials">{captain.Role}</p>
            <p className="official-term-officials">{captain.Term}</p>
            <p className="official-phonenumber-officials">{captain.Phonenumber}</p>
          </div>
        </div>
      </section>

      {/* Officials Section */}
      <section className="Officials-section-officials">
        {officials.map((official, index) => (
          <div key={index} className="official-card-officials">
            <img src={official.image} className="official-image-officials" alt={official.Name} />
            <div className="official-content-officials">
              <h2 className="official-name-officials">{official.Name}</h2>
              <p className="official-role-officials">{official.Role}</p>
              <p className="official-term-officials">{official.Term}</p>
              <p className="official-phonenumber-officials">{official.Phonenumber}</p>
            </div>
          </div>
        ))}
      </section>

    </main>
  );
}
