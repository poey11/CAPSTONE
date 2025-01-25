"use client"
import type { Metadata } from "next";


const metadata:Metadata = { 
  title: "About Us",
  description: "About Us page for the barangay website",
};
export default function AboutUs() {
  return (

    <div className="aboutus-container">
      
      <div className="headerpic">
        <p>ABOUT US</p>
      </div>
      
      <div className="aboutus-content">
        <div className="aboutus-inner">
          <div className="aboutus-kapinfo-card">
            <div className="aboutus-kapinfo">
              <img src="/images/kap.jpg" alt="Barangay Captain" className="aboutus-kapimage" />
              <div className="aboutus-kapinfo-textbox">
                <h1 className="aboutus-kapinfo-name">Jonel L. Quebal</h1>
                <p className="aboutus-kapinfo-position">
                  Barangay Captain
                </p>
                <hr/>
                <p className="aboutus-kapinfo-description">
                  To my fellow barangay residents, as your public servant, your active participation in the open governance of our barangay is very important to me. Whatever progress we have achieved so far since you entrusted me with the responsibility as the leader of our barangay is because of your belief, trust, and accountable involvement.
                </p>
                <div className="aboutus-contactinfo">
                  <div className="aboutus-contactinfo-email">
                    <img src="/images/email1.png" alt="Image 1" className="aboutus-contacticon" />
                    <p>barangayfairviewpark@gmail.com</p>
                  </div>
                  <div className="aboutus-contactinfo-phone">
                    <img src="/images/phone1.png" alt="Image 2" className="aboutus-contacticon" />
                    <p>893-00040 | 0943-675-5020 | 0916-530-0593</p>
                  </div>
                  <div className="aboutus-contactinfo-loc">
                    <img src="/images/location1.png" alt="Image 3" className="aboutus-contacticon" />
                    <p>West Fairview, 9 A Dahlia Ave, West Fairview, Quezon City, 1118 Metro Manila</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          

          <hr/>

          <div className="aboutus-history">
            <div className="aboutus-history-card">
              <h2 className="aboutus-history-title">History of Barangay Fairview</h2>
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
  
          </div>

          <hr/>

          <div className="aboutus-vision-mission">
            <div className="aboutus-visionmission-card">
              <h3 className="aboutus-visionmission-title">Vision</h3>
              <p className="aboutus-visionmission-text">
                Barangay Fairview envisions a harmonious, inclusive, and progressive community where residents thrive in a sustainable environment, empowered by transparent governance, innovative solutions, and active citizen participation.
              </p>
            </div>
            <div className="aboutus-visionmission-card">
              <h3 className="aboutus-visionmission-title">Mission</h3>
              <p className="aboutus-visionmission-text">
                Barangay Fairview envisions a harmonious, inclusive, and progressive community where residents thrive in a sustainable environment, empowered by transparent governance, innovative solutions, and active citizen participation.
              </p>
            </div>
          </div>

          <hr/>

          <div className="aboutus-map">
            <div className="aboutus-map-card">
              <h2 className="aboutus-map-title">Map of Barangay Fairview</h2>
              <img src="/images/samplemap.png" alt="Map of Barangay Fairview" className="aboutus-map-image" />
            </div>
          </div>
        </div>
      </div>


      <style jsx>{`

        .aboutus-container {
          font-family: Arial, sans-serif;
          background-color: #ffe0ca;
          color: #333;
          margin: 0;
          width: 100%; 
          height: 3000px;
        }

        .headerpic {
          position: relative; /* Required for pseudo-elements */
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 40px;
          font-weight: bold;
          overflow: hidden; /* Ensures blur doesn't spill outside */
        }

        .headerpic::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/header.jpg');
          background-size: cover;
          background-position: 50% 50%;
          background-repeat: no-repeat;
          filter: blur(2px); /* Adjust the blur intensity */
          z-index: 1; /* Place the blurred background below the text */
        }

        .headerpic > * {
          position: relative;
          z-index: 2; /* Ensure text is above the blurred background */
        }

        .aboutus-content {
          background-color: rgba(255, 255, 255, 0.90);
          padding: 20px;
          margin-top:55px;
          margin-left: 150px;
          margin-right: 150px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .aboutus-inner {
          max-width: 1200px;
          margin-top: 50px;
          margin-bottom: 50px;
          margin-left: 50px;
          margin-right: 50px;
        }

        .aboutus-inner hr {
          border: none; 
          border-top: 2px solid rgba(0, 0, 0, 0.20);
          margin: 50px 0; 
        }

        .aboutus-kapinfo-card {
          flex: 1 1 calc(50% - 20px);
          background-color: white;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .aboutus-kapinfo {
          display: flex; /* Enable Flexbox */
          align-items: center; /* Vertically align items */
          justify-content: space-between; /* Space out the items */
          gap: 20px; /* Optional: add space between items */
          margin: 20px;
        }

        .aboutus-kapinfo-textbox hr {
          border: none; 
          border-top: 2px solid rgba(0, 0, 0, 0.20);
          margin: 50px 0; 
        }

        .aboutus-kapimage {
          max-width: 100%; /* Ensure the image is responsive */
          height: auto;
          width: 550px; /* Adjust image size */
        }

        .aboutus-kapinfo-textbox {
          max-width: 60%; /* Adjust the width of the text box */
        }

        .aboutus-kapinfo-name {
          font-size: 50px; /* Adjust the title size */
          font-weight: bold;
          color: #e56723;
        }

        .aboutus-kapinfo-position{
          font-size: 20px;
          color: #e56723;
          font-weight: bold;
        }

        .aboutus-kapinfo-description {
          font-size: 16px; /* Adjust text size */
          text-align: justify;
        }

        .aboutus-contactinfo {
          margin-top: 20px;
          display: block; /* Enable Flexbox */
          justify-content: space-between; /* Space out the images evenly */
          gap: 20px; /* Optional: adds space between the images */
        }

        .aboutus-contacticon {
          width: 25px; /* Adjust image width */
          margin: 20px;
          height: auto; /* Maintain aspect ratio */
        }

        .aboutus-contactinfo-email{
          display: flex; 
          align-items: center; 
        }

        .aboutus-contactinfo-phone{
          display: flex; 
          align-items: center; 
        }

        .aboutus-contactinfo-loc{
          display: flex; 
          align-items: center; 
        }

        .aboutus-history {
          margin-bottom: 40px;
        }

        .aboutus-history-card {
          flex: 1 1 calc(50% - 20px);
          background-color: white;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-top:20px;
        }

        .aboutus-history-title {
          font-size: 30px;
          color: #e56723;
          font-weight: bold;
          margin-bottom: 15px;
          margin-top: 20px;
          margin-left: 20px;
        }

        .aboutus-history-text{
          margin-left: 20px;
          margin-right: 20px;
          margin-bottom: 20px;
        }

        .aboutus-history-text p{
          font-size: 16px;
          line-height: 1.6;
          text-align: justify;
          text-indent: 60px;
        }

        .aboutus-vision-mission {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: space-between;
        }

        .aboutus-visionmission-card {
          flex: 1 1 calc(50% - 20px);
          background-color: white;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .aboutus-visionmission-title {
          font-size: 30px;
          color: #e56723;
          font-weight: bold;
          margin-bottom: 15px;
          margin-top: 20px;
          text-align: center;
        }

        .aboutus-visionmission-text {
          font-size: 16px;
          line-height: 1.6;
          text-align: justify;
          margin-bottom: 20px;
          margin-left: 20px;
          margin-right: 20px;
        }

        .aboutus-map {
          text-align: center;
        }

        .aboutus-map-card {
          flex: 1 1 calc(50% - 20px);
          background-color: white;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-top:20px;
        }

        .aboutus-map-title{
          font-size: 30px;
          color: #e56723;
          font-weight: bold;
          margin-bottom: 15px;
          margin-top: 20px;
        }

        .aboutus-map-image {
          max-width: 96%;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          margin-left: 20px;
          margin-right: 20px;
        }
        
      `}</style>

        

    </div>



    

  );
}