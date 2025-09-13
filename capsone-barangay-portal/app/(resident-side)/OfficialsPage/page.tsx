"use client";


import "@/CSS/OfficialsPage/OfficialsPage.css";


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
        <p>BARANGAY OFFICIALS</p>
      </div>

      <div className="officials-header-main">
        <h1 className="officials-title">Elected Officials</h1>
        <div className="officials-underline"></div>
      </div>

      <div className="officials-content">
        <div className="officials-punong-brgy-section">
          <div className="officials-punong-brgy-card">
            <div className="officials-punong-brgy-image">
              <img src={captain.image} className="Captain-image-officials" alt="Captain" />
            </div>
            <div className="officials-punong-brgy-details">
              <p className="official-role-punong-brgy">{captain.Role}</p>
              <h2 className="official-name-punong-brgy">{captain.Name}</h2>
              <p className="official-phonenumber-punong-brgy">Contact Information: {captain.Phonenumber}</p>
            </div>
          </div>
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
      </div>
    </main>
  );
}
