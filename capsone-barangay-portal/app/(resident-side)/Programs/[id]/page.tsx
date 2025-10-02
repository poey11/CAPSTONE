"use client";
import "@/CSS/Programs/SpecificProgram.css";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter} from "next/navigation";
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

// Age helpers
function computeAgeFromDOB(dobYMD: string): number | null {
  if (!dobYMD || !/^\d{4}-\d{2}-\d{2}$/.test(dobYMD)) return null;
  const [y, m, d] = dobYMD.split("-").map(Number);
  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const mDiff = now.getMonth() - dob.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 && age <= 200 ? age : null;
}

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

type SimpleField = { name: string; description?: string };

const PRETTY_LABELS: Record<string, string> = {
  dayChosen: "Chosen Day",
  firstName: "First Name",
  lastName: "Last Name",
  contactNumber: "Contact Number",
  emailAddress: "Email Address",
  location: "Location",
  validIDjpg: "Valid ID",
  dateOfBirth: "Date of Birth",
};

// Fields used for VOLUNTEER form (we need DOB here to enforce 17+)
const PREDEFINED_REQ_TEXT: SimpleField[] = [
  { name: "firstName" },
  { name: "lastName" },
  { name: "contactNumber" },
  { name: "emailAddress" },
  { name: "location" },
  { name: "dateOfBirth" }, // DOB required for volunteers
];

const PREDEFINED_REQ_FILES: SimpleField[] = [
  { name: "validIDjpg" },
];

type AgeRestriction = {
  noAgeLimit?: boolean;
  minAge?: number | null;
  maxAge?: number | null;
};

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
  participants?: number;
  volunteers?: number;
  approvalStatus?: "Approved" | "Pending" | "Rejected";
  progressStatus?: "Ongoing" | "Upcoming" | "Completed" | "Rejected";
  activeStatus?: "Active" | "Inactive";
  eligibleParticipants?: "resident" | "non-resident" | "both";
  photoURL?: string | null;
  photoURLs?: string[];
  noParticipantLimit?: boolean;
  particapantDays?: number[];
  noParticipantLimitList?: boolean[];
  approvedParticipantCountList?: number[];
  requirements?: {
    textFields?: { name: string }[];
    fileFields?: { name: string }[];
  };
  ageRestriction?: AgeRestriction; // used for PARTICIPANTS only
};

type Role = "Volunteer" | "Participant";

type Preview = { url: string; isPdf: boolean; isObjectUrl: boolean };

