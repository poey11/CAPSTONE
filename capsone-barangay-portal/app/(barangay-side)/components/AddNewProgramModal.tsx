"use client";
import React, { useMemo, useState } from "react";
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

export default function AddNewProgramModal({ isOpen, onClose }: Props) {
  const { data: session } = useSession();
  const userPosition = (session?.user as any)?.position ?? "";
  const userFullName = (session?.user as any)?.fullName ?? "";
  const staffDisplayName = [userPosition, userFullName].filter(Boolean).join(" ");

  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // DETAILS: form state
  const [programName, setProgramName] = useState("");
  const [participants, setParticipants] = useState<string>("");
  const [eligibleParticipants, setEligibleParticipants] = useState("");
  const [location, setLocation] = useState("");

  // Event type + dates/times
  const [eventType, setEventType] = useState<"single" | "multiple">("single");
  const [singleDate, setSingleDate] = useState(""); // yyyy-mm-dd
  const [startDate, setStartDate] = useState("");  // yyyy-mm-dd
  const [endDate, setEndDate] = useState("");      // yyyy-mm-dd
  const [timeStart, setTimeStart] = useState("");  // HH:MM
  const [timeEnd, setTimeEnd] = useState("");      // HH:MM

  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [shake, setShake] = useState<{ [key: string]: boolean }>({});

  const triggerShake = (field: string) => {
    setShake((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => setShake((prev) => ({ ...prev, [field]: false })), 400);
  };

  // Min date (tomorrow) blocks today/past in pickers
  const minDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
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
  };

  const validate = () => {
    const e: { [k: string]: boolean } = {};
    const need = (key: string, ok: boolean) => {
      if (!ok) {
        e[key] = true;
        triggerShake(key);
      }
    };

    // Required fields
    need("programName", !!programName);
    need("participants", !!participants);
    need("eligibleParticipants", !!eligibleParticipants);
    need("location", !!location);
    need("description", !!description);
    need("summary", !!summary);
    need("photoFile", !!photoFile);
    need("timeStart", !!timeStart);
    need("timeEnd", !!timeEnd);

    // Dates with Event Type
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

    // Time rule: End > Start
    if (timeStart && timeEnd) {
      if (toMinutes(timeEnd) <= toMinutes(timeStart)) {
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

  const handleSave = async () => {
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
        programName,
        participants: Number(participants),
        eligibleParticipants,
        location,
        eventType,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        timeStart,
        timeEnd,
        description,
        summary,
        approvalStatus: autoApproved ? "Approved" : "Pending",
        progressStatus: "Upcoming",
        activeStatus: autoApproved ? "Active" : "Inactive",
        createdAt: serverTimestamp(),
        suggestedBy: staffDisplayName,
        suggestedByUid: (session?.user as any)?.id ?? null,
      };

      const programRef = await addDoc(collection(db, "Programs"), payload);

      // Upload thumbnail
      if (photoFile) {
        const storageRef = ref(
          storage,
          `Programs/${programRef.id}/photo_${Date.now()}_${photoFile.name}`
        );
        await uploadBytes(storageRef, photoFile);
        const photoURL = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "Programs", programRef.id), { photoURL });
      }

      // Notify PB if pending
      if (!autoApproved) {
        await addDoc(collection(db, "BarangayNotifications"), {
          message: `A new program (${programName}) has been suggested by ${staffDisplayName}.`,
          timestamp: new Date(),
          isRead: false,
          recipientRole: "Punong Barangay",
          transactionType: "Program Suggestion",
          programID: programRef.id,
          programName,
          suggestedBy: staffDisplayName,
          suggestedByUid: (session?.user as any)?.uid ?? null,
        });
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-programs-popup-overlay">
      <div className="add-programs-confirmation-popup">
        <h2>Add New Program</h2>

        <div className="add-programs-main-container">
          {/* LEFT: Photo */}
          <div className="add-programs-photo-section">
            <span className="add-programs-details-label">
              Photo <span className="required">*</span>
            </span>
            <div className="add-programs-profile-container">
              <img
                src={
                  photoFile
                    ? URL.createObjectURL(photoFile)
                    : "/Images/thumbnail.png"
                }
                alt="Program"
                className={`add-program-photo ${errors.photoFile ? "error shake" : ""}`}
              />
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="identification-file-upload"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="identification-file-upload"
              className="add-programs-upload-link"
            >
              Click to Upload File
            </label>
          </div>

          {/* RIGHT: Form */}
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
                  {/* LEFT column */}
                  <div className="add-programs-content-left-side">
                    <div className="fields-section-add-programs">
                      <p>Program Name<span className="required">*</span></p>
                      <input
                        type="text"
                        className={`add-programs-input-field ${errors.programName ? "error shake" : ""}`}
                        placeholder="Program Name (E.g. Feeding Program)"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                      />
                    </div>

                    <div className="fields-section-add-programs">
                      <p>Number of Participants<span className="required">*</span></p>
                      <input
                        type="number"
                        min="1"
                        className={`add-programs-input-field ${errors.participants ? "error shake" : ""}`}
                        placeholder="E.g. 50"
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                      />
                    </div>

                    <div className="fields-section-add-programs">
                      <p>Eligible Participants<span className="required">*</span></p>
                      <select
                        className={`add-programs-input-field ${errors.eligibleParticipants ? "error shake" : ""}`}
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
                      <p>Time Start<span className="required">*</span></p>
                      <input
                        type="time"
                        className={`add-programs-input-field ${errors.timeStart ? "error shake" : ""}`}
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* RIGHT column */}
                  <div className="add-programs-content-right-side">
                    <div className="fields-section-add-programs">
                      <p>Event Type<span className="required">*</span></p>
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
                        <p>Event Date<span className="required">*</span></p>
                        <input
                          type="date"
                          className={`add-programs-input-field ${errors.singleDate ? "error shake" : ""}`}
                          min={minDate}
                          value={singleDate}
                          onChange={(e) => setSingleDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="fields-section-add-programs">
                          <p>Program Start Date<span className="required">*</span></p>
                          <input
                            type="date"
                            className={`add-programs-input-field ${errors.startDate ? "error shake" : ""}`}
                            min={minDate}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="fields-section-add-programs">
                          <p>Program End Date<span className="required">*</span></p>
                          <input
                            type="date"
                            className={`add-programs-input-field ${errors.endDate ? "error shake" : ""}`}
                            min={minDate}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div className="fields-section-add-programs">
                      <p>Location<span className="required">*</span></p>
                      <input
                        type="text"
                        className={`add-programs-input-field ${errors.location ? "error shake" : ""}`}
                        placeholder="Location (E.g. Barangay Hall)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    
                    <div className="fields-section-add-programs">
                      <p>Time End<span className="required">*</span></p>
                      <input
                        type="time"
                        className={`add-programs-input-field ${errors.timeEnd ? "error shake" : ""}`}
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
                          className={`description-input-field ${errors.description ? "error shake" : ""}`}
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
                          className={`description-input-field ${errors.summary ? "error shake" : ""}`}
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
              <div className="add-programs-upper-section"></div>
            )}
          </div>
        </div>

        <div className="programs-yesno-container">
          <button
            onClick={() => {
              resetForm();
              onClose();
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
