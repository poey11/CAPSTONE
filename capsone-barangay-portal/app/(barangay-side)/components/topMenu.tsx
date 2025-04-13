"use client";

import "@/CSS/barangaySide/topMenu.css";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "../../db/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from "firebase/firestore";
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
};

interface User {
  name: string;
  role: string;
  position: string;
  profileImage?: string;
}


export default function TopMenu() {
  const [notifications, setNotifications] = useState<BarangayNotification[]>([]);
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

  useEffect(() => {
    if (session) {
      console.log("Fetching notifications for user:", userPosition);

      const q = query(
        collection(db, "BarangayNotifications"),
        where("recipientRole", "==", userPosition)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications: BarangayNotification[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BarangayNotification[]; // Explicitly cast to Notification[]
        setNotifications(fetchedNotifications);
      });

      return () => unsubscribe();
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

    if (notification.transactionType === "Online Incident") {
      router.push(`/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${notification.incidentID}`);
    }
  };

  const unreadCount = notifications.filter((msg) => msg.isRead === false).length;
  const filteredMessages = filter === "all"
  ? notifications
  : notifications.filter((msg) => !msg.isRead);

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

  return (
    <div className="main-containerB">
      <div className="user-container">
        <div className="dropdown-Container">
          <div className="dropdown-item">
            <p
              id="inbox-link"
              onClick={toggleNotificationSection}
              className="inbox-container"
            >
              <img src="/images/inbox.png" alt="Inbox Icon" className="header-inboxicon-brgyside" />
              {unreadCount > 0 && <span className="notification-badge-brgyside">{unreadCount}</span>}
            </p>
          </div>
          {isNotificationOpen && (
            <div className="notification-section-brgyside" ref={notificationRef}>
              <div className="top-section-brgyside">
                <p className="notification-title-brgyside">Notification Inbox</p>
                <div className="filter-container">
                  <button
                    className={`filter-option ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`filter-option ${filter === "false" ? "active" : ""}`}
                    onClick={() => setFilter("false")}
                  >
                    Unread
                  </button>
                </div>
              </div>
              <div className="bottom-section">
                <div className="notification-content-brgyside">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div
                        className="notification-item-brgyside"
                        key={message.id}
                        onClick={() => handleNotificationClick(message)}
                      >
                        <div className="message-section">
                          <p>{message.message}</p>
                        </div>
                        <div className="unread-icon-section">
                          {message.isRead === false && (
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
                <li className="options-topmenu" onClick={() => router.push(`/dashboard/settingsPage?id=${session?.user?.id}`)}>
                  Settings
                </li>
                <li onClick={() => signOut({ callbackUrl: "/" })} className="options-topmenu">
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
