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


    const recentPosts = [
    {
      title: "CITY OF ISABELA, BASILAN LGU BENCHMARKING ACTIVITY",
      date: "Jul 29, 2025",
      image: "/Images/anak.jpg",
    },
    {
      title: "ALA-ALA NG IKA-80 TAONG KABAYANIHAN",
      date: "Feb 12, 2025",
      image: "/Images/anak.jpg",
    },
    {
      title: "PASSPORT ON WHEELS, MATAGUMPAY NA ISINAGAWA",
      date: "Feb 05, 2025",
      image: "/Images/anak.jpg",
    },
    {
      title: "ALA-ALA NG IKA-80 TAONG KABAYANIHAN",
      date: "Feb 12, 2025",
      image: "/Images/anak.jpg",
    },
    {
      title: "PASSPORT ON WHEELS, MATAGUMPAY NA ISINAGAWA",
      date: "Feb 05, 2025",
      image: "/Images/anak.jpg",
    },
  ];

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

              <img
                src={image}
                alt={title}
                className="announcement-image-specificannouncement"
              />

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
