"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from 'next/link';
import SideNav from '../../(barangay-side)/components/bMenu';

const Menu = () => {
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);

  const toggleLoginOptions = () => {
    setShowLoginOptions((prev) => !prev);
  };

  const toggleLoginOptionsOff = () => {
    setShowLoginOptions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginMenuRef.current && !loginMenuRef.current.contains(event.target as Node)) {
        setShowLoginOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const pathname = usePathname();
  const noTopNavPages = ['/dashboard'];// this is the list of pages that should not have the top nav aka the barangay user pages

  if (noTopNavPages.some((page) => pathname.includes(page))) {
    return <SideNav />; 
  }

  return (
    <>
      {/* Add new links as we go */}
      
      <div className="navbar-container">

        <div className="navbar-card">
          <img src="/images/brgylogo.jpg" alt="Barangay Logo" className="header-brgylogo" />
    
          <div className="navbar-links">
            <Link
              href="/"
              className="hover:text-[white] cursor-pointer"
              onClick={toggleLoginOptionsOff}
            >
              Home
            </Link>
            <Link
              href="/aboutus"
              className="hover:text-[white] cursor-pointer"
              onClick={toggleLoginOptionsOff}
            >
              About Us
            </Link>
            <Link
              href="/services"
              className="hover:text-[white] cursor-pointer"
              onClick={toggleLoginOptionsOff}
            >
              Services
            </Link>

            <p>News</p>
            <p>Officials</p>

            <div className="relative" ref={loginMenuRef}>
              <p
                id="login-link"
                className="hover:text-[white] cursor-pointer"
                onClick={toggleLoginOptions}
              >
                Login
              </p>

              {showLoginOptions && (
                <div className="dropdown-container">
                  <div className="dropdown-content">
                    <Link
                      href="/official"
                      onClick={toggleLoginOptions}
                      className="dropdown-item"
                    >
                      Login For Official
                    </Link>
                    <Link
                      href="/resident"
                      onClick={toggleLoginOptions}
                      className="dropdown-item"
                    >
                      Login For Resident
                    </Link>
                    <Link
                      href="/register"
                      onClick={toggleLoginOptions}
                      className="dropdown-item"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>


          <img src="/images/user.png" alt="Barangay Logo" className="header-usericon" />
        </div>


        <style jsx>{`

          .dropdown-container {
            position: absolute;
            top: 100%; /* Aligns dropdown below the trigger button */
            left: 0;
            width: 10rem; /* Equivalent to w-40 */
            z-index: 50; /* Ensures it appears above other elements */
          }

          /* Dropdown content box */
          .dropdown-content {
            background-color: #cbd5e1; /* bg-slate-300 */
            border-radius: 0.375rem; /* rounded-md */
            padding: 0.25rem 0.75rem; /* py-1 px-3 */
            display: flex;
            flex-direction: column;
          }

          /* Dropdown item styles */
          .dropdown-item {
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            transition: color 0.2s ease-in-out;
          }

          .dropdown-item:hover {
            color: white; /* Hover state for links */
          }

          .navbar-container{
            position: sticky;
            top: 0; /* Sticks to the top of the page */
            z-index: 1000; /* Ensures it stays above other content when scrolling */
            background-color: #ffe0ca; /* Optional: background color */
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Optional: adds a shadow for better separation */
          }

          .navbar-card {
            background-color: #ed7014;
            display: flex; /* Enable Flexbox */
            justify-content: space-between; /* Space between logo and links */
            align-items: center; /* Center items vertically */
            height: 90px; /* Adjust height as needed */
            padding: 0 20px; /* Add padding to the sides */
          }

          .header-brgylogo {
            max-width: 100%; /* Ensure the image is responsive */
            height: auto;
            width: 70px; /* Adjust image size */
            margin-left:20px;
          }

          .header-usericon{
            max-width: 100%; /* Ensure the image is responsive */
            height: auto;
            width: 35px; /* Adjust image size */
            margin-right:20px;
          }

          .navbar-links {
            display: flex; /* Group links together */
            justify-content: center; /* Center the links horizontally */
            align-items: center; /* Align links vertically */
            flex-grow: 1; /* Take up remaining space after the logo */
            gap: 50px; /* Add space between links */
            text-align: center; /* Align text within the links */
          }

          .navbar-links a {
            text-decoration: none; /* Remove underline */
            color: black; /* Text color */
          }

          

        `}</style>
      </div>
    </>
  );
};

export default Menu;
