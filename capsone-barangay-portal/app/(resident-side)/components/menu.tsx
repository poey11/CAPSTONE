"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SideNav from '../../(barangay-side)/components/bMenu';
//import TopMenu from '../../(barangay-side)/components/topMenu';
import Link from 'next/link';

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
    return (
      <>
        {/* <TopMenu />*/}
        <SideNav />
      </>
    );
  }

  return (
    <>
      {/* Add new links as we go */}
      
      <div className="navbar-container">

        <div className="navbar-card">
          <img src="/images/brgylogo.png" alt="Barangay Logo" className="header-brgylogo" />
    
          <div className="navbar-links">
            <div className="navbar-indiv-container">
              <Link
                href="/"
                className="hover:text-[white] cursor-pointer"
                onClick={toggleLoginOptionsOff}
              >
                Home
              </Link>
            </div>
            <div className="navbar-indiv-container">
              <Link
                href="/aboutus"
                className="hover:text-[white] cursor-pointer"
                onClick={toggleLoginOptionsOff}
              >
                About Us
              </Link>
            </div>
            
            <div className="navbar-indiv-container dropdown-container">
              
                <p className="hover:text-[white] cursor-pointer">Services</p>
                <div className="dropdown">
                  <Link href="/services">
                    <p>Request Documents</p>
                  </Link>
                  <Link href="/Programs">
                    <p>Programs</p>
                  </Link>
                  <Link href="/IncidentReport">
                    <p>File an Incident</p>
                  </Link>
                </div>
              
            </div>
            
            <Link
                href="/Announcements"
                className="hover:text-[white] cursor-pointer"
                onClick={toggleLoginOptionsOff}
              >
                News
              </Link>

            <div className="navbar-indiv-container dropdown-container">
              
                <p className="hover:text-[white] cursor-pointer">Officials</p>
                <div className="dropdown">
                  <Link href="/OfficialsPage">
                    <p>Barangay Officials</p>
                  </Link>
                  <Link href="/OfficialsPage/HOAOfficersPage">
                    <p>HOA Officers</p>
                  </Link>
                  <Link href="/OfficialsPage/SitioOfficersPage">
                    <p>Sitio Officers</p>
                  </Link>
                </div>
              
            </div>
            
            

            <div className="relative" ref={loginMenuRef}>
              <p
                id="login-link"
                className="hover:text-[white] cursor-pointer"
                onClick={toggleLoginOptions}
              >
                Login
              </p>

              {showLoginOptions && (
                <div className="dropdown-containerr">
                  <div className="dropdown-content">
                    <Link
                      href="/official"
                      //href="/official/login"

                      onClick={toggleLoginOptions}
                      className="dropdown-item"
                    >
                      Login For Official
                    </Link>
                    <Link
                      href="/resident"
                      //href="/resident/login"
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


          <img src="/images/user.png" alt="User Icon" className="header-usericon" />
        </div>


        <style jsx>{`

          .dropdown-containerr {
            position: absolute;
            top: 100%; 
            left: 0;
            width: 10rem;
            z-index: 50;
          }

       
          .dropdown-content {
            background-color: #cbd5e1; /* bg-slate-300 */
            border-radius: 0.375rem; /* rounded-md */
            padding: 0.25rem 0.75rem; /* py-1 px-3 */
            display: flex;
            flex-direction: column;
          }

          
          .dropdown-item {
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            transition: color 0.2s ease-in-out;
          }

          .dropdown-item:hover {
            color: white; 
          }

          .navbar-container{
            position: sticky;
            top: 0; 
            z-index: 1000; 
            background-color: #ffe0ca; 
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); 
          }

          .navbar-card {
            background-color: #ed7014;
            display: flex;
            justify-content: space-between; 
            align-items: center; 
            height: 120px; 
            padding: 0 20px; 
          }

          .header-brgylogo {
            max-width: 100%; 
            height: auto;
            width: 100px; 
            margin-left:20px;
          }

          .header-usericon{
            max-width: 100%; 
            height: auto;
            width: 35px;
            margin-right:20px;
          }

          .navbar-links {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-grow: 1;
            gap: 50px; 
            text-align: center;
          }

          .navbar-links a {
            text-decoration: none;
            color: black; 
          }

          .dropdown-container:hover .dropdown,
        .dropdown-container .dropdown:hover {
            display: block; 
        }

        .dropdown-container {
            position: relative;
        }

        .dropdown {
            display: none;
            position: absolute;
            top: 23px;
            left: 0;
            background-color:  #ed7014;
            padding: 10px;
            z-index: 100; 
            width: 200px;
        }

        .dropdown p {
            margin: 0;
            padding: 5px 10px;
            color: black;
            font-size: 14px;
            cursor: pointer;
        }

        .dropdown p:hover {
            color: white;
            background-color:rgb(220, 98, 11);
        }

          

        `}</style>
      </div>
    </>
  );
};

export default Menu;