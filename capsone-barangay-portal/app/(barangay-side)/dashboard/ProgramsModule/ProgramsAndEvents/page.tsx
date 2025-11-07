"use client";
import "@/CSS/ProgramsBrgy/Programs.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AddNewProgramModal from "@/app/(barangay-side)/components/AddNewProgramModal";
import EditParticipantModal from "@/app/(barangay-side)/components/EditParticipantModal";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, updateDoc, where, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/db/firebase";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/db/firebase";
import { getDoc, getDocs, addDoc } from "firebase/firestore";


type Program = {
  id: string;
  programName: string;
  approvalStatus: "Approved" | "Pending" | "Rejected";
  progressStatus: "Ongoing" | "Upcoming" | "Completed" | "Rejected"; // includes Rejected
  activeStatus: "Active" | "Inactive" | "Rejected"; // includes Rejected
  createdAt?: Timestamp | null;
  dateCreated: string;
  startDate: string;
  timeStart: string;
  eventType?: "single" | "multiple";
  endDate?: string;
  timeEnd?: string;
  programSummary?: string;
};

type Participant = {
  id: string;
  programId?: string; // <<— now using programId as the linkage
  residentId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  emailAddress?: string;
  email?: string;
  role?: string;
  location?: string;
  address?: string;
  programName?: string; // kept for display/search
  idImageUrl?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  dayChosen?: number;  
};

type ParticipantRecord = {
  id: string;
  programId?: string;
  residentId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  contact?: string;
  emailAddress?: string;
  email?: string;
  role?: "Participant" | "Volunteer" | string;
  location?: string;
  address?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  attendance?: { present?: boolean };
};


//  helpers: safe date parsing & single status decider
const parseYMD = (s?: string | null): Date | null => {
  if (!s || typeof s !== "string") return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight
};

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

/** Decide BOTH progress and active in one shot (no date checks if Rejected) */
const decideStatuses = (p: any): {
  progress: Program["progressStatus"];
  active: Program["activeStatus"];
} => {
  const approval: Program["approvalStatus"] = p?.approvalStatus ?? "Pending";

  // Rejected hard-stop
  if (approval === "Rejected") {
    return { progress: "Rejected", active: "Rejected" };
  }

  // --- compute progress using start/end + timeEnd ---
  const s = parseYMD(p?.startDate);
  const e = parseYMD(p?.endDate);
  const now = new Date();

  const combineDateTime = (date: Date, timeStr?: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    if (timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
      const [hh, mm] = timeStr.split(":").map(Number);
      d.setHours(hh || 0, mm || 0, 0);
    } else {
      d.setHours(23, 59, 59, 999);
    }
    return d;
  };

  let progress: Program["progressStatus"] =
    (p?.progressStatus as Program["progressStatus"]) || "Upcoming";

  if (s) {
    const isSingle =
      p?.eventType === "single" || (!!e && s.getTime() === (e as Date).getTime());

    const startDT = combineDateTime(s, p?.timeStart || "00:00");
    const endDT = combineDateTime(e || s, p?.timeEnd || "23:59");

    if (isSingle) {
      if (now < (startDT as Date)) progress = "Upcoming";
      else if (now <= (endDT as Date)) progress = "Ongoing";
      else progress = "Completed";
    } else if (e) {
      if (now < (startDT as Date)) progress = "Upcoming";
      else if (now > (endDT as Date)) progress = "Completed";
      else progress = "Ongoing";
    }
  }

  // --- compute active ---
  // Force cases
  if (progress === "Completed") return { progress, active: "Inactive" };

  // Pending defaults to Inactive
  if (approval === "Pending") {
    return { progress, active: "Inactive" };
  }

  // Otherwise (Upcoming/Ongoing & Approved): RESPECT existing stored activeStatus if present
  const stored = p?.activeStatus as Program["activeStatus"] | undefined;
  if (stored === "Active" || stored === "Inactive") {
    return { progress, active: stored };
  }

  // Default when nothing stored yet
  return { progress, active: "Active" };
};



