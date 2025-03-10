"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth } from "../../db/firebase";
import {useAuth} from "../../context/authContext";
import { signOut } from "firebase/auth";
import SideNav from '../../(barangay-side)/components/bMenu';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import "@/CSS/Components/menu.css";

const Menu = () => {
  const {user, loading} = useAuth();
  const router = useRouter();
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

  const documentRoutes: Record<string, string> = {
    "Barangay Clearance": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayCertificateIndigencyClearance",
    "Barangay Indigency": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayCertificateIndigencyClearance",
    "Barangay ID": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayID",
    "First Time Jobseeker": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/FirstTimeJobseeker",
    "Barangay Certificate": "/ResidentAccount/Transactions/DocumentRequestTransactions/Documents/BarangayCertificateIndigencyClearance",
    "Barangay Permit": "/ResidentAccount/Transactions/DocumentRequest/Permit",
};

const barangayPermitRoutes: Record<string, string> = {
    "Business Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/Temporary-BusinessPermit(new&renewal)",
    "Temporary Business Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/Temporary-BusinessPermit(new&renewal)",
    "Construction Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/ConstructionPermit",
    "Liquor Permit": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/LiquorPermit",
    "COOP": "/ResidentAccount/Transactions/DocumentRequestTransactions/Permits/COOP",
};

  const messages = [
    { id: 1, text: "Online Incident Report is being reviewed. Wait for an update from the barangay official.", status: "unread", type: "Online Incident", Details: "Robbery Incident", Purpose: "N/A"},
    { id: 2, text: "Barangay Clearance document request is being processed. SMS sent.", status: "read", type: "Document Request", Details: "Barangay Clearance", Purpose: "Loan"},
    { id: 3, text: "Barangay Indigency document request is being processed. SMS sent.", status: "unread", type: "Document Request", Details: "Barangay Indigency", Purpose: "No Income"},
    { id: 4, text: "Barangay ID document request is being processed. SMS sent.", status: "unread", type: "Document Request", Details: "Barangay ID", Purpose: "N/A"},
    { id: 5, text: "Barangay Permit document request is being processed. SMS sent.", status: "read" , type: "Document Request", Details: "Barangay Permit", Purpose: "Business Permit"},
    { id: 6, text: "Barangay Certificate request is being processed. SMS sent.", status: "unread" , type: "Document Request", Details: "Barangay Certificate", Purpose: "Death Residency"},
    { id: 7, text: "First Time Jobseeker request is being processed. SMS sent.", status: "read" , type: "Document Request", Details: "First Time Jobseeker", Purpose: "N/A"},
  ];

  const handleNotificationClick = (transaction: { Type: string; Details: string; Purpose: string }) => {
    if (transaction.Type === "Online Incident") {
      router.push("/ResidentAccount/Transactions/IncidentTransactions");
  } else if (transaction.Type === "Document Request") {
      const encodedDetails = encodeURIComponent(transaction.Details);
      const encodedPurpose = encodeURIComponent(transaction.Purpose);

      if (transaction.Details === "Barangay Permit") {
          const permitRoute = barangayPermitRoutes[transaction.Purpose] || "/ResidentAccount/Transactions/DocumentRequestTransactions/Permit/General";
          router.push(`${permitRoute}?details=${encodedDetails}&purpose=${encodedPurpose}`);
      } else {
          router.push(`${documentRoutes[transaction.Details] || "/ResidentAccount/Transactions/DocumentRequestTransactions"}?details=${encodedDetails}&purpose=${encodedPurpose}`);
      }
  }
};

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
              
                <div className="menu-section-container">
                  <p className="dropdown-item">Services</p>
                  <img src="/images/down-arrow.png" className="dropdown-icon"/>
                </div>
    
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
                <div className="menu-section-container">
                  <p className="dropdown-item">Officials</p>
                  <img src="/images/down-arrow.png" className="dropdown-icon"/>
                </div>
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
                            <div
                              className="notification-item"
                              key={message.id}
                              onClick={() =>
                                handleNotificationClick({
                                  Type: message.type,
                                  Details: message.Details,
                                  Purpose: message.Purpose,
                                })
                              }
                            >
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
                      href={"/ResidentAccount/Profile"}
                    >
                      <p className="dropdown-item">Profile</p>
                    </Link>

                    <Link
                      href={"/ResidentAccount/Transactions"}
                    >
                      <p className="dropdown-item">Transactions</p>
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