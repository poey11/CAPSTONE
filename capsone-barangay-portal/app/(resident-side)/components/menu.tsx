"use client"
import { useState, useEffect, useRef } from "react";
import { usePathname} from "next/navigation";
import { auth, db } from "../../db/firebase";
import {useAuth} from "../../context/authContext";
import { signOut } from "firebase/auth";
import SideNav from '../../(barangay-side)/components/bMenu';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc, getDoc, orderBy, deleteDoc } from "firebase/firestore"; // Firestore functions
import "@/CSS/Components/menu.css";
import { Timestamp } from "firebase-admin/firestore"; // NOTE: in client components this usually should come from "firebase/firestore"

type Notification = {
  id: string;
  reportID?: string;
  residentID: string;
  message: string;
  status: "read" | "unread";
  timestamp?: Timestamp; 
  transactionType: string;
  incidentID: string;
  requestID: string;
  isRead?: boolean;
  programId: string;
  participantID: string;
};

interface Resident {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sex: string;
  status: string;
  userIcon: string;
  residentId: string;
}

const Menu = () => {
  const {user, loading} = useAuth();
  const router = useRouter();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userIcon, setUserIcon] = useState<string | undefined>(undefined);
  const db = getFirestore();
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const menuRef = useRef(null);

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
      if (!user?.uid) return;
  
      const userRef = doc(db, "ResidentUsers", user.uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) return;
  
      const data = userSnap.data();
      if (!data) return;
  
      console.log("Resident data fetched:", data);
      setResident(data as Resident);
  
      if (data.status === "Rejected") {
        try {
          // Delete the document from Firestore
          await deleteDoc(userRef);
          console.log("Resident document deleted.");
  
          // Delete user from Firebase Auth
          if (auth.currentUser) {
            await auth.currentUser.delete();
            console.log("Firebase Auth user deleted.");
          }
  
          await signOut(auth);

        } catch (err) {
          console.error("Error during account deletion:", err);
          alert("An error occurred while deleting your account.");
        }
      }
    };
  
    fetchResidentData();
  }, [user]);
  
  
  

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "incident" | "document">("all");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inboxIconRef = useRef<HTMLDivElement | null>(null);
  const toggleNotificationSection = () => setIsOpen((prev) => !prev);


  /*
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  */

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      inboxIconRef.current &&
      !inboxIconRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  

  const filterValidNotifications = async (notifications: Notification[]) => {
    return Promise.all(
      notifications.map(async (notif) => {
        try {
          if (notif.isRead) {
            // Check if the linked document still exists before keeping read notifications
            if (notif.incidentID) {
              const incidentSnap = await getDoc(doc(db, "IncidentReports", notif.incidentID));
              if (!incidentSnap.exists()) return null;
  
              const incidentData = incidentSnap.data();
              if (
                incidentData.status === "settled" ||
                incidentData.status === "archived" ||
                incidentData.status === "CFA" ||
                incidentData.status === "Settled"
              ) {
                return null;
              }
            }
  
            if (notif.requestID) {
              const requestSnap = await getDoc(doc(db, "ServiceRequests", notif.requestID));
              if (!requestSnap.exists()) return null;
  
              const requestData = requestSnap.data();
              if (
                requestData.status === "Completed" ||
                requestData.status === "Rejected"
              ) {
                return null;
              }
            }
          }
  
          return notif;
        } catch (err) {
          console.error("Error validating resident notification:", err);
          return null;
        }
      })
    ).then((results) =>
      results.filter((notif): notif is Notification => notif !== null)
    );
  };
  

  // Fetch Notifications for the logged-in user in real time
  useEffect(() => {
    if (user && resident) {
      console.log("Fetching notifications for user:", user.uid, "and resident:", resident.residentId);
  
      const validIds = [user.uid, resident.residentId].filter(Boolean);
  
      if (validIds.length === 0) return;
  
      const q = query(
        collection(db, "Notifications"),
        where("residentID", "in", validIds),
        orderBy("timestamp", "desc")
      );
  
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
  
        const filtered = await filterValidNotifications(notifications);
        setNotifications(filtered);
      });
  
      return () => unsubscribe();
    }
  }, [user, resident]);
  
  

  
  

  const unreadCount = notifications.filter((msg) => msg.isRead === false).length;