function tsToYMD(ts?: Timestamp | null): string {
  try {
    if (!ts) return "";
    const d = ts.toDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

const fetchResidentUidMap = async (residentIds: string[]): Promise<Map<string, string>> => {
  const clean = Array.from(new Set(residentIds.filter(Boolean)));
  const map = new Map<string, string>();
  if (clean.length === 0) return map;
  const CHUNK = 10;
  for (let i = 0; i < clean.length; i += CHUNK) {
    const slice = clean.slice(i, i + CHUNK);
    const snap = await getDocs(
      query(collection(db, "ResidentUsers"), where("residentId", "in", slice))
    );
    snap.forEach((d) => {
      const data = d.data() as any;
      const rid = data?.residentId;
      const uid = data?.uid || d.id;
      if (rid && uid) map.set(String(rid), String(uid));
    });
  }
  return map;
};

export default function ProgramsModule() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  // ── Role gates
  const position: string = user?.position ?? "";
  const canViewPendingPrograms = position === "Punong Barangay";
  const canViewPendingParticipants =
    position === "Assistant Secretary" || position === "Secretary";

  // NEW: who can see/use Delete
  const canDelete = useMemo(
    () =>
      ["Punong Barangay", "Secretary", "Assistant Secretary"].includes(
        position
      ),
    [position]
  );

  const allowedSections = useMemo<
    Array<"main" | "programs" | "participants">
  >(() => {
    const base: Array<"main" | "programs" | "participants"> = ["main"];
    if (canViewPendingPrograms) base.push("programs");
    if (canViewPendingParticipants) base.push("participants");
    return base;
  }, [canViewPendingPrograms, canViewPendingParticipants]);

  const searchParams = useSearchParams();

  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsAssignedData, setProgramsAssignedData] = useState<Program[]>(
    []
  );
  const [participantsListsData, setParticipantsListsData] = useState<
    Participant[]
  >([]);

  const [activeSectionRedirection, setActiveSectionRedirection] = useState<
    "main" | "programs" | "participants"
  >("main");

  // Toasts (success / error)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (type: "success" | "error", msg: string, ms = 1800) => {
    setToastType(type);
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), ms);
  };

  const [showSuccessGenerateReportPopup, setShowSuccessGenerateReportPopup] = useState(false);
  const [popupSuccessGenerateReportMessage, setPopupSuccessGenerateReportMessage] = useState("");
  const [showErrorGenerateReportPopup, setShowErrorGenerateReportPopup] = useState(false);
  const [popupErrorGenerateReportMessage, setPopupErrorGenerateReportMessage] = useState("");

  //  Custom Delete Confirmation Modal
  type ConfirmState =
    | { open: false }
    | {
        open: true;
        kind: "program" | "participant";
        id: string;
        label?: string; // e.g., Program Name: X / Participant: Y
      };

  const [confirmDel, setConfirmDel] = useState<ConfirmState>({ open: false });

  const askConfirmDeleteProgram = (p: Program) => {
    if (!canDelete)
      return showToast("error", "You don't have permission to delete.");
    setConfirmDel({
      open: true,
      kind: "program",
      id: p.id,
      label: `Program Name: ${p.programName}`,
    });
  };
  const askConfirmDeleteParticipant = (participant: Participant) => {
    if (!canDelete)
      return showToast("error", "You don't have permission to delete.");
    setConfirmDel({
      open: true,
      kind: "participant",
      id: participant.id,
      label: `Participant: ${participant.fullName || ""}`,
    });
  };

  const handleConfirmNo = () => setConfirmDel({ open: false });

  const handleConfirmYes = async () => {
    if (!confirmDel.open) return;
    if (!canDelete)
      return showToast("error", "You don't have permission to delete.");
    const { kind, id } = confirmDel;

    setConfirmDel({ open: false }); // close modal immediately
    try {
      if (kind === "program") {
        await deleteDoc(doc(db, "Programs", id));
        showToast("success", "Program deleted successfully!");
      } else {
        await deleteDoc(doc(db, "ProgramsParticipants", id));
        showToast("success", "Participant deleted successfully!");
      }
    } catch {
      showToast(
        "error",
        kind === "program"
          ? "Failed to delete program."
          : "Failed to delete participant."
      );
    }
  };

  // Load Programs from Firestore (and auto-fix progress/active atomically)
  useEffect(() => {
    const q = query(collection(db, "Programs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const list: Program[] = [];
        const updates: Promise<any>[] = [];

        snap.forEach((docu) => {
          const d = docu.data() as any;

          const { progress, active } = decideStatuses(d);
          const approval: Program["approvalStatus"] =
            d.approvalStatus ?? "Pending";

          // Prepare single atomic patch if needed
          const patch: Record<string, any> = {};
          if (d.progressStatus !== progress) patch.progressStatus = progress;
          if (d.activeStatus !== active) patch.activeStatus = active;

          if (Object.keys(patch).length) {
            updates.push(updateDoc(doc(db, "Programs", docu.id), patch));
          }

          const startDate = d.startDate || "";
          const dateCreated =
            tsToYMD(d.createdAt ?? null) || d.dateCreated || "";
          list.push({
            id: docu.id,
            programName: d.programName ?? "",
            approvalStatus: approval,
            progressStatus: progress,
            activeStatus: active,
            createdAt: d.createdAt ?? null,
            dateCreated,
            startDate,
            timeStart: d.timeStart || "",
            eventType: d.eventType || "single",
            endDate: d.endDate || "",
            timeEnd: d.timeEnd || "",
            programSummary: d.programSummary || "",           
          });
        });

        if (updates.length) void Promise.allSettled(updates);

        const nonPending = list.filter((p) => p.approvalStatus !== "Pending");
        const pending = list.filter((p) => p.approvalStatus === "Pending");
        setPrograms(nonPending);
        setProgramsAssignedData(pending);
        setLoadingPrograms(false);
      },
      () => {
        setLoadingPrograms(false);
      }
    );
    return () => unsub();
  }, []);

  // Load Participants from Firestore (only Pending)
  useEffect(() => {
    const q = query(
      collection(db, "ProgramsParticipants"),
      where("approvalStatus", "==", "Pending"),
      orderBy("programName", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Participant[] = [];
        snap.forEach((docu) => {
          const d = docu.data() as any;
          list.push({
            id: docu.id,
            programId: d.programId ?? d.programID ?? "",
            residentId: d.residentId ?? "",
            fullName: d.fullName ?? "",
            firstName: d.firstName ?? "",
            lastName: d.lastName ?? "",
            contactNumber: d.contactNumber ?? "",
            emailAddress: d.emailAddress ?? d.email ?? "",
            email: d.email ?? d.emailAddress ?? "",
            location: d.location ?? d.address ?? "",
            address: d.address ?? d.location ?? "",
            programName: d.programName ?? "",
            idImageUrl: d.idImageUrl ?? "",
            approvalStatus: d.approvalStatus ?? "Pending",
            role: d.role ?? "",
            dayChosen:
              typeof d.dayChosen === "number" ? d.dayChosen : undefined,
          });
        });
        setParticipantsListsData(list);
        setLoadingParticipants(false);
      },
      () => {
        setLoadingParticipants(false);
      }
    );
    return () => unsub();
  }, []);


  // Section routing sync — enforce role access on URL
  const handleSectionSwitch = (section: "main" | "programs" | "participants") => {
    if (!allowedSections.includes(section)) return; // hard guard
    setActiveSectionRedirection(section);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", section);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const section = searchParams.get("section") as
      | "main"
      | "programs"
      | "participants"
      | null;

    const target: "main" | "programs" | "participants" =
      section && allowedSections.includes(section) ? section : "main";

    setActiveSectionRedirection(target);

    // Keep URL in sync (correct if user isn't allowed)
    if (section !== target) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", target);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, allowedSections]);

  const handleEditClick = (id: string) => {
    router.push(
      `/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails?id=${id}`
    );
  };

  // Add Program Modal
  const [showAddProgramsPopup, setShowAddProgramsPopup] = useState(false);

  // Main programs filtering
  const [searchName, setSearchName] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);

  useEffect(() => {
    let filtered = [...programs];
    if (searchName)
      filtered = filtered.filter((p) =>
        p.programName.toLowerCase().includes(searchName.toLowerCase())
      );
    if (approvalFilter)
      filtered = filtered.filter((p) => p.approvalStatus === approvalFilter);
    if (progressFilter)
      filtered = filtered.filter((p) => p.progressStatus === progressFilter);
    if (activeFilter)
      filtered = filtered.filter((p) => p.activeStatus === activeFilter);
    setFilteredPrograms(filtered);
  }, [searchName, approvalFilter, progressFilter, activeFilter, programs]);

  // Main programs pagination
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 10;
  const indexOfLast = currentPage * programsPerPage;
  const indexOfFirst = indexOfLast - programsPerPage;
  //const currentPrograms = filteredPrograms.slice(indexOfFirst, indexOfLast);

  // new for programSummary
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryProgram, setSummaryProgram] = useState<Program | null>(null);
  const [summaryText, setSummaryText] = useState("");  

  const openSummaryModalForProgram = (program: Program) => {
    setSummaryProgram(program);
    setSummaryText(program.programSummary || "");
    setSummaryModalOpen(true);
  };

  const closeSummaryModal = () => {
    setSummaryModalOpen(false);
    setSummaryProgram(null);
    setSummaryText("");
  };

  const handleSaveProgramSummary = async () => {
    if (!summaryProgram) return;
    const trimmed = summaryText.trim();

    try {
      await updateDoc(doc(db, "Programs", summaryProgram.id), {
        programSummary: trimmed,
      });

      // Update local state so UI reflects the saved summary
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === summaryProgram.id ? { ...p, programSummary: trimmed } : p
        )
      );
      setProgramsAssignedData((prev) =>
        prev.map((p) =>
          p.id === summaryProgram.id ? { ...p, programSummary: trimmed } : p
        )
      );

      showToast("success", "Program summary saved.");
      closeSummaryModal();
    } catch (e) {
      console.error("Failed to save program summary:", e);
      showToast("error", "Failed to save program summary.");
    }
  };
    

  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
  const order = {
    Upcoming: 1,
    Ongoing: 2,
    Completed: 3,
    Rejected: 4,
  };
  return (order[a.progressStatus] || 99) - (order[b.progressStatus] || 99);
});

