"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Firestore
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  getCountFromServer, // ✅ for capacity re-check
} from "firebase/firestore";
import { db } from "@/app/db/firebase";

type Participant = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  emailAddress?: string;
  email?: string;
  location?: string;
  address?: string;
  programId?: string;
  programName?: string;
  residentId?: string;
};

type Resident = {
  id: string;
  residentNumber?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  location?: string;
  contactNumber?: string;
  mobile?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: string;
  age?: number;
  identificationFileURL?: string;
};

export default function EditResident() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") || ""; // optional filter

  // UI state you already had (left intact)
  const [activeSection, setActiveSection] = useState("details");
  const [showDiscardPopup, setShowDiscardPopup] = useState(false);
  const [position, setPosition] = useState("");
  const [identificationFile, setIdentificationFile] = useState<File | null>(null);
  const [identificationPreview, setIdentificationPreview] = useState<string | null>(null);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showSubmitRejectPopup, setShowSubmitRejectPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Local state for participants + search
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchName, setSearchName] = useState("");

  // Program meta (capacity + title + status)
  const [programCapacity, setProgramCapacity] = useState<number | null>(null);
  const [programTitle, setProgramTitle] = useState<string>("");
  const [programStatus, setProgramStatus] = useState<string>(""); // ✅ Rejected/Completed guard

  // Residents popup state
  const [showResidentsPopup, setShowResidentsPopup] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [resSearch, setResSearch] = useState("");
  const residentPopUpRef = useRef<HTMLDivElement>(null);

  // Toasts
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMsg, setSuccessToastMsg] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMsg, setErrorToastMsg] = useState("");

  const handleBack = () => {
    window.location.href = "/dashboard/ProgramsModule/ProgramsAndEvents";
  };

  const handleDiscardClick = async () => setShowDiscardPopup(true);
  const handleRejectClick = () => setShowRejectPopup(true);

  const handleIdentificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdentificationFile(file);
      setIdentificationPreview(URL.createObjectURL(file));
    }
  };

  // If you later pass programId here, keep it; else this goes to the generic participants hub
  const handleParticipantsClick = () => {
    if (programId) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists?programId=${programId}`);
    } else {
      router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ParticipantsLists");
    }
  };

  const handleEditClick = () => {
    if (programId) {
      router.push(`/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails?id=${programId}`);
    } else {
      router.push("/dashboard/ProgramsModule/ProgramsAndEvents/ProgramDetails");
    }
  };

  //  Program meta 
  useEffect(() => {
    let cancelled = false;

    const loadProgram = async () => {
      if (!programId) {
        setProgramCapacity(null);
        setProgramTitle("");
        setProgramStatus("");
        return;
      }
      try {
        const ref = doc(db, "Programs", programId);
        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) {
          const d = snap.data() as any;
          // In your AddNewProgramModal you saved capacity as "participants"
          const cap = Number(d?.participants);
          setProgramCapacity(Number.isFinite(cap) ? cap : null);
          setProgramTitle(d?.programName || "");
          setProgramStatus((d?.progressStatus || "").toString()); // ✅ keep status
        } else if (!cancelled) {
          setProgramCapacity(null);
          setProgramTitle("");
          setProgramStatus("");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setProgramCapacity(null);
          setProgramTitle("");
          setProgramStatus("");
        }
      }
    };

    loadProgram();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  //  Live participants query (filtered by programId if provided) 
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "ProgramsParticipants");

    // Build query
    const q = programId
      ? query(
          colRef,
          where("programId", "==", programId),
          where("approvalStatus", "==", "Approved"),
          orderBy("fullName", "asc")
        )
      : query(
          colRef,
          where("approvalStatus", "==", "Approved"), 
          orderBy("programName", "asc")
        );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Participant[] = [];
        snap.forEach((docu) => {
          const d = docu.data() as any;
          rows.push({
            id: docu.id,
            fullName: d.fullName ?? "",
            firstName: d.firstName ?? "",
            lastName: d.lastName ?? "",
            contactNumber: d.contactNumber ?? "",
            emailAddress: d.emailAddress ?? d.email ?? "",
            email: d.email ?? d.emailAddress ?? "",
            location: d.location ?? d.address ?? "",
            address: d.address ?? d.location ?? "",
            programId: d.programId ?? "",
            programName: d.programName ?? "",
            residentId: d.residentId ?? "",
          });
        });
        setParticipants(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
        setPopupMessage("Failed to load participants.");
        setShowPopup(true);
      }
    );

    return () => unsub();
  }, [programId]);

  const filteredParticipants = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => {
      const name = (p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim()).toLowerCase();
      return name.includes(q);
    });
  }, [searchName, participants]);

  // Derive badge text e.g., "20 / 50" or "6 / —"
  const badgeText = useMemo(() => {
    const count = participants.length;
    const cap = programCapacity;
    return `${count} / ${cap ?? "—"}`;
  }, [participants.length, programCapacity]);

  // Quick helpers for status/capacity guards
  const isProgramClosed = useMemo(
    () => ["rejected", "completed"].includes((programStatus || "").toLowerCase()),
    [programStatus]
  );
  const isAtCapacity = useMemo(
    () => programCapacity !== null && participants.length >= programCapacity,
    [programCapacity, participants.length]
  );

  //  NEW: Open Add popup 
  const openAddPopup = async () => {
    if (!programId) {
      setErrorToastMsg("To add a walk-in participant, open this page from a specific Program.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }

    // Status/capacity guards (client-side)
    if (isProgramClosed) {
      setErrorToastMsg(`This program is ${programStatus}. You can’t add participants.`);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }
    if (isAtCapacity) {
      setErrorToastMsg("Program capacity reached. Cannot add more participants.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
      return;
    }

    // Lazy-load residents the first time we open the popup
    if (residents.length === 0) {
      try {
        const snap = await getDocs(collection(db, "Residents"));
        const list: Resident[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setResidents(list);
      } catch (e) {
        console.error(e);
        setErrorToastMsg("Failed to load Residents.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }
    }
    setShowResidentsPopup(true);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (residentPopUpRef.current && !residentPopUpRef.current.contains(event.target as Node)) {
        setShowResidentsPopup(false);
      }
    };
    if (showResidentsPopup) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showResidentsPopup]);

  const filteredResidents = useMemo(() => {
    const q = resSearch.trim().toLowerCase();
    const arr = !q
      ? residents
      : residents.filter((r) =>
          (`${r.firstName || ""} ${r.middleName || ""} ${r.lastName || ""}`.replace(/\s+/g, " ").trim()).toLowerCase().includes(q)
        );
    return [...arr].sort((a, b) => (Number(a.residentNumber || 0) - Number(b.residentNumber || 0)));
  }, [residents, resSearch]);

  // Add selected resident as participant (with all guards re-checked) 
  const addResidentAsParticipant = async (resident: Resident) => {
    try {
      // 1) Re-check program status server-side
      const progRef = doc(db, "Programs", programId);
      const progSnap = await getDoc(progRef);
      if (!progSnap.exists()) {
        setErrorToastMsg("Program not found.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }
      const prog = progSnap.data() as any;
      const statusNow = (prog?.progressStatus || "").toString().toLowerCase();
      if (["rejected", "completed"].includes(statusNow)) {
        setErrorToastMsg(`This program is ${prog?.progressStatus}. You can’t add participants.`);
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }

      // 2) Duplicate check (same resident in same program)
      const dupQ = query(
        collection(db, "ProgramsParticipants"),
        where("programId", "==", programId),
        where("residentId", "==", resident.id)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        setErrorToastMsg("This resident is already enlisted in this program.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }

      // 3) Capacity re-check using count from server (avoids race)
      const partQ = query(collection(db, "ProgramsParticipants"), where("programId", "==", programId));
      const countSnap = await getCountFromServer(partQ);
      const currentCount = countSnap.data().count || 0;
      const capacity = Number(prog?.participants); // your field for capacity
      if (Number.isFinite(capacity) && currentCount >= capacity) {
        setErrorToastMsg("Program capacity reached. Cannot add more participants.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
        return;
      }

      // 4) Prepare fields
      const fullName = `${resident.firstName || ""} ${resident.middleName ? resident.middleName + " " : ""}${resident.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim();

      // 5) Write
      await addDoc(collection(db, "ProgramsParticipants"), {
        // basics from resident
        residentId: resident.id,
        fullName,
        firstName: resident.firstName || "",
        lastName: resident.lastName || "",
        contactNumber: resident.contactNumber || resident.mobile || "",
        emailAddress: resident.email || "",
        location: resident.address || resident.location || "",
        address: resident.address || resident.location || "",

        // program linkage
        programId,
        programName: prog?.programName || programTitle || "",

        // meta
        addedVia: "walk-in",
        approvalStatus: "Approved",
        createdAt: serverTimestamp(),
      });

      setShowResidentsPopup(false);
      setSuccessToastMsg("Participant added successfully!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2500);
    } catch (e) {
      console.error(e);
      setErrorToastMsg("Failed to add participant. Please try again.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
  };

  return (
    <main className="edit-program-main-container">
      <div className="program-redirectionpage-section">
        {/* MAIN REDIRECTION BUTTONS. */}
        <button className="program-redirection-buttons" onClick={handleEditClick}>
          <div className="program-redirection-icons-section">
            <img
              src="/images/profile-user.png"
              alt="user info"
              className="program-redirection-icons-info"
            />
          </div>
          <h1>Program Details</h1>
        </button>

        <button className="program-redirection-buttons-selected" onClick={handleParticipantsClick}>
          <div className="program-redirection-icons-section">
            <img src="/images/team.png" alt="user info" className="program-redirection-icons-info" />
          </div>
          <h1>Participants</h1>
        </button>
      </div>

      <div className="edit-program-main-content-participants">
        <div className="edit-program-main-section1">
          <div className="edit-program-main-section1-left">
            <button onClick={handleBack}>
              <img src="/images/left-arrow.png" alt="Left Arrow" className="back-btn" />
            </button>

            <h1>
              Participants Lists
              {programTitle ? ` — ${programTitle}` : ""}
            </h1>
          </div>

          <div className="action-btn-section-program">
            <div className="participants-count">
              {badgeText}
            </div>
          </div>
        </div>

        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="programs-module-filter-participants"
          />

          {/* Add button (opens Residents popup) */}
          <button
            type="button"
            title={
              isProgramClosed
                ? `This program is ${programStatus}`
                : isAtCapacity
                ? "Program capacity reached"
                : "Add participant"
            }
            onClick={openAddPopup}
            disabled={isProgramClosed || isAtCapacity}
            style={{
              background: "transparent",
              border: "none",
              cursor: isProgramClosed || isAtCapacity ? "not-allowed" : "pointer",
              opacity: isProgramClosed || isAtCapacity ? 0.5 : 1,
            }}
          >
            <img src="/Images/addicon.png" alt="Add Icon" className="add-icon" />
          </button>
        </div>

        <div className="edit-program-bottom-section-participants">
          <div className="participants-container">
            {loading ? (
              <div style={{ padding: 16, opacity: 0.8 }}>Loading participants…</div>
            ) : filteredParticipants.length === 0 ? (
              <div style={{ padding: 16, opacity: 0.8 }}>No participants found.</div>
            ) : (
              <table className="participants-table fixed-columns">
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Contact Number</th>
                    <th>Email Address</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p) => {
                    const name = p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim();
                    return (
                      <tr key={p.id}>
                        <td className="td-truncate">{name}</td>
                        <td className="td-truncate">{p.contactNumber || ""}</td>
                        <td className="td-truncate">{p.emailAddress || p.email || ""}</td>
                        <td className="td-truncate">{p.location || p.address || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="add-programs-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="add-programs-confirmation-popup" style={{ maxWidth: 420 }}>
            <h3>Notice</h3>
            <p style={{ marginTop: 8 }}>{popupMessage}</p>
            <div className="programs-yesno-container" style={{ marginTop: 16 }}>
              <button className="program-yes-button" onClick={() => setShowPopup(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Residents Picker Popup */}
      {showResidentsPopup && (
        <div className="program-popup-overlay">
          <div className="program-popup" ref={residentPopUpRef}>
            <h2>Residents List</h2>
            <h1>* Please select Resident's Name *</h1>

            <input
              type="text"
              placeholder="Search Resident's Name"
              className="program-search-input"
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
            />

            <div className="program-list">
              {residents.length === 0 ? (
                <p style={{ padding: 12 }}>No residents found.</p>
              ) : (
                <table className="program-table">
                  <thead>
                    <tr>
                      <th>Resident Number</th>
                      <th>First Name</th>
                      <th>Middle Name</th>
                      <th>Last Name</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((resident) => (
                      <tr
                        key={resident.id}
                        className="program-table-row"
                        style={{ cursor: "pointer" }}
                        onClick={() => addResidentAsParticipant(resident)}
                      >
                        <td>{resident.residentNumber ?? ""}</td>
                        <td>{resident.firstName ?? ""}</td>
                        <td>{resident.middleName ?? ""}</td>
                        <td>{resident.lastName ?? ""}</td>
                        <td>{resident.address ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {showSuccessToast && (
        <div className="popup-overlay-add-program show">
          <div className="popup-add-program">
            <img src="/Images/check.png" alt="icon alert" className="icon-alert" />
            <p>{successToastMsg}</p>
          </div>
        </div>
      )}
      {showErrorToast && (
        <div className="error-popup-overlay-add-program show">
          <div className="popup-add-program">
            <img src="/Images/warning-1.png" alt="popup icon" className="icon-alert" />
            <p>{errorToastMsg}</p>
          </div>
        </div>
      )}
    </main>
  );
}
