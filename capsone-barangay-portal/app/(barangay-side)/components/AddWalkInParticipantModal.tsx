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
  dateOfBirth?: string; // YYYY-MM-DD
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;

  programId: string;
  programName?: string;

  textFields: SimpleField[];
  fileFields: SimpleField[];

  resident: Resident | null; // null for manual entry

  onSaved: (msg?: string) => void;
  onError?: (msg: string) => void;

  prettyLabels?: Record<string, string>;
};

const DEFAULT_LABELS: Record<string, string> = {
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

// Minimal program shape for schedule/day options
type ProgramLite = {
  id: string;
  eventType?: "single" | "multiple";
  startDate?: string; // "YYYY-MM-DD"
  participantDays?: number[]; // array length = number of days
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
}: Props) {
  const LABELS = prettyLabels || DEFAULT_LABELS;

  // Prefill from resident (if any)
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
    return init;
  });

  const [formFiles, setFormFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);

  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // --- Load program to power dayChosen select ---
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
          eventType: p.eventType,
          startDate: p.startDate,
          participantDays: Array.isArray(p.participantDays) ? p.participantDays : [],
        });
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [programId]);

  // --- Determine which days are already FULL (Approved >= cap) ---
  const [dayFull, setDayFull] = useState<boolean[]>([]);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!programId) return;

      const progSnap = await getDoc(doc(db, "Programs", programId));
      if (!progSnap.exists()) return;

      const pd: number[] = Array.isArray((progSnap.data() as any)?.participantDays)
        ? (progSnap.data() as any).participantDays
        : [];

      const checks = pd.map(async (rawCap: any, idx: number) => {
        const cap = Number(rawCap);
        if (!Number.isFinite(cap) || cap <= 0) return false; // no/invalid cap => never "full"

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

  // If current selection becomes FULL after the effect above, clear it.
  useEffect(() => {
    const v = formData.dayChosen;
    if (v === undefined || v === "") return;
    const idx = Number(v);
    if (Number.isInteger(idx) && dayFull[idx]) {
      setFormData((prev) => ({ ...prev, dayChosen: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFull]);

  // --- Previews for ALL file fields ---
  const residentValidIdUrl = resident?.verificationFilesURLs?.[0] || "";
  const [filePreviews, setFilePreviews] = useState<Record<string, Preview>>({});
  const previewsRef = useRef<Record<string, Preview>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({}); // custom trigger targets

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

      // cleanup stale object URLs
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

  const textFieldsToRender = useMemo<SimpleField[]>(
    () => (textFields?.length ? textFields : []),
    [textFields]
  );
  const fileFieldsToRender = useMemo<SimpleField[]>(
    () => (fileFields?.length ? fileFields : []),
    [fileFields]
  );

  function prettifyFieldName(name: string, prettyLabels?: Record<string, string>): string {
  // 1. Check overrides
  if (prettyLabels?.[name]) return prettyLabels[name];
  if (DEFAULT_LABELS[name]) return DEFAULT_LABELS[name];

  // 2. Clean file extensions
  let label = name.replace(/\.(jpg|jpeg|png|pdf)$/i, "");

  // 3. Insert spaces before capital letters
  label = label.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  // 4. Uppercase first letter
  label = label.charAt(0).toUpperCase() + label.slice(1);

  // 5. Fix common cases
  label = label.replace(/\bId\b/g, "ID");

  return label;
}


  const needsValidId = fileFieldsToRender.some((f) => f.name === "validIDjpg");
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

  // Derived age from formData.dateOfBirth (if present)
  const dobInForm = formData["dateOfBirth"] || "";
  const derivedAge = useMemo(() => computeAgeFromDOB(dobInForm), [dobInForm]);

  const validateReqForm = () => {
    for (const f of textFieldsToRender) {
      const val = (formData[f.name] ?? "").toString().trim();
      if (!val) throw new Error(`Please fill out: ${labelFor(f.name)}`);
    }
    for (const f of fileFieldsToRender) {
      const hasManual = !!formFiles[f.name];
      if (!hasManual) {
        if (f.name === "validIDjpg" && residentValidIdUrl) continue; // allow auto-attach
        throw new Error(`Please upload: ${labelFor(f.name)}`);
      }
    }
  };

  // Capacity check (Approved + role: 'Participant')
  const recheckCapacityServer = async () => {
    const partQ = query(
      collection(db, "ProgramsParticipants"),
      where("programId", "==", programId),
      where("approvalStatus", "==", "Approved"),
      where("role", "==", "Participant")
    );
    const countSnap = await getCountFromServer(partQ);
    const currentCount = countSnap.data().count || 0;

    const progSnap = await getDoc(doc(db, "Programs", programId));
    const capacity = Number((progSnap.data() as any)?.participants);
    if (Number.isFinite(capacity) && currentCount >= capacity) {
      throw new Error("Program capacity reached. Cannot add more participants.");
    }
    return progSnap.data() as any;
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
  // Send SMS via ClickSend API
  const sendApprovedSMS = async (contactNumber: string, fullName: string, programName: string, role: string) => {
    try {
      const response = await fetch("/api/clickSendApi", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            to: contactNumber,
            message: `Hello ${fullName}, your Walk-In registration for the program "${programName}" as "${role}" has been approved. Thank you!`,
        })
      });   
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } 

      } catch (error) {
        console.error("Error sending SMS:", error);

    }
  }


  const submit = async () => {
    if (!programId) return;
    setSaving(true);
    try {
      validateReqForm();

      const progRef = doc(db, "Programs", programId);
      const progSnap = await getDoc(progRef);
      if (!progSnap.exists()) throw new Error("Program not found.");
      const statusNow = (progSnap.data()?.progressStatus || "").toString().toLowerCase();
      if (["rejected", "completed"].includes(statusNow)) {
        throw new Error(`This program is ${progSnap.data()?.progressStatus}. You can’t add participants.`);
      }

      if (resident?.id) {
        const dupQ = query(
          collection(db, "ProgramsParticipants"),
          where("programId", "==", programId),
          where("residentId", "==", resident.id)
        );
        const dupSnap = await getDocs(dupQ);
        if (!dupSnap.empty) throw new Error("This resident is already enlisted in this program.");
      }

      await recheckCapacityServer();

      const firstName = formData.firstName ?? (resident ? resident.firstName || "" : "");
      const lastName = formData.lastName ?? (resident ? resident.lastName || "" : "");
      const contactNumber = formData.contactNumber ?? (resident ? resident.contactNumber || "" : "");
      const emailAddress = formData.emailAddress ?? (resident ? resident.emailAddress || "" : "");
      const location = formData.location ?? (resident ? resident.address || resident.location || "" : "");
      const fullName = (formData.fullName || `${firstName || ""} ${lastName || ""}`.trim()) || "";

      // DOB + Age for saving
      const dateOfBirth = formData.dateOfBirth || "";
      const computedAge = computeAgeFromDOB(dateOfBirth);

      // dayChosen: keep 0 as Day 1
      const dayChosenStr = formData.dayChosen; // "0" | "1" | "2" | undefined
      const dayChosenNum =
        dayChosenStr !== undefined && dayChosenStr !== "" ? Number(dayChosenStr) : null;

      const uidTag = resident?.id ? `resident-${resident.id}` : "manual";
      let uploadedFiles = await uploadAllFiles(uidTag);

      if (needsValidId && !uploadedFiles.validIDjpg && residentValidIdUrl) {
        const autoFiles = await maybeUploadResidentValidID(uidTag);
        uploadedFiles = { ...uploadedFiles, ...autoFiles };
      }

      await addDoc(collection(db, "ProgramsParticipants"), {
        programId,
        programName: progSnap.data()?.programName || programName || "",
        residentId: resident?.id || null,
        role: "Participant",
        approvalStatus: "Approved",
        addedVia: resident?.id ? "walk-in-resident" : "walk-in-manual",
        createdAt: serverTimestamp(),

        fullName,
        firstName: firstName || "",
        lastName: lastName || "",
        contactNumber: contactNumber || "",
        emailAddress: emailAddress || "",
        location: location || "",

        // store DOB & derived age top-level for convenience in reviews
        dateOfBirth: dateOfBirth || "",
        age: computedAge ?? null,

        // ✅ include selected day when provided (keeps Day 1 = 0)
        ...(dayChosenNum !== null ? { dayChosen: dayChosenNum } : {}),

        // keep full map of submitted fields (including DOB and dayChosen string)
        fields: formData,
        files: uploadedFiles,
      });

      onSaved?.("Participant added successfully!");
      onClose();
    } catch (e: any) {
      onError?.(e?.message || "Failed to add participant. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // --- AUTO-FILL from Residents ---

  const [autoFillLoading, setAutoFillLoading] = useState(false);

  const getProgramCapacityNumber = (val: any): number | null => {
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const autoFillMissingForSelectedDay = async () => {
    if (!programId) return;

    // dayChosen is required to auto-fill for a specific day
    const dayChosenStr = formData.dayChosen;
    if (dayChosenStr === undefined || dayChosenStr === "") {
      onError?.("Please select a day first.");
      return;
    }
    const dayChosen = Number(dayChosenStr);

    setAutoFillLoading(true);
    try {
      // 1) Program + caps
      const progRef = doc(db, "Programs", programId);
      const progSnap = await getDoc(progRef);
      if (!progSnap.exists()) throw new Error("Program not found.");

      const progData: any = progSnap.data() || {};
      const statusNow = (progData?.progressStatus || "").toString().toLowerCase();
      if (["rejected", "completed"].includes(statusNow)) {
        throw new Error(`This program is ${progData?.progressStatus}. You can’t add participants.`);
      }

      // Per-day capacity (array), keep Day 1 = index 0
      const dayCaps: any[] = Array.isArray(progData?.participantDays)
        ? progData.participantDays
        : [];
      const rawDayCap = dayCaps?.[dayChosen];
      const dayCap =
        Number.isFinite(Number(rawDayCap)) && Number(rawDayCap) > 0
          ? Number(rawDayCap)
          : null;

      // Optional global capacity
      const globalCap =
        Number.isFinite(Number(progData?.participants)) && Number(progData?.participants) > 0
          ? Number(progData.participants)
          : null;

      // 2) Count current approved participants FOR THIS DAY
      const approvedForDayQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", programId),
        where("approvalStatus", "==", "Approved"),
        where("role", "==", "Participant"),
        where("dayChosen", "==", dayChosen)
      );
      const approvedForDaySnap = await getCountFromServer(approvedForDayQ);
      const currentApprovedForDay = approvedForDaySnap.data().count || 0;

      // 3) Also count total approved (to respect global cap if present)
      let currentApprovedTotal = 0;
      if (globalCap !== null) {
        const approvedTotalSnap = await getCountFromServer(
          query(
            collection(db, "ProgramsParticipants"),
            where("programId", "==", programId),
            where("approvalStatus", "==", "Approved"),
            where("role", "==", "Participant")
          )
        );
        currentApprovedTotal = approvedTotalSnap.data().count || 0;
      }

      // 4) Compute how many to add
      let toAddFromDay = dayCap === null ? 10 : Math.max(0, dayCap - currentApprovedForDay);
      if (toAddFromDay <= 0) {
        onError?.("No remaining day slots to fill.");
        return;
      }
      if (globalCap !== null) {
        const globalRemaining = Math.max(0, globalCap - currentApprovedTotal);
        if (globalRemaining <= 0) {
          onError?.("No remaining global slots to fill.");
          return;
        }
        toAddFromDay = Math.min(toAddFromDay, globalRemaining);
      }

      // 5) Build a set of residentIds already enlisted (any status/role) to avoid duplicates
      const enlistedSnap = await getDocs(
        query(collection(db, "ProgramsParticipants"), where("programId", "==", programId))
      );
      const alreadyInProgram = new Set<string>();
      for (const d of enlistedSnap.docs) {
        const rId = (d.data() as any).residentId;
        if (rId) alreadyInProgram.add(rId);
      }

      // 6) Fetch Residents and pick eligible ones (not yet in this program)
      const residentsSnap = await getDocs(collection(db, "Residents"));
      const candidates: Resident[] = [];
      for (const d of residentsSnap.docs) {
        if (candidates.length >= toAddFromDay) break;
        if (alreadyInProgram.has(d.id)) continue;
        const r: any = { id: d.id, ...d.data() };
        if (r.firstName || r.lastName) candidates.push(r as Resident);
      }

      if (candidates.length === 0) {
        onError?.("No eligible residents found to auto-fill.");
        return;
      }

      // 7) Insert participants as Approved for the selected day
      const chosen = candidates.slice(0, toAddFromDay);
      let successAdds = 0;

      for (const r of chosen) {
        const fullName = `${r.firstName || ""} ${
          r.middleName ? r.middleName + " " : ""
        }${r.lastName || ""}`
          .replace(/\s+/g, " ")
          .trim();

        await addDoc(collection(db, "ProgramsParticipants"), {
          programId,
          programName: progData?.programName || programName || "",
          residentId: r.id,
          role: "Participant",
          approvalStatus: "Approved",
          addedVia: "auto-fill",
          createdAt: serverTimestamp(),

          fullName,
          firstName: r.firstName || "",
          lastName: r.lastName || "",
          contactNumber: r.contactNumber || "",
          emailAddress: r.emailAddress || "",
          location: r.address || r.location || "",

          dateOfBirth: r.dateOfBirth || "",
          age: computeAgeFromDOB(r.dateOfBirth || "") ?? null,

          dayChosen, // ✅ lock to selected day

          fields: { autoFilled: "true", source: "Residents", dayChosen: String(dayChosen) },
          files: {},
        });

        successAdds++;
      }

      onSaved?.(
        `Auto-filled ${successAdds} participant${successAdds !== 1 ? "s" : ""} for Day ${
          dayChosen + 1
        }.`
      );
    } catch (e: any) {
      onError?.(e?.message || "Failed to auto-fill participants.");
    } finally {
      setAutoFillLoading(false);
    }
  };
  

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

          <h2> {resident ? "Complete Requirements" : "Manual Entry"} </h2>
          <h1>* Walk-in Participant Application *</h1>

          <div className="walkin-participant-header-body-bottom-section">
            <div className="walkin-participant-user-info-main-container">
              <div className="walkin-participant-info-main-content">
                <nav className="walkin-info-toggle-wrapper">
                  {["details", "reqs"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      className={`info-toggle-btn ${
                        activeSection === section ? "active" : ""
                      }`}
                      onClick={() => setActiveSection(section as "details" | "reqs")}
                    >
                      {section === "details" && "Details"}
                      {section === "reqs" && "Requirements"}
                    </button>
                  ))}
                </nav>

                {activeSection === "details" && (
                  <>
                    <div className="walkin-details-section">
                      {/* Left column */}
                      <div className="walkin-content-left-side">
                        {textFieldsToRender
                          .filter((_, idx) => idx % 2 === 0) // even indexes go left
                          .map((f) => {
                            const name = f.name;

                            // Special handling for dateOfBirth → date input + Age field
                            if (name === "dateOfBirth") {
                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {labelFor("dateOfBirth")}{" "}
                                    <span className="required">*</span>
                                  </p>
                                  <input
                                    type="date"
                                    className="walkin-input-field"
                                    required
                                    max={todayStr}
                                    value={formData.dateOfBirth || ""}
                                    onChange={(e) =>
                                      handleFormTextChange("dateOfBirth", e.target.value)
                                    }
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

                            // Special handling for dayChosen → dropdown from program schedule
                            if (name === "dayChosen") {
                              const days = program?.participantDays ?? [];
                              const start = program?.startDate
                                ? new Date(program.startDate)
                                : null;

                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {labelFor("dayChosen")}{" "}
                                    <span className="required">*</span>
                                  </p>
                                  <select
                                    className="walkin-input-field"
                                    required
                                    // keep "0" using nullish coalescing (avoid falsy bug)
                                    value={formData.dayChosen ?? ""}
                                    onChange={(e) =>
                                      handleFormTextChange("dayChosen", e.target.value)
                                    }
                                  >
                                    <option value="" disabled>
                                      Select a day
                                    </option>
                                    {days.map((_, idx) => {
                                      let label = `Day ${idx + 1}`;
                                      let disabled = false;
                                      if (start) {
                                        const optionDate = new Date(start);
                                        optionDate.setDate(start.getDate() + idx);
                                        label += ` (${optionDate.toDateString()})`;
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        optionDate.setHours(0, 0, 0, 0);
                                        if (optionDate < today) disabled = true; // disable past days
                                      }
                                      const isFull = !!dayFull[idx];
                                      if (isFull) {
                                        label += " — FULL";
                                        disabled = true; // 🚫 cannot be chosen if cap is met
                                      }
                                      return (
                                        <option key={idx} value={String(idx)} disabled={disabled}>
                                          {label}
                                        </option>
                                      );
                                    })}
                                  </select>
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

                            const formattedLabel = name
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (s) => s.toUpperCase());

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

                      {/* Right column */}
                      <div className="walkin-content-right-side">
                        {textFieldsToRender
                          .filter((_, idx) => idx % 2 !== 0) // odd indexes go right
                          .map((f) => {
                            const name = f.name;

                            if (name === "dateOfBirth") {
                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {labelFor("dateOfBirth")}{" "}
                                    <span className="required">*</span>
                                  </p>
                                  <input
                                    type="date"
                                    className="walkin-input-field"
                                    required
                                    max={todayStr}
                                    value={formData.dateOfBirth || ""}
                                    onChange={(e) =>
                                      handleFormTextChange("dateOfBirth", e.target.value)
                                    }
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

                            // Duplicate dayChosen handling for right column
                            if (name === "dayChosen") {
                              const days = program?.participantDays ?? [];
                              const start = program?.startDate
                                ? new Date(program.startDate)
                                : null;

                              return (
                                <div className="fields-section-walkin" key={`tf-${name}`}>
                                  <p>
                                    {labelFor("dayChosen")}{" "}
                                    <span className="required">*</span>
                                  </p>
                                  <select
                                    className="walkin-input-field"
                                    required
                                    value={formData.dayChosen ?? ""}
                                    onChange={(e) =>
                                      handleFormTextChange("dayChosen", e.target.value)
                                    }
                                  >
                                    <option value="" disabled>
                                      Select a day
                                    </option>
                                    {days.map((_, idx) => {
                                      let label = `Day ${idx + 1}`;
                                      let disabled = false;
                                      if (start) {
                                        const optionDate = new Date(start);
                                        optionDate.setDate(start.getDate() + idx);
                                        label += ` (${optionDate.toDateString()})`;
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        optionDate.setHours(0, 0, 0, 0);
                                        if (optionDate < today) disabled = true;
                                      }
                                      const isFull = !!dayFull[idx];
                                      if (isFull) {
                                        label += " — FULL";
                                        disabled = true;
                                      }
                                      return (
                                        <option key={idx} value={String(idx)} disabled={disabled}>
                                          {label}
                                        </option>
                                      );
                                    })}
                                  </select>
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
                            const formattedLabel = name
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (s) => s.toUpperCase());

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
                  </>
                )}

                {activeSection === "reqs" && (
                  <>
                    <div className="walkin-requirements-section">
                      {fileFieldsToRender.map((f) => {
                        const name = f.name;
                        const isValidId = name === "validIDjpg";
                        const formattedLabel = name
                          .replace(/jpg$/i, "")
                          .replace(/jpeg$/i, "")
                          .replace(/png$/i, "")
                          .replace(/pdf$/i, "")
                          .replace(/([a-z])([A-Z])/g, "$1 $2")
                          .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
                          .replace(/^./, (s) => s.toUpperCase())
                          .replace(/\bId\b/g, "ID");

                        const preview = filePreviews[name];
                        const hasManual = !!formFiles[name];

                        return (
                          <div
                            key={`ff-${name}`}
                            className="box-container-outer-photosprogram"
                            style={{
                              flex:
                                fileFieldsToRender.length === 1
                                  ? "0 0 40%"
                                  : "0 0 calc(50% - 20px)",
                              display: "flex",
                              justifyContent:
                                fileFieldsToRender.length === 1 ? "center" : "flex-start",
                            }}
                          >
                            <div className="title-walkin-requirements">{formattedLabel}</div>

                            <div className="box-container-resindentificationpic">
                              <div className="file-upload-container">
                                <label
                                  htmlFor={`file-${name}`}
                                  className="upload-link"
                                  style={{ cursor: "pointer" }}
                                >
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
                                  onChange={(e) =>
                                    handleFormFileChange(name, e.currentTarget)
                                  }
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
              <button
                className="participant-action-reject"
                onClick={onClose}
                disabled={saving || autoFillLoading}
              >
                Cancel
              </button>

              <button
                className="participant-action-accept"
                onClick={()=>{
                  //sendApprovedSMS(programName,formData.contactNumber ?? "", formData.firstName ?? "", "Participant");
                  submit();

                }}
                disabled={saving || autoFillLoading}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              {/* New: Auto-fill button */}
              {/* <button
                className="participant-action-accept"
                style={{ marginLeft: 8 }}
                onClick={autoFillMissingForSelectedDay}
                disabled={autoFillLoading || saving || !(formData.dayChosen ?? "")}
                title={
                  !formData.dayChosen
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
