"use client"
import "@/CSS/Announcements/SpecificAnnouncement.css";
import type { Metadata } from "next";
import { useSearchParams } from "next/navigation";

export default function AnnouncementDetails() {
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const date = searchParams.get("date");
  const image = searchParams.get("image");

  return (
    <main className="main-container">



    <div className="Page">
        <p>ANNOUNCEMENTS</p>
    </div>


      <div className="TitlePage">
        <p>Strengthening our community through information</p>
        <img 
          src="/images/QCLogo.png" 
          alt="Barangay Captain" 
          className="aboutus-image" 
        />
      </div>

      {title && description && date && image ? (
        <div className="announcement-details">

          <div className="announcement-image-container">
            <img
              src={image}
              alt={title}
              className="announcement-image"
            />
          </div>

          <div className="announcement-content">
            <h1 className="announcement-title">{title}</h1>
            <p className="announcement-date">{date}</p>
            <p className="announcement-description">{description}</p>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}

     
    </main>
  );
}
