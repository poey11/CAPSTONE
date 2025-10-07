"use client";
import "@/CSS/HomePage/HomePage.css";
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { db } from '@/app/db/firebase'  ;
import {doc, setDoc, getDoc, updateDoc, increment, onSnapshot, collection, query, where} from "firebase/firestore";
import { useRouter } from 'next/navigation';
// @ts-ignore
import Cookies from 'js-cookie';
interface AnnouncementFormProps {
    id?: string;
    title?: string;
    description?: string;
    date?: string;
    image?:string;
    createdAt?: string;
}
const homePage:React.FC = () => {    
    const [news, setNews] = useState<any[]>([]);
    useEffect(() => {
      
          const docRef = query(collection(db, "announcements"), where("isInFeatured", "==", "Active"));
          const unsubscribe = onSnapshot(docRef, (snapshot) => {
            const data: AnnouncementFormProps[] = snapshot.docs.map((doc) => {
              return {
                id: doc.id,
                title: doc.data().announcementHeadline,
                description: doc.data().content,
                date: doc.data().createdAt,
                image: doc.data().image,
                createdAt: doc.data().createdAt
              };
            });
            data.sort((a, b) => {
              const dateA = new Date(a.createdAt || "").getTime();
              const dateB = new Date(b.createdAt || "").getTime();
              return dateB - dateA; // Descending order
            });
            setNews(data);
          });
          return () => unsubscribe();

    },[])
   
    const facilities = [
        {
        image: "/Images/barangayhall.jpg",
        facility: "Barangay Hall",
        location: "Dahlia Avenue",
        },
        {
        image: "/Images/seniorcitizen.jpg",
        facility: "Senior Citizen Building",
        location: "Complex, Dahlia Avenue",
        },
        {
        image: "/Images/multi.jpg",
        facility: "Multi-purpose Center",
        location: "Sitio Ruby",
        },
        {
        image: "/Images/Sapamanai Covered Court.jpg",
        facility: "Sapamanai Covered Court",
        location: "Rose Street",
        },
        {
        image: "/Images/Fairview Elementary School.jpeg",
        facility: "Fairview Elementary School",
        location: "Tulip Lane",
        },
        {
        image: "/Images/feeding2.jpg",
        facility: " Sitio Kislap Covered Court",
        location: "Pearl Street",
        },
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [siteVisits, setSiteVisits] = useState(0);
    const [newsSlide, setNewsSlide] = useState(0);



    const [newsPerPage, setNewsPerPage] = useState(3);

    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth <= 768) {
          setNewsPerPage(1);  // mobile → 1 card
        } else if (window.innerWidth <= 1024) {
          setNewsPerPage(2);  // tablet → 2 cards
        } else {
          setNewsPerPage(3);  // desktop → 3 cards
        }
      };


      handleResize(); // run on mount
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const nextNews = () => {
      setNewsSlide((prev) => (prev + 1) % news.length);
    };

    const prevNews = () => {
      setNewsSlide((prev) => (prev - 1 + news.length) % news.length);
    };