const currentPrograms = sortedPrograms.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () =>
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  const getPageNumbers = () => {
    const pageNumbersToShow: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pageNumbersToShow.push(i);
      } else if (
        (i === currentPage - 2 || i === currentPage + 2) &&
        pageNumbersToShow[pageNumbersToShow.length - 1] !== "..."
      ) {
        pageNumbersToShow.push("...");
      }
    }
    return pageNumbersToShow;
  };

  // Participants filtering
  const [participantNameSearch, setParticipantNameSearch] = useState("");
  const [participantProgramSearch, setParticipantProgramSearch] = useState("");
  const [participantRoleFilter, setParticipantRoleFilter] = useState("");
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);

  useEffect(() => {
    let filtered = [...participantsListsData];
    if (participantNameSearch.trim()) {
      filtered = filtered.filter((p) =>
        (p.fullName || "")
          .toLowerCase()
          .includes(participantNameSearch.toLowerCase())
      );
    }
    if (participantProgramSearch.trim()) {
      filtered = filtered.filter((p) =>
        (p.programName || "")
          .toLowerCase()
          .includes(participantProgramSearch.toLowerCase())
      );
    }

    if (participantRoleFilter) {
      filtered = filtered.filter((p) => p.role === participantRoleFilter);
    }

    setFilteredParticipants(filtered);
    setParticipantsPage(1);
  }, [
    participantNameSearch,
    participantProgramSearch,
    participantRoleFilter,
    participantsListsData,
  ]);

  // Participants pagination
  const [participantsPage, setParticipantsPage] = useState(1);
  const participantsPerPage = 10;
  const indexOfLastParticipant = participantsPage * participantsPerPage;
  const indexOfFirstParticipant = indexOfLastParticipant - participantsPerPage;
  const currentParticipants = filteredParticipants.slice(
    indexOfFirstParticipant,
    indexOfLastParticipant
  );
  const participantsTotalPages = Math.ceil(
    filteredParticipants.length / participantsPerPage
  );
  const paginateParticipants = (pageNumber: number) =>
    setParticipantsPage(pageNumber);
  const nextParticipantsPage = () =>
    setParticipantsPage((prev) =>
      prev < participantsTotalPages ? prev + 1 : prev
    );
  const prevParticipantsPage = () =>
    setParticipantsPage((prev) => (prev > 1 ? prev - 1 : prev));

  // Pending programs filtering
  const [pendingSearchName, setPendingSearchName] = useState("");
  const [pendingApprovalFilter, setPendingApprovalFilter] =
    useState("Pending");
  const [pendingProgressFilter, setPendingProgressFilter] = useState("");
  const [pendingActiveFilter, setPendingActiveFilter] = useState("");
  const [filteredPendingPrograms, setFilteredPendingPrograms] = useState<
    Program[]
  >([]);

  useEffect(() => {
    let filtered = [...programsAssignedData];
    if (pendingSearchName)
      filtered = filtered.filter((p) =>
        p.programName.toLowerCase().includes(pendingSearchName.toLowerCase())
      );
    if (pendingApprovalFilter)
      filtered = filtered.filter(
        (p) => p.approvalStatus === pendingApprovalFilter
      );
    if (pendingProgressFilter)
      filtered = filtered.filter(
        (p) => p.progressStatus === pendingProgressFilter
      );
    if (pendingActiveFilter)
      filtered = filtered.filter((p) => p.activeStatus === pendingActiveFilter);
    setFilteredPendingPrograms(filtered);
  }, [
    pendingSearchName,
    pendingApprovalFilter,
    pendingProgressFilter,
    pendingActiveFilter,
    programsAssignedData,
  ]);

  // Pending programs pagination
  const [pendingProgramsPage, setPendingProgramsPage] = useState(1);
  const pendingProgramsPerPage = 10;
  const indexOfLastPending = pendingProgramsPage * pendingProgramsPerPage;
  const indexOfFirstPending = indexOfLastPending - pendingProgramsPerPage;
  const currentPendingPrograms = filteredPendingPrograms.slice(
    indexOfFirstPending,
    indexOfLastPending
  );
  const pendingTotalPages = Math.ceil(
    filteredPendingPrograms.length / pendingProgramsPerPage
  );
  const paginatePending = (pageNumber: number) =>
    setPendingProgramsPage(pageNumber);
  const nextPendingPage = () =>
    setPendingProgramsPage((prev) =>
      prev < pendingTotalPages ? prev + 1 : prev
    );
  const prevPendingPage = () =>
    setPendingProgramsPage((prev) => (prev > 1 ? prev - 1 : prev));

  // Participant modal state
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);

  const openParticipantModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsParticipantModalOpen(true);
  };

  const closeParticipantModal = () => {
    setIsParticipantModalOpen(false);
    setSelectedParticipant(null);
  };

  // Participant edit save
  const handleParticipantSave = async (updated: Participant) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", updated.id), {
        programId: updated.programId ?? "", // keep programId when editing
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        fullName:
          updated.fullName ??
          `${updated.firstName || ""} ${updated.lastName || ""}`.trim(),
        contactNumber: updated.contactNumber ?? "",
        emailAddress: updated.emailAddress ?? updated.email ?? "",
        email: updated.email ?? updated.emailAddress ?? "",
        location: updated.location ?? updated.address ?? "",
        address: updated.address ?? updated.location ?? "",
        programName: updated.programName ?? "",
      });
      setParticipantsListsData((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      showToast("success", "Participant changes saved.");
    } catch (e) {
      showToast("error", "Failed to save participant changes.");
    }
  };

  const sendApprovedSMS = async (contactNumber: string, fullName: string, programName: string, role: string, timeStart: string) => {
    try {
      const response = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            to: contactNumber,
            message: `Good day, ${fullName}. Your registration for "${programName}" as ${role} has been approved.
            \n\nKindly be at the venue before ${timeStart} and present a valid ID upon entry for verification.
            \n\nThank you for your cooperation and active participation in our barangay program!`



        })
      });   
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 

      } catch (error) {
        console.error("Error sending SMS:", error);

    }
  }
    const toAmPm = (hhmm?: string | null): string => {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
    const [hStr, mStr] = hhmm.split(":");
    let h = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  };

    // Participant approve
  const handleParticipantApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", id), {
        approvalStatus: "Approved",
      });
      showToast("success", "Participant approved.");

      const participant = participantsListsData.find((p) => p.id === id);

      if (participant) {
        // default/fallbacks
        let formattedTime = "";
        let role = participant.role || "Participant";

        // Try to fetch timeStart from the linked Program
        const programId = (participant.programId || "").trim();
        if (programId) {
          try {
            const progSnap = await getDoc(doc(db, "Programs", programId));
            const progData = progSnap.exists() ? (progSnap.data() as any) : null;
            const rawTimeStart: string | undefined = progData?.timeStart; // e.g., "13:30"
            formattedTime = toAmPm(rawTimeStart) || ""; // e.g., "1:30 PM"
          } catch (err) {
            // silently ignore; we'll keep fallback
            console.error("Failed to fetch program timeStart:", err);
          }
        }

        // Nice fallback text if time missing
        const timeForSms = formattedTime || "the scheduled start time";

        // await sendApprovedSMS(
        //   participant.contactNumber || "",
        //   participant.fullName || "",
        //   participant.programName || "",
        //   role,
        //   timeForSms
        // );
      }
    } catch (e) {
      showToast("error", "Failed to approve participant.");
    }
  };


  const sendRejectionSMS = async (contactNumber: string, fullName: string, programName: string, reason: string, role:string ) => {
    try {
      const response = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: contactNumber,
message: `Good day, ${fullName}. We regret to inform you that your registration for "${programName}" as ${role} has been declined.
          \n\nReason: ${reason}
          \n\nWe value your willingness to take part in our community initiatives. 
          \n\n\We encourage you to join our upcoming programs and continue being involved in our barangay activities. 
          Thank you for your cooperation and understanding.`
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      
    }
  }

  // Participant reject
  const handleParticipantReject = async (id: string, reason: string) => {
    try {
      await updateDoc(doc(db, "ProgramsParticipants", id), {
        approvalStatus: "Rejected",
        rejectionReason: reason,
      });
      showToast("success", "Participant rejected.");
      const participant = participantsListsData.find((p) => p.id === id);
      if (participant) {
         sendRejectionSMS(participant.contactNumber || "", participant.fullName || "", participant.programName || "", reason, participant.role||""); // send rejection SMS
      }
    } catch {
      showToast("error", "Failed to reject participant.");
    }
  };

  

  const allProgramsForMap = useMemo(
    () => [...programs, ...programsAssignedData],
    [programs, programsAssignedData]
  );

