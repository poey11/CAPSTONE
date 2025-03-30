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
        <div className="container">

          <div className="kap-info-container">
         
            <div className="kap-info-container-sec1">
              <img src="/images/kap.jpg" alt="Barangay Captain" className="kapImage" />
            </div>
            <div className="kap-info-container-sec2">
              <h1 className="aboutus-kapinfo-name">Jonel L. Quebal</h1>
              <p className="aboutus-kapinfo-position">
                Barangay Captain
              </p>
              <hr/>
              <p className="aboutus-kapinfo-description">
                To my fellow barangay residents, as your public servant, your active participation in the open governance of our barangay is very important to me. Whatever progress we have achieved so far since you entrusted me with the responsibility as the leader of our barangay is because of your belief, trust, and accountable involvement.
              </p>

              <div className="contactinfo-container">
                <div className="aboutus-contactinfo-email-section">
                  <img src="/images/email1.png" alt="Image 1" className="aboutus-contacticon" />
                  <p>barangay fairview park @gmail.com</p>
                </div>
                <div className="aboutus-contactinfo-phone-section">
                  <img src="/images/phone1.png" alt="Image 2" className="aboutus-contacticon" />
                  <p>893-00040 | 0943-675-5020 | 0916-530-0593</p>
                </div>
                <div className="aboutus-contactinfo-loc-section">
                  <img src="/images/location1.png" alt="Image 3" className="aboutus-contacticon" />
                  <p>West Fairview, 9 A Dahlia Ave, West Fairview, 
                      Quezon City, 1118 Metro Manila</p>
                </div>
              </div>
            </div>

          
          </div>

          <hr/>

    
          <div className="history-container">
            <h1 className="aboutus-history-title">History of Barangay Fairview</h1>
            <div className="aboutus-history-text">
                <p>Barangay Fairview was officially created as a Barangay Assembly pursuant to Presidential Decree's (P) 86 and 210 which was subsequently recognized as Barangay under PD 557 dated September 21, 1974 "Declaring All Barrios and Citizen's Assemblies in the Philippines as Barangay" and by virtue of Executive Order No. 24 dated June 25, 1975 of the Mayor Norberto S. Amoranto issued pursuant to PD 557. </p>
                <br/><br/>
                <p>During the decade prior to the declaration of Martial Law in late 1960's pioneer land developer B.C. Regalado and Co., in partnership wilth the Union of GSTS employees headed by Mr. Antonio A. Ancheta, organized and established a subdivision with approximately Five Hundred (500) families, named it Fairview Park. The word Fairview derives from the words per se; being far from the city or urbanization and of having a wonderful views of its wilderness covering some 312 hectares of land. </p>
                <br/><br/>
                <p>A couple of creeks crossed this wilderness and pouring its clear spring water into the Tullahan River. This wilderness had to give way to the urgent demand to develop residential lots for the growing population of the cities in Metro Manila. A pioneering land developer, B.C. Regalado & Co., saw the potential of these wilderness and in the early 1970's was able to convert this vast tract of land into residential subdivision complete with housing units. The wilderness had come to pass and in its place is now found the FAIRVIEW PARK SUBDIVISION. </p>
                <br/><br/>
                <p>In the 90's up to the present, Fairview rapidly developed into a bustling community, with increased business and social activities. The entire stretch of Fairview Avenue transformed itself as one of the main arteries of Quezon City providing access for non Fairview residents. Influx of new residents increased as new subdivisions mushroomed. </p>
            </div>
          </div>


          <hr/>

          <div className="vision-mission-container">
            <div className="visionmission-card">
            <h3 className="visionmission-title">Vision</h3>
              <p className="visionmission-text">
                Barangay Fairview envisions a harmonious, inclusive, and progressive community where residents thrive in a sustainable environment, empowered by transparent governance, innovative solutions, and active citizen participation.
              </p>
            </div>

            <div className="visionmission-card">
              <h3 className="visionmission-title">Mission</h3>
              <p className="visionmission-text">
                Barangay Fairview envisions a harmonious, inclusive, and progressive community where residents thrive in a sustainable environment, empowered by transparent governance, innovative solutions, and active citizen participation.
              </p>
            </div>
          </div>

          <hr/>

          <div className="map-container">
            <div className="aboutus-map-card">
              <h2 className="aboutus-map-title">Map of Barangay Fairview</h2>
              <img src="/images/samplemap.png" alt="Map of Barangay Fairview" className="aboutus-map-image" />
            </div>
          </div>
             
        </div>
      </div>
      
      

    </main>



    

  );
}