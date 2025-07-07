"use client"
import Link from 'next/link';
import "@/CSS/ServicesPage/notification/notifcationservices.css";


export default function ServicesNotification() {
  return (

    <main className="main-container-incident-notification-services">
         
    
    <div className="notification-section-incident-notification-services">


            <img 
                src="/Images/check.png" 
                alt="Icon Image" 
                className="image-incident-notification-services" 
            />
            
            <h1 className="message1-incident-notification-services">Your document request has been successfully received.</h1>
            
            <p className="message2-incident-notification-services">
                Your request had been received and will be reviewed by the barangay official.
                If further information is needed, you will be contacted using the 
                details you provided.
            </p>
            
        <Link href="/">
            <button type="submit" className="back-button-incident-notification-services">Back to Home</button>
        </Link>
            
    </div>

</main>

  );
}