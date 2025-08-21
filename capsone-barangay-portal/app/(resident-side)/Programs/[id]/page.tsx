"use client";
import "@/CSS/Programs/SpecificProgram.css";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Handshake } from "lucide-react";
import { useAuth } from "@/app/context/authContext";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db, storage } from "@/app/db/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/* --- schedule formatting --- */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function formatYMDToLong(ymd?: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function formatHHmmTo12h(hhmm?: string): string {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")}${period}`;
}

function buildScheduleParts(p: {
  eventType?: "single" | "multiple";
  startDate?: string;
  endDate?: string;
  timeStart?: string;
  timeEnd?: string;
}) {
  const startLong = formatYMDToLong(p.startDate);
  const endLong   = formatYMDToLong(p.endDate);
  const timeStart = formatHHmmTo12h(p.timeStart);
  const timeEnd   = formatHHmmTo12h(p.timeEnd);

  const timePart =
    timeStart || timeEnd
      ? `${timeStart || ""}${timeStart && timeEnd ? " - " : ""}${timeEnd || ""}`
      : "";

  const sameDay = p.startDate && p.endDate && p.startDate === p.endDate;
  const datePart =
    p.eventType === "single" || sameDay ? startLong : `${startLong} - ${endLong}`;

  return { datePart, timePart };
}

/* --- file validation (image or pdf) --- */
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tiff", ".svg"];
const isImageMime = (t: string) => t.startsWith("image/");
const isPdfMime = (t: string) => t === "application/pdf";
const hasAllowedExt = (name: string) => {
  const n = name.toLowerCase();
  return n.endsWith(".pdf") || IMAGE_EXTS.some((e) => n.endsWith(e));
};
const detectContentType = (f: File) => {
  if (f.type && (isImageMime(f.type) || isPdfMime(f.type))) return f.type;
  if (f.name.toLowerCase().endsWith(".pdf")) return "application/pdf";
  return "image/*";
};
const isAllowedFile = (f: File) => {
  if (!f) return false;
  if (f.type) return isImageMime(f.type) || isPdfMime(f.type);
  return hasAllowedExt(f.name);
};

/* --- types + predefined volunteer fields --- */
type SimpleField = { name: string; description?: string };

const PRETTY_LABELS: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
};

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

type Program = {
  id: string;
  programName: string;
  summary?: string;
  description?: string;
  eventType?: "single" | "multiple";
  startDate?: string;
  endDate?: string;
  timeStart?: string;
  timeEnd?: string;
  location?: string;
  /** Max participants (attendees). */
  participants?: number;
  /** Separate max volunteers; if missing or 0, volunteer card should NOT show. */
  volunteers?: number;
  approvalStatus?: "Approved" | "Pending" | "Rejected";
  progressStatus?: "Ongoing" | "Upcoming" | "Completed" | "Rejected";
  activeStatus?: "Active" | "Inactive";
  /** Who is allowed to join at all (for both roles). */
  eligibleParticipants?: "resident" | "non-resident" | "both";
  photoURL?: string | null;
  photoURLs?: string[];
  requirements?: {
    textFields?: { name: string }[];
    fileFields?: { name: string }[];
  };
};

type Role = "Volunteer" | "Participant";

/* --- page --- */
export default function SpecificProgram() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth(); // user?.uid if logged in

  const actions = useMemo(
    () => [
      {
        key: "Volunteer" as Role,
        title: "Volunteer",
        description: "Join our community efforts and make a direct impact by volunteering.",
        icon: <Users className="icon" />,
      },
      {
        key: "Participant" as Role,
        title: "Register",
        description: "Attend community events and activities to stay engaged and connected.",
        icon: <Handshake className="icon" />,
      },
    ],
    []
  );

  const [program, setProgram] = useState<Program | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAction, setSelectedAction] = useState<Role | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  const [isVerifiedResident, setIsVerifiedResident] = useState(false);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // role-specific approved counts (init to 0 so labels are always numeric)
  const [approvedParticipantCount, setApprovedParticipantCount] = useState<number>(0);
  const [approvedVolunteerCount, setApprovedVolunteerCount] = useState<number>(0);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastError, setToastError] = useState(false);
  const showToast = (msg: string, isError = false, ms = 1800) => {
    setToastMsg(msg);
    setToastError(isError);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), ms);
  };

  /* load program + images + role counts */
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "Programs", id as string));
      if (!snap.exists()) return setProgram(null);
      const p = { id: snap.id, ...snap.data() } as Program;
      setProgram(p);

      const fromQuery = searchParams.getAll("image");
      const img =
        (p.photoURLs && p.photoURLs.length > 0) ? p.photoURLs :
        (p.photoURL ? [p.photoURL] : fromQuery);
      setImages(img || []);

      // fetch role-specific approved counts
      const base = collection(db, "ProgramsParticipants");
      const [pCnt, vCnt] = await Promise.all([
        getCountFromServer(
          query(
            base,
            where("programId", "==", snap.id),
            where("approvalStatus", "==", "Approved"),
            where("role", "==", "Participant")
          )
        ),
        getCountFromServer(
          query(
            base,
            where("programId", "==", snap.id),
            where("approvalStatus", "==", "Approved"),
            where("role", "==", "Volunteer")
          )
        ),
      ]);
      setApprovedParticipantCount(pCnt.data().count || 0);
      setApprovedVolunteerCount(vCnt.data().count || 0);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* slideshow */
  useEffect(() => {
    if (!images.length) return;
    const t = setInterval(() => setCurrentSlide((s) => (s + 1) % images.length), 6000);
    return () => clearInterval(t);
  }, [images]);

  /* autofill for verified resident (mirrors your Services flow) */
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setIsVerifiedResident(false);
        setResidentId(null);
        setAlreadyRegistered(false);
        return;
      }

      const userDocRef = doc(db, "ResidentUsers", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const u: any = userDocSnap.data();
      const verified = u.status === "Verified";
      const rId: string | null = u.residentId || null;

      setIsVerifiedResident(Boolean(verified && rId));
      setResidentId(rId);

      if (verified && rId) {
        const resRef = doc(db, "Residents", rId);
        const resSnap = await getDoc(resRef);
        if (!resSnap.exists()) return;
        const rd: any = resSnap.data();
        const fullName = `${rd.firstName || ""} ${rd.middleName || ""} ${rd.lastName || ""}`.replace(/\s+/g, " ").trim();

        setFormData((prev) => ({
          ...prev,
          firstName: rd.firstName || prev.firstName || "",
          lastName: rd.lastName || prev.lastName || "",
          contactNumber: rd.contactNumber || prev.contactNumber || "",
          emailAddress: u.email || prev.emailAddress || "",
          location: rd.address || prev.location || "",
          fullName: fullName || prev.fullName || "",
        }));
      } else {
        const fullName = `${u.first_name || ""} ${u.middle_name || ""} ${u.last_name || ""}`.replace(/\s+/g, " ").trim();
        setFormData((prev) => ({
          ...prev,
          firstName: u.first_name || prev.firstName || "",
          lastName: u.last_name || prev.lastName || "",
          contactNumber: u.phone || prev.contactNumber || "",
          emailAddress: u.email || prev.emailAddress || "",
          location: u.address || prev.location || "",
          fullName: fullName || prev.fullName || "",
        }));
      }
    };
    fetchUserData();
  }, [user]);

  /* check duplicate for verified residents and this program */
  useEffect(() => {
    const checkDup = async () => {
      if (!program?.id || !residentId) {
        setAlreadyRegistered(false);
        return;
      }
      const dupQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", program.id),
        where("residentId", "==", residentId)
      );
      const snap = await getDocs(dupQ);
      setAlreadyRegistered(!snap.empty);
    };
    checkDup();
  }, [program?.id, residentId]);

  /* form handlers */
  const onTextChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const onFileChange = (field: string, inputEl: HTMLInputElement) => {
    const f = inputEl.files?.[0] || null;
    if (!f) return;
    if (!isAllowedFile(f)) {
      showToast("Only image files or PDF are allowed.", true);
      inputEl.value = "";
      return;
    }
    setFiles((p) => ({ ...p, [field]: f }));
  };

  /* role + capacity helpers (single source of truth) */
  const maxParticipants = Number(program?.participants ?? 0);
  const volunteersCap   = Number(program?.volunteers ?? 0);
  const hasVolunteerCap = volunteersCap > 0;

  const capacityReached = (role: Role) => {
    if (!program) return false;
    if (role === "Participant") {
      if (maxParticipants <= 0) return true; // treat 0/undefined as closed
      return approvedParticipantCount >= maxParticipants;
    }
    // Volunteer
    if (volunteersCap <= 0) return true;
    return approvedVolunteerCount >= volunteersCap;
  };

  const capacityMessage = (role: Role) =>
    role === "Participant"
      ? "Max limit of participants has been reached!"
      : "Max limit of volunteers has been reached!";

  /* audience gating
     - guests and non-verified logged-in users are treated as NON-RESIDENTS
     - only verified resident counts as resident
  */
  const ep = program?.eligibleParticipants || "both";
  const isGuest = !user?.uid;
  const isResident = isVerifiedResident;
  const isNonResident = !isResident; // includes guests + non-verified logged-in users

  const userAllowedAtAll =
    ep === "both" ||
    (ep === "resident" && isResident) ||
    (ep === "non-resident" && isNonResident);

  const canShowParticipantCard =
    userAllowedAtAll &&
    ((ep === "resident" && isResident) ||
      (ep === "non-resident" && isNonResident) ||
      ep === "both");

  const canShowVolunteerCard =
    userAllowedAtAll &&
    isResident && // volunteers require verified resident
    (ep === "resident" || ep === "both") &&
    hasVolunteerCap; // hide entirely if 0 or missing

  /* submit (role-aware) */
  const checkEligibilityForRole = (role: Role): { ok: boolean; msg?: string } => {
    if (!program) return { ok: false, msg: "Program not found." };

    if (
      program.progressStatus === "Rejected" ||
      program.progressStatus === "Completed" ||
      program.activeStatus === "Inactive"
    ) {
      return { ok: false, msg: "Enrollment is closed for this program." };
    }

    // global audience gate applies to both roles with our resident/non-resident logic
    if (!userAllowedAtAll) {
      return {
        ok: false,
        msg:
          ep === "resident"
            ? "Only Verified Resident Users can participate."
            : "This program is for non-residents only.",
      };
    }

    // role-specific rules
    if (role === "Volunteer") {
      if (!isResident) return { ok: false, msg: "Only Verified Resident Users can volunteer." };
      if (!hasVolunteerCap) return { ok: false, msg: "Volunteering is not available for this program." };
    }

    if (capacityReached(role)) {
      return { ok: false, msg: capacityMessage(role) };
    }

    return { ok: true };
  };

  const uploadAllFiles = async (programId: string, uidOrGuest: string) => {
    const urls: Record<string, string> = {};
    for (const key of Object.keys(files)) {
      const f = files[key];
      const sref = ref(
        storage,
        `Programs/${programId}/participantUploads/${uidOrGuest}/${Date.now()}-${key}-${f.name}`
      );
      await uploadBytes(sref, f, { contentType: detectContentType(f) });
      urls[key] = await getDownloadURL(sref);
    }
    return urls;
  };

  const handleSubmit = async (role: Role) => {
    if (!program) return;
    const gate = checkEligibilityForRole(role);
    if (!gate.ok) return showToast(gate.msg || "Not eligible.", true);

    if (residentId && alreadyRegistered) {
      return showToast("You are already enlisted in this program.", true);
    }

    const uidOrGuest = user?.uid || "guest";
    const uploadedFiles = await uploadAllFiles(program.id, uidOrGuest);

    try {
      await addDoc(collection(db, "ProgramsParticipants"), {
        programId: program.id,
        programName: program.programName,
        residentId: residentId || null,
        role, // Volunteer | Participant
        approvalStatus: "Pending",
        addedVia: user?.uid ? "resident-form" : "guest-form",
        createdAt: serverTimestamp(),
        fullName:
          formData.fullName ||
          `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        contactNumber: formData.contactNumber || "",
        emailAddress: formData.emailAddress || "",
        location: formData.location || "",
        fields: formData,
        files: uploadedFiles,
      });

      showToast(`You have successfully registered as a ${role.toLowerCase()}!`);
      setSelectedAction(null);
      setFiles({});
    } catch {
      showToast("Something went wrong. Please try again.", true);
    }
  };

  if (!program) {
    return (
      <main className="main-container-specific">
        <div className="headerpic-specific"><p>PROGRAMS</p></div>
        <section className="programs-header-specific">
          <h1 className="programs-title-specific">Program not found</h1>
        </section>
      </main>
    );
  }

  const { datePart, timePart } = buildScheduleParts({
    eventType: program.eventType,
    startDate: program.startDate,
    endDate: program.endDate,
    timeStart: program.timeStart,
    timeEnd: program.timeEnd,
  });

  // Numeric, role-aware labels (always show numbers)
  const participantsLabel = `${approvedParticipantCount}/${Math.max(0, maxParticipants)}`;
  const volunteersLabel   = hasVolunteerCap ? `${approvedVolunteerCount}/${volunteersCap}` : "";

  // force toast to top-right (in case CSS elsewhere overrides it)
  const toastPosStyle: React.CSSProperties = { top: "13%", right: 12, left: "auto", bottom: "auto" };

  // derive which cards to show based on audience + verification + volunteer cap
  const visibleActions = actions.filter((a) =>
    a.key === "Participant" ? canShowParticipantCard : canShowVolunteerCard
  );

  // If user can't join at all due to audience restrictions, show a single notice
  const audienceBlockedMsg =
    !userAllowedAtAll
      ? (ep === "resident"
          ? "Only Verified Resident Users can participate."
          : "This program is for non-residents only.")
      : "";

  return (
    <main className="main-container-specific">
      <div className="headerpic-specific">
        <p>PROGRAMS</p>
      </div>

      {/* Title + Description */}
      <section className="programs-header-specific">
        <h1 className="programs-title-specific">{program.programName}</h1>
        <div className="programs-underline-specific"></div>

        {/* Slideshow */}
        <div className="slideshow-container-specific">
          {images.length > 0 && (
            <div className="slideshow-specific">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Slide ${index + 1}`}
                  className={`slideshow-image-specific ${index === currentSlide ? "active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="programs-description-specific">
          {program.description || program.summary}
        </p>

        {/* Details */}
        <div className="programs-details-specific">
          <div className="program-detail-card-specific">
            <h3>Schedule</h3>
            <p>
              {datePart}
              {timePart && (<><br />{timePart}</>)}
            </p>
          </div>

          <div className="program-detail-card-specific">
            <h3>Location</h3>
            <p>{program.location || ""}</p>
          </div>

          <div className="program-detail-card-specific">
            <h3>Participants</h3>
            <p>{participantsLabel}</p>
          </div>

          {hasVolunteerCap && (
            <div className="program-detail-card-specific">
              <h3>Volunteers</h3>
              <p>{volunteersLabel}</p>
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <section className="get-involved">
        <h2 className="section-title">Get Involved</h2>
        <div className="programs-underline-specific"></div>

        {isVerifiedResident && alreadyRegistered ? (
          <div className="program-detail-card-specific" style={{ margin: "0 auto" }}>
            <h3>Status</h3>
            <p>You have already registered for this event! Please wait for further instructions.</p>
          </div>
        ) : audienceBlockedMsg ? (
          <div className="program-detail-card-specific" style={{ margin: "0 auto" }}>
            <h3>Notice</h3>
            <p>{audienceBlockedMsg}</p>
          </div>
        ) : (
          <div className="actions-grid">
            {visibleActions
              .filter((a) => !selectedAction || selectedAction === a.key)
              .map((action, index) => {
                const reached = capacityReached(action.key);
                const disabledReason = reached ? capacityMessage(action.key) : "";

                // choose fields depending on role
                const textFields: SimpleField[] =
                  action.key === "Volunteer"
                    ? PREDEFINED_REQ_TEXT
                    : (program.requirements?.textFields || []);

                const fileFields: SimpleField[] =
                  action.key === "Volunteer"
                    ? PREDEFINED_REQ_FILES
                    : (program.requirements?.fileFields || []);

                const labelFor = (name: string) => PRETTY_LABELS[name] || name;

                return (
                  <motion.div
                    key={index}
                    layout
                    className={`action-card ${selectedAction === action.key ? "expanded" : ""} ${reached ? "disabled" : ""}`}
                  >
                    {selectedAction === action.key && (
                      <img
                        src="/images/left-arrow.png"
                        alt="Left Arrow"
                        className="back-btn"
                        onClick={() => setSelectedAction(null)}
                      />
                    )}

                    <div
                      className="card-content-wrapper"
                      onClick={() => {
                        if (!selectedAction && !reached) setSelectedAction(action.key);
                      }}
                      style={reached ? { cursor: "not-allowed", opacity: 0.75 } : undefined}
                    >
                      <div className="icon">{action.icon}</div>
                      <h3>{action.title}</h3>
                      <p>{reached ? disabledReason : action.description}</p>
                    </div>

                    {!reached && selectedAction === action.key && (
                      <AnimatePresence>
                        <motion.form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(action.key);
                          }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.4 }}
                          className="register-form-specific"
                        >
                          {textFields.map((f, i) => {
                            const name = f.name;
                            const lower = name.toLowerCase();
                            const type =
                              lower.includes("email") ? "email" :
                              lower.includes("contact") || lower.includes("phone") ? "tel" :
                              "text";
                            
                              // Format: capitalize first + add space before uppercase letters
                              const formattedLabel = name
                                // 1. Remove "jpg" or other extensions at the end
                                .replace(/jpg$/i, "")
                                .replace(/jpeg$/i, "")
                                .replace(/png$/i, "")
                                .replace(/pdf$/i, "")
                                // 2. Insert spaces correctly
                                .replace(/([a-z])([A-Z])/g, "$1 $2")
                                .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
                                // 3. Capitalize first letter
                                .replace(/^./, (s) => s.toUpperCase())
                                // 4. Ensure "Id" → "ID"
                                .replace(/\bId\b/g, "ID");

                            return (
                              <div className="form-group-specific" key={`tf-${i}`}>
                                <label className="form-label-specific">
                                  {formattedLabel} <span className="required">*</span>
                                </label>
                                <input
                                  type={type}
                                  className="form-input-specific"
                                  required
                                  value={formData[name] || ""}
                                  onChange={(e) => onTextChange(name, e.target.value)}
                                  placeholder={`Enter ${formattedLabel}`}
                                />
                              </div>
                            );
                          })}

                          {fileFields.map((f, i) => {
                            const label = f.name
                            // 1. Remove "jpg" or other extensions at the end
                            .replace(/jpg$/i, "")
                            .replace(/jpeg$/i, "")
                            .replace(/png$/i, "")
                            .replace(/pdf$/i, "")
                            // 2. Insert spaces correctly
                            .replace(/([a-z])([A-Z])/g, "$1 $2")
                            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
                            // 3. Capitalize first letter
                            .replace(/^./, (s) => s.toUpperCase())
                            // 4. Ensure "Id" → "ID"
                            .replace(/\bId\b/g, "ID");

                            return (
                              <div className="form-group-specific" key={`ff-${i}`}>
                                <label className="form-label-specific">
                                  {label} <span className="required">*</span>
                                </label>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf,.pdf"
                                  className="form-input-specific"
                                  required
                                  onChange={(e) => onFileChange(f.name, e.currentTarget)}
                                />
                              </div>
                            );
                          })}

                          <button type="submit" className="register-button-specific">
                            {action.key === "Volunteer" ? "Submit Volunteer Form" : "Submit Registration"}
                          </button>
                        </motion.form>
                      </AnimatePresence>
                    )}
                  </motion.div>
                );
              })}
          </div>
        )}
      </section>

      {/* Toast (fixed to top-right) */}
      {toastVisible && (
        <div
          className={`popup-overlay-program show${toastError ? " error" : ""}`}
          style={{
            ...toastPosStyle,
            ...(toastError ? { background: "#ad3b3b", borderLeft: "10px solid #7e2929" } : {}),
          }}
        >
          <div className="popup-program">
            <img
              src={toastError ? "/Images/warning-1.png" : "/Images/check.png"}
              alt="icon alert"
              className="icon-alert"
            />
            <p>{toastMsg}</p>
          </div>
        </div>
      )}
    </main>
  );
}
