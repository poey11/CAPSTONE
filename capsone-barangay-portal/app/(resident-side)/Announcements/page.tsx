"use client";
import "@/CSS/Announcements/Announcements.css";
import Link from 'next/link';
import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot,query,where} from "firebase/firestore";
import { db } from "@/app/db/firebase";

interface AnnouncementFormProps {
  announcementHeadline?: string;
  featuredInAnnouncements?: string;
  category?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  image?:string;
  content?: string;
  isActive?: boolean;
  isInFeatured?: string;
}


export default function Announcement() {
  

  const [announcements, setAnnouncements] = useState<AnnouncementFormProps[]>([]);
  const [recentPosts, setRecentPosts] = useState<AnnouncementFormProps[]>([]);


  useEffect(() => {
    const docRef = query(collection(db, "announcements"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data: AnnouncementFormProps[] = snapshot.docs.map((doc) => (doc.data() as AnnouncementFormProps));
      data.sort((a, b) => {
        const dateA = new Date(a.createdAt || "").getTime();
        const dateB = new Date(b.createdAt || "").getTime();
        return dateB - dateA; // Descending order
      });
      setAnnouncements(data);
    });
    return () => unsubscribe();
  },[])
  

  useEffect(() => {
    //di ako sure anu ung mechanics ng recent posts
    const sortedByDate = [...announcements].sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime();
      const dateB = new Date(b.createdAt || "").getTime();
      return dateB - dateA; // Descending order
    });
    setRecentPosts(sortedByDate.slice(0, 5));
  }, [announcements]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);


  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAnnouncements = announcements.slice(startIndex, startIndex + itemsPerPage);


  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    if (clamped === currentPage) return; // no-op if same page
    shouldScrollRef.current = true;      // mark that this change came from user action
    setCurrentPage(clamped);
  };

  useEffect(() => {
    if (!shouldScrollRef.current) return; // skip first render & non-user changes
    shouldScrollRef.current = false;      // reset flag
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);


  return (
    <main className="main-container-announcement">
      {/* Header */}
      <div className="headerpic-announcement">
        <p>ANNOUNCEMENTS</p>
      </div>

      <div className="announcements-header">
        <h1 className="announcements-title">News and Announcements</h1>
        <div className="announcements-underline"></div>
      </div>

      
      <div className="layout-announcement">
        
        <div className="left-section-announcement" ref={sectionRef}>
          {currentAnnouncements.map((item, index) => (
            <div key={startIndex + index} className="announcement-card-announcement">
              <div className="announcement-image-container">
                <img
                  src={item.image}
                  alt={item.announcementHeadline}
                  className="announcement-image-announcement"
                />
              </div>
              <div className="announcement-content-announcement">
                <h2 className="announcement-title-announcement">
                  {item.announcementHeadline} ({item.category})
                </h2>
                <p className="announcement-description-announcement">
                  {item.content}
                </p>
                <div className="announcement-footer-announcement">
                  <span className="announcement-date-announcement">
                    <img
                      src="/Images/calendar.png"
                      alt="Calendar"
                      className="calendar-icon"
                    />
                    {item.createdAt}
                  </span>
                  <Link
                    href={{
                      pathname: `/Announcements/${index}`,
                      query: {
                        title: item.announcementHeadline,
                        description: item.content,
                        date: item.createdAt,
                        image: item.image,
                      },
                    }}
                    className="read-more-announcement"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <div className="pagination-announcement">
            <button
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active-page" : ""}
                onClick={() => goToPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
            </button>
          </div>

        </div>

        

        
        <div className="right-section-announcement">
          <div className="recent-posts-announcement">
            <h3>Recent Posts</h3>
            {recentPosts.map((post, idx) => (
              <div key={idx} className="recent-post-card">
                <div className="announcement-img">
                  <img src={post.image} alt={post.image}/>
                </div>
                
                <div className="recent-post-content">
                  <p>{post.announcementHeadline}</p>
                  <span>{post.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
