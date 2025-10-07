import type { Metadata } from "next";
import "@/CSS/AboutUsPage/aboutus.css";

export const metadata:Metadata = { 
  title: "About Us",
  description: "About Us page for the barangay website",
};


export default function AboutUs() {
  return (

    <main className="aboutus-container">
      <div className="headerpic-abtus">
        <p>ABOUT US</p>
      </div>

  <div className="aboutus-main-container">

{/* History Section */}{/* History Section */}
<section className="history-section fade-in">
  <div className="history-content">
    <h2 className="section-title">Our History</h2>

    <p>
      Barangay Fairview was officially created as a Barangay Assembly pursuant
      to Presidential Decree’s (PD) 86 and 210 which was subsequently recognized
      as Barangay under PD 557 dated September 21, 1974 “Declaring All Barrios
      and Citizen’s Assemblies in the Philippines as Barangay” and by virtue of
      Executive Order No. 24 dated June 25, 1975 of the Mayor Norberto S.
      Amoranto issued pursuant to PD 557.
    </p>

    <p>
      During the decade prior to the declaration of Martial Law in the late
      1960’s, pioneer land developer B.C. Regalado and Co., in partnership with
      the Union of GSIS employees headed by Mr. Antonio A. Ancheta, organized
      and established a subdivision with approximately five hundred (500)
      families, named it Fairview Park. The word Fairview derives from the words
      per se; being far from the city or urbanization and of having a wonderful
      view of its wilderness covering some 312 hectares of land.
    </p>

    <p>
      A couple of creeks crossed this wilderness and poured its clear spring
      water into the Tullahan River. This wilderness had to give way to the
      urgent demand to develop residential lots for the growing population of
      the cities in Metro Manila. A pioneering land developer, B.C. Regalado &
      Co., saw the potential of these lands and in the early 1970’s was able to
      convert this vast tract into a residential subdivision complete with
      housing units. The wilderness had come to pass and in its place is now
      found the Fairview Park Subdivision.
    </p>

    <p>
      In the 1990’s up to the present, Fairview rapidly developed into a
      bustling community, with increased business and social activities. The
      entire stretch of Fairview Avenue transformed itself as one of the main
      arteries of Quezon City providing access for non-Fairview residents. The
      influx of new residents increased as new subdivisions mushroomed.
    </p>
  </div>

  {/* Slideshow */}
  <div className="history-image">
    <div className="slideshow">
      <img src="/Images/Background.jpeg" alt="Barangay History 1" />
      <img src="/Images/barangayhall.jpg" alt="Barangay History 2" />
      <img src="/Images/background3.jpg" alt="Barangay History 3" />
    </div>
  </div>
</section>




{/* Vision & Mission Cards */}
<section className="vision-mission-section fade-in">

<h2 className="section-title">Barangay's Vision and Mission Statements</h2>

  
  <div className="vision-mission-card">
    <div className="card-image">
      <img src="/Images/vision.png" alt="Vision" />
    </div>
    <h3>Vision</h3>
    <p>
      To be a model barangay that fosters sustainable development,
      promotes peace and order, and ensures the welfare of every resident
      through effective governance and active participation.
    </p>
  </div>

  <div className="vision-mission-card">
    <div className="card-image">
      <img src="/Images/mission-statement.png" alt="Mission" />
    </div>
    <h3>Mission</h3>
    <p>
      To serve with transparency, integrity, and compassion by delivering
      accessible services, promoting inclusivity, and upholding unity for
      the progress of Barangay Fairview.
    </p>
  </div>
</section>


{/* Leader Section */}
<section className="leader-section fade-in">
  <h2 className="section-title">Meet Our Leader</h2>
  <div className="leader-card">
    <div className="leader-photo-wrapper">
      <img src="/Images/brgyKap.png" alt="Barangay Captain" className="captain-photo"/>
    </div>
    <div className="leader-info">
      <h3>Jose Arnel L. Quebal</h3>
      <p>
        To my fellow barangay residents, as your public servant, your active 
        participation in the open governance of our barangay is very 
        important to me. Whatever progress we have achieved so far since you 
        entrusted me with the responsibility as the leader of our barangay 
        is because of your belief, trust, and accountable involvement.
      </p>

      {/* Contact Info */}
      <div className="aboutus-contactinfo">

        

        <div className="aboutus-contactinfo-item">
          <img src="/images/email1.png" alt="Email" className="aboutus-contacticon" />
            <p>barangayfairviewpark@gmail.com</p>
        </div>
        <div className="aboutus-contactinfo-item">
          <img src="/images/phone1.png" alt="Phone" className="aboutus-contacticon" />
          <p>893-00040 | 0917-700-5486 | 0917-710-5238</p>
        </div>
        <div className="aboutus-contactinfo-item">
          <img src="/images/location1.png" alt="Location" className="aboutus-contacticon" />
          <p>Barangay Complex, Dahlia Ave., Fairview Q.C.</p>
        </div>
      </div>
    </div>
  </div>
</section>



{/* Core Values with Icons */}
<section className="about-cards-section fade-in">
  <h2 className="section-title">Our Core Values</h2>

<div className="about-cards">
  <div className="card">
    <div className="card-img-wrapper">
      <img src="/Images/tolerance.png" alt="Unity" className="card-img"/>
    </div>
    <h3>Unity</h3>
    <p>Working hand-in-hand as one community, uplifting each other.</p>
  </div>

  <div className="card">
    <div className="card-img-wrapper">
      <img src="/Images/service.png" alt="Service" className="card-img"/>
    </div>
    <h3>Service</h3>
    <p>Providing people-first programs with care and compassion.</p>
  </div>

  <div className="card">
    <div className="card-img-wrapper">
      <img src="/Images/integrity.png" alt="Integrity" className="card-img"/>
    </div>
    <h3>Integrity</h3>
    <p>Practicing transparency, honesty, and fairness in governance.</p>
  </div>
</div>

</section>


  </div>


      
      

    </main>



    

  );
}