export default function SpecificProgram() {

const router = useRouter();


  const { id } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

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
  const [dayChosen, setDayChosen] = useState<number | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAction, setSelectedAction] = useState<Role | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  // previews for chosen files
  const [filePreviews, setFilePreviews] = useState<Record<string, Preview>>({});
  const previewsRef = useRef<Record<string, Preview>>({});

  const [isVerifiedResident, setIsVerifiedResident] = useState(false);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // role-specific approved counts
  const [approvedParticipantCount, setApprovedParticipantCount] = useState<number>(0);
  const [approvedParticipantCountList, setApprovedParticipantCountList] = useState<number[]>([]);

  const [approvedVolunteerCount, setApprovedVolunteerCount] = useState<number>(0);

  // prefilled ID for verified users
  const [preVerifiedIdUrl, setPreVerifiedIdUrl] = useState<string | null>(null);

  //Popups
    const [showSubmitPopup, setShowSubmitPopup] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastError, setToastError] = useState(false);
  const showToast = (msg: string, isError = false, ms = 1800) => {
    setToastMsg(msg);
    setToastError(isError);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), ms);
  };

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
      if(p.eventType === "multiple"){
        const counts: number[] = [];
        if(p.particapantDays && p.particapantDays.length > 0){
          for (let index = 0; index < p.particapantDays.length; index++) {
            const c = await getCountFromServer(
              query(
                base,
                where("programId", "==", snap.id),
                where("approvalStatus", "==", "Approved"),
                where("role", "==", "Participant"),
                where("dayChosen", "==", index)
              )
            );
            counts.push(c.data().count || 0);
          }
          setApprovedParticipantCountList(counts);
        };
      }
      setApprovedParticipantCount(pCnt.data().count || 0);
      setApprovedVolunteerCount(vCnt.data().count || 0);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    if (!images.length) return;
    const t = setInterval(() => setCurrentSlide((s) => (s + 1) % images.length), 6000);
    return () => clearInterval(t);
  }, [images]);

  // try to prefill user info
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setIsVerifiedResident(false);
        setResidentId(null);
        setAlreadyRegistered(false);
        setPreVerifiedIdUrl(null);
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

      let candidateUrl: string | null = null;
      const userUrls: unknown = u?.verificationFilesURLs;
      if (Array.isArray(userUrls) && userUrls.length > 0 && typeof userUrls[0] === "string") {
        candidateUrl = userUrls[0] as string;
      }

      if (verified && rId) {
        const resRef = doc(db, "Residents", rId);
        const resSnap = await getDoc(resRef);
        if (resSnap.exists()) {
          const rd: any = resSnap.data();

          const resUrls: unknown = rd?.verificationFilesURLs;
          if (Array.isArray(resUrls) && resUrls.length > 0 && typeof resUrls[0] === "string") {
            candidateUrl = (resUrls[0] as string) || candidateUrl;
          }

          const fullName = `${rd.firstName || ""} ${rd.middleName || ""} ${rd.lastName || ""}`
            .replace(/\s+/g, " ")
            .trim();

          setFormData((prev) => ({
            ...prev,
            firstName: rd.firstName || prev.firstName || "",
            lastName: rd.lastName || prev.lastName || "",
            contactNumber: rd.contactNumber || prev.contactNumber || "",
            emailAddress: u.email || prev.emailAddress || "",
            location: rd.address || prev.location || "",
            fullName: fullName || prev.fullName || "",
            dateOfBirth: rd.dateOfBirth || prev.dateOfBirth || "",
          }));
        } else {
          const fullName = `${u.first_name || ""} ${u.middle_name || ""} ${u.last_name || ""}`
            .replace(/\s+/g, " ")
            .trim();
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
      } else {
        const fullName = `${u.first_name || ""} ${u.middle_name || ""} ${u.last_name || ""}`
          .replace(/\s+/g, " ")
          .trim();
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

      setPreVerifiedIdUrl(candidateUrl || null);
    };
    fetchUserData();
  }, [user]);

  // check duplicate
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
      if(snap?.docs[0]?.data().attendance === false){
        setAlreadyRegistered(false);
      }
      const participantData = snap.docs[0].data();
      const attendance = participantData.attendance;
      const dayChosen = participantData.dayChosen; // assuming you store this
      const startDate = new Date(program.startDate || "");
      const chosenDate = new Date(startDate);
      chosenDate.setDate(startDate.getDate() + (dayChosen ?? 0));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      chosenDate.setHours(0, 0, 0, 0);

      if (program.eventType === "multiple") {
        if (attendance === false && chosenDate < today) {
          // ✅ absent + day already passed → allow re-register
          setAlreadyRegistered(false);
        } else if (attendance === true) {
          // ✅ present → block
          setAlreadyRegistered(true);
        } else {
          // still future or undecided → block
          setAlreadyRegistered(true);
        }
      } else {
        // single-day → any registration blocks
        setAlreadyRegistered(true);
      }


    };
    checkDup();
  }, [program?.id, residentId]);
  

  // form handlers
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

    setFilePreviews((prev) => {
      const next = { ...prev };
      const old = prev[field];
      if (old?.isObjectUrl) URL.revokeObjectURL(old.url);

      const url = URL.createObjectURL(f);
      const isPdf = (f.type || "").toLowerCase().includes("pdf") || f.name.toLowerCase().endsWith(".pdf");
      next[field] = { url, isPdf, isObjectUrl: true };
      previewsRef.current = next;
      return next;
    });
  };

  // revoke object URLs on unmount
  useEffect(() => {
    return () => {
      for (const pv of Object.values(previewsRef.current)) {
        if (pv.isObjectUrl) URL.revokeObjectURL(pv.url);
      }
    };
  }, []);

  // capacity
  const maxParticipants = Number(program?.participants ?? 0);
  const volunteersCap   = Number(program?.volunteers ?? 0);
  const hasVolunteerCap = volunteersCap > 0;

  const capacityReached = (role: Role, index?:number) => {
    if (!program) return false;
    if (role === "Participant") {
      if(program.eventType === "single"){
        if (maxParticipants <= 0) return true;
        return approvedParticipantCount >= maxParticipants;
      }
      if(program.eventType === "multiple" && index !== undefined && program.approvedParticipantCountList){
        const dayLimit = program.noParticipantLimitList && program.noParticipantLimitList[index] ? 0 : (program.particapantDays && program.particapantDays[index]) ? program.particapantDays[index] : 0;
        const approvedCountForDay = approvedParticipantCountList && approvedParticipantCountList[index] ? approvedParticipantCountList[index] : 0;
        if (dayLimit <= 0) return true;
        return approvedCountForDay >= dayLimit;
      }
    }
    if (volunteersCap <= 0) return true;
    return approvedVolunteerCount >= volunteersCap;
  };
  console.log(program)
  const capacityMessage = (role: Role) =>
    role === "Participant"
      ? "Max limit of participants has been reached!"
      : "Max limit of volunteers has been reached!";
    

  // audience gating
  const ep = program?.eligibleParticipants || "both";
  const { user: authUser } = useAuth();
  const isGuest = !authUser?.uid;
  const isResident = isVerifiedResident;
  const isNonResident = !isResident;

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
    isResident &&
    (ep === "resident" || ep === "both") &&
    hasVolunteerCap;

  // derived age
  const userDOB = formData.dateOfBirth || "";
  const userAge = useMemo(() => computeAgeFromDOB(userDOB), [userDOB]);

  // helper: build participant age limit text from program.ageRestriction