const programInfoMap = useMemo(() => {
  const m = new Map<
    string,
    {
      name: string;
      status: Program["progressStatus"];
      eventType?: Program["eventType"];
      startDate?: string;
      endDate?: string;
      timeEnd?: string;
    }
  >();
  allProgramsForMap.forEach((p) =>
    m.set(p.id, {
      name: p.programName,
      status: p.progressStatus,
      eventType: p.eventType,
      startDate: p.startDate,
      endDate: p.endDate,
      timeEnd: p.timeEnd,
    })
  );
  return m;
}, [allProgramsForMap]);


const autoRejectRunning = useRef(false);

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

useEffect(() => {
  if (loadingParticipants || loadingPrograms) return;
  if (autoRejectRunning.current) return;

  const toReject = participantsListsData.filter((pp) => {
    const isPending = (pp.approvalStatus ?? "Pending") === "Pending";
    const pid = (pp.programId || "").trim();
    if (!isPending || !pid) return false;

    const pinfo = programInfoMap.get(pid);
    if (!pinfo) return false;

    const status = pinfo.status;
    const eventType = pinfo.eventType || "single";

    if (status === "Completed") return true;

    if (status === "Ongoing" && eventType === "single") return true;

    if (status === "Ongoing") {
      // try to detect eventType properly if missing
      const inferredType =
        pinfo.eventType ||
        (pinfo.endDate && pinfo.endDate !== pinfo.startDate ? "multiple" : "single");
      const eventType = inferredType || "single";

      if (eventType === "single") return true;

      if (eventType === "multiple") {
        const idx = typeof pp.dayChosen === "number" ? pp.dayChosen : null;
        const baseYMD = pinfo.startDate || "";
        if (!baseYMD || idx == null) return true;

        const [y, m, d] = baseYMD.split("-").map(Number);
        const base = new Date(y, (m ?? 1) - 1, d ?? 1);
        base.setHours(0, 0, 0, 0);

        const dayDate = new Date(base);
        dayDate.setDate(base.getDate() + idx);
        dayDate.setHours(0, 0, 0, 0);

        const today = startOfToday();

        // ❌ Only reject if chosen day is before today
        if (dayDate < today) return true;

        // ✅ Keep pending if today or later
        return false;
      }
    }


    // Upcoming or other states → don't auto-reject
    return false;
  });

  if (toReject.length === 0) return;

  const run = async () => {
    autoRejectRunning.current = true;
    try {
      const residentIds = toReject
        .map((p) => p.residentId || "")
        .filter(Boolean);
      const residentUidMap = await fetchResidentUidMap(residentIds);

      const CHUNK = 200;
      for (let i = 0; i < toReject.length; i += CHUNK) {
        const slice = toReject.slice(i, i + CHUNK);
        const batch = writeBatch(db);

        slice.forEach((pp) => {
          const ref = doc(db, "ProgramsParticipants", pp.id);
          batch.update(ref, {
            approvalStatus: "Rejected",
            rejectionReason:
              "Automatically rejected: the schedule for your chosen day has already passed.",
            autoRejectedAt: serverTimestamp(),
            autoRejectedBy: user?.email || "system",
          });

          const pinfo = programInfoMap.get(pp.programId || "");
          const pStatus = pinfo?.status || "Ongoing";
          const pName = pinfo?.name || pp.programName || "";
          const residentUid =
            pp.residentId && residentUidMap.has(pp.residentId)
              ? residentUidMap.get(pp.residentId)
              : null;

          const notifRef = doc(collection(db, "Notifications"));
          batch.set(notifRef, {
            residentID: residentUid || null,
            participantID: pp.id,
            programId: pp.programId || null,
            programName: pName || "",
            role: pp.role || "Participant",
            message: `Your registration for ${
              pName || "the program"
            } as ${
              pp.role || "Participant"
            } has been rejected because the schedule for your chosen day has already passed. You may still participate by registering onsite if allowed.`,
            timestamp: serverTimestamp(),
            transactionType: "Program Registration",
            isRead: false,
          });
        });

        await batch.commit();
      }

      showToast(
        "success",
        `Auto-rejected ${toReject.length} pending participant${
          toReject.length > 1 ? "s" : ""
        } whose chosen day has already passed.`,
        3000
      );
    } catch (e) {
      console.error("Auto-reject failed:", e);
      showToast("error", "Auto-reject failed for some participants.");
    } finally {
      autoRejectRunning.current = false;
    }
  };

  void run();
}, [
  loadingParticipants,
  loadingPrograms,
  participantsListsData,
  programInfoMap,
  user?.email,
]);


  // participant report

const didAttend = (rec: ParticipantRecord) => {
  return Boolean(rec.attendance);
};

