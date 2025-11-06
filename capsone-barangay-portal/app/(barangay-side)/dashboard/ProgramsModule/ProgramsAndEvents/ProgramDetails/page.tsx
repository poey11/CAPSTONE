"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useSession } from "next-auth/react";

type SimpleField = { name: string; description?: string };

// ---------- Announcement helpers / types (copied/adapted from Announcements) ----------
const pad2 = (n: number) => n.toString().padStart(2, "0");

const formatDate12 = (date: Date): string => {
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const yy = date.getFullYear().toString().slice(-2);

  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const HH = pad2(hours);
  const MM = pad2(date.getMinutes());
  const SS = pad2(date.getSeconds());

  return `${mm}/${dd}/${yy} ${HH}:${MM}:${SS} ${ampm}`;
};

const formatDateLong = (dateStr: string): string => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime12 = (timeStr: string): string => {
  if (!timeStr || !timeStr.includes(":")) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${pad2(m)}${ampm}`;
};

interface AnnouncementFormProps {
  announcementHeadline?: string;
  category?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: string;
  content?: string;
  isActive?: boolean;
  isInFeatured?: string;
}


const PREDEFINED_REQ_TEXT: SimpleField[] = [
  { name: "firstName", description: "Used to save the first name of the participant" },
  { name: "lastName", description: "Used to save the last name of the participant" },
  { name: "contactNumber", description: "Used to save the contact number of the participant" },
  { name: "emailAddress", description: "Used to save the email address of the participant" },
  { name: "location", description: "Used to save the address of the participant" },
  { name: "dateOfBirth", description: "Used to save the participant's date of birth (enables age checks)" },
  { name: "dayChosen", description: "Used to save the chosen day for the program" },
];

const PREDEFINED_REQ_FILES: SimpleField[] = [
  { name: "validIDjpg", description: "Used to save the uploaded valid ID of the participant" },
];

const toSet = (arr: SimpleField[]) =>
  new Set(
    arr
      .filter(Boolean)
      .map((f) => f.name?.toLowerCase().trim())
      .filter(Boolean) as string[]
  );

const dedupeByName = (arr: SimpleField[]) => {
  const seen = new Set<string>();
  const out: SimpleField[] = [];
  for (const f of arr) {
    const k = f?.name?.toLowerCase().trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ name: f.name.trim() });
  }
  return out;
};

export default function ProgramDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const programId = searchParams.get("id");

  const user = session?.user as any;
  const userPosition = user?.position || "";
  const reviewerName = [userPosition, user?.fullName || user?.name || ""].filter(Boolean).join(" ");

  // Roles
  const isPunongBarangay = userPosition === "Punong Barangay";
  const isHigherUp = isPunongBarangay;

  type Section = "details" | "reqs" | "others" | "reject";
  const [activeSection, setActiveSection] = useState<Section>("details");

  // Popups / toasts
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSaveConfirmPopup, setShowSaveConfirmPopup] = useState(false);
  const [showSmsPromptPopup, setShowSmsPromptPopup] = useState(false);

  // NEW: Announcement popups/errors
  const [showAddAnnouncementPopup, setShowAddAnnouncementPopup] = useState(false);
  const [showAnnouncementSubmitPopup, setShowAnnouncementSubmitPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupErrorMessage, setPopupErrorMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  // Form state
  const [programName, setProgramName] = useState("");
  const [participants, setParticipants] = useState<string>("");
  const [volunteers, setVolunteers] = useState<string>("");
  const [eligibleParticipants, setEligibleParticipants] = useState("");
  const [location, setLocation] = useState("");

  // Event type + dates/times
  const [eventType, setEventType] = useState<"single" | "multiple">("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  // ORIGINAL schedule snapshot (for diffing in announcement)
  const [originalEventType, setOriginalEventType] = useState<"single" | "multiple">("single");
  const [originalSingleDate, setOriginalSingleDate] = useState("");
  const [originalStartDate, setOriginalStartDate] = useState("");
  const [originalEndDate, setOriginalEndDate] = useState("");
  const [originalTimeStart, setOriginalTimeStart] = useState("");
  const [originalTimeEnd, setOriginalTimeEnd] = useState("");

  // createdAt + minStartDate (>= createdAt + 4 days, also not in the past)
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [minDate, setMinDate] = useState<string>(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(0, 0, 0, 0);
    return t.toISOString().split("T")[0];
  });

  // Text areas
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");

  // --- Minimum character requirements (same as create modal) ---
  const MIN_SUMMARY_CHARS = 200;
  const MIN_DESC_CHARS = 300;
  const summaryLen = summary.trim().length;
  const descriptionLen = description.trim().length;

  const [existingPhotoURL, setExistingPhotoURL] = useState<string | null>(null); // cover
  const [existingPhotoURLs, setExistingPhotoURLs] = useState<string[]>([]); // gallery

  // Newly selected (not yet uploaded)
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewURLs, setPreviewURLs] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Statuses
  const [approvalStatus, setApprovalStatus] = useState<string>("Pending");
  const [progressStatus, setProgressStatus] = useState<string>("Upcoming");
  const [activeStatus, setActiveStatus] = useState<"Active" | "Inactive">("Inactive");
  const [rejectionReason, setRejectionReason] = useState("");

  // Who suggested
  const [suggestedBy, setSuggestedBy] = useState<string>("");
  const [suggestedByUid, setSuggestedByUid] = useState<string | null>(null);

  // Errors + shake
  const [errors, setErrors] = useState<{ [k: string]: boolean }>({});
  const [shake, setShake] = useState<{ [k: string]: boolean }>({});
  const triggerShake = (field: string, ms = 300) => {
    setShake((prev) => ({ ...prev, [field]: true }));
    window.setTimeout(() => setShake((prev) => ({ ...prev, [field]: false })), ms);
  };

  //  Agency
  const [agency, setAgency] = useState("");
  const [otherAgency, setOtherAgency] = useState("");

  // Age restriction
  const [noAgeLimit, setNoAgeLimit] = useState(true);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");

  // Requirements
  const [reqTextFields, setReqTextFields] = useState<SimpleField[]>([]);
  const [reqFileFields, setReqFileFields] = useState<SimpleField[]>([]);
  const [reqTextNew, setReqTextNew] = useState("");
  const [reqFileNew, setReqFileNew] = useState("");
  const [isPredefinedOpen, setIsPredefinedOpen] = useState(false);


  const addReqText = () => {
    const v = reqTextNew.trim();
    if (!v) return;
    const lc = v.toLowerCase();
    const pre = toSet(PREDEFINED_REQ_TEXT);
    const exists = pre.has(lc) || reqTextFields.some((f) => f.name.toLowerCase() === lc);
    if (exists) {
      setReqTextNew("");
      return;
    }
    setReqTextFields((prev) => [...prev, { name: v }]);
    setReqTextNew("");
  };
  const addReqFile = () => {
    const v = reqFileNew.trim();
    if (!v) return;
    const lc = v.toLowerCase();
    const pre = toSet(PREDEFINED_REQ_FILES);
    const exists = pre.has(lc) || reqFileFields.some((f) => f.name.toLowerCase() === lc);
    if (exists) {
      setReqFileNew("");
      return;
    }
    setReqFileFields((prev) => [...prev, { name: v }]);
    setReqFileNew("");
  };
  const removeReqText = (i: number) => setReqTextFields((prev) => prev.filter((_, idx) => idx !== i));
  const removeReqFile = (i: number) => setReqFileFields((prev) => prev.filter((_, idx) => idx !== i));


  // Announcement state (for popup)
  const [newAnnouncement, setNewAnnouncement] = useState<AnnouncementFormProps>({
    createdAt: formatDate12(new Date()),
    createdBy: user?.fullName || user?.name || "",
    category: "Barangay Event",
    isInFeatured: "Inactive",
    isActive: true,
  });
  const [announcementPreview, setAnnouncementPreview] = useState<string | null>(null);

  // --- EDIT & VISIBILITY RULES (updated) ---
  // - Pending: Punong Barangay can edit ALL fields.
  // - Approved + Upcoming: Punong Barangay can ONLY edit dates + timeStart + timeEnd.
  // - Others: fully locked.
  const canEditAll = (() => {
    if (approvalStatus === "Pending") return isPunongBarangay;
    return false;
  })();

  const canEditSchedule = isPunongBarangay && approvalStatus === "Approved" && progressStatus === "Upcoming";

  // General "read-only" for non-schedule fields
  const isReadOnly = !canEditAll;
  // Completely read-only (even schedule cannot be edited)
  const isCompletelyReadOnly = !canEditAll && !canEditSchedule;
  // Convenience flag for date/time controls
  const canEditDatesAndTimes = canEditAll || canEditSchedule;

  const showActiveToggle =
    isHigherUp && approvalStatus !== "Pending" && approvalStatus !== "Rejected" && progressStatus !== "Completed";

  const [noParticipantLimit, setNoParticipantLimit] = useState(false);
  const [participantDays, setParticipantDays] = useState<number[]>([]);
  const [noParticipantLimitList, setNoParticipantLimitList] = useState<boolean[]>([]);

  // Load program
  useEffect(() => {
    const load = async () => {
      if (!programId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "Programs", programId));
        if (!snap.exists()) {
          setPopupMessage("Program not found.");
          setShowPopup(true);
          return;
        }
        const data: any = snap.data() || {};
        setNoParticipantLimit(data.noParticipantLimit || false);
        setParticipantDays(data.participantDays || []);
        setNoParticipantLimitList(data.noParticipantLimitList || []);

        // createdAt + minDate (>= createdAt + 4 days, and not before today)
        const createdAtRaw: any = data.createdAt;
        if (createdAtRaw) {
          let base: Date;
          if (typeof createdAtRaw.toDate === "function") {
            base = createdAtRaw.toDate();
          } else {
            base = new Date(createdAtRaw);
          }
          base.setHours(0, 0, 0, 0);

          const minFromCreated = new Date(base);
          minFromCreated.setDate(minFromCreated.getDate() + 4);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const finalMin = minFromCreated < today ? today : minFromCreated;
          setCreatedAt(base);
          setMinDate(finalMin.toISOString().split("T")[0]);
        }

        setProgramName(data.programName ?? "");
        setParticipants(typeof data.participants === "number" ? String(data.participants) : data.participants ?? "");
        setVolunteers(typeof data.volunteers === "number" ? String(data.volunteers) : data.volunteers ?? "");
        setEligibleParticipants(data.eligibleParticipants ?? "");
        setLocation(data.location ?? "");

        //  Load agency fields
        setAgency(data.agencyRaw || data.agency || ""); // prefer raw if present
        setOtherAgency(data.otherAgency || "");

        //  Load age restriction
        const ar = data.ageRestriction || {};
        setNoAgeLimit(!!ar.noAgeLimit || (ar.minAge == null && ar.maxAge == null));
        setAgeMin(ar.minAge != null ? String(ar.minAge) : "");
        setAgeMax(ar.maxAge != null ? String(ar.maxAge) : "");

        setApprovalStatus(data.approvalStatus ?? "Pending");
        setProgressStatus(data.progressStatus ?? "Upcoming");
        setActiveStatus((data.activeStatus as "Active" | "Inactive") ?? "Inactive");

        setRejectionReason(data.rejectionReason ?? "");

        setSuggestedBy(data.suggestedBy ?? "");
        setSuggestedByUid(data.suggestedByUid ?? null);

        const existingEventType = data.eventType as "single" | "multiple" | undefined;
        const sDate = data.startDate ?? "";
        const eDate = data.endDate ?? "";

        if (existingEventType) {
          if (existingEventType === "single") {
            const single = sDate || eDate || "";
            setEventType("single");
            setSingleDate(single);
            setStartDate("");
            setEndDate("");
            // originals
            setOriginalEventType("single");
            setOriginalSingleDate(single);
            setOriginalStartDate("");
            setOriginalEndDate("");
          } else {
            const start = sDate || "";
            const end = eDate || "";
            setEventType("multiple");
            setStartDate(start);
            setEndDate(end);
            setSingleDate("");
            // originals
            setOriginalEventType("multiple");
            setOriginalStartDate(start);
            setOriginalEndDate(end);
            setOriginalSingleDate("");
          }
        } else {
          if (sDate && eDate && sDate === eDate) {
            setEventType("single");
            setSingleDate(sDate);
            setOriginalEventType("single");
            setOriginalSingleDate(sDate);
            setOriginalStartDate("");
            setOriginalEndDate("");
          } else {
            setEventType("multiple");
            setStartDate(sDate || "");
            setEndDate(eDate || "");
            setOriginalEventType("multiple");
            setOriginalStartDate(sDate || "");
            setOriginalEndDate(eDate || "");
            setOriginalSingleDate("");
          }
        }

        setTimeStart(data.timeStart ?? "");
        setTimeEnd(data.timeEnd ?? "");

        // originals for time
        setOriginalTimeStart(data.timeStart ?? "");
        setOriginalTimeEnd(data.timeEnd ?? "");

        setDescription(data.description ?? "");
        setSummary(data.summary ?? "");

        // Photos (existing)
        const cover = data.photoURL ?? null;
        const gallery: string[] = Array.isArray(data.photoURLs) ? data.photoURLs : cover ? [cover] : [];
        setExistingPhotoURL(cover);
        setExistingPhotoURLs(gallery);

        // Requirements (split into predefined vs custom)
        const preTextSet = toSet(PREDEFINED_REQ_TEXT);
        const preFileSet = toSet(PREDEFINED_REQ_FILES);

        const req = data.requirements || {};
        const allText: SimpleField[] = Array.isArray(req.textFields) ? req.textFields : [];
        const allFiles: SimpleField[] = Array.isArray(req.fileFields) ? req.fileFields : [];

        setReqTextFields(dedupeByName(allText).filter((f) => !preTextSet.has(f.name.toLowerCase())));
        setReqFileFields(dedupeByName(allFiles).filter((f) => !preFileSet.has(f.name.toLowerCase())));
      } catch (e) {
        console.error(e);
        setPopupMessage("Failed to load program.");
        setShowPopup(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [programId]);

  const handleBack = () => {
    router.push("/dashboard/ProgramsModule/ProgramsAndEvents");
  };

  // Multi file select
  const handleFilesChange = (files: FileList | null) => {
    if (!canEditAll) return;
    setFileError(null);

    // Clear previous previews
    setPreviewURLs((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });

    if (!files || files.length === 0) {
      setPhotoFiles([]);
      return;
    }

    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    const MAX_FILES = 12;

    const picked = Array.from(files);
    const filtered: File[] = [];
    const errs: string[] = [];

    for (const f of picked.slice(0, MAX_FILES)) {
      if (!f.type.startsWith("image/")) {
        errs.push(`${f.name} is not an image.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        errs.push(`${f.name} exceeds ${MAX_MB}MB.`);
        continue;
      }
      filtered.push(f);
    }
    if (picked.length > MAX_FILES) errs.push(`Only the first ${MAX_FILES} images were accepted.`);

    const previews = filtered.map((f) => URL.createObjectURL(f));
    setPhotoFiles(filtered);
    setPreviewURLs(previews);
    if (errs.length) setFileError(errs.join(" "));
  };

  useEffect(() => {
    return () => {
      // cleanup previews
      setPreviewURLs((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
    };
  }, []);

  const toMinutes = (hhmm: string) => {
    if (!hhmm || !hhmm.includes(":")) return -1;
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
  };

  // Helper: dateStr must be on or after minDate (YYYY-MM-DD)
  const isOnOrAfterMinDate = (dateStr: string) => {
    if (!dateStr) return false;
    if (!minDate) return true;
    // safe lexicographical compare because YYYY-MM-DD
    return dateStr >= minDate;
  };

  // Has schedule changed?
  const hasScheduleChanged = () => {
    if (eventType !== originalEventType) return true;

    if (eventType === "single") {
      if (singleDate !== originalSingleDate) return true;
    } else {
      if (startDate !== originalStartDate || endDate !== originalEndDate) return true;
    }

    if (timeStart !== originalTimeStart || timeEnd !== originalTimeEnd) return true;

    return false;
  };

  // Build announcement content for schedule change
  const buildScheduleChangeContent = () => {
    // Old/new start dates
    const oldStartRaw = originalEventType === "single" ? originalSingleDate : originalStartDate;
    const newStartRaw = eventType === "single" ? singleDate : startDate;

    const oldStartText = formatDateLong(oldStartRaw);
    const newStartText = formatDateLong(newStartRaw);

    const oldTimeStartText = originalTimeStart && timeStart && originalTimeStart !== timeStart
      ? formatTime12(originalTimeStart)
      : "";
    const newTimeStartText = originalTimeStart && timeStart && originalTimeStart !== timeStart
      ? formatTime12(timeStart)
      : "";

    const oldTimeEndText = originalTimeEnd && timeEnd && originalTimeEnd !== timeEnd
      ? formatTime12(originalTimeEnd)
      : "";
    const newTimeEndText = originalTimeEnd && timeEnd && originalTimeEnd !== timeEnd
      ? formatTime12(timeEnd)
      : "";

    let content = `To all approved volunteers and participants, please take note of the changes in the schedule for the program "${programName}".\n\n` +
      `Original Start Date:\n${oldStartText}\n\n` +
      `New Start Date:\n${newStartText}\n`;

    if (oldTimeStartText && newTimeStartText) {
      content += `\nOld Time Start:\n${oldTimeStartText}\n` +
        `New Time Start:\n${newTimeStartText}\n`;
    }

    if (oldTimeEndText && newTimeEndText) {
      content += `\nOld Time End:\n${oldTimeEndText}\n` +
        `New Time End:\n${newTimeEndText}\n`;
    }

    content += `\nWe apologize for any inconvenience this may cause and we hope to see you there. Thank you for your understanding.`;

    return content;
  };

  // Build the full update payload for current form state (including uploads)
  const buildUpdatesWithUploads = async () => {
    const normalizedStart = eventType === "single" ? singleDate : startDate;
    const normalizedEnd = eventType === "single" ? singleDate : endDate;

    const mergedText = dedupeByName([...PREDEFINED_REQ_TEXT, ...reqTextFields]);
    const mergedFiles = dedupeByName([...PREDEFINED_REQ_FILES, ...reqFileFields]);

    //  Resolve agency values consistently
    const resolvedAgency = agency === "others" ? (otherAgency.trim() || "Others") : agency;

    const updates: any = {
      programName: programName.trim(),
      participants: Number(participants),
      volunteers: Number(volunteers),
      eligibleParticipants,
      location: location.trim(),
      eventType,
      noParticipantLimit,
      participantDays,
      noParticipantLimitList,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      timeStart,
      timeEnd,
      description: description.trim(),
      summary: summary.trim(),

      //  Persist agency both normalized and raw
      agency: resolvedAgency, // display/normalized value
      agencyRaw: agency, // "none" | "cityhall" | "others" | ""

      otherAgency: otherAgency.trim() || null,

      //  Persist age restriction
      ageRestriction: {
        noAgeLimit,
        minAge: noAgeLimit || ageMin.trim() === "" ? null : Number(ageMin),
        maxAge: noAgeLimit || ageMax.trim() === "" ? null : Number(ageMax),
      },

      activeStatus,
      requirements: {
        textFields: mergedText,
        fileFields: mergedFiles,
      },
    };

    // Upload any newly added photos and merge with existing
    let newUrls: string[] = [];
    if (photoFiles.length > 0) {
      const uploadPromises = photoFiles.map(async (file, idx) => {
        const storageRef = ref(
          storage,
          `Programs/${programId}/photos/${Date.now()}_${idx}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });
      newUrls = await Promise.all(uploadPromises);
    }

    const combined = [...existingPhotoURLs, ...newUrls];
    updates.photoURLs = combined;

    if (!combined.includes(existingPhotoURL || "")) {
      updates.photoURL = combined.length > 0 ? combined[0] : null;
    }

    return updates;
  };

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement> | { target: { value: "Active" | "Inactive" } }
  ) => {
    if (!programId || !showActiveToggle) return;
    const next = (e.target.value as "Active" | "Inactive") || "Inactive";
    const prev = activeStatus;
    setActiveStatus(next);
    try {
      setLoading(true);
      await updateDoc(doc(db, "Programs", programId), { activeStatus: next });
      setPopupMessage(`Status set to ${next}.`);
      setShowPopup(true);
    } catch (err) {
      console.error(err);
      setActiveStatus(prev);
      setPopupMessage("Failed to update status.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmSubmitReject = async () => {
    if (!programId) return;
    if (!rejectionReason.trim()) {
      setPopupMessage("Please enter a reason for rejection.");
      setShowPopup(true);
      return;
    }
    setShowSubmitRejectPopup(false);
    setShowRejectPopup(false);

    try {
      setLoading(true);
      await updateDoc(doc(db, "Programs", programId), {
        approvalStatus: "Rejected",
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: reviewerName,
        activeStatus: "Rejected",
        progressStatus: "Rejected",
      });

      await addDoc(collection(db, "BarangayNotifications"), {
        message: `Your program (${programName}) has been rejected by ${reviewerName}. Reason: ${rejectionReason}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: suggestedByUid,
        transactionType: "Program Decision",
        programID: programId,
        programName,
        recipientUid: suggestedByUid ?? null,
      });

      setApprovalStatus("Rejected");
      setPopupMessage("Program rejected successfully.");
      setShowPopup(true);
    } catch (error) {
      console.error(error);
      setPopupMessage("Failed to reject program.");
      setShowPopup(true);
    } finally {
      setLoading(false);
      setTimeout(() => {
        router.push(`/dashboard/ProgramsModule/ProgramsAndEvents?highlight=${programId}`);
      }, 1200);
    }
  };

  const validate = () => {
    // If nobody can edit anything, skip
    if (!canEditAll && !canEditSchedule) return false;

    const e: { [k: string]: boolean } = {};
    const need = (k: string, ok: boolean) => {
      if (!ok) {
        e[k] = true;
        triggerShake(k);
      }
    };

    // --- FULL VALIDATION (Pending + PB) ---
    if (canEditAll) {
      let noOfParticipantsNum = Number(participants);
      if (noParticipantLimit === false && noOfParticipantsNum <= 0 && eventType === "single") {
        need("participants", false);
      }
      need("programName", !!programName.trim());
      need("volunteers", !!volunteers);
      need("eligibleParticipants", !!eligibleParticipants);
      need("location", !!location.trim());

      // --- Enforce minimum lengths ---
      const summaryOk = summary.trim().length >= MIN_SUMMARY_CHARS;
      need("summary", summaryOk);

      const descriptionOk = description.trim().length >= MIN_DESC_CHARS;
      need("description", descriptionOk);

      // Agency validation
      need("agency", !!agency);
      if (agency === "others") {
        need("otherAgency", !!otherAgency.trim());
      }

      // Age restriction validation (only when not "No age limit")
      if (!noAgeLimit) {
        const hasMin = ageMin.trim().length > 0;
        const hasMax = ageMax.trim().length > 0;
        if (!hasMin && !hasMax) {
          e["ageMin"] = true;
          e["ageMax"] = true;
          triggerShake("ageMin");
          triggerShake("ageMax");
        } else {
          const minNum = hasMin ? Number(ageMin) : null;
          const maxNum = hasMax ? Number(ageMax) : null;
          const validMin = minNum === null || (Number.isFinite(minNum) && minNum >= 0 && minNum <= 150);
          const validMax = maxNum === null || (Number.isFinite(maxNum) && maxNum >= 0 && maxNum <= 150);
          if (!validMin) {
            e["ageMin"] = true;
            triggerShake("ageMin");
          }
          if (!validMax) {
            e["ageMax"] = true;
            triggerShake("ageMax");
          }
          if (validMin && validMax && minNum !== null && maxNum !== null && minNum > maxNum) {
            e["ageMin"] = true;
            e["ageMax"] = true;
            triggerShake("ageMin");
            triggerShake("ageMax");
          }
        }
      }
    }

    // --- DATE / TIME VALIDATION (for both full-edit and schedule-only) ---
    if (canEditDatesAndTimes) {
      if (eventType === "single") {
        // singleDate must exist and be >= minDate (>= createdAt + 4 days)
        need("singleDate", !!singleDate && isOnOrAfterMinDate(singleDate));
      } else {
        need("startDate", !!startDate && isOnOrAfterMinDate(startDate));
        need("endDate", !!endDate && isOnOrAfterMinDate(endDate));
        if (startDate && endDate) {
          const s = new Date(startDate);
          const eDate = new Date(endDate);
          if (!(eDate > s)) {
            e["startDate"] = true;
            e["endDate"] = true;
            triggerShake("startDate");
            triggerShake("endDate");
          }
        }
      }

      if (timeStart && timeEnd) {
        if (toMinutes(timeEnd) <= toMinutes(timeStart)) {
          e["timeEnd"] = true;
          triggerShake("timeEnd");
        }
      } else {
        need("timeStart", !!timeStart);
        need("timeEnd", !!timeEnd);
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirmSave = async () => {
    if (loading) return;
    setShowSaveConfirmPopup(false);
    await handleSave();
  };

  // Announcement validation (for popup in this page)
  const validateAnnouncementFields = () => {
    const newInvalid: string[] = [];

    if (!newAnnouncement.announcementHeadline || newAnnouncement.announcementHeadline.trim() === "") {
      newInvalid.push("announcementHeadline");
      setPopupErrorMessage("Announcement Headline is required.");
    } else if (!newAnnouncement.category || newAnnouncement.category.trim() === "") {
      newInvalid.push("category");
      setPopupErrorMessage("Announcement Category is required.");
    } else if (!newAnnouncement.content || newAnnouncement.content.trim() === "") {
      newInvalid.push("content");
      setPopupErrorMessage("Description is required.");
    }

    if (newInvalid.length > 0) {
      setInvalidFields(newInvalid);
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
      return false;
    }

    setInvalidFields([]);
    return true;
  };

  const createAnnouncementFromProgram = async () => {
    if (!validateAnnouncementFields()) return;

    try {
      const announcementData = {
        ...newAnnouncement,
        image: newAnnouncement.image || existingPhotoURL || "",
      };

      await addDoc(collection(db, "announcements"), announcementData);

      setShowAddAnnouncementPopup(false);
      setPopupMessage("Announcement created successfully!");
      setShowPopup(true);
    } catch (error) {
      console.error("Error creating announcement:", error);
      setPopupErrorMessage("There was an error creating the announcement.");
      setShowErrorPopup(true);
    }
  };

  const confirmSubmitAnnouncement = async () => {
    setShowAnnouncementSubmitPopup(false);
    await createAnnouncementFromProgram();
  };

  // Dummy SMS handler – REPLACE BODY when backend SMS is ready
  const handleSendSmsToApprovedParticipants = () => {
    setShowSmsPromptPopup(false);

    // TODO: Replace this block with real SMS sending logic
    setTimeout(() => {
      setPopupMessage("SMS sent to all approved participants successfully!");
      setShowPopup(true);
    }, 2000);

    // After SMS, if schedule changed, auto-open Add Announcement popup
    if (hasScheduleChanged()) {
      const headline = `Changes in Schedule for ${programName}`;
      const now = new Date();
      const createdAtStr = formatDate12(now);
      const author = user?.fullName || user?.name || "";

      const content = buildScheduleChangeContent();

      setNewAnnouncement({
        announcementHeadline: headline,
        category: "Barangay Event",
        createdAt: createdAtStr,
        createdBy: author,
        updatedAt: "",
        image: existingPhotoURL || "",
        content,
        isActive: true,
        isInFeatured: "Inactive", // Featured OFF by default
      });

      setAnnouncementPreview(existingPhotoURL || "/Images/thumbnail.png");
      setInvalidFields([]);
      setPopupErrorMessage("");
      setShowErrorPopup(false);
      setShowAddAnnouncementPopup(true);
    }
  };

  const handleSave = async () => {
    if (!programId) return;
    if (!validate()) {
      setPopupMessage("Please correct the highlighted fields.");
      setShowPopup(true);
      return;
    }

    setLoading(true);
    try {
      const updates = await buildUpdatesWithUploads();

      // Reflect photo state locally if changed
      if (typeof updates.photoURL !== "undefined") setExistingPhotoURL(updates.photoURL);
      if (Array.isArray(updates.photoURLs)) setExistingPhotoURLs(updates.photoURLs);

      await updateDoc(doc(db, "Programs", programId), updates);

      setPopupMessage("Program saved successfully!");
      setShowPopup(true);

      // Cleanup previews
      setPreviewURLs((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      setPhotoFiles([]);
      setFileError(null);

      // 👉 After 2 seconds, show the "Send SMS" prompt popup
      setTimeout(() => {
        setShowSmsPromptPopup(true);
      }, 2000);
    } catch (e) {
      console.error(e);
      setPopupMessage("Failed to save program.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  // Approve AND persist any unsaved changes from the form in the same write.
  const handleApprove = async () => {
    if (!programId || !canEditAll) return;
    try {
      setLoading(true);

      // Build full updates based on current UI state (so PB edits are saved)
      const updates = await buildUpdatesWithUploads();

      // Also reflect photo state locally if changed
      if (typeof updates.photoURL !== "undefined") setExistingPhotoURL(updates.photoURL);
      if (Array.isArray(updates.photoURLs)) setExistingPhotoURLs(updates.photoURLs);

      // Add approval fields
      Object.assign(updates, {
        approvalStatus: "Approved",
        approvedAt: new Date(),
        approvedBy: reviewerName,
        activeStatus: "Active",
        progressStatus: "Upcoming",
      });

      await updateDoc(doc(db, "Programs", programId), updates);

      await addDoc(collection(db, "BarangayNotifications"), {
        message: `Your program (${programName}) has been approved by ${reviewerName}.`,
        timestamp: new Date(),
        isRead: false,
        recipientRole: suggestedByUid,
        transactionType: "Program Decision",
        programID: programId,
        programName,
        recipientUid: suggestedByUid ?? null,
      });

      setApprovalStatus("Approved");
      setActiveStatus("Active");
      setProgressStatus("Upcoming");
      setPopupMessage("Program approved successfully.");
      setShowPopup(true);

      // Cleanup previews after approval
      setPreviewURLs((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      setPhotoFiles([]);
      setFileError(null);
    } catch (e) {
      console.error(e);
      setPopupMessage("Failed to approve program.");
      setShowPopup(true);
    } finally {
      setLoading(false);
      setTimeout(() => {
        router.push(`/dashboard/ProgramsModule/ProgramsAndEvents?highlight=${programId}`);
      }, 1200);
    }
  };

  const handleDeleteNew = (index: number) => {
    setPreviewURLs((prev) => prev.filter((_, i) => i !== index));
  };
  const handleDeleteExisting = (index: number) => {
    setExistingPhotoURLs((prev) => prev.filter((_, i) => i !== index));
  };
  const togglePredefinedOpen = () => setIsPredefinedOpen((prev) => !prev);

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  return (
    <main className="edit-program-main-container">
      {/* Reject popups & generic popup */}
      {showRejectPopup && (
        <div className="reasonfor-recject-popup-overlay">
          <div className="reasonfor-reject-confirmation-popup">
            <h2>Reject Request</h2>
            <form className="reject-container" onSubmit={(e) => e.preventDefault()}>
              <div className="box-container-outer-reasonforreject">
                <div className="title-remarks-reasonforreject">Reason For Reject</div>
                <div className="box-container-reasonforreject">
                  <textarea
                    className="reasonforreject-input-field"
                    name="reason"
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejecting the program (e.g., overlaps with another event, insufficient budget allocation, safety concerns)..."
                    disabled={!canEditAll}
                  />
                </div>
              </div>
              <div className="reject-reason-yesno-container">
                <button type="button" onClick={() => setShowRejectPopup(false)} className="reject-reason-no-button">
                  Cancel
                </button>
                <button
                  type="button"
                  className="reject-reason-yes-button"
                  disabled={loading || !canEditAll}
                  onClick={() => setShowSubmitRejectPopup(true)}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubmitRejectPopup && (
        <div className="confirmation-popup-overlay-program-reject">
          <div className="confirmation-popup-program-status">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to Submit? </p>
            <div className="yesno-container-add">
              <button onClick={() => setShowSubmitRejectPopup(false)} className="no-button-add">
                No
              </button>
              <button onClick={confirmSubmitReject} className="yes-button-add">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className={`popup-overlay-program show`}>
          <div className="popup-program">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{popupMessage}</p>
          </div>
        </div>
      )}

      {/* Error popup (for announcement validation) */}
      {showErrorPopup && (
        <div className={`error-popup-overlay show`}>
          <div className="popup">
            <img src={"/Images/warning-1.png"} alt="popup icon" className="icon-alert" />
            <p>{popupErrorMessage}</p>
          </div>
        </div>
      )}

      <div className="program-redirectionpage-section">
        <button className="program-redirection-buttons-selected">
          <div className="program-redirection-icons-section">
            <img src="/Images/audience.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Program Details</h1>
        </button>

        {approvalStatus === "Approved" && (
          <button
            className="program-redirection-buttons"
            onClick={() =>
              router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists?programId=${programId}`)
            }
          >
            <div className="program-redirection-icons-section">
              <img src="/Images/team.png" alt="user info" className="program-redirection-icons-info" />
            </div>
            <h1>Participants</h1>
          </button>
        )}

        {approvalStatus === "Pending" && isPunongBarangay && canEditAll && (
          <>
            <button className="program-redirection-buttons" onClick={handleApprove}>
              <div className="program-redirection-icons-section">
                <img src="/Images/generatedoc.png" alt="approve" className="program-redirection-icons-info" />
              </div>
              <h1>Approve Suggested Program</h1>
            </button>

            <button className="program-redirection-buttons" onClick={() => setShowRejectPopup(true)}>
              <div className="program-redirection-icons-section">
                <img src="/Images/rejected.png" alt="reject" className="program-redirection-icons-info" />
              </div>
              <h1>Reject Suggested Program</h1>
            </button>
          </>
        )}
      </div>

      <div className="edit-program-main-content">
        <div className="edit-program-main-section1">
          <div className="edit-program-main-section1-left">
            <button onClick={handleBack}>
              <img src="/Images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1> {programName} </h1>
          </div>

          <div className="action-btn-section-program">
            {showActiveToggle && (
              <label
                className="switch-toggle"
                title={
                  !showActiveToggle ? "You don't have permission to toggle visibility" : "Toggle visibility on resident side"
                }
                style={{ marginRight: 12 }}
              >
                <input
                  type="checkbox"
                  checked={activeStatus === "Active"}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.checked
                        ? ({ target: { value: "Active" } } as any)
                        : ({ target: { value: "Inactive" } } as any)
                    )
                  }
                  disabled={!showActiveToggle}
                />
                <span className="slider"></span>
                <span className="toggle-label">{activeStatus}</span>
              </label>
            )}

            {!isCompletelyReadOnly && (
              <>
                <button className="action-discard" onClick={() => setShowDiscardPopup(true)}>
                  Discard
                </button>
                <button
                  className="action-save"
                  onClick={() => setShowSaveConfirmPopup(true)}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        {(isReadOnly || canEditSchedule) && (
          <div
            style={{
              margin: "10px 20px 0",
              padding: "10px 12px",
              background: "#f5f7fa",
              border: "1px solid #d9e1ec",
              borderRadius: 8,
              color: "#334155",
              fontSize: 14,
            }}
          >
            {approvalStatus === "Approved" && progressStatus === "Ongoing" ? (
              <>
                This program is <strong>Approved</strong> and currently <strong>Ongoing</strong>. Editing is disabled for
                everyone.
              </>
            ) : approvalStatus === "Approved" && progressStatus === "Completed" ? (
              <>This program is <strong>Completed</strong>. Editing is disabled (view-only).</>
            ) : approvalStatus === "Approved" && progressStatus === "Upcoming" && canEditSchedule && !canEditAll ? (
              <>
                This program is <strong>Approved (Upcoming)</strong>. You can only adjust the{" "}
                <strong>event dates</strong> and <strong>time</strong>. All other fields are locked.
              </>
            ) : approvalStatus === "Approved" && progressStatus === "Upcoming" && !isHigherUp ? (
              <>
                This program is <strong>Approved (Upcoming)</strong>. Only the <strong>Punong Barangay</strong> may adjust
                the schedule.
              </>
            ) : approvalStatus === "Rejected" ? (
              <>
                This program has been <strong>Rejected</strong>
                {rejectionReason ? (
                  <>
                    {" "}
                    — <em>{rejectionReason}</em>
                  </>
                ) : null}
                . Editing is disabled (view-only).
              </>
            ) : approvalStatus === "Pending" && !isPunongBarangay ? (
              <>
                This program is <strong>Pending</strong>. Only the <strong>Punong Barangay</strong> can edit and make a
                decision.
              </>
            ) : null}
            {minDate && (
              <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
                Earliest allowed start date: <strong>{minDate}</strong>
              </div>
            )}
          </div>
        )}

        <div className="edit-program-bottom-section">
          <nav className="edit-program-info-toggle-wrapper">
            {["details", "reqs", "others", ...(approvalStatus === "Rejected" ? ["reject"] : [])].map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section as "details" | "reqs" | "others" | "reject")}
              >
                {section === "details" && "Details"}
                {section === "reqs" && "Requirements"}
                {section === "others" && "Others"}
                {section === "reject" && "Reason for Reject"}
              </button>
            ))}
          </nav>

          <div className="edit-program-bottom-section-scroll">
            <form className="edit-program-section-2" onSubmit={(e) => e.preventDefault()}>
              {activeSection === "details" && (
                <>
                  <div className="edit-programs-upper-section">
                    <div className="edit-program-section-2-left-side">
                      <div className="fields-section-edit-programs">
                        <p>
                          Program Name<span className="required">*</span>
                        </p>
                        <input
                          type="text"
                          className={[
                            "edit-programs-input-field",
                            errors.programName ? "input-error" : "",
                            shake.programName ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          placeholder="Program Name (E.g. Feeding Program)"
                          value={programName}
                          onChange={(e) => setProgramName(e.target.value)}
                          disabled={!canEditAll}
                        />
                      </div>

                      <div className="fields-section-edit-programs">
                        <p>
                          Program Location<span className="required">*</span>
                        </p>
                        <input
                          type="text"
                          className={[
                            "edit-programs-input-field",
                            errors.location ? "input-error" : "",
                            shake.location ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          placeholder="Location (E.g. Barangay Hall)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={!canEditAll}
                        />
                      </div>
                      {eventType === "multiple" ? (
                        <>
                          {participantDays.map((day, index) => (
                            <div key={index} className="fields-section-edit-programs">
                              <p>
                                Number of Participants for Day {index + 1}
                                <span className="required">*</span>
                              </p>

                              <input
                                type="number"
                                min="1"
                                className={[
                                  "edit-programs-input-field",
                                  errors.participants ? "input-error" : "",
                                  shake.participants ? "shake" : "",
                                ]
                                  .join(" ")
                                  .trim()}
                                placeholder="E.g. 50"
                                value={day > 0 ? String(day) : ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setParticipantDays((prev) => {
                                    const updated = [...prev];
                                    updated[index] = val === "" ? 0 : Number(val);
                                    return updated;
                                  });

                                  // Reset "no limit" when user types a number
                                  setNoParticipantLimitList((prev) => {
                                    const updated = [...prev];
                                    updated[index] = false;
                                    return updated;
                                  });
                                }}
                                disabled={!canEditAll || noParticipantLimitList[index]}
                              />

                              <label className="flex-center-gap" style={{ marginTop: 6 }}>
                                <input
                                  type="checkbox"
                                  checked={noParticipantLimitList[index] || false}
                                  onChange={(e) => {
                                    const checked = e.target.checked;

                                    setNoParticipantLimitList((prev) => {
                                      const updated = [...prev];
                                      updated[index] = checked;
                                      return updated;
                                    });

                                    if (checked) {
                                      // If "no limit", reset participant value to 0
                                      setParticipantDays((prev) => {
                                        const updated = [...prev];
                                        updated[index] = 0;
                                        return updated;
                                      });

                                      // Remove participant error if exists
                                      setErrors((prev) => {
                                        const { participants, ...rest } = prev;
                                        return rest;
                                      });
                                    }
                                  }}
                                  disabled={!canEditAll}
                                />
                                <span>No participant limit for Day {index + 1}</span>
                              </label>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          <div className="fields-section-edit-programs">
                            <p>
                              Number of Participants<span className="required">*</span>
                            </p>
                            <input
                              type="number"
                              min="1"
                              className={[
                                "edit-programs-input-field",
                                errors.participants ? "input-error" : "",
                                shake.participants ? "shake" : "",
                              ]
                                .join(" ")
                                .trim()}
                              placeholder="E.g. 50"
                              value={participants}
                              onChange={(e) => setParticipants(e.target.value)}
                              disabled={!canEditAll || noParticipantLimit}
                            />
                          </div>
                        </>
                      )}

                      <div className="fields-section-edit-programs">
                        <p>
                          Number of Volunteers<span className="required">*</span>
                        </p>
                        <input
                          type="number"
                          min="1"
                          className={[
                            "edit-programs-input-field",
                            errors.volunteers ? "input-error" : "",
                            shake.volunteers ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          placeholder="E.g. 50"
                          value={volunteers}
                          onChange={(e) => setVolunteers(e.target.value)}
                          disabled={!canEditAll}
                        />
                      </div>

                      <div className="fields-section-edit-programs">
                        <p>
                          Eligible Participants<span className="required">*</span>
                        </p>
                        <select
                          className={[
                            "edit-programs-input-field",
                            errors.eligibleParticipants ? "input-error" : "",
                            shake.eligibleParticipants ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          value={eligibleParticipants}
                          onChange={(e) => setEligibleParticipants(e.target.value)}
                          disabled={!canEditAll}
                        >
                          <option value="">Select requirement</option>
                          <option value="resident">Resident</option>
                          <option value="non-resident">Non-Resident</option>
                          <option value="both">Both</option>
                        </select>
                      </div>

                      {/* Age Restriction */}
                      <div className="fields-section-edit-programs">
                        <p>
                          Age Restriction<span className="required">*</span>
                        </p>

                        <label className="flex-center-gap">
                          <input
                            type="checkbox"
                            checked={noAgeLimit}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNoAgeLimit(checked);
                              if (checked) {
                                setAgeMin("");
                                setAgeMax("");
                                setErrors((prev) => {
                                  const { ageMin, ageMax, ...rest } = prev;
                                  return rest;
                                });
                              }
                            }}
                            disabled={!canEditAll}
                          />

                          <span>No age limit</span>
                        </label>

                        <div className="grid-2col-gap">
                          <input
                            type="number"
                            min={0}
                            placeholder="Min age"
                            className={[
                              "edit-programs-input-field",
                              errors.ageMin ? "input-error" : "",
                              shake.ageMin ? "shake" : "",
                            ]
                              .join(" ")
                              .trim()}
                            value={ageMin}
                            onChange={(e) => setAgeMin(e.target.value)}
                            disabled={!canEditAll || noAgeLimit}
                          />
                          <input
                            type="number"
                            min={0}
                            placeholder="Max age"
                            className={[
                              "edit-programs-input-field",
                              errors.ageMax ? "input-error" : "",
                              shake.ageMax ? "shake" : "",
                            ]
                              .join(" ")
                              .trim()}
                            value={ageMax}
                            onChange={(e) => setAgeMax(e.target.value)}
                            disabled={!canEditAll || noAgeLimit}
                          />
                        </div>

                        {!noAgeLimit && (errors.ageMin || errors.ageMax) && (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
                            Please set a valid age range. Use either min, max, or both. Min must be ≤ max.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="edit-program-section-2-right-side">
                      <div className="fields-section-edit-programs">
                        <p>
                          Partnered Agency<span className="required">*</span>
                        </p>
                        <select
                          className={[
                            "edit-programs-input-field",
                            errors.agency ? "input-error" : "",
                            shake.agency ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          value={agency}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAgency(v);
                            if (v !== "others") {
                              setOtherAgency("");
                              setErrors((prev) => {
                                const { otherAgency, ...rest } = prev;
                                return rest;
                              });
                            }
                            setErrors((prev) => {
                              const { agency, ...rest } = prev;
                              return rest;
                            });
                          }}
                          disabled={!canEditAll}
                        >
                          <option value="">Select agency</option>
                          <option value="none">None</option>
                          <option value="cityhall">City Hall</option>
                          <option value="others">Others</option>
                        </select>

                        {agency === "others" && (
                          <input
                            type="text"
                            placeholder="Enter agency"
                            className={[
                              "edit-programs-input-field",
                              errors.otherAgency ? "input-error" : "",
                              shake.otherAgency ? "shake" : "",
                            ]
                              .join(" ")
                              .trim()}
                            value={otherAgency}
                            onChange={(e) => {
                              setOtherAgency(e.target.value);
                              setErrors((prev) => {
                                const { otherAgency, ...rest } = prev;
                                return rest;
                              });
                            }}
                            disabled={!canEditAll}
                          />
                        )}
                      </div>

                      <div className="fields-section-edit-programs">
                        <p>
                          Event Type<span className="required">*</span>
                        </p>
                        <select
                          className="edit-programs-input-field"
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as "single" | "multiple")}
                          disabled={!canEditAll}
                        >
                          <option value="single">Single Day</option>
                          <option value="multiple">Multiple Days</option>
                        </select>
                      </div>

                      {eventType === "single" ? (
                        <div className="fields-section-edit-programs">
                          <p>
                            Event Date<span className="required">*</span>
                          </p>
                          <input
                            type="date"
                            className={[
                              "edit-programs-input-field",
                              errors.singleDate ? "input-error" : "",
                              shake.singleDate ? "shake" : "",
                            ]
                              .join(" ")
                              .trim()}
                            min={minDate}
                            value={singleDate}
                            onChange={(e) => setSingleDate(e.target.value)}
                            disabled={!canEditDatesAndTimes}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="fields-section-edit-programs">
                            <p>
                              Program Start Date<span className="required">*</span>
                            </p>
                            <input
                              type="date"
                              className={[
                                "edit-programs-input-field",
                                errors.startDate ? "input-error" : "",
                                shake.startDate ? "shake" : "",
                              ]
                                .join(" ")
                                .trim()}
                              min={minDate}
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              disabled={!canEditDatesAndTimes}
                            />
                          </div>

                          <div className="fields-section-edit-programs">
                            <p>
                              Program End Date<span className="required">*</span>
                            </p>
                            <input
                              type="date"
                              className={[
                                "edit-programs-input-field",
                                errors.endDate ? "input-error" : "",
                                shake.endDate ? "shake" : "",
                              ]
                                .join(" ")
                                .trim()}
                              min={minDate}
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              disabled={!canEditDatesAndTimes}
                            />
                          </div>
                        </>
                      )}

                      <div className="fields-section-edit-programs">
                        <p>
                          Time Start<span className="required">*</span>
                        </p>
                        <input
                          type="time"
                          className={[
                            "edit-programs-input-field",
                            errors.timeStart ? "input-error" : "",
                            shake.timeStart ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          value={timeStart}
                          onChange={(e) => setTimeStart(e.target.value)}
                          disabled={!canEditDatesAndTimes}
                        />
                      </div>

                      <div className="fields-section-edit-programs">
                        <p>
                          Time End<span className="required">*</span>
                        </p>
                        <input
                          type="time"
                          className={[
                            "edit-programs-input-field",
                            errors.timeEnd ? "input-error" : "",
                            shake.timeEnd ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          disabled={!canEditDatesAndTimes}
                        />
                      </div>
                      {eventType === "single" && (
                        <div className="fields-section-edit-programs">
                          <p>
                            Participant Limit<span className="required">*</span>
                          </p>
                          <label className="flex-center-gap">
                            <input
                              type="checkbox"
                              checked={noParticipantLimit}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setNoParticipantLimit(isChecked);

                                if (isChecked) {
                                  setParticipants("");
                                  setErrors((prev) => {
                                    const { participants, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              disabled={!canEditAll}
                            />

                            <span>No participant limit</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeSection === "reqs" && (
                <div className="add-programs-requirements-container">
                  <div className="predefined-fields-notes-container-programs">
                    <div
                      className="predefined-fields-notes-container-tile-programs"
                      style={{ cursor: "pointer" }}
                      onClick={togglePredefinedOpen}
                    >
                      <div className="predefined-fields-title-programs">
                        <h1>Pre-defined Fields</h1>
                      </div>
                      <div className="predefined-fields-button-section-programs">
                        <button
                          type="button"
                          className="toggle-btn-predefined-fields-programs"
                          aria-label={isPredefinedOpen ? "Hide details" : "Show details"}
                        >
                          <img
                            src={isPredefinedOpen ? "/Images/up.png" : "/Images/down.png"}
                            alt={isPredefinedOpen ? "Hide details" : "Show details"}
                            style={{ width: "16px", height: "16px" }}
                          />
                        </button>
                      </div>
                    </div>

                    {isPredefinedOpen && (
                      <div className="predefined-list-programs">
                        <ul className="predefined-list-items-programs">
                          {PREDEFINED_REQ_TEXT.map((f, i) => (
                            <li key={`pretext-${i}`} className="predefined-text-programs">
                              {i + 1}. {f.name} <span className="predefined-type-programs">(text)</span>
                              <span className="predefined-desc-programs"> — {f.description}</span>
                            </li>
                          ))}

                          {PREDEFINED_REQ_FILES.map((f, i) => (
                            <li key={`prefile-${i}`} className="predefined-text-programs">
                              {PREDEFINED_REQ_TEXT.length + i + 1}. {f.name}{" "}
                              <span className="predefined-type-programs">(file)</span>
                              <span className="predefined-desc-programs"> — {f.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="predefined-fields-bottom-container-programs">
                    <div className="box-container-outer-programs-fields">
                      <div className="title-programs-fields">Text Fields</div>
                      <div className="box-container-programs-fields">
                        <div className="instructions-container-programs">
                          <h1>
                            * Enter the text fields needed for the program. No need to input pre-defined fields. FORMAT:
                            sampleField *
                          </h1>
                        </div>
                        <span className="required-asterisk">*</span>
                        <div className="add-programs-field-container">
                          <div className="add-programs-field-row">
                            <div className="row-title-section-programs">
                              <h1>Add Field:</h1>
                            </div>
                            <div className="row-input-section-programs">
                              <input
                                type="text"
                                className="add-program-field-input"
                                placeholder="e.g., guardianName"
                                value={reqTextNew}
                                onChange={(e) => setReqTextNew(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addReqText();
                                  }
                                }}
                                disabled={!canEditAll}
                              />
                            </div>
                            <div className="row-button-section-programs">
                              <button type="button" className="program-field-add-button" onClick={addReqText} disabled={!canEditAll}>
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="added-program-field-container">
                          {reqTextFields.length > 0 && (
                            <>
                              {reqTextFields.map((f, i) => (
                                <div key={`rt-${i}`} className="added-program-field-row">
                                  <div className="row-input-section-added-program">
                                    <input
                                      type="text"
                                      className="add-program-field-input"
                                      value={f.name}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setReqTextFields((prev) =>
                                          prev.map((x, idx) => (idx === i ? { name: v } : x))
                                        );
                                      }}
                                      disabled={!canEditAll}
                                    />
                                  </div>
                                  <div className="row-button-section-programs">
                                    {canEditAll && (
                                      <button
                                        type="button"
                                        className="program-field-remove-button"
                                        onClick={() => removeReqText(i)}
                                      >
                                        -
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="box-container-outer-programs-fields">
                      <div className="title-programs-fields">File Upload Fields</div>
                      <div className="box-container-programs-fields">
                        <div className="instructions-container-programs">
                          <h1>
                            * Enter the file upload fields needed for the program. No need to input pre-defined fields.
                            Tip: use a clear naming convention (e.g., <code>validIDjpg</code>, <code>barangayIDjpg</code>,
                            etc.) *
                          </h1>
                        </div>
                        <span className="required-asterisk">*</span>
                        <div className="add-programs-field-container">
                          <div className="add-programs-field-row">
                            <div className="row-title-section-programs">
                              <h1>Add Field:</h1>
                            </div>
                            <div className="row-input-section-programs">
                              <input
                                type="text"
                                className="add-program-field-input"
                                placeholder="e.g., medicalCertificateJpg"
                                value={reqFileNew}
                                onChange={(e) => setReqFileNew(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addReqFile();
                                  }
                                }}
                                disabled={!canEditAll}
                              />
                            </div>
                            <div className="row-button-section-programs">
                              <button type="button" className="program-field-add-button" onClick={addReqFile} disabled={!canEditAll}>
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="added-program-field-container">
                          {reqFileFields.length > 0 && (
                            <>
                              {reqFileFields.map((f, i) => (
                                <div key={`rt-${i}`} className="added-program-field-row">
                                  <div className="row-input-section-added-program">
                                    <input
                                      type="text"
                                      className="add-program-field-input"
                                      value={f.name}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        setReqFileFields((prev) =>
                                          prev.map((x, idx) => (idx === i ? { name: v } : x))
                                        );
                                      }}
                                      disabled={!canEditAll}
                                    />
                                  </div>
                                  <div className="row-button-section-programs">
                                    {canEditAll && (
                                      <button
                                        type="button"
                                        className="program-field-remove-button"
                                        onClick={() => removeReqFile(i)}
                                      >
                                        -
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "others" && (
                <>
                  <div className="edit-programs-upper-section">
                    <div className="edit-official-others-mainsection">
                      {/* Photos */}
                      <div className="box-container-outer-others-photosprogram">
                        <div className="title-others-photos">Photos</div>
                        <div className="box-container-photosprogram-others">
                          <div className="photosprogram-container">
                            <label
                              htmlFor="identification-file-upload"
                              className="upload-link"
                              style={!canEditAll ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                              Click to Upload File(s)
                            </label>
                            <input
                              id="identification-file-upload"
                              type="file"
                              className="file-upload-input"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFilesChange(e.target.files)}
                              disabled={!canEditAll}
                            />

                            <div className="identificationpic-content">
                              <div className="identificationpic-display">
                                <div className="cover-photo">
                                  <img
                                    src={previewURLs[0] || existingPhotoURL || "/Images/thumbnail.png"}
                                    alt="Program Cover"
                                    className="program-cover"
                                  />
                                  {canEditAll && previewURLs[0] && (
                                    <button className="delete-btn" onClick={() => handleDeleteNew(0)}>
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="photosprogram-thumbnails">
                                {previewURLs.length > 1 && (
                                  <div className="thumbs-grid">
                                    {previewURLs.slice(1).map((u, i) => (
                                      <div key={`new-${i}`} className="thumb-wrapper">
                                        <img src={u} alt={`New ${i + 2}`} className="thumb-img" />
                                        {canEditAll && (
                                          <button className="delete-btn" onClick={() => handleDeleteNew(i + 1)}>
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {existingPhotoURLs.length > 0 && (
                                  <div className="thumbs-section">
                                    <div className="thumbs-label">* Existing Photos *</div>
                                    <div
                                      className={`thumbs-grid ${
                                        existingPhotoURLs.length <= 2 ? "center-grid" : ""
                                      }`}
                                    >
                                      {existingPhotoURLs.map((u, i) => (
                                        <div key={`old-${i}-${u}`} className="thumb-wrapper">
                                          <img src={u} alt={`Existing ${i + 1}`} className="thumb-img" />
                                          {canEditAll && (
                                            <button
                                              className="delete-btn"
                                              onClick={() => handleDeleteExisting(i)}
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* /Photos */}
                    </div>
                  </div>

                  <div className="edit-programs-bottom-section">
                    <div className="edit-official-others-mainsection">
                      <div className="edit-box-container-outer-programdesc">
                        <div className="title-remarks">Description of Program</div>
                        <div className="box-container-programdesc">
                          <textarea
                            className={[
                              "programdesc-input-field",
                              errors.description ? "input-error" : "",
                              shake.description ? "shake" : "",
                            ]
                              .join(" ")
                              .trim()}
                            placeholder={`Write at least ${MIN_DESC_CHARS} characters...`}
                            name="programDescription"
                            value={description}
                            onChange={(e) => {
                              setDescription(e.target.value);
                              if (e.target.value.trim().length >= MIN_DESC_CHARS) {
                                setErrors((prev) => {
                                  const { description, ...rest } = prev;
                                  return rest;
                                });
                              }
                            }}
                            disabled={!canEditAll}
                          />
                          {/* Counter + validation hint */}
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                            <span style={{ opacity: 0.7 }}>Minimum {MIN_DESC_CHARS} characters</span>
                            <span
                              style={{
                                opacity: descriptionLen < MIN_DESC_CHARS ? 1 : 0.7,
                                color: descriptionLen < MIN_DESC_CHARS ? "#b91c1c" : "inherit",
                              }}
                            >
                              {descriptionLen}/{MIN_DESC_CHARS}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="edit-box-container-outer-programdesc">
                        <div className="title-remarks">Summary of Program</div>
                        <div className="box-container-programdesc">
                          <textarea
                            className={[
                              "programdesc-input-field",
                              errors.summary ? "input-error" : "",
                              shake.summary ? "shake" : "",
                            ]
                              .join(" ")
                              .trim()}
                            placeholder={`Write at least ${MIN_SUMMARY_CHARS} characters...`}
                            name="programSummary"
                            value={summary}
                            onChange={(e) => {
                              setSummary(e.target.value);
                              if (e.target.value.trim().length >= MIN_SUMMARY_CHARS) {
                                setErrors((prev) => {
                                  const { summary, ...rest } = prev;
                                  return rest;
                                });
                              }
                            }}
                            disabled={!canEditAll}
                          />
                          {/* Counter + validation hint */}
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                            <span style={{ opacity: 0.7 }}>Minimum {MIN_SUMMARY_CHARS} characters</span>
                            <span
                              style={{
                                opacity: summaryLen < MIN_SUMMARY_CHARS ? 1 : 0.7,
                                color: summaryLen < MIN_SUMMARY_CHARS ? "#b91c1c" : "inherit",
                              }}
                            >
                              {summaryLen}/{MIN_SUMMARY_CHARS}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "reject" && (
                <>
                  <div className="edit-programs-upper-section">
                    <div className="edit-official-others-mainsection">
                      <div className="edit-box-container-outer-programdesc">
                        <div className="title-remarks">Reason for Reject</div>
                        <div className="box-container-programdesc">
                          <textarea
                            className="programdesc-input-field"
                            name="reasonForReject"
                            value={rejectionReason}
                            disabled={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {showSaveConfirmPopup && (
        <div className="confirmation-popup-overlay-edit-program">
          <div className="confirmation-popup-edit-program">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to save these changes?</p>
            <div className="yesno-container-add">
              <button
                onClick={() => setShowSaveConfirmPopup(false)}
                className="no-button-add"
                disabled={loading}
              >
                No
              </button>
              <button
                className="yes-button-add"
                onClick={handleConfirmSave}
                disabled={loading}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showSmsPromptPopup && (
        <div className="confirmation-popup-overlay-edit-program">
          <div className="confirmation-popup-edit-program">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Notify the registered participants and volunteers about the changes?</p>
            <div className="yesno-container-add">

              {/*}
              comment kasi dapat walang option na no hahahah
              <button
                onClick={() => setShowSmsPromptPopup(false)}
                className="no-button-add"
              >
                No
              </button>
              */}
              <button
                className="notify-button"
                onClick={handleSendSmsToApprovedParticipants}
              >
                Send via SMS 
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscardPopup && (
        <div className="confirmation-popup-overlay-edit-program">
          <div className="confirmation-popup-edit-program">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to discard the changes?</p>
            <div className="yesno-container-add">
              <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">
                No
              </button>
              <button
                className="yes-button-add"
                onClick={() => {
                  setShowDiscardPopup(false);
                  handleBack();
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 Add Announcement popup (auto-opened after SMS if schedule changed) */}
      {showAddAnnouncementPopup && (
        <div className="add-announcements-popup-overlay">
          <div className="add-announcements-confirmation-popup">
            <h2>Add New Announcement</h2>

            <div className="add-announcements-main-container">
              <div className="add-announcements-photo-section">
                <span className="add-announcements-details-label">Photo</span>

                <div
                  className={`add-announcements-profile-container ${
                    invalidFields.includes("image") ? "input-error" : ""
                  }`}
                >
                  <img
                    src={announcementPreview || existingPhotoURL || "/Images/thumbnail.png"}
                    alt="Announcement"
                    className="add-announcements-photo"
                  />
                </div>

                {/* Photo is reused from program; no new upload here */}
              </div>

              <div className="add-announcements-info-main-container">
                <div className="add-announcements-upper-section">
                  <div className="add-announcements-content-left-side">
                    <div className="fields-section-add-announcements">
                      <p>
                        Announcement Headline<span className="required">*</span>
                      </p>
                      <input
                        type="text"
                        className={`add-announcements-input-field ${
                          invalidFields.includes("announcementHeadline") ? "input-error" : ""
                        }`}
                        placeholder="Announcement Headline"
                        value={newAnnouncement.announcementHeadline || ""}
                        readOnly // headline locked
                      />
                    </div>

                    <div className="fields-section-add-announcements">
                      <p>
                        Announcement Category<span className="required">*</span>
                      </p>
                      <select
                        className={`add-announcements-input-field ${
                          invalidFields.includes("category") ? "input-error" : ""
                        }`}
                        value={newAnnouncement.category}
                        disabled // locked to Barangay Event
                      >
                        <option value="Barangay Event">Barangay Event</option>
                      </select>
                    </div>


                  </div>

                  <div className="add-announcements-content-right-side">
                    <div className="fields-section-add-announcements">
                      <p>
                        Published Date <span className="required">*</span>
                      </p>
                      <input
                        type="text"
                        className="add-announcements-input-field"
                        value={newAnnouncement.createdAt || ""}
                        readOnly
                      />
                    </div>

                    <div className="fields-section-add-announcements">
                      <p>
                        Author<span className="required">*</span>
                      </p>
                      <input
                        type="text"
                        className="add-announcements-input-field"
                        placeholder="Author"
                        value={newAnnouncement.createdBy || ""}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="add-announcements-lower-section">
                  <div className="announcements-description-container">
                    <div className="box-container-outer-description-announcements">
                      <div className="title-description-announcements">
                        Full Content / Description
                      </div>
                      <div
                        className={`box-container-description-announcements ${
                          invalidFields.includes("content") ? "input-error" : ""
                        }`}
                      >
                        <textarea
                          placeholder="Write the full content/description of the announcement here..."
                          value={newAnnouncement.content || ""}
                          onChange={(e) =>
                            setNewAnnouncement({
                              ...newAnnouncement,
                              content: e.target.value,
                            })
                          }
                          required
                          className="description-input-field-announcements"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="announcement-yesno-container">

              <button
                type="button"
                onClick={() => {
                  if (validateAnnouncementFields()) {
                    setShowAnnouncementSubmitPopup(true);
                  }
                }}
                className="announcement-yes-button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnnouncementSubmitPopup && (
        <div className="submit-announcements-confirmation-popup-overlay">
          <div className="submit-announcements-confirmation-popup">
            <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
            <p>Are you sure you want to submit this announcement?</p>
            <div className="yesno-container-add">
              <button
                onClick={() => setShowAnnouncementSubmitPopup(false)}
                className="no-button-add"
              >
                No
              </button>
              <button
                onClick={confirmSubmitAnnouncement}
                className="yes-button-add"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
