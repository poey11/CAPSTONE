"use client";
import Link from "next/link";
import SideNav from '../../(barangay-side)/components/bMenu';
import "@/CSS/Components/footer.css";

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
                  <div className="contactinfo-email">
                    <img src="/images/email1.png" alt="Image 1" className="contacticon" />
                    <p>barangayfairviewpark@gmail.com</p>
                  </div>
                  <div className="contactinfo-phone">
                    <img src="/images/phone1.png" alt="Image 2" className="contacticon" />
                    <p>893-00040 | 0943-675-5020 | 0916-530-0593</p>
                  </div>
                  <div className="contactinfo-loc">
                    <img src="/images/location1.png" alt="Image 3" className="contacticon" />
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
    </footer>
  );
};

export default Footer;