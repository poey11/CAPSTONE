"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/db/firebase";

import ViewApprovedParticipantModal from "@/app/(barangay-side)/components/ViewApprovedParticipantModal";
import AddWalkInParticipantModal from "@/app/(barangay-side)/components/AddWalkInParticipantModal";

type Participant = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  emailAddress?: string;
  location?: string;
  address?: string;
  programId?: string;
  programName?: string;
  residentId?: string;
  role?: string; // "Participant" | "Volunteer"
  approvalStatus?: string;
  attendance?: boolean;
  dayChosen?: number; // 0-based
};

type Resident = {
  id: string;
  residentNumber?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  location?: string;
  contactNumber?: string;
  mobile?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  sex?: string;
  age?: number;
  identificationFileURL?: string;
};

type SimpleField = { name: string };

const PRETTY_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
};

const FALLBACK_REQ_TEXT: SimpleField[] = [
  { name: "firstName" },
  { name: "lastName" },
  { name: "contactNumber" },
  { name: "emailAddress" },
  { name: "location" },
];

// ---------- Local date helpers to avoid timezone shifts ----------
const ymdToDateLocal = (ymd: string) => {
  const [y, m, d] = (ymd || "").split("-").map(Number);
  return new Date(y || 0, (m || 1) - 1, d || 1);
};
const formatYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const combineYMDAndTime = (ymd: string, hhmm?: string) => {
  const out = ymdToDateLocal(ymd);
  if (hhmm && /^\d{2}:\d{2}$/.test(hhmm)) {
    const [h, m] = hhmm.split(":").map(Number);
    out.setHours(h || 0, m || 0, 0, 0);
  } else {
    // fallback to end of day when timeEnd missing
    out.setHours(23, 59, 59, 999);
  }
  return out;
};

