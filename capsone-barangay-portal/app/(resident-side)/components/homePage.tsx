"use client";
import "@/CSS/HomePage/HomePage.css";
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import { db } from '@/app/db/firebase'  ;
import {doc, setDoc, getDoc, updateDoc, increment} from "firebase/firestore";
import { useRouter } from 'next/navigation';
// @ts-ignore
import Cookies from 'js-cookie';

const homePage:React.FC = () => {    
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
        prev + 3 >= facilities.length ? 0 : prev + 1
      );
    };

    const prevSlide = () => {
      setCurrentSlide((prev) =>
        prev === 0 ? Math.max(facilities.length - 3, 0) : prev - 1
      );
    };

    const heroRef = useRef(null);
const servicesRef = useRef(null);
const serviceCardsRef = useRef<(HTMLDivElement | null)[]>([]);
const thirdSectionRef = useRef(null);
const facilitiesRef = useRef(null);


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


                   <div className="services-card">

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
      <h2 className="captain-name">Jonell L. Quebal</h2>
      <p className="captain-quote">
        “Great leaders inspire unity, progress, and hope within their community” 
        <br /><em>- Jonell</em>
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



 <div className="fourth-section-home">
  <div className="fouth-section-home-upper">
    <div className="section-content-home">
      <h2>Our Facilities</h2>
      <p>
        Explore the various facilities available in our barangay, designed to support community activities, public services, and resident well-being.
      </p>
    </div>
  </div>

  <div className="facilities-content-home-wrapper fade-slide-up" ref={facilitiesRef}>
    <button className="slide-button" onClick={prevSlide}>&lt;</button>

  <div className="facilities-content-home">
  {facilities.slice(currentSlide, currentSlide + 3).map((item, index) => (
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












          {/*
          
   
          <div className="homepage-container-home">


          <div className="slideshowpics">
    
          </div>
        

            <div className="first-container-home">


            
                <div className="first-section-home">
                      <p className="first-paragraph-home"> Discover Our Community</p>
                      <p className="second-paragraph-home"> Barangay Fairview</p>
                      <p className="third-paragraph-home"> The thriving heart of Barangay Fairview—where opportunities and progress come together. 
                        Let’s move forward as one community!</p>
                      
                        <Link href="/aboutus"> 
                            <button type="button" className="learn-more-button-home">
                              Learn More
                            </button>
                        </Link> 
                    
                </div>

                <div className="second-section-home">

                <img 
                  src="/Images/CaptainImage.jpg" 
                  alt="Barangay Captain" 
                  className="captain-image-home" 
                />

                </div>
            
                

              </div>


                  <div className="second-container-home">

                      <div className="card-home">
                            <p className="quantity-home"> 81k</p>
                            <p className="name-home">Population </p>
                      </div>

                      <div className="card-home">
                            <p className="quantity-home"> 22k</p>
                            <p className="name-home">Households </p>
                      </div>

                      <div className="card-home">
                            <p className="quantity-home"> 312</p>
                            <p className="name-home">Hectares</p>
                      </div>

                      <div className="card-home">
                            <p className="quantity-home"> 81k</p>
                            <p className="name-home">Population </p>
                      </div>


                      

                    </div>


              <hr/>


              <div className="third-container-home">

                  <div className="third-container-column1-home">
                    
                        <p className="barangaycaptain-home"> Barangay Captain </p>
                  </div>
                  
                  <div className="third-container-column2-home">

                      <div className="column2-section1-home">
                          
                        <img 
                          src="/Images/CaptainImage.jpg" 
                          alt="Barangay Captain" 
                          className="captain-image2-home" 
                        />

                      </div>

                      <div className="column2-section2-home">

                            <p className="section2-title-home"> JONEL L. QUEBAL</p>

                            <p className="section2-quote-home">

                            “Great leaders inspire unity, progress, and hope within their community” 
                            </p>

                            <p className="section2-description-home">
                            Barangay Captain Jonel Quebal, a dedicated public servant and a true 
                            advocate for the well-being of Barangay Fairview.
                            A proud product of our barangay, Captain Jonel Quebal has been serving 
                            the community with passion and commitment since 2013. Learn more about Barangay 
                            Captain Jonel Quebal and his vision for Barangay Fairview. Read his blog to stay
                            connected and inspired!
                            </p>

                      </div>



                  </div>

              </div>
      

              <hr/>

              <div className="fourth-container-home">
              <div className="fourth-container-column1">
                <p className="BarangayFacilities">Barangay Facilities</p>
              </div>

              <div className="slideshow-container">
                <button onClick={prevSlide} className="slideshow-button left">
                  &#8249;
                </button>

                <div className="facilities-cards">
                  {facilities
                    .slice(currentSlide, currentSlide + 3)
                    .map((facility, index) => (
                      <div key={index} className="facilities-card">
                        <img
                          src={facility.image}
                          alt={facility.facility}
                          className="facility-image"
                        />
                        <div className="facility-content">
                          <p className="facility">{facility.facility}</p>
                          <p className="location">{facility.location}</p>
                        </div>
                      </div>
                    ))}
                </div>

                <button onClick={nextSlide} className="slideshow-button right">
                  &#8250;
                </button>
              </div>
            </div>
    

        </div>

       */}
     
      </main>
      
	);
}

export default homePage;