const safeFullName = (rec: ParticipantRecord) => {
  if (rec.fullName && rec.fullName.trim()) return rec.fullName;
  const f = rec.firstName || "";
  const l = rec.lastName || "";
  const s = `${f} ${l}`.trim();
  return s || "—";
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const fetchProgramParticipants = async (programId: string): Promise<ParticipantRecord[]> => {
  // ProgramsParticipants
  const snap1 = await getDocs(
    query(collection(db, "ProgramsParticipants"), where("programId", "==", programId))
  );
  const a: ParticipantRecord[] = snap1.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  // ProgramParticipants (singular "Program")
  const snap2 = await getDocs(
    query(collection(db, "ProgramParticipants"), where("programId", "==", programId))
  );
  const b: ParticipantRecord[] = snap2.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  // Merge by id
  const map = new Map<string, ParticipantRecord>();
  [...a, ...b].forEach(rec => map.set(rec.id, rec));
  return Array.from(map.values());
};


  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");
    const [loadingProgramSummary, setLoadingProgramSummary] = useState(false);    
  

const generateProgramSummaryXlsx = async (
  programId: string,
  fallbackName?: string
): Promise<string | null> => {
  try {
    setLoadingProgramSummary?.(true);
    setIsGenerating?.(true);
    setGeneratingMessage?.("Generating Program Summary Report...");

    // Load program
    const progSnap = await getDoc(doc(db, "Programs", programId));
    if (!progSnap.exists()) {
      showToast("error", "Program not found.");
      return null;
    }
    const p: any = { id: programId, ...progSnap.data() };

    // Only allow when Completed
    const progress: string = p.progressStatus || "";
    if (progress !== "Completed") {
      showToast("error", "Report is only available for Completed programs.");
      return null;
    }

    // Build workbook with 2 sheets
    const wb = new ExcelJS.Workbook();
    const wsInfo = wb.addWorksheet("Program Info");
    const wsList = wb.addWorksheet("Participants & Volunteers");

    // === Sheet 1: Program Info ===
    const programName = p.programName || fallbackName || programId;

    /**
     * Helper for big wrapped blocks (Description / Summary)
     * Fixed font size; split into multiple rows so Excel can paginate nicely.
     */
    const addWrappedBlock = (title: string, text: string) => {
      const content = String(text || "");
      const bodySize = 16;
      const headerSize = 16;
      const maxCharsPerRow = 120; // soft wrap target

      wsInfo.addRow([]);

      // --- HEADER ROW (MERGED A..F) ---
      const headerRow = wsInfo.addRow([title]);
      const headerRowNum = headerRow.number;
      wsInfo.mergeCells(`A${headerRowNum}:F${headerRowNum}`);
      const headerCell = wsInfo.getCell(`A${headerRowNum}`);
      headerCell.font = { name: "Calibri", size: headerSize, bold: true };
      headerCell.alignment = {
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
      };

      // --- BODY: split into logical "lines" and add one row per line ---
      const lines: string[] = [];
      const paragraphs = content.split(/\r?\n/);

      paragraphs.forEach((para) => {
        let s = para.trim();
        if (!s) {
          lines.push("");
          return;
        }

        while (s.length > maxCharsPerRow) {
          let breakPos = s.lastIndexOf(" ", maxCharsPerRow);
          if (breakPos <= 0) breakPos = maxCharsPerRow;
          lines.push(s.slice(0, breakPos));
          s = s.slice(breakPos).trim();
        }
        if (s) lines.push(s);
      });

      if (lines.length === 0) {
        lines.push("");
      }

      lines.forEach((line) => {
        const row = wsInfo.addRow([line]);
        const rn = row.number;
        wsInfo.mergeCells(`A${rn}:F${rn}`);
        const cell = wsInfo.getCell(`A${rn}`);
        cell.font = { name: "Calibri", size: bodySize };
        cell.alignment = {
          wrapText: true,
          vertical: "top",
          horizontal: "justify",
        };
      });
    };

    // Title row
    wsInfo.mergeCells("A1:F1");
    const headerCell = wsInfo.getCell("A1");
    headerCell.value = {
      richText: [
        {
          text: "BARANGAY FAIRVIEW\n",
          font: { name: "Calibri", size: 20, bold: true },
        },
        {
          text: "PROGRAM SUMMARY REPORT\n",
          font: { name: "Calibri", size: 20, bold: true },
        },
        {
          text: `(${programName})`,
          font: { name: "Calibri", size: 16, italic: true },
        },
      ],
    };
    headerCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    wsInfo.getRow(1).height = 70;
    wsInfo.addRow([]);

    const eventType = p.eventType || "single";
    const sDate = fmtDate(p.startDate);
    const eDate = p.endDate ? fmtDate(p.endDate) : "";

    const rawStart: string = p.timeStart || "";
    const rawEnd: string = p.timeEnd || "";
    const tStart = toAmPm(rawStart) || rawStart;
    const tEnd = toAmPm(rawEnd) || rawEnd;

    const location = p.location || "—";
    const approval = p.approvalStatus || "—";
    const progressStatus = p.progressStatus || "—";
    const description = p.description || p.programDescription || "";
    const programSummary = p.programSummary || "";

    const dateRange = eDate ? `${sDate} — ${eDate}` : sDate;
    const timeRange =
      tStart && tEnd ? `${tStart} — ${tEnd}` : tStart || tEnd || "";

    const capParticipants = Number(p.participants || 0) || 0;
    const capVolunteers = Number(p.volunteers || 0) || 0;

    const participantDays: number[] = Array.isArray(p.participantDays)
      ? p.participantDays
      : [];

    // Printed header/footer – only first page
    wsInfo.headerFooter = {
      differentFirst: true,
      firstHeader:
        "&C&B&18BARANGAY FAIRVIEW\nPROGRAM SUMMARY REPORT\n&12(" +
        String(programName).replace(/&/g, "&&") +
        ")",
      oddHeader: "",
      evenHeader: "",
    };

    // Page setup (sheet 1)
    wsInfo.pageSetup = {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    };

    // Info table
    wsInfo.columns = [
      { header: "", width: 26 },
      { header: "", width: 64 },
      { header: "", width: 12 },
      { header: "", width: 12 },
      { header: "", width: 12 },
      { header: "", width: 12 },
    ];

    const addInfo = (label: string, value: string) => {
      const r = wsInfo.addRow([label, value]);
      const c1 = r.getCell(1);
      const c2 = r.getCell(2);
      c1.font = { name: "Calibri", size: 16, bold: true };
      c2.font = { name: "Calibri", size: 16 };
      c1.alignment = { vertical: "middle", wrapText: true };
      c2.alignment = { vertical: "middle", wrapText: true };
    };

    wsInfo.addRow([]);
    addInfo("Program Name", programName);
    addInfo("Approval Status", approval);
    addInfo("Progress Status", progressStatus);
    addInfo("Event Type", String(eventType).toUpperCase());
    addInfo("Location", location);
    addInfo("Date Range", dateRange);
    if (timeRange) addInfo("Time", timeRange);

    if (eventType === "multiple" && participantDays.length) {
      wsInfo.addRow([]);

      const sectionHeader = wsInfo.addRow(["Per-day Max Participants"]);
      sectionHeader.getCell(1).font = {
        name: "Calibri",
        size: 16,
        bold: true,
      };
      sectionHeader.getCell(1).alignment = { horizontal: "left" };

      const tblHeader = wsInfo.addRow(["Day", "Max Participants"]);
      tblHeader.getCell(1).font = { name: "Calibri", size: 16, bold: true };
      tblHeader.getCell(2).font = { name: "Calibri", size: 16, bold: true };
      tblHeader.getCell(1).alignment = { horizontal: "left" };
      tblHeader.getCell(2).alignment = { horizontal: "right" };

      participantDays.forEach((n, i) => {
        const val = Number(n) || 0;
        const display = val > 0 ? val : "No limit";
        const row = wsInfo.addRow([`Day ${i + 1}`, display]);
        row.getCell(1).alignment = { horizontal: "left", wrapText: true };
        row.getCell(2).alignment = { horizontal: "right", wrapText: true };
        row.getCell(1).font = { name: "Calibri", size: 16 };
        row.getCell(2).font = { name: "Calibri", size: 16 };
      });

      wsInfo.addRow([]);
      const mv = wsInfo.addRow([
        "Max Volunteers",
        capVolunteers ? String(capVolunteers) : "—",
      ]);
      mv.getCell(1).font = { name: "Calibri", size: 16, bold: true };
      mv.getCell(2).alignment = { horizontal: "right" };
      mv.getCell(2).font = { name: "Calibri", size: 16 };
    } else {
      const participantsLabel =
        capParticipants > 0 ? String(capParticipants) : "No limit";
      addInfo("Max Participants", participantsLabel);
      addInfo("Max Volunteers", capVolunteers ? String(capVolunteers) : "—");
    }

    if (description) {
      addWrappedBlock("Description", description);
    }

    if (programSummary) {
      addWrappedBlock("Program Summary/Post-event Remarks", programSummary);
    }

    wsInfo.eachRow((row) => {
      row.eachCell((cell) => {
        const currentAlign = cell.alignment || {};
        cell.alignment = { ...currentAlign, wrapText: true };
      });
    });

    // === Sheet 2: Participants & Volunteers ===
    // Make columns slightly narrower so all 6 fit on one portrait page,
    // and rely on wrapping + fitToWidth=1 to keep Role/Attendance together.
    wsList.columns = [
      { key: "idx", width: 5 },       // #
      { key: "fullName", width: 26 }, // Full Name
      { key: "address", width: 30 },  // Address
      { key: "contact", width: 15 },  // Contact
      { key: "role", width: 12 },     // Role
      { key: "attendance", width: 12 } // Attendance
    ];

    const title2 = wsList.addRow([
      "Participants / Volunteers (Approved Only)",
    ]);
    wsList.mergeCells(`A${title2.number}:F${title2.number}`);
    wsList.getCell(`A${title2.number}`).font = {
      name: "Calibri",
      size: 14,
      bold: true,
    };
    wsList.getCell(`A${title2.number}`).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    wsList.addRow([]);

    // Load participants (Approved only)
    const all = await fetchProgramParticipants(programId);
    const approved = all.filter(
      (r) => String(r.approvalStatus || "").toLowerCase() === "approved"
    );

    const roleOrder = (r: ParticipantRecord) => {
      const role = String(r.role || "").toLowerCase();
      if (role === "participant") return 0;
      if (role === "volunteer") return 1;
      return 2;
    };
    const nameKey = (r: ParticipantRecord) =>
      `${(r.lastName || "").toString().toUpperCase()}|${(
        r.firstName || ""
      )
        .toString()
        .toUpperCase()}`;
    const attendanceOrder = (r: ParticipantRecord) =>
      didAttend(r) ? 0 : 1;

    const sortForListing = (records: ParticipantRecord[]) =>
      [...records].sort(
        (a, b) =>
          attendanceOrder(a) - attendanceOrder(b) ||
          roleOrder(a) - roleOrder(b) ||
          nameKey(a).localeCompare(nameKey(b))
      );

    const addTableHeader = () => {
      const headerRow = wsList.addRow([
        "#",
        "Full Name",
        "Address",
        "Contact",
        "Role",
        "Attendance",
      ]);
      headerRow.eachCell((c) => {
        c.font = { name: "Calibri", size: 14, bold: true };
        c.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        c.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" },
        };
      });
      headerRow.height = 22;
    };

    const addParticipantRow = (rec: ParticipantRecord, index: number) => {
      const addr = rec.address || rec.location || "—";
      const contact = rec.contactNumber || rec.contact || "—";
      const role = rec.role || "—";
      const attendance = didAttend(rec) ? "Yes" : "No";

      const r = wsList.addRow([
        index,
        safeFullName(rec),
        addr,
        contact,
        role,
        attendance,
      ]);



      r.eachCell((cell, colNumber) => {
        // Left-align text-heavy columns, center others
        let horizontal: "left" | "center" = "center";
        if (colNumber === 2 || colNumber === 3) horizontal = "left"; // Full Name, Address

        cell.alignment = {
          horizontal,
          vertical: "middle",
          wrapText: true,
        };
        cell.font = { name: "Calibri", size: 14 };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    };


    if (eventType === "multiple" && participantDays.length) {
      participantDays.forEach((_, dayIndex) => {
        wsList.addRow([]); // spacer

        const dayApproved = approved.filter(
          (r) => (r as any).dayChosen === dayIndex
        );
        const approvedParticipants = dayApproved.filter(
          (r) => String(r.role || "").toLowerCase() === "participant"
        );
        const totalApproved = approvedParticipants.length;
        const attendedCount = approvedParticipants.filter(didAttend).length;
        const perc =
          totalApproved > 0
            ? Math.round((attendedCount / totalApproved) * 100)
            : 0;

        const titleText = `Day ${
          dayIndex + 1
        } Attendance — Attendance: ${attendedCount}/${totalApproved} (${perc}% attendance of approved participants)`;

        const dayTitle = wsList.addRow([titleText]);
        wsList.mergeCells(`A${dayTitle.number}:F${dayTitle.number}`);
        const cell = wsList.getCell(`A${dayTitle.number}`);
        cell.font = { name: "Calibri", size: 14, bold: true };
        cell.alignment = { horizontal: "left", vertical: "middle" };

        wsList.addRow([]);
        addTableHeader();

        const daySorted = sortForListing(dayApproved);
        if (daySorted.length === 0) {
          const emptyRow = wsList.addRow([
            "No approved participants registered for this day.",
          ]);
          wsList.mergeCells(`A${emptyRow.number}:F${emptyRow.number}`);
          wsList.getCell(`A${emptyRow.number}`).alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
        } else {
          daySorted.forEach((rec, idx) => addParticipantRow(rec, idx + 1));
        }
      });
    } else {
      const approvedParticipants = approved.filter(
        (r) => String(r.role || "").toLowerCase() === "participant"
      );
      const totalApproved = approvedParticipants.length;
      const attendedCount = approvedParticipants.filter(didAttend).length;
      const perc =
        totalApproved > 0
          ? Math.round((attendedCount / totalApproved) * 100)
          : 0;

      const titleText = `Attendance: ${attendedCount}/${totalApproved} (${perc}% attendance of approved participants)`;
      const attTitle = wsList.addRow([titleText]);
      wsList.mergeCells(`A${attTitle.number}:F${attTitle.number}`);
      const attCell2 = wsList.getCell(`A${attTitle.number}`);
      attCell2.font = { name: "Calibri", size: 14, bold: true };
      attCell2.alignment = { horizontal: "left", vertical: "middle" };

      wsList.addRow([]);
      addTableHeader();

      const sortedApproved = sortForListing(approved);
      if (sortedApproved.length === 0) {
        const emptyRow = wsList.addRow([
          "No approved participants for this program.",
        ]);
        wsList.mergeCells(`A${emptyRow.number}:F${emptyRow.number}`);
        wsList.getCell(`A${emptyRow.number}`).alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
      } else {
        sortedApproved.forEach((rec, idx) =>
          addParticipantRow(rec, idx + 1)
        );
      }
    }

    // 🔧 IMPORTANT: fit all 6 columns on one page width,
    // but allow unlimited pages vertically for long lists.
    wsList.pageSetup = {
      orientation: "portrait",
      paperSize: 9,      // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,    // no vertical shrink — just add more pages
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    };

    // === Attendance Summary on Sheet 1 ===
    const approvedParticipantsAll = approved.filter(
      (r) => String(r.role || "").toLowerCase() === "participant"
    );

    if (approvedParticipantsAll.length > 0) {
      wsInfo.addRow([]);
      const attHeader = wsInfo.addRow(["Attendance Summary"]);
      attHeader.font = { name: "Calibri", size: 16, bold: true };

      const addAttLine = (line: string) => {
        const row = wsInfo.addRow([line]);
        const rn = row.number;
        wsInfo.mergeCells(`A${rn}:F${rn}`);
        const cell = wsInfo.getCell(`A${rn}`);
        cell.alignment = { wrapText: true, vertical: "top" };
        cell.font = { name: "Calibri", size: 16 };
      };

      if (eventType === "multiple" && participantDays.length) {
        let totalApprovedAll = 0;
        let totalAttendedAll = 0;

        participantDays.forEach((_, dayIndex) => {
          const dayApproved = approvedParticipantsAll.filter(
            (r) => (r as any).dayChosen === dayIndex
          );
          const dayApprovedCount = dayApproved.length;
          const dayAttended = dayApproved.filter(didAttend).length;

          totalApprovedAll += dayApprovedCount;
          totalAttendedAll += dayAttended;

          const percDay =
            dayApprovedCount > 0
              ? Math.round((dayAttended / dayApprovedCount) * 100)
              : 0;

          addAttLine(
            `Day ${dayIndex + 1}: ${dayAttended}/${
              dayApprovedCount || 0
            } approved participants attended (${percDay}% attendance achieved).`
          );
        });

        const overallApproved =
          totalApprovedAll || approvedParticipantsAll.length;
        const overallAttended =
          totalAttendedAll ||
          approvedParticipantsAll.filter(didAttend).length;

        const overallPerc =
          overallApproved > 0
            ? Math.round((overallAttended / overallApproved) * 100)
            : 0;

        addAttLine(
          `Total attendance: ${overallAttended}/${overallApproved} approved participants attended (${overallPerc}% attendance achieved throughout the whole event).`
        );
      } else {
        const totalApproved = approvedParticipantsAll.length;
        const attendedCount =
          approvedParticipantsAll.filter(didAttend).length;
        const perc =
          totalApproved > 0
            ? Math.round((attendedCount / totalApproved) * 100)
            : 0;

        addAttLine(
          `${attendedCount}/${totalApproved} approved participants attended (${perc}% attendance achieved).`
        );
      }
    }

    // Upload XLSX
    const safeName = String(programName || programId).replace(
      /[^\w.-]/g,
      "_"
    );
    const xlsxRef = ref(
      storage,
      `GeneratedReports/Program_Summary_${safeName}.xlsx`
    );
    const buf = await wb.xlsx.writeBuffer();
    await uploadBytes(
      xlsxRef,
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );
    const xlsxUrl = await getDownloadURL(xlsxRef);

    return xlsxUrl;
  } catch (err) {
    console.error("generateProgramSummaryXlsx error:", err);
    showToast("error", "Failed to generate Program Summary XLSX.");
    try {
      setLoadingProgramSummary?.(false);
    } catch {}
    return null;
  }
};






const handleGenerateProgramPDF = async (programId: string, programName?: string) => {
  try {
        setLoadingProgramSummary?.(true);
    setIsGenerating?.(true);
    setGeneratingMessage?.("Generating Program Summary Report...");
    const url = await generateProgramSummaryXlsx(programId, programName);
    if (!url) return;

    // Convert to PDF (server API)
    const resp = await fetch("/api/convertPDF", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: url }),
    });
    if (!resp.ok) throw new Error("PDF conversion failed");

    const pdf = await resp.blob();
    const nameSafe = (programName || programId).replace(/[^\w.-]/g, "_");
    saveAs(pdf, `Program_Summary_${nameSafe}.pdf`);

    // optional: notify
    try {
      await addDoc(collection(db, "BarangayNotifications"), {
        message: `A report (Program Summary: ${programName || programId}) was generated by ${user?.fullName || user?.name || "Unknown"}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
    } catch {}
    showToast("success", "Program Summary PDF generated.");
    setIsGenerating?.(false);
    setGeneratingMessage?.("");
        try { setLoadingProgramSummary?.(false); } catch {}
  } catch (e) {
    console.error(e);
    showToast("error", "Failed to generate Program Summary PDF.");
    setIsGenerating?.(false);
    setGeneratingMessage?.("");
        try { setLoadingProgramSummary?.(false); } catch {}    
  }
};



  return (
    <main className="programs-module-main-container">
      <div className="programs-module-section-1">
        <div className="center-wrapper">
          <div
            className={`pending-program-info-toggle-wrapper ${
              user?.position === "Assistant Secretary" ? "with-add-request" : ""
            }`}
          >
            {allowedSections.map((sectionKey) => (
              <button
                key={sectionKey}
                type="button"
                className={`info-toggle-btn-pending-program assigned-tasks ${
                  activeSectionRedirection === sectionKey ? "active" : ""
                }`}
                onClick={() =>
                  handleSectionSwitch(
                    sectionKey as "main" | "programs" | "participants"
                  )
                }
              >
                {sectionKey === "main" && "All Programs"}
                {sectionKey === "programs" && (
                  <span className="badge-container">
                    Pending Programs
                    {programsAssignedData.length > 0 && (
                      <span className="task-badge">
                        {programsAssignedData.length}
                      </span>
                    )}
                  </span>
                )}
                {sectionKey === "participants" && (
                  <span className="badge-container">
                    Pending Participants
                    {participantsListsData.filter(
                      (p) => p.approvalStatus === "Pending"
                    ).length > 0 && (
                      <span className="task-badge">
                        {
                          participantsListsData.filter(
                            (p) => p.approvalStatus === "Pending"
                          ).length
                        }
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="section-add-program">
          <button
            className="add-programs-btn"
            onClick={() => setShowAddProgramsPopup(true)}
          >
            Add New Program
          </button>
        </div>
      </div>

      <AddNewProgramModal
        isOpen={showAddProgramsPopup}
        onClose={() => setShowAddProgramsPopup(false)}
        onProgramSaved={(msg) => {
          showToast("success", msg || "Program saved successfully.");
        }}
      />

      {/* All Programs */}
      {activeSectionRedirection === "main" && (
        <>
          <div className="programs-module-section-2">
            <input
              type="text"
              className="programs-module-filter"
              placeholder="Search by Program Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />

            <select
              className="programs-module-filter"
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
            >
              <option value="">All Approval Status</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="programs-module-filter"
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
            >
              <option value="">All Progress Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="programs-module-filter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Active/Inactive</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="programs-module-main-section">
            {loadingPrograms ? (
              <p>Loading programs...</p>
            ) : currentPrograms.length === 0 ? (
              <div className="no-result-card-programs">
                <img
                  src="/Images/no-results.png"
                  alt="No results icon"
                  className="no-result-icon-programs"
                />
                <p className="no-results-programs">No Results Found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Start Date</th>
                    <th>Approval Status</th>
                    <th>Progress Status</th>
                    <th>Active/Inactive</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrograms.map((program) => (
                    <tr key={program.id}>
                      <td>{program.programName}</td>
                      <td>{program.startDate}</td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.approvalStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.approvalStatus}</p>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.progressStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.progressStatus}</p>
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.activeStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.activeStatus}</p>
                        </span>
                      </td>
                      <td>
                        <div className="actions-programs">
                          {program.approvalStatus === "Rejected" ||
                          program.progressStatus === "Completed" ? (
                            <button
                              className="action-programs-button"
                              onClick={() => handleEditClick(program.id)}
                            >
                              <img
                                src="/Images/view.png"
                                alt="View"
                                className="action-programs-view"
                              />
                            </button>
                          ) : (
                            <button
                              className="action-programs-button"
                              onClick={() => handleEditClick(program.id)}
                            >
                              <img
                                src="/Images/edit.png"
                                alt="Edit"
                                className="action-programs-edit"
                              />
                            </button>
                          )}


                          {/* ✅ Only show "Add Summary" when Completed and NO summary yet */}
                          {canDelete &&
                            program.progressStatus === "Completed" &&
                            !program.programSummary && (
                              <button
                                className="action-programs-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSummaryModalForProgram(program);
                                }}
                              >

                               <img
                                src="/Images/summary.png"
                                alt="Delete"
                                className="action-programs-summary"
                              />
                              </button>
                            )}

                          {/* ✅ Only show Print when Completed AND summary already exists */}
                          {canDelete &&
                            program.progressStatus === "Completed" &&
                            !!program.programSummary && (
                              <button
                                className="action-programs-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateProgramPDF(program.id, program.programName);
                                }}
                              >
                                <img
                                  src="/Images/printer.png"
                                  alt="Print"
                                  className="action-programs-print"
                                />
                              </button>
                            )}


                                                      {canDelete && (
                            <button
                              className="action-programs-button"
                              onClick={() => askConfirmDeleteProgram(program)}
                            >
                              <img
                                src="/Images/delete.png"
                                alt="Delete"
                                className="action-programs-delete"
                              />
                            </button>
                          )}
                        </div>
                      </td>
                                          

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="redirection-section">
            <button onClick={prevPage} disabled={currentPage === 1} className="redirection-section-btn">
              &laquo;
            </button>
            {getPageNumbers().map((number, index) => (
              <button
                key={index}
                onClick={() => typeof number === "number" && paginate(number)}
                className={`redirection-section-btn ${currentPage === number ? "active" : ""}`}
              >
                {number}
              </button>
            ))}
            <button onClick={nextPage} disabled={currentPage === totalPages} className="redirection-section-btn">
              &raquo;
            </button>
          </div>
        </>
      )}

      {/* Pending Participants — Assistant Secretary / Secretary only */}
      {activeSectionRedirection === "participants" &&
        canViewPendingParticipants && (
          <>
            <div className="programs-module-section-2">
              <input
                type="text"
                className="programs-module-filter"
                placeholder="Search by Full Name"
                value={participantNameSearch}
                onChange={(e) => setParticipantNameSearch(e.target.value)}
              />

              <input
                type="text"
                className="programs-module-filter"
                placeholder="Search by Program Name"
                value={participantProgramSearch}
                onChange={(e) => setParticipantProgramSearch(e.target.value)}
              />

              <select
                className="programs-module-filter"
                value={participantRoleFilter}
                onChange={(e) => setParticipantRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="Participant">Participant</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>

            <div className="programs-module-main-section">
              {loadingParticipants ? (
                <p>Loading participants...</p>
              ) : currentParticipants.length === 0 ? (
                <div className="no-result-card-programs">
                  <img
                    src="/Images/no-results.png"
                    alt="No results icon"
                    className="no-result-icon-programs"
                  />
                  <p className="no-results-programs">No Results Found</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Program Name</th>
                      <th>Contact Number</th>
                      <th>Location</th>
                      <th>Role</th>
                      <th>Approval</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentParticipants.map((participant) => (
                      <tr key={participant.id}>
                        <td>{participant.fullName}</td>
                        <td>{participant.programName}</td>
                        <td>{participant.contactNumber}</td>
                        <td>{participant.location}</td>
                        <td>{participant.role}</td>

                        <td>
                          <span
                            className={`status-badge-programs ${String(
                              participant.approvalStatus || "Pending"
                            )
                              .toLowerCase()
                              .replace(/\s*-\s*/g, "-")}`}
                          >
                            <p>{participant.approvalStatus || "Pending"}</p>
                          </span>
                        </td>
                        <td>
                          <div className="actions-programs">
                            <button
                              className="action-programs-button"
                              onClick={() => openParticipantModal(participant)}
                            >
                              <img
                                src="/Images/edit.png"
                                alt="Edit"
                                className="action-programs-edit"
                              />
                            </button>
                            
                            {canDelete && (
                              <button
                                className="action-programs-button"
                                onClick={() =>
                                  askConfirmDeleteParticipant(participant)
                                }
                              >
                                <img
                                  src="/Images/delete.png"
                                  alt="Delete"
                                  className="action-programs-delete"
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="redirection-section">
              <button
                className="redirection-section-btn"
                onClick={prevParticipantsPage}
                disabled={participantsPage === 1}
              >
                &laquo;
              </button>
              {Array.from(
                { length: participantsTotalPages },
                (_, i) => i + 1
              ).map((num) => (
                <button
                  key={num}
                  onClick={() => paginateParticipants(num)}
                  className={`redirection-section-btn ${participantsPage === num ? "active" : ""}`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={nextParticipantsPage}
                disabled={participantsPage === participantsTotalPages}
                className="redirection-section-btn"
              >
                &raquo;
              </button>

              <EditParticipantModal
                isOpen={isParticipantModalOpen}
                onClose={closeParticipantModal}
                participant={selectedParticipant}
                onSave={handleParticipantSave}
                onApprove={handleParticipantApprove}
                onReject={handleParticipantReject}
              />
            </div>
          </>
        )}

      {/* Pending Programs — Punong Barangay only */}
      {activeSectionRedirection === "programs" && canViewPendingPrograms && (
        <>
          <div className="programs-module-section-2">
            <input
              type="text"
              className="programs-module-filter"
              placeholder="Search by Program Name"
              value={pendingSearchName}
              onChange={(e) => setPendingSearchName(e.target.value)}
            />
            <select
              className="programs-module-filter"
              value={pendingProgressFilter}
              onChange={(e) => setPendingProgressFilter(e.target.value)}
            >
              <option value="">All Progress Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select
              className="programs-module-filter"
              value={pendingActiveFilter}
              onChange={(e) => setPendingActiveFilter(e.target.value)}
            >
              <option value="">All Active/Inactive</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="programs-module-main-section">
            {loadingPrograms ? (
              <p>Loading programs...</p>
            ) : currentPendingPrograms.length === 0 ? (
              <div className="no-result-card-programs">
                <img
                  src="/Images/no-results.png"
                  alt="No results icon"
                  className="no-result-icon-programs"
                />
                <p className="no-results-programs">No Results Found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Date Created</th>
                    <th>Approval Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPendingPrograms.map((program) => (
                    <tr key={program.id}>
                      <td>{program.programName}</td>
                      <td>{program.dateCreated}</td>
                      <td>
                        <span
                          className={`status-badge-programs ${program.approvalStatus
                            .toLowerCase()
                            .replace(/\s*-\s*/g, "-")}`}
                        >
                          <p>{program.approvalStatus}</p>
                        </span>
                      </td>
                      <td>
                        <div className="actions-programs">
                          <button
                            className="action-programs-button"
                            onClick={() => handleEditClick(program.id)}
                          >
                            <img
                              src="/Images/edit.png"
                              alt="Edit"
                              className="action-programs-edit"
                            />
                          </button>
                          {canDelete && (
                            <button
                              className="action-programs-button"
                              onClick={() => askConfirmDeleteProgram(program)}
                            >
                              <img
                                src="/Images/delete.png"
                                alt="Delete"
                                className="action-programs-delete"
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="redirection-section">
            <button onClick={prevPendingPage} disabled={pendingProgramsPage === 1}>
              &laquo;
            </button>
            {Array.from({ length: pendingTotalPages }, (_, i) => i + 1).map(
              (num) => (
                <button
                  key={num}
                  onClick={() => paginatePending(num)}
                  className={pendingProgramsPage === num ? "active" : ""}
                >
                  {num}
                </button>
              )
            )}
            <button
              onClick={nextPendingPage}
              disabled={pendingProgramsPage === pendingTotalPages}
            >
              &raquo;
            </button>
          </div>
        </>
      )}

      {toastVisible && (
        <div
          className={`popup-overlay-program show${
            toastType === "error" ? " error" : ""
          }`}
        >
          <div className="popup-program">
            <img
              src={
                toastType === "success" ? "/Images/check.png" : "/Images/warning-1.png"
              }
              alt="icon alert"
              className="icon-alert"
            />
            <p>{toastMsg}</p>
          </div>
        </div>
      )}

      {confirmDel.open && (
        <div className="confirmation-popup-overlay-add-program">
          <div className="confirmation-popup-add-program">
            <img
              src="/Images/question.png"
              alt="question icon"
              className="successful-icon-popup"
            />
            <p>
              Are you sure you want to delete this{" "}
              {confirmDel.kind === "program" ? "program" : "participant"}?
            </p>
            {confirmDel.label && (
              <div style={{ color: "#dd3327", marginTop: 6, fontWeight: 600 }}>
                {confirmDel.label}
              </div>
            )}
            <div className="yesno-container-add">
              <button onClick={handleConfirmNo} className="no-button-add">
                No
              </button>
              <button onClick={handleConfirmYes} className="yes-button-add">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

{/* Summary pop-up */}
{summaryModalOpen && summaryProgram && (
  <div className="add-summary-popup-overlay">
    <div className="add-summary-confirmation-popup">


        <h2> Add post-event summary for: </h2>
       
        <p>{summaryProgram.programName} </p> 
   

      <textarea
        className="program-summary-textarea-add-summary"
        value={summaryText}
        onChange={(e) => setSummaryText(e.target.value)}
        placeholder="Write how the program went, issues encountered (e.g., inventory shortage, low turnout), and recommendations for future programs."
        rows={7}
      />

      <div className="yes-no-container-summary-program">
        <button onClick={closeSummaryModal} className="no-button-add">
          Cancel
        </button>
        <button
          onClick={handleSaveProgramSummary}
          className="yes-button-add"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}



          {/* Generating of Report Popup */}
          {isGenerating && (
            <div className="popup-backdrop">
              <div className="popup-content">
                <div className="spinner" />
                <p>{generatingMessage}</p>
              </div>
            </div>
          )}  

          {/* Success Generate Report Popup*/}
      {showSuccessGenerateReportPopup && (
        <div className={`popup-overlay-success-generate-report show`}>
          <div className="popup-success-generate-report">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupSuccessGenerateReportMessage}</p>
          </div>
        </div>
      )}

      {/* Error Generate Report Popup*/}
      {showErrorGenerateReportPopup && (
        <div className={`popup-overlay-error-generate-report show`}>
          <div className="popup-error-generate-report">
          <img src={ "/Images/warning-1.png"} alt="icon alert" className="icon-alert" />
            <p>{popupErrorGenerateReportMessage}</p>
          </div>
        </div>
      )}
      
    </main>
  );
}
