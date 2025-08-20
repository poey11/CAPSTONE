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

/* --- types --- */
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
  participants: number;
  approvalStatus?: "Approved" | "Pending" | "Rejected";
  progressStatus?: "Ongoing" | "Upcoming" | "Completed" | "Rejected";
  activeStatus?: "Active" | "Inactive";
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
      { key: "Volunteer" as Role, title: "Volunteer", description: "Join our community efforts and make a direct impact by volunteering.", icon: <Users className="icon" /> },
      { key: "Participant" as Role, title: "Register", description: "Attend community events and activities to stay engaged and connected.", icon: <Handshake className="icon" /> },
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

  const [approvedCount, setApprovedCount] = useState<number | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastError, setToastError] = useState(false);
  const showToast = (msg: string, isError = false, ms = 1800) => {
    setToastMsg(msg);
    setToastError(isError);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), ms);
  };

  /* load program */
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

      const capQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", snap.id),
        where("approvalStatus", "==", "Approved")
      );
      const cnt = await getCountFromServer(capQ);
      setApprovedCount(cnt.data().count || 0);
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

  /* gates checked on submit */
  const checkEligibility = (): { ok: boolean; msg?: string } => {
    if (!program) return { ok: false, msg: "Program not found." };

    if (
      program.progressStatus === "Rejected" ||
      program.progressStatus === "Completed" ||
      program.activeStatus === "Inactive"
    ) return { ok: false, msg: "Enrollment is closed for this program." };

    const ep = program.eligibleParticipants || "both";
    if (ep === "resident" && !isVerifiedResident)
      return { ok: false, msg: "Only Verified Resident Users can participate." };
    if (ep === "non-resident" && user?.uid)
      return { ok: false, msg: "Only Guest Users can participate. Please log out." };

    if (approvedCount !== null && program.participants !== undefined) {
      if (approvedCount >= Number(program.participants || 0))
        return { ok: false, msg: "Program capacity has been reached." };
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
    const gate = checkEligibility();
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

  const participantsLabel =
    approvedCount !== null ? `${approvedCount}/${program.participants || 0}` : `${program.participants || 0}`;

  // force toast to top-right (in case any CSS elsewhere overrides it)
  const toastPosStyle: React.CSSProperties = { top: "13%", right: 12, left: "auto", bottom: "auto" };

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
        ) : (
          <div className="actions-grid">
            {actions
              .filter((a) => !selectedAction || selectedAction === a.key)
              .map((action, index) => (
                <motion.div
                  key={index}
                  layout
                  className={`action-card ${selectedAction === action.key ? "expanded" : ""}`}
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
                      if (!selectedAction) setSelectedAction(action.key);
                    }}
                  >
                    <div className="icon">{action.icon}</div>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>

                  {selectedAction === action.key && (
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
                        {(program.requirements?.textFields || []).map((f, i) => {
                          const name = f.name;
                          const lower = name.toLowerCase();
                          const type =
                            lower.includes("email") ? "email" :
                            lower.includes("contact") || lower.includes("phone") ? "tel" :
                            "text";
                          const label =
                            name === "firstName" ? "First Name" :
                            name === "lastName" ? "Last Name" :
                            name === "contactNumber" ? "Contact Number" :
                            name === "emailAddress" ? "Email Address" :
                            name === "location" ? "Location" :
                            name;
                          return (
                            <div className="form-group-specific" key={`tf-${i}`}>
                              <label className="form-label-specific">
                                {label} <span className="required">*</span>
                              </label>
                              <input
                                type={type}
                                className="form-input-specific"
                                required
                                value={formData[name] || ""}
                                onChange={(e) => onTextChange(name, e.target.value)}
                                placeholder={`Enter ${label}`}
                              />
                            </div>
                          );
                        })}

                        {(program.requirements?.fileFields || []).map((f, i) => (
                          <div className="form-group-specific" key={`ff-${i}`}>
                            <label className="form-label-specific">
                              {f.name} <span className="required">*</span>
                            </label>
                            <input
                              type="file"
                              accept="image/*,application/pdf,.pdf"
                              className="form-input-specific"
                              required
                              onChange={(e) => onFileChange(f.name, e.currentTarget)}
                            />
                          </div>
                        ))}

                        <button type="submit" className="register-button-specific">
                          {action.key === "Volunteer" ? "Submit Volunteer Form" : "Submit Registration"}
                        </button>
                      </motion.form>
                    </AnimatePresence>
                  )}
                </motion.div>
              ))}
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
