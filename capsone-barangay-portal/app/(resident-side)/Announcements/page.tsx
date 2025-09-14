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

// const announcements = [
//     {
//       title: "2024 BAR PASSER!",
//       description: `
//         Congratulations, Atty. Harold Quebal Gardon, on conquering the 2024 Bar! We are proud of you! We look forward to fighting with you in Court. Your hard work, dedication, and perseverance have truly paid off. Passing the Bar Exam is no small feat, and you have earned the respect and admiration of your peers and mentors alike. 
//         We have witnessed your journey, the countless hours of study, the sacrifices made, and the resilience you showed during the preparation. This success is a reflection of not only your intelligence but your unwavering commitment to your profession. As you begin this next chapter in your career, we are excited to see the positive impact you will make in the legal field.
//         Your achievements inspire others to pursue their dreams and to push through challenges, no matter how daunting they may seem. The legal world awaits your expertise, and we have no doubt that you will continue to excel and contribute meaningfully to society. This milestone marks just the beginning of a bright future, and we, your community, stand behind you as you take on this new and exciting chapter of your life.
//       `,
//       date: "Wednesday, January 15, 2024",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "Justine is the best!",
//       description: `
//         Justine is insanneee! Justine is truly amazing, with outstanding skills and an impressive personality that makes everyone smile and feel positive! Her energy is contagious, and her passion for everything she does is evident in all her actions. Whether it's her work, her hobbies, or her relationships, Justine gives 100% and never fails to impress. 
//         Her attention to detail and her ability to approach problems with creativity and determination sets her apart from others. Her leadership skills are unmatched, and she leads by example, inspiring everyone around her to strive for excellence. Justine's ability to balance her professional responsibilities with her personal life is something to be admired.
//         She always finds time to support her friends, family, and colleagues, making them feel valued and appreciated. Her kindness and generosity make her a true role model to those who know her. Everyone who has had the privilege of working with Justine knows just how hard she works to make things happen. 
//         She is always the first one to step up to the plate when something needs to be done, and her commitment to success is unwavering. Justine is the type of person who motivates others to be the best version of themselves, and her influence is far-reaching. With her dedication, passion, and charisma, she is destined for great things, and there is no limit to what she can achieve.
//       `,
//       date: "Wednesday, January 15, 2024",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "Justine is the best!",
//       description: `
//         Justine is insanneee! She is a person of great integrity and strength, someone who approaches every task with enthusiasm and determination. Justine’s dedication to her goals is something that stands out the most. She never shies away from challenges and always looks for ways to improve and grow. Whether in her professional life or personal endeavors, Justine remains focused and committed to achieving excellence. 
//         Her positive attitude is infectious, and it inspires others to stay motivated, even in difficult times. Justine has the ability to turn any situation into an opportunity for growth and learning. She constantly seeks ways to enhance her skills and knowledge, which has contributed significantly to her success. 
//         Her resilience and perseverance have been a guiding force for many, and her influence continues to have a profound effect on those around her. Justine’s passion for making a difference is evident in the way she interacts with people, offering support and encouragement whenever it is needed. Her ability to lead with empathy and kindness makes her not only a remarkable individual but also a true asset to any team or community she is a part of.
//         Justine’s ambition and drive are only matched by her desire to help others achieve their potential, and she will undoubtedly continue to make a significant impact wherever she goes.
//       `,
//       date: "Wednesday, January 15, 2024",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "Justine is the best!",
//       description: `
//         Justine is insanneee! There are few people who leave a lasting impression like Justine does. With her unique blend of intelligence, creativity, and empathy, she stands out in every aspect of her life. Her commitment to excellence is evident in everything she does, and she is constantly pushing herself to reach new heights. 
//         Justine is a natural leader, always striving to make a positive impact on those around her. Her ability to build strong relationships and bring people together is unparalleled. Whether it's in the workplace, in social settings, or in personal interactions, Justine always manages to make people feel valued and heard.
//         One of Justine’s greatest strengths is her ability to remain calm and focused in high-pressure situations. She handles challenges with grace and determination, never losing sight of her objectives. Her ability to think critically and problem-solve in creative ways has earned her the respect of her peers.
//         Beyond her professional accomplishments, Justine is a compassionate and caring individual who is always willing to lend a helping hand. She is a true advocate for those in need and works tirelessly to make the world a better place. Justine’s authenticity and kindness make her someone who is deeply admired and respected by everyone who knows her.
//       `,
//       date: "Wednesday, January 15, 2024",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "Justine is the best!",
//       description: `
//         Justine is insanneee! Her boundless energy and enthusiasm are contagious, and she brings a sense of joy and positivity to everyone she encounters. Justine’s work ethic is unmatched; she tackles every challenge with dedication and determination, always striving to deliver her best. Her ability to balance her many commitments and responsibilities while maintaining a high level of excellence is truly inspiring. 
//         Justine is the type of person who always goes the extra mile, whether it’s for her career, her personal growth, or her relationships. She believes in the power of hard work, but she also understands the importance of taking time to enjoy life and appreciate the moments that matter. 
//         Her infectious personality, combined with her strong sense of purpose, makes her someone who brings people together. Justine's support and encouragement help others to find the confidence they need to succeed and reach their goals. Her deep empathy and genuine care for those around her make her a beloved figure in every community she’s a part of.
//         Justine is a role model in every sense of the word, and her impact will continue to be felt for years to come.
//       `,
//       date: "Wednesday, January 15, 2024",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "Justine is the best!",
//       description: `
//         Justine is insanneee! Her boundless energy and enthusiasm are contagious, and she brings a sense of joy and positivity to everyone she encounters. Justine’s work ethic is unmatched; she tackles every challenge with dedication and determination, always striving to deliver her best. Her ability to balance her many commitments and responsibilities while maintaining a high level of excellence is truly inspiring. 
//         Justine is the type of person who always goes the extra mile, whether it’s for her career, her personal growth, or her relationships. She believes in the power of hard work, but she also understands the importance of taking time to enjoy life and appreciate the moments that matter. 
//         Her infectious personality, combined with her strong sense of purpose, makes her someone who brings people together. Justine's support and encouragement help others to find the confidence they need to succeed and reach their goals. Her deep empathy and genuine care for those around her make her a beloved figure in every community she’s a part of.
//         Justine is a role model in every sense of the word, and her impact will continue to be felt for years to come.
//       `,
//       date: "Wednesday, January 15, 2024",
//       image: "/Images/anak.jpg",
//     },
//   ];


