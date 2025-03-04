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


  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const toggleNotificationSection = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const messages = [
    { id: 1, text: "blablablabalabalababalalabkjdxbakdadnandlakndfewkfjwejfbwkebfowbe;fkjbweljfbwelifbliwehbfliwebhflwekbfwebf;wijbe", status: "unread" },
    { id: 2, text: "Message 2", status: "read" },
    { id: 3, text: "Message 3", status: "unread" },
    { id: 4, text: "Message 4", status: "unread" },
    { id: 5, text: "Message 5", status: "read" },
    { id: 6, text: "Message 6", status: "unread" },
    { id: 7, text: "Message 7", status: "unread" },
    { id: 8, text: "Message 8", status: "read" },
    { id: 9, text: "Message 9", status: "unread" },
    { id: 10, text: "Message 10", status: "unread" },
  ];

  const unreadCount = messages.filter((msg) => msg.status === "unread").length;
  const filteredMessages = filter === "all" ? messages : messages.filter((msg) => msg.status === "unread");

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
            <div className="logged-in-container">  
              <div className="dropdown-Container">
                <div className="dropdown-item">
                  <p
                    id="inbox-link"
                    onClick={toggleNotificationSection}
                    className="inbox-container"
                  >
                    <img src="/images/inbox.png" alt="Inbox Icon" className="header-inboxicon" />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </p>
                </div>
                {isOpen && (
                  <div className="notification-section" ref={dropdownRef}>
                    <div className="top-section">
                      <p className="notification-title">Notification Inbox</p>
                      <div className="filter-container">
                        <button className={`filter-option ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
                        <button className={`filter-option ${filter === "unread" ? "active" : ""}`} onClick={() => setFilter("unread")}>Unread</button>
                      </div>
                    </div>
                    <div className="bottom-section">
                      <div className="notification-content">
                        {filteredMessages.length > 0 ? (
                          filteredMessages.map((message) => (
                            <div className="notification-item" key={message.id}>
                              <div className="message-section">
                                <p>{message.text}</p>
                              </div>
                              <div className="unread-icon-section">
                              
                                {message.status === "unread" && (
                                  <img
                                    src="/images/unread-icon.png"
                                    alt="Unread Icon"
                                    className="unread-icon"
                                  />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p>No messages found</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                      href={"/"}
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