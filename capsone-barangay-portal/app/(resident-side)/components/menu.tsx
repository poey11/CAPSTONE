"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams} from "next/navigation";
import { auth, db } from "../../db/firebase";
import {useAuth} from "../../context/authContext";
import { signOut } from "firebase/auth";
import SideNav from '../../(barangay-side)/components/bMenu';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc, getDoc, orderBy } from "firebase/firestore"; // Firestore functions
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


interface Resident {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sex: string;
  status: string;
  userIcon: string;
}

const Menu = () => {
  const searchParams = useSearchParams();
  const residentId = searchParams.get("id");
  const {user, loading} = useAuth();
  const router = useRouter();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userIcon, setUserIcon] = useState<string | undefined>(undefined);
  const db = getFirestore();

  const [resident, setResident] = useState<Resident | null>(null);
  
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

  useEffect(() => {
    const fetchResidentData = async () => {
      if (user?.uid) {
        const userDocRef = doc(db, "ResidentUsers", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          console.log("Resident data fetched:", data);
          setResident(data as Resident);
        } else {
          console.log("No resident found in Firestore!");
        }
      }
    };
  
    fetchResidentData();
  }, [user]);
  
  

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

      const q = query(
        collection(db, "Notifications"),
        where("residentID", "==", user.uid)
      );  
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
  

  const handleNotificationClick = async (notification: Notification) => {
    console.log("Notification clicked:", notification);
  
    // Check if the notification is unread
    if (!notification.isRead) {
      try {
        const notificationRef = doc(db, "Notifications", notification.id);
        await updateDoc(notificationRef, { isRead: true });
  
        // Update UI directly for a smoother experience
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif.id === notification.id ? { ...notif, isRead: true } : notif
          )
        );
        console.log("Notification marked as read!");
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  
    if (notification.transactionType === "Online Incident") {
      const targetUrl = `/ResidentAccount/Transactions/IncidentTransactions?id=${notification.incidentID}`;
      router.push(targetUrl);
    } else {
      console.log("Transaction is not an Online Incident. No navigation performed.");
    }

    if (
      notification.transactionType === "Verification" &&
      notification.message?.toLowerCase().includes("update")
    ) {
      router.push(`/ResidentAccount/Profile?id=${user?.uid}#resubmit-section`);

    }

  };
  
  
  
  

  const unreadCount = notifications.filter((msg) => msg.isRead === false).length;
  const filteredMessages = filter === "all"
  ? notifications
  : notifications.filter((msg) => !msg.isRead);

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
                <p className="dropdown-item-resident" onClick={toggleLoginOptionsOff}>Home</p>
              </Link>
                
              </div>
            </div>

          

            <div className="navbar-indiv-container">
              <div className="dropdown-Container">
              <Link href="/aboutus">
                <p className="dropdown-item-resident" onClick={toggleLoginOptionsOff}>About Us</p>
              </Link>
                
              </div>
            </div>

 
            <div className="dropdown-Container">
              
                <div className="menu-section-container">
                  <p className="dropdown-item-resident">Services</p>
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
                <p className="dropdown-item-resident" onClick={toggleLoginOptionsOff}>News</p>
              </Link>
                
              </div>
            </div>

              <div className="dropdown-Container">
                <div className="menu-section-container">
                  <p className="dropdown-item-resident">Officials</p>
                  <img src="/images/down-arrow.png" className="dropdown-icon"/>
                </div>
              <div className="Dropdown">
                <Link href="/OfficialsPage">
                  <p className="dropdown-item-resident">Barangay Officials</p>
                </Link>
                <Link href="/OfficialsPage/HOAOfficersPage">
                  <p className="dropdown-item-resident">HOA Officers</p>
                </Link>
                <Link href="/OfficialsPage/SitioOfficersPage">
                  <p className="dropdown-item-resident">Sitio Officers</p>
                </Link>
              </div>
            </div>


            {!loading && user ? (
              <div className="logged-in-container">
                <div className="dropdown-Container">
                  <div className="dropdown-item-no-hover">
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
                                {message.isRead === false && (
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
                <div className="dropdown-item-no-hover" ref={loginMenuRef}>
                  <p
                    id="profile-link"
                    onClick={toggleLoginOptions}
                  >
                    {/*<img src={userIcon} alt="User Icon" className="header-usericon" />*/}

                    {resident?.userIcon ? (
                                        <img src={resident.userIcon} alt="User Icon" className="header-usericon" />
                                    ) : (
                                        <img src="/images/user.png" alt="Default User" className="header-usericon" />
                                    )}
                  </p>
                  
                  <div className="Dropdown">
                    <Link href={`/ResidentAccount/Profile?id=${user?.uid}`}>
                      <p className="dropdown-item-resident">Profile</p>
                    </Link>

                    <Link
                      href={"/ResidentAccount/Transactions"}
                    >
                      <p className="dropdown-item-resident">Transactions</p>
                    </Link>


                    <Link
                      href={"/"}
                      onClick={handleLogout}
                    >
                      <p className="dropdown-item-resident">Logout</p>
                    </Link>

                  </div>
                </div>
              </div>
            </div>
          ):(

            <div className="dropdown-Container">
              <div className="menu-section-container" ref={loginMenuRef}>
                <p
                  id="login-link"
                  className="dropdown-item"
                >
                  Login
                </p>

                  <div className="Dropdown">
                      <Link
                        //href="/resident"
                        href="/resident/login"
                      >
                        <p className="dropdown-item">Log In</p>
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