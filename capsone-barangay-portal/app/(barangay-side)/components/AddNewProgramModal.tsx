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

const AUTO_POSITIONS = ["Secretary", "Assistant Secretary", "Punong Barangay"];

type SimpleField = { name: string; description?: string };

export default function AddNewProgramModal({
  isOpen,
  onClose,
  onProgramSaved,
}: Props) {
  const { data: session } = useSession();
  const userPosition = (session?.user as any)?.position ?? "";
  const userFullName = (session?.user as any)?.fullName ?? "";
  const userUid = (session?.user as any)?.id ?? null;
  const staffDisplayName = [userPosition, userFullName].filter(Boolean).join(" ");

  const [activeSection, setActiveSection] = useState<"details" | "reqs">("details");

  // Details
  const [programName, setProgramName] = useState("");
  const [participants, setParticipants] = useState<string>("");
  const [volunteers, setVolunteers] = useState<string>("");
  const [eligibleParticipants, setEligibleParticipants] = useState("");
  const [location, setLocation] = useState("");

  const [eventType, setEventType] = useState<"single" | "multiple">("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");

  // Submit Confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Age restriction
  const [noAgeLimit, setNoAgeLimit] = useState(true);
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");

  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewURLs, setPreviewURLs] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [shake, setShake] = useState<{ [key: string]: boolean }>({});

  // --- Added: minimum character requirements for Summary/Description ---
  const MIN_SUMMARY_CHARS = 200;
  const MIN_DESC_CHARS = 300;
  const summaryLen = summary.trim().length;
  const descriptionLen = description.trim().length;

  // Agency (fixed to be functional)
  const [agency, setAgency] = useState("");
  const [otherAgency, setOtherAgency] = useState("");

  // Requirements
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

  // Minimum start date is 3 days from today (UI shows +4 to be safe)
  const minStartDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 4);
    t.setHours(0, 0, 0, 0);
    return t.toISOString().split("T")[0];
  }, []);

  const isAtLeastDaysFromToday = (dateStr: string, days: number) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const min = new Date(today);
    min.setDate(min.getDate() + days);
    const d = new Date(dateStr);
    return d >= min;
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
    setVolunteers("");
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

    setNoAgeLimit(true);
    setAgeMin("");
    setAgeMax("");

    setPreviewURLs((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setPhotoFiles([]);
    setFileError(null);

    setErrors({});
    setShake({});

    setReqTextNew("");
    setReqFileNew("");
    setReqTextFields([]);
    setReqFileFields([]);
    setIsPredefinedOpen(false);

    setAgency("");
    setOtherAgency("");
  };

  const validate = () => {
    const e: { [key: string]: boolean } = {};
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

    const volunteersNum = Number(volunteers);
    const validVolunteers =
      volunteers.trim().length > 0 &&
      Number.isFinite(volunteersNum) &&
      volunteersNum >= 0;

    need("programName", !!programName.trim());
    need("participants", validParticipants);
    need("volunteers", validVolunteers);
    need("eligibleParticipants", !!eligibleParticipants);
    need("location", !!location.trim());

    // --- Updated: enforce min lengths ---
    const summaryOk = summary.trim().length >= MIN_SUMMARY_CHARS;
    need("summary", summaryOk);

    const descriptionOk = description.trim().length >= MIN_DESC_CHARS;
    need("description", descriptionOk);

    need("photoFiles", photoFiles.length > 0);
    need("timeStart", !!timeStart);
    need("timeEnd", !!timeEnd);

    // Agency validation (fixed)
    need("agency", !!agency);
    if (agency === "others") {
      need("otherAgency", !!otherAgency.trim());
    }

    if (eventType === "single") {
      need("singleDate", !!singleDate && isAtLeastDaysFromToday(singleDate, 3));
    } else {
      need("startDate", !!startDate && isAtLeastDaysFromToday(startDate, 3));
      need("endDate", !!endDate && isAtLeastDaysFromToday(endDate, 3));
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

        const validMin =
          minNum === null || (Number.isFinite(minNum) && minNum >= 0 && minNum <= 150);
        const validMax =
          maxNum === null || (Number.isFinite(maxNum) && maxNum >= 0 && maxNum <= 150);

        if (!validMin) {
          e["ageMin"] = true;
          triggerShake("ageMin");
        }
        if (!validMax) {
          e["ageMax"] = true;
          triggerShake("ageMax");
        }

        if (
          validMin &&
          validMax &&
          minNum !== null &&
          maxNum !== null &&
          minNum > maxNum
        ) {
          e["ageMin"] = true;
          e["ageMax"] = true;
          triggerShake("ageMin");
          triggerShake("ageMax");
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const normalize = (s: string) => s?.toString().trim().toLowerCase();

  const isAutoApprovedByPolicy = () => {
    const roleOk = AUTO_POSITIONS.map(normalize).includes(normalize(userPosition));
    return roleOk;
  };

  // Files (images only)
  const handleFilesChange = (files: FileList | null) => {
    setFileError(null);
    if (!files || files.length === 0) {
      setPhotoFiles([]);
      setPreviewURLs((old) => {
        old.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      return;
    }

    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    const MAX_FILES = 4;

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

    if (picked.length > MAX_FILES) {
      errs.push(`Only the first ${MAX_FILES} images were accepted.`);
    }

    const newPreviews = filtered.map((f) => URL.createObjectURL(f));

    setPreviewURLs((old) => {
      old.forEach((u) => URL.revokeObjectURL(u));
      return newPreviews;
    });
    setPhotoFiles(filtered);

    if (errs.length) {
      setFileError(errs.join(" "));
    }

    setErrors((prev) => {
      const { photoFiles, ...rest } = prev;
      return rest;
    });
  };

  useEffect(() => {
    return () => {
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


  const handleSave = () => {
    if (!validate()) {
      setActiveSection("details");
      return;
    }
    setShowConfirmation(true); // show confirmation popup if no errors
  };

  const confirmSubmit= async () => {
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

      // Resolve agency to store
      const resolvedAgency =
        agency === "others" ? (otherAgency.trim() || "Others") : agency;

      const payload: any = {
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
        // store both the selected value and the resolved label
        agency: resolvedAgency,
        agencyRaw: agency,          // "none" | "cityhall" | "others"
        otherAgency: otherAgency.trim() || null,
        ageRestriction: {
          noAgeLimit,
          minAge: noAgeLimit || ageMin.trim() === "" ? null : Number(ageMin),
          maxAge: noAgeLimit || ageMax.trim() === "" ? null : Number(ageMax),
        },
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
          photoURL: urls[0] || null,
          photoURLs: urls,
        });
      }

      await addDoc(collection(db, "BarangayNotifications"), {
        message: `Your program (${programName}) was submitted successfully.`,
        timestamp: new Date(),
        isRead: false,
        recipientUid: userUid,
        transactionType: "Program Submission",
        programID: programRef.id,
        programName: programName.trim(),
        suggestedBy: staffDisplayName || null,
        suggestedByUid: userUid,
      });

      const pos = normalize(userPosition);
      const isSecOrAsst = pos === "secretary" || pos === "assistant secretary";
      const isPB = pos === "punong barangay";

      if (isSecOrAsst) {
        await addDoc(collection(db, "BarangayNotifications"), {
          message: `A new program (${programName}) was added by ${staffDisplayName}.`,
          timestamp: new Date(),
          isRead: false,
          recipientRole: "Punong Barangay",
          transactionType: "Program Added",
          programID: programRef.id,
          programName: programName.trim(),
          suggestedBy: staffDisplayName || null,
          suggestedByUid: userUid,
        });
      } else if (!autoApproved && !isPB) {
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
      setFileError("Failed to save program. Please try again.");
    } finally {
      setSaving(false);
      setShowConfirmation(false);
    }
  };


  {/*
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

      // Resolve agency to store
      const resolvedAgency =
        agency === "others" ? (otherAgency.trim() || "Others") : agency;

      const payload: any = {
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
        // store both the selected value and the resolved label
        agency: resolvedAgency,
        agencyRaw: agency,          // "none" | "cityhall" | "others"
        otherAgency: otherAgency.trim() || null,
        ageRestriction: {
          noAgeLimit,
          minAge: noAgeLimit || ageMin.trim() === "" ? null : Number(ageMin),
          maxAge: noAgeLimit || ageMax.trim() === "" ? null : Number(ageMax),
        },
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
          photoURL: urls[0] || null,
          photoURLs: urls,
        });
      }

      await addDoc(collection(db, "BarangayNotifications"), {
        message: `Your program (${programName}) was submitted successfully.`,
        timestamp: new Date(),
        isRead: false,
        recipientUid: userUid,
        transactionType: "Program Submission",
        programID: programRef.id,
        programName: programName.trim(),
        suggestedBy: staffDisplayName || null,
        suggestedByUid: userUid,
      });

      const pos = normalize(userPosition);
      const isSecOrAsst = pos === "secretary" || pos === "assistant secretary";
      const isPB = pos === "punong barangay";

      if (isSecOrAsst) {
        await addDoc(collection(db, "BarangayNotifications"), {
          message: `A new program (${programName}) was added by ${staffDisplayName}.`,
          timestamp: new Date(),
          isRead: false,
          recipientRole: "Punong Barangay",
          transactionType: "Program Added",
          programID: programRef.id,
          programName: programName.trim(),
          suggestedBy: staffDisplayName || null,
          suggestedByUid: userUid,
        });
      } else if (!autoApproved && !isPB) {
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
      setFileError("Failed to save program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  */}

  if (!isOpen) return null;

  const hasPreviews = previewURLs.length > 0;

  const togglePredefinedOpen = () => {
    setIsPredefinedOpen((prev) => !prev);
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

            {/* Main preview */}
            <div className="add-programs-profile-container">
              <img
                src={hasPreviews ? previewURLs[0]! : "/Images/thumbnail.png"}
                alt="Program"
                className={[
                  "add-program-photo",
                  !hasPreviews ? "placeholder" : "",
                  errors.photoFiles ? "input-error" : "",
                  shake.photoFiles ? "shake" : "",
                ]
                  .join(" ")
                  .trim()}
              />
            </div>

            {/* Thumbnails */}
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
                        ]
                          .join(" ")
                          .trim()}
                        placeholder="Program Name (E.g. Feeding Program)"
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                      />
                    </div>

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
                        ]
                          .join(" ")
                          .trim()}
                        placeholder="Location (E.g. Barangay Hall)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
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
                        ]
                          .join(" ")
                          .trim()}
                        placeholder="E.g. 50"
                        value={participants}
                        onChange={(e) => setParticipants(e.target.value)}
                      />
                    </div>

                    <div className="fields-section-add-programs">
                      <p>
                        Number of Volunteers<span className="required">*</span>
                      </p>
                      <input
                        type="number"
                        min={1}
                        className={[
                          "add-programs-input-field",
                          errors.volunteers ? "input-error" : "",
                          shake.volunteers ? "shake" : "",
                        ]
                          .join(" ")
                          .trim()}
                        placeholder="E.g. 50"
                        value={volunteers}
                        onChange={(e) => setVolunteers(e.target.value)}
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
                        ]
                          .join(" ")
                          .trim()}
                        value={eligibleParticipants}
                        onChange={(e) => setEligibleParticipants(e.target.value)}
                      >
                        <option value="">Select requirement</option>
                        <option value="resident">Resident</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                    {/* Age Restriction */}
                    <div className="fields-section-add-programs">
                      <p>
                        Age Restriction<span className="required">*</span>
                      </p>

                      <label className="flex-center-gap-addprogram">
                        <input
                          type="checkbox"
                          checked={noAgeLimit}
                          onChange={(e) => {
                            setNoAgeLimit(e.target.checked);
                            if (e.target.checked) {
                              setAgeMin("");
                              setAgeMax("");
                              setErrors((prev) => {
                                const { ageMin, ageMax, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                        />
                        <span>No age limit</span>
                      </label>

                      <div className="grid-2col-gap-addprogram">
                        <input
                          type="number"
                          min={0}
                          placeholder="Min age"
                          className={[
                            "add-programs-input-field",
                            errors.ageMin ? "input-error" : "",
                            shake.ageMin ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          value={ageMin}
                          onChange={(e) => setAgeMin(e.target.value)}
                          disabled={noAgeLimit}
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Max age"
                          className={[
                            "add-programs-input-field",
                            errors.ageMax ? "input-error" : "",
                            shake.ageMax ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
                          value={ageMax}
                          onChange={(e) => setAgeMax(e.target.value)}
                          disabled={noAgeLimit}
                        />
                      </div>

                      {!noAgeLimit && (errors.ageMin || errors.ageMax) && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#b91c1c" }}>
                          Please set a valid age range. Use either min, max, or both. Min must be ≤ max.
                        </div>
                      )}
                    </div>

                    
                  </div>

                  {/* Right column */}
                  <div className="add-programs-content-right-side">
                    <div className="fields-section-add-programs">
                      <p>
                        Partnered Agency<span className="required">*</span>
                      </p>
                      <select
                        className={[
                          "add-programs-input-field",
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
                            "add-programs-input-field",
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
                        />
                      )}
                    </div>

                    <div className="fields-section-add-programs">
                      <p>
                        Event Type<span className="required">*</span>
                      </p>
                      <select
                        className="add-programs-input-field"
                        value={eventType}
                        onChange={(e) =>
                          setEventType(e.target.value as "single" | "multiple")
                        }
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
                          ]
                            .join(" ")
                            .trim()}
                          min={minStartDate}
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
                            ]
                              .join(" ")
                              .trim()}
                            min={minStartDate}
                            value={startDate}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              setStartDate(newStart);
                              if (endDate && new Date(endDate) < new Date(newStart)) {
                                setEndDate(newStart);
                              }
                              if (
                                isSameDay() &&
                                timeStart &&
                                timeEnd &&
                                toMinutes(timeEnd) < toMinutes(timeStart)
                              ) {
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
                            ]
                              .join(" ")
                              .trim()}
                            min={startDate || minStartDate}
                            value={endDate}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              if (startDate && new Date(newEnd) < new Date(startDate)) {
                                setEndDate(startDate);
                              } else {
                                setEndDate(newEnd);
                              }
                              if (
                                isSameDay() &&
                                timeStart &&
                                timeEnd &&
                                toMinutes(timeEnd) < toMinutes(timeStart)
                              ) {
                                setTimeEnd(timeStart);
                              }
                            }}
                          />
                        </div>
                      </>
                    )}

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
                        ]
                          .join(" ")
                          .trim()}
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
                        ]
                          .join(" ")
                          .trim()}
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
                      <div className="title-description-programs">Summary of Program</div>
                      <div className="box-container-summary">
                        <span className="required-asterisk">*</span>
                        <textarea
                          className={[
                            "summary-input-field",
                            errors.summary ? "input-error" : "",
                            shake.summary ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
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
                          placeholder={`Write at least ${MIN_SUMMARY_CHARS} characters...`}
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

                  <div className="programs-description-container">
                    <div className="box-container-outer-description">
                      <div className="title-description-programs">
                        Full Description of Program
                      </div>
                      <div className="box-container-description">
                        <span className="required-asterisk">*</span>
                        <textarea
                          className={[
                            "description-input-field-addprogram",
                            errors.description ? "input-error" : "",
                            shake.description ? "shake" : "",
                          ]
                            .join(" ")
                            .trim()}
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
                          placeholder={`Write at least ${MIN_DESC_CHARS} characters...`}
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
                  </div>
                </div>
              </>
            )}

            {activeSection === "reqs" && (
              <div className="add-programs-requirements-container">
                {/* Predefined fields */}
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
                      <div className="predefined-list-note-programs">
                        * These will be auto-included when saving the program *
                      </div>
                      <ul className="predefined-list-items-programs">
                        {PREDEFINED_REQ_TEXT.length === 0 &&
                          PREDEFINED_REQ_FILES.length === 0 && (
                            <li style={{ opacity: 0.7 }}>
                              No predefined requirements yet.
                            </li>
                          )}

                        {PREDEFINED_REQ_TEXT.map((f, i) => (
                          <li key={`pretext-${i}`} className="predefined-text-programs">
                            {i + 1}. {f.name}{" "}
                            <span className="predefined-type-programs">(text)</span>
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

                {/* Custom text requirements */}
                <div className="box-container-outer-programs-fields">
                  <div className="title-programs-fields">Text Fields</div>

                  <div className="box-container-programs-fields">
                    <div className="instructions-container-programs">
                      <h1>
                        * Enter the text fields needed for the program. No need to input pre-defined
                        fields. FORMAT: sampleField *
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
                          />
                        </div>
                        <div className="row-button-section-programs">
                          <button
                            type="button"
                            className="program-field-add-button"
                            onClick={addReqText}
                          >
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
                                />
                              </div>
                              <div className="row-button-section-programs">
                                <button
                                  type="button"
                                  className="program-field-remove-button"
                                  onClick={() => removeReqText(i)}
                                >
                                  -
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Custom file requirements */}
                <div className="box-container-outer-programs-fields">
                  <div className="title-programs-fields">File Upload Fields</div>

                  <div className="box-container-programs-fields">
                    <div className="instructions-container-programs">
                      <h1>
                        * Enter the file upload fields needed for the program. No need to input
                        pre-defined fields. Tip: use a clear naming convention (e.g.,{" "}
                        <code>validIDjpg</code>, <code>barangayIDjpg</code>, etc.) *
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
                          />
                        </div>
                        <div className="row-button-section-programs">
                          <button
                            type="button"
                            className="program-field-add-button"
                            onClick={addReqFile}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="added-doc-field-container">
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
                                />
                              </div>
                              <div className="row-button-section-programs">
                                <button
                                  type="button"
                                  className="program-field-remove-button"
                                  onClick={() => removeReqFile(i)}
                                >
                                  -
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
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
          <button className="program-yes-button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>


        {showConfirmation && (
            <div className="confirmation-popup-overlay-online-reports">
                             <div className="confirmation-popup-online-reports">
                                 <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup-online-reports" />          
                            <p>Are you sure you want to submit?</p>
                                   <div className="yesno-container-add">
                                 <button onClick={() => setShowConfirmation(false)} className="no-button-add">No</button>
                                     <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                               </div> 
                            </div>
                  </div>
          )}
    </div>
  );
}
