"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db, storage } from "@/app/db/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type SimpleField = { name: string };

type Resident = {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  location?: string;
  contactNumber?: string;
  emailAddress?: string;
  verificationFilesURLs?: string[];
  dateOfBirth?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;

  programId: string;
  programName?: string;

  textFields: SimpleField[];
  fileFields: SimpleField[];

  resident: Resident | null;

  onSaved: (msg?: string) => void;
  onError?: (msg: string) => void;

  prettyLabels?: Record<string, string>;

  selectedDayIndex?: number | null;
  lockDaySelection?: boolean;
};

const DEFAULT_LABELS: Record<string, string> = {
  role: "Role",
  dayChosen: "Day Chosen",
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
  dateOfBirth: "Date of Birth",
  age: "Age",
};

type Preview = { url: string; isPdf: boolean; isObjectUrl: boolean };

type ProgramLite = {
  id: string;
  programName?: string;
  eventType?: "single" | "multiple";
  startDate?: string;
  timeStart?: string;
  timeEnd?: string;
  participantDays?: number[];
  noParticipantLimit?: boolean;
  noParticipantLimitList?: boolean[];
  participants?: number | null;
  volunteers?: number | null;
  progressStatus?: string;
};

// Compute age from YYYY-MM-DD
function computeAgeFromDOB(dobYMD?: string): number | null {
  if (!dobYMD || !/^\d{4}-\d{2}-\d{2}$/.test(dobYMD)) return null;
  const [y, m, d] = dobYMD.split("-").map(Number);
  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const mDiff = now.getMonth() - dob.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 && age <= 200 ? age : null;
}

export default function AddWalkInParticipantModal({
  isOpen,
  onClose,
  onBack,
  programId,
  programName = "",
  textFields,
  fileFields,
  resident,
  onSaved,
  onError,
  prettyLabels,
  selectedDayIndex = null,
  lockDaySelection = false,
}: Props) {
  const LABELS = prettyLabels || DEFAULT_LABELS;

  const [selectedRole, setSelectedRole] = useState<"Participant" | "Volunteer">("Participant");

const [formData, setFormData] = useState<Record<string, string>>(() => {
  const init: Record<string, string> = {};
  for (const f of textFields || []) init[f.name] = "";

  if (resident) {
    const fullName = `${resident.firstName || ""} ${
      resident.middleName ? resident.middleName + " " : ""
    }${resident.lastName || ""}`
      .replace(/\s+/g, " ")
      .trim();

    for (const f of textFields || []) {
      if (f.name === "firstName") init[f.name] = resident.firstName || "";
      else if (f.name === "lastName") init[f.name] = resident.lastName || "";
      else if (f.name === "contactNumber") init[f.name] = resident.contactNumber || "";
      else if (f.name === "emailAddress") init[f.name] = resident.emailAddress || "";
      else if (f.name === "location") init[f.name] = resident.address || resident.location || "";
      else if (f.name === "fullName") init[f.name] = fullName;
      else if (f.name === "dateOfBirth") init[f.name] = resident.dateOfBirth || "";
    }
  }

    if (selectedDayIndex !== null && selectedDayIndex !== undefined) {
      init["dayChosen"] = String(selectedDayIndex);
    }

  return init;
});




  const [formFiles, setFormFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // --- Load program for day picker + caps ---
  const [program, setProgram] = useState<ProgramLite | null>(null);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!programId) return;
      const snap = await getDoc(doc(db, "Programs", programId));
      if (!snap.exists()) return;
      const p = { id: snap.id, ...snap.data() } as any;
      if (isMounted) {
        setProgram({
          id: snap.id,
          programName: p.programName,
          eventType: p.eventType,
          startDate: p.startDate,
          timeStart: p.timeStart,
          timeEnd: p.timeEnd,
          participantDays: Array.isArray(p.participantDays) ? p.participantDays : [],
          noParticipantLimit: Boolean(p.noParticipantLimit),
          noParticipantLimitList: Array.isArray(p.noParticipantLimitList) ? p.noParticipantLimitList : [],
          participants: Number.isFinite(Number(p.participants)) ? Number(p.participants) : null,
          volunteers: Number.isFinite(Number(p.volunteers)) ? Number(p.volunteers) : null,
          progressStatus: (p.progressStatus || "").toString(),
        });
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [programId]);

  type PriorEntry = { dayChosen: number | null; attendance: boolean; dayDate?: Date };

const [priorEntries, setPriorEntries] = useState<PriorEntry[]>([]);

useEffect(() => {
  let cancelled = false;
  (async () => {
    if (!resident?.id || !programId) {
      if (!cancelled) setPriorEntries([]);
      return;
    }
    try {
      const qRef = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", programId),
        where("residentId", "==", resident.id),
        where("role", "==", "Participant")
      );
      const snap = await getDocs(qRef);

      // Compute the calendar date for each prior day (for future/past logic)
      const entries: PriorEntry[] = [];
      const base = program?.startDate ? ymdToDateLocal(program.startDate) : null;

      snap.forEach(d => {
        const data: any = d.data();
        const idx = Number.isInteger(data?.dayChosen) ? Number(data.dayChosen) : null;
        let dayDate: Date | undefined = undefined;
        if (base && idx != null) {
          const dd = new Date(base);
          dd.setDate(base.getDate() + idx);
          dd.setHours(0,0,0,0);
          dayDate = dd;
        }
        entries.push({
          dayChosen: idx,
          attendance: data?.attendance === true,
          dayDate,
        });
      });

      if (!cancelled) setPriorEntries(entries);
    } catch {
      if (!cancelled) setPriorEntries([]);
    }
  })();
  return () => { cancelled = true; };
}, [resident?.id, programId, program?.startDate]);

