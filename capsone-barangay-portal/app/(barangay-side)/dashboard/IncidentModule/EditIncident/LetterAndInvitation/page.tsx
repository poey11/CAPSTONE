"use client"
import "@/CSS/IncidentModule/Letters.css";
import { useRouter, useSearchParams } from "next/navigation";
import { act, use, useEffect, useState } from "react";
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, where, setDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { db } from "@/app/db/firebase";
import { getLocalDateString, getLocalDateTimeString } from "@/app/helpers/helpers";
import { generateDownloadLink } from "../../../../../helpers/firestorehelper";
import MenuBar from "@/app/(barangay-side)/components/incidentMenuBar";

export default function GenerateDialogueLetter() {
  const user = useSession().data?.user;
  const searchParam = useSearchParams();
  const docId = searchParam.get("id")?.split("?")[0];
  const actionId = searchParam.get("action");
  const department = searchParam.get("department");

  const today = getLocalDateString(new Date());

  const [listOfStaffs, setListOfStaffs] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [showSubmitPopup, setShowSubmitPopup] = useState<{ show: boolean; message: string; message2: string; letterType?: "dialogue" | "summon" }>({
    show: false,
    message: "",
    message2: "",
    letterType: undefined,
  });

  const [concernImageUrl, setconcernImageUrl] = useState<string | null>(null);
  const [hasSummonLetter, setHasSummonLetter] = useState(false);
  const [reportData, setReportData] = useState<any>();
  const [isDialogueSectionFilled, setIsDialogueSectionFilled] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  const [otherInfo, setOtherInfo] = useState({
    DateOfDelivery: "",
    DateTimeOfMeeting: "",
    LuponStaff: "",
    LuponStaffId: "",
    DateFiled: today,
    complainant: {
      fname: "",
      address: "",
      contact: "",
    },
    respondent: {
      fname: "",
      address: "",
      contact: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const todayWithTime = getLocalDateTimeString(tomorrow);
  const [isDialogue, setIsDialogue] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const staffquery = query(
      collection(db, "BarangayUsers"),
      where("position", "==", "LF Staff"),
      where("firstTimelogin", "==", false)
    );
    const unsubscribe = onSnapshot(staffquery, (snapshot) => {
      const staffList: any[] = [];
      snapshot.forEach((doc) => {
        staffList.push({ ...doc.data(), id: doc.id });
      });
      setListOfStaffs(staffList);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredStaffs = listOfStaffs.filter((staff) => staff.department === department);

  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, "IncidentReports", docId, "DialogueMeeting", docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsDialogueSectionFilled(data.filled);
      } else {
        setIsDialogueSectionFilled(false);
      }
    });
    return () => unsubscribe();
  }, [docId]);

  useEffect(() => {
    if (!docId) return;
    try {
      const docRef = doc(db, "IncidentReports", docId);
      const subDocRef = collection(docRef, "GeneratedLetters");
      const qy = query(subDocRef, where("letterType", "==", actionId), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(qy, (snapshot) => {
        const reports: any[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setData(reports);
      });
      return unsubscribe;
    } catch (error) {}
  }, [actionId, docId]);

type Check = { ok: boolean; msg?: string };

const pad2 = (n: number) => n.toString().padStart(2, "0");

const toLocalISOStringForInput = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const addDays = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

// Earliest pickable meeting time: delivery + 2 days at 08:00 (used only when delivery exists)
const getMinMeetingISO = (deliveryISO?: string) => {
  if (!deliveryISO) return "";
  const base = new Date(deliveryISO);
  if (isNaN(base.getTime())) return "";
  const min = addDays(base, 2);
  min.setHours(8, 0, 0, 0); // 08:00
  return toLocalISOStringForInput(min);
};

// Popup helper (auto-hide)
const showError = (msg: string) => {
  setErrorPopup({ show: true, message: msg });
  setTimeout(() => setErrorPopup({ show: false, message: "" }), 2000);
};

// Delivery: Mon–Sat only
const isValidDeliveryDate = (deliveryISO?: string): Check => {
  if (!deliveryISO) return { ok: false, msg: "Please pick a delivery date." };
  const d = new Date(deliveryISO);
  if (isNaN(d.getTime())) return { ok: false, msg: "Invalid delivery date." };
  const dow = d.getDay(); // 0=Sun
  if (dow === 0) return { ok: false, msg: "Delivery cannot be scheduled on Sundays." };
  return { ok: true };
};

// Meeting weekday/time rules (independent of delivery)
const isWithinAllowedHours = (dt: Date): Check => {
  const day = dt.getDay(); // 0 Sun ... 6 Sat
  const hours = dt.getHours();
  const mins = dt.getMinutes();

  if (day === 0) return { ok: false, msg: "Meetings cannot be scheduled on Sundays." };

  // Mon–Fri: 08:00–17:00
  if (day >= 1 && day <= 5) {
    const afterOpen = hours > 8 || (hours === 8 && mins >= 0);
    const beforeClose = hours < 17 || (hours === 17 && mins === 0);
    return afterOpen && beforeClose
      ? { ok: true }
      : { ok: false, msg: "Mon–Fri meetings must be between 8:00 AM and 5:00 PM." };
  }

  // Saturday: 08:00–14:00
  if (day === 6) {
    const afterOpen = hours > 8 || (hours === 8 && mins >= 0);
    const beforeClose = hours < 14 || (hours === 14 && mins === 0);
    return afterOpen && beforeClose
      ? { ok: true }
      : { ok: false, msg: "Saturday meetings must be between 8:00 AM and 2:00 PM." };
  }

  return { ok: false, msg: "Invalid day." };
};

// Pair rule (only matters if both sides exist)
const isAtLeastTwoDaysAfter = (deliveryISO?: string, meetingISO?: string): Check => {
  if (!deliveryISO || !meetingISO) return { ok: true }; // no pair yet -> don't block selecting either first
  const delivery = new Date(deliveryISO);
  const meeting = new Date(meetingISO);
  if (isNaN(delivery.getTime()) || isNaN(meeting.getTime())) {
    return { ok: false, msg: "Invalid date(s). Please reselect." };
  }
  const diffMs = meeting.getTime() - delivery.getTime();
  if (diffMs < 48 * 60 * 60 * 1000) {
    return { ok: false, msg: "Meeting must be at least 2 days after the Date of Delivery." };
  }
  return { ok: true };
};

// Validates meeting alone (no Sundays, time window) + pair rule if delivery present
const validateMeetingSelection = (deliveryISO?: string, meetingISO?: string): Check => {
  if (!meetingISO) return { ok: false, msg: "Please pick a meeting date & time." };
  const meeting = new Date(meetingISO);
  if (isNaN(meeting.getTime())) return { ok: false, msg: "Invalid meeting date/time." };

  const baseCheck = isWithinAllowedHours(meeting);
  if (!baseCheck.ok) return baseCheck;

  const pairCheck = isAtLeastTwoDaysAfter(deliveryISO, meetingISO);
  if (!pairCheck.ok) return pairCheck;

  return { ok: true };
};


  // Auto-hide error popup after 2s
  useEffect(() => {
    if (!errorPopup.show) return;
    const t = setTimeout(() => setErrorPopup({ show: false, message: "" }), 2000);
    return () => clearTimeout(t);
  }, [errorPopup.show]);

  // Dynamic min/max bounds for the meeting picker
  const [meetingBounds, setMeetingBounds] = useState<{ min: string; max: string }>({ min: "", max: "" });

  const getWindowForDate = (d: Date) => {
    const open = new Date(d);
    open.setHours(8, 0, 0, 0);

    const close = new Date(d);
    if (d.getDay() === 6) close.setHours(14, 0, 0, 0); // Sat 08–14
    else close.setHours(17, 0, 0, 0); // Mon–Fri 08–17

    return {
      openISO: toLocalISOStringForInput(open),
      closeISO: toLocalISOStringForInput(close),
    };
  };

  useEffect(() => {
    const defaultMin = getMinMeetingISO(otherInfo.DateOfDelivery);

    if (!otherInfo.DateTimeOfMeeting) {
      setMeetingBounds({ min: defaultMin, max: "" });
      return;
    }

    const dt = new Date(otherInfo.DateTimeOfMeeting);
    if (isNaN(dt.getTime()) || dt.getDay() === 0) {
      setMeetingBounds({ min: defaultMin, max: "" });
      return;
    }

    const { openISO, closeISO } = getWindowForDate(dt);
    setMeetingBounds({
      min: new Date(openISO) > new Date(defaultMin) ? openISO : defaultMin,
      max: closeISO,
    });
  }, [otherInfo.DateTimeOfMeeting, otherInfo.DateOfDelivery]);

  // ----------------- Handlers -----------------
  const handleAddLupon = () => {
    router.back();
  };

  const [staffContactNos, setStaffContactNos] = useState<string>("");
  const [staffName, setStaffName] = useState<string>("");
  const [staffLastName, setStaffLastName] = useState<string>("");
  const [DateOfDeliveryState, setDateOfDeliveryState] = useState<string>("");

  useEffect(() => {
    if (!otherInfo.LuponStaffId) return;
    const staff = filteredStaffs.find((s) => s.id === otherInfo.LuponStaffId);
    setStaffContactNos(staff?.phone ?? "");
    setStaffName(staff?.firstName ?? "");
    setStaffLastName(staff?.lastName ?? "");
    setDateOfDeliveryState(otherInfo.DateOfDelivery ?? "");
  }, [otherInfo, filteredStaffs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const keys = name.split(".");
    setOtherInfo((prev) => {
      if (keys.length === 2) {
        const [parentKey, childKey] = keys;
        return {
          ...prev,
          [parentKey]: {
            ...(prev[parentKey as keyof typeof prev] as object),
            [childKey]: value,
          },
        };
      }
      return { ...prev, [name]: value };
    });
  };

const handleMeetingChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  const value = e.target.value; // YYYY-MM-DDTHH:mm
  const res = validateMeetingSelection(otherInfo.DateOfDelivery, value);

  if (!res.ok) {
    showError(res.msg || "Invalid meeting date/time.");
    e.target.value = "";
    setOtherInfo((prev) => ({ ...prev, DateTimeOfMeeting: "" }));
    return;
  }

  // Valid -> update
  handleChange(e);
};

const handleDeliveryChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
  const value = e.target.value; // YYYY-MM-DD

  // Basic delivery rule (Mon–Sat)
  const del = isValidDeliveryDate(value);
  if (!del.ok) {
    showError(del.msg || "Invalid delivery date.");
    e.target.value = "";
    setOtherInfo((prev) => ({ ...prev, DateOfDelivery: "" }));
    return;
  }

  // If a meeting was picked earlier, ensure pair rule holds now
  if (otherInfo.DateTimeOfMeeting) {
    const pair = isAtLeastTwoDaysAfter(value, otherInfo.DateTimeOfMeeting);
    if (!pair.ok) {
      showError(pair.msg || "Delivery/meeting mismatch.");
      e.target.value = "";
      setOtherInfo((prev) => ({ ...prev, DateOfDelivery: "" }));
      return;
    }
  }

  // Valid -> update and do not auto-clear meeting (it’s valid)
  handleChange(e);
};


  // ----------------- Firestore subscriptions -----------------
  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, "IncidentReports", docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsDialogue(data.isDialogue);
      }
    });
    return () => unsubscribe();
  }, [docId]);

  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, "IncidentReports", docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserInfo(data);
      }
    });
    return () => unsubscribe();
  }, [docId]);

  let hearing = userInfo?.hearing;
  let generatedHearingSummons = userInfo?.generatedHearingSummons || 0;

  useEffect(() => {
    if (userInfo) {
      setOtherInfo((prev) => ({
        ...prev,
        complainant: {
          fname: `${userInfo.complainant?.fname || ""} ${userInfo.complainant?.lname || ""}`.trim(),
          address: userInfo.complainant?.address || "",
          contact: userInfo.complainant?.contact || "",
          residentId: userInfo.complainant?.residentId || "",
        },
        respondent: {
          fname: `${userInfo.respondent?.fname || ""} ${userInfo.respondent?.lname || ""}`.trim(),
          address: userInfo.respondent?.address || "",
          contact: userInfo.respondent?.contact || "",
          residentId: userInfo.respondent?.residentId || "",
        },
      }));
    }
  }, [userInfo]);

  // ----------------- SMS + Print (unchanged core logic) -----------------
  const sendSMSForDialogue = async () => {
    try {
      const response = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: otherInfo.complainant.contact,
          message: `Good day Mr./Ms. ${otherInfo.complainant.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a
              dialogue invitation to you. The invitation will be handed personally by ${staffName} ${staffLastName} on ${DateOfDeliveryState}.\n\nThis letter contains important 
                 details regarding the scheduled dialogue between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.
                \n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.
                \n\nThank you and we appreciate your cooperation.\n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`,
        }),
      });
      if (!response.ok) throw new Error("Failed to send SMS");
      await response.json();

      const responseB = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: otherInfo.respondent.contact,
          message: `Good day Mr./Ms. ${otherInfo.respondent.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a 
               dialogue invitation to you. The invitation will be handed personally by ${staffName} ${staffLastName}on ${DateOfDeliveryState}.\n\nThis letter contains important 
             details regarding the scheduled dialogue between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.
                \n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.\n\nSincerely,
             \nLupon Tagapamayapa\nBarangay Fairview`,
        }),
      });
      if (!responseB.ok) throw new Error("Failed to send SMS");

      const responseC = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: staffContactNos,
          message: `Good day Mr./Ms. ${staffName} ${staffLastName},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview has prepared a 
                 dialogue letter that requires your attention.\n\nYou are requested to proceed to the Lupon office on ${DateOfDeliveryState} 
                 to retrieve the said document. Once received, kindly ensure its prompt delivery to both the respondent and the complainant involved in the case.
                \n\nThis letter contains important information regarding the scheduled dialogue, and your assistance in facilitating its delivery is greatly appreciated.
                 \n\nShould you have any questions or need further clarification, please contact the Barangay Hall.\n\nThank you for your cooperation.
                 \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`,
        }),
      });
      if (!responseC.ok) throw new Error("Failed to send SMS");
      await responseC.json();

      setShowSubmitPopup({
        show: true,
        message: "SMS message for both parties sent succesfully!",
        message2: "",
        letterType: "dialogue",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const sendSMSForSummons = async () => {
    try {
      const response = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: otherInfo.respondent.contact,
          message: `Good day Mr./Ms. ${otherInfo.respondent.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay 
                    Fairview will be delivering a Hearing invitation to you. The invitation will be handed personally by ${staffName} ${staffLastName}  on 
                    ${DateOfDeliveryState}.\n\nThis letter contains important details regarding the scheduled hearing between parties involved. 
                    We kindly ask for your attention and cooperation in receiving and acknowledging the said document.
                    \n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.
                    \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`,
        }),
      });
      if (!response.ok) throw new Error("Failed to send SMS");
      await response.json();

      const responseB = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: otherInfo.complainant.contact,
          message: `Good day Mr./Ms. ${otherInfo.complainant.fname},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview will be delivering a 
                Hearing invitation to you. The invitation will be handed personally by ${staffName} ${staffLastName} on ${DateOfDeliveryState}.\n\nThis letter contains important details
                 regarding the scheduled hearing between parties involved. We kindly ask for your attention and cooperation in receiving and acknowledging the said document.
                 \n\nShould you have any questions or concerns, you may contact the Barangay Hall for further assistance.\n\nThank you and we appreciate your cooperation.
                 \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`,
        }),
      });
      if (!responseB.ok) throw new Error("Failed to send SMS");

      const responseC = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: staffContactNos,
          message: `Good day Mr./Ms. ${staffName} ${staffLastName},\n\nThis is to formally inform you that the Lupon Tagapamayapa of Barangay Fairview has prepared a 
                hearing invitation letter that requires your attention.\n\nYou are requested to proceed to the Lupon office on ${DateOfDeliveryState} 
                to retrieve the said document. Once received, kindly ensure its prompt delivery to both the respondent and the complainant involved in the case.
                \n\nThis letter contains important information regarding the scheduled dialogue, and your assistance in facilitating its delivery is greatly appreciated.
                \n\nShould you have any questions or need further clarification, please contact the Barangay Hall.\n\nThank you for your cooperation.
                \n\nSincerely,\nLupon Tagapamayapa\nBarangay Fairview`,
        }),
      });
      const dataC = await responseC.json();
      if (!responseC.ok) throw new Error("Failed to send SMS");

      setShowSubmitPopup({
        show: true,
        message: "SMS message for both parties sent succesfuly!",
        message2: "",
        letterType: "summon",
      });
    } catch (err) {
      console.log(err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
      }, 2000);
    }
  };

  const [hearingB, setHearingB] = useState("");
  useEffect(() => {
    if (hearing === 0) setHearingB("First");
    else if (hearing === 1) setHearingB("Second");
    else if (hearing > 1) setHearingB("Third");
  }, [hearing]);

  const printDialogue = async () => {
    setIsLoading(true);
    const day = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[2];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[1], 10) - 1;
    const month = monthNames[monthIndex];
    const year = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[0];
    const time24 = otherInfo.DateTimeOfMeeting.split("T")[1];
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const time12 = `${hour}:${minute} ${ampm}`;
    let collective = "Umaga";
    if (hour >= 12 && hour < 18 && ampm === "PM") collective = "Hapon";
    else if ((hour >= 6 && ampm === "PM") || (hour < 4 && ampm === "AM")) collective = "Gabi";

    try {
      const response = await fetch("/api/fillPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "/IncidentReports/Templates",
          pdfTemplate: "TEST2 - Copy.pdf",
          data: {
            "Text16": otherInfo.complainant.fname,
            "Text15": otherInfo.complainant.address,
            "Text17": otherInfo.respondent.fname,
            "Text18": otherInfo.respondent.address,
            "Text20": day,
            "Text21": month,
            "Text22": year,
            "Text23": time12,
            "Text24": collective,
            "Text25": day,
            "Text28": month,
            "Text29": year,
            "Text27": user?.fullName,
            "Text19": `${staffName} ${staffLastName}`,
          },
          centerField: ["Text27", "Text20", "Text21", "Text22", "Text23", "Text24", "Text25", "Text28", "Text29", "Text19"],
        }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DialogueLetter.pdf";
      a.click();
      window.URL.revokeObjectURL(url);

      setShowSubmitPopup({
        show: true,
        message: "Dialogue Letter has been generated successfully!",
        message2: "Next: Complete the dialogue section after the meeting.",
        letterType: "dialogue",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowSubmitPopup({
          show: true,
          message: "Dialogue Letter has been generated successfully!",
          message2: "Next: Complete the dialogue section after the meeting.",
          letterType: "dialogue",
        });
      }, 50);
    }
  };

  const printSummon = async () => {
    setIsLoading(true);
    const day = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[2];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[1], 10) - 1;
    const month = monthNames[monthIndex];
    const year = otherInfo.DateTimeOfMeeting.split("T")[0].split("-")[0];
    const time24 = otherInfo.DateTimeOfMeeting.split("T")[1];
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    const time12 = `${hour}:${minute} ${ampm}`;
    let collective = "Morning";
    if (hour >= 12 && hour < 18 && ampm === "PM") collective = "Afternoon";
    else if ((hour >= 6 && ampm === "PM") || (hour < 4 && ampm === "AM")) collective = "Evening";

    const date = new Date();
    const dayToday = date.toISOString();

    const issueDay = dayToday.split("T")[0].split("-")[2];
    const issueMonthIndex = parseInt(dayToday.split("T")[0].split("-")[1], 10) - 1;
    const issueMonth = monthNames[issueMonthIndex];
    const issueYear = dayToday.split("T")[0].split("-")[0];

    try {
      const response = await fetch("/api/fillPDF", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "/IncidentReports/Templates",
          pdfTemplate: "summonTemplate.pdf",
          data: {
            "Text1": otherInfo.complainant.fname,
            "Text2": otherInfo.complainant.address,
            "Text3": otherInfo.respondent.fname,
            "Text4": otherInfo.respondent.address,
            "Text5": hearingB,
            "Text6": `${month} ${day}, ${year}`,
            "Text7": day,
            "Text8": `${month} ${year}`,
            "Text9": time12,
            "Text10": collective,
            "Text11": issueDay,
            "Text12": `${issueMonth} ${issueYear}`,
            "Text13": user?.fullName,
            "Text14": `${staffName} ${staffLastName}`,
          },
          centerField: ["Text5", "Text6", "Text7", "Text8", "Text10", "Text11", "Text12", "Text13", "Text14"],
        }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SummonLetter.pdf";
      a.click();
      window.URL.revokeObjectURL(url);

      setShowSubmitPopup({
        show: true,
        message: "Summon Letter has been generated successfully!",
        message2: "Next: Complete the hearing section after the meeting",
        letterType: "summon",
      });
    } catch (e: any) {
      console.log();
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowSubmitPopup({
          show: true,
          message: "Summon Letter has been generated successfully!",
          message2: "Next: Complete the hearing section after the meeting",
          letterType: "summon",
        });
      }, 50);
    }
  };

  useEffect(() => {
    const fetchSummonLetterStatus = async () => {
      try {
        if (!docId) return;
        const lettersRef = collection(db, "IncidentReports", docId, "GeneratedLetters");
        const q = query(lettersRef, where("letterType", "==", "summon"));
        const snapshot = await getDocs(q);
        setHasSummonLetter(!snapshot.empty);
      } catch (error) {
        console.error("Error checking summon letters:", error);
      }
    };
    fetchSummonLetterStatus();
  }, [docId]);

  const handleIsDialogue = async () => {
    try {
      if (!docId) throw new Error("Document ID is undefined");
      const docRef = doc(db, "IncidentReports", docId);
      await updateDoc(docRef, { isDialogue: true });

      const docRefB = collection(db, "IncidentReports", docId, "GeneratedLetters");
      await addDoc(docRefB, {
        createdAt: new Date(),
        createdBy: user?.fullName,
        letterType: actionId,
        DateOfDelivery: otherInfo.DateOfDelivery,
        DateTimeOfMeeting: otherInfo.DateTimeOfMeeting,
        LuponStaff: otherInfo.LuponStaff,
        LuponStaffId: otherInfo.LuponStaffId,
        DateFiled: otherInfo.DateFiled,
      });

      if (otherInfo.LuponStaffId) {
        const barangayNotificationRef = doc(collection(db, "BarangayNotifications"));
        await setDoc(barangayNotificationRef, {
          recipientRole: "LF Staff",
          respondentID: otherInfo.LuponStaffId,
          message: `You have been assigned to deliver a Dialogue letter for Case #${userInfo?.caseNumber || docId}.`,
          timestamp: new Date(),
          isRead: false,
          incidentID: docId,
          transactionType: "Assigned Incident",
        });
      }

      if (otherInfo.LuponStaffId) {
        const n1 = doc(collection(db, "BarangayNotifications"));
        await setDoc(n1, {
          recipientRole: "Punong Barangay",
          message: `Dialogue letter for Case #${userInfo?.caseNumber || docId} requires your signature. Please be advised.`,
          timestamp: new Date(),
          isRead: false,
          incidentID: docId,
          transactionType: "Assigned Incident",
        });
      }
      if (otherInfo.LuponStaffId) {
        const n2 = doc(collection(db, "BarangayNotifications"));
        await setDoc(n2, {
          recipientRole: "Secretary",
          message: `Dialogue letter for Case #${userInfo?.caseNumber || docId} requires your signature. Please be advised.`,
          timestamp: new Date(),
          isRead: false,
          incidentID: docId,
          transactionType: "Assigned Incident",
        });
      }

      if (userInfo?.complainant?.residentId) {
        const complainantNotifRef = doc(collection(db, "Notifications"));
        await setDoc(complainantNotifRef, {
          residentID: userInfo.complainant.residentId,
          message: `You have a scheduled Dialogue meeting on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
          transactionType: "Incident",
          timestamp: new Date(),
          isRead: false,
        });
      }

      if (userInfo?.respondent?.residentId) {
        const respondentNotifRef = doc(collection(db, "Notifications"));
        await setDoc(respondentNotifRef, {
          residentID: userInfo.respondent.residentId,
          message: `You have a scheduled Dialogue meeting on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
          transactionType: "Incident",
          timestamp: new Date(),
          isRead: false,
        });
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleIsHearing = async () => {
    try {
      if (!docId) throw new Error("Document ID is undefined");

      const docRefB = collection(db, "IncidentReports", docId, "GeneratedLetters");
      await addDoc(docRefB, {
        createdAt: new Date(),
        createdBy: user?.fullName,
        letterType: actionId,
        DateOfDelivery: otherInfo.DateOfDelivery,
        DateTimeOfMeeting: otherInfo.DateTimeOfMeeting,
        LuponStaff: otherInfo.LuponStaff,
        LuponStaffId: otherInfo.LuponStaffId,
        DateFiled: otherInfo.DateFiled,
        hearingNumber: hearing,
      });

      const docRef = doc(db, "IncidentReports", docId);
      const updates = {
        ...(hearing !== 3 && { hearing: hearing + 1 }),
        generatedHearingSummons: generatedHearingSummons + 1,
      };
      await updateDoc(docRef, updates);

      if (otherInfo.LuponStaffId) {
        const barangayNotificationRef = doc(collection(db, "BarangayNotifications"));
        await setDoc(barangayNotificationRef, {
          recipientRole: "LF Staff",
          respondentID: otherInfo.LuponStaffId,
          message: `You have been assigned to deliver a Summons letter for Case #${userInfo?.caseNumber || docId}.`,
          timestamp: new Date(),
          isRead: false,
          incidentID: docId,
          transactionType: "Assigned Incident",
        });
      }

      if (otherInfo.LuponStaffId) {
        const n1 = doc(collection(db, "BarangayNotifications"));
        await setDoc(n1, {
          recipientRole: "Punong Barangay",
          message: `Summons letter for Case #${userInfo?.caseNumber || docId} requires your signature. Please be advised.`,
          timestamp: new Date(),
          isRead: false,
          incidentID: docId,
          transactionType: "Assigned Incident",
        });
      }

      if (otherInfo.LuponStaffId) {
        const n2 = doc(collection(db, "BarangayNotifications"));
        await setDoc(n2, {
          recipientRole: "Secretary",
          message: `Summons letter for Case #${userInfo?.caseNumber || docId} requires your signature. Please be advised.`,
          timestamp: new Date(),
          isRead: false,
          incidentID: docId,
          transactionType: "Assigned Incident",
        });
      }

      if (userInfo?.complainant?.residentId) {
        const complainantNotifRef = doc(collection(db, "Notifications"));
        await setDoc(complainantNotifRef, {
          residentID: userInfo.complainant.residentId,
          message: `You have a scheduled ${hearingB} Hearing on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
          transactionType: "Incident",
          timestamp: new Date(),
          isRead: false,
        });
      }

      if (userInfo?.respondent?.residentId) {
        const respondentNotifRef = doc(collection(db, "Notifications"));
        await setDoc(respondentNotifRef, {
          residentID: userInfo.respondent.residentId,
          message: `You have a scheduled ${hearingB} Hearing on ${otherInfo.DateTimeOfMeeting} for Case #${userInfo.caseNumber || docId}.`,
          transactionType: "Incident",
          timestamp: new Date(),
          isRead: false,
        });
      }
    } catch (error: any) {
      console.error(error);
    }
  };

    const onSubmit = async (e: any) => {
    e.preventDefault();
    const action = e?.nativeEvent?.submitter?.name;

    // Delivery present? (We require it for printing)
    const delCheck = isValidDeliveryDate(otherInfo.DateOfDelivery);
    if (!delCheck.ok) {
        showError(delCheck.msg || "Invalid delivery date.");
        return;
    }

    // Meeting present + valid on its own + pair rule with delivery
    const v = validateMeetingSelection(otherInfo.DateOfDelivery, otherInfo.DateTimeOfMeeting);
    if (!v.ok) {
        showError(v.msg || "Invalid meeting date/time.");
        return;
    }

    if (action === "print") {
        if (actionId === "summon") {
        await handleIsHearing();
        await printSummon();
        } else {
        await handleIsDialogue();
        await printDialogue();
        }
    }
    };


  const clearForm = () => {
    setOtherInfo({
      DateOfDelivery: "",
      DateTimeOfMeeting: "",
      LuponStaff: "",
      LuponStaffId: "",
      DateFiled: "",
      complainant: {
        fname: `${userInfo?.complainant?.fname || ""} ${userInfo?.complainant?.lname || ""}`.trim(),
        address: userInfo?.complainant?.address || "",
        contact: userInfo?.complainant?.contact || "",
      },
      respondent: {
        fname: `${userInfo?.respondent?.fname || ""} ${userInfo?.respondent?.lname || ""}`.trim(),
        address: userInfo?.respondent?.address || "",
        contact: userInfo?.respondent?.contact || "",
      },
    });
  };

  useEffect(() => {
    if (!docId) return;
    const docRef = doc(db, "IncidentReports", docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setReportData(docSnap.data());
    });
    setLoading(false);
    return () => unsubscribe();
  }, [docId]);

  useEffect(() => {
    if (reportData?.file) {
      generateDownloadLink(reportData?.file, "IncidentReports").then((url) => {
        if (url) setconcernImageUrl(url);
      });
    }
  }, [reportData]);

  const handleInformationSection = (e: any) => {
    router.push(`/dashboard/IncidentModule/EditIncident?id=${docId}&department=${department}`);
  };

  const handleGenerateLetterAndInvitation = (e: any) => {
    const action = e.currentTarget.name;
    router.push(`/dashboard/IncidentModule/EditIncident/LetterAndInvitation?id=${docId}&action=${action}&department=${department}`);
  };

  const handleDialogueSection = () => {
    router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}&department=${department}`);
  };

  const handleHearingSection = (e: any) => {
    router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}&department=${department}`);
  };

  useEffect(() => {
    if (reportData?.status === "archived" && reportData?.departmentId) {
      router.push(`/dashboard/IncidentModule/Department?id=${reportData?.departmentId}`);
    }
  }, [reportData?.status, reportData?.departmentId]);

  type LetterSection = {
    DateOfDelivery?: string;
    DateTimeOfMeeting?: string;
    LuponStaff?: string;
    DateFiled?: string;
  };

  const [dialogueSection, setDialogueSection] = useState<LetterSection>({});
  const [hearingSection, setHearingSection] = useState<LetterSection>({});

  useEffect(() => {
    if (actionId === "dialogue" && data.length > 0) {
      const latestDoc = data[0];
      setDialogueSection({
        DateOfDelivery: latestDoc.DateOfDelivery || "",
        DateTimeOfMeeting: latestDoc.DateTimeOfMeeting || "",
        LuponStaff: latestDoc.LuponStaff || "",
        DateFiled: latestDoc.DateFiled || "",
      });
    } else if (actionId === "summon" && data.length >= 3) {
      const latestDoc = data[0];
      setHearingSection({
        DateOfDelivery: latestDoc.DateOfDelivery || "",
        DateTimeOfMeeting: latestDoc.DateTimeOfMeeting || "",
        LuponStaff: latestDoc.LuponStaff || "",
        DateFiled: latestDoc.DateFiled || "",
      });
    }
  }, [actionId, data]);

  const [summonLetterData, setSummonLetterData] = useState<any[]>([]);
  useEffect(() => {
    if (!docId) return;
    const colRef = query(collection(db, "IncidentReports", docId, "SummonsMeeting"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetchedData = snapshot.docs.map((d) => d.data());
      setSummonLetterData(fetchedData);
    });
    return () => unsubscribe();
  }, [docId]);

  // ----------------- UI -----------------
  const str = (v?: string) => v ?? "";

  return (
    <main className="main-container-letter">
      {errorPopup.show && (
        <div className={"popup-overlay-error show"}>
          <div className="popup-letter">
            <img src={"/Images/warning-1.png"} alt="popup icon" className="icon-alert-letter" />
            <p>{errorPopup.message}</p>
          </div>
        </div>
      )}

      {showPopup && (
        <div className={`popup-overlay-add show`}>
          <div className="popup-add">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {showSubmitPopup.show && (
        <div className="popup-backdrop">
          <div className="popup-content">
            <img src="/Images/check.png" alt="check icon" className="successful-icon-popup-letter" />
            <p>{showSubmitPopup.message}</p>
            <h2>{showSubmitPopup.message2}</h2>

            {showSubmitPopup.letterType === "summon" ? (
              <button
                onClick={() => {
                  setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
                  setPopupMessage("SMS sent successfully!!");
                  setShowPopup(true);
                  if (showSubmitPopup.letterType === "summon") {
                    sendSMSForSummons();
                    setTimeout(() => {
                      router.push(`/dashboard/IncidentModule/EditIncident/HearingSection?id=${docId}&department=${department}`);
                      setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
                    }, 2000);
                  } else {
                    setTimeout(() => {
                      setShowPopup(false);
                      router.back();
                    }, 2000);
                  }
                }}
                className="send-sms-btn"
              >
                Send SMS
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
                  setPopupMessage("SMS sent successfully!!");
                  setShowPopup(true);
                  if (showSubmitPopup.letterType === "dialogue") {
                    sendSMSForDialogue();
                    setTimeout(() => {
                      router.push(`/dashboard/IncidentModule/EditIncident/DialogueSection?id=${docId}&department=${department}`);
                      setShowSubmitPopup({ show: false, message: "", message2: "", letterType: undefined });
                    }, 2000);
                  } else {
                    setTimeout(() => {
                      setShowPopup(false);
                      router.back();
                    }, 2000);
                  }
                }}
                className="send-sms-btn"
              >
                Send SMS
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="popup-backdrop">
          <div className="popup-content">
            <div className="spinner" />
            <p>Generating letter, please wait...</p>
          </div>
        </div>
      )}

      <MenuBar id={docId || ""} department={department || ""} action={actionId || ""} />

      <div className="main-content-letter">
        <form onSubmit={onSubmit} className="container-letters">
          <div className="section-1-letter">
            <div className="section-left-side-letter">
              <button type="button" onClick={handleAddLupon}>
                <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn-letter" />
              </button>
              {actionId === "summon" ? (
                <h1 className="NewOfficial">Summon Letter ({hearingB} Hearing)</h1>
              ) : (
                <h1 className="NewOfficial">Dialogue Letter</h1>
              )}
            </div>

            {userInfo?.status === "pending" && (
              <div className="actions-letter">
                {generatedHearingSummons < 3 && actionId === "summon" && (
                  <button className="letter-announcement-btn" type="submit" name="print">
                    Print
                  </button>
                )}
                {!isDialogue && actionId === "dialogue" && (
                  <button className="letter-announcement-btn" type="submit" name="print">
                    Print
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="scroll-letter">
            <div className="section-2-letter">
              <div className="section-2-letter-upper">
                <div className="section-2-letter-left-side">
                  <div className="section-2-information-section">
                    <div className="section-2-information-top">
                      <div className="section-title-letter">
                        <h1>Complainant’s Information</h1>
                      </div>
                    </div>

                    <div className="section-2-information-bottom-upper">
                      <div className="information-bottom-first-section ">
                        <div className="fields-section-letter">
                          <p>Name</p>
                          <input
                            type="text"
                            className="generate-letter-input-field"
                            placeholder={otherInfo.complainant.fname}
                            value={str(otherInfo.complainant.fname)}
                            id="complainant.fname"
                            name="complainant.fname"
                            disabled
                          />
                        </div>

                        <div className="fields-section-letter">
                          <p>Contact Nos</p>
                          <input
                            type="text"
                            className="generate-letter-input-field"
                            placeholder={otherInfo.complainant.contact}
                            value={str(otherInfo.complainant.contact)}
                            id="complainant.contact"
                            name="complainant.contact"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="information-bottom-second-section">
                        <div className="fields-section-letter-address">
                          <p>Address</p>
                          <input
                            type="text"
                            className="generate-letter-input-field-address"
                            placeholder={otherInfo.complainant.address}
                            value={str(otherInfo.complainant.address)}
                            id="complainant.address"
                            name="complainant.address"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-2-letter-right-side">
                  <div className="section-2-information-section">
                    <div className="section-2-information-top">
                      <div className="section-title-letter">
                        <h1>Respondent’s Information</h1>
                      </div>
                    </div>

                    <div className="section-2-information-bottom-upper">
                      <div className="information-bottom-first-section ">
                        <div className="fields-section-letter">
                          <p>Name</p>
                          <input
                            type="text"
                            className="generate-letter-input-field"
                            placeholder={otherInfo.respondent.fname}
                            value={str(otherInfo.respondent.fname)}
                            id="respondent.fname"
                            name="respondent.fname"
                            disabled
                          />
                        </div>

                        <div className="fields-section-letter">
                          <p>Contact Nos</p>
                          <input
                            type="text"
                            className="generate-letter-input-field"
                            placeholder={otherInfo.respondent.contact}
                            value={str(otherInfo.respondent.contact)}
                            id="respondent.contact"
                            name="respondent.contact"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="information-bottom-second-section ">
                        <div className="fields-section-letter-address">
                          <p>Address</p>
                          <input
                            type="text"
                            className="generate-letter-input-field-address"
                            placeholder={otherInfo.respondent.address}
                            value={str(otherInfo.respondent.address)}
                            id="respondent.address"
                            name="respondent.address"
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section */}
              <div className="section-2-letter-lower">
                <div className="section-2-information-section">
                  <div className="section-2-information-top">
                    <div className="section-title-letter">
                      <h1>Other Information</h1>
                    </div>
                  </div>

                  <div className="section-2-information-bottom">
                    <div className="section-2-information-bottom">
                      {actionId === "dialogue" ? (
                        <>
                          <div className="section-2-letter-left-side-others">
                            <div className="fields-section-letter">
                              <p>Date of Delivery</p>
                                <input
                                type="date"
                                className="generate-letter-input-field"
                                value={dialogueSection?.DateOfDelivery ?? otherInfo.DateOfDelivery ?? ""}
                                id="DateOfDelivery"
                                name="DateOfDelivery"
                                min={(() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    const yyyy = tomorrow.getFullYear();
                                    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
                                    const dd = String(tomorrow.getDate()).padStart(2, "0");
                                    return `${yyyy}-${mm}-${dd}`;
                                })()}
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={(e) => {
                                    handleDeliveryChange(e);
                                    // If you still want to clear the meeting whenever delivery changes, keep this:
                                    setOtherInfo((prev: any) => ({ ...prev, DateTimeOfMeeting: "" }));
                                }}
                                required
                                disabled={!!dialogueSection?.DateOfDelivery}
                                />
                            </div>

                            <div className="fields-section-letter">
                              <p>Date and Time of Meeting</p>
                                <input
                                type="datetime-local"
                                className="generate-letter-input-field"
                                value={dialogueSection?.DateTimeOfMeeting ?? otherInfo.DateTimeOfMeeting ?? ""}
                                onKeyDown={(e) => e.preventDefault()}
                                id="DateTimeOfMeeting"
                                name="DateTimeOfMeeting"
                                onChange={handleMeetingChange}
                                min={getMinMeetingISO(otherInfo.DateOfDelivery) || undefined}
                                required
                                disabled={!!dialogueSection?.DateTimeOfMeeting}
                                />
                            </div>
                          </div>

                          <div className="section-2-letter-right-side-others">
                            <div className="fields-section-letter">
                              <p>Delivered By</p>
                              <select
                                className="generate-letter-input-field-dropdown"
                                value={dialogueSection?.LuponStaff ?? otherInfo.LuponStaff ?? ""}
                                onChange={(e) => {
                                  const select = e.target;
                                  const selectedOption = select.options[select.selectedIndex];
                                  const selectedName = selectedOption.value;
                                  const selectedId = selectedOption.getAttribute("data-staffid") || "";
                                  setOtherInfo((prev) => ({
                                    ...prev,
                                    LuponStaff: selectedName,
                                    LuponStaffId: selectedId,
                                  }));
                                }}
                                required
                                disabled={!!dialogueSection?.LuponStaff}
                              >
                                <option disabled value="">
                                  Select Official/Kagawad
                                </option>
                                {filteredStaffs.map((staff, index) => (
                                  <option key={index} value={`${staff.firstName} ${staff.lastName}`} data-staffid={staff.id}>
                                    {staff.firstName} {staff.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="fields-section-letter">
                              <p>Date Filed</p>
                              <input
                                type="date"
                                className="generate-letter-input-field"
                                value={dialogueSection?.DateFiled ?? otherInfo.DateFiled ?? ""}
                                max={today}
                                id="DateFiled"
                                name="DateFiled"
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={handleChange}
                                disabled
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="section-2-letter-left-side-others">
                            <div className="fields-section-letter">
                              <p>Date of Delivery</p>
                                <input
                                type="date"
                                className="generate-letter-input-field"
                                value={dialogueSection?.DateOfDelivery ?? otherInfo.DateOfDelivery ?? ""}
                                id="DateOfDelivery"
                                name="DateOfDelivery"
                                min={(() => {
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    const yyyy = tomorrow.getFullYear();
                                    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
                                    const dd = String(tomorrow.getDate()).padStart(2, "0");
                                    return `${yyyy}-${mm}-${dd}`;
                                })()}
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={(e) => {
                                    handleDeliveryChange(e);
                                    // If you still want to clear the meeting whenever delivery changes, keep this:
                                    setOtherInfo((prev: any) => ({ ...prev, DateTimeOfMeeting: "" }));
                                }}
                                required
                                disabled={!!dialogueSection?.DateOfDelivery}
                                />

                            </div>

                            <div className="fields-section-letter">
                              <p>Date and Time of Meeting</p>
                                <input
                                type="datetime-local"
                                className="generate-letter-input-field"
                                value={dialogueSection?.DateTimeOfMeeting ?? otherInfo.DateTimeOfMeeting ?? ""}
                                onKeyDown={(e) => e.preventDefault()}
                                id="DateTimeOfMeeting"
                                name="DateTimeOfMeeting"
                                onChange={handleMeetingChange}
                                min={getMinMeetingISO(otherInfo.DateOfDelivery) || undefined}
                                required
                                disabled={!!dialogueSection?.DateTimeOfMeeting}
                                />
                            </div>
                          </div>

                          <div className="section-2-letter-right-side-others">
                            <div className="fields-section-letter">
                              <p>Delivered By</p>
                              <select
                                className="generate-letter-input-field-dropdown"
                                value={hearingSection?.LuponStaff ?? otherInfo.LuponStaff ?? ""}
                                onChange={(e) => {
                                  const select = e.target;
                                  const selectedOption = select.options[select.selectedIndex];
                                  const selectedName = selectedOption.value;
                                  const selectedId = selectedOption.getAttribute("data-staffid") || "";
                                  setOtherInfo((prev) => ({
                                    ...prev,
                                    LuponStaff: selectedName,
                                    LuponStaffId: selectedId,
                                  }));
                                }}
                                disabled={!!hearingSection?.LuponStaff}
                                required
                              >
                                <option disabled value="">
                                  Select Official/Kagawad
                                </option>
                                {filteredStaffs.map((staff, index) => (
                                  <option key={index} value={`${staff.firstName} ${staff.lastName}`} data-staffid={staff.id}>
                                    {staff.firstName} {staff.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="fields-section-letter">
                              <p>Date Filed</p>
                              <input
                                type="date"
                                className="generate-letter-input-field"
                                value={hearingSection?.DateFiled ?? otherInfo.DateFiled ?? ""}
                                max={today}
                                id="DateFiled"
                                name="DateFiled"
                                onKeyDown={(e) => e.preventDefault()}
                                onChange={handleChange}
                                disabled
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
