"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onProgramSaved?: (msg: string) => void;
};

const PREAPPROVED_NAMES = [
  "medical mission",
  "caravan",
  "social services program caravan",
  "aksyon medikal",
  "job fair local employment",
  "feeding program",
  "scholarship program",
];

const AUTO_POSITIONS = ["Secretary", "Assistant Secretary", "Punong Barangay"];

type SimpleField = { name: string, description?: string };

export default function AddNewProgramModal({ isOpen, onClose, onProgramSaved }: Props) {
  const { data: session } = useSession();
  const userPosition = (session?.user as any)?.position ?? "";
  const userFullName = (session?.user as any)?.fullName ?? "";
  const userUid = (session?.user as any)?.id ?? null;
  const staffDisplayName = [userPosition, userFullName].filter(Boolean).join(" ");

  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // Details form state 
  const [programName, setProgramName] = useState("");
  const [participants, setParticipants] = useState<string>("");
  const [eligibleParticipants, setEligibleParticipants] = useState("");
  const [location, setLocation] = useState("");

  const [eventType, setEventType] = useState<"single" | "multiple">("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");

  // ⬇️ multiple image support
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewURLs, setPreviewURLs] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [shake, setShake] = useState<{ [key: string]: boolean }>({});

// Requirements 
const PREDEFINED_REQ_TEXT: SimpleField[] = [
  { name: "firstName", description: "Used to save the first name of the participant" },
  { name: "lastName", description: "Used to save the last name of the participant" },
  { name: "contactNumber", description: "Used to save the contact number of the participant" },
  { name: "emailAddress", description: "Used to save the email address of the participant" },
  { name: "location", description: "Used to save the address of the participant" },
];

