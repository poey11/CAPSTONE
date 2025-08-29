"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useSession } from "next-auth/react";

type SimpleField = { name: string; description?: string };

const PREDEFINED_REQ_TEXT: SimpleField[] = [
  { name: "firstName", description: "Used to save the first name of the participant" },
  { name: "lastName", description: "Used to save the last name of the participant" },
  { name: "contactNumber", description: "Used to save the contact number of the participant" },
  { name: "emailAddress", description: "Used to save the email address of the participant" },
  { name: "location", description: "Used to save the address of the participant" },
  { name: "dateOfBirth", description: "Used to save the participant's date of birth (enables age checks)" },
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
  const isSecretary = userPosition === "Secretary";
  const isAssistantSecretary = userPosition === "Assistant Secretary";
  const isHigherUp = isPunongBarangay || isSecretary || isAssistantSecretary;

  type Section = "details" | "reqs" | "others" | "reject";
  const [activeSection, setActiveSection] = useState<Section>("details");

  // Popups / toasts
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  // --- EDIT & VISIBILITY RULES (updated per your requirements) ---
  // Pending: only PB can edit/approve; hide Active/Inactive toggle
  // Approved + Upcoming: PB, Secretary, Assistant Secretary can edit
  // Ongoing or later (or Rejected): fully locked
  const canEdit = (() => {
    if (approvalStatus === "Pending") return isPunongBarangay;
    if (approvalStatus === "Approved" && progressStatus === "Upcoming") return isHigherUp;
    return false;
  })();
  const isReadOnly = !canEdit;
  
  const showActiveToggle =
  isHigherUp && approvalStatus !== "Pending" && approvalStatus !== "Rejected" &&progressStatus !== "Completed";


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
          setEventType(existingEventType);
          if (existingEventType === "single") {
            setSingleDate(sDate || eDate || "");
            setStartDate("");
            setEndDate("");
          } else {
            setStartDate(sDate || "");
            setEndDate(eDate || "");
            setSingleDate("");
          }
        } else {
          if (sDate && eDate && sDate === eDate) {
            setEventType("single");
            setSingleDate(sDate);
          } else {
            setEventType("multiple");
            setStartDate(sDate || "");
            setEndDate(eDate || "");
          }
        }

        setTimeStart(data.timeStart ?? "");
        setTimeEnd(data.timeEnd ?? "");
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
    if (isReadOnly) return;
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

  const isFutureDate = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    return d > today;
  };

  const toMinutes = (hhmm: string) => {
    if (!hhmm || !hhmm.includes(":")) return -1;
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
  };

  // Min date (tomorrow)
  const minDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(0, 0, 0, 0);
    return t.toISOString().split("T")[0];
  }, []);

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
      startDate: normalizedStart,
      endDate: normalizedEnd,
      timeStart,
      timeEnd,
      description: description.trim(),
      summary: summary.trim(),

      //  Persist agency both normalized and raw
      agency: resolvedAgency,     // display/normalized value
      agencyRaw: agency,          // "none" | "cityhall" | "others" | ""

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
    if (isReadOnly) return false;
    const e: { [k: string]: boolean } = {};
    const need = (k: string, ok: boolean) => {
      if (!ok) {
        e[k] = true;
        triggerShake(k);
      }
    };

    need("programName", !!programName.trim());
    need("participants", !!participants);
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
        if (!validMin) { e["ageMin"] = true; triggerShake("ageMin"); }
        if (!validMax) { e["ageMax"] = true; triggerShake("ageMax"); }
        if (validMin && validMax && minNum !== null && maxNum !== null && minNum > maxNum) {
          e["ageMin"] = true; e["ageMax"] = true; triggerShake("ageMin"); triggerShake("ageMax");
        }
      }
    }

    if (eventType === "single") {
      need("singleDate", !!singleDate && isFutureDate(singleDate));
    } else {
      need("startDate", !!startDate && isFutureDate(startDate));
      need("endDate", !!endDate && isFutureDate(endDate));
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

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!programId || isReadOnly) return;
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
    } catch (e) {
      console.error(e);
      setPopupMessage("Failed to save program.");
      setShowPopup(true);
    } finally {
      setLoading(false);
      setTimeout(() => {
        router.push(`/dashboard/ProgramsModule/ProgramsAndEvents?highlight=${programId}`);
      }, 1200);
    }
  };

  // Approve AND persist any unsaved changes from the form in the same write.
  const handleApprove = async () => {
    if (!programId || isReadOnly) return;
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
    }, 3000); // hides after 2 seconds
    return () => clearTimeout(timer);
  }
}, [showPopup]);


  return (
    <main className="edit-program-main-container">
      {/* Reject popups & generic popup (unchanged) */}
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
                    disabled={isReadOnly}
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
                  disabled={loading || isReadOnly}
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
              <img src="/images/team.png" alt="user info" className="program-redirection-icons-info" />
            </div>
            <h1>Participants</h1>
          </button>
        )}

        {approvalStatus === "Pending" && isPunongBarangay && !isReadOnly && (
          <>
            <button className="program-redirection-buttons" onClick={handleApprove}>
              <div className="program-redirection-icons-section">
                <img src="/Images/generatedoc.png" alt="approve" className="program-redirection-icons-info" />
              </div>
              <h1>Approve Requested Program</h1>
            </button>

            <button className="program-redirection-buttons" onClick={() => setShowRejectPopup(true)}>
              <div className="program-redirection-icons-section">
                <img src="/Images/rejected.png" alt="reject" className="program-redirection-icons-info" />
              </div>
              <h1>Reject Requested Program</h1>
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

            {!isReadOnly && (
              <>
                <button className="action-discard" onClick={() => setShowDiscardPopup(true)}>
                  Discard
                </button>
                <button className="action-save" onClick={handleSave}>
                  {loading ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        {isReadOnly && (
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
              <>This program is <strong>Approved</strong> and currently <strong>Ongoing</strong>. Editing is disabled for everyone.</>
            ) : approvalStatus === "Approved" && progressStatus === "Completed" ? (
              <>This program is <strong>Completed</strong>. Editing is disabled (view-only).</>
            ) : approvalStatus === "Approved" && progressStatus === "Upcoming" && !isHigherUp ? (
              <>This program is <strong>Approved (Upcoming)</strong>. Only the <strong>Punong Barangay</strong>, <strong>Secretary</strong>, and <strong>Assistant Secretary</strong> may edit until it becomes <strong>Ongoing</strong>.</>
            ) : approvalStatus === "Rejected" ? (
              <>
                This program has been <strong>Rejected</strong>
                {rejectionReason ? <> — <em>{rejectionReason}</em></> : null}. Editing is disabled (view-only).
              </>
            ) : approvalStatus === "Pending" && !isPunongBarangay ? (
              <>This program is <strong>Pending</strong>. Only the <strong>Punong Barangay</strong> can edit and make a decision.</>
            ) : null}
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
                          ].join(" ").trim()}
                          placeholder="Program Name (E.g. Feeding Program)"
                          value={programName}
                          onChange={(e) => setProgramName(e.target.value)}
                          disabled={isReadOnly}
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
                          ].join(" ").trim()}
                          placeholder="Location (E.g. Barangay Hall)"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>

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
                          ].join(" ").trim()}
                          placeholder="E.g. 50"
                          value={participants}
                          onChange={(e) => setParticipants(e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>

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
                          ].join(" ").trim()}
                          placeholder="E.g. 50"
                          value={volunteers}
                          onChange={(e) => setVolunteers(e.target.value)}
                          disabled={isReadOnly}
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
                          ].join(" ").trim()}
                          value={eligibleParticipants}
                          onChange={(e) => setEligibleParticipants(e.target.value)}
                          disabled={isReadOnly}
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
                            disabled={isReadOnly}
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
                            ].join(" ").trim()}
                            value={ageMin}
                            onChange={(e) => setAgeMin(e.target.value)}
                            disabled={isReadOnly || noAgeLimit}
                          />
                          <input
                            type="number"
                            min={0}
                            placeholder="Max age"
                            className={[
                              "edit-programs-input-field",
                              errors.ageMax ? "input-error" : "",
                              shake.ageMax ? "shake" : "",
                            ].join(" ").trim()}
                            value={ageMax}
                            onChange={(e) => setAgeMax(e.target.value)}
                            disabled={isReadOnly || noAgeLimit}
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
                          ].join(" ").trim()}
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
                          disabled={isReadOnly}
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
                            ].join(" ").trim()}
                            value={otherAgency}
                            onChange={(e) => {
                              setOtherAgency(e.target.value);
                              setErrors((prev) => {
                                const { otherAgency, ...rest } = prev;
                                return rest;
                              });
                            }}
                            disabled={isReadOnly}
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
                          disabled={isReadOnly}
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
                            ].join(" ").trim()}
                            min={minDate}
                            value={singleDate}
                            onChange={(e) => setSingleDate(e.target.value)}
                            disabled={isReadOnly}
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
                              ].join(" ").trim()}
                              min={minDate}
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              disabled={isReadOnly}
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
                              ].join(" ").trim()}
                              min={minDate}
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              disabled={isReadOnly}
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
                          ].join(" ").trim()}
                          value={timeStart}
                          onChange={(e) => setTimeStart(e.target.value)}
                          disabled={isReadOnly}
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
                          ].join(" ").trim()}
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>

                      
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
                                disabled={isReadOnly}
                              />
                            </div>
                            <div className="row-button-section-programs">
                              <button type="button" className="program-field-add-button" onClick={addReqText}>
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
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                  <div className="row-button-section-programs">
                                    {!isReadOnly && (
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
                                disabled={isReadOnly}
                              />
                            </div>
                            <div className="row-button-section-programs">
                              <button type="button" className="program-field-add-button" onClick={addReqFile}>
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
                                      disabled={isReadOnly}
                                    />
                                  </div>
                                  <div className="row-button-section-programs">
                                    {!isReadOnly && (
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
                              style={isReadOnly ? { opacity: 0.5, pointerEvents: "none" } : {}}
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
                              disabled={isReadOnly}
                            />

                            <div className="identificationpic-content">
                              <div className="identificationpic-display">
                                <div className="cover-photo">
                                  <img
                                    src={previewURLs[0] || existingPhotoURL || "/Images/thumbnail.png"}
                                    alt="Program Cover"
                                    className="program-cover"
                                  />
                                  {!isReadOnly && previewURLs[0] && (
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
                                        {!isReadOnly && (
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
                                          {!isReadOnly && (
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
                            ].join(" ").trim()}
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
                            disabled={isReadOnly}
                          />
                          {/* Counter + validation hint */}
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                            <span style={{ opacity: 0.7 }}>
                              Minimum {MIN_DESC_CHARS} characters
                            </span>
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
                            ].join(" ").trim()}
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
                            disabled={isReadOnly}
                          />
                          {/* Counter + validation hint */}
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
                            <span style={{ opacity: 0.7 }}>
                              Minimum {MIN_SUMMARY_CHARS} characters
                            </span>
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
                            disabled={isReadOnly}
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
    </main>
  );
}
