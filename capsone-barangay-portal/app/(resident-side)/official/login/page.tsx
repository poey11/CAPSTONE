"use client";

import type { Metadata } from "next";

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
     
      <style jsx>{`
        .main-container {
          width: 100%;
          height: 100vh;
          background-color: #f7e5d5;
        }

        .login-section {
          display: flex;
          padding: 2rem;
        }

        .first-section {
          width: 50%;
          padding: 7rem;
        }

        .logo-image {
          height: 300px;
          width: 700px;
        opacity: 0.5; 
        }

        .second-section {
          display: flex;
          flex-direction: column;
           align-items: center;
         justify-content: center;
         
        }

        .form-group {
            margin-top: 2rem;
            margin-bottom: 2rem;
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

           .section3{
          margin-top:45px;
          display:flex;
          justify-content: center;
        }


         

      `}</style>
    </main>
  );
}
