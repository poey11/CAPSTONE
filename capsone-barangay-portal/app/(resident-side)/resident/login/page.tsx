"use client"
import type { Metadata } from "next";


const metadata:Metadata = { 
    title: "Barangay Certificate Residency",
    description: "Barangay Certificate Residency form page for the barangay website",
  };
  export default function BarangayCertificateResidency() {

    // Handle form submission
    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault(); // Prevent default form submission

      // Manually trigger form validation
      const form = event.target as HTMLFormElement;
      if (form.checkValidity()) {
        // Redirect to the Notification page after form submission if validation is successful
        document.location.href = '/services/barangayclearance/notification'; // Use JavaScript redirection
      } else {
        // If the form is invalid, trigger the validation
        form.reportValidity(); // This will show validation messages for invalid fields
      }
    }
    return (

      <div className="login-container">
        <div className="login-contents">
          <div className="login-card">
            <form onSubmit={handleSubmit}>
              <div className="section1">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input 
                    type="text"  
                    id="firstname"  
                    name="firstname"  
                    className="form-input"  
                    required  
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input 
                    type="password"  
                    id="password"  
                    name="password"  
                    className="form-input" 
                    required  
                  />
                </div>
              </div>

              <div className="section2">
                <p className="section2options">Forgot Password</p>
                <p className="section2options">Create an Account</p>
              </div>

              <div className="section3">
                <button type="submit" className="submit-button">Login</button>
              </div>
            </form>
          </div>
        </div>

        <style jsx>{`

          .login-container {
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden; /* Prevent scrolling */
          }

          .login-container::before {
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
            filter: blur(2px); /* Apply blur effect */
            z-index: 1; /* Ensure it appears below content */
            height:100%;
          }

          .login-container::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(75, 73, 73, 0.5); /* Semi-transparent overlay */
            z-index: 2; /* Overlay above blurred background */
          }

          .login-container > * {
            position: relative;
            z-index: 3; /* Ensure content is above overlay and background */
          }

          .login-contents{
            height: 100%;
            display: flex;
            align-items: center; /* Vertical centering */
            justify-content: center; /* Horizontal centering */
          }

          .login-card{
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 400px;
            width: 650px;
            background-color: #f7e5d5;
            border-radius: 20px;
            border: 2px solid rgb(168, 161, 158);

          }

          .section1{
            margin-top: 50px;
          }

          .form-group {
            margin-top: 13px;
            margin-bottom: 0px;
          }


        .form-label {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: rgba(0, 0, 0, 0.5);
        }

        .form-input {
          width: 500px;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-top: 2px;
          color: grey;
        }

        .section2{
          margin-top: 30px;
          display: flex;
          justify-content: center;
          gap: 130px;
        }

        .section2options{
          font-size: 14px;
          color: rgba(0, 0, 0, 0.5);
          font-weight: bold;
        }

        .section3{
          margin-top:45px;
          display:flex;
          justify-content: center;
        }

        .submit-button {
          padding: 10px 20px;
          font-size: 16px;
          background-color:rgb(245, 143, 88);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer; 
          width: 200px;
          box-shadow: 0 2px 4px rgba(0, 0, 10, 0.3);
        }

        .submit-button:hover {
          background-color: #e56723;
        }

        `}</style>


      </div>
    );
}