const participantAgeLimitText = useMemo(() => {
  const ar = program?.ageRestriction;
  if (!ar || ar.noAgeLimit) return null;

  const min = ar.minAge ?? null;
  const max = ar.maxAge ?? null;
  const nilOrZero = (v: number | null | undefined) => v == null || v === 0;

  // Treat null or 0 as "no limit"
  if (nilOrZero(min) && nilOrZero(max)) return null;

  if (!nilOrZero(min) && !nilOrZero(max)) return `${min}-${max}`;
  if (!nilOrZero(min)) return `${min}+`;
  if (!nilOrZero(max)) return `≤ ${max}`;
  return null;
}, [program?.ageRestriction]);

  // age eligibility check (role-aware)
  const checkAgeEligibility = (role: Role): { ok: boolean; msg?: string } => {
    if (role === "Volunteer") {
      // volunteers: fixed 17+
      if (!userDOB) return { ok: false, msg: "Please enter your Date of Birth." };
      const age = userAge;
      if (age == null) return { ok: false, msg: "Invalid Date of Birth." };
      if (age < 17) return { ok: false, msg: "Volunteers must be at least 17 years old." };
      return { ok: true };
    }

    // participants: follow program.ageRestriction (if any)
    const ar = program?.ageRestriction;
    if (!ar || ar.noAgeLimit) return { ok: true }; // no age restriction
    if (!userDOB) return { ok: false, msg: "Please enter your Date of Birth." };
    const age = userAge;
    if (age == null) return { ok: false, msg: "Invalid Date of Birth." };
    if (ar.minAge != null && age < ar.minAge) {
      return { ok: false, msg: `Minimum age is ${ar.minAge}.` };
    }
    if (ar.maxAge != null && age > ar.maxAge) {
      return { ok: false, msg: `Maximum age is ${ar.maxAge}.` };
    }
    return { ok: true };
  };

  // submit (role-aware)
  const checkEligibilityForRole = (role: Role): { ok: boolean; msg?: string } => {
    if (!program) return { ok: false };

    if (
      program.progressStatus === "Rejected" ||
      program.progressStatus === "Completed" ||
      program.activeStatus === "Inactive"
    ) {
      return { ok: false, msg: "Enrollment is closed for this program." };
    }

    if (!userAllowedAtAll) {
      return {
        ok: false,
        msg:
          ep === "resident"
            ? "Only Verified Resident Users can participate."
            : "This program is for non-residents only.",
      };
    }

    if (role === "Volunteer") {
      if (!isResident) return { ok: false, msg: "Only Verified Resident Users can volunteer." };
      if (!hasVolunteerCap) return { ok: false, msg: "Volunteering is not available for this program." };
    }

    if (capacityReached(role)) {
      return { ok: false, msg: capacityMessage(role) };
    }

    // age rule
    const ageGate = checkAgeEligibility(role);
    if (!ageGate.ok) return ageGate;

    return { ok: true };
  };

  const uploadAllFiles = async (
    programId: string,
    uidOrGuest: string,
    prefilled: Record<string, string>
  ) => {
    const urls: Record<string, string> = { ...prefilled };

    for (const key of Object.keys(files)) {
      if (urls[key]) continue;
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

  const prefilled: Record<string, string> = {};
  if (isVerifiedResident && preVerifiedIdUrl) {
    prefilled["validIDjpg"] = preVerifiedIdUrl;
  }

  const uidOrGuest = user?.uid || "guest";
  const uploadedFiles = await uploadAllFiles(program.id, uidOrGuest, prefilled);

  try {
    const registrantName =
      (formData.fullName ||
        `${formData.firstName || ""} ${formData.lastName || ""}`.trim()) || "Unknown";

      const newRegRef = await addDoc(collection(db, "ProgramsParticipants"), {
        programId: program.id,
        programName: program.programName,
        residentId: residentId || null,
        role,
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
        dateOfBirth: formData.dateOfBirth || "",
        age: userAge ?? null,
        fields: formData,
        files: uploadedFiles,
        ...((program.eventType === "multiple" && dayChosen) && {
          dayChosen,
        })
      });

      const roleLabel = role === "Volunteer" ? "volunteer" : "participant";
      await addDoc(collection(db, "BarangayNotifications"), {
        message: `A new ${roleLabel} has registered for ${program.programName}. Name: ${registrantName}.`,
        timestamp: new Date(),
        isRead: false,
        transactionType: "Program Registration",
        recipientRole: "Assistant Secretary",
        participantID: newRegRef.id,
        programID: program.id,
        accID: user?.uid || "",
      });

      if (user?.uid) {
        await addDoc(collection(db, "Notifications"), {
          message: `You have successfully registered as a ${roleLabel} for ${program.programName}. Please wait to be contacted regarding your registration status.`,
          timestamp: new Date(),
          isRead: false,
          transactionType: "Program Registration",
          participantID: newRegRef.id,
          recipientUid: user.uid,
          residentID: residentId || user.uid,
          programId: program.id,             
        });
      }
         router.push("/Programs/Notification");
    } catch {
      showToast("Something went wrong. Please try again.", true);
    }

};





// open popup
const handleSubmitClick = (role: Role) => {
  setPendingRole(role);
  setShowSubmitPopup(true);
};

// confirm from popup
const confirmSubmit = async () => {
  setShowSubmitPopup(false);
  if (pendingRole) {
    await handleSubmit(pendingRole);
    setPendingRole(null);
  }
};




  
  if (!program) {
    return (
      <main className="main-container-specific">
        <div className="headerpic-specific"><p>PROGRAMS</p></div>
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

  // Numeric, role-aware labels
  const volunteersLabel   = hasVolunteerCap ? `${approvedVolunteerCount}/${volunteersCap}` : "";

  // toast position
  const toastPosStyle: React.CSSProperties = { top: "13%", right: 12, left: "auto", bottom: "auto" };

  // which action cards to show
  const visibleActions = actions.filter((a) =>
    a.key === "Participant" ? canShowParticipantCard : canShowVolunteerCard
  );

  // audience block message
  const audienceBlockedMsg =
    !userAllowedAtAll
      ? (ep === "resident"
          ? "Only Verified Resident Users can participate."
          : "This program is for non-residents only.")
      : "";

  // helper to render label
  const renderPrettyLabel = (name: string) => {
    const fromDict = PRETTY_LABELS[name];
    if (fromDict) return fromDict;
    return name
      .replace(/jpg$/i, "")
      .replace(/jpeg$/i, "")
      .replace(/png$/i, "")
      .replace(/pdf$/i, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/^./, (s) => s.toUpperCase())
      .replace(/\bId\b/g, "ID");
  };

  // whether participant DOB should be required (only when program sets an age restriction)
  const participantDOBRequired = !!(program?.ageRestriction && !program.ageRestriction.noAgeLimit);

  return (
    <main className="main-container-specific">
      <div className="headerpic-specific">
        <p>PROGRAMS</p>
      </div>

      <section className="programs-header-specific">
        <h1 className="programs-title-specific">{program.programName}</h1>
        <div className="programs-underline-specific"></div>

        <div className="slideshow-container-specific">
           {images.length > 0 && (
            <>
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

              <div className="slideshow-dots-specific">
                {images.map((_, index) => (
                  <span
                    key={index}
                    className={`dot-specific ${index === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(index)} 
                  ></span>
                ))}
              </div>
            </>
          )}

        </div>

        <p className="programs-description-specific">
          {program.description || program.summary}
        </p>

        <div className="programs-details-specific">
          
          <div className="program-detail-card-specific">
            <h3>Schedule</h3>

              <div className="values">
                <p> {datePart} </p>
                <p> {timePart} </p>
              </div>
          </div>

          <div className="program-detail-card-specific">
            <h3>Location</h3>
              <div className="values">
                 <p>{program.location || ""}</p>
              </div>
           
          </div>

          {program.eventType === "single" ?(
            <>
              <div className="program-detail-card-specific">
                <h3>Participants</h3>
                  <div className="values">
                      <p>{program.noParticipantLimit ? (
                        <>
                          {approvedParticipantCount}
                        </>
                      ):(
                      <>
                        {approvedParticipantCount}/{Math.max(0, maxParticipants)}
                      </>)}</p>
                  </div>
              </div>
            </>
          ):(
          <>
            {program.noParticipantLimitList && program.particapantDays && program.particapantDays.length > 0 && (
              <>
                {program.particapantDays.map((day, index) => {
                  // ✅ calculate date using the actual day offset
                  const start = new Date(program.startDate || "");
                  const date = new Date(start);
                  date.setDate(start.getDate() + (index+1)); 

                  const ymd = date.toISOString().split("T")[0];

                  return (
                    <div className="program-detail-card-specific" key={index}>
                      <h3>
                        Participants (Day {index + 1}) {formatYMDToLong(ymd)}
                      </h3>
                      <div className="values">
                        <p>
                          {program.noParticipantLimitList && program.noParticipantLimitList[index] ? (
                            <>
                              {approvedParticipantCountList && approvedParticipantCountList.length > index
                                ? approvedParticipantCountList[index]
                                : 0}
                            </>
                          ) : (
                            <>
                              {approvedParticipantCountList && approvedParticipantCountList.length > index
                                ? approvedParticipantCountList[index]
                                : 0}
                              /{Math.max(0, day)}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

          </>
          )}
          

          {hasVolunteerCap && (
            <div className="program-detail-card-specific">
              <h3>Volunteers</h3>
              <div className="values">
                 <p>{volunteersLabel}</p>
              </div>
             
            </div>
          )}

          {/* Age Limit box */}
        <div className="program-detail-card-specific">
          <h3>Age Limit</h3>
          <div className="values">
            <span>Volunteers: 17+ years old</span>
            <span>Participants: {participantAgeLimitText ? `${participantAgeLimitText} years old` : "None"}</span>          
            </div>
        </div>

        </div>
      </section>

      <section className="get-involved">
        <h2 className="section-title">Get Involved</h2>
        <div className="programs-underline-specific"></div>
        

        {isVerifiedResident && alreadyRegistered ? (
  <div className="program-detail-card-specific">
    <div className="status-header">
      <img src="/Images/check.png" alt="Registered" className="status-icon" />
      <h3>Status</h3>
    </div>
    <p className="status-message">
      You have already registered for this event. Please wait for further instructions.
    </p>
  </div>
        ) : audienceBlockedMsg ? (
  <div className="program-detail-card-specific">
    <div className="status-header">
      <img src="/Images/prohibition.png" alt="Blocked" className="status-icon" />
      <h3>Notice</h3>
    </div>
    <p className="status-message">{audienceBlockedMsg}</p>
  </div>
        ) : (
          <div className="actions-grid">
            {visibleActions
              .filter((a) => !selectedAction || selectedAction === a.key)
              .map((action, index) => {
                let reached = false;
                if(program.eventType === "multiple" && action.key === "Participant"){
                  if(dayChosen !== null){
                    reached = capacityReached(action.key, dayChosen);
                  }
                  else{
                    reached = false;
                  }
                }
                else{
                  reached = capacityReached(action.key);
                }
                
                let disabledReason = "";
                if(program.eventType ==="single" && program.noParticipantLimit ){
                  reached = false;  
                }
                else{
                  disabledReason = reached ? capacityMessage(action.key) : "";
                }

                // TEXT fields: volunteers use predefined (ensure DOB present); participants use program-defined
                const textFields: SimpleField[] =
                  action.key === "Volunteer"
                    ? PREDEFINED_REQ_TEXT
                    : (program.requirements?.textFields || []);

                // FILE fields: volunteers use predefined; participants use program-defined
                const fileFields: SimpleField[] =
                  action.key === "Volunteer"
                    ? PREDEFINED_REQ_FILES
                    : (program.requirements?.fileFields || []);

                return (
                  <motion.div
                    key={index}
                    layout
                    className={`action-card ${selectedAction === action.key ? "expanded" : ""} ${reached ? "disabled" : ""}`}
                  >
                    {selectedAction === action.key && (
                      <img
                        src="/Images/left-arrow.png"
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
                        ref={formRef}
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSubmitClick(action.key); // show popup first
                        }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.4 }}
                          className="register-form-specific"
                        >
                          {textFields.map((f, i) => {
                            const name = f.name;

                            // Special handling for dateOfBirth: show date input + read-only age.
                            if (name === "dateOfBirth") {
                              const today = new Date();
                              const todayStr = [
                                today.getFullYear(),
                                String(today.getMonth() + 1).padStart(2, "0"),
                                String(today.getDate()).padStart(2, "0"),
                              ].join("-");

                              const ageLabel = "Age";
                              const requireDOB =
                                action.key === "Volunteer" ? true : participantDOBRequired;

                              return (
                                <div className="form-group-specific" key={`tf-dob-${i}`}>
                                  <label className="form-label-specific">
                                    Date of Birth {requireDOB && <span className="required">*</span>}
                                  </label>
                                  <input
                                    type="date"
                                    className="form-input-specific"
                                    required={requireDOB}
                                    max={todayStr}
                                    value={formData.dateOfBirth || ""}
                                    onChange={(e) => onTextChange("dateOfBirth", e.target.value)}
                                  />
                                  <div className="form-group-specific-age">
                                    <label className="form-label-specific">{ageLabel}</label>
                                    <input
                                      type="text"
                                      className="form-input-specific"
                                      value={
                                        formData.dateOfBirth
                                          ? (userAge != null ? `${userAge}` : "")
                                          : ""
                                      }
                                      readOnly
                                      placeholder="Will be computed"
                                    />
                                  </div>
                                </div>
                              );
                            }
                             if (name === "dayChosen") {
                              return (
                                <div className="form-group-specific" key={`tf-day-${i}`}>
                                  <label className="form-label-specific">
                                    {renderPrettyLabel(name)} <span className="required">*</span>
                                  </label>
                                  <select
                                    className="form-input-specific"
                                    required
                                    value={dayChosen || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDayChosen(val === "" ? null : Number(val));
                                    }}

                                  >
                                    <option value="" disabled>
                                      Select a day
                                    </option>
                                    {program.particapantDays?.map((day: number, idx: number) => {
                                    
                                      const startDate = new Date(program.startDate || ""); // e.g. Sept 25
                                      const optionDate = new Date(startDate);
                                      optionDate.setDate(startDate.getDate() + idx);

                                      // ✅ check if optionDate already passed
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0); // ignore time
                                      const isPast = optionDate < today;

                                      return(
                                        <option key={idx} value={idx} disabled={isPast}>
                                          Day {idx + 1} ({optionDate.toDateString()})
                                        </option>
                                    )})}
                                  </select>
                                </div>
                              );
                            }
                            const lower = name?.toLowerCase();
                            const type =
                              lower.includes("email") ? "email" :
                              lower.includes("contact") || lower.includes("phone") ? "tel" :
                              "text";

                            const formattedLabel = renderPrettyLabel(name);
       
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
                            const nmLower = f.name.toLowerCase();
                            const isValidIdField = nmLower === "valididjpg";
                            const usePrefill = isVerifiedResident && !!preVerifiedIdUrl && isValidIdField;

                            const label = renderPrettyLabel(f.name);
                            const preview = filePreviews[f.name];
                            const prefillIsPdf = (preVerifiedIdUrl || "").toLowerCase().endsWith(".pdf");

                            return (
                
                        <div className="form-group-specific" key={`ff-${i}`}>
                          <label className="form-label-specific">
                            {label} <span className="required">*</span>
                          </label>

                          {usePrefill || preview?.url ? (
                            <div className="prefilled-file-notice">
                              {usePrefill ? (
                                <>
                                  {!prefillIsPdf && preVerifiedIdUrl && (
                                    <a
                                      href={preVerifiedIdUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Open ${label} in a new tab`}
                                    >
                                      <img
                                        src={preVerifiedIdUrl}
                                        alt={`${label} preview`}
                                        className="prefilled-file-thumbnail"
                                      />
                                    </a>
                                  )}
                                  <div className="prefilled-file-details">
                                    <div className="prefilled-file-text">
                                      Using your verified ID on file.
                                    </div>
                                    {preVerifiedIdUrl && (
                                      <a
                                        href={preVerifiedIdUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="prefilled-file-link"
                                      >
                                        {prefillIsPdf ? "Open PDF in new tab" : "Open full view"}
                                      </a>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {!preview.isPdf ? (
                                    <a
                                      href={preview.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Open ${label} in a new tab`}
                                    >
                                      <img
                                        src={preview.url}
                                        alt={`${label} preview`}
                                        className="prefilled-file-thumbnail"
                                      />
                                    </a>
                                  ) : null}

                                  <div className="prefilled-file-details">
                                    <div className="prefilled-file-text">
                                      {preview.isPdf ? "Uploaded PDF" : "Uploaded Image"}
                                    </div>
                                    <a
                                      href={preview.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="prefilled-file-link"
                                    >
                                      {preview.isPdf ? "Open PDF in new tab" : "Open full view"}
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept="image/*,application/pdf,.pdf"
                              className="form-input-specific"
                              required
                              onChange={(e) => onFileChange(f.name, e.currentTarget)}
                            />
                          )}
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



         {showSubmitPopup && (
            <div className="confirmation-popup-overlay-online">
                <div className="confirmation-popup-online">
                <img src="/Images/question.png" alt="warning icon" className="successful-icon-popup" />
                <p>Are you sure you want to submit?</p>
                <div className="yesno-container-add">
                    <button onClick={() => setShowSubmitPopup(false)} className="no-button-add">No</button>
                    <button onClick={confirmSubmit} className="yes-button-add">Yes</button> 
                </div>
                </div>
            </div>
            )}

    </main>
  );
}