const getVisibleNews = () => {
  const visible = [];
  for (let i = 0; i < newsPerPage; i++) {
    visible.push(news[(newsSlide + i) % news.length]);
  }
  return visible;
};



    // Fetch the site visit count from Firestore
    const fetchSiteVisitCount = async () => {
        const docRef = doc(db, 'SiteVisits', 'homepageVisit');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setSiteVisits(docSnap.data().homepageCount);
        } else {
            // If document does not exist, initialize with a count of 0
            setSiteVisits(0);
            await setDoc(docRef, { homepageCount: 0 });  // Create document with initial value
        }
    };

    // Increment the site visit count in Firestore
    const incrementSiteVisitCount = async () => {
        const docRef = doc(db, 'SiteVisits', 'homepageVisit');
        await updateDoc(docRef, {
            homepageCount: increment(1),
        });
    };

    useEffect(() => {
      const checkAndTrackVisit = async () => {
        const lastVisit = Cookies.get("homepageVisit"); // Returns string or undefined
        const now = Date.now(); // Current timestamp in ms
        const THIRTY_MINUTES = 30 * 60 * 1000;
    
        if (!lastVisit || now - parseInt(lastVisit) > THIRTY_MINUTES) {
          try {
            await incrementSiteVisitCount(); // Only increment if 30 mins passed
            Cookies.set("homepageVisit", now.toString(), {
              expires: 1 / 48, // ~30 minutes
              path: "/",
            });
          } catch (error) {
            console.error("Failed to increment visit count:", error);
          }
        }
    
        await fetchSiteVisitCount(); // Still fetch the current count to display it
      };
    
      checkAndTrackVisit();
    }, []);
    


 const nextSlide = () => {
  setCurrentSlide((prev) =>
    prev + cardsPerPage >= facilities.length ? 0 : prev + cardsPerPage
  );
};

const prevSlide = () => {
  setCurrentSlide((prev) =>
    prev === 0 ? Math.max(facilities.length - cardsPerPage, 0) : prev - cardsPerPage
  );
};

    const heroRef = useRef(null);
const servicesRef = useRef(null);
const serviceCardsRef = useRef<(HTMLDivElement | null)[]>([]);
const thirdSectionRef = useRef(null);
const facilitiesRef = useRef(null);
const newsRef = useRef(null);


useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    },
    { threshold: 0.2 }
  );

  const refs = [
    heroRef.current,
    servicesRef.current,
    thirdSectionRef.current,
    facilitiesRef.current,
    newsRef.current, 
    ...serviceCardsRef.current
  ];

  refs.forEach((ref) => {
    if (ref) observer.observe(ref);
  });

  return () => {
    refs.forEach((ref) => {
      if (ref) observer.unobserve(ref);
    });
  };
}, []);


const router = useRouter();

const [cardsPerPage, setCardsPerPage] = useState(3);

useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth <= 768) {
      setCardsPerPage(1);  // mobile → 1 card
    } else {
      setCardsPerPage(3);  // desktop → 3 cards
    }
  };

  handleResize(); // run on mount
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);



	return (
		
      
<main className="main-container-home-page">

      <div className="home-hero-section">
       <div className="main-content-home fade-slide-up" ref={heroRef}>
          <h1 className="main-heading-home">Welcome to Barangay Fairview</h1>
          <p className="main-subheading-home">Delivering fast, transparent, and accessible local services for our community.</p>
           <Link href="/aboutus"> 
          <button className="main-button-home">Learn More</button>
          </Link>
        </div>

      </div>

      <div className="second-section-home" >

       <div className="second-section-home-upper">

          <div className="section-content-home">
            <h2>Our Services</h2>
            <div className="homepage-underline"></div>
            <p>
              Request documents, report issues, and connect with your barangay anytime.
            </p>
          </div>

        </div> 


        <div className="second-section-home-lower fade-slide-up"  ref={servicesRef}>

          <div className="services-content-home">

              
              <div className="services-card" onClick={() => router.push('/services')}>

                    <div className="services-image">
                        <img src="/images/document.png" alt="Document Request Icon" className="icon-image" />
                    </div>

                    <div className="services-description">
                        <h3>Document Requests</h3>
                <p>Secure barangay clearances, certificates, and other official documents online with ease.</p>

                    </div>
                </div>
          
               <div className="services-card" onClick={() => router.push('/IncidentReport')}>

                  
                    <div className="services-image">
                       <img src="/Images/incident.png" alt="Incident Report Icon" className="icon-image" />

                    </div>

                    <div className="services-description"onClick={() => router.push('/Programs')}>
                        <h3>Incident Reports</h3>
                  <p>File incident reports online and stay informed on the status of your case with real-time updates.</p>

                    </div>
                </div>


                   <div className="services-card" onClick={() => router.push('/Programs')} >

                    <div className="services-image">
                        <img src="/Images/training-program.png" alt="Document Request Icon" className="icon-image" />
                    </div>

                    <div className="services-description">
                        <h3>Programs</h3>
                <p>Explore various barangay programs and services designed to support the community, including health drives, livelihood training, and outreach activities.</p>

                    </div>
                </div>

            </div>

          


        </div>


  </div>


<div className="third-section-home">
  <div className="third-section-container">
    <div className="captain-image-container">
      <img src="/Images/kap2.png" alt="Barangay Captain" className="captain-image" />
    </div>

    <div className="captain-info fade-slide-up" ref={thirdSectionRef}>
      <span className="captain-role">Barangay Captain</span>
      <h2 className="captain-name">Jose Arnel L. Quebal</h2>
      <p className="captain-quote">
        “Great leaders inspire unity, progress, and hope within their community” 
        <br /><em>- Jose Arnel L. Quebal</em>
      </p>
      <p className="captain-description">
        Barangay Captain Jonel Quebal, a dedicated public servant and a true 
                            advocate for the well-being of Barangay Fairview.
                            A proud product of our barangay, Captain Jonel Quebal has been serving 
                            the community with passion and commitment since 2013. Learn more about Barangay 
                            Captain Jonel Quebal and his vision for Barangay Fairview. Read his blog to stay
                            connected and inspired!
      </p>
      
       <Link href="/aboutus"> 
      <button className="captain-button">Contact Us</button>
       </Link>
    </div>
  </div>
</div>

  

<div className="fifth-section-home">
  <div className="fifth-section-home-upper">
    <div className="section-content-home">
      <h2>News & Announcements</h2>
      <div className="homepage-underline"></div>
      <p>Stay updated with the latest news and announcements in Barangay Fairview.</p>
    </div>
  </div>

  <div className="news-content-wrapper fade-slide-up" ref={newsRef}>
    <button className="slide-button" onClick={prevNews}>&lt;</button>
    <div className="news-cards-container-wrapper">
      {news.length > 0 &&
        getVisibleNews().map((item, index) => (
          <Link
            key={item?.id || index}
            href={{
              pathname: `/Announcements/${item?.id || index}`,
              query: {
                title: item?.title,
                description: item?.description,
                date: item?.date,
                image: item?.image,
              },
            }}
          >
            <div className="news-card">
              <img src={item?.image} alt={item?.title} className="news-image" />
              <div className="news-info">
                <h3>{item?.title}</h3>
                <p>{item?.description}</p>
                <span className="news-date">{item?.date}</span>
              </div>
            </div>
          </Link>
      ))}
    </div>
    <button className="slide-button" onClick={nextNews}>&gt;</button>
  </div>
</div>



 <div className="fourth-section-home">
  <div className="fouth-section-home-upper">
    <div className="section-content-home">
      <h2>Our Facilities</h2>
      <div className="homepage-underline"></div>
      <p>
        Explore the various facilities available in our barangay, designed to support community activities, public services, and resident well-being.
      </p>
    </div>
  </div>

  <div className="facilities-content-home-wrapper fade-slide-up" ref={facilitiesRef}>
    <button className="slide-button" onClick={prevSlide}>&lt;</button>

  <div className="facilities-content-home">
  {facilities.slice(currentSlide, currentSlide + cardsPerPage).map((item, index) => (
    <div className="facilities-card" key={index}>
      <div className="facilities-image-wrapper">
        <img src={item.image} alt={item.facility} className="facilities-image" />
      </div>
      <div className="facilities-info">
        <h3>{item.facility}</h3>
        <p>{item.location}</p>
      </div>
    </div>
  ))}
  </div>


    <button className="slide-button" onClick={nextSlide}>&gt;</button>
  </div>

</div>





     
      </main>
      
	);
}

export default homePage;