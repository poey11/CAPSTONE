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
    <main className="main-container-specific-announcement">



    <div className="headerpic-specific-announcement">
        <p>ANNOUNCEMENTS</p>
    </div>


      <div className="TitlePage-specific-announcement">
        <p>Strengthening our community through information</p>
        <img 
          src="/images/QCLogo.png" 
          alt="Barangay Captain" 
          className="aboutus-image-specific-announcement" 
        />
      </div>

      {title && description && date && image ? (
        <div className="announcement-details-specific-announcement">

          <div className="announcement-image-container-specific-announcement">
            <img
              src={image}
              alt={title}
              className="announcement-image-specific-announcement"
            />
          </div>

          <div className="announcement-content-specific-announcement">
            <h1 className="announcement-title-specific-announcement">{title}</h1>
            <p className="announcement-date-specific-announcement">{date}</p>
            <p className="announcement-description-specific-announcement">{description}</p>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}

     
    </main>
  );
}
