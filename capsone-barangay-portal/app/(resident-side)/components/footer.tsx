"use client";
import Link from "next/link";
import SideNav from '../../(barangay-side)/components/bMenu';
import "@/CSS/Components/footer.css";
import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";


const Footer = () => {


  const year = new Date().getFullYear();

  const pathname = usePathname();
  const noTopNavPages = ['/dashboard'];// this is the list of pages that should not have the top nav aka the barangay user pages

  if (noTopNavPages.some((page) => pathname.includes(page))) {
    return(
      <></>
    ); 
  }

 

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-section1">
            <img
              src="/Images/updatedlogo.png"
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
               <p>893-00040 | 0917-700-5486 | 0917-710-5238</p>
            </div>
            <div className="contactinfo-loc">
              <img src="/images/location1.png" alt="Image 3" className="contacticon" />
              <p>Barangay Complex, Dahlia Ave., Fairview Q.C.</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {year} Barangay Fairview. All rights reserved.</p>
          <p className="footer-disclaimer">Disclaimer: This website is created solely for academic and capstone project purposes.
            It is not an official website of Barangay Fairview.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;