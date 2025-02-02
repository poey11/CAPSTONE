"use client"

import type { Metadata } from "next";
import "@/CSS/LoginPage/rLogin.css";


const metadata:Metadata = { 
    title: "Login for Residents",
    description: "Login for Residents for the barangay website",
  };
  export default function LoginResidents() {

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
      </div>
    );
}