const PREDEFINED_REQ_FILES: SimpleField[] = [
  { name: "validIDjpg", description: "Used to save the uploaded valid ID of the participant" },
];

  const [isPredefinedOpen, setIsPredefinedOpen] = useState(false);
  const [reqTextNew, setReqTextNew] = useState("");
  const [reqTextFields, setReqTextFields] = useState<SimpleField[]>([]);
  const [reqFileNew, setReqFileNew] = useState("");
  const [reqFileFields, setReqFileFields] = useState<SimpleField[]>([]);

  const addReqText = () => {
    const v = reqTextNew.trim();
    if (!v) return;
    setReqTextFields((prev) => [...prev, { name: v }]);
    setReqTextNew("");
  };
  const removeReqText = (i: number) => {
    setReqTextFields((prev) => prev.filter((_, idx) => idx !== i));
  };
  const addReqFile = () => {
    const v = reqFileNew.trim();
    if (!v) return;
    setReqFileFields((prev) => [...prev, { name: v }]);
    setReqFileNew("");
  };
  const removeReqFile = (i: number) => {
    setReqFileFields((prev) => prev.filter((_, idx) => idx !== i));
  };

  const triggerShake = (field: string, durationMs = 300) => {
    setShake((prev) => ({ ...prev, [field]: true }));
    window.setTimeout(() => setShake((prev) => ({ ...prev, [field]: false })), durationMs);
  };

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
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
  };

  const resetForm = () => {
    setActiveSection("details");
    setProgramName("");
    setParticipants("");
    setEligibleParticipants("");
    setLocation("");
    setEventType("single");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
    setTimeStart("");
    setTimeEnd("");
    setDescription("");
    setSummary("");

    // revoke and clear previews
    setPreviewURLs((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setPhotoFiles([]);
    setFileError(null);

    setErrors({});
    setShake({});

    // requirements
    setReqTextNew("");
    setReqFileNew("");
    setReqTextFields([]);
    setReqFileFields([]);
    setIsPredefinedOpen(false);
  };

  const validate = () => {
    const e: { [k: string]: boolean } = {};
    const need = (key: string, ok: boolean) => {
      if (!ok) {
        e[key] = true;
        triggerShake(key);
      }
    };

    const participantsNum = Number(participants);
    const validParticipants =
      participants.trim().length > 0 &&
      Number.isFinite(participantsNum) &&
      participantsNum > 0;

    need("programName", !!programName.trim());
    need("participants", validParticipants);
    need("eligibleParticipants", !!eligibleParticipants);
    need("location", !!location.trim());
    need("description", !!description.trim());
    need("summary", !!summary.trim());
    need("photoFiles", photoFiles.length > 0);
    need("timeStart", !!timeStart);
    need("timeEnd", !!timeEnd);

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
      const tS = toMinutes(timeStart);
      const tE = toMinutes(timeEnd);
      if (tS < 0 || tE < 0 || tE <= tS) {
        e["timeEnd"] = true;
        triggerShake("timeEnd");
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isAutoApprovedByPolicy = () => {
    const nameOk = PREAPPROVED_NAMES.includes(programName.trim().toLowerCase());
    const roleOk = AUTO_POSITIONS.includes(userPosition);
    return nameOk && roleOk;
  };

  // ⬇️ handle multi-file selection (images only)
  const handleFilesChange = (files: FileList | null) => {
    setFileError(null);
    if (!files || files.length === 0) {
      // clear
      setPhotoFiles([]);
      setPreviewURLs((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      return;
    }

    // Constraints
    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    const MAX_FILES = 4;

    const picked = Array.from(files);
    const filtered: File[] = [];
    const errors: string[] = [];

    for (const f of picked.slice(0, MAX_FILES)) {
      if (!f.type.startsWith("image/")) {
        errors.push(`${f.name} is not an image.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        errors.push(`${f.name} exceeds ${MAX_MB}MB.`);
        continue;
      }
      filtered.push(f);
    }

    if (picked.length > MAX_FILES) {
      errors.push(`Only the first ${MAX_FILES} images were accepted.`);
    }

    // Build previews
    const newPreviews = filtered.map((f) => URL.createObjectURL(f));

    // Revoke old previews
    setPreviewURLs((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return newPreviews;
    });
    setPhotoFiles(filtered);

    if (errors.length) {
      setFileError(errors.join(" "));
    }

    // clear any old photo error flag
    setErrors((prev) => {
      const { photoFiles, ...rest } = prev;
      return rest;
    });
  };

  useEffect(() => {
    return () => {
      // cleanup on unmount
      setPreviewURLs((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
    };
  }, []);

  const addMinutes = (hhmm: string, minutes: number) => {
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const total = h * 60 + m + minutes;
    const newH = Math.floor((total % (24 * 60)) / 60);
    const newM = total % 60;
    return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
  };

  const isSameDay = () => {
    if (eventType === "single") return true;
    if (!startDate || !endDate) return false;
    return startDate === endDate;
  };

  const endTimeMin = isSameDay() && timeStart ? addMinutes(timeStart, 180) : undefined;

  const handleSave = async () => {
    if (saving) return;
    if (!validate()) {
      setActiveSection("details");
      return;
    }

    setSaving(true);
    try {
      const autoApproved = isAutoApprovedByPolicy();

      const normalizedStart = eventType === "single" ? singleDate : startDate;
      const normalizedEnd = eventType === "single" ? singleDate : endDate;

      const payload: any = {
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
        approvalStatus: autoApproved ? "Approved" : "Pending",
        progressStatus: "Upcoming",
        activeStatus: autoApproved ? "Active" : "Inactive",
        createdAt: serverTimestamp(),
        suggestedBy: staffDisplayName || null,
        suggestedByUid: userUid,
        requirements: {
          textFields: [...PREDEFINED_REQ_TEXT, ...reqTextFields],
          fileFields: [...PREDEFINED_REQ_FILES, ...reqFileFields],
        },
      };

      const programRef = await addDoc(collection(db, "Programs"), payload);

      // ⬇️ upload all selected images
      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(async (file, idx) => {
          const storageRef = ref(
            storage,
            `Programs/${programRef.id}/photos/${Date.now()}_${idx}_${file.name}`
          );
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });

        const urls = await Promise.all(uploadPromises);
        await updateDoc(doc(db, "Programs", programRef.id), {
          photoURL: urls[0] || null,     // main/cover image
          photoURLs: urls,               // gallery
        });
      }

      if (!autoApproved) {
        await addDoc(collection(db, "BarangayNotifications"), {
          message: `A new program (${programName}) has been suggested by ${staffDisplayName}.`,
          timestamp: new Date(),
          isRead: false,
          recipientRole: "Punong Barangay",
          transactionType: "Program Suggestion",
          programID: programRef.id,
          programName: programName.trim(),
          suggestedBy: staffDisplayName || null,
          suggestedByUid: userUid,
        });
      }

      onProgramSaved?.("Program saved successfully.");
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      // keep inline errors/UI instead of alert
      setFileError("Failed to save program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasPreviews = previewURLs.length > 0;

  const togglePredefinedOpen = () => {
        setIsPredefinedOpen(prev => !prev);
    };

  return (
    <div className="add-programs-popup-overlay">
      <div className="add-programs-confirmation-popup">
        <h2>Add New Program</h2>

        <div className="add-programs-main-container">
          {/* Left: Photo / Gallery */}
          <div className="add-programs-photo-section">
            <span className="add-programs-details-label">
              Photos <span className="required">*</span>
            </span>

            {/* Main preview (first image) */}
            <div className="add-programs-profile-container">
              <img
                src={hasPreviews ? previewURLs[0]! : "/Images/thumbnail.png"}
                alt="Program"
                className={[
                  "add-program-photo",
                  !hasPreviews ? "placeholder" : "",
                  errors.photoFiles ? "input-error" : "",
                  shake.photoFiles ? "shake" : "",
                ].join(" ").trim()}
              />
            </div>

            {/* Thumbnails for the rest */}
            {previewURLs.length > 1 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {previewURLs.slice(1).map((u, i) => (
                  <img
                    key={u}
                    src={u}
                    alt={`Preview ${i + 2}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              id="identification-file-upload"
              onChange={(e) => handleFilesChange(e.target.files)}
            />
            <label htmlFor="identification-file-upload" className="add-programs-upload-link">
              Click to Upload File(s)
            </label>

            {/* Inline file errors (kept subtle) */}
            {(errors.photoFiles || fileError) && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
                {errors.photoFiles && "Please upload at least one image."}
                {fileError && (
                  <span style={{ display: "block", marginTop: 4 }}>{fileError}</span>
                )}
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="add-programs-info-main-container">
            <nav className="program-info-toggle-wrapper">
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

            {activeSection === "details" && (
              <>
                <div className="add-programs-upper-section">
                  {/* Left column */}
                  <div className="add-programs-content-left-side">
                    <div className="fields-section-add-programs">
                      <p>
                        Program Name<span className="required">*</span>
                      </p>
                      <input
                        type="text"
                        className={[
                          "add-programs-input-field",
                          errors.programName ? "input-error" : "",
                          shake.programName ? "shake" : "",
                        ].join(" ").trim()}
                        placeholder="Program Name (E.g. Feeding Program)"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                      />
                    </div>

                    <div className="fields-section-add-programs">
                      <p>
                        Number of Participants<span className="required">*</span>
                      </p>
                      <input
                        type="number"
                        min={1}
                        className={[
                          "add-programs-input-field",
                          errors.participants ? "input-error" : "",
                          shake.participants ? "shake" : "",
                        ].join(" ").trim()}
                        placeholder="E.g. 50"
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                      />
                    </div>

                    <div className="fields-section-add-programs">
                      <p>
                        Eligible Participants<span className="required">*</span>
                      </p>
                      <select
                        className={[
                          "add-programs-input-field",
                          errors.eligibleParticipants ? "input-error" : "",
                          shake.eligibleParticipants ? "shake" : "",
                        ].join(" ").trim()}
                        value={eligibleParticipants}
                        onChange={(e) => setEligibleParticipants(e.target.value)}
                      >
                        <option value="">Select requirement</option>
                        <option value="resident">Resident</option>
                        <option value="non-resident">Non-Resident</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                    <div className="fields-section-add-programs">
                      <p>
                        Time Start<span className="required">*</span>
                      </p>
                      <input
                        type="time"
                        className={[
                          "add-programs-input-field",
                          errors.timeStart ? "input-error" : "",
                          shake.timeStart ? "shake" : "",
                        ].join(" ").trim()}
                        value={timeStart}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setTimeStart(newStart);

                          if (isSameDay() && newStart && timeEnd) {
                            const minAllowed = addMinutes(newStart, 180);
                            if (toMinutes(timeEnd) < toMinutes(minAllowed)) {
                              setTimeEnd(minAllowed);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="add-programs-content-right-side">
                    <div className="fields-section-add-programs">
                      <p>
                        Event Type<span className="required">*</span>
                      </p>
                      <select
                        className="add-programs-input-field"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as "single" | "multiple")}
                      >
                        <option value="single">Single Day</option>
                        <option value="multiple">Multiple Days</option>
                      </select>
                    </div>

                    {eventType === "single" ? (
                      <div className="fields-section-add-programs">
                        <p>
                          Event Date<span className="required">*</span>
                        </p>
                        <input
                          type="date"
                          className={[
                            "add-programs-input-field",
                            errors.singleDate ? "input-error" : "",
                            shake.singleDate ? "shake" : "",
                          ].join(" ").trim()}
                          min={minDate}
                          value={singleDate}
                          onChange={(e) => setSingleDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="fields-section-add-programs">
                          <p>
                            Program Start Date<span className="required">*</span>
                          </p>
                          <input
                            type="date"
                            className={[
                              "add-programs-input-field",
                              errors.startDate ? "input-error" : "",
                              shake.startDate ? "shake" : "",
                            ].join(" ").trim()}
                            min={minDate}
                            value={startDate}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setStartDate(newStart);
                              if (endDate && new Date(endDate) < new Date(newStart)) {
                                setEndDate(newStart);
                              }
                              if (isSameDay() && timeStart && timeEnd && toMinutes(timeEnd) < toMinutes(timeStart)) {
                                setTimeEnd(timeStart);
                              }
                            }}
                          />
                        </div>
                        <div className="fields-section-add-programs">
                          <p>
                            Program End Date<span className="required">*</span>
                          </p>
                          <input
                            type="date"
                            className={[
                              "add-programs-input-field",
                              errors.endDate ? "input-error" : "",
                              shake.endDate ? "shake" : "",
                            ].join(" ").trim()}
                            min={startDate || minDate}
                            value={endDate}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              if (startDate && new Date(newEnd) < new Date(startDate)) {
                                setEndDate(startDate);
                              } else {
                                setEndDate(newEnd);
                              }
                              if (isSameDay() && timeStart && timeEnd && toMinutes(timeEnd) < toMinutes(timeStart)) {
                                setTimeEnd(timeStart);
                              }
                            }}
                          />
                        </div>
                      </>
                    )}

                    <div className="fields-section-add-programs">
                      <p>
                        Location<span className="required">*</span>
                      </p>
                      <input
                        type="text"
                        className={[
                          "add-programs-input-field",
                          errors.location ? "input-error" : "",
                          shake.location ? "shake" : "",
                        ].join(" ").trim()}
                        placeholder="Location (E.g. Barangay Hall)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>

                    <div className="fields-section-add-programs">
                      <p>
                        Time End<span className="required">*</span>
                      </p>
                      <input
                        type="time"
                        className={[
                          "add-programs-input-field",
                          errors.timeEnd ? "input-error" : "",
                          shake.timeEnd ? "shake" : "",
                        ].join(" ").trim()}
                        min={endTimeMin}
                        value={timeEnd}
                        onChange={(e) => {
                          const newEnd = e.target.value;
                          if (isSameDay() && timeStart) {
                            const minAllowed = addMinutes(timeStart, 180);
                            if (toMinutes(newEnd) < toMinutes(minAllowed)) {
                              setTimeEnd(minAllowed);
                              return;
                            }
                          }
                          setTimeEnd(newEnd);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="add-programs-lower-section">

                  <div className="programs-description-container">
                    <div className="box-container-outer-description">
                      <div className="title-description-programs">
                        Summary of Program
                      </div>
                      <div className="box-container-summary">
                        <span className="required-asterisk">*</span>
                        <textarea
                          className={[
                            "summary-input-field",
                            errors.summary ? "input-error" : "",
                            shake.summary ? "shake" : "",
                          ].join(" ").trim()}
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="programs-description-container">
                    <div className="box-container-outer-description">
                      <div className="title-description-programs">
                        Full Description of Program
                      </div>
                      <div className="box-container-description">
                        <span className="required-asterisk">*</span>
                        <textarea
                          className={[
                            "description-input-field",
                            errors.description ? "input-error" : "",
                            shake.description ? "shake" : "",
                          ].join(" ").trim()}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  
                </div>
              </>
            )}

            {activeSection === "reqs" && (
              <div className="add-programs-requirements-container">

                {/* PREDEFINED fields */}
                <div className="predefined-fields-notes-container">
                  <div className="predefined-fields-notes-container-tile" style={{cursor: 'pointer'}} onClick={togglePredefinedOpen}>
                    <div className="predefined-fields-title">
                        <h1>Pre-defined Fields</h1>
                    </div>
                    <div className="predefined-fields-button-section">
                      <button
                        type="button"
                        className="toggle-btn-predefined-fields"
                        aria-label={isPredefinedOpen ? 'Hide details' : 'Show details'}
                      >
                        <img
                          src={isPredefinedOpen ? '/Images/up.png' : '/Images/down.png'}
                          alt={isPredefinedOpen ? 'Hide details' : 'Show details'}
                          style={{ width: '16px', height: '16px' }}
                        />
                        </button>
                    </div>
                  </div>

                  {isPredefinedOpen && (
                    <div className="predefined-list">
                      <div className="predefined-list-note">
                        * These will be auto-included when saving the program *
                      </div>
                      <ul className="predefined-list-items">
                        {PREDEFINED_REQ_TEXT.length === 0 && PREDEFINED_REQ_FILES.length === 0 && (
                          <li style={{ opacity: 0.7 }}>No predefined requirements yet.</li>
                        )}

                        {PREDEFINED_REQ_TEXT.map((f, i) => (
                          <li key={`pretext-${i}`} className="predefined-text">
                            {i + 1}. {f.name} <span className="predefined-type">(text)</span>
                            <span className="predefined-desc"> — {f.description}</span>
                          </li>
                        ))}

                        {PREDEFINED_REQ_FILES.map((f, i) => (
                          <li key={`prefile-${i}`} className="predefined-text">
                            {PREDEFINED_REQ_TEXT.length + i + 1}. {f.name}{" "}
                            <span className="predefined-type">(file)</span>
                            <span className="predefined-desc"> — {f.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>


                {/* Custom TEXT requirements */}
                <div className="box-container-outer-doc-fields">
                  <div className="title-doc-fields">
                    Text Fields
                  </div>

                  <div className="box-container-doc-fields">
                    <div className="instructions-container">
                      <h1>* Enter the fields needed for the document. No need to input pre-defined fields. FORMAT: sampleField *</h1>
                    </div>
                    <span className="required-asterisk">*</span>
                    <div className="add-doc-field-container">
                      <div className="add-doc-field-row">
                        <div className="row-title-section">
                          <h1>Add Field:</h1>
                        </div>
                        <div className="row-input-section">
                          <input
                            type="text"
                            className="add-program-field-input"
                            placeholder="e.g., guardianName"
                            value={reqTextNew}
                            onChange={(e) => setReqTextNew(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReqText(); } }}
                          />
                        </div>
                        <div className="row-button-section">
                          <button
                            type="button"
                            className="doc-field-add-button"
                            onClick={addReqText}
                            >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    
                    <div className="added-doc-field-container">
                      {reqTextFields.length > 0 && (
                        <div className="added-doc-field-row">
                          {reqTextFields.map((f, i) => (
                            <div key={`rt-${i}`} className="added-doc-field-row">
                              <div className="row-input-section-added">
                                <input
                                  type="text"
                                  className="add-program-field-input"
                                  value={f.name}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setReqTextFields((prev) => prev.map((x, idx) => idx === i ? { name: v } : x));
                                  }}
                                />
                              </div>
                              <div className="row-button-section">
                                <button 
                                  type="button"
                                  className="doc-field-remove-button"
                                  onClick={() => removeReqText(i)}
                                >
                                  -
                                </button>
                              </div>
                            </div>

                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom FILEEE requirements */}
                <div className="box-container-outer-doc-fields">
                  <div className="title-doc-fields">
                    File Upload Fields
                  </div>

                  <div className="box-container-doc-fields">
                    <div className="instructions-container">
                      <h1>* Enter the fields needed for the document. No need to input pre-defined fields. FORMAT: sampleField *</h1>
                    </div>
                    <span className="required-asterisk">*</span>
                    <div className="add-doc-field-container">
                      <div className="add-doc-field-row">
                        <div className="row-title-section">
                          <h1>Add Field:</h1>
                        </div>
                        <div className="row-input-section">
                          <input
                            type="text"
                            className="add-program-field-input"
                            placeholder="e.g., guardianName"
                            value={reqTextNew}
                            onChange={(e) => setReqTextNew(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReqText(); } }}
                          />
                        </div>
                        <div className="row-button-section">
                          <button
                            type="button"
                            className="doc-field-add-button"
                            onClick={addReqText}
                            >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    
                    <div className="added-doc-field-container">
                      {reqTextFields.length > 0 && (
                        <div className="added-doc-field-row">
                          {reqTextFields.map((f, i) => (
                            <div key={`rt-${i}`} className="added-doc-field-row">
                              <div className="row-input-section-added">
                                <input
                                  type="text"
                                  className="add-program-field-input"
                                  value={f.name}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setReqTextFields((prev) => prev.map((x, idx) => idx === i ? { name: v } : x));
                                  }}
                                />
                              </div>
                              <div className="row-button-section">
                                <button 
                                  type="button"
                                  className="doc-field-remove-button"
                                  onClick={() => removeReqText(i)}
                                >
                                  -
                                </button>
                              </div>
                            </div>

                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Custom FILE requirements */}
                <div className="fields-section-add-programs">
                  <p>Requirement File Uploads</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      className="add-programs-input-field"
                      placeholder="e.g., medicalCertificateJpg"
                      value={reqFileNew}
                      onChange={(e) => setReqFileNew(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReqFile(); } }}
                    />
                    <button type="button" className="info-toggle-btn" onClick={addReqFile}>+</button>
                  </div>

                  {reqFileFields.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {reqFileFields.map((f, i) => (
                        <div key={`rf-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                          <input
                            type="text"
                            className="add-programs-input-field"
                            value={f.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setReqFileFields((prev) => prev.map((x, idx) => idx === i ? { name: v } : x));
                            }}
                          />
                          <button type="button" className="program-no-button" onClick={() => removeReqFile(i)}>-</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                    Tip: use a clear naming convention (e.g., <code>validIDjpg</code>, <code>barangayIDjpg</code>, etc.)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="programs-yesno-container">
          <button
            onClick={() => {
              if (!saving) {
                resetForm();
                onClose();
              }
            }}
            className="program-no-button"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="program-yes-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
