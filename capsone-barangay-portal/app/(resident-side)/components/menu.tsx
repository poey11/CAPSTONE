"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth } from "../../db/firebase";
import {useAuth} from "../../context/authContext";
import { signOut } from "firebase/auth";
import SideNav from '../../(barangay-side)/components/bMenu';
import Link from 'next/link';
import "@/CSS/Components/menu.css";

const Menu = () => {
  const {user, loading} = useAuth();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  
  const handleLogout = async() => {
    await signOut(auth);
  }

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
              <div className="dropdown-Container">
              <Link href="/">
                <p className="dropdown-item" onClick={toggleLoginOptionsOff}>Home</p>
              </Link>
                
              </div>
            </div>

          

            <div className="navbar-indiv-container">
              <div className="dropdown-Container">
              <Link href="/aboutus">
                <p className="dropdown-item" onClick={toggleLoginOptionsOff}>About Us</p>
              </Link>
                
              </div>
            </div>

 
            <div className="dropdown-Container">
              
                <p className="dropdown-item">Services</p>
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
            

              <div className="navbar-indiv-container">
              <div className="dropdown-Container">
              <Link href="/Announcements">
                <p className="dropdown-item" onClick={toggleLoginOptionsOff}>News</p>
              </Link>
                
              </div>
            </div>

              <div className="dropdown-Container">
              <p className="dropdown-item">Officials</p>
              <div className="Dropdown">
                <Link href="/OfficialsPage">
                  <p className="dropdown-item">Barangay Officials</p>
                </Link>
                <Link href="/OfficialsPage/HOAOfficersPage">
                  <p className="dropdown-item">HOA Officers</p>
                </Link>
                <Link href="/OfficialsPage/SitioOfficersPage">
                  <p className="dropdown-item">Sitio Officers</p>
                </Link>
              </div>
            </div>


            {!loading && user ? (
              <div className="dropdown-Container">
                <div className="dropdown-item" ref={loginMenuRef}>
                    <p
                    id="profile-link"
                    onClick={toggleLoginOptions}
                  >
                    <img src="/images/user.png" alt="User Icon" className="header-usericon" />
                  </p>
                  
                  <div className="Dropdown">
                    <Link
                      href={"/ResidentAccount/Profile"}
                    >
                      <p className="dropdown-item">Profile</p>
                    </Link>

                    <Link
                      href={"/"}
                      onClick={handleLogout}
                    >
                      <p className="dropdown-item">Logout</p>
                    </Link>

                  </div>
                </div>
              </div>
          ):(

            <div className="dropdown-Container">
              <div className="dropdown-item" ref={loginMenuRef}>
                <p
                  id="login-link"
                  className="dropdown-item"
                >
                  Login
                </p>

                  <div className="Dropdown">
                      <Link
                        //href="/official"
                        href="/official/login"
                      >
                        <p className="dropdown-item">Login For Officials</p>
                      </Link>
                      <Link
                        //href="/resident"
                        href="/resident/login"
                      >
                        <p className="dropdown-item">Login For Residents</p>
                      </Link>
                      <Link
                        href="/register"
                      >
                        <p className="dropdown-item">Register</p>
                      </Link> 
                  </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;