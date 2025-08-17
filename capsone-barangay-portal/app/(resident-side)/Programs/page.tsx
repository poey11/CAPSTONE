"use client";
import "@/CSS/Programs/Programs.css";

import Link from 'next/link';


export default function Programs() {
  const programs = [
    {
    title: "Feeding Program 2025",
    summary: "A community effort to fight malnutrition by providing nutritious meals to children and families. A community effort to fight malnutrition by providing nutritious meals to children and families.",
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
    title: "Clean-Up Drive 2025",
    summary: "Join the barangay’s environmental campaign to restore cleanliness and promote sustainability. ",
    description: `
      The Clean-Up Drive 2025 encourages community members to come together and take responsibility for the cleanliness of public spaces. Volunteers will help clear litter, segregate waste, and raise awareness on proper waste management practices. This initiative aims to promote environmental sustainability and instill a sense of community pride and shared responsibility. Educational booths and activities will also be available to teach children and adults alike about the importance of recycling and reducing plastic use.
    `,
    date: "February 10, 2025",
    images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
    Location: "Barangay Park and nearby streets",
    ProgressStatus: "Ongoing",
    Participants: "25/50",
  },
  {
    title: "Health Fair 2025",
    summary: "Free medical checkups, wellness talks, and health education for residents of all ages.",
    description: `
      The Health Fair 2025 provides free consultations, medical check-ups, and educational sessions for residents. Doctors and health professionals will be present to offer advice on nutrition, physical activity, and preventive care. This initiative highlights the importance of accessible healthcare for everyone, regardless of background. In addition, health screenings for common conditions like hypertension and diabetes will be conducted, helping residents take proactive steps toward better health.
    `,
    date: "March 8, 2025",
    images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
    Location: "Barangay Covered Court",
    ProgressStatus: "Upcoming",
    Participants: "12/30",
  },
  {
    title: "Youth Sports Festival 2025",
    summary: "Empowering the youth through sports competitions, teamwork, and camaraderie.",
    description: `
      The Youth Sports Festival 2025 is designed to engage young people in friendly competitions across different sports such as basketball, volleyball, and badminton. The program promotes not just physical health, but also teamwork, discipline, and camaraderie. It provides an opportunity for young athletes to showcase their talents and encourages residents to adopt an active lifestyle. Parents and guardians are also welcome to attend and support the participants, fostering unity within the community.
    `,
    date: "April 20, 2025",
    images: ["/Images/feeding1.jpg", "/Images/feeding2.jpg", "/Images/feeding3.jpg"],
    Location: "Barangay Sports Complex",
    ProgressStatus: "Planned",
    Participants: "40/100",
  },
   
  ];



  return (
    <main className="main-container-programs">
      <div className="headerpic-programs">
        <p>PROGRAMS</p>
      </div>

      <div className="TitlePage-programs">
        <p>Discover Programs Offered by the Barangay</p>
        
      </div>

      <section className="programs-section-programs">
        {programs.map((program, index) => (
          <Link
            key={index}
            href={{
              pathname: `/Programs/${index}`,
              query: {
                title: program.title,
                summary: program.summary,
                description: program.description,
                date: program.date,
                image: program.images,
                Location: program.Location,
                ProgressStatus: program.ProgressStatus,
                Participants: program.Participants,
              },
            }}
            className="programs-card-link" // optional for styling
          >
            <div className="programs-card-programs">
              <h2 className="programs-title-programs">{program.title}</h2>

              <img
                src={program.images[0]}
                alt={`${program.title} first image`}
                className="programs-image-programs"
              />

              <p className="programs-date-programs">{program.date}</p>

              <p className="programs-desc-programs">{program.summary}</p>

              <div className="programs-card-footer">
                <span className="read-more-link">Click to Read More</span>
              </div>
            </div>
          </Link>
        ))}
      </section>


    </main>
  );
}
