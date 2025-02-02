"use client";
import Link from "next/link";
import SideNav from '../../(barangay-side)/components/bMenu';

import { usePathname } from "next/navigation";


const Footer = () => {

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    
  };

  const pathname = usePathname();
  const noTopNavPages = ['/dashboard'];// this is the list of pages that should not have the top nav aka the barangay user pages

  if (noTopNavPages.some((page) => pathname.includes(page))) {
    return <SideNav />; 
  }

 

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section1">
          <img
            src="/images/brgylogo.png"
            alt="Barangay Logo"
            className="footer-logo"
          />
          <p>A Barangay committed to accountability, integrity, and unity,
            committed to creating a safe, progressive, and inclusive community.</p>
        </div>


        <div className="footer-section2">
            <h1>Contact Us</h1>
                  <div className="aboutus-contactinfo-email">
                    <img src="/images/email1.png" alt="Image 1" className="aboutus-contacticon" />
                    <p>barangayfairviewpark@gmail.com</p>
                  </div>
                  <div className="aboutus-contactinfo-phone">
                    <img src="/images/phone1.png" alt="Image 2" className="aboutus-contacticon" />
                    <p>893-00040 | 0943-675-5020 | 0916-530-0593</p>
                  </div>
                  <div className="aboutus-contactinfo-loc">
                    <img src="/images/location1.png" alt="Image 3" className="aboutus-contacticon" />
                    <p>West Fairview, 9 A Dahlia Ave, West Fairview, Quezon City, 1118 Metro Manila</p>
                  </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Barangay Fairview. All rights reserved.</p>
        <button className="scroll-to-top" onClick={scrollToTop}>
          <img src="/images/arrow.png" alt="Up Arrow" className="scroll-icon" />
        </button>
      </div>

      <style jsx>{`
        .footer-container {
          background-color: #ed7014;
          color: white;
          padding: 10px 40px;
          font-size:16px;
        }

        .footer-content {
          margin-top: 30px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 300px;
        }

        .footer-section1{
            margin-top:20px;
            margin-left: 50px;
            width: 430px;
            display: flex;
            flex-direction: column; 
            align-items: center;
            
        }

        .footer-logo{
            margin-bottom:30px;
            height: 150px;
            margin-right:20px;
            width: 150px;
        }

        .footer-section2{
            margin-top: 20px;
          display: block; 
          justify-content: space-between; 
          gap: 20px; 
          width: 400;

        }

        .footer-section2 h1{
            color: white;
            font-size:30px;
            font-weight: bold;
        }

        .aboutus-contacticon {
          width: 25px; 
          margin: 20px;
          height: auto; 
          filter: invert(100%);
        }

        .aboutus-contactinfo-email{
          display: flex; 
          align-items: center; 
        }

        .aboutus-contactinfo-phone{
          display: flex; 
          align-items: center; 
        }

        .aboutus-contactinfo-loc{
          display: flex; 
          align-items: center; 
        }

        /*
        .footer-bottom{
            margin-top: 40px;
           text-align:center;
           display: flex;
           align-items: center;
            justify-content: center;
        }*/


          .footer-bottom {
          margin-top: 40px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .scroll-to-top {
          position: absolute;
          right: 20px;
          bottom: 10px;
          background-color: #d65a00; /* Darker orange */
          border: none;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .scroll-to-top:hover {
          background-color: #b55300; /* Even darker orange */
        }

        .scroll-icon {
          width: 30px;
          height: auto;
          filter: invert(100%);
        }
           
        
      `}</style>
    </footer>
  );
};

export default Footer;