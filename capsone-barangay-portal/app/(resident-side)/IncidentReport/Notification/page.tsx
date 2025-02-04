
import "@/CSS/IncidentReport/Notification.css";

export default function Notification() {

    return (
        <main className="main-container">
         
    
            <div className="notification-section">


                    <img 
                        src="/Images/check.png" 
                        alt="Barangay Captain" 
                        className="image" 
                    />
                    
                    <h1 className="message1">Your report has been successfully received.</h1>
                    
                    <p className="message2">
                        Your report had been received and will be reviewed by the barangay official.
                        If further information is needed, you will be contacred using the 
                        details you provided.
                    </p>
            
                <button type="submit" className="back-button">Back to Home</button>
            
                    
            </div>

        </main>
      );
    }