const filteredMessages = notifications.filter((msg) => {
  switch (filter) {
    case "unread":
      return !msg.isRead;
    case "incident":
      return msg.transactionType.toLowerCase().includes("incident");
case "document":
  return msg.transactionType.toLowerCase().includes("document") || 
         msg.transactionType.toLowerCase().includes("service") || 
         msg.message.toLowerCase().includes("document request") || 
         msg.message.toLowerCase().includes("appointment");

    default:
      return true;
  }
});


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

const handleNotificationClick = async (notification: Notification) => {
  console.log("Notification clicked:", notification);

  setIsOpen(false);

  // Mark as read if unread
  if (!notification.isRead) {
    try {
      const notificationRef = doc(db, "Notifications", notification.id);
      await updateDoc(notificationRef, { isRead: true });

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
  // Navigation logic
  const type = notification.transactionType;

  // if (type === "Online Incident") {
  //   router.push(`/ResidentAccount/Transactions/IncidentTransactions?id=${notification.incidentID}`);
  // } 
  // else if (type === "Online Request" || type === "Online Service Request") {
  //   router.push(`/ResidentAccount/Transactions/DocumentTransactions?id=${notification.requestID}`);
  // }
  // else if (type === "Verification") {
  //   router.push(`/ResidentAccount/Profile?id=${user?.uid}`);
  // }
  // else {
  //   console.log("No navigation triggered for this notification type.");
  // }
  if(notification.requestID){
    router.push(`/ResidentAccount/Transactions/TransactionRouter?id=${notification.requestID}&type=ServiceRequest`);
  }
  else if (type === "Verification") {
    router.push(`/ResidentAccount/Profile?id=${user?.uid}`);
  }
  else if (type === "Program Registration") {
    router.push(`/Programs/${notification?.programId}`);
  }  
  else {
    console.log("No navigation triggered for this notification type.");
  }

};


const handleDeleteNotification = async (notificationId: string) => {
  try {
    await deleteDoc(doc(db, "Notifications", notificationId));
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    console.log("Notification deleted successfully");
  } catch (err) {
    console.error("Error deleting notification:", err);
    alert("Failed to delete notification");
  }
};

  // ========= BOT: Messenger-style chat additions =========

  // chat types & state
  type ChatMsg = { id: string; role: "user" | "bot"; text: string; ts: number };

  const [botOpen, setBotOpen] = useState(false);          // reuse as chat visibility
  const [botInput, setBotInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [botTyping, setBotTyping] = useState(false);

  // stable session id for Dialogflow context
  const sessionId =
    (user?.uid ?? "") ||
    ("guest-" +
      (typeof window !== "undefined"
        ? window.navigator.userAgent.replace(/\W+/g, "").slice(0, 16)
        : "web"));

  // auto-scroll ref for chat body
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chat, botTyping]);

  // helper to push messages
  function pushMsg(role: "user" | "bot", text: string) {
    setChat((prev) => [...prev, { id: Math.random().toString(36).slice(2), role, text, ts: Date.now() }]);
  }

  // optional: greet when chat opens
  useEffect(() => {
    if (botOpen && chat.length === 0) {
      pushMsg("bot", "Hi! I can help with Services (request documents, file incidents), Programs, News, and Tracking.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botOpen]);

  // call your /api/dialogflow and manage bubbles
  async function sendToBot(message: string) {
    if (!message.trim()) return;
    pushMsg("user", message);
    setBotInput("");
    setBotTyping(true);
    try {
      const res = await fetch("/api/dialogflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, sessionId }),
      });
      const data = await res.json();

      let reply =
        data?.queryResult?.responseMessages?.find((m: any) => m.text)?.text?.text?.[0] ??
        data?.queryResult?.text ??
        data?.error ??
        "No response.";

      if (typeof reply !== "string") reply = JSON.stringify(reply, null, 2);
      pushMsg("bot", reply);
    } catch (e: any) {
      pushMsg("bot", "⚠️ " + (e?.message ?? "Network error"));
    } finally {
      setBotTyping(false);
    }
  }

  // ======================================================

  /* responsive */
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
   const [mobileOpen, setMobileOpen] = useState(false);
   const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
    const [officialsDropdownOpen, setOfficialsDropdownOpen] = useState(false);

    const [servicesOpen, setServicesOpen] = useState(false);
    const [officialsOpen, setOfficialsOpen] = useState(false);

    useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
      setMobileOpen(false);
    }
  };

  if (mobileOpen) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [mobileOpen]);

  return (
<>
  {/* Add new links as we go */}
  <div className="navbar-container">
    <div className="navbar-card">
      <Link href="/">
        <img src="/Images/updatedlogo.png" alt="Barangay Logo" className="header-brgylogo" />
      </Link>

      {/* ====== DESKTOP NAV LINKS ====== */}
      <div className="navbar-links hidden lg:flex">
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

        <div className="dropdown-Container"
          onMouseEnter={() => setServicesDropdownOpen(true)}
          onMouseLeave={() => setServicesDropdownOpen(false)}
        >
          
          <div className="menu-section-container" onClick={() => setServicesDropdownOpen(prev => !prev)}>
            <p className="dropdown-item-resident">Services</p>
            <img src="/Images/down-arrow.png" className="dropdown-icon" />
          </div>

          {servicesDropdownOpen && (
            <div className="Dropdown-services"> {/* CHANGE HERE */}
              <Link href="/services"><p>Request Documents</p></Link>
              <Link href="/IncidentReport"><p>File an Incident</p></Link>
            </div>
          )}
        </div>

        <div className="navbar-indiv-container">
            <div className="dropdown-Container">
              <Link href="/Programs">
                <p className="dropdown-item-resident" onClick={toggleLoginOptionsOff}>Programs</p>
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
        

        
          <div className="dropdown-Container"
            onMouseEnter={() => setOfficialsDropdownOpen(true)}
            onMouseLeave={() => setOfficialsDropdownOpen(false)}
          >
            <div className="menu-section-container" onClick={() => setOfficialsDropdownOpen(prev => !prev)}>
              <p className="dropdown-item-resident">Officials</p>
              <img src="/Images/down-arrow.png" className="dropdown-icon" />
            </div>

            {officialsDropdownOpen && (
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
            )}
          </div>
        
      </div>
      

      {/* CHANGE HERE */}
     <div className="navbar-icons-wrapper hidden md:flex" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* FOR NOTIFICATIONS */}
        {!loading && user ? (
          <>
            <div className="dropdown-Container-notifications">
              <div className="dropdown-item-no-hover-notifications" ref={inboxIconRef} >
                <p id="inbox-link" onClick={toggleNotificationSection} className="inbox-container">
                  <img src="/Images/inbox.png" alt="Inbox Icon" className="header-inboxicon" />
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
                      <button className={`filter-option ${filter === "incident" ? "active" : ""}`} onClick={() => setFilter("incident")}>Incident</button>
                      <button className={`filter-option ${filter === "document" ? "active" : ""}`} onClick={() => setFilter("document")}>Documents</button>
                    </div>
                  </div>
                  <div className="bottom-section">
                    <div className="notification-content">
                      {filteredMessages.length > 0 ? (
                        filteredMessages.map((message) => (
                          <div className="notification-item" key={message.id} onClick={() => handleNotificationClick(message)}>
                            <div className="message-section">
                              <p>{message.message}</p>
                            </div>
                            <div className="unread-icon-section">
                              {message.isRead === false && (
                                <img src="/Images/unread-icon.png" alt="Unread Icon" className="unread-icon" />
                              )}
                            </div>
                            <div className="delete-icon-section">
                              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(message.id); }}>
                                <img src="/Images/delete.png" alt="Delete" className="delete-icon-image" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-messages-container-res">
                            <p>No messages found</p>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="dropdown-Container">
              <div className="dropdown-item-no-hover" ref={loginMenuRef} onMouseEnter={() => setIsOpen(false)}>
                <p id="profile-link" onClick={toggleLoginOptions}>
                  {resident?.userIcon ? (
                    <img src={resident.userIcon} alt="User Icon" className="header-usericon" />
                  ) : (
                    <img src="/images/user.png" alt="Default User" className="header-usericon" />
                  )}
                </p>
                {/*
                <div className="Dropdown-profile">
                  <Link href={`/ResidentAccount/Profile?id=${user?.uid}`}>
                    <p className="dropdown-item-resident">Profile</p>
                  </Link>
                  <Link href={"/ResidentAccount/Transactions"}>
                    <p className="dropdown-item-resident">Transactions</p>
                  </Link>
                  <Link href={"/"} onClick={handleLogout}>
                    <p className="dropdown-item-resident">Logout</p>
                  </Link>
                </div>
                */}

                {showLoginOptions && (
                  <div className="Dropdown-profile">
                    <Link href={`/ResidentAccount/Profile?id=${user?.uid}`} onClick={toggleLoginOptionsOff}>
                      <p className="dropdown-item-resident">Profile</p>
                    </Link>
                    <Link href={"/ResidentAccount/Transactions"} onClick={toggleLoginOptionsOff}>
                      <p className="dropdown-item-resident">Transactions</p>
                    </Link>
                    <Link href={"/"} onClick={() => { handleLogout(); toggleLoginOptionsOff(); }}>
                      <p className="dropdown-item-resident">Logout</p>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="dropdown-Container">
            <div className="menu-section-container" ref={loginMenuRef}>
              <p id="login-link" className="dropdown-item-resident" onClick={toggleLoginOptions}>Login</p>
              
              {showLoginOptions && (
                <div className="Dropdown">
                  <Link href="/resident/login" onClick={toggleLoginOptionsOff}><p className="dropdown-item-resident">Log In</p></Link>
                  <Link href="/register" onClick={toggleLoginOptionsOff}><p className="dropdown-item-resident">Register</p></Link>
                </div>
              )}
            </div>
          </div>
        )}





         {/* ====== HAMBURGER BUTTON (only small screens) ====== */}
      
        <div ref={menuRef} className="hamburger-wrapper lg:hidden ml-auto">
          {mobileOpen ? (
            <button
              onClick={() => setMobileOpen(false)}
              className="hamburger-btn"
            >
              <span className="hamburger-icon">×</span>
            </button>
          ) : (
            <button
              onClick={() => setMobileOpen(true)}
              className="hamburger-btn"
            >
              <span className="hamburger-icon">☰</span>
            </button>
          )}
        </div>

        {mobileOpen && (
          <div className="mobile-menu">
            {/* your menu links here */}
          </div>
        )}
      </div>



       
         

    </div>

    {mobileOpen && (
      <div ref={mobileMenuRef} className="mobile-menu-container">
        {/* Home & About */}
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <p className="dropdown-item-resident">Home</p>
        </Link>
        <Link href="/aboutus" onClick={() => setMobileOpen(false)}>
          <p className="dropdown-item-resident">About Us</p>
        </Link>

        {/* Services dropdown */}
        <div className="mobile-dropdown group">
          <button
            className="mobile-dropdown-btn dropdown-item-resident-burgermenu"
            onClick={() => setServicesOpen(!servicesOpen)}
          >
            Services
            <img
              src="/Images/down-arrow.png"
              className={`dropdown-icon-burgermenu ${servicesOpen ? "rotate" : ""}`}
            />
          </button>
          {servicesOpen && (
            <div className="mobile-submenu">
              <Link href="/services" onClick={() => setMobileOpen(false)}>
                <p className="dropdown-item-resident-burgermenu">Request Documents</p>
              </Link>
              <Link href="/IncidentReport" onClick={() => setMobileOpen(false)}>
                <p className="dropdown-item-resident-burgermenu">File an Incident</p>
              </Link>
            </div>
          )}
        </div>

        {/* Programs & News */}
        <Link href="/Programs" onClick={() => setMobileOpen(false)}>
          <p className="dropdown-item-resident">Programs</p>
        </Link>
        <Link href="/Announcements" onClick={() => setMobileOpen(false)}>
          <p className="dropdown-item-resident">News</p>
        </Link>

        {/* Officials dropdown */}
        <div className="mobile-dropdown">
          <button
            className="mobile-dropdown-btn dropdown-item-resident"
            onClick={() => setOfficialsOpen(!officialsOpen)}
          >
            Officials
            <img
              src="/Images/down-arrow.png"
              className={`dropdown-icon-burgermenu ${officialsOpen ? "rotate" : ""}`}
            />
          </button>
          {officialsOpen && (
            <div className="mobile-submenu">
              <Link href="/OfficialsPage" onClick={() => setMobileOpen(false)}>
                <p className="dropdown-item-resident">Barangay Officials</p>
              </Link>
              <Link href="/OfficialsPage/HOAOfficersPage" onClick={() => setMobileOpen(false)}>
                <p className="dropdown-item-resident">HOA Officers</p>
              </Link>
              <Link href="/OfficialsPage/SitioOfficersPage" onClick={() => setMobileOpen(false)}>
                <p className="dropdown-item-resident">Sitio Officers</p>
              </Link>
            </div>
          )}
        </div>

      
      </div>
    )}

  </div>
</>
);
};

export default Menu;
