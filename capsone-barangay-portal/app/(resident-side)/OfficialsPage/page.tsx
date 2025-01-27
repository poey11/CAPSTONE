

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

    </main>
  );
}
