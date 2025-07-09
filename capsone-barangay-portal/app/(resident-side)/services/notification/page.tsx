"use client"
import Link from 'next/link';
import "@/CSS/ServicesPage/notification/notifcationservices.css";


export default function ServicesNotification() {
  return (

    <main className="main-container-notification-services">


      <div className="main-content-services-notification">

            <div className="notification-section-services">
                 <img 
                        src="/Images/check.png" 
                        alt="Icon Image" 
                        className="image-notification-services" 
                    />
                    
                    <h1 className="message1-notification-services">Your  request has been successfully submitted!</h1>
                    
                    <p className="message2-notification-services">
                        Your request had been received and will be reviewed by the barangay official.
                        If further information is needed, you will be contacted using the 
                        details you provided.
                    </p>
                    
                <Link href="/">
                    <button type="submit" className="back-button-notification-services">Back to Home</button>
                </Link>
                    
            </div>

      </div>
         
    


</main>

  );
}