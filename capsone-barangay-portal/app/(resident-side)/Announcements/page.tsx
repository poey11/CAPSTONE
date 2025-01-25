"use client";

import type { Metadata } from "next";
import Link from 'next/link';

const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function Announcement() {
  const announcements = [
    {
      title: "2024 BAR PASSER!",
      description: `
        Congratulations, Atty. Harold Quebal Gardon, on conquering the 2024 Bar! We are proud of you! We look forward to fighting with you in Court. Your hard work, dedication, and perseverance have truly paid off. Passing the Bar Exam is no small feat, and you have earned the respect and admiration of your peers and mentors alike. 
        We have witnessed your journey, the countless hours of study, the sacrifices made, and the resilience you showed during the preparation. This success is a reflection of not only your intelligence but your unwavering commitment to your profession. As you begin this next chapter in your career, we are excited to see the positive impact you will make in the legal field.
        Your achievements inspire others to pursue their dreams and to push through challenges, no matter how daunting they may seem. The legal world awaits your expertise, and we have no doubt that you will continue to excel and contribute meaningfully to society. This milestone marks just the beginning of a bright future, and we, your community, stand behind you as you take on this new and exciting chapter of your life.
      `,
      date: "January 15, 2024",
      image: "/Images/anak.jpg",
    },
    {
      title: "Justine is the best!",
      description: `
        Justine is insanneee! Justine is truly amazing, with outstanding skills and an impressive personality that makes everyone smile and feel positive! Her energy is contagious, and her passion for everything she does is evident in all her actions. Whether it's her work, her hobbies, or her relationships, Justine gives 100% and never fails to impress. 
        Her attention to detail and her ability to approach problems with creativity and determination sets her apart from others. Her leadership skills are unmatched, and she leads by example, inspiring everyone around her to strive for excellence. Justine's ability to balance her professional responsibilities with her personal life is something to be admired.
        She always finds time to support her friends, family, and colleagues, making them feel valued and appreciated. Her kindness and generosity make her a true role model to those who know her. Everyone who has had the privilege of working with Justine knows just how hard she works to make things happen. 
        She is always the first one to step up to the plate when something needs to be done, and her commitment to success is unwavering. Justine is the type of person who motivates others to be the best version of themselves, and her influence is far-reaching. With her dedication, passion, and charisma, she is destined for great things, and there is no limit to what she can achieve.
      `,
      date: "March 24, 2024",
      image: "/Images/anak.jpg",
    },
    {
      title: "Justine is the best!",
      description: `
        Justine is insanneee! She is a person of great integrity and strength, someone who approaches every task with enthusiasm and determination. Justine’s dedication to her goals is something that stands out the most. She never shies away from challenges and always looks for ways to improve and grow. Whether in her professional life or personal endeavors, Justine remains focused and committed to achieving excellence. 
        Her positive attitude is infectious, and it inspires others to stay motivated, even in difficult times. Justine has the ability to turn any situation into an opportunity for growth and learning. She constantly seeks ways to enhance her skills and knowledge, which has contributed significantly to her success. 
        Her resilience and perseverance have been a guiding force for many, and her influence continues to have a profound effect on those around her. Justine’s passion for making a difference is evident in the way she interacts with people, offering support and encouragement whenever it is needed. Her ability to lead with empathy and kindness makes her not only a remarkable individual but also a true asset to any team or community she is a part of.
        Justine’s ambition and drive are only matched by her desire to help others achieve their potential, and she will undoubtedly continue to make a significant impact wherever she goes.
      `,
      date: "March 24, 2024",
      image: "/Images/anak.jpg",
    },
    {
      title: "Justine is the best!",
      description: `
        Justine is insanneee! There are few people who leave a lasting impression like Justine does. With her unique blend of intelligence, creativity, and empathy, she stands out in every aspect of her life. Her commitment to excellence is evident in everything she does, and she is constantly pushing herself to reach new heights. 
        Justine is a natural leader, always striving to make a positive impact on those around her. Her ability to build strong relationships and bring people together is unparalleled. Whether it's in the workplace, in social settings, or in personal interactions, Justine always manages to make people feel valued and heard.
        One of Justine’s greatest strengths is her ability to remain calm and focused in high-pressure situations. She handles challenges with grace and determination, never losing sight of her objectives. Her ability to think critically and problem-solve in creative ways has earned her the respect of her peers.
        Beyond her professional accomplishments, Justine is a compassionate and caring individual who is always willing to lend a helping hand. She is a true advocate for those in need and works tirelessly to make the world a better place. Justine’s authenticity and kindness make her someone who is deeply admired and respected by everyone who knows her.
      `,
      date: "March 24, 2024",
      image: "/Images/anak.jpg",
    },
    {
      title: "Justine is the best!",
      description: `
        Justine is insanneee! Her boundless energy and enthusiasm are contagious, and she brings a sense of joy and positivity to everyone she encounters. Justine’s work ethic is unmatched; she tackles every challenge with dedication and determination, always striving to deliver her best. Her ability to balance her many commitments and responsibilities while maintaining a high level of excellence is truly inspiring. 
        Justine is the type of person who always goes the extra mile, whether it’s for her career, her personal growth, or her relationships. She believes in the power of hard work, but she also understands the importance of taking time to enjoy life and appreciate the moments that matter. 
        Her infectious personality, combined with her strong sense of purpose, makes her someone who brings people together. Justine's support and encouragement help others to find the confidence they need to succeed and reach their goals. Her deep empathy and genuine care for those around her make her a beloved figure in every community she’s a part of.
        Justine is a role model in every sense of the word, and her impact will continue to be felt for years to come.
      `,
      date: "March 24, 2024",
      image: "/Images/anak.jpg",
    },
    {
      title: "Justine is the best!",
      description: `
        Justine is insanneee! Her boundless energy and enthusiasm are contagious, and she brings a sense of joy and positivity to everyone she encounters. Justine’s work ethic is unmatched; she tackles every challenge with dedication and determination, always striving to deliver her best. Her ability to balance her many commitments and responsibilities while maintaining a high level of excellence is truly inspiring. 
        Justine is the type of person who always goes the extra mile, whether it’s for her career, her personal growth, or her relationships. She believes in the power of hard work, but she also understands the importance of taking time to enjoy life and appreciate the moments that matter. 
        Her infectious personality, combined with her strong sense of purpose, makes her someone who brings people together. Justine's support and encouragement help others to find the confidence they need to succeed and reach their goals. Her deep empathy and genuine care for those around her make her a beloved figure in every community she’s a part of.
        Justine is a role model in every sense of the word, and her impact will continue to be felt for years to come.
      `,
      date: "March 24, 2024",
      image: "/Images/anak.jpg",
    },
  ];



  return (
    <main className="main-container">
      <div className="Page">
        <p>ANNOUNCEMENTS</p>
      </div>

      <div className="TitlePage">
        <p>"Strengthening our community through information"</p>
        <img 
          src="/images/QCLogo.png" 
          alt="Barangay Captain" 
          className="aboutus-image" 
        />
      </div>

      <section className="announcements-section">
        {announcements.map((announcement, index) => (
          <Link
            key={index}
            href={{
              pathname: `/Announcements/${index}`,
              query: {
                title: announcement.title,
                description: announcement.description,
                date: announcement.date,
                image: announcement.image,
              },
            }}
          >
            <div className="announcement-card">
              <img
                src={announcement.image}
                alt={announcement.title}
                className="announcement-image"
              />
              <div className="announcement-content">
                <h2 className="announcement-title">{announcement.title}</h2>
                <p className="announcement-description">
                  {announcement.description.length > 300
                    ? `${announcement.description.slice(0, 300)}...`
                    : announcement.description}
                </p>
                {announcement.description.length > 300 && (
                  <span className="read-more">Read more</span>
                )}
                <p className="announcement-date">{announcement.date}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <style jsx>{`
        .Page {
          height: 200px; 
          display: flex;
          align-items: center;
          justify-content: center; 
          color: white; 
          font-size: 40px; 
          font-weight: bold; 
          position: relative;
          margin-bottom: 50px;
        }

        .Page::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/Images/Background.jpeg');
          background-size: cover; 
          background-position: 50% 50%;
          background-repeat: no-repeat; 
          z-index: 1; /* Ensure the overlay appears above the background image */
          filter: blur(2px); /* Adjust the blur intensity */
        }

        .Page > * {
          position: relative;
          z-index: 2; /* Ensure text is above the overlay */
        }

        .TitlePage {
          background-color: #FFE0CA;
          width: 800px;
          height: 100px;
          border-radius: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 auto;
          margin-bottom: 2rem;
          padding-left: 1rem;
          padding-right: 1rem;
          word-wrap: break-word; 
          overflow: hidden; 
        }

        .TitlePage p {
          color: black;
          font-size: 24px;
          font-weight: bold;
          text-overflow: ellipsis; 
          white-space: normal; 
          overflow: hidden;
          width: 100%; 
        }

        .aboutus-image {
          width: 160px;
          height: 80px;
        }

        .main-container {
          background-color: #f7e5d5;
        }

        .announcements-section {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3.5rem;
          padding: 2rem;
        }

        @media (min-width: 640px) {
          .announcements-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .announcements-section {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .announcement-card {
          background-color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          width: 100%;
          height: 500px; /* Fixed height for consistency */
          display: flex;
          flex-direction: column;
        }

        .announcement-image {
          width: 100%;
          height: 12rem;
          object-fit: cover;
        }

        .announcement-content {
          padding: 1rem;
          flex-grow: 1; /* Ensures the content section fills available space */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .announcement-title {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 15px;
          color: #e56723;
          text-align: center;

        }

        .announcement-description {
          font-size: 0.875rem;
          color: #4a4a4a;
         
         
        }

        .announcement-date {
          font-size: 0.75rem;
          color: #9e9e9e;
        }

        .read-more {
          font-size: 0.875rem;
          color: #0066cc;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}