export default function ParticipantsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || "";
  const { data: session } = useSession();
  const user = session?.user;

  // UI state
  const [loading, setLoading] = useState(true);

  // Toasts
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMsg, setSuccessToastMsg] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMsg, setErrorToastMsg] = useState("");

  // List + search
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchName, setSearchName] = useState("");

  // Role filter
  const [roleFilter, setRoleFilter] = useState("");

  // Program meta + requirements
  const [programCapacity, setProgramCapacity] = useState<number | null>(null);
  const [programVolunteerCapacity, setProgramVolunteerCapacity] = useState<number | null>(null);
  const [programTitle, setProgramTitle] = useState<string>("");
  const [programStatus, setProgramStatus] = useState<string>("");
  const [reqTextFields, setReqTextFields] = useState<SimpleField[]>([]);
  const [reqFileFields, setReqFileFields] = useState<SimpleField[]>([]);

  // Schedule fields
  const [eventType, setEventType] = useState<string>("single");
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>("");     // YYYY-MM-DD
  const [timeEnd, setTimeEnd] = useState<string>("");     // HH:mm
  const [timeStart, setTimeStart] = useState<string>("");

  // Participants/day config
  const [noParticipantLimit, setNoParticipantLimit] = useState<boolean>(false); // global no-limit for single-day OR whole program
  const [participantDays, setParticipantDays] = useState<number[]>([]); // per-day caps
  const [noParticipantLimitList, setNoParticipantLimitList] = useState<boolean[]>([]); // per-day no-limit flags for multi-day

  // Residents picker
  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [resSearch, setResSearch] = useState("");
  const residentPopUpRef = useRef<HTMLDivElement>(null);

  // Walk-in modal
  const [showAddWalkInModal, setShowAddWalkInModal] = useState(false);
  const [residentForAdd, setResidentForAdd] = useState<Resident | null>(null);

  // Edit modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const handleBack = () => {
    window.location.href = "/dashboard/ProgramsModule/ProgramsAndEvents";
  };
  const handleParticipantsClick = () => {
    if (programId) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists?programId=${programId}`);
    } else {
      router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists");
    }
  };
  const handleEditClick = () => {
    if (programId) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails?id=${programId}`);
    } else {
      router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails");
    }
  };

  // Load program meta (including dates and caps)
  useEffect(() => {
    let cancelled = false;
    const loadProgram = async () => {
      if (!programId) {
        setProgramCapacity(null);
        setProgramVolunteerCapacity(null);
        setProgramTitle("");
        setProgramStatus("");
        setReqTextFields([]);
        setReqFileFields([]);
        setEventType("single");
        setStartDate("");
        setEndDate("");
        setTimeEnd("");
        setTimeStart("");
        setNoParticipantLimit(false);
        setParticipantDays([]);
        setNoParticipantLimitList([]);
        return;
      }
      try {
        const refDoc = doc(db, "Programs", programId);
        const snap = await getDoc(refDoc);
        if (!cancelled && snap.exists()) {
          const d = snap.data() as any;

          const capParticipants = Number(d?.participants);
          const capVolunteers = Number(d?.volunteers);
          const noLimit = Boolean(d?.noParticipantLimit);

          setNoParticipantLimit(noLimit);
          setParticipantDays(Array.isArray(d?.participantDays) ? d.participantDays : []);
          setNoParticipantLimitList(Array.isArray(d?.noParticipantLimitList) ? d.noParticipantLimitList : []);

          // 🔧 IMPORTANT: null-out capacity when there's a global "no limit"
          if (noLimit) setProgramCapacity(null);
          else setProgramCapacity(Number.isFinite(capParticipants) ? capParticipants : null);

          setProgramVolunteerCapacity(Number.isFinite(capVolunteers) ? capVolunteers : null);
          setProgramTitle(d?.programName || "");
          setProgramStatus((d?.progressStatus || "").toString());
          setEventType(d?.eventType || "single");
          setStartDate(d?.startDate || "");
          setEndDate(d?.endDate || "");
          setTimeEnd(d?.timeEnd || "");
          setTimeStart(d?.timeStart || "");

          const tfs: SimpleField[] = Array.isArray(d?.requirements?.textFields)
            ? d.requirements.textFields
            : [];
          const ffs: SimpleField[] = Array.isArray(d?.requirements?.fileFields)
            ? d.requirements.fileFields
            : [];
          setReqTextFields(tfs);
          setReqFileFields(ffs);
        } else if (!cancelled) {
          setProgramCapacity(null);
          setProgramVolunteerCapacity(null);
          setProgramTitle("");
          setProgramStatus("");
          setReqTextFields([]);
          setReqFileFields([]);
          setEventType("single");
          setStartDate("");
          setEndDate("");
          setTimeEnd("");
          setTimeStart("");
          setNoParticipantLimit(false);
          setParticipantDays([]);
          setNoParticipantLimitList([]);
        }
      } catch {
        if (!cancelled) {
          setProgramCapacity(null);
          setProgramVolunteerCapacity(null);
          setProgramTitle("");
          setProgramStatus("");
          setReqTextFields([]);
          setReqFileFields([]);
          setEventType("single");
          setStartDate("");
          setEndDate("");
          setTimeEnd("");
          setTimeStart("");
          setNoParticipantLimit(false);
          setParticipantDays([]);
          setNoParticipantLimitList([]);
        }
      }
    };
    loadProgram();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  // Live list of approved participants
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "ProgramsParticipants");
    const qRef = programId
      ? query(
          colRef,
          where("programId", "==", programId),
          where("approvalStatus", "==", "Approved"),
          orderBy("fullName", "asc")
        )
      : query(colRef, where("approvalStatus", "==", "Approved"), orderBy("programName", "asc"));

    const unsub = onSnapshot(
      qRef,
      async (snap) => {
        const rows: Participant[] = [];
        const inits: Array<Promise<any>> = [];

        snap.forEach((docu) => {
          const d = docu.data() as any;
          const hasAttendance = typeof d.attendance === "boolean";
          const attendance = hasAttendance ? d.attendance : false;

          if (!hasAttendance) {
            inits.push(
              updateDoc(doc(db, "ProgramsParticipants", docu.id), { attendance: false }).catch(() => {})
            );
          }

          rows.push({
            id: docu.id,
            fullName: d.fullName ?? "",
            firstName: d.firstName ?? "",
            lastName: d.lastName ?? "",
            contactNumber: d.contactNumber ?? "",
            emailAddress: d.emailAddress ?? "",
            location: d.location ?? d.address ?? "",
            address: d.address ?? d.location ?? "",
            programId: d.programId ?? "",
            programName: d.programName ?? "",
            residentId: d.residentId ?? "",
            role: d.role ?? "Participant",
            approvalStatus: d.approvalStatus ?? "Approved",
            attendance,
            dayChosen: Number(d.dayChosen) ?? null,
          });
        });

        if (inits.length) Promise.allSettled(inits);

        setParticipants(rows);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setErrorToastMsg("Failed to load participants.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    );

    return () => unsub();
  }, [programId]);

  const [dayChosen, setDayChosen] = useState<number>(0);

  // Safety: default a day if multi-day
  useEffect(() => {
    if (
      eventType === "multiple" &&
      participantDays?.length > 0 &&
      (dayChosen === undefined || dayChosen === null || Number.isNaN(dayChosen))
    ) {
      setDayChosen(0);
    }
  }, [eventType, participantDays, dayChosen]);

  // 🔒 NEW: Hide Add when the selected day has already ended (now > end datetime)
  const isSelectedDayEnded = useMemo(() => {
    if (!startDate) return false;
    const now = new Date();

    if (eventType === "single") {
      const endDT = combineYMDAndTime(startDate, timeEnd || "23:59");
      return now > endDT;
    } else {
      const idx = Number.isInteger(dayChosen) ? dayChosen : 0;
      const start = ymdToDateLocal(startDate);
      const theDay = new Date(start);
      theDay.setDate(start.getDate() + idx);
      const theDayYMD = formatYMD(theDay);
      const endDT = combineYMDAndTime(theDayYMD, timeEnd || "23:59");
      return now > endDT;
    }
  }, [eventType, startDate, dayChosen, timeEnd]);

  // Search + Role filter
  const filteredParticipants = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    if (eventType === "single") {
      return participants.filter((p) => {
        const name = (p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim()).toLowerCase();
        const matchesName = !q || name.includes(q);

        const role = (p.role || "Participant").toLowerCase();
        const matchesRole = !roleFilter || role === roleFilter.toLowerCase();

        return matchesName && matchesRole;
      });
    } else {
      const participantsFiltered = participants.filter((p) => {
        const name = (p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim()).toLowerCase();
        const matchesName = !q || name.includes(q);

        const role = (p.role || "Participant").toLowerCase();
        const matchesRole = !roleFilter || role === roleFilter.toLowerCase();
        const matchesDay = p.dayChosen === dayChosen;

        if (role === "participant") {
          return matchesName && matchesRole && matchesDay;
        }
        if (role === "volunteer") {
          return matchesName && matchesRole;
        }
        return matchesName && matchesRole;
      });

      return participantsFiltered;
    }
  }, [searchName, roleFilter, participants, dayChosen, eventType]);

  // Role-specific counts
  const participantCount = useMemo(
    () => participants.filter((p) => (p.role || "Participant").toLowerCase() === "participant").length,
    [participants]
  );
  const volunteerCount = useMemo(
    () => participants.filter((p) => (p.role || "").toLowerCase() === "volunteer").length,
    [participants]
  );

  const multipleDayParticipantCount = useMemo(
    () =>
      participants.filter(
        (p) => (p.role || "Participant").toLowerCase() === "participant" && p.dayChosen === dayChosen
      ).length,
    [participants, dayChosen]
  );

  const badgeParticipantsText = useMemo(() => {
    if (eventType === "single") {
      if (noParticipantLimit) {
        return `Participants: ${participantCount}`;
      }
      return `Participants: ${participantCount} / ${programCapacity ?? "—"}`;
    } else {
      const idx = Number.isInteger(dayChosen) ? dayChosen : 0;
      const noLimitForDay = Boolean(noParticipantLimitList?.[idx]);
      if (noLimitForDay) {
        return `Participants: ${multipleDayParticipantCount}`;
      }
      const dayCap = participantDays?.[idx];
      return `Participants: ${multipleDayParticipantCount} / ${Number.isFinite(dayCap) ? dayCap : "—"}`;
    }
  }, [
    eventType,
    noParticipantLimit,
    participantCount,
    programCapacity,
    multipleDayParticipantCount,
    dayChosen,
    noParticipantLimitList,
    participantDays,
  ]);

  const badgeVolunteersText = useMemo(
    () => `Volunteers: ${volunteerCount} / ${programVolunteerCapacity ?? "—"}`,
    [volunteerCount, programVolunteerCapacity]
  );

  const isProgramClosed = useMemo(
    () => ["rejected", "completed"].includes((programStatus || "").toLowerCase()),
    [programStatus]
  );

  // ✅ Capacity check for Add (respects global and per-day no-limits)
  const isAtCapacity = useMemo(() => {
    if (eventType === "single") {
      if (noParticipantLimit) return false;
      return programCapacity !== null && participantCount >= programCapacity;
    }
    // multiple-day
    const idx = Number.isInteger(dayChosen) ? dayChosen : 0;
    const noLimitForDay = Boolean(noParticipantLimitList?.[idx]);
    if (noLimitForDay) return false;
    const dayCap = participantDays?.[idx];
    return Number.isFinite(dayCap) && multipleDayParticipantCount >= (dayCap as number);
  }, [
    eventType,
    noParticipantLimit,
    programCapacity,
    participantCount,
    dayChosen,
    noParticipantLimitList,
    participantDays,
    multipleDayParticipantCount,
  ]);

  const showVolunteerBadge = useMemo(
    () => typeof programVolunteerCapacity === "number" && programVolunteerCapacity > 0,
    [programVolunteerCapacity]
  );

  // Editable only when program is Ongoing
  const showAttendanceColumn = useMemo(
    () => ["ongoing", "completed"].includes((programStatus || "").toLowerCase()),
    [programStatus]
  );

  // Editable only when Ongoing (keep your rule)
  const isAttendanceEditable = useMemo(
    () => (programStatus || "").toLowerCase() === "ongoing",
    [programStatus]
  );

  // Time window guard for attendance checkbox
  const canEditAttendanceByTime = (p: Participant) => {
    const now = new Date();

    if (eventType === "single") {
      if (!startDate) return false;
      const startDT = combineYMDAndTime(startDate, timeStart || "00:00");
      const endDT = combineYMDAndTime(startDate, timeEnd || "23:59");
      return now >= startDT && now <= endDT;
    } else {
      if (!startDate) return false;
      const idx = typeof p.dayChosen === "number" ? p.dayChosen : 0;
      const start = ymdToDateLocal(startDate);
      const theDay = new Date(start);
      theDay.setDate(start.getDate() + idx);

      const theDayYMD = formatYMD(theDay);
      const startDT = combineYMDAndTime(theDayYMD, timeStart || "00:00");
      const endDT = combineYMDAndTime(theDayYMD, timeEnd || "23:59");
      return now >= startDT && now <= endDT;
    }
  };

  const openAddPopup = async () => {
    // Defensive block even though the button is hidden already
    if (isSelectedDayEnded) {
      setErrorToastMsg("You can’t add participants — the selected day has already ended.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }

    if (!programId) {
      setErrorToastMsg("To add a walk-in participant, open this page from a specific Program.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (isProgramClosed) {
      setErrorToastMsg(`This program is ${programStatus}. You can’t add participants.`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (isAtCapacity) {
      setErrorToastMsg("Program capacity reached. Cannot add more participants.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (residents.length === 0) {
      try {
        const snap = await getDocs(collection(db, "Residents"));
        const list: Resident[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setResidents(list);
      } catch {
        setErrorToastMsg("Failed to load Residents.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }
    }
    setShowResidentsPopup(true);
  };

  // Close residents popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (residentPopUpRef.current && !residentPopUpRef.current.contains(event.target as Node)) {
        setShowResidentsPopup(false);
      }
    };
    if (showResidentsPopup) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showResidentsPopup]);

  const filteredResidents = useMemo(() => {
    const q = resSearch.trim().toLowerCase();
    const arr = !q
      ? residents
      : residents.filter((r) =>
          (`${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.replace(/\s+/g, " ").trim()).toLowerCase().includes(q)
        );
    return [...arr].sort((a, b) => (Number(a.residentNumber || 0) - Number(b.residentNumber || 0)));
  }, [residents, resSearch]);

  const textFieldsToRender = useMemo<SimpleField[]>(
    () => (reqTextFields.length > 0 ? reqTextFields : FALLBACK_REQ_TEXT),
    [reqTextFields]
  );
  const fileFieldsToRender = useMemo<SimpleField[]>(() => reqFileFields, [reqFileFields]);

  // Duplicate guard on resident click
  const openResidentForm = async (resident: Resident) => {
    if (!programId) return;
    try {
      const dupQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", programId),
        where("residentId", "==", resident.id)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        setErrorToastMsg("This resident is already enlisted in this program.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }
      setResidentForAdd(resident);
      setShowResidentsPopup(false);
      setShowAddWalkInModal(true);
    } catch {
      setErrorToastMsg("Failed to check resident status. Please try again.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
  };

  const openManualEntry = () => {
    setResidentForAdd(null);
    setShowResidentsPopup(false);
    setShowAddWalkInModal(true);
  };

  const handleWalkInSaved = (msg = "Participant added successfully!") => {
    setShowAddWalkInModal(false);
    setResidentForAdd(null);
    setSuccessToastMsg(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);
  };

  const handleWalkInError = (msg: string) => {
    setErrorToastMsg(msg);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 3000);
  };

  const handleApprove = async (participantId: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", participantId), {
        approvalStatus: "Approved",
      });
      setSuccessToastMsg("Participant approved.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2200);
    } catch {
      setErrorToastMsg("Failed to approve participant.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
    }
  };

  const handleReject = async (participantId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", participantId), {
        approvalStatus: "Rejected",
        rejectionReason: reason,
      });
      setSuccessToastMsg("Participant rejected.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2200);
      setShowViewModal(false);
      setSelectedParticipant(null);
    } catch {
      setErrorToastMsg("Failed to reject participant.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
    }
  };

  const openEditModal = (p: Participant) => {
    setSelectedParticipant(p);
    setShowViewModal(true);
  };

  // Toggle attendance with optimistic UI (only if allowed right now)
  const handleToggleAttendance = async (p: Participant) => {
    if (!isAttendanceEditable) {
      setErrorToastMsg(`Attendance can only be updated when the program is Ongoing.`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
      return;
    }
    if (!canEditAttendanceByTime(p)) {
      setErrorToastMsg(`Attendance can’t be modified after the event day has ended.`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
      return;
    }

    const nextValue = !Boolean(p.attendance);

    setParticipants((prev) =>
      prev.map((row) => (row.id === p.id ? { ...row, attendance: nextValue } : row))
    );

    try {
      await updateDoc(doc(db, "ProgramsParticipants", p.id), { attendance: nextValue });
      setSuccessToastMsg("Attendance updated.");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 1800);
    } catch {
      setParticipants((prev) =>
        prev.map((row) => (row.id === p.id ? { ...row, attendance: !nextValue } : row))
      );
      setErrorToastMsg("Failed to update attendance.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2500);
    }
  };

  return (
    <main className="edit-program-main-container">
      <div className="program-redirectionpage-section">
        <button className="program-redirection-buttons" onClick={handleEditClick}>
          <div className="program-redirection-icons-section">
            <img src="/Images/audience.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Program Details</h1>
        </button>

        <button className="program-redirection-buttons-selected" onClick={handleParticipantsClick}>
          <div className="program-redirection-icons-section">
            <img src="/Images/team.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Participants</h1>
        </button>
      </div>

      <div className="edit-program-main-content-participants">
        <div className="edit-program-main-section1">
          <div className="edit-program-main-section1-left">
            <button onClick={handleBack}>
              <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1>{programTitle}</h1>
          </div>
          
          <div className="action-btn-section-program" style={{ display: "flex", gap: 8 }}>
            {eventType === "multiple" && (
              <div className="participants-count">
                <p>Select A Day:</p>
                <select
                  value={Number.isInteger(dayChosen) ? dayChosen : ""}
                  onChange={(e) => setDayChosen(Number(e.target.value))}
                >
                  <option value="" disabled hidden></option>
                  {participantDays.map((_, index) => (
                    <option value={index} key={index}>
                      {`Day ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="participants-count">{badgeParticipantsText}</div>
            {showVolunteerBadge && <div className="participants-count">{badgeVolunteersText}</div>}
          </div>
        </div>

        <div className="filter-section">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="programs-module-filter-role"
          >
            <option value="">All Roles</option>
            <option value="participant">Participant</option>
            <option value="volunteer">Volunteer</option>
          </select>

          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="programs-module-filter-participants"
          />

          {(user?.position === "Secretary" ||
            user?.position === "Assistant Secretary" ||
            user?.position === "Admin Staff") &&
            !isProgramClosed &&
            !isAtCapacity &&
            !isSelectedDayEnded && (
              <button
                type="button"
                title="Add participant"
                onClick={openAddPopup}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <img src="/Images/addicon.png" alt="Add Icon" className="add-icon" />
              </button>
          )}
        </div>

        <div className="edit-program-bottom-section-participants">
          <div className="participants-container">
            {loading ? (
              <div style={{ padding: 16, opacity: 0.8 }}>Loading participants…</div>
            ) : filteredParticipants.length === 0 ? (
              <div style={{ padding: 16, opacity: 0.8 }}>
                {roleFilter === "volunteer" ? "No volunteers found." : "No participants found."}
              </div>
            ) : (
              <table className="participants-table fixed-columns">
                <colgroup>
                  <col style={{ width: showAttendanceColumn ? "19%" : "22%" }} />
                  <col style={{ width: showAttendanceColumn ? "13%" : "14%" }} />
                  <col style={{ width: showAttendanceColumn ? "18%" : "20%" }} />
                  <col style={{ width: showAttendanceColumn ? "18%" : "20%" }} />
                  <col style={{ width: showAttendanceColumn ? "11%" : "12%" }} />
                  {showAttendanceColumn && <col style={{ width: "8%" }} />}
                </colgroup>

                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Contact Number</th>
                    <th>Email Address</th>
                    <th>Location</th>
                    <th>Role</th>
                    {showAttendanceColumn && <th>Attendance</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p) => {
                    const name = p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
                    const timeGate = canEditAttendanceByTime(p);
                    const canEditNow = isAttendanceEditable && timeGate; // still only editable when Ongoing + within time window

                    return (
                      <tr
                        key={p.id}
                        onClick={() => openEditModal(p)}
                        style={{ cursor: "pointer" }}
                        title="Click to view details"
                      >
                        <td className="td-truncate">{name}</td>
                        <td className="td-truncate">{p.contactNumber || ""}</td>
                        <td className="td-truncate">{p.emailAddress || ""}</td>
                        <td className="td-truncate">{p.location || p.address || ""}</td>
                        <td className="td-truncate">{p.role || "Participant"}</td>

                        {showAttendanceColumn && (
                          <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!p.attendance}
                              disabled={!canEditNow}   // Completed ⇒ visible but read-only
                              onChange={() => canEditNow && handleToggleAttendance(p)}
                              title={
                                canEditNow
                                  ? "Mark attendance"
                                  : (programStatus || "").toLowerCase() === "completed"
                                  ? "Read-only (program completed)"
                                  : !timeGate
                                  ? "Attendance locked — day has ended/not yet started"
                                  : `Attendance disabled — program is ${programStatus || "not ongoing"}`
                              }
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Residents Picker */}
      {showResidentsPopup && (
        <div className="program-popup-overlay">
          <div className="program-popup" ref={residentPopUpRef}>
            <div className="view-participant-backbutton-container">
              <button onClick={() => setShowResidentsPopup(false)}>
                <img src="/Images/left-arrow.png" alt="Left Arrow" className="participant-back-btn-resident" />
              </button>
            </div>

            <h2>Residents List</h2>
            <h1>* Please select Resident's Name *</h1>

            <div className="manual-add-button-section">
              <button
                className="add-non-resident-button"
                onClick={openManualEntry}
                title="Add a non-resident walk-in"
              >
                Manual Entry <br />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search Resident's Name"
              className="program-search-input"
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
            />

            <div className="program-list" style={{ maxHeight: 360, overflow: "auto" }}>
              {residents.length === 0 ? (
                <p style={{ padding: 12 }}>No residents found.</p>
              ) : (
                <table className="program-table">
                  <thead>
                    <tr>
                      <th>Resident Number</th>
                      <th>First Name</th>
                      <th>Middle Name</th>
                      <th>Last Name</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((resident) => (
                      <tr
                        key={resident.id}
                        className="program-table-row"
                        style={{ cursor: "pointer" }}
                        onClick={() => openResidentForm(resident)}
                      >
                        <td>{resident.residentNumber ?? ""}</td>
                        <td>{resident.firstName ?? ""}</td>
                        <td>{resident.middleName ?? ""}</td>
                        <td>{resident.lastName ?? ""}</td>
                        <td>{resident.address ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddWalkInModal && (
        <AddWalkInParticipantModal
          isOpen={showAddWalkInModal}
          onClose={() => {
            setShowAddWalkInModal(false);
            setResidentForAdd(null);
          }}
          onBack={() => {
            setShowAddWalkInModal(false);
            setShowResidentsPopup(true);
          }}
          programId={programId}
          programName={programTitle}
          textFields={textFieldsToRender}
          fileFields={fileFieldsToRender}
          resident={residentForAdd}
          onSaved={handleWalkInSaved}
          onError={handleWalkInError}
          prettyLabels={PRETTY_LABELS}
        />
      )}

      {showViewModal && selectedParticipant && (
        <ViewApprovedParticipantModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedParticipant(null);
          }}
          participant={selectedParticipant}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showSuccessToast && (
        <div className="popup-overlay-add-program show">
          <div className="popup-add-program">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{successToastMsg}</p>
          </div>
        </div>
      )}
      {showErrorToast && (
        <div className="error-popup-overlay-add-program show">
          <div className="popup-add-program">
            <img src="/Images/warning-1.png" alt="popup icon" className="icon-alert" />
            <p>{errorToastMsg}</p>
          </div>
        </div>
      )}
    </main>
  );
}
