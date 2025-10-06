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


      <div className="announcement-header">
        <h1 className="announcement-title">Latest News and Announcements</h1>
        <div className="announcement-underline"></div>
      </div>


      <div className="layout-specificannouncement">
        <div className="left-section-specificannouncement">
          {title && description && date && image && (
            <div className="announcement-card-specificannouncement">
              
              <div className="announcement-header-specificannouncement">
                <h2 className="announcement-title-specificannouncement">
                  {title}
                </h2>
                  <span className="announcement-date-specificannouncement">
                    <img
                      src="/Images/calendar.png"
                      alt="Calendar"
                      className="calendar-icon"
                    />
                    {date}
                  </span>
              </div>

              <div className="announcement-image-container">
                <img
                  src={image}
                  alt={title}
                  className="announcement-image-announcement"
                />
              </div>

              <div className="announcement-content-specificannouncement">
                <p className="announcement-description-specificannouncement">
                  {description}
                </p>
                
              </div>
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
