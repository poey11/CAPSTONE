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
  onProgramSaved?: (msg: string) => void; // notify parent to show main-page popup
};

// Pre-approved program names (case-insensitive)
const PREAPPROVED_NAMES = [
  "medical mission",
  "caravan",
  "social services program caravan",
  "aksyon medikal",
  "job fair local employment",
  "feeding program",
  "scholarship program",
];

// Positions that can auto-approve pre-approved names
const AUTO_POSITIONS = ["Secretary", "Assistant Secretary", "Punong Barangay"];

type SimpleField = { name: string };

export default function AddNewProgramModal({ isOpen, onClose, onProgramSaved }: Props) {
  const { data: session } = useSession();
  const userPosition = (session?.user as any)?.position ?? "";
  const userFullName = (session?.user as any)?.fullName ?? "";
  const userUid = (session?.user as any)?.id ?? null;
  const staffDisplayName = [userPosition, userFullName].filter(Boolean).join(" ");

  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // ====== Details form state ======
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [shake, setShake] = useState<{ [key: string]: boolean }>({});

  // ====== Requirements state (like AddNewDoc) ======
  // Predefined arrays (leave empty for now; we’ll fill when you send the screenshot)
  const PREDEFINED_REQ_TEXT: SimpleField[] = [
    { name: "firstName" },
    { name: "lastName" },
    { name: "contactNumber" },
    { name: "emailAddress" },
    { name: "location" },
  ];
  const PREDEFINED_REQ_FILES: SimpleField[] = [
    { name: "validIDjpg" },
  ];

  const [isPredefinedOpen, setIsPredefinedOpen] = useState(false);

  // Custom (user-added) requirement fields
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

  // ===== util =====
  const triggerShake = (field: string, durationMs = 300) => {
    setShake((prev) => ({ ...prev, [field]: true }));
    window.setTimeout(() => setShake((prev) => ({ ...prev, [field]: false })), durationMs);
  };

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
    setPhotoFile(null);
    setErrors({});
    setShake({});
    setPreviewURL((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });

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
    need("photoFile", !!photoFile);
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

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPhotoFile(null);
      setPreviewURL((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("Image too large. Max 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPreviewURL((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });

    // clear any old photo error
    setErrors((prev) => {
      const { photoFile, ...rest } = prev;
      return rest;
    });
  };

  useEffect(() => {
    return () => {
      setPreviewURL((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, []);

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

        // NEW: requirements schema saved with the program
        requirements: {
          textFields: [...PREDEFINED_REQ_TEXT, ...reqTextFields],
          fileFields: [...PREDEFINED_REQ_FILES, ...reqFileFields],
        },
      };

      const programRef = await addDoc(collection(db, "Programs"), payload);

      if (photoFile) {
        const storageRef = ref(
          storage,
          `Programs/${programRef.id}/photo_${Date.now()}_${photoFile.name}`
        );
        await uploadBytes(storageRef, photoFile);
        const photoURL = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "Programs", programRef.id), { photoURL });
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
      alert("Failed to save program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasPhoto = !!previewURL;

  return (
    <div className="add-programs-popup-overlay">
      <div className="add-programs-confirmation-popup">
        <h2>Add New Program</h2>

        <div className="add-programs-main-container">
          {/* Left: Photo */}
          <div className="add-programs-photo-section">
            <span className="add-programs-details-label">
              Photo <span className="required">*</span>
            </span>
            <div className="add-programs-profile-container">
              <img
                src={hasPhoto ? previewURL! : "/Images/thumbnail.png"}
                alt="Program"
                className={[
                  "add-program-photo",
                  !hasPhoto ? "placeholder" : "",
                  errors.photoFile ? "input-error" : "",
                  shake.photoFile ? "shake" : "",
                ].join(" ").trim()}
              />
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="identification-file-upload"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="identification-file-upload"
              className="add-programs-upload-link"
            >
              Click to Upload File
            </label>
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
                        onChange={(e) => setTimeStart(e.target.value)}
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
                            onChange={(e) => setStartDate(e.target.value)}
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
                            min={minDate}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
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
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="add-programs-lower-section">
                  <div className="programs-description-container">
                    <div className="box-container-outer-description">
                      <div className="title-description-programs">
                        Description of Program<span className="required">*</span>
                      </div>
                      <div className="box-container-description">
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

                  <div className="programs-description-container">
                    <div className="box-container-outer-description">
                      <div className="title-description-programs">
                        Summary of Program<span className="required">*</span>
                      </div>
                      <div className="box-container-description">
                        <textarea
                          className={[
                            "description-input-field",
                            errors.summary ? "input-error" : "",
                            shake.summary ? "shake" : "",
                          ].join(" ").trim()}
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === "reqs" && (
              <div className="add-programs-upper-section">
                {/* Predefined requirements toggle */}
                <div className="fields-section-add-programs">
                  <div className="predefined-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0 }}>Pre-defined Requirements</p>
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
                    <div className="predefined-list" style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
                        (These will be auto-included when saving the program)
                      </div>
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {PREDEFINED_REQ_TEXT.length === 0 && PREDEFINED_REQ_FILES.length === 0 && (
                          <li style={{ opacity: 0.7 }}>No predefined requirements yet.</li>
                        )}
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

                {/* Custom TEXT requirements */}
                <div className="fields-section-add-programs">
                  <p>Requirement Text Fields</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      className="add-programs-input-field"
                      placeholder="e.g., guardianName"
                      value={reqTextNew}
                      onChange={(e) => setReqTextNew(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReqText(); } }}
                    />
                    <button type="button" className="info-toggle-btn" onClick={addReqText}>+</button>
                  </div>

                  {reqTextFields.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {reqTextFields.map((f, i) => (
                        <div key={`rt-${i}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                          <input
                            type="text"
                            className="add-programs-input-field"
                            value={f.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setReqTextFields((prev) => prev.map((x, idx) => idx === i ? { name: v } : x));
                            }}
                          />
                          <button type="button" className="program-no-button" onClick={() => removeReqText(i)}>-</button>
                        </div>
                      ))}
                    </div>
                  )}
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
