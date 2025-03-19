"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth, db } from "../../db/firebase";
import {useAuth} from "../../context/authContext";
import { signOut } from "firebase/auth";
import SideNav from '../../(barangay-side)/components/bMenu';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore"; // Firestore functions
import "@/CSS/Components/menu.css";
import { Timestamp } from "firebase-admin/firestore";


type Notification = {
  id: string;
  reportID?: string;
  residentID: string;
  message: string;
  status: "read" | "unread";
  timestamp?: Timestamp; 
  transactionType: string;
  incidentID: string;
  isRead?: boolean;
};

const Menu = () => {
  const {user, loading} = useAuth();
  const router = useRouter();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
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

  // Fetch Notifications for the logged-in user in real time
  useEffect(() => {
    if (user) {
      console.log("Fetching notifications for user:", user.uid);

      const q = query(collection(db, "Notifications"), where("residentID", "==", user.uid));
  
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications: Notification[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[]; // Explicitly cast to Notification[]
        setNotifications(fetchedNotifications);
      });
  
      return () => unsubscribe();
    }
  }, [user]);
  

  const handleNotificationClick = async (notification: any) => {
    console.log("Notification clicked:", notification);
  
    if (!notification.isRead) {
      await updateDoc(doc(db, "Notifications", notification.id), { isRead: true });
    }
  
    const targetUrl = `/ResidentAccount/Transactions/IncidentTransactions?id=${notification.incidentID}`;
    console.log("Navigating to:", targetUrl); // Log the URL before navigating
  
    router.push(targetUrl);  
  
    console.log("Navigation attempted"); // Check if this runs
  };
  
  
  

  const unreadCount = notifications.filter((msg) => msg.status === "unread").length;
  const filteredMessages = filter === "all" ? notifications : notifications.filter((msg) => msg.status === "unread");

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
                    <p id="inbox-link" onClick={toggleNotificationSection} className="inbox-container">
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
                                onClick={() => handleNotificationClick(message)}
                              >
                                <div className="message-section">
                                  <p>{message.message}</p>
                                </div>
                                <div className="unread-icon-section">
                                  {message.status === "unread" && (
                                    <img src="/images/unread-icon.png" alt="Unread Icon" className="unread-icon" />
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
                    <Link href={`/ResidentAccount/Profile?id=${user?.uid}`}>
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