//   const recentPosts = [
//     {
//       title: "CITY OF ISABELA, BASILAN LGU BENCHMARKING ACTIVITY",
//       date: "Jul 29, 2025",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "ALA-ALA NG IKA-80 TAONG KABAYANIHAN",
//       date: "Feb 12, 2025",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "PASSPORT ON WHEELS, MATAGUMPAY NA ISINAGAWA",
//       date: "Feb 05, 2025",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "ALA-ALA NG IKA-80 TAONG KABAYANIHAN",
//       date: "Feb 12, 2025",
//       image: "/Images/anak.jpg",
//     },
//     {
//       title: "PASSPORT ON WHEELS, MATAGUMPAY NA ISINAGAWA",
//       date: "Feb 05, 2025",
//       image: "/Images/anak.jpg",
//     },
//   ];
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
        <h1 className="announcements-title">Latest News and Announcements</h1>
        <div className="announcements-underline"></div>
      </div>

      
      <div className="layout-announcement">
        
        <div className="left-section-announcement" ref={sectionRef}>
          {currentAnnouncements.map((item, index) => (
            <div key={startIndex + index} className="announcement-card-announcement">
              <img
                src={item.image}
                alt={item.image}
                className="announcement-image-announcement"
              />
              <div className="announcement-content-announcement">
                <h2 className="announcement-title-announcement">
                  {item.announcementHeadline}
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
                <img src={post.image} alt={post.image}/>
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
