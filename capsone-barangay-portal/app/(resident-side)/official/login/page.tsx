"use client";

import type { Metadata } from "next";
import "@/CSS/LoginPage/oLogin.css";

const metadata: Metadata = {
  title: "Login For Officials",
  description: "Login as an official to access the barangay portal",
};

export default function LoginOfficial() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Add your form submission logic here
  }

  return (
    <main className="main-container">
      <div className="login-section">
        <div className="first-section">
          <img 
            src="/Images/QCLogo.png" 
            alt="Barangay Captain" 
            className="logo-image" 
          />
        </div>

        <div className="second-section">

          
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
             
             
              <div className="section3">
                <button type="submit" className="submit-button">Login</button>
              </div>
              
            </form> 
          </div>
        
      </div>
    </main>
  );
}
