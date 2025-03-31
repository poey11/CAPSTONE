
import "@/CSS/IncidentReport/Notification.css";
import { Metadata } from "next";
import Link from 'next/link';


export const metadata: Metadata = {
    title: "Incident Report Notification",
    description: "Incident Report Notification",
};

export default function Notification() {

    return (
        <main className="main-container-incident-notification">
         
    
            <div className="notification-section-incident-notification">


                    <img 
                        src="/Images/check.png" 
                        alt="Icon Image" 
                        className="image-incident-notification" 
                    />
                    
                    <h1 className="message1-incident-notification">Your report has been successfully received.</h1>
                    
                    <p className="message2-incident-notification">
                        Your report had been received and will be reviewed by the barangay official.
                        If further information is needed, you will be contacted using the 
                        details you provided.
                    </p>
                    
                <Link href="/">
                    <button type="submit" className="back-button-incident-notification">Back to Home</button>
                </Link>
                    
            </div>

        </main>
      );
    }

