import "@/CSS/OfficialsModuleBarangdaySide/module.css";
import type { Metadata } from "next";
import Link from 'next/link';


const metadata: Metadata = {
  title: "Announcement Page for Residents",
  description: "Stay updated with the latest announcements",
};

export default function OfficialsModule() {


  return (
    <main className="main-container">

      <div className="section-1">
          <h1>Officials Lists</h1>

          
          <Link href="/dashboard/OfficialsModule/AddOfficial">
          <button className="add-announcement-btn">Add New Official</button>
          </Link>

      </div>
      
      <div className="section-2">
          <input 
              type="text" 
              className="search-bar" 
              placeholder="Enter Name" 
          />
        
          <select 
            id="featuredStatus" 
            name="featuredStatus" 
            className="featuredStatus" 
            required
            defaultValue=""  
          >
            <option value="" disabled>Show...</option>
            <option value="active">Show 5</option>
            <option value="inactive">Show 10</option>
          </select>
      </div>
      


 <div className="main-section">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Term Duration</th>
        <th>Contact Information</th>
        <th>Created By</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {Array(7)
        .fill(null)
        .map((_, index) => (
          <tr key={index}>
            <td>
              <div className="official-info">
                <img
                  src="/Images/QClogo.png"
                  alt="Official Profile"
                  className="official-image"
                />
                <span>Jonnell Quebal</span>
              </div>
            </td>
            <td>Barangay Captain</td>
            <td>2022-2025</td>
            <td>09171218101</td>
            <td>Super Tester</td>
            <td>
              <div className="actions">
                <button className="action-view">View</button>
                <button className="action-edit">Edit</button>
                <button className="action-delete">Delete</button>
              </div>
            </td>
          </tr>
        ))}
    </tbody>
  </table>
</div>


      
               
      


      <div className="login-container-resident">
  <div className="login-card-wrapper">
    {/* Left Side: Login Form */}
    <div className="login-left-panel">
      <h2 className="login-heading">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group-resident">
          <label htmlFor="email" className="form-label-resident">Username:</label>
          <div className="input-icon-wrapper">
            <input
              onChange={handleChange}
              value={resident.email}
              type="text"
              id="email"
              name="email"
              className="form-input-resident"
              required
            />
            <i className="fa fa-user input-icon" />
          </div>
        </div>

        <div className="form-group-resident">
          <label htmlFor="password" className="form-label-resident">Password:</label>
          <div className="input-icon-wrapper">
            <input
              onChange={handleChange}
              value={resident.password}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className="form-input-resident"
              required
            />
            
          </div>
        </div>

        <div className="section3-resident">
          <button type="submit" className="submit-button-resident">Login</button>
        </div>

        <div className="section2-resident">
          <span className="section2options-resident" onClick={handleForgotPassword}>Forgot Password?</span>
          <span className="section2options-resident" onClick={handleRegister}>Sign Up</span>
        </div>
      </form>
    </div>

    {/* Right Side: Welcome Text */}
    <div className="login-right-panel">
      <h2>WELCOME<br />BACK!</h2>
      <p>Lorem ipsum dolor sit amet consectetur adipisicing.</p>
    </div>
  </div>
</div>

       
      
    </main>
  );
}
