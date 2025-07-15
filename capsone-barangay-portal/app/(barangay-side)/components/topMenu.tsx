"use client";

import "@/CSS/barangaySide/topMenu.css";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "../../db/firebase";
import { 
  collection, query, where, onSnapshot, updateDoc, doc, 
  orderBy, getDoc, deleteDoc, Timestamp 
} from "firebase/firestore";
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
  respondentID: string;
};

interface User {
  name: string;
  role: string;
  position: string;
  profileImage?: string;
  createdAt: Timestamp | string | Date;
}

export default function TopMenu() {
  const [notifications, setNotifications] = useState<BarangayNotification[]>([]);
  const [tasks, setTasks] = useState<BarangayNotification[]>([]);
  const [filter, setFilter] = useState("all");
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [createdDate, setCreatedDate] = useState<Date | null>(null);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPosition = session?.user?.position;

  const router = useRouter();

  useEffect(() => {
    console.log("Session Data:", session);
  }, [session]);

  // 🚀 LOAD REAL createdAt from BarangayUsers collection
  useEffect(() => {
    if (session?.user?.id) {
      const userDocRef = doc(db, "BarangayUsers", session.user.id);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          console.log("Loaded Firestore user data:", userData);

          let cDate = new Date();
          if ((userData.createdAt as any)?.toDate) {
            cDate = (userData.createdAt as any).toDate();
          } else if (typeof userData.createdAt === "string") {
            cDate = new Date(userData.createdAt);
          }

          console.log("Parsed createdDate:", cDate);
          setCreatedDate(cDate);
        }
      });
    }
  }, [session]);

  const filterValidNotifications = async (notifications: BarangayNotification[]) => {
    return Promise.all(notifications.map(async notif => {
      try {
        if (notif.incidentID) {
          const incidentSnap = await getDoc(doc(db, "IncidentReports", notif.incidentID));
          if (!incidentSnap.exists()) return null;
  
          const incidentData = incidentSnap.data();
          if (incidentData.status === "settled" || incidentData.status === "archived" || incidentData.status === "CFA" || incidentData.status === "Settled") {
            return null;
          }
        }
  
        if (notif.requestID) {
          const requestSnap = await getDoc(doc(db, "ServiceRequests", notif.requestID));
          if (!requestSnap.exists()) return null;
  
          const requestData = requestSnap.data();
          if (requestData.status === "Completed" || requestData.status === "Rejected") {
            return null;
          }
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
    if (session && session?.user?.id && userPosition && createdDate) {
      console.log("Fetching notifications for user:", userPosition, "created after:", createdDate);

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
        const afterCreated = filtered.filter(notif => {
          const notifDate = notif.timestamp?.toDate?.() 
            ?? (notif.timestamp instanceof Date ? notif.timestamp : new Date(notif.timestamp));
          console.log("Checking notification:", { notifDate, createdDate, passed: notifDate > createdDate });
          return notifDate > createdDate;
        });

        if (userPosition === "Assistant Secretary" || userPosition === "Admin Staff") {
          setTasks(prev => {
            const merged = [...prev, ...afterCreated];
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            return unique.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
          });
        }

        setNotifications(prev => {
          const merged = [...prev, ...afterCreated];
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
        const afterCreated = filtered.filter(notif => {
          const notifDate = notif.timestamp?.toDate?.() 
            ?? (notif.timestamp instanceof Date ? notif.timestamp : new Date(notif.timestamp));
          console.log("Checking respondent notification:", { notifDate, createdDate, passed: notifDate > createdDate });
          return notifDate > createdDate;
        });

        setTasks(prev => {
          const merged = [...prev, ...afterCreated];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
        });

        setNotifications(prev => {
          const merged = [...prev, ...afterCreated];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          return unique.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
        });
      });

      return () => {
        unsubRole();
        unsubRespondent();
      };
    }
  }, [session, createdDate, userPosition]);

  // 🔥 Everything below is your JSX unchanged (copied from your existing file)

  const handleNotificationClick = async (notification: BarangayNotification) => {
    if (!notification.isRead) {
      try {
        const notificationRef = doc(db, "BarangayNotifications", notification.id);
        await updateDoc(notificationRef, { isRead: true });
        setNotifications(prevNotifications =>
          prevNotifications.map(notif =>
            notif.id === notification.id ? { ...notif, isRead: true } : notif
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    if (notification.transactionType === "Online Assigned Incident" || notification.transactionType === "Online Incident") {
      router.push(`/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${notification.incidentID}`);
    } else if (notification.transactionType === "Assigned Incident") {
      router.push(`/dashboard/IncidentModule/EditIncident?id=${notification.incidentID}`);
    } else if (notification.transactionType === "Resident Registration") {
      router.push(`/dashboard/admin/viewResidentUser?id=${notification.accID}`);
    } else if (notification.transactionType === "Online Service Request" || "Online Assigned Service") {
      router.push(`/dashboard/ServicesModule/ViewRequest?id=${notification.requestID}`);
    }
  };

  const unreadCount = notifications.filter((msg) => msg.isRead === false).length;
  const filteredMessages =
  filter === "all"
    ? notifications.filter(msg =>
        (!createdDate || (msg.timestamp?.toDate?.() ?? new Date(msg.timestamp)) > createdDate) &&
        (
          (msg.recipientRole === userPosition && !msg.respondentID) ||  // for generic role messages
          msg.respondentID === session?.user?.id                       // or direct assignment
        )
      )
    : filter === "false"
    ? notifications.filter(msg => !msg.isRead)
    : filter === "tasks"
    ? tasks
    : filter === "department"
    ? notifications.filter(msg =>
        msg.department === session?.user?.department &&
        (!msg.respondentID || msg.respondentID === session?.user?.id)
      )
    : filter === "users"
    ? notifications.filter(msg => msg.transactionType === "Resident Registration")
    : notifications;


  const pathname = usePathname();

  const toggleNotificationSection = () => {
    setNotificationOpen((prev) => !prev);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
    setNotificationOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
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
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="main-containerB">
      <div className="user-container">
        <div className="dropdown-Container">
          <div className="dropdown-Container-no-hover-notifications-brgy">
            <p id="inbox-link" onClick={toggleNotificationSection} className="inbox-container-brgy">
              <img src="/images/inbox.png" alt="Inbox Icon" className="header-inboxicon-brgyside" />
              {unreadCount > 0 && <span className="notification-badge-brgyside">{unreadCount}</span>}
            </p>
          </div>
          {isNotificationOpen && (
            <div className="notification-section-brgyside" ref={notificationRef}>
              <div className="top-section-brgyside">
                <p className="notification-title-brgyside">Notification Inbox</p>
                <div className="filter-container-brgy">
                  <button className={`filter-option-brgy ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
                  <button className={`filter-option-brgy ${filter === "false" ? "active" : ""}`} onClick={() => setFilter("false")}>Unread</button>
                  <button className={`filter-option ${filter === "tasks" ? "active" : ""}`} onClick={() => setFilter("tasks")}>Tasks</button>
                  {(userPosition === "Admin Staff" || userPosition === "LF Staff") && (
                    <button className={`filter-option ${filter === "department" ? "active" : ""}`} onClick={() => setFilter("department")}>Department</button>
                  )}
                  {userPosition === "Assistant Secretary" && (
                    <button className={`filter-option-brgy ${filter === "users" ? "active" : ""}`} onClick={() => setFilter("users")}>Users</button>
                  )}
                </div>
              </div>
              <div className="bottom-section-brg">
                <div className="notification-content-brgyside">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div className="notification-item-brgyside" key={message.id} onClick={() => handleNotificationClick(message)}>
                        <div className="message-section-brgy">
                          <p>{message.message}</p>
                        </div>
                        <div className="unread-icon-section-brgy">
                          {message.isRead === false && (
                            <img src="/images/unread-icon.png" alt="Unread Icon" className="unread-icon" />
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
          {session?.user?.profileImage ? (
            <img src={session.user.profileImage} alt="User Icon" className="header-usericon" />
          ) : (
            <img src="/images/user.png" alt="Default User" className="header-usericon" />
          )}
        </section>
        <section className="user-section">
          <h1>{session?.user?.fullName || "User"}</h1>
          <p>{session?.user?.position || session?.user?.role || "User"}</p>
        </section>
        <section className="menu-section" ref={dropdownRef}>
          <img src="/images/down-arrow.png" alt="Menu Icon" className="menuIcon" onClick={toggleDropdown} />
          {isDropdownOpen && (
            <div className="dropdown show">
              <ul>
                <li className="options-topmenu" onClick={() => { setDropdownOpen(false); router.push(`/dashboard/settingsPage?id=${session?.user?.id}`); }}>Settings</li>
                <li className="options-topmenu" onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}>Log Out</li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
