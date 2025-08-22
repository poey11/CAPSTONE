
import "@/CSS/ProgramsBrgy/Notifications.css";
import { Metadata } from "next";
import Link from 'next/link';


export const metadata: Metadata = {
    title: "Program Registration Notification",
    description: "Program Registration Notification",
};

export default function NotificationPrograms() {

    return (
        <main className="main-container-programs-notification">
            
            <div className="main-content-programs-notification">

                <div className="notification-section-programs-notification">
                        <img 
                            src="/Images/check.png" 
                            alt="Icon Image" 
                            className="image-programs-notification" 
                        />
                        
                        <h1 className="message1-programs-notification">Your Registration has been successfully received.</h1>
                        
                        <p className="message2-programs-notification">
                            Your Registration had been received and will be reviewed by the barangay official.
                            If further information is needed, you will be contacted using the 
                            details you provided.
                        </p>
                        
                    <Link href="/">
                        <button type="submit" className="back-button-programs-notification">Back to Home</button>
                    </Link>
                </div>

            </div>
         
    


        </main>
      );
    }

