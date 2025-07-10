"use client";

import "@/CSS/barangaySide/topMenu.css";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "../../db/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, getDoc, deleteDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";


type BarangayNotification = {
  id: string;
  reportID?: string;
  recipientRole: string;
  message: string;
  status: "read" | "unread";
  timestamp?: any;
  transactionType: string;
  incidentID: string;
  isRead?: boolean;
  requestID: string;
  department: string;
  accID: string;
};

interface User {
  name: string;
  role: string;
  position: string;
  profileImage?: string;
}


export default function TopMenu() {
  const [notifications, setNotifications] = useState<BarangayNotification[]>([]);
  const [tasks, setTasks] = useState<BarangayNotification[]>([]);
  const [filter, setFilter] = useState("all");
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPosition = session?.user?.position;
  const currentUser: User = {
    name: session?.user?.fullName || "User",
    role: session?.user?.position || session?.user?.role || "User",
    position: session?.user?.position || "User",
    profileImage: session?.user?.profileImage,
  };
  

  const router = useRouter();

  useEffect(() => {
    console.log("Session Data:", session);
  }, [session]);



  const filterValidNotifications = async (notifications: BarangayNotification[]) => {
    return Promise.all(notifications.map(async notif => {
      try {
        if (notif.incidentID) {
          const incidentSnap = await getDoc(doc(db, "IncidentReports", notif.incidentID));
          if (!incidentSnap.exists()) return null;
        }
        if (notif.requestID) {
          const requestSnap = await getDoc(doc(db, "ServiceRequests", notif.requestID));
          if (!requestSnap.exists()) return null;
        }
        return notif;
      } catch (err) {
        console.error("Error checking related doc:", err);
        return null;
      }
    }))
    .then(results => results.filter((notif): notif is BarangayNotification => notif !== null));
  };
  
  

  useEffect(() => {
    if (session && session?.user?.id && userPosition) {
      console.log("Fetching notifications for user:", userPosition, "and id:", session?.user?.id);
  
      const qRole = query(
        collection(db, "BarangayNotifications"),
        where("recipientRole", "==", userPosition),
        orderBy("timestamp", "desc")
      );
  
      const qRespondent = query(
        collection(db, "BarangayNotifications"),
        where("respondentID", "==", session?.user?.id),
        orderBy("timestamp", "desc")
      );
  
      const unsubRole = onSnapshot(qRole, async (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BarangayNotification[];
  
        const filtered = await filterValidNotifications(notifications);
        setNotifications(prev => {
          const merged = [...prev, ...filtered];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
        });
      });
  
      const unsubRespondent = onSnapshot(qRespondent, async (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BarangayNotification[];
  
        const filtered = await filterValidNotifications(notifications);
  
        // Set specifically to tasks
        setTasks(filtered.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds));
  
        // Still also merge into global notifications
        setNotifications(prev => {
          const merged = [...prev, ...filtered];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
        });
      });
  
      return () => {
        unsubRole();
        unsubRespondent();
      };
    }
  }, [session]);

  const handleNotificationClick = async (notification: BarangayNotification) => {
    if (!notification.isRead) {
      try {
        const notificationRef = doc(db, "BarangayNotifications", notification.id);
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

    if (notification.transactionType === "Online Assigned Incident" || notification.transactionType === "Online Incident"   ) {
      router.push(`/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${notification.incidentID}`);
    } else if ( notification.transactionType === "Assigned Incident") {
      router.push(`/dashboard/IncidentModule/EditIncident?id=${notification.incidentID}`);
    } else if ( notification.transactionType === "Resident Registration") {
      router.push(`/dashboard/admin/viewResidentUser?id=${notification.accID}`);
    }
  };

  const unreadCount = notifications.filter((msg) => msg.isRead === false).length;
  const filteredMessages =
  filter === "all"
    ? notifications
    : filter === "false"
    ? notifications.filter((msg) => !msg.isRead)
    : filter === "tasks"
    ? tasks
    : filter === "department"
    ? notifications.filter((msg) => msg.department === session?.user?.department)
    : filter === "users"
    ? notifications.filter((msg) => msg.transactionType === "Resident Registration")
    : notifications;
    const pathname = usePathname();

  const toggleNotificationSection = () => {
    setNotificationOpen((prev) => !prev);
    setDropdownOpen(false); // Close the user dropdown if it's open
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
    setNotificationOpen(false); // Close the notifications dropdown if it's open
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


const handleDeleteNotification = async (id: string) => {
  try {
    await deleteDoc(doc(db, "BarangayNotifications", id));
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    console.log("Notification deleted successfully!");
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};


  return (
    <div className="main-containerB">
      <div className="user-container">


        <div className="dropdown-Container">

          <div className="dropdown-Container-no-hover-notifications-brgy">
            <p
              id="inbox-link"
              onClick={toggleNotificationSection}
              className="inbox-container-brgy"
            >
              <img src="/images/inbox.png" alt="Inbox Icon" className="header-inboxicon-brgyside" />
              {unreadCount > 0 && <span className="notification-badge-brgyside">{unreadCount}</span>}
            </p>
          </div>

          {isNotificationOpen && (
            <div className="notification-section-brgyside" ref={notificationRef}>
              <div className="top-section-brgyside">
                <p className="notification-title-brgyside">Notification Inbox</p>
                <div className="filter-container-brgy">
                  <button
                    className={`filter-option-brgy ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`filter-option-brgy ${filter === "false" ? "active" : ""}`}
                    onClick={() => setFilter("false")}
                  >
                    Unread
                  </button>
                  <button
                    className={`filter-option ${filter === "tasks" ? "active" : ""}`}
                    onClick={() => setFilter("tasks")}
                  >
                    Tasks
                  </button>
                  {userPosition === "Admin Staff" || userPosition === "LF Staff" && (
                  <button
                    className={`filter-option ${filter === "department" ? "active" : ""}`}
                    onClick={() => setFilter("department")}
                  >
                    Department
                  </button>
                  )}                  
                  {userPosition === "Assistant Secretary" && (
                    <button
                      className={`filter-option-brgy ${filter === "users" ? "active" : ""}`}
                      onClick={() => setFilter("users")}
                    >
                      Users
                    </button>
                  )}
                </div>
              </div>
              <div className="bottom-section-brg">
                <div className="notification-content-brgyside">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div
                        className="notification-item-brgyside"
                        key={message.id}
                        onClick={() => handleNotificationClick(message)}
                      >
                        <div className="message-section-brgy">
                          <p>{message.message}</p>
                        </div>
                        <div className="unread-icon-section-brgy">
                          {message.isRead === false && (
                            <img
                              src="/images/unread-icon.png"
                              alt="Unread Icon"
                              className="unread-icon"
                            />
                          )}
                        </div>

                          
                        <div className="delete-icon-section-brgy">
                              <button className="delete-btn-brgy" onClick={(e) => { e.stopPropagation(); handleDeleteNotification(message.id); }}>
                                <img src="/images/Delete.png" alt="Delete" className="delete-icon-image-brgy" />
                              </button>
                        </div>
                          
                      </div>
                    ))
                  ) : (
                     <div className="no-messages-container">
                      <p>No messages found</p>
                    </div>

                  )}
                </div>
              </div>
            </div>
          )}
        </div>

       
        <section className="icon-section">
            {currentUser?.profileImage ? (
              <img src={currentUser.profileImage} alt="User Icon" className="header-usericon" />
            ) : (
              <img src="/images/user.png" alt="Default User" className="header-usericon" />
            )}
          </section>

       
        <section className="user-section">
          <h1>{currentUser.name}</h1>
          <p>{currentUser.role}</p>
        </section>

        <section className="menu-section" ref={dropdownRef}>
          <img
            src="/images/down-arrow.png"
            alt="Menu Icon"
            className="menuIcon"
            onClick={toggleDropdown}
          />
         {isDropdownOpen && (
          <div className="dropdown show">
            <ul>
              <li
                className="options-topmenu"
                onClick={() => {
                  setDropdownOpen(false); // CLOSE THE DROPDOWN
                  router.push(`/dashboard/settingsPage?id=${session?.user?.id}`);
                }}
              >
                Settings
              </li>
              <li
                className="options-topmenu"
                onClick={() => {
                  setDropdownOpen(false); // CLOSE THE DROPDOWN
                  signOut({ callbackUrl: "/" });
                }}
              >
                Log Out
              </li>
            </ul>
          </div>
        )}

        </section>
      </div>
    </div>
  );
}
