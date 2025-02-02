"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SideNav from '../../(barangay-side)/components/bMenu';
//import TopMenu from '../../(barangay-side)/components/topMenu';
import Link from 'next/link';
import "@/CSS/Components/menu.css";

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
            
            <div className="navbar-indiv-container dropdown-Container">
              
                <p className="hover:text-[white] cursor-pointer">Services</p>
                <div className="Dropdown">
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

            <div className="navbar-indiv-container dropdown-Container">
              
                <p className="hover:text-[white] cursor-pointer">Officials</p>
                <div className="Dropdown">
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
                      //href="/official"
                      href="/official/login"

                      onClick={toggleLoginOptions}
                      className="dropdown-item"
                    >
                      Login For Official
                    </Link>
                    <Link
                      //href="/resident"
                      href="/resident/login"
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
      </div>
    </>
  );
};

export default Menu;