"use client"; // Ensure this is a client-side component

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

          <style jsx>{`
            
        .main-container {
         background-color: #f7e5d5;
        min-height: 100vh;
            display: flex; 
          justify-content: center;
          align-items: center;
       }
       
       .notification-section {
         display: flex;
         flex-direction: column;
         justify-content: center;
         align-items: center; 
         background-color: rgba(255, 255, 255, 0.7);
         border-radius: 8px; /* Optional for rounded corners */
         width: 75%;
         padding: 2.5rem;
       }
     
      .message1 {
       color: grey;
       font-weight: bold;
       margin-bottom: 2rem;
       margin-top: 2rem;
       font-size: 1.75rem;
      }

      .message2 {
        color: grey;
        font-weight: light;
        font-size: 1rem;
        margin-bottom: 1rem;
      }

      .image {
      width: 80px;
      height: 80px;
      margin-top: 1.5rem;
      }

      .back-button {
        background-color: #f49028;
        color: white;
        font-size: 16px;
        font-weight: bold;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
        transition: background-color 0.3s ease;
        align-self: center; /* Centers the button */
        width: 350px;
        }

        
        .back-button:hover {
        background-color: #d87d20;
        }

        .back-button:active {
        background-color: #bf6a18;
        }

     
    
            
          `}</style>
        </main>
      );
    }

