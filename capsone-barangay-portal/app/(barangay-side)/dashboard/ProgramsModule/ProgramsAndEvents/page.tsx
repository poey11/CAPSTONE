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
};

type Participant = {
  id: string;
  programId?: string; // <<— now using programId as the linkage
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
};

type ParticipantRecord = {
  id: string;
  programId?: string;
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
  // Attendance fields (use whatever you store)
  attended?: boolean;
  attendanceCount?: number;
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

  // If rejected, stop here.
  if (approval === "Rejected") {
    return { progress: "Rejected", active: "Rejected" };
  }

  // Otherwise compute date-based progress
  const s = parseYMD(p?.startDate);
  const e = parseYMD(p?.endDate);
  let progress: Program["progressStatus"] =
    (p?.progressStatus as Program["progressStatus"]) || "Upcoming";

  if (s) {
    const today = startOfToday();
    const isSingle =
      p?.eventType === "single" || (!!e && s.getTime() === e.getTime());

    if (isSingle) {
      if (today.getTime() < s.getTime()) progress = "Upcoming";
      else if (today.getTime() === s.getTime()) progress = "Ongoing";
      else progress = "Completed";
    } else if (e) {
      if (today.getTime() < s.getTime()) progress = "Upcoming";
      else if (today.getTime() > e.getTime()) progress = "Completed";
      else progress = "Ongoing";
    }
  }

  // Active rule: Pending OR Completed => Inactive, else preserve/Active
  const active: Program["activeStatus"] =
    approval === "Pending" || progress === "Completed"
      ? "Inactive"
      : ((p?.activeStatus as Program["activeStatus"]) ?? "Inactive");

  return { progress, active };
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
            programId: d.programId ?? d.programID ?? "", // <<— pick up programId
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
  const currentPrograms = filteredPrograms.slice(indexOfFirst, indexOfLast);
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

  const sendApprovedSMS = async (contactNumber: string, fullName: string, programName: string, role: string) => {
    try {
      const response = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            to: contactNumber,
            message: `Hello ${fullName}, your registration for the program "${programName}" as "${role}" has been approved. Thank you!`,
        })
      });   
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 

      } catch (error) {
        console.error("Error sending SMS:", error);

    }
  }

  // Participant approve
  const handleParticipantApprove = async (id: string) => {
    
    try {
      await updateDoc(doc(db, "ProgramsParticipants", id), {
        approvalStatus: "Approved",
      });
      showToast("success", "Participant approved.");
      const participant = participantsListsData.find((p) => p.id === id);
      if (participant) {
        //sendApprovedSMS(participant.contactNumber || "", participant.fullName || "", participant.programName || "", participant.role||""); // send approval SMS
      }
    } catch {
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
          message: `Hello ${fullName}, we regret to inform you that your registration for the program "${programName}" as "${role}" has been rejected. Reason: ${reason}. Thank you!`,
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
        //sendRejectionSMS(participant.contactNumber || "", participant.fullName || "", participant.programName || "", reason, participant.role||""); // send rejection SMS
      }
    } catch {
      showToast("error", "Failed to reject participant.");
    }
  };

  // ===== AUTO-REJECT: pending participants tied to ongoing/completed programs (by programId) =====
  const autoRejectRunning = useRef(false);

  const ongoingOrCompletedProgramIds = useMemo(() => {
    // consider both approved/non-pending and pending arrays, just in case
    const all = [...programs, ...programsAssignedData];
    return new Set(
      all
        .filter((p) => p.progressStatus === "Ongoing" || p.progressStatus === "Completed")
        .map((p) => p.id)
    );
  }, [programs, programsAssignedData]);

  useEffect(() => {
    // run when we have participants and program statuses
    if (loadingParticipants || loadingPrograms) return;
    if (autoRejectRunning.current) return;

    const toReject = participantsListsData.filter((pp) => {
      const isPending = (pp.approvalStatus ?? "Pending") === "Pending";
      const pid = (pp.programId || "").trim();
      return isPending && pid && ongoingOrCompletedProgramIds.has(pid);
    });

    if (toReject.length === 0) return;

    const run = async () => {
      autoRejectRunning.current = true;
      try {
        // Firestore write batch limit is 500 ops; keep a safe margin
        const CHUNK = 400;
        for (let i = 0; i < toReject.length; i += CHUNK) {
          const slice = toReject.slice(i, i + CHUNK);
          const batch = writeBatch(db);
          slice.forEach((pp) => {
            const ref = doc(db, "ProgramsParticipants", pp.id);
            batch.update(ref, {
              approvalStatus: "Rejected",
              rejectionReason:
                "Automatically rejected: program is already Ongoing/Completed.",
              autoRejectedAt: serverTimestamp(),
              autoRejectedBy: user?.email || "system",
            });
          });
          await batch.commit();
        }
        showToast(
          "success",
          `Auto-rejected ${toReject.length} pending participant${
            toReject.length > 1 ? "s" : ""
          } for ongoing/completed programs.`
        );
      } catch (e) {
        console.error(e);
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
    ongoingOrCompletedProgramIds,
    user?.email,
  ]);
  // ===== END AUTO-REJECT =====


  // participant report

  const didAttend = (rec: ParticipantRecord) => {
  if (typeof rec.attended === "boolean") return rec.attended;
  if (typeof rec.attendanceCount === "number") return rec.attendanceCount > 0;
  if (rec.attendance && typeof rec.attendance.present === "boolean") return rec.attendance.present;
  return false;
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


const generateProgramCaseXlsx = async (programId: string, fallbackName?: string): Promise<string | null> => {
  try {
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
    const title = "BARANGAY FAIRVIEW\nPROGRAM CASE REPORT";
    wsInfo.mergeCells("A1:F1");
    wsInfo.getCell("A1").value = title;
    wsInfo.getCell("A1").font = { name: "Calibri", size: 16, bold: true };
    wsInfo.getCell("A1").alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    wsInfo.getRow(1).height = 36;

    const programName = p.programName || fallbackName || programId;
    const eventType = p.eventType || "single";
    const sDate = fmtDate(p.startDate);
    const eDate = p.endDate ? fmtDate(p.endDate) : "";
    const tStart = p.timeStart || "";
    const tEnd = p.timeEnd || "";
    const location = p.location || "—";
    const approval = p.approvalStatus || "—";
    const progressStatus = p.progressStatus || "—";
    const description = p.description || p.programDescription || "";

    // display date/time range
    const dateRange = eDate ? `${sDate} — ${eDate}` : sDate;
    const timeRange = tStart && tEnd ? `${tStart} — ${tEnd}` : (tStart || tEnd || "");

    // capacity
    const capParticipants = Number(p.participants || 0) || 0;
    const capVolunteers = Number(p.volunteers || 0) || 0;

    // participantDays (for multiple)
    const participantDays: number[] = Array.isArray(p.participantDays) ? p.participantDays : [];

    // Info table
    wsInfo.columns = [
      { header: "", width: 26 },
      { header: "", width: 50 },
      { header: "", width: 18 },
      { header: "", width: 18 },
      { header: "", width: 18 },
      { header: "", width: 18 }
    ];

    const addInfo = (label: string, value: string) => {
      const r = wsInfo.addRow([label, value]);
      r.getCell(1).font = { bold: true };
      r.alignment = { vertical: "middle", wrapText: true };
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
      wsInfo.addRow(["Per-day Max Participants"]);
      wsInfo.getRow(wsInfo.lastRow!.number).font = { bold: true };
      const header = wsInfo.addRow(["Day", "Max Participants"]);
      header.font = { bold: true };
      participantDays.forEach((n, i) => {
        wsInfo.addRow([`Day ${i + 1}`, Number(n) || 0]);
      });
    } else {
      addInfo("Max Participants", capParticipants ? String(capParticipants) : "—");
    }
    addInfo("Max Volunteers", capVolunteers ? String(capVolunteers) : "—");

    if (description) {
      wsInfo.addRow([]);
      const header = wsInfo.addRow(["Description"]);
      header.font = { bold: true };
      const drow = wsInfo.addRow([description]);
      drow.getCell(1).alignment = { wrapText: true };
      drow.height = 40;
    }

    // style basics
    wsInfo.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = cell.font || { name: "Calibri", size: 12 };
      });
    });
    wsInfo.pageSetup = {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };

    // === Sheet 2: Participants & Volunteers ===
    wsList.columns = [
      { header: "#", width: 6 },
      { header: "Full Name", width: 32 },
      { header: "Address", width: 34 },
      { header: "Contact", width: 18 },
      { header: "Role", width: 16 },
      { header: "Attendance", width: 14 },
    ];

    const title2 = wsList.addRow(["Participants / Volunteers (Approved Only)"]);
    wsList.mergeCells(`A${title2.number}:F${title2.number}`);
    wsList.getCell(`A${title2.number}`).font = { name: "Calibri", size: 14, bold: true };
    wsList.getCell(`A${title2.number}`).alignment = { horizontal: "center", vertical: "middle" };
    wsList.addRow([]);

    const header2 = wsList.addRow(wsList.columns.map(c => c.header));
    header2.eachCell((c) => {
      c.font = { name: "Calibri", size: 12, bold: true };
      c.alignment = { horizontal: "center", vertical: "middle" };
      c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });

    // Load participants (Approved only)
    const all = await fetchProgramParticipants(programId);
    const approved = all.filter(r => String(r.approvalStatus || "").toLowerCase() === "approved");

    // Sort: participants first, then alpha by last name
    const roleOrder = (r: ParticipantRecord) =>
      (String(r.role || "").toLowerCase() === "participant" ? 0 : 1);
    const nameKey = (r: ParticipantRecord) =>
      `${(r.lastName || "").toString().toUpperCase()}|${(r.firstName || "").toString().toUpperCase()}`;
    approved.sort((a, b) => roleOrder(a) - roleOrder(b) || nameKey(a).localeCompare(nameKey(b)));

    approved.forEach((rec, i) => {
      const addr = rec.address || rec.location || "—";
      const contact = rec.contactNumber || rec.contact || "—";
      const role = rec.role || "—";
      const attendance = didAttend(rec) ? "Yes" : "No";

      const r = wsList.addRow([i + 1, safeFullName(rec), addr, contact, role, attendance]);
      r.height = 22;
      r.eachCell((c) => {
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        c.font = { name: "Calibri", size: 12 };
        c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      });
    });

    wsList.pageSetup = {
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

    // Upload XLSX
    const safeName = String(programName || programId).replace(/[^\w.-]/g, "_");
    const xlsxRef = ref(storage, `GeneratedReports/Program_Case_${safeName}.xlsx`);
    const buf = await wb.xlsx.writeBuffer();
    await uploadBytes(xlsxRef, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const xlsxUrl = await getDownloadURL(xlsxRef);

    return xlsxUrl;
  } catch (err) {
    console.error("generateProgramCaseXlsx error:", err);
    showToast("error", "Failed to generate Program Case XLSX.");
    return null;
  }
};


const handleGenerateProgramCasePDF = async (programId: string, programName?: string) => {
  try {
    const url = await generateProgramCaseXlsx(programId, programName);
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
    saveAs(pdf, `Program_Case_${nameSafe}.pdf`);

    // optional: notify
    try {
      await addDoc(collection(db, "BarangayNotifications"), {
        message: `A report (Program Case: ${programName || programId}) was generated by ${user?.fullName || user?.name || "Unknown"}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: "Punong Barangay",
        transactionType: "System Report",
      });
    } catch {}
    showToast("success", "Program Case PDF generated.");
  } catch (e) {
    console.error(e);
    showToast("error", "Failed to generate Program Case PDF.");
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
              <option value="Pending">Pending</option>
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
                                alt="Edit"
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
              value={pendingApprovalFilter}
              onChange={(e) => setPendingApprovalFilter(e.target.value)}
            >
              <option value="">All Approval Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
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
                          {program.progressStatus === "Completed" && (
                            <button
                              className="action-print-departments-main"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateProgramCasePDF(program.id, program.programName);
                              }}
                              title="Print Program Case Report"
                            >
                              <img src="/Images/printer.png" alt="Print" />
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
    </main>
  );
}