const computeDayDate = (idx: number): Date | null => {
  if (!program?.startDate) return null;
  const base = ymdToDateLocal(program.startDate);
  const d = new Date(base);
  d.setDate(base.getDate() + idx);
  d.setHours(0,0,0,0);
  return d;
};

const todayMidnight = () => {
  const t = new Date();
  t.setHours(0,0,0,0);
  return t;
};

// Prior info distilled
const anyAttended = useMemo(
  () => priorEntries.some(pe => pe.attendance === true),
  [priorEntries]
);

// Set of days already booked (any status)
const priorDaySet = useMemo(() => {
  const s = new Set<number>();
  priorEntries.forEach(pe => { if (typeof pe.dayChosen === 'number') s.add(pe.dayChosen); });
  return s;
}, [priorEntries]);

// Upcoming bookings (registered but not attended and day is today or future)
const upcomingBookedSet = useMemo(() => {
  const s = new Set<number>();
  const today = todayMidnight();
  priorEntries.forEach(pe => {
    if (pe.attendance === true) return; // attended is handled separately
    if (typeof pe.dayChosen !== 'number') return;
    if (!pe.dayDate) return;
    if (pe.dayDate >= today) s.add(pe.dayChosen);
  });
  return s;
}, [priorEntries]);

const isDayDisabledByPrior = (idx: number): { disabled: boolean; reason?: string } => {
  if (priorDaySet.has(idx)) {
    return { disabled: true, reason: "Already enlisted for this day" };
  }
  if (anyAttended) {
    return { disabled: true, reason: "Already attended a day" };
  }
  if (upcomingBookedSet.size > 0 && !upcomingBookedSet.has(idx)) {
    return { disabled: true, reason: "Has a future booking for another day" };
  }
  return { disabled: false };
};



  const ymdToDateLocal = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1); // local midnight
  };
  const isSameLocalDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const setTimeOnDate = (day: Date, hhmm?: string) => {
    const d = new Date(day);
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return d;
    const [hStr, mStr] = hhmm.split(":");
    d.setHours(Number(hStr) || 0, Number(mStr) || 0, 0, 0);
    return d;
  };
  const hasEndedToday = (day: Date, timeEnd?: string) => {
    const now = new Date();
    if (!isSameLocalDay(day, now) || !timeEnd) return false;
    const end = setTimeOnDate(day, timeEnd);
    return now > end;
  };
  const isNowWithinWindow = (day: Date, timeStart?: string, timeEnd?: string) => {
    if (!timeStart || !timeEnd) return true; // no window → allow
    const now = new Date();
    if (!isSameLocalDay(day, now)) return true; // only enforce when it's *today*
    const start = setTimeOnDate(day, timeStart);
    const end = setTimeOnDate(day, timeEnd);
    return now >= start && now <= end;
  };

  // --- Which days are FULL (participants only) ---
  const [dayFull, setDayFull] = useState<boolean[]>([]);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!programId) return;

      const progSnap = await getDoc(doc(db, "Programs", programId));
      if (!progSnap.exists()) return;
      const data: any = progSnap.data() || {};
      const pd: number[] = Array.isArray(data?.participantDays) ? data.participantDays : [];
      const noLimitList: boolean[] = Array.isArray(data?.noParticipantLimitList)
        ? data.noParticipantLimitList
        : [];

      const checks = pd.map(async (rawCap: any, idx: number) => {
        if (noLimitList?.[idx]) return false; // no-limit day cannot be full
        const cap = Number(rawCap);
        if (!Number.isFinite(cap) || cap <= 0) return false;

        const qDay = query(
          collection(db, "ProgramsParticipants"),
          where("programId", "==", programId),
          where("approvalStatus", "==", "Approved"),
          where("role", "==", "Participant"),
          where("dayChosen", "==", idx)
        );
        const snapCount = await getCountFromServer(qDay);
        const count = snapCount.data().count || 0;
        return count >= cap;
      });

      const results = await Promise.all(checks);
      if (isMounted) setDayFull(results);
    })();

    return () => {
      isMounted = false;
    };
  }, [programId]);

  // If current selection becomes FULL after effect, clear (participants only).
  useEffect(() => {
    if (selectedRole !== "Participant") return;
    const v = formData.dayChosen;
    if (v === undefined || v === "") return;
    const idx = Number(v);
    if (Number.isInteger(idx) && dayFull[idx]) {
      setFormData((prev) => ({ ...prev, dayChosen: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFull, selectedRole]);

  // --- Clear dayChosen if program is single-day (to avoid accidental submission) ---
  useEffect(() => {
    if (program?.eventType === "single" && formData.dayChosen) {
      setFormData((prev) => ({ ...prev, dayChosen: "" }));
    }
  }, [program?.eventType]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- File previews ---
  const residentValidIdUrl = resident?.verificationFilesURLs?.[0] || "";
  const [filePreviews, setFilePreviews] = useState<Record<string, Preview>>({});
  const previewsRef = useRef<Record<string, Preview>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setFilePreviews((old) => {
      const next: Record<string, Preview> = {};
      const fields = (fileFields || []).map((f) => f.name);

      for (const field of fields) {
        const file = formFiles[field];
        if (file) {
          const objURL = URL.createObjectURL(file);
          const isPdf =
            (file.type || "").toLowerCase().includes("pdf") ||
            (file.name || "").toLowerCase().endsWith(".pdf");
          next[field] = { url: objURL, isPdf, isObjectUrl: true };
        } else if (field === "validIDjpg" && residentValidIdUrl) {
          next[field] = {
            url: residentValidIdUrl,
            isPdf: residentValidIdUrl.toLowerCase().includes(".pdf"),
            isObjectUrl: false,
          };
        }
      }

      for (const [k, pv] of Object.entries(old)) {
        const nxt = next[k];
        if (pv.isObjectUrl && (!nxt || nxt.url !== pv.url)) {
          URL.revokeObjectURL(pv.url);
        }
      }

      previewsRef.current = next;
      return next;
    });

    return () => {
      for (const pv of Object.values(previewsRef.current)) {
        if (pv.isObjectUrl) URL.revokeObjectURL(pv.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFiles, residentValidIdUrl, fileFields]);

  // ------- Role-aware field sets -------
  const isDefaultField = (name: string) => Object.prototype.hasOwnProperty.call(DEFAULT_LABELS, name);

  const visibleTextFields = useMemo<SimpleField[]>(() => {
    const base = textFields?.length ? textFields : [];
    // Render dayChosen as a standalone block, so filter it out from the columns.
    if (selectedRole === "Volunteer") {
      return base.filter((f) => isDefaultField(f.name) && f.name !== "dayChosen");
    }
    return base.filter((f) => f.name !== "dayChosen");
  }, [textFields, selectedRole]);

  const visibleFileFields = useMemo<SimpleField[]>(() => {
    const base = fileFields?.length ? fileFields : [];
    if (selectedRole === "Volunteer") {
      return base.filter((f) => isDefaultField(f.name));
    }
    return base;
  }, [fileFields, selectedRole]);

  function prettifyFieldName(name: string, prettyLabels?: Record<string, string>): string {
    if (prettyLabels?.[name]) return prettyLabels[name];
    if (DEFAULT_LABELS[name]) return DEFAULT_LABELS[name];
    let label = name.replace(/\.(jpg|jpeg|png|pdf)$/i, "");
    label = label.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    label = label.charAt(0).toUpperCase() + label.slice(1);
    label = label.replace(/\bId\b/g, "ID");
    return label;
  }

  const needsValidId = visibleFileFields.some((f) => f.name === "validIDjpg");
  const labelFor = (name: string) => prettifyFieldName(name, prettyLabels);

  const handleFormTextChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFormFileChange = (field: string, inputEl: HTMLInputElement) => {
    const file = inputEl.files?.[0] || null;
    setFormFiles((prev) => ({ ...prev, [field]: file }));
  };

  const todayStr = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const dobInForm = formData["dateOfBirth"] || "";
  const derivedAge = useMemo(() => computeAgeFromDOB(dobInForm), [dobInForm]);

  // ------- Validation -------
  const validateReqForm = () => {
    // Text fields
    for (const f of visibleTextFields) {
      const name = f.name;
      const val = (formData[name] ?? "").toString().trim();
      if (!val) throw new Error(`Please fill out: ${labelFor(name)}`);
    }

    // File fields
    for (const f of visibleFileFields) {
      const hasManual = !!formFiles[f.name];
      if (!hasManual) {
        if (f.name === "validIDjpg" && residentValidIdUrl) continue; // allow auto-attach
        throw new Error(`Please upload: ${labelFor(f.name)}`);
      }
    }

    // Require dayChosen only for multi-day + Participant
    if (program?.eventType === "multiple" && selectedRole === "Participant") {
      const v = formData.dayChosen;
      if (v === undefined || v === "") {
        throw new Error("Please select a day for participants.");
      }
    }
  };

  // Which days are "ended" today (timeEnd passed)
  const dayEnded = useMemo<boolean[]>(() => {
    if (!program || program.eventType !== "multiple" || !program.participantDays) return [];
    const base = program.startDate ? ymdToDateLocal(program.startDate) : new Date();
    return program.participantDays.map((_, idx) => {
      const d = new Date(base);
      d.setDate(base.getDate() + idx);
      return hasEndedToday(d, program.timeEnd);
    });
  }, [program?.eventType, program?.participantDays, program?.startDate, program?.timeEnd]);

  // If chosen day becomes FULL or ENDED, clear it (participants only)
  useEffect(() => {
    if (selectedRole !== "Participant") return;
    const v = formData.dayChosen;
    if (v === undefined || v === "") return;
    const idx = Number(v);
    if (!Number.isInteger(idx)) return;

    if (dayFull[idx] || dayEnded[idx]) {
      setFormData((prev) => ({ ...prev, dayChosen: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFull, dayEnded, selectedRole]);

  const isOngoing = (program?.progressStatus || "").toLowerCase() === "ongoing";

  const nowAllowedByWindow = useMemo(() => {
    if (!program || !isOngoing) return true;

    const base = program.startDate ? ymdToDateLocal(program.startDate) : null;
    if (!base) return true;

    // Single-day: check today's window
    if (program.eventType === "single") {
      const theDay = base;
      return isNowWithinWindow(theDay, program.timeStart, program.timeEnd) && !hasEndedToday(theDay, program.timeEnd);
    }

    // Multi-day: only enforce the window if the selected day is *today*
    const chosen = formData.dayChosen;
    if (chosen === undefined || chosen === "") return true; // selection not made yet
    const idx = Number(chosen);
    if (!Number.isInteger(idx)) return true;

    const theDay = new Date(base);
    theDay.setDate(base.getDate() + idx);

    // If today but ended → false; if today but outside window → false; otherwise true
    if (hasEndedToday(theDay, program.timeEnd)) return false;
    return isNowWithinWindow(theDay, program.timeStart, program.timeEnd);
  }, [program?.eventType, program?.progressStatus, program?.startDate, program?.timeStart, program?.timeEnd, formData.dayChosen]);

  // ------- Capacity checks (server) -------
  const recheckCapacityServer = async (role: "Participant" | "Volunteer", dayChosenNum: number | null) => {
    const progSnap = await getDoc(doc(db, "Programs", programId));
    if (!progSnap.exists()) throw new Error("Program not found.");
    const p: any = progSnap.data() || {};

    const statusNow = (p?.progressStatus || "").toString().toLowerCase();
    if (["rejected", "completed"].includes(statusNow)) {
      throw new Error(`This program is ${p?.progressStatus}. You can’t add entries.`);
    }

    // ---- time window enforcement when Ongoing ----
    if (statusNow === "ongoing") {
      const sYMD: string | undefined = p?.startDate;
      const tStart: string | undefined = p?.timeStart;
      const tEnd: string | undefined = p?.timeEnd;

      if (sYMD) {
        const base = ymdToDateLocal(sYMD);
        const day =
          p?.eventType === "multiple" && dayChosenNum != null
            ? (() => {
                const d = ymdToDateLocal(sYMD);
                d.setDate(d.getDate() + dayChosenNum);
                return d;
              })()
            : ymdToDateLocal(sYMD);

        const now = new Date();
        if (isSameLocalDay(day, now)) {
          const within = isNowWithinWindow(day, tStart, tEnd);
          if (!within) {
            throw new Error("Walk-ins are only allowed during the scheduled time window today.");
          }
          if (hasEndedToday(day, tEnd)) {
            throw new Error("Selected day has already ended.");
          }
        }
      }
    }

    // Volunteers: check volunteer cap only
    if (role === "Volunteer") {
      const volCap = Number(p?.volunteers);
      if (Number.isFinite(volCap) && volCap > 0) {
        const qVol = query(
          collection(db, "ProgramsParticipants"),
          where("programId", "==", programId),
          where("approvalStatus", "==", "Approved"),
          where("role", "==", "Volunteer")
        );
        const volCountSnap = await getCountFromServer(qVol);
        const volCount = volCountSnap.data().count || 0;
        if (volCount >= volCap) {
          throw new Error("Volunteer capacity reached. Cannot add more volunteers.");
        }
      }
      return p;
    }

    // Participants: global cap unless no-limit
    const globalNoLimit = Boolean(p?.noParticipantLimit);
    const globalCap = Number(p?.participants);
    if (!globalNoLimit && Number.isFinite(globalCap) && globalCap > 0) {
      const partQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", programId),
        where("approvalStatus", "==", "Approved"),
        where("role", "==", "Participant")
      );
      const countSnap = await getCountFromServer(partQ);
      const currentCount = countSnap.data().count || 0;
      if (currentCount >= globalCap) {
        throw new Error("Program capacity reached. Cannot add more participants.");
      }
    }

    // Per-day cap if multi-day and day chosen
    if (p?.eventType === "multiple" && dayChosenNum !== null) {
      const noLimitList: boolean[] = Array.isArray(p?.noParticipantLimitList) ? p.noParticipantLimitList : [];
      const perDayNoLimit = Boolean(noLimitList?.[dayChosenNum]);
      if (!perDayNoLimit) {
        const dayCaps: any[] = Array.isArray(p?.participantDays) ? p.participantDays : [];
        const rawDayCap = dayCaps?.[dayChosenNum];
        const dayCap = Number(rawDayCap);
        if (Number.isFinite(dayCap) && dayCap > 0) {
          const qDay = query(
            collection(db, "ProgramsParticipants"),
            where("programId", "==", programId),
            where("approvalStatus", "==", "Approved"),
            where("role", "==", "Participant"),
            where("dayChosen", "==", dayChosenNum)
          );
          const dayCountSnap = await getCountFromServer(qDay);
          const dayCount = dayCountSnap.data().count || 0;
          if (dayCount >= dayCap) {
            throw new Error("Selected day is already full. Choose another day.");
          }
        }
      }
    }

    return p;
  };

  const uploadAllFiles = async (uidTag: string) => {
    const urls: Record<string, string> = {};
    const entries = Object.entries(formFiles).filter(([, f]) => !!f) as [string, File][];
    for (const [field, file] of entries) {
      const sref = ref(
        storage,
        `Programs/${programId}/walkinUploads/${uidTag}/${Date.now()}-${field}-${file.name}`
      );
      await uploadBytes(sref, file);
      urls[field] = await getDownloadURL(sref);
    }
    return urls;
  };

  const maybeUploadResidentValidID = async (uidTag: string) => {
    const url = residentValidIdUrl;
    if (!url) return {};
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch resident's Valid ID file.");
    const blob = await res.blob();

    const mime = (blob.type || "").toLowerCase();
    let ext = "jpg";
    if (mime.includes("pdf")) ext = "pdf";
    else if (mime.includes("png")) ext = "png";
    else if (mime.includes("jpeg")) ext = "jpg";
    else if (mime.includes("webp")) ext = "webp";

    const sref = ref(
      storage,
      `Programs/${programId}/walkinUploads/${uidTag}/${Date.now()}-validIDjpg-resident.${ext}`
    );
    await uploadBytes(sref, blob);
    const uploadedUrl = await getDownloadURL(sref);
    return { validIDjpg: uploadedUrl } as Record<string, string>;
  };

  const submit = async () => {
    if (!programId) return;
    setSaving(true);
    try {
      if (!nowAllowedByWindow) {
        throw new Error("Walk-ins are only allowed during the scheduled time window today.");
      }

      validateReqForm();

      // (Optional existence check; recheckCapacityServer will also load the program)
      const progRef = doc(db, "Programs", programId);
      const progSnap = await getDoc(progRef);
      if (!progSnap.exists()) throw new Error("Program not found.");

      // Day chosen parse (keep 0 as Day 1)
      const disabledSingle = program?.eventType === "single";
      const dayChosenStr = formData.dayChosen;
      const dayChosenNum =
        !disabledSingle && dayChosenStr !== undefined && dayChosenStr !== ""
          ? Number(dayChosenStr)
          : null;

      const p = await recheckCapacityServer(selectedRole, dayChosenNum);


      if (resident?.id) {
        if (selectedRole === "Participant" && p?.eventType === "multiple" && dayChosenNum !== null) {
          // Fetch all participant docs for this resident & program
          const priorQ = query(
            collection(db, "ProgramsParticipants"),
            where("programId", "==", programId),
            where("residentId", "==", resident.id),
            where("role", "==", "Participant")
          );
          const priorSnap = await getDocs(priorQ);

          // If none -> allowed (covers: "not in ParticipantsLists at all")
          if (!priorSnap.empty) {
            // Block only if same day already enlisted
            const sameDay = priorSnap.docs.find((d) => (d.data()?.dayChosen ?? null) === dayChosenNum);
            if (sameDay) {
              throw new Error(`This resident is already enlisted for Day ${dayChosenNum + 1}.`);
            }

          }
        } else {
          const dupQ = query(
            collection(db, "ProgramsParticipants"),
            where("programId", "==", programId),
            where("residentId", "==", resident.id)
          );
          const dupSnap = await getDocs(dupQ);
          if (!dupSnap.empty) {
            throw new Error("This resident is already enlisted in this program.");
          }
        }
      }

      const firstName = formData.firstName ?? (resident ? resident.firstName || "" : "");
      const lastName = formData.lastName ?? (resident ? resident.lastName || "" : "");
      const contactNumber = formData.contactNumber ?? (resident ? resident.contactNumber || "" : "");
      const emailAddress = formData.emailAddress ?? (resident ? resident.emailAddress || "" : "");
      const location = formData.location ?? (resident ? resident.address || resident.location || "" : "");
      const fullName = (formData.fullName || `${firstName || ""} ${lastName || ""}`.trim()) || "";

      const dateOfBirth = formData.dateOfBirth || "";
      const computedAge = computeAgeFromDOB(dateOfBirth);

      const uidTag = resident?.id ? `resident-${resident.id}` : "manual";
      let uploadedFiles = await uploadAllFiles(uidTag);
      if (needsValidId && !uploadedFiles.validIDjpg && residentValidIdUrl) {
        const autoFiles = await maybeUploadResidentValidID(uidTag);
        uploadedFiles = { ...uploadedFiles, ...autoFiles };
      }

      if (anyAttended) {
        throw new Error("This resident has already attended a day for this program.");
      }

      if (
        typeof dayChosenNum === 'number' &&
        upcomingBookedSet.size > 0 &&
        !upcomingBookedSet.has(dayChosenNum)
      ) {
        throw new Error("This resident already has a future booking for another day.");
      }

      if (typeof dayChosenNum === 'number' && priorDaySet.has(dayChosenNum)) {
        throw new Error(`This resident is already enlisted for Day ${dayChosenNum + 1}.`);
      }

      await addDoc(collection(db, "ProgramsParticipants"), {
        programId,
        programName: p?.programName || programName || "",
        residentId: resident?.id || null,
        role: selectedRole,
        approvalStatus: "Approved",
        addedVia: resident?.id ? "walk-in-resident" : "walk-in-manual",
        createdAt: serverTimestamp(),

        fullName,
        firstName: firstName || "",
        lastName: lastName || "",
        contactNumber: contactNumber || "",
        emailAddress: emailAddress || "",
        location: location || "",

        dateOfBirth: dateOfBirth || "",
        age: computedAge ?? null,


        ...(p?.eventType === "multiple" &&
        dayChosenNum !== null &&
        selectedRole === "Participant"
          ? { dayChosen: dayChosenNum }
          : {}),

        fields: { ...formData, role: selectedRole },
        files: uploadedFiles,
      });

      onSaved?.(`${selectedRole} added successfully!`);
      onClose();
    } catch (e: any) {
      onError?.(e?.message || "Failed to add entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const [autoFillLoading, setAutoFillLoading] = useState(false);
  if (!isOpen) return null;

  const disabledSingle = program?.eventType === "single";
  const days = program?.participantDays ?? [];
  const start = program?.startDate ? new Date(program.startDate) : null;

  return (
    <>
      <div className="program-popup-overlay">
        <div className="program-popup">
          <div className="walkin-participant-backbutton-container">
            <button onClick={onBack}>
              <img
                src="/Images/left-arrow.png"
                alt="Left Arrow"
                className="participant-back-btn-resident"
              />
            </button>
          </div>

          <h2>{resident ? "Complete Requirements" : "Manual Entry"}</h2>
          <h1>* Walk-in Application *</h1>

          <div className="walkin-participant-header-body-bottom-section">
            <div className="walkin-participant-user-info-main-container">
              <div className="walkin-participant-info-main-content">
                {/* Tabs */}
                <nav className="walkin-info-toggle-wrapper">
                  {["details", "reqs"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                      onClick={() => setActiveSection(section as "details" | "reqs")}
                    >
                      {section === "details" && "Details"}
                      {section === "reqs" && "Requirements"}
                    </button>
                  ))}
                </nav>

                {/* ------- DETAILS ------- */}
                {activeSection === "details" && (
                  <>
                    <div className="walkin-details-section">
                      <div className="walkin-details-top">
                        {/* Day selector — ALWAYS visible; disabled for single-day */}
                        <div className="fields-section-walkin" key="tf-dayChosen" style={{ marginBottom: 12 }}>
                          <p>
                            {labelFor("dayChosen")}{" "}
                            {program?.eventType === "multiple" && selectedRole === "Participant" && (
                              <span className="required">*</span>
                            )}
                          </p>

                          <select
                            className="walkin-input-field-day-chosen"
                            value={formData.dayChosen ?? ""}
                            onChange={(e) => handleFormTextChange("dayChosen", e.target.value)}
                            disabled={disabledSingle || lockDaySelection || selectedRole === "Volunteer"}
                            title={
                              disabledSingle
                                ? "One-day event only"
                                : lockDaySelection
                                ? "Day is bound to the parent selection"
                                : undefined
                            }
                          >
                            <option value="">
                              {disabledSingle ? "One-day event only" : "Select a day"}
                            </option>

                            {(days.length ? days : [null]).map((_, idx) => {
                              const dIdx = days.length ? idx : 0;
                              let label = `Day ${dIdx + 1}`;
                              let optionDisabled = disabledSingle || lockDaySelection;

                              if (start) {
                                const optionDate = new Date(start);
                                optionDate.setDate(start.getDate() + dIdx);

                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                optionDate.setHours(0, 0, 0, 0);

                                const isPast = optionDate < today;
                                const isEnded = !!dayEnded[dIdx];

                                if (isPast) optionDisabled = true;
                                if (!disabledSingle && dayFull[dIdx]) {
                                  label += " — FULL";
                                  optionDisabled = true;
                                }
                                if (isEnded) {
                                  label += " — Day Ended";
                                  optionDisabled = true;
                                }
                                if (isSameLocalDay(optionDate, today) && isOngoing && !isNowWithinWindow(optionDate, program?.timeStart, program?.timeEnd)) {
                                  label += " — Outside Time Window";
                                  optionDisabled = true;
                                }

                                const priorGate = isDayDisabledByPrior(dIdx);
                                if (priorGate.disabled) {
                                  label += priorGate.reason ? ` — ${priorGate.reason}` : "";
                                  optionDisabled = true;
                                }

                                label += ` (${optionDate.toDateString()})`;
                              }

                              return (
                                <option key={dIdx} value={String(dIdx)} disabled={optionDisabled}>
                                  {label}
                                </option>
                              );
                            })}

                          </select>
                        </div>

                        <p className="program-type-info">
                          {program?.eventType === "multiple"
                            ? "Multi-day program."
                            : "Single-day program."}
                        </p>

                        {/* Role selector */}
                        <div className="role-selection-section">
                          <p className="program-role-label"> Role <span className="required">*</span></p>
                          <p className="role-label">{LABELS.role}</p>
                          <div className="role-options">
                            <label className="role-option">
                              <div className="orange-radio">
                                <input
                                  type="radio"
                                  name="walkin-role"
                                  value="Participant"
                                  checked={selectedRole === "Participant"}
                                  onChange={() => setSelectedRole("Participant")}
                                />
                              </div>
                              Participant
                            </label>
                            <label className="role-option">
                              <div className="orange-radio">
                                <input
                                  type="radio"
                                  name="walkin-role"
                                  value="Volunteer"
                                  checked={selectedRole === "Volunteer"}
                                  onChange={() => setSelectedRole("Volunteer")}
                                />
                              </div>
                              Volunteer
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="walkin-details-bottom">
                        <div className="walkin-content-left-side">
                          {visibleTextFields
                            .filter((_, idx) => idx % 2 === 0)
                            .map((f) => {
                              const name = f.name;

                              if (name === "dateOfBirth") {
                                return (
                                  <div className="fields-section-walkin" key={`tf-${name}`}>
                                    <p>
                                      {labelFor("dateOfBirth")} <span className="required">*</span>
                                    </p>
                                    <input
                                      type="date"
                                      className="walkin-input-field"
                                      required
                                      max={todayStr}
                                      value={formData.dateOfBirth || ""}
                                      onChange={(e) => handleFormTextChange("dateOfBirth", e.target.value)}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                      <p>{labelFor("age")}</p>
                                      <input
                                        type="text"
                                        className="walkin-input-field"
                                        value={
                                          formData.dateOfBirth
                                            ? derivedAge != null
                                              ? String(derivedAge)
                                              : ""
                                            : ""
                                        }
                                        readOnly
                                        placeholder="Will be computed"
                                      />
                                    </div>
                                  </div>
                                );
                              }

                              const lower = name.toLowerCase();
                              const type =
                                lower.includes("email")
                                  ? "email"
                                  : lower.includes("contact") || lower.includes("phone")
                                  ? "tel"
                                  : "text";

                              const formattedLabel = labelFor(name);

                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {formattedLabel} <span className="required">*</span>
                                  </p>
                                  <input
                                    type={type}
                                    className="walkin-input-field"
                                    required
                                    value={formData[name] ?? ""}
                                    onChange={(e) => handleFormTextChange(name, e.target.value)}
                                    placeholder={`Enter ${formattedLabel}`}
                                  />
                                </div>
                              );
                            })}
                        </div>

                        <div className="walkin-content-right-side">
                          {visibleTextFields
                            .filter((_, idx) => idx % 2 !== 0)
                            .map((f) => {
                              const name = f.name;

                              if (name === "dateOfBirth") {
                                return (
                                  <div className="fields-section-walkin" key={`tf-${name}`}>
                                    <p>
                                      {labelFor("dateOfBirth")} <span className="required">*</span>
                                    </p>
                                    <input
                                      type="date"
                                      className="walkin-input-field"
                                      required
                                      max={todayStr}
                                      value={formData.dateOfBirth || ""}
                                      onChange={(e) => handleFormTextChange("dateOfBirth", e.target.value)}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                      <p>{labelFor("age")}</p>
                                      <input
                                        type="text"
                                        className="walkin-input-field"
                                        value={
                                          formData.dateOfBirth
                                            ? derivedAge != null
                                              ? String(derivedAge)
                                              : ""
                                            : ""
                                        }
                                        readOnly
                                        placeholder="Will be computed"
                                      />
                                    </div>
                                  </div>
                                );
                              }

                              const lower = name.toLowerCase();
                              const type =
                                lower.includes("email")
                                  ? "email"
                                  : lower.includes("contact") || lower.includes("phone")
                                  ? "tel"
                                  : "text";
                              const formattedLabel = labelFor(name);

                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {formattedLabel} <span className="required">*</span>
                                  </p>
                                  <input
                                    type={type}
                                    className="walkin-input-field"
                                    required
                                    value={formData[name] ?? ""}
                                    onChange={(e) => handleFormTextChange(name, e.target.value)}
                                    placeholder={`Enter ${formattedLabel}`}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ------- REQUIREMENTS ------- */}
                {activeSection === "reqs" && (
                  <>
                    <div className="walkin-requirements-section">
                      {visibleFileFields.map((f) => {
                        const name = f.name;
                        const isValidId = name === "validIDjpg";
                        const formattedLabel = prettifyFieldName(name, prettyLabels);

                        const preview = filePreviews[name];
                        const hasManual = !!formFiles[name];

                        return (
                          <div
                            key={`ff-${name}`}
                            className="box-container-outer-photosprogram"
                            style={{
                              flex: visibleFileFields.length === 1 ? "0 0 40%" : "0 0 calc(50% - 20px)",
                              display: "flex",
                              justifyContent: visibleFileFields.length === 1 ? "center" : "flex-start",
                            }}
                          >
                            <div className="title-walkin-requirements">{formattedLabel}</div>

                            <div className="box-container-resindentificationpic">
                              <div className="file-upload-container">
                                <label htmlFor={`file-${name}`} className="upload-link" style={{ cursor: "pointer" }}>
                                  {hasManual ? "Replace File" : "Click to Upload File"}
                                </label>

                                <input
                                  ref={(el) => {
                                    fileInputRefs.current[name] = el;
                                  }}
                                  id={`file-${name}`}
                                  type="file"
                                  className="file-upload-input"
                                  accept="image/*,application/pdf,.pdf"
                                  onChange={(e) => handleFormFileChange(name, e.currentTarget)}
                                  style={{ display: "none" }}
                                />

                                {(hasManual || preview?.url) && (
                                  <div className="file-name-image-display">
                                    <div className="file-name-image-display-indiv">
                                      {preview?.url ? (
                                        preview.isPdf ? (
                                          <a
                                            href={preview.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="file-link"
                                            style={{ marginRight: 8 }}
                                          >
                                            Open PDF in new tab
                                          </a>
                                        ) : (
                                          <>
                                            <a
                                              href={preview.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title={`Open ${formattedLabel} in a new tab`}
                                            >
                                              <img
                                                src={preview.url}
                                                alt={`${formattedLabel} preview`}
                                                style={{
                                                  width: 50,
                                                  height: 50,
                                                  marginRight: 8,
                                                  objectFit: "cover",
                                                  borderRadius: 4,
                                                }}
                                              />
                                            </a>
                                            <a
                                              href={preview.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="file-link"
                                              style={{ fontSize: 12 }}
                                            >
                                              Open full view
                                            </a>
                                          </>
                                        )
                                      ) : null}

                                      <span style={{ marginLeft: 8 }}>
                                        {hasManual
                                          ? formFiles[name]?.name || "File selected"
                                          : isValidId
                                          ? "Auto-attached from resident"
                                          : "Preview"}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {!hasManual && !preview?.url && (
                                  <small style={{ display: "block", marginTop: 6, opacity: 0.8 }}>
                                    No file chosen
                                  </small>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="action-btn-section-verify-section-participant">
            <div className="action-btn-section-verify">
              <button className="participant-action-reject" onClick={onClose} disabled={saving || autoFillLoading}>
                Cancel
              </button>

              <button
                className="participant-action-accept"
                onClick={submit}
                disabled={saving || autoFillLoading || !nowAllowedByWindow}
                title={!nowAllowedByWindow ? "Walk-ins only allowed during the scheduled time window" : undefined}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              {/* Optional auto-fill for participants only (kept commented) */}
              {/* <button
                className="participant-action-accept"
                style={{ marginLeft: 8 }}
                onClick={autoFillMissingForSelectedDay}
                disabled={autoFillLoading || saving || !(formData.dayChosen ?? "") || selectedRole !== "Participant"}
                title={
                  selectedRole !== "Participant"
                    ? "Auto-fill is for participants only"
                    : !formData.dayChosen
                    ? "Select a day first"
                    : "Auto-fill remaining slots for selected day"
                }
              >
                {autoFillLoading ? "Auto-filling..." : "Auto-fill Remaining for Day"}
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
