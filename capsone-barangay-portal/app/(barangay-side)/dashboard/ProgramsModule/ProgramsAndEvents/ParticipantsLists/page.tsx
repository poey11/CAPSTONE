"use client";
import "@/CSS/ProgramsBrgy/EditPrograms.css";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Firestore
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
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

  // Program meta (capacity)
  const [programCapacity, setProgramCapacity] = useState<number | null>(null);
  const [programTitle, setProgramTitle] = useState<string>("");

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

  useEffect(() => {
    let cancelled = false;

    const loadProgram = async () => {
      if (!programId) {
        setProgramCapacity(null);
        setProgramTitle("");
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
        } else if (!cancelled) {
          setProgramCapacity(null);
          setProgramTitle("");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setProgramCapacity(null);
          setProgramTitle("");
        }
      }
    };

    loadProgram();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  // ===== Live participants query (filtered by programId if provided) =====
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "ProgramsParticipants");

    // Build query
    const q = programId
      ? query(colRef, where("programId", "==", programId), orderBy("fullName", "asc"))
      : query(colRef, orderBy("programName", "asc"));

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

        {/*
          NOTE:
          1. Buttons for punong barangay only if a new button was suggested.
          2. Hide mo nalang je if need mo na

          <button className="program-redirection-buttons" onClick={handleRejectClick}>
            <div className="program-redirection-icons-section" >
              <img src="/images/rejected.png" alt="user info" className="program-redirection-icons-info" />
            </div>
            <h1>Reject Request</h1>
          </button>

          <button className="program-redirection-buttons">
            <div className="program-redirection-icons-section">
              <img src="/images/generatedoc.png" alt="user info" className="program-redirection-icons-info" />
            </div>
            <h1>Approve Request</h1>
          </button>
        */}
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

          <img src="/Images/addicon.png" alt="Add Icon" className="add-icon" />
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
  <col style={{ width: "25%" }} /><col style={{ width: "25%" }} /><col style={{ width: "25%" }} /><col style={{ width: "25%" }} />
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
    </main>
  );
}
