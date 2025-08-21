"use client";

import "@/CSS/barangaySide/topMenu.css";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { db } from "../../db/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  getDoc,
  deleteDoc,
  Timestamp,
  Query,
  Unsubscribe,
} from "firebase/firestore";

type BarangayNotification = {
  id: string;
  reportID?: string;
  recipientRole?: string;
  recipientUid?: string;
  message: string;
  status?: "read" | "unread";
  timestamp?: any; // Firestore Timestamp | Date | string
  transactionType: string;
  incidentID?: string;
  isRead?: boolean;
  requestID?: string;
  department?: string;
  accID?: string;
  respondentID?: string;
  programID?: string;
};

export default function TopMenu() {
  const [notifications, setNotifications] = useState<BarangayNotification[]>([]);
  const [tasks, setTasks] = useState<BarangayNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "false" | "tasks" | "department" | "users">("all");
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [createdDate, setCreatedDate] = useState<Date | null>(null);

  const notificationRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPosition = session?.user?.position;
  const userDepartment = session?.user?.department as string | undefined;
  const userId = session?.user?.id as string | undefined;

  const router = useRouter();
  const pathname = usePathname();

  // Helpers
  const toJSDate = (v: any): Date => {
    if (!v) return new Date(0);
    if (typeof v?.toDate === "function") return v.toDate();
    if (v instanceof Date) return v;
    return new Date(v);
  };

  const tsNumber = (v: any): number => toJSDate(v).getTime();

  const mergeUniqueById = (base: BarangayNotification[], incoming: BarangayNotification[]) => {
    const map = new Map<string, BarangayNotification>();
    for (const n of base) map.set(n.id, n);
    for (const n of incoming) map.set(n.id, n);
    return Array.from(map.values());
  };

  // Load user's createdAt from BarangayUsers
  useEffect(() => {
    if (!session?.user?.id) return;
    const userDocRef = doc(db, "BarangayUsers", session.user.id);
    getDoc(userDocRef).then((docSnap) => {
      if (!docSnap.exists()) return;
      const userData = docSnap.data() as any;

      let cDate = new Date();
      if (userData?.createdAt?.toDate) cDate = userData.createdAt.toDate();
      else if (typeof userData?.createdAt === "string") cDate = new Date(userData.createdAt);

      setCreatedDate(cDate);
    });
  }, [session?.user?.id]);

  // Subscription builder to reduce duplication
  const attachSubscription = (
    q: Query,
    onData: (rows: BarangayNotification[]) => void
  ): Unsubscribe => {
    return onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as BarangayNotification[];
      onData(rows);
    });
  };

  // Realtime subscriptions:
  // - by recipientRole (role-based fanout)
  // - by recipientUid (direct user notifications, e.g., creator of a program)
  // - by respondentID (legacy/assigned flows)
  useEffect(() => {
    if (!session?.user?.id || !userPosition || !createdDate) return;

    const unsubs: Unsubscribe[] = [];

    // Role-based query
    // Secretary should also receive Assistant Secretary role notifications.
    // We do NOT put userId into recipientRole; user-specific notifications use recipientUid.
    const roleIn: string[] =
      userPosition === "Secretary"
        ? ["Secretary", "Assistant Secretary"]
        : [userPosition];

    // Firestore doesn't allow an empty "in" array
    if (roleIn.length > 0) {
      const qRole = query(
        collection(db, "BarangayNotifications"),
        where("recipientRole", "in", roleIn),
        orderBy("timestamp", "desc")
      );

      const unsubRole = attachSubscription(qRole, async (rows) => {
        // Filter out invalid/settled related docs
        const filtered = await filterValidNotifications(rows);
        const afterCreated = filtered.filter((notif) => {
          const notifDate = toJSDate(notif.timestamp);
          const sameDay = notifDate.toDateString() === createdDate.toDateString();
          return notifDate >= createdDate || sameDay;
        });

        if (
          userPosition === "Assistant Secretary" ||
          userPosition === "Admin Staff" ||
          userPosition === "Punong Barangay" ||
          userPosition === "Secretary"
        ) {
          setTasks((prev) =>
            mergeUniqueById(prev, afterCreated).sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp))
          );
        }

        setNotifications((prev) =>
          mergeUniqueById(prev, afterCreated).sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp))
        );
      });

      unsubs.push(unsubRole);
    }

    // Direct recipient (creator/assignee specific)
    if (userId) {
      const qDirect = query(
        collection(db, "BarangayNotifications"),
        where("recipientUid", "==", userId),
        orderBy("timestamp", "desc")
      );

      const unsubDirect = attachSubscription(qDirect, async (rows) => {
        const filtered = await filterValidNotifications(rows);
        const afterCreated = filtered.filter((notif) => {
          const notifDate = toJSDate(notif.timestamp);
          const sameDay = notifDate.toDateString() === createdDate.toDateString();
          return notifDate >= createdDate || sameDay;
        });

        setTasks((prev) =>
          mergeUniqueById(prev, afterCreated).sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp))
        );

        setNotifications((prev) =>
          mergeUniqueById(prev, afterCreated).sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp))
        );
      });

      unsubs.push(unsubDirect);
    }

    // Respondent-based (legacy/assigned)
    if (userId) {
      const qRespondent = query(
        collection(db, "BarangayNotifications"),
        where("respondentID", "==", userId),
        orderBy("timestamp", "desc")
      );

      const unsubRespondent = attachSubscription(qRespondent, async (rows) => {
        const filtered = await filterValidNotifications(rows);
        const afterCreated = filtered.filter((notif) => toJSDate(notif.timestamp) > createdDate);

        setTasks((prev) =>
          mergeUniqueById(prev, afterCreated).sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp))
        );

        setNotifications((prev) =>
          mergeUniqueById(prev, afterCreated).sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp))
        );
      });

      unsubs.push(unsubRespondent);
    }

    return () => unsubs.forEach((u) => u());
  }, [session, createdDate, userPosition, userId]);

  // Validate related entities so we don't show already-settled/archived things
  const filterValidNotifications = async (notifs: BarangayNotification[]) => {
    return Promise.all(
      notifs.map(async (notif) => {
        try {
          if (notif.incidentID) {
            const incidentSnap = await getDoc(doc(db, "IncidentReports", notif.incidentID));
            if (!incidentSnap.exists()) return null;

            const incidentData = incidentSnap.data() as any;
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

            const requestData = requestSnap.data() as any;
            if (requestData.status === "Completed" || requestData.status === "Rejected") {
              return null;
            }
          }

          return notif;
        } catch (err) {
          console.error("Error checking related doc:", err);
          return null;
        }
      })
    ).then((results) => results.filter((n): n is BarangayNotification => n !== null));
  };

  // Click handling
  const handleNotificationClick = async (notification: BarangayNotification) => {
    if (!notification.isRead) {
      try {
        const notificationRef = doc(db, "BarangayNotifications", notification.id);
        await updateDoc(notificationRef, { isRead: true });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    const { transactionType, incidentID, requestID, accID, programID } = notification;

    if (["Online Assigned Incident", "Online Incident"].includes(transactionType)) {
      router.push(`/dashboard/IncidentModule/OnlineReports/ViewOnlineReport?id=${incidentID}`);
    } else if (transactionType === "Assigned Incident" || transactionType === "Department Incident") {
      router.push(`/dashboard/IncidentModule/EditIncident?id=${incidentID}`);
    } else if (transactionType === "Resident Registration") {
      router.push(`/dashboard/admin/viewResidentUser?id=${accID}`);
    } else if (
      transactionType === "Program Suggestion" ||
      transactionType === "Program Decision" ||
      transactionType === "Program Enrollment" ||
      transactionType === "Program Added" || 
      transactionType === "Program Submission"
    ) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails?id=${programID}`);
    } else if (
      ["Online Service Request", "Online Assigned Service Request", "Service Request", "Assigned Service Request"].includes(
        transactionType
      )
    ) {
      try {
        const requestRef = doc(db, "ServiceRequests", requestID!);
        const requestSnap = await getDoc(requestRef);

        if (requestSnap.exists()) {
          const requestData = requestSnap.data() as any;
          const hasAppointment = Boolean(requestData.appointmentDate);
          const isApproved = requestData.approvedBySAS === true;

          const isCertificateWithMissingPhoto =
            requestData.docType === "Barangay Certificate" &&
            requestData.purpose === "Residency" &&
            (!requestData.photoUploaded || requestData.photoUploaded.trim() === "");

          const isIndigencyWithMissingRemarks =
            requestData.docType === "Barangay Indigency" &&
            (!requestData.interviewRemarks || requestData.interviewRemarks.trim() === "");

          if (hasAppointment && isApproved && (isCertificateWithMissingPhoto || isIndigencyWithMissingRemarks)) {
            router.push(`/dashboard/ServicesModule/Appointments`);
          } else {
            const reqType = requestData.accID !== "INBRGY-REQ" ? "online" : "inbarangay";
            router.push(`/dashboard/ServicesModule/ViewRequest?reqType=${reqType}&id=${requestID}`);
          }
        } else {
          console.warn("Service request not found:", requestID);
        }
      } catch (err) {
        console.error("Error fetching service request for redirection:", err);
      }
    }
  };

  // Merge
  const mergedNotifs = mergeUniqueById(notifications, tasks);

  // Unread count with proper gating
  const unreadFiltered = mergedNotifs.filter((msg) => {
    if (msg.isRead) return false;

    const notifDate = toJSDate(msg.timestamp);
    const isAfterCreated =
      !createdDate || notifDate >= createdDate || notifDate.toDateString() === createdDate.toDateString();

    const isMyDeptOrOnline = msg.department === userDepartment || msg.transactionType === "Online Incident";

    const isSecretaryGroup =
      userPosition === "Secretary" && ["Secretary", "Assistant Secretary"].includes(msg.recipientRole || "");

    const isDirectlyAssignedToMe = msg.respondentID === userId;
    const isDirectToMyUid = msg.recipientUid === userId;

    const isGenericToMyRole =
      msg.recipientRole === userPosition ||
      isDirectlyAssignedToMe ||
      (msg.recipientRole === userPosition && !msg.respondentID && isMyDeptOrOnline);

    const passes =
      isAfterCreated &&
      (isSecretaryGroup || isGenericToMyRole || isDirectlyAssignedToMe || isDirectToMyUid || isMyDeptOrOnline);

    return passes;
  });

  const unreadCount = unreadFiltered.length;

  // Filtered messages for panel
  const baseList = mergeUniqueById(notifications, tasks);
  const sortByTsDesc = (arr: BarangayNotification[]) =>
    arr.sort((a, b) => tsNumber(b.timestamp) - tsNumber(a.timestamp));

  const filteredMessages =
    filter === "all"
      ? sortByTsDesc(
          baseList.filter((msg) => {
            const notifDate = toJSDate(msg.timestamp);
            const isAfterCreated =
              !createdDate || notifDate >= createdDate || notifDate.toDateString() === createdDate.toDateString();

            const isSecretaryGroup =
              userPosition === "Secretary" && ["Secretary", "Assistant Secretary"].includes(msg.recipientRole || "");

            const isDirectlyAssignedToMe = msg.respondentID === userId;
            const isDirectToMyUid = msg.recipientUid === userId;

            const isGenericToMyRole =
              msg.recipientRole === userPosition ||
              isDirectlyAssignedToMe ||
              isDirectToMyUid ||
              (msg.recipientRole === userPosition &&
                !msg.respondentID &&
                (msg.department === userDepartment || msg.transactionType === "Online Incident"));

            const isTaskAdded = tasks.find((t) => t.id === msg.id) !== undefined;

            return isAfterCreated && (isSecretaryGroup || isGenericToMyRole || isDirectlyAssignedToMe || isDirectToMyUid || isTaskAdded);
          })
        )
      : filter === "false"
      ? sortByTsDesc(
          baseList.filter((msg) => {
            if (msg.isRead) return false;

            const notifDate = toJSDate(msg.timestamp);
            const isAfterCreated =
              !createdDate || notifDate >= createdDate || notifDate.toDateString() === createdDate.toDateString();

            const isMyDeptOrOnline = msg.department === userDepartment || msg.transactionType === "Online Incident";

            const isSecretaryGroup =
              userPosition === "Secretary" && ["Secretary", "Assistant Secretary"].includes(msg.recipientRole || "");

            const isDirectlyAssignedToMe = msg.respondentID === userId;
            const isDirectToMyUid = msg.recipientUid === userId;

            const isGenericToMyRole =
              msg.recipientRole === userPosition ||
              isDirectlyAssignedToMe ||
              isDirectToMyUid ||
              (msg.recipientRole === userPosition && !msg.respondentID && isMyDeptOrOnline);

            return isAfterCreated && (isSecretaryGroup || isGenericToMyRole || isDirectlyAssignedToMe || isDirectToMyUid);
          })
        )
      : filter === "tasks"
      ? sortByTsDesc(tasks)
      : filter === "department"
      ? sortByTsDesc(
          notifications.filter(
            (msg) => msg.department === userDepartment && (!msg.respondentID || msg.respondentID === userId)
          )
        )
      : filter === "users"
      ? sortByTsDesc(notifications.filter((msg) => msg.transactionType === "Resident Registration"))
      : sortByTsDesc(baseList);

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
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      setTasks((prev) => prev.filter((notif) => notif.id !== id));
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
              <img src="/Images/inbox.png" alt="Inbox Icon" className="header-inboxicon-brgyside" />
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
                  {(userPosition === "Admin Staff" || userPosition === "LF Staff") && (
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
                            <img src="/Images/unread-icon.png" alt="Unread Icon" className="unread-icon" />
                          )}
                        </div>
                        <div className="delete-icon-section-brgy">
                          <button
                            className="delete-btn-brgy"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(message.id);
                            }}
                          >
                            <img src="/Images/delete.png" alt="Delete" className="delete-icon-image-brgy" />
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
            <img src="/Images/user.png" alt="Default User" className="header-usericon" />
          )}
        </section>
        <section className="user-section">
          <h1>{session?.user?.fullName || "User"}</h1>
          <p>{session?.user?.position || session?.user?.role || "User"}</p>
        </section>
        <section className="menu-section" ref={dropdownRef}>
          <img src="/Images/down-arrow.png" alt="Menu Icon" className="menuIcon" onClick={toggleDropdown} />
          {isDropdownOpen && (
            <div className="dropdown show">
              <ul>
                <li
                  className="options-topmenu"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push(`/dashboard/settingsPage?id=${session?.user?.id}`);
                  }}
                >
                  Settings
                </li>
                <li
                  className="options-topmenu"
                  onClick={() => {
                    setDropdownOpen(false);
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
