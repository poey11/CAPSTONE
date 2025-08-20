"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useSession } from "next-auth/react";

type SimpleField = { name: string };

const PREDEFINED_REQ_TEXT: SimpleField[] = [
  { name: "firstName" },
  { name: "lastName" },
  { name: "contactNumber" },
  { name: "emailAddress" },
  { name: "location" },
];

const PREDEFINED_REQ_FILES: SimpleField[] = [{ name: "validIDjpg" }];

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

  const [activeSection, setActiveSection] = useState<"details" | "reqs" | "others">("details");

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

  //  Photos (multiple)
  // Existing photos from DB
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

  // Min date (tomorrow)
  const minDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    t.setHours(0, 0, 0, 0);
    return t.toISOString().split("T")[0];
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

  // Read-only lock
  const isReadOnly = progressStatus === "Completed" || approvalStatus === "Rejected";

  //  Load program 
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
        setEligibleParticipants(data.eligibleParticipants ?? "");
        setLocation(data.location ?? "");

        setApprovalStatus(data.approvalStatus ?? "Pending");
        setProgressStatus(data.progressStatus ?? "Upcoming");
        setActiveStatus((data.activeStatus as "Active" | "Inactive") ?? "Inactive");

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
        const gallery: string[] = Array.isArray(data.photoURLs) ? data.photoURLs : (cover ? [cover] : []);
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

  //  Multi file select 
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

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!programId || isReadOnly) return;
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
        activeStatus: "Inactive",
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
    need("eligibleParticipants", !!eligibleParticipants);
    need("location", !!location.trim());
    need("description", !!description.trim());
    need("summary", !!summary.trim());

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
      const normalizedStart = eventType === "single" ? singleDate : startDate;
      const normalizedEnd = eventType === "single" ? singleDate : endDate;

      const mergedText = dedupeByName([...PREDEFINED_REQ_TEXT, ...reqTextFields]);
      const mergedFiles = dedupeByName([...PREDEFINED_REQ_FILES, ...reqFileFields]);

      const updates: any = {
        programName: programName.trim(),
        participants: Number(participants),
        eligibleParticipants,
        location: location.trim(),
        eventType,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        timeStart,
        timeEnd,
        description: description.trim(),
        summary: summary.trim(),
        activeStatus,
        requirements: {
          textFields: mergedText,
          fileFields: mergedFiles,
        },
      };

      // Upload any newly added images, then append to existing gallery
      let newUrls: string[] = [];
      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(async (file, idx) => {
          const storageRef = ref(storage, `Programs/${programId}/photos/${Date.now()}_${idx}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });
        newUrls = await Promise.all(uploadPromises);

        const combined = [...existingPhotoURLs, ...newUrls];
        updates.photoURLs = combined;

        // Keep existing cover if present; otherwise set to first available
        if (!existingPhotoURL && combined.length > 0) {
          updates.photoURL = combined[0];
          setExistingPhotoURL(combined[0]);
        }
        setExistingPhotoURLs(combined);
      }

      await updateDoc(doc(db, "Programs", programId), updates);

      setPopupMessage("Program saved successfully!");
      setShowPopup(true);

      // clear local newly-selected previews after successful save
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

  const handleApprove = async () => {
    if (!programId || isReadOnly) return;
    try {
      setLoading(true);

      await updateDoc(doc(db, "Programs", programId), {
        approvalStatus: "Approved",
        approvedAt: new Date(),
        approvedBy: reviewerName,
        activeStatus: "Active",
        progressStatus: "Upcoming",
      });

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
      setPopupMessage("Program approved successfully.");
      setShowPopup(true);
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

  return (
    <main className="edit-program-main-container">
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
            <img src="/images/profile-user.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Program Details</h1>
        </button>

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

        {approvalStatus === "Pending" && userPosition === "Punong Barangay" && !isReadOnly && (
          <>
            <button className="program-redirection-buttons" onClick={handleApprove}>
              <div className="program-redirection-icons-section">
                <img src="/images/generatedoc.png" alt="approve" className="program-redirection-icons-info" />
              </div>
              <h1>Approve Requested Program</h1>
            </button>

            <button className="program-redirection-buttons" onClick={() => setShowRejectPopup(true)}>
              <div className="program-redirection-icons-section">
                <img src="/images/rejected.png" alt="reject" className="program-redirection-icons-info" />
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
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>
            <h1> Program Details </h1>
          </div>

          <div className="action-btn-section-program">
            <select
              className="action-select-status"
              value={activeStatus}
              onChange={handleStatusChange}
              disabled={isReadOnly}
              title={isReadOnly ? "Completed programs are locked." : "Toggle visibility on resident side"}
              style={{ marginRight: 12 }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {!isReadOnly && (
              <>
                <button className="action-discard" onClick={() => setShowDiscardPopup(true)}>Discard</button>
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
            {approvalStatus === "Rejected" ? (
              <>
                This program has been <strong>Rejected</strong>
                {rejectionReason ? (
                  <> — <em>{rejectionReason}</em></>
                ) : null}
                . Editing is disabled (view-only).
              </>
            ) : (
              <>This program is <strong>Completed</strong>. Editing is disabled (view-only).</>
            )}
          </div>
        )}

        <div className="edit-program-bottom-section">
          <nav className="edit-program-info-toggle-wrapper">
            {["details", "reqs", "others"].map((section) => (
              <button
                key={section}
                type="button"
                className={`info-toggle-btn ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section as "details" | "reqs" | "others")}
              >
                {section === "details" && "Details"}
                {section === "reqs" && "Requirements"}
                {section === "others" && "Others"}
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
                        <p>Program Name<span className="required">*</span></p>
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
                        <p>Number of Participants<span className="required">*</span></p>
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
                        <p>Eligible Participants<span className="required">*</span></p>
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

                      <div className="fields-section-edit-programs">
                        <p>Time Start<span className="required">*</span></p>
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
                    </div>

                    <div className="edit-program-section-2-right-side">
                      <div className="fields-section-edit-programs">
                        <p>Event Type<span className="required">*</span></p>
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
                          <p>Event Date<span className="required">*</span></p>
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
                            <p>Program Start Date<span className="required">*</span></p>
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
                            <p>Program End Date<span className="required">*</span></p>
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
                        <p>Time End<span className="required">*</span></p>
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

                      <div className="fields-section-edit-programs">
                        <p>Program Location<span className="required">*</span></p>
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
                    </div>
                  </div>
                </>
              )}

              {activeSection === "reqs" && (
                <div className="edit-programs-upper-section">
                  <div className="fields-section-edit-programs">
                    <div className="predefined-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>Pre-defined Requirements</p>
                      <button
                        type="button"
                        className="info-toggle-btn"
                        onClick={() => setIsPredefinedOpen((s) => !s)}
                        aria-label={isPredefinedOpen ? "Hide pre-defined" : "Show pre-defined"}
                      >
                        {isPredefinedOpen ? "Hide" : "Show"}
                      </button>
                    </div>
                    {isPredefinedOpen && (
                      <div style={{ marginTop: 8 }}>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                          {PREDEFINED_REQ_TEXT.map((f, i) => (
                            <li key={`pretext-${i}`}>{f.name} <span style={{ opacity: 0.6 }}>(text)</span></li>
                          ))}
                          {PREDEFINED_REQ_FILES.map((f, i) => (
                            <li key={`prefile-${i}`}>{f.name} <span style={{ opacity: 0.6 }}>(file)</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="fields-section-edit-programs">
                    <p style={{ fontWeight: 600 }}>Custom Text Requirements</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        className="edit-programs-input-field"
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
                      <button type="button" className="info-toggle-btn" onClick={addReqText} disabled={isReadOnly}>+</button>
                    </div>

                    {reqTextFields.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        {reqTextFields.map((f, i) => (
                          <div key={`rt-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            <input
                              type="text"
                              className="edit-programs-input-field"
                              value={f.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setReqTextFields((prev) => prev.map((x, idx) => (idx === i ? { name: v } : x)));
                              }}
                              disabled={isReadOnly}
                            />
                            {!isReadOnly && (
                              <button type="button" className="program-no-button" onClick={() => removeReqText(i)}>-</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fields-section-edit-programs">
                    <p style={{ fontWeight: 600 }}>Custom File Requirements</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        className="edit-programs-input-field"
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
                      <button type="button" className="info-toggle-btn" onClick={addReqFile} disabled={isReadOnly}>+</button>
                    </div>

                    {reqFileFields.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        {reqFileFields.map((f, i) => (
                          <div key={`rf-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            <input
                              type="text"
                              className="edit-programs-input-field"
                              value={f.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setReqFileFields((prev) => prev.map((x, idx) => (idx === i ? { name: v } : x)));
                              }}
                              disabled={isReadOnly}
                            />
                            {!isReadOnly && (
                              <button type="button" className="program-no-button" onClick={() => removeReqFile(i)}>-</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                      Tip: keep names consistent (e.g., <code>validIDjpg</code>, <code>barangayIDjpg</code>)
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "others" && (
                <>
                  <div className="edit-programs-upper-section">
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
                            placeholder="Enter Remarks"
                            name="programDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isReadOnly}
                          />
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
                            placeholder="Enter Summary"
                            name="programSummary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>

                      {/* ===== Photos UI (cover + gallery) ===== */}
                      <div className="box-container-outer-resindentificationpic">
                        <div className="title-resindentificationpic">Photos</div>
                        <div className="box-container-resindentificationpic">
                          <div className="identificationpic-container">
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

                            {/* Cover preview: prioritize newly selected, else existing cover */}
                            <div className="identificationpic-display" style={{ marginTop: 10 }}>
                              <div className="identification-picture">
                                <img
                                  src={previewURLs[0] || existingPhotoURL || "/Images/thumbnail.png"}
                                  alt="Program Cover"
                                  style={{ height: "200px", objectFit: "cover", borderRadius: 8 }}
                                />
                              </div>
                            </div>

                            {/* Newly selected thumbnails */}
                            {previewURLs.length > 1 && (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>
                                {previewURLs.slice(1).map((u, i) => (
                                  <img
                                    key={`new-${i}`}
                                    src={u}
                                    alt={`New ${i + 2}`}
                                    style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Existing gallery thumbnails */}
                            {existingPhotoURLs.length > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Existing Photos</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                  {existingPhotoURLs.map((u, i) => (
                                    <img
                                      key={`old-${i}-${u}`}
                                      src={u}
                                      alt={`Existing ${i + 1}`}
                                      style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Clear newly selected (optional) */}
                            {(previewURLs.length > 0 || photoFiles.length > 0) && !isReadOnly && (
                              <div className="delete-container" style={{ marginTop: 10 }}>
                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() => {
                                    setPhotoFiles([]);
                                    setPreviewURLs((old) => {
                                      old.forEach((u) => URL.revokeObjectURL(u));
                                      return [];
                                    });
                                    setFileError(null);
                                  }}
                                >
                                  <img src="/images/trash.png" alt="Delete" className="delete-icon" />
                                </button>
                              </div>
                            )}

                            {(fileError) && (
                              <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>{fileError}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* ===== /Photos UI ===== */}
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
              <button onClick={() => setShowDiscardPopup(false)} className="no-button-add">No</